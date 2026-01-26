<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

/**
 * Este controlador se encarga de una sola cosa: volver a enviar el correo 
 * de verificación si el usuario dice que no le ha llegado.
 */
class EmailVerificationNotificationController extends Controller
{
    /**
     * FUNCIÓN STORE (Enviar Notificación):
     * Es el botón de "Reenviar correo de verificación" que ves en las páginas web.
     */
    public function store(Request $request): JsonResponse
    {
        // 1. EL CHEQUEO PREVIO:
        // Antes de enviar nada, revisamos si el usuario ya tiene su correo verificado.
        // Es como si alguien pide una llave nueva pero ya tiene la puerta abierta.
        if ($request->user()->hasVerifiedEmail()) {
            // Si ya está verificado, le decimos a la aplicación de React:
            // "Oye, no hace falta enviar nada, este usuario ya es legal".
            return response()->json([
                'message' => 'Tu cuenta ya ha sido verificada.',
                'status' => 'already-verified',
                'redirectTo' => '/dashboard' // Le sugerimos a dónde ir ahora.
            ]);
        }

        // 2. EL ENVÍO DEL MENSAJE:
        // Si no estaba verificado, le pedimos al sistema de Laravel que prepare
        // un correo electrónico con un enlace especial y lo envíe a la dirección del usuario.
        $request->user()->sendEmailVerificationNotification();

        // 3. EL AVISO DE "LISTO":
        // Finalmente, le respondemos a la página de React con un mensaje de éxito.
        // Esto sirve para que en la pantalla aparezca un letrero verde que diga:
        // "¡Revisa tu bandeja de entrada!".
        return response()->json([
            'status' => 'verification-link-sent',
            'message' => 'Se ha enviado un nuevo enlace de verificación a tu correo.'
        ]);
    }
}