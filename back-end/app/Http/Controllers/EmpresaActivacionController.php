<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Empresa;
use App\Models\SolicitudEmpresa;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\JsonResponse;

class EmpresaActivacionController extends Controller
{
    /**
     * Valida el token y devuelve los datos de la solicitud para mostrar en React.
     */
    public function validarToken($token): JsonResponse
    {
        $solicitud = SolicitudEmpresa::where('token', $token)
            ->where('estado', 'aprobado')
            ->first();

        if (!$solicitud) {
            return response()->json([
                'message' => 'El enlace de activación no es válido o ya fue usado.'
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'solicitud' => $solicitud
        ]);
    }

    /**
     * Procesa la activación final, crea usuario y mueve archivos.
     */
    public function store(Request $request, $token): JsonResponse
    {
        Log::info("=== INICIO ACTIVACIÓN DE CUENTA (API) ===");

        $request->validate([
            'password' => 'required|confirmed|min:8',
        ]);

        $solicitud = SolicitudEmpresa::where('token', $token)
            ->where('estado', 'aprobado')
            ->first();

        if (!$solicitud) {
            return response()->json(['message' => 'Enlace no válido.'], 422);
        }

        if (User::where('email', $solicitud->correo)->exists()) {
            return response()->json(['message' => 'Ya existe una cuenta con este correo.'], 422);
        }

        DB::beginTransaction();

        try {
            // 1. CREAR USUARIO
            $user = User::create([
                'name' => $solicitud->nombre, // Ajustado a 'nombre' según tu código
                'email' => $solicitud->correo,
                'password' => Hash::make($request->password),
                'rol' => 'empresa',
            ]);

            // 2. PREPARAR DATOS DE LA EMPRESA
            $empresaData = [
                'user_id' => $user->id,
                'nombre' => $solicitud->nombre,
                'nit' => $solicitud->nit,
                'direccion' => $solicitud->direccion,
                'telefono' => $solicitud->telefono,
                'descripcion' => $solicitud->descripcion,
            ];

            // 3. PROCESAR LOGO (De temporal a permanente)
            if ($solicitud->logo && Storage::disk('public')->exists($solicitud->logo)) {
                $logoFileName = basename($solicitud->logo);
                $newLogoPath = 'empresas/logos/' . $logoFileName;
                
                if (!Storage::disk('public')->exists('empresas/logos')) {
                    Storage::disk('public')->makeDirectory('empresas/logos');
                }
                
                Storage::disk('public')->copy($solicitud->logo, $newLogoPath);
                $empresaData['logo'] = $newLogoPath;
            }

            // 4. PROCESAR FOTO LOCAL (De temporal a permanente)
            if ($solicitud->foto_local && Storage::disk('public')->exists($solicitud->foto_local)) {
                $fotoFileName = basename($solicitud->foto_local);
                $newFotoPath = 'empresas/locales/' . $fotoFileName;
                
                if (!Storage::disk('public')->exists('empresas/locales')) {
                    Storage::disk('public')->makeDirectory('empresas/locales');
                }
                
                Storage::disk('public')->copy($solicitud->foto_local, $newFotoPath);
                $empresaData['foto_local'] = $newFotoPath;
            }

            // 5. CREAR EMPRESA
            $empresa = Empresa::create($empresaData);

            // 6. ACTUALIZAR SOLICITUD
            $solicitud->update([
                'estado' => 'completada',
                'token' => null,
            ]);

            // 7. ELIMINAR TEMPORALES
            if ($solicitud->logo) Storage::disk('public')->delete($solicitud->logo);
            if ($solicitud->foto_local) Storage::disk('public')->delete($solicitud->foto_local);

            DB::commit();
            Log::info("=== ✅ ACTIVACIÓN COMPLETADA EXITOSAMENTE ===");

            return response()->json([
                'status' => 'success',
                'message' => 'Cuenta creada exitosamente. Ya puedes iniciar sesión.',
                'user' => $user
            ], 201);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'error_real' => $e->getMessage(), 
                'linea' => $e->getLine()
            ], 500);
        }
    }
}