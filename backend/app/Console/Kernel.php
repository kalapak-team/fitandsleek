<?php

namespace App\Console;

use App\Console\Commands\IndexProductsToQdrant;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        // Run nightly to index only products not yet vectorized; add --all to force full reindex.
        $schedule->command('products:index-qdrant --chunk=100')
            ->dailyAt('00:00')
            ->withoutOverlapping();
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__ . '/Commands');
    }
}
