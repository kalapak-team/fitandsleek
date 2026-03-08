<?php

namespace App\Console\Commands;

use App\Models\Product;
use App\Services\ImageSearchService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Illuminate\Http\UploadedFile;
use Throwable;

class IndexProductsToQdrant extends Command
{
    protected $signature = 'products:index-qdrant {--chunk=100 : Number of products to process per chunk} {--all : Index all products, including already indexed ones}';
    protected $description = 'Send product image embeddings to Qdrant in batches';

    public function handle(ImageSearchService $service): int
    {
        $chunkSize = (int) $this->option('chunk');
        $query = Product::query()
            ->where('is_active', true)
            ->where(function ($q) {
                $q->where(function ($qq) {
                    $qq->whereNotNull('image_url')
                        ->whereRaw("COALESCE(image_url, '') <> ''");
                })
                    ->orWhere(function ($qq) {
                        $qq->whereNotNull('main_image')
                            ->whereRaw("COALESCE(main_image, '') <> ''");
                    })
                    ->orWhere(function ($qq) {
                        $qq->whereNotNull('gallery');
                    });
            });

        if (!$this->option('all')) {
            $query->where(function ($q) {
                $q->whereNull('is_vector_indexed')
                    ->orWhere('is_vector_indexed', false)
                    ->orWhereNull('vector_indexed_at');
            });
        }

        $total = $query->count();
        if ($total === 0) {
            $this->info('No products found with image_url.');
            return self::SUCCESS;
        }

        $this->info("Indexing {$total} products to Qdrant (chunk={$chunkSize})...");
        $bar = $this->output->createProgressBar($total);
        $bar->start();

        $success = 0;
        $failed = 0;

        $query->chunk($chunkSize, function ($products) use ($service, $bar, &$success, &$failed) {
            foreach ($products as $product) {
                try {
                    $file = $this->retry(3, 2, function () use ($product) {
                        return $this->resolveImageFile($product);
                    });

                    if (!$file) {
                        throw new \RuntimeException('Failed to obtain image after retries');
                    }

                    $this->retry(3, 2, function () use ($service, $product, $file) {
                        $service->indexProductImage($product->id, $file, [
                            'product_id' => $product->id,
                            'name' => $product->name,
                            'slug' => $product->slug,
                            'price' => (float) $product->price,
                        ]);
                    });

                    $product->forceFill([
                        'is_vector_indexed' => true,
                        'vector_indexed_at' => now(),
                        'vector_index_error' => null,
                    ])->save();

                    $success++;
                } catch (Throwable $e) {
                    $failed++;
                    $product->forceFill([
                        'is_vector_indexed' => false,
                        'vector_index_error' => $e->getMessage(),
                    ])->save();
                    $this->warn("\nProduct {$product->id} failed: {$e->getMessage()}");
                } finally {
                    $bar->advance();
                }
            }
        });

        $bar->finish();
        $this->newLine(2);
        $this->info("Done. Success: {$success}, Failed: {$failed}");

        return self::SUCCESS;
    }

    private function resolveImageFile(Product $product): ?UploadedFile
    {
        $path = $product->image_url ?: $product->main_image;

        // Fallback: first gallery entry if available
        if (!$path && is_array($product->gallery) && count($product->gallery) > 0) {
            $path = $product->gallery[0] ?? null;
        }

        if (!$path) {
            return null;
        }

        // Base64 data URI
        if (Str::startsWith($path, 'data:image')) {
            return $this->decodeBase64Image($path);
        }

        // Remote URL
        if (Str::startsWith($path, ['http://', 'https://'])) {
            return $this->downloadAsUploadedFile($path);
        }

        // Relative path: try storage then public
        $clean = ltrim($path, '/');

        $storagePath = storage_path('app/public/' . $clean);
        if (file_exists($storagePath)) {
            return new UploadedFile($storagePath, basename($clean), null, null, true);
        }

        $publicPath = public_path($clean);
        if (file_exists($publicPath)) {
            return new UploadedFile($publicPath, basename($clean), null, null, true);
        }

        // Last resort: try via HTTP using APP_URL
        $base = rtrim(config('app.url'), '/');
        if ($base) {
            $url = $base . '/' . $clean;
            return $this->downloadAsUploadedFile($url);
        }

        return null;
    }

    private function downloadAsUploadedFile(string $url): ?UploadedFile
    {
        $response = Http::timeout(30)->get($url);
        if (!$response->successful()) {
            return null;
        }

        $tmp = tempnam(sys_get_temp_dir(), 'img_');
        file_put_contents($tmp, $response->body());

        $filename = basename(parse_url($url, PHP_URL_PATH)) ?: 'image.jpg';
        $mime = $response->header('Content-Type', 'image/jpeg');

        return new UploadedFile($tmp, $filename, $mime, null, true);
    }

    private function decodeBase64Image(string $dataUri): ?UploadedFile
    {
        // Expected format: data:image/<type>;base64,<payload>
        if (!str_contains($dataUri, ',')) {
            return null;
        }

        [$meta, $encoded] = explode(',', $dataUri, 2);

        $mime = 'image/jpeg';
        if (preg_match('#data:(image/[^;]+)#i', $meta, $m)) {
            $mime = strtolower($m[1]);
        }

        $ext = match ($mime) {
            'image/png' => 'png',
            'image/webp' => 'webp',
            'image/gif' => 'gif',
            default => 'jpg',
        };

        $binary = base64_decode($encoded, true);
        if ($binary === false) {
            return null;
        }

        $tmp = tempnam(sys_get_temp_dir(), 'img_');
        file_put_contents($tmp, $binary);

        $filename = 'image.' . $ext;

        return new UploadedFile($tmp, $filename, $mime, null, true);
    }

    private function retry(int $times, int $delaySeconds, callable $callback)
    {
        $attempts = 0;
        beginning:
        try {
            $attempts++;
            return $callback();
        } catch (Throwable $e) {
            if ($attempts >= $times) {
                throw $e;
            }
            sleep($delaySeconds);
            goto beginning;
        }
    }
}
