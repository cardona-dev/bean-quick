<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class ProfileController extends Controller
{
    /**
     * Obtener los datos del perfil del usuario autenticado.
     * GET /api/profile
     */
    public function show(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $request->user()
        ]);
    }

    /**
     * Actualizar la información del perfil.
     * PATCH /api/profile
     */
    public function update(ProfileUpdateRequest $request): JsonResponse
    {
        $user = $request->user();
        
        // El método fill() toma los datos ya validados del FormRequest
        $user->fill($request->validated());

        // Si el usuario cambia su correo, marcamos que no está verificado
        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        return response()->json([
            'message' => 'Perfil actualizado correctamente.',
            'user' => $user
        ]);
    }

    /**
     * Eliminar la cuenta del usuario.
     * DELETE /api/profile
     */
    public function destroy(Request $request): JsonResponse
    {
        // Seguridad: Requiere la contraseña actual para confirmar la eliminación
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        // En API con Sanctum, eliminamos los tokens antes de borrar al usuario
        // para cerrar todas las sesiones activas inmediatamente.
        $user->tokens()->delete();
        $user->delete();

        return response()->json([
            'message' => 'La cuenta ha sido eliminada permanentemente.'
        ]);
    }
}