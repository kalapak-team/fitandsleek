<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;

class QdrantSetupCommand extends Command
{
    protected $signature = 'qdrant:setup';

    protected $description = 'Initialize Qdrant products collection (size: 512, distance: Cosine)';

    public function handle(): int
    {
        $qdrantUrl = rtrim((string) config('services.image_search.qdrant_url', 'http://localhost:6333'), '/');
        $collection = (string) config('services.image_search.qdrant_collection', 'products');

        $this->info("Checking Qdrant collection '{$collection}' at {$qdrantUrl}...");

        try {
            $checkResponse = Http::timeout(20)->get("{$qdrantUrl}/collections/{$collection}");
        } catch (ConnectionException $e) {
            $this->error('Unable to connect to Qdrant: '.$e->getMessage());
            return self::FAILURE;
        }

        if ($checkResponse->successful()) {
            $this->info("Collection '{$collection}' already exists. Nothing to do.");
            return self::SUCCESS;
        }

        if ($checkResponse->status() !== 404) {
            $this->error('Failed to verify collection: '.$checkResponse->status().' '.$checkResponse->body());
            return self::FAILURE;
        }

        $this->warn("Collection '{$collection}' not found. Creating...");

        try {
            $createResponse = Http::timeout(20)->put("{$qdrantUrl}/collections/{$collection}", [
                'vectors' => [
                    'size' => 512,
                    'distance' => 'Cosine',
                ],
            ]);
        } catch (ConnectionException $e) {
            $this->error('Unable to create collection: '.$e->getMessage());
            return self::FAILURE;
        }

        if ($createResponse->failed()) {
            $this->error('Create collection failed: '.$createResponse->status().' '.$createResponse->body());
            return self::FAILURE;
        }

        $this->info("Collection '{$collection}' created successfully (size: 512, distance: Cosine).");

        return self::SUCCESS;
    }
}
