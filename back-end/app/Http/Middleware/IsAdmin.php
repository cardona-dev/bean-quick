<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class IsAdmin
{
    public function handle(Request $request, Closure $next)
    {
        // Usamos el Facade Auth directamente
        if (Auth::check() && Auth::user()->rol === 'admin') {
            return $next($request);
        }

        return response()->json([
            'message' => 'Acceso denegado. Se requieren permisos de administrador.'
        ], 403);
    }
}