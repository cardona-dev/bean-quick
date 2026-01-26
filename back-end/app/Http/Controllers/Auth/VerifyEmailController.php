<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Auth\Events\Verified;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\RedirectResponse;

/**
 * Este controlador es el que se activa cuando el usuario hace clic 
 * en el enlace que le llegó a su correo electrónico.
 */
class VerifyEmailController extends Controller
{
    /**
     * FUNCIÓN __INVOKE (La acción de verificar):
     * Esta función es especial porque se ejecuta automáticamente al tocar la ruta.
     */
    public function __invoke(EmailVerificationRequest $request): RedirectResponse
    {
        // 1. EL DESTINO: 
        // Definimos la dirección de nuestra aplicación web (React). 
        // Es a donde queremos "devolver" al usuario después de que haga clic en el correo.
        $frontendUrl = 'http://localhost:5173/dashboard';

        // 2. ¿YA ESTABA LISTO?:
        // Primero revisamos si por alguna razón el usuario ya estaba verificado.
        // Si ya tenía el sello de aprobación, lo mandamos directo al Dashboard.
        // Agregamos "?verified=1" al final de la dirección para que React sepa que todo está ok.
        if ($request->user()->hasVerifiedEmail()) {
            return redirect()->away($frontendUrl . '?verified=1');
        }

        // 3. PONER EL SELLO (Verificar ahora):
        // Si no estaba verificado, ejecutamos "markEmailAsVerified".
        // Esto cambia el estado del usuario en la base de datos de "Pendiente" a "Verificado".
        if ($request->user()->markEmailAsVerified()) {
            // Avisamos al sistema que la verificación acaba de ocurrir con éxito.
            event(new Verified($request->user()));
        }

        // 4. EL REGRESO A CASA:
        // Finalmente, redirigimos al usuario fuera del servidor (Laravel) 
        // y lo mandamos de vuelta a la interfaz visual (React).
        return redirect()->away($frontendUrl . '?verified=1');
    }
}