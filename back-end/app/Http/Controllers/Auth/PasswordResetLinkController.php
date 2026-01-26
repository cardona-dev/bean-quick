<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;

/**
 * Este controlador se encarga de recibir el correo del usuario 
 * y enviarle las instrucciones para recuperar su cuenta.
 */
class PasswordResetLinkController extends Controller
{
    /**
     * FUNCIÓN STORE (Enviar enlace):
     * Es la acción que ocurre cuando presionas el botón "Enviar enlace de recuperación".
     */
    public function store(Request $request): JsonResponse
    {
        // 1. EL REQUISITO:
        // Primero revisamos que el usuario haya escrito un correo electrónico real.
        // Si el campo está vacío o no tiene formato de email, nos detenemos aquí.
        $request->validate([
            'email' => ['required', 'email'],
        ]);

        // 2. EL INTENTO DE ENVÍO:
        // Le pedimos al "Broker de Contraseñas" de Laravel que busque ese correo.
        // Si lo encuentra, generará un código secreto único y enviará un correo automático
        // con un botón para que el usuario pueda cambiar su clave.
        $status = Password::sendResetLink(
            $request->only('email')
        );

        // 3. REPORTE DE ÉXITO:
        // Si el sistema responde que el link se envió (RESET_LINK_SENT), 
        // le enviamos a la aplicación de React un mensaje positivo.
        // Esto hará que en la pantalla del usuario aparezca un aviso: 
        // "¡Revisa tu correo, te enviamos los pasos!".
        if ($status == Password::RESET_LINK_SENT) {
            return response()->json([
                'status' => 'success',
                'message' => __($status) 
            ], 200);
        }

        // 4. MANEJO DE ERRORES:
        // Si el correo no existe en nuestra base de datos, o si intentaron pedir
        // el link demasiadas veces seguidas, el sistema devolverá un error.
        // Enviamos el código 422 para decirle a React: "Algo no cuadra con ese correo".
        return response()->json([
            'status' => 'error',
            'message' => __($status),
            'errors' => [
                'email' => [__($status)]
            ]
        ], 422);
    }
}