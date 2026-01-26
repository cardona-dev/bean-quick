<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\JsonResponse;

/**
 * Este controlador maneja la "Puerta de Entrada" (Login) 
 * y la "Puerta de Salida" (Logout) de los usuarios.
 */
class AuthenticatedSessionController extends Controller
{
    /**
     * FUNCIÓN STORE (Iniciar Sesión): 
     * Es como el proceso de registro en la entrada de un hotel.
     */
    public function store(Request $request): JsonResponse
    {
        // 1. EL REQUISITO: Primero revisamos que la persona traiga su correo y contraseña.
        // Si falta alguno o el correo no parece un correo real, no lo dejamos ni intentar.
        $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        // 2. LA VERIFICACIÓN: Comparamos el correo y la contraseña con nuestra lista de usuarios.
        // "Auth::attempt" es como preguntar: "¿Esta persona existe y su clave es correcta?"
        if (Auth::attempt($request->only('email', 'password'))) {
            
            // Si todo está bien, obtenemos los datos de esa persona
            $user = Auth::user();

            // 3. LA LLAVE MÁGICA (Token): Como estamos en una aplicación moderna, 
            // le entregamos un "Token" (una clave secreta temporal) que usará su celular 
            // o navegador para demostrar que ya se identificó en cada clic futuro.
            $token = $user->createToken('token-auth')->plainTextToken;

            // 4. EL GUÍA: Decidimos a qué habitación enviar al usuario según su tipo (rol).
            $urlDestino = '/'; // Por defecto, todos van al inicio.

            if ($user->rol === 'empresa') {
                // Si es dueño de negocio, revisamos si ya llenó los datos de su local.
                $empresa = \App\Models\Empresa::where('user_id', $user->id)->first();
                
                // Si no tiene local creado, lo mandamos a crear uno. 
                // Si ya tiene, lo mandamos directo a su panel de control.
                $urlDestino = (!$empresa) ? '/empresa/create' : "/empresa/panel";

            } elseif ($user->rol === 'cliente') {
                // Si es un comprador normal, lo mandamos a la tienda principal.
                $urlDestino = '/';

            } elseif ($user->rol === 'admin') {
                // Si es el jefe de jefes (administrador), lo mandamos a la oficina central.
                $urlDestino = '/admin/dashboard';
            }

            // 5. RESPUESTA DE ÉXITO: Le enviamos un paquete de información a la aplicación web (React)
            // para que sepa que todo salió bien y guarde los datos.
            return response()->json([
                'status' => 'success', // Mensaje de "Todo salió bien"
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'rol' => $user->rol,
                    'email' => $user->email,
                ],
                'token' => $token, // Su llave de acceso
                'redirectTo' => $urlDestino, // A dónde debe viajar ahora
                'message' => 'Login exitoso'
            ], 200);
        }

        // 6. EL ERROR: Si la contraseña estaba mal o el correo no existe, 
        // le avisamos que no puede entrar.
        return response()->json([
            'status' => 'error',
            'message' => 'Las credenciales no coinciden con nuestros registros.'
        ], 401);
    }

    /**
     * FUNCIÓN DESTROY (Cerrar Sesión): 
     * Es como cuando entregas las llaves en recepción al irte del hotel.
     */
    public function destroy(Request $request): JsonResponse
    {
        // Si el usuario tiene una sesión activa...
        if ($request->user()) {
            // Destruimos la "llave" (token) para que nadie más pueda usarla.
            $request->user()->currentAccessToken()->delete();
        }

        // Avisamos a la web que ya se puede limpiar la pantalla y volver al inicio.
        return response()->json([
            'status' => 'success',
            'message' => 'Sesión cerrada correctamente'
        ]);
    }
}