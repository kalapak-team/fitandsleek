<?php

namespace App\Jobs;

use App\Services\ImageSearchService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Throwable;

class RemoveProductFromQdrant implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 2;

    public function __construct(public int $productId)
    {
    }

    public function handle(ImageSearchService $service): void
    {
        try {
            $service->deleteProduct($this->productId);
        } catch (Throwable $e) {
            // Let the job fail/retry; no DB updates needed on delete path
            throw $e;
        }
    }
}
