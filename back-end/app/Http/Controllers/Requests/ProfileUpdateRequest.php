<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Este archivo se encarga de vigilar que, cuando un usuario quiera cambiar
 * su nombre o su correo, los datos nuevos sean correctos y seguros.
 */
class ProfileUpdateRequest extends FormRequest
{
    /**
     * FUNCIÓN RULES (Las Reglas de Actualización):
     * Aquí definimos qué requisitos deben cumplir los nuevos datos.
     */
    public function rules(): array
    {
        return [
            // 1. REGLA PARA EL NOMBRE:
            // Es obligatorio (required), debe ser texto (string) 
            // y no puede ser exageradamente largo (máximo 255 letras).
            'name' => ['required', 'string', 'max:255'],

            // 2. REGLA PARA EL CORREO ELECTRÓNICO:
            'email' => [
                'required',    // No puede dejar el campo vacío.
                'string',      // Debe ser texto.
                'lowercase',   // El sistema lo convierte a minúsculas automáticamente para evitar confusiones.
                'email',       // Debe tener formato de correo real (que incluya un @ y un dominio).
                'max:255',     // Límite de largo por seguridad.
                
                // ESTA ES LA PARTE MÁS IMPORTANTE:
                // "Rule::unique" revisa que nadie más tenga ese correo.
                // "ignore($this->user()->id)" es para que el sistema NO se queje 
                // si el correo que envías es el tuyo propio (el que ya tienes guardado).
                Rule::unique(User::class)->ignore($this->user()->id),
            ],
        ];
    }
}