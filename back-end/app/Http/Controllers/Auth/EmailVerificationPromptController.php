<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

/**
 * Este controlador se activa automáticamente cuando un usuario intenta 
 * acceder a una parte del sistema que requiere que su email sea real.
 */
class EmailVerificationPromptController extends Controller
{
    /**
     * FUNCIÓN __INVOKE (La consulta del inspector):
     * Esta función es especial, se ejecuta apenas alguien toca la puerta de esta ruta.
     */
    public function __invoke(Request $request): JsonResponse
    {
        // 1. EL CHEQUEO DE "ESTADO":
        // Revisamos si el usuario que está intentando pasar ya hizo clic en 
        // el enlace de confirmación que le enviamos antes.
        if ($request->user()->hasVerifiedEmail()) {
            
            // Si el sistema dice: "Sí, ya está verificado", le respondemos a React:
            // "¡Todo en orden! Déjalo pasar directamente al Dashboard".
            return response()->json([
                'verified' => true,
                'redirectTo' => '/dashboard'
            ]);
        }

        // 2. EL ALTO (Acceso denegado temporalmente):
        // Si el usuario NO ha verificado su correo, le mandamos una respuesta de "Prohibido".
        // El número 403 es un código estándar en internet para decir: 
        // "Sé quién eres, pero no tienes permiso para entrar aquí todavía".
        return response()->json([
            'verified' => false,
            'message' => 'Tu dirección de correo electrónico no está verificada.'
        ], 403); 
        
        // Al recibir este 403, tu aplicación en React sabrá que debe mostrar 
        // la pantalla con el mensaje: "Por favor, revisa tu correo para continuar".
    }
}