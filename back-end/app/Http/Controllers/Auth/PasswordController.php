<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Http\JsonResponse;

/**
 * Este controlador permite que un usuario conectado cambie su 
 * contraseña actual por una nueva.
 */
class PasswordController extends Controller
{
    /**
     * FUNCIÓN UPDATE (Actualizar):
     * Es el formulario de "Cambiar contraseña" que encuentras en tu perfil.
     */
    public function update(Request $request): JsonResponse
    {
        // 1. EL TRIPLE CHEQUEO:
        // Para que el cambio sea válido, el sistema exige tres cosas:
        // - 'current_password': Debe escribir su clave actual (para probar que es el dueño).
        // - 'password': La nueva clave (debe cumplir con las reglas de seguridad del sistema).
        // - 'confirmed': Debe escribir la nueva clave dos veces para evitar errores de dedo.
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', Password::defaults(), 'confirmed'],
        ]);

        // 2. EL CAMBIO DE CERRADURA:
        // Si el sistema confirmó que la clave "vieja" es correcta, procedemos a guardar la nueva.
        // 'Hash::make' transforma la palabra clara (ej: "Hola123") en un código secreto 
        // ilegible para los humanos antes de guardarlo en la base de datos.
        $request->user()->update([
            'password' => Hash::make($validated['password']),
        ]);

        // 3. REPORTE DE ÉXITO:
        // Le enviamos un mensaje a la aplicación de React para que el usuario vea 
        // un aviso de "Cambio exitoso" y se sienta seguro.
        return response()->json([
            'message' => 'Contraseña actualizada correctamente.',
            'status' => 'password-updated'
        ], 200);
    }
}