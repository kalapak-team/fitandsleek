<?php

namespace App\Observers;

use App\Jobs\IndexProductToQdrant;
use App\Jobs\RemoveProductFromQdrant;
use App\Models\Product;

class ProductObserver
{
    public function created(Product $product): void
    {
        IndexProductToQdrant::dispatch($product->id);
    }

    public function updated(Product $product): void
    {
        if ($product->wasChanged(['name', 'image_url', 'main_image', 'gallery', 'price', 'is_active'])) {
            IndexProductToQdrant::dispatch($product->id);
        }
    }

    public function deleted(Product $product): void
    {
        RemoveProductFromQdrant::dispatch($product->id);
    }

    public function restored(Product $product): void
    {
        IndexProductToQdrant::dispatch($product->id);
    }
}
