<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Illuminate\Http\JsonResponse;

/**
 * Este controlador sirve para acciones "delicadas". 
 * Pide al usuario que ya inició sesión que vuelva a poner su clave
 * antes de realizar un cambio importante.
 */
class ConfirmablePasswordController extends Controller
{
    /**
     * FUNCIÓN STORE (Confirmar Contraseña): 
     * Es como cuando el cajero del banco te pide tu huella o PIN 
     * justo antes de autorizar un retiro grande, aunque ya le hayas dado tu cédula.
     */
    public function store(Request $request): JsonResponse
    {
        // 1. LA PRUEBA DE FUEGO:
        // Aquí le pedimos al sistema que compare el email del usuario que está conectado
        // con la contraseña que acaba de escribir en el formulario de confirmación.
        if (! Auth::guard('web')->validate([
            'email' => $request->user()->email, // Sacamos el correo del usuario que tiene la sesión abierta.
            'password' => $request->password,   // La clave que el usuario escribió para confirmar.
        ])) {
            // Si la clave no coincide, lanzamos un error.
            // Es como decirle: "Esa no es tu clave actual, no puedes pasar".
            return response()->json([
                'message' => 'La contraseña proporcionada es incorrecta.',
                'errors' => [
                    'password' => [__('auth.password')],
                ]
            ], 422); // El número 422 significa "Hay un error en lo que escribiste".
        }

        // 2. EL PERMISO TEMPORAL:
        // Si la clave fue correcta, anotamos en una "libreta de notas" (la sesión)
        // la hora exacta en la que el usuario confirmó su identidad. 
        // Así, por unos minutos, no le volveremos a pedir la clave para otras acciones sensibles.
        $request->session()->put('auth.password_confirmed_at', time());

        // 3. EL "SIGA ADELANTE":
        // Le enviamos este paquete a la página de React para decirle: 
        // "¡Todo bien! Ya puedes dejar que el usuario haga el cambio que quería".
        return response()->json([
            'message' => 'Contraseña confirmada correctamente.',
            'confirmed' => true
        ], 200); // El número 200 significa "¡Todo salió perfecto!".
    }
}