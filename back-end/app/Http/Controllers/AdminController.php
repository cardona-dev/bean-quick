<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Empresa;
use App\Models\Pedido;
use App\Models\SolicitudEmpresa;
use App\Models\Categoria;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Mail;
use App\Mail\ActivacionEmpresaMail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    /**
     * FUNCIÓN DASHBOARD:
     * Recopila toda la información global del sistema para que el administrador 
     * vea un resumen completo en su interfaz de React.
     */
    public function dashboard(): JsonResponse
    {
        return response()->json([
            // Envía la lista de todos los usuarios registrados
            'usuarios'    => User::all(),
            // Envía la lista de todas las empresas existentes
            'empresas'    => Empresa::all(),
            // Trae los pedidos junto con la información del cliente y la empresa
            'pedidos'     => Pedido::with('cliente', 'empresa')->get(),
            // Solo trae las solicitudes de nuevas empresas que están esperando respuesta
            'solicitudes' => SolicitudEmpresa::where('estado', 'pendiente')->get(),
        ]);
    }

    /**
     * FUNCIÓN APROBAR:
     * Procesa la aceptación de un nuevo negocio. Genera una llave de seguridad (token)
     * y envía un correo electrónico al dueño de la empresa.
     */
    public function aprobar($id): JsonResponse
    {
        $solicitud = SolicitudEmpresa::findOrFail($id);

        // 1. Genera una cadena de texto aleatoria de 60 caracteres como medida de seguridad
        $token = Str::random(60);

        // 2. Guarda el estado como 'aprobado' y almacena el token generado
        $solicitud->update([
            'estado' => 'aprobado',
            'token'  => $token 
        ]);

        // 3. Crea la dirección (URL) a la que el usuario debe entrar en el Frontend
        $link = "http://localhost:5173/empresa/activar/" . $token;

        try {
            // 4. Intenta enviar el correo usando la plantilla ActivacionEmpresaMail
            Mail::to($solicitud->correo)->send(new ActivacionEmpresaMail($solicitud, $link));

            return response()->json([
                'message'   => 'Solicitud aprobada y correo de activación enviado.',
                'solicitud' => $solicitud
            ]);
        } catch (\Exception $e) {
            // Si el correo falla, se informa pero se mantiene la aprobación en la base de datos
            return response()->json([
                'message' => 'Solicitud aprobada pero hubo un error al enviar el correo.',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    /**
     * FUNCIÓN RECHAZAR:
     * Cambia el estado de la solicitud para que ya no aparezca en la lista de pendientes.
     */
    public function rechazar($id): JsonResponse
    {
        $solicitud = SolicitudEmpresa::findOrFail($id);
        $solicitud->estado = 'rechazado';
        $solicitud->save();

        return response()->json([
            'message'   => 'Solicitud rechazada.',
            'solicitud' => $solicitud
        ]);
    }

    /**
     * FUNCIÓN CREAR CATEGORÍA:
     * Crea una nueva categoría validando que el nombre sea único.
     */
    public function crearCategoria(Request $request): JsonResponse
    {
        // Valida que el nombre sea requerido y único en la tabla de categorías
        $validated = $request->validate([
            'nombre' => 'required|string|unique:categorias,nombre'
        ]);

        try {
            $categoria = Categoria::create($validated);

            return response()->json([
                'message'  => 'Categoría creada correctamente.',
                'categoria' => $categoria
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al crear la categoría.',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    /**
     * FUNCIÓN ELIMINAR CATEGORÍA:
     * Elimina una categoría existente.
     */
    public function eliminarCategoria($id): JsonResponse
    {
        try {
            $categoria = Categoria::findOrFail($id);
            $categoria->delete();

            return response()->json([
                'message' => 'Categoría eliminada correctamente.'
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Categoría no encontrada.'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al eliminar la categoría.',
                'error'   => $e->getMessage()
            ], 500);
        }
    }
}