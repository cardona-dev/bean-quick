<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;

/**
 * Este controlador es el encargado de registrar a los nuevos usuarios.
 * Es como la oficina donde te inscribes para ser cliente o empresa.
 */
class RegisteredUserController extends Controller
{
    /**
     * FUNCIÓN STORE (Crear cuenta):
     * Aquí se procesa el formulario de "Crear cuenta" que ve el usuario.
     */
    public function store(Request $request): JsonResponse
    {
        // 1. LA LIMPIEZA (Sanitización):
        // Antes de leer el nombre, usamos "strip_tags". 
        // Es como si alguien intentara entrar con una máscara: se la quitamos para ver su cara real.
        // Esto evita que metan código malicioso (HTML/JS) en el campo del nombre.
        $request->merge([
            'name' => strip_tags($request->name),
        ]);

        // 2. LA ADUANA (Validación):
        // Ponemos reglas muy estrictas para dejar pasar a alguien:
        // - El nombre no puede tener símbolos extraños de programación.
        // - El correo debe ser único (no pueden haber dos personas con el mismo correo).
        // - La CONTRASEÑA debe ser una "Fortaleza": 
        //   mínimo 8 letras, mezclar mayúsculas con minúsculas, incluir números 
        //   y que no sea una clave común filtrada en internet (como "123456").
        $request->validate([
            'name' => ['required', 'string', 'max:255', 'regex:/^[^<>{}\/]*$/'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:'.User::class],
            'password' => [
                'required', 
                'confirmed', 
                Password::min(8)->mixedCase()->numbers()->uncompromised()
            ],
            'rol' => ['required', 'in:empresa,cliente,admin'],
        ]);

        // 3. EL NACIMIENTO DEL USUARIO:
        // Si pasó todas las pruebas, guardamos sus datos en la base de datos.
        // Importante: La contraseña NUNCA se guarda tal cual. Se usa "Hash::make"
        // para convertirla en un código secreto que ni nosotros podemos leer.
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'rol' => $request->rol,
        ]);

        // 4. EL AVISO AL SISTEMA:
        // Lanzamos un evento para decir: "¡Hay un nuevo integrante!".
        // Esto puede disparar otras acciones, como enviar el correo de bienvenida.
        event(new Registered($user));

        // 5. LA ENTREGA DE LA LLAVE (Token):
        // Logueamos al usuario automáticamente y le damos su "Token".
        // Ese token es su pase VIP para que React sepa quién es en cada movimiento.
        Auth::login($user);
        $token = $user->createToken('auth_token')->plainTextToken;

        // 6. EL MAPA:
        // Decidimos a dónde mandarlo según quién sea. 
        // Si es empresa, va a su panel; si es admin, a su oficina; si es cliente, a la tienda.
        $redirectTo = '/'; 
        if ($user->rol === 'empresa') {
            $redirectTo = '/empresa/panel';
        } elseif ($user->rol === 'admin') {
            $redirectTo = '/admin/dashboard';
        }

        // 7. RESPUESTA FINAL:
        // Le enviamos a React todo el "kit de bienvenida" en un paquete JSON limpio.
        return response()->json([
            'status' => 'success',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'rol' => $user->rol,
            ],
            'token' => $token,
            'redirectTo' => $redirectTo,
            'message' => 'Cuenta creada y protegida correctamente'
        ], 201); // 201 significa "Recurso creado con éxito".
    }
}