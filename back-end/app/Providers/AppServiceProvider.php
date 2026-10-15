<?php

namespace App\Providers;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use App\Models\User;
use App\Models\User;
use App\Payments\MercadoPagoPaymentLookup;
use App\Payments\PaymentLookup;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(PaymentLookup::class, MercadoPagoPaymentLookup::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Aquí defines qué significa tener "admin-access"
    Gate::define('admin-access', function (User $user) {
        // Retorna true solo si el rol es exactamente 'admin'
        return $user->rol === 'admin';
    });

    // Usamos config() porque en producción con caché env() devuelve null y este bloque se ignora.
    if (config('app.env') === 'production') {
        URL::forceScheme('https');
        URL::forceRootUrl(config('app.url'));
    }

    }
}
