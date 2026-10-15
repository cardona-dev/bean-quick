<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class IsCliente
{
    public function handle(Request $request, Closure $next)
    {
        if (Auth::check() && Auth::user()->rol === 'cliente') {
            return $next($request);
        }

        Log::warning('Acceso denegado: se requiere rol cliente', [
            'user_id' => Auth::id(),
            'path' => $request->path(),
        ]);

        return response()->json([
            'message' => 'Acceso denegado. Se requiere una cuenta de cliente.',
        ], 403);
    }
}
