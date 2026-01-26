<?php

namespace App\Http\Controllers;

use App\Models\SolicitudEmpresa;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\JsonResponse;

class SolicitudEmpresaController extends Controller
{
    /**
     * Procesar el envío de una nueva solicitud de empresa.
     * POST /api/solicitud-empresa
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'nombre' => 'required|string|max:255',
            'correo' => 'required|email|unique:solicitudes_empresas,correo',
            'nit' => 'nullable|string|max:50',
            'telefono' => 'nullable|string|max:50',
            'direccion' => 'nullable|string|max:255',
            'descripcion' => 'nullable|string',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
            'foto_local' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:4096',
            'token',
        ]);

        $data = $request->except(['logo', 'foto_local']);

        // Validación de depuración para Thunder Client / Postman
        if (!$request->hasFile('logo')) {
            return response()->json([
                'error' => 'Laravel no detecta el archivo logo. Revisa el Body en Thunder.'
            ], 400);
        }

        // Guardar logo en carpeta temporal de solicitudes
        if ($request->hasFile('logo')) {
            $data['logo'] = $request->file('logo')->store('solicitudes/logos', 'public');
        }
        
        // Guardar foto del local en carpeta temporal de solicitudes
        if ($request->hasFile('foto_local')) {
            $data['foto_local'] = $request->file('foto_local')->store('solicitudes/locales', 'public');
        }

        // Se crea con estado 'pendiente' por defecto (definido en la migración o modelo)
        $solicitud = SolicitudEmpresa::create($data);

        return response()->json([
            'status' => 'success',
            'message' => 'Tu solicitud fue enviada correctamente. Nuestro equipo la revisará pronto.',
            'solicitud_id' => $solicitud->id
        ], 201);
    }
}