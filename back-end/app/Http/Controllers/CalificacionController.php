<?php

namespace App\Http\Controllers;

use App\Models\Calificacion;
use App\Models\Pedido;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\JsonResponse;

class CalificacionController extends Controller
{
    /**
     * Guardar una nueva calificación
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'pedido_id'   => 'required|exists:pedidos,id',
            'producto_id' => 'required|exists:productos,id',
            'estrellas'   => 'required|integer|min:1|max:5',
            'comentario'  => 'nullable|string|max:255',
        ]);

        try {
            // 1. Verificar que el pedido realmente pertenezca al usuario y esté ENTREGADO
            $pedido = Pedido::where('id', $request->pedido_id)
                            ->where('user_id', Auth::id())
                            ->first();

            if (!$pedido) {
                return response()->json(['message' => 'Pedido no encontrado.'], 404);
            }

            if (strtolower($pedido->estado) !== 'entregado') {
                return response()->json(['message' => 'Solo puedes calificar productos de pedidos entregados.'], 403);
            }

            // 2. Evitar duplicados: Verificar si ya calificó este producto en este pedido
            $existe = Calificacion::where('pedido_id', $request->pedido_id)
                                  ->where('producto_id', $request->producto_id)
                                  ->exists();

            if ($existe) {
                return response()->json(['message' => 'Ya has calificado este producto.'], 400);
            }

            // 3. Crear la calificación
            $calificacion = Calificacion::create([
                'user_id'     => Auth::id(),
                'pedido_id'   => $request->pedido_id,
                'producto_id' => $request->producto_id,
                'estrellas'   => $request->estrellas,
                'comentario'  => $request->comentario,
            ]);

            return response()->json([
                'message' => '¡Gracias por tu calificación! ⭐',
                'calificacion' => $calificacion
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al guardar la calificación',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener calificaciones de un producto específico (Para mostrar en la tienda)
     */
    public function porProducto($productoId): JsonResponse
    {
        $calificaciones = Calificacion::where('producto_id', $productoId)
            ->with('usuario:id,name') // Solo traemos el nombre del usuario
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($calificaciones);
    }
}