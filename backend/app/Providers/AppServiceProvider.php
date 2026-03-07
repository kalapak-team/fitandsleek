<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\URL; // បន្ថែមនេះ
use App\Models\User;
use App\Models\Order;
use App\Models\Shipment;
use App\Observers\OrderObserver;
use App\Observers\ShipmentObserver;
use Illuminate\Auth\Notifications\ResetPassword;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // ១. បង្ខំឱ្យប្រើ HTTPS នៅលើ Production (Render) ដើម្បីបាត់ Error Mixed Content
        if (config('app.env') === 'production') {
            URL::forceScheme('https');
        }

        // ២. Route model binding for customer parameter
        Route::model('customer', User::class);

        // ៣. កំណត់ Reset Password URL
        ResetPassword::createUrlUsing(function (User $user, string $token): string {
            $frontendUrl = rtrim(config('app.frontend_url'), '/');
            return $frontendUrl.'/reset-password?token='.$token.'&email='.urlencode($user->email);
        });

        // ៤. Model Observers
        Order::observe(OrderObserver::class);
        Shipment::observe(ShipmentObserver::class);
    }
}
