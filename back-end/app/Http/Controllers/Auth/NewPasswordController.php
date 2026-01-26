<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules;

/**
 * Este controlador se encarga de procesar el cambio definitivo de contraseña
 * después de que el usuario pidió recuperarla.
 */
class NewPasswordController extends Controller
{
    /**
     * FUNCIÓN STORE (Guardar nueva contraseña): 
     * Es el paso final donde el usuario escribe su nueva clave.
     */
    public function store(Request $request): JsonResponse
    {
        // 1. REVISIÓN DE PAPELES:
        // Validamos que el usuario nos mande tres cosas obligatorias:
        // - El 'token': Es como el ticket que le enviamos al correo para demostrar que él pidió el cambio.
        // - El 'email': Para saber a quién le estamos cambiando la clave.
        // - La 'password': La nueva clave, que debe ser segura y escrita dos veces igual.
        $request->validate([
            'token' => ['required'],
            'email' => ['required', 'email'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        // 2. EL PROCESO DE CAMBIO:
        // Aquí le pedimos al sistema de Laravel que intente resetear la clave.
        // Es como si el cerrajero revisara el ticket antes de cambiar la cerradura.
        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user) use ($request) {
                // Si el ticket es válido, borramos la clave vieja y guardamos la nueva.
                // Usamos 'Hash::make' para encriptar la clave; así, si alguien roba la base 
                // de datos, no podrá leer la clave real, solo verá símbolos extraños.
                $user->forceFill([
                    'password' => Hash::make($request->password),
                    'remember_token' => Str::random(60), // Renovamos su identificación de seguridad.
                ])->save();

                // Avisamos al sistema que la contraseña ha sido cambiada con éxito.
                event(new PasswordReset($user));
            }
        );

        // 3. RESPUESTA DE ÉXITO:
        // Si todo salió bien (Password::PASSWORD_RESET), le avisamos a la web de React.
        if ($status == Password::PASSWORD_RESET) {
            return response()->json([
                'message' => __($status), // Enviamos un mensaje amigable como "Contraseña cambiada".
                'status' => 'success'
            ], 200);
        }

        // 4. RESPUESTA DE ERROR:
        // Si el ticket (token) ya venció o el correo no es el mismo que pidió el cambio,
        // mandamos un error 422 (Información inválida).
        return response()->json([
            'message' => __($status),
            'errors' => ['email' => [__($status)]]
        ], 422);
    }
}