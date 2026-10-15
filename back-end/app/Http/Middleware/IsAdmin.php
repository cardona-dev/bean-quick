<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class IsAdmin
{
    public function handle(Request $request, Closure $next)
    {
        if (Auth::check() && Auth::user()->rol === 'admin') {
            return $next($request);
        }

        Log::warning('Acceso denegado: se requiere rol admin', [
            'user_id' => Auth::id(),
            'path' => $request->path(),
        ]);

        return response()->json([
            'message' => 'Acceso denegado. Se requieren permisos de administrador.'
        ], 403);
    }
}