<?php

namespace App\Providers;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use App\Models\User;
use Illuminate\Support\Facades\URL;

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
        // Aquí defines qué significa tener "admin-access"
    Gate::define('admin-access', function (User $user) {
        // Retorna true solo si el rol es exactamente 'admin'
        return $user->rol === 'admin';
    });

    URL::forceScheme('https');

    }
}
