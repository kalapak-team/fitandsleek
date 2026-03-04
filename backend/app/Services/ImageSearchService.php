<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class ImageSearchService
{
    private string $vectorizeUrl;
    private string $qdrantUrl;
    private string $collection;
    private int $timeout;

    public function __construct()
    {
        $this->vectorizeUrl = rtrim((string) config('services.image_search.vectorize_url', 'http://localhost:9000/vectorize'), '/');
        $this->qdrantUrl = rtrim((string) config('services.image_search.qdrant_url', 'http://localhost:6333'), '/');
        $this->collection = (string) config('services.image_search.qdrant_collection', 'products');
        $this->timeout = max(30, (int) config('services.image_search.timeout', 30));

        // Keep PHP alive while the vectorizer model loads on cold start.
        $bufferSeconds = 15; // small cushion for response handling
        $desiredLimit = $this->timeout + $bufferSeconds;
        $currentLimit = (int) ini_get('max_execution_time');

        // Some hosts ignore set_time_limit; also set ini_max_execution_time for redundancy.
        if ($currentLimit !== 0 && $currentLimit < $desiredLimit) {
            @ini_set('max_execution_time', (string) $desiredLimit);
            if (function_exists('set_time_limit')) {
                @set_time_limit($desiredLimit);
            }
        }

        // Extend socket timeout so curl won't abort earlier than our HTTP timeout.
        $socketTimeout = (int) ini_get('default_socket_timeout');
        if ($socketTimeout !== 0 && $socketTimeout < $this->timeout) {
            @ini_set('default_socket_timeout', (string) $this->timeout);
        }
    }

    public function vectorizeImage(UploadedFile $image): array
    {
        try {
            $response = Http::timeout($this->timeout)
                ->attach(
                    'image',
                    file_get_contents($image->getRealPath()),
                    $image->getClientOriginalName() ?: 'image.jpg'
                )
                ->post($this->vectorizeUrl);
        } catch (ConnectionException $e) {
            throw new RuntimeException('Vectorize service is unreachable: ' . $e->getMessage());
        }

        if ($response->failed()) {
            throw new RuntimeException('Vectorize service error: ' . $response->status() . ' ' . $response->body());
        }

        $vector = $response->json('vector');

        if (!is_array($vector) || count($vector) !== 512) {
            throw new RuntimeException('Invalid vector returned from vectorize service. Expected 512 dimensions.');
        }

        return array_map(static fn($v) => (float) $v, $vector);
    }

    public function indexProductImage(int $productId, UploadedFile $image, array $metadata = []): void
    {
        $vector = $this->vectorizeImage($image);
        $this->upsertVector($productId, $vector, $metadata);
    }

    public function upsertVector(int $productId, array $vector, array $metadata = []): void
    {
        $this->ensureCollectionExists();

        $safeMetadata = collect($metadata)
            ->filter(static fn($value) => is_scalar($value) || $value === null)
            ->toArray();

        $payload = [
            'points' => [
                [
                    'id' => $productId,
                    'vector' => $vector,
                    'payload' => array_merge($safeMetadata, [
                        'product_id' => $productId,
                    ]),
                ],
            ],
        ];

        try {
            $response = Http::timeout($this->timeout)
                ->put($this->qdrantUrl . '/collections/' . $this->collection . '/points', $payload);
        } catch (ConnectionException $e) {
            throw new RuntimeException('Qdrant is unreachable: ' . $e->getMessage());
        }

        if ($response->failed()) {
            throw new RuntimeException('Qdrant upsert failed: ' . $response->status() . ' ' . $response->body());
        }
    }

    public function searchSimilarProductIds(UploadedFile $image, int $limit = 12): array
    {
        // Make sure the collection exists before searching, otherwise Qdrant returns 404.
        $this->ensureCollectionExists();

        $vector = $this->vectorizeImage($image);

        try {
            $response = Http::timeout($this->timeout)
                ->post($this->qdrantUrl . '/collections/' . $this->collection . '/points/search', [
                    'vector' => $vector,
                    'limit' => $limit,
                    'with_payload' => true,
                    'with_vector' => false,
                ]);
        } catch (ConnectionException $e) {
            throw new RuntimeException('Qdrant search failed: ' . $e->getMessage());
        }

        if ($response->failed()) {
            throw new RuntimeException('Qdrant search failed: ' . $response->status() . ' ' . $response->body());
        }

        $results = $response->json('result', []);

        return collect($results)
            ->map(function ($item) {
                $payloadId = data_get($item, 'payload.product_id');
                if (is_numeric($payloadId)) {
                    return (int) $payloadId;
                }

                $pointId = data_get($item, 'id');
                return is_numeric($pointId) ? (int) $pointId : null;
            })
            ->filter(static fn($id) => $id !== null)
            ->unique()
            ->values()
            ->all();
    }

    private function ensureCollectionExists(): void
    {
        try {
            $check = Http::timeout($this->timeout)
                ->get($this->qdrantUrl . '/collections/' . $this->collection);
        } catch (ConnectionException $e) {
            throw new RuntimeException('Qdrant is unreachable: ' . $e->getMessage());
        }

        if ($check->successful()) {
            return;
        }

        if ($check->status() !== 404) {
            throw new RuntimeException('Failed to verify Qdrant collection: ' . $check->status() . ' ' . $check->body());
        }

        try {
            $create = Http::timeout($this->timeout)
                ->put($this->qdrantUrl . '/collections/' . $this->collection, [
                    'vectors' => [
                        'size' => 512,
                        'distance' => 'Cosine',
                    ],
                ]);
        } catch (ConnectionException $e) {
            throw new RuntimeException('Failed to create Qdrant collection: ' . $e->getMessage());
        }

        if ($create->failed()) {
            throw new RuntimeException('Failed to create Qdrant collection: ' . $create->status() . ' ' . $create->body());
        }
    }
}
