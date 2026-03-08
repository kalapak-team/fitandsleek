<?php

namespace App\Jobs;

use App\Models\Product;
use App\Services\ImageSearchService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Http\UploadedFile;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

class IndexProductToQdrant implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 2;

    public function __construct(public int $productId)
    {
    }

    public function handle(ImageSearchService $service): void
    {
        $product = Product::find($this->productId);
        if (!$product || !$product->is_active) {
            return;
        }

        try {
            $file = $this->retry(3, 2, function () use ($product) {
                return $this->resolveImageFile($product);
            });

            if (!$file) {
                throw new RuntimeException('No usable product image to index');
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
        } catch (Throwable $e) {
            if ($product) {
                $product->forceFill([
                    'is_vector_indexed' => false,
                    'vector_index_error' => $e->getMessage(),
                ])->save();
            }

            throw $e;
        }
    }

    private function resolveImageFile(Product $product): ?UploadedFile
    {
        $path = $product->image_url ?: $product->main_image;

        if (!$path && is_array($product->gallery) && count($product->gallery) > 0) {
            $path = $product->gallery[0] ?? null;
        }

        if (!$path) {
            return null;
        }

        if (Str::startsWith($path, 'data:image')) {
            return $this->decodeBase64Image($path);
        }

        if (Str::startsWith($path, ['http://', 'https://'])) {
            return $this->downloadAsUploadedFile($path);
        }

        $clean = ltrim($path, '/');

        $storagePath = storage_path('app/public/' . $clean);
        if (file_exists($storagePath)) {
            return new UploadedFile($storagePath, basename($clean), null, null, true);
        }

        $publicPath = public_path($clean);
        if (file_exists($publicPath)) {
            return new UploadedFile($publicPath, basename($clean), null, null, true);
        }

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
