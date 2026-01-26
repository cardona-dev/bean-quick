<?php

namespace App\Http\Requests\Auth;

use Illuminate\Auth\Events\Lockout;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Este archivo se encarga de validar los datos del Login antes de que
 * el controlador intente siquiera procesarlos.
 */
class LoginRequest extends FormRequest
{
    /**
     * FUNCIÓN AUTHORIZE: 
     * ¿Tiene permiso este usuario para enviar esta petición?
     * Como es el Login, cualquier persona en el mundo puede intentarlo, así que es "true" (sí).
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * FUNCIÓN RULES (Las Reglas):
     * Aquí definimos qué es obligatorio. 
     * Si no mandan el email o el password, el sistema ni siquiera se molesta en buscar.
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ];
    }

    /**
     * FUNCIÓN AUTHENTICATE (El proceso de entrada):
     * Es donde realmente ocurre la magia de verificar al usuario.
     */
    public function authenticate(): void
    {
        // 1. EL CRONÓMETRO: Primero revisamos que no hayan fallado demasiadas veces seguidas.
        $this->ensureIsNotRateLimited();

        // 2. EL INTENTO: Si los datos no coinciden...
        if (! Auth::attempt($this->only('email', 'password'), $this->boolean('remember'))) {
            
            // Aumentamos el contador de fallos para este usuario.
            RateLimiter::hit($this->throttleKey());

            // Lanzamos un error avisando que los datos están mal.
            throw ValidationException::withMessages([
                'email' => trans('auth.failed'),
            ]);
        }

        // 3. LIMPIEZA: Si el login fue exitoso, reseteamos el contador de fallos.
        RateLimiter::clear($this->throttleKey());
    }

    /**
     * FUNCIÓN ENSURE IS NOT RATE LIMITED (Protección contra ataques):
     * Esta es la "Cárcel Temporal". Si alguien intenta adivinar una clave 
     * fallando más de 5 veces, lo bloqueamos.
     */
    public function ensureIsNotRateLimited(): void
    {
        // Si no se ha pasado del límite de 5 intentos, lo dejamos seguir.
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        // Si se pasó, lanzamos un evento de "BLOQUEO" (Lockout).
        event(new Lockout($this));

        // Calculamos cuántos segundos debe esperar para volver a intentarlo.
        $seconds = RateLimiter::availableIn($this->throttleKey());

        // Le avisamos al usuario: "Has fallado mucho. Espera X minutos".
        throw ValidationException::withMessages([
            'email' => trans('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    /**
     * FUNCIÓN THROTTLE KEY (La huella digital):
     * Crea un código único basado en el correo del usuario y su dirección IP.
     * Así sabemos exactamente QUIÉN está fallando y desde DÓNDE.
     */
    public function throttleKey(): string
    {
        return Str::transliterate(Str::lower($this->string('email')).'|'.$this->ip());
    }
}