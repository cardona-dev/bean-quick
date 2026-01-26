<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use App\Models\Empresa;
use Illuminate\Http\JsonResponse;

class EmpresaController extends Controller
{
    /**
     * Obtener datos del perfil de la empresa.
     * GET /api/empresa/perfil
     */
    public function show(): JsonResponse
    {
        // Buscamos la empresa ligada al usuario autenticado
        $empresa = Empresa::where('user_id', Auth::id())->first();

        if (!$empresa) {
            return response()->json(['message' => 'Empresa no encontrada'], 404);
        }

        return response()->json([
            'status' => 'success',
            'empresa' => $empresa
        ]);
    }

    /**
     * Guardar nueva empresa (si no se creó en la activación).
     * POST /api/empresa/store
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'nombre'      => 'required|string|max:255',
            'nit'         => 'required|string|unique:empresas,nit', // Verifica que el NIT sea único
            'direccion'   => 'nullable|string|max:255',
            'telefono'    => 'nullable|string|max:50',
            'descripcion' => 'nullable|string',
            'logo'        => 'nullable|image|max:2048',
            'foto_local'  => 'nullable|image|max:4096',
        ]);

        // 1. Usamos fill() para cargar todos los datos de texto excepto las imágenes
        $empresa = new Empresa($request->except(['logo', 'foto_local']));

        // 2. Forzamos el user_id (Si Auth::id() es null en Thunder, pon uno manual para probar)
        $empresa->user_id = Auth::id() ?? 1; 

        // 3. Procesamos los archivos (Aquí es donde se asignan las rutas)
        if ($request->hasFile('logo')) {
            $empresa->logo = $request->file('logo')->store('empresas/logos', 'public');
        }

        if ($request->hasFile('foto_local')) {
            $empresa->foto_local = $request->file('foto_local')->store('empresas/locales', 'public');
        }

        $empresa->save();

        return response()->json([
            'message' => 'Empresa creada correctamente.',
            'empresa' => $empresa // Aquí verás logo_url y foto_local_url gracias a tu modelo
        ], 201);
    }

    /**
     * Actualizar datos de la empresa.
     * POST /api/empresa/update (Se usa POST por el soporte de archivos en Laravel)
     */
    public function update(Request $request): JsonResponse
    {
        $empresa = Empresa::where('user_id', Auth::id())->firstOrFail();

        $request->validate([
            'nombre' => 'required|string|max:255',
            'direccion' => 'nullable|string|max:255',
            'telefono' => 'nullable|string|max:50',
            'descripcion' => 'nullable|string',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
            'foto_local' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:4096',
        ]);

        $data = $request->only(['nombre', 'direccion', 'telefono', 'descripcion']);

        // Gestión del LOGO: Si sube uno nuevo, borramos el anterior para no llenar el servidor de basura
        if ($request->hasFile('logo')) {
            if ($empresa->logo) {
                Storage::disk('public')->delete($empresa->logo);
            }
            $data['logo'] = $request->file('logo')->store('empresas/logos', 'public');
        }

        // Gestión de FOTO LOCAL: Misma lógica de reemplazo
        if ($request->hasFile('foto_local')) {
            if ($empresa->foto_local) {
                Storage::disk('public')->delete($empresa->foto_local);
            }
            $data['foto_local'] = $request->file('foto_local')->store('empresas/locales', 'public');
        }

        $empresa->update($data);

        return response()->json([
            'message' => 'Empresa actualizada correctamente.',
            'empresa' => $empresa
        ]);
    }
}