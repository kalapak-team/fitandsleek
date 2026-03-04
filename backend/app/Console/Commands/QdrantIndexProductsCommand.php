<?php

namespace App\Console\Commands;

use App\Models\Product;
use App\Services\ImageSearchService;
use Illuminate\Console\Command;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class QdrantIndexProductsCommand extends Command
{
    protected $signature = 'qdrant:index-products {--product_id=} {--limit=0}';

    protected $description = 'Index existing product images into Qdrant products collection';

    public function handle(ImageSearchService $imageSearchService): int
    {
        $query = Product::query()
            ->where('is_active', true)
            ->whereNotNull('image_url')
            ->orderBy('id');

        if ($this->option('product_id')) {
            $query->where('id', (int) $this->option('product_id'));
        }

        $limit = (int) $this->option('limit');
        if ($limit > 0) {
            $query->limit($limit);
        }

        $products = $query->get();

        if ($products->isEmpty()) {
            $this->warn('No products found to index.');
            return self::SUCCESS;
        }

        $this->info('Indexing '.$products->count().' product(s) into Qdrant...');

        $indexed = 0;
        $failed = 0;

        foreach ($products as $product) {
            $tempPath = null;

            try {
                [$uploadedFile, $tempPath] = $this->toUploadedImage($product->image_url);

                $imageSearchService->indexProductImage(
                    $product->id,
                    $uploadedFile,
                    [
                        'name' => $product->name,
                        'slug' => $product->slug,
                        'category_id' => $product->category_id,
                        'brand_id' => $product->brand_id,
                    ]
                );

                $product->forceFill([
                    'is_vector_indexed' => true,
                    'vector_indexed_at' => now(),
                    'vector_index_error' => null,
                ])->save();

                $indexed++;
                $this->line("✔ Indexed product #{$product->id} ({$product->name})");
            } catch (\Throwable $e) {
                $failed++;

                $message = Str::limit($e->getMessage(), 1000, '...');

                $product->forceFill([
                    'is_vector_indexed' => false,
                    'vector_index_error' => $message,
                ])->save();

                $this->error("✘ Failed product #{$product->id}: {$message}");
            } finally {
                if ($tempPath && file_exists($tempPath)) {
                    @unlink($tempPath);
                }
            }
        }

        $this->newLine();
        $this->info("Done. Indexed: {$indexed}, Failed: {$failed}");

        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }

    private function toUploadedImage(string $imageUrl): array
    {
        $content = null;
        $mime = null;
        $filename = 'image.jpg';

        if (str_starts_with($imageUrl, 'data:image/')) {
            [$content, $mime, $filename] = $this->decodeDataUrl($imageUrl);
        } elseif (str_starts_with($imageUrl, 'http://') || str_starts_with($imageUrl, 'https://')) {
            $filename = basename(parse_url($imageUrl, PHP_URL_PATH) ?: 'image.jpg');

            $response = Http::timeout(30)->get($imageUrl);
            if ($response->failed()) {
                throw new \RuntimeException('Cannot download image: '.$imageUrl);
            }

            $content = $response->body();
            $mime = $response->header('Content-Type');
        } else {
            $filename = basename(parse_url($imageUrl, PHP_URL_PATH) ?: 'image.jpg');

            $localPath = $this->resolveLocalPath($imageUrl);
            if (!$localPath || !file_exists($localPath)) {
                throw new \RuntimeException('Image file not found: '.$imageUrl);
            }

            $content = file_get_contents($localPath);
            $mime = mime_content_type($localPath) ?: 'image/jpeg';
            $filename = basename($localPath);
        }

        if ($content === false || $content === null) {
            throw new \RuntimeException('Failed reading image bytes for: '.$imageUrl);
        }

        $ext = pathinfo($filename, PATHINFO_EXTENSION);
        if (!$ext) {
            $ext = $this->extensionFromMime((string) $mime);
            $filename .= '.'.$ext;
        }

        $tempDir = storage_path('app/tmp/qdrant-index');
        if (!is_dir($tempDir)) {
            mkdir($tempDir, 0775, true);
        }

        $tempPath = $tempDir.'/'.uniqid('img_', true).'.'.$ext;
        file_put_contents($tempPath, $content);

        return [
            new UploadedFile($tempPath, $filename, $mime ?: 'image/jpeg', null, true),
            $tempPath,
        ];
    }

    private function resolveLocalPath(string $imageUrl): ?string
    {
        $path = trim($imageUrl);

        if ($path === '') {
            return null;
        }

        if (str_starts_with($path, '/storage/')) {
            return storage_path('app/public/'.ltrim(substr($path, 8), '/'));
        }

        if (str_starts_with($path, 'storage/')) {
            return storage_path('app/public/'.ltrim(substr($path, 8), '/'));
        }

        if (str_starts_with($path, '/')) {
            $publicPath = public_path(ltrim($path, '/'));
            if (file_exists($publicPath)) {
                return $publicPath;
            }
        }

        $diskPath = Storage::disk('public')->path($path);
        if (file_exists($diskPath)) {
            return $diskPath;
        }

        if (file_exists($path)) {
            return $path;
        }

        return null;
    }

    private function extensionFromMime(string $mime): string
    {
        return match (strtolower(trim(explode(';', $mime)[0]))) {
            'image/png' => 'png',
            'image/avif' => 'avif',
            'image/gif' => 'gif',
            'image/jpeg' => 'jpg',
            'image/jpg' => 'jpg',
            'image/webp' => 'webp',
            default => 'jpg',
        };
    }

    private function decodeDataUrl(string $dataUrl): array
    {
        if (!preg_match('/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/s', $dataUrl, $matches)) {
            throw new \RuntimeException('Invalid data URL format for image');
        }

        $mime = strtolower(trim($matches[1]));
        $raw = preg_replace('/\s+/', '', $matches[2]);
        $content = base64_decode($raw, true);

        if ($content === false) {
            throw new \RuntimeException('Invalid base64 image data');
        }

        $ext = $this->extensionFromMime($mime);
        $filename = 'image.'.$ext;

        return [$content, $mime, $filename];
    }
}
