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
     * FUNCIÓN STORE:
     * Registra una nueva opinión en la base de datos. 
     * Implementa reglas de negocio importantes para asegurar que las reseñas sean reales.
     */
    public function store(Request $request): JsonResponse
    {
        // Validación de datos: asegura que el pedido y producto existan, 
        // y que las estrellas estén en el rango de 1 a 5.
        $request->validate([
            'pedido_id'   => 'required|exists:pedidos,id',
            'producto_id' => 'required|exists:productos,id',
            'estrellas'   => 'required|integer|min:1|max:5',
            'comentario'  => 'nullable|string|max:255',
        ]);

        try {
            // 1. Verificación de Propiedad y Estado:
            // Busca el pedido asegurándose de que pertenezca al usuario autenticado.
            $pedido = Pedido::where('id', $request->pedido_id)
                            ->where('user_id', Auth::id())
                            ->first();

            if (!$pedido) {
                return response()->json(['message' => 'Pedido no encontrado.'], 404);
            }

            // Regla de Oro: Solo se puede calificar si el pedido ya fue entregado.
            if (strtolower($pedido->estado) !== 'entregado') {
                return response()->json(['message' => 'Solo puedes calificar productos de pedidos entregados.'], 403);
            }

            // 2. Control de Duplicados:
            // Evita que un mismo usuario califique varias veces el mismo producto dentro de un mismo pedido.
            $existe = Calificacion::where('pedido_id', $request->pedido_id)
                                  ->where('producto_id', $request->producto_id)
                                  ->exists();

            if ($existe) {
                return response()->json(['message' => 'Ya has calificado este producto.'], 400);
            }

            // 3. Creación:
            // Si pasa todas las validaciones, se guarda la reseña vinculada al usuario, pedido y producto.
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
            // Captura cualquier error inesperado y devuelve el mensaje de error para depuración.
            return response()->json([
                'message' => 'Error al guardar la calificación',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * FUNCIÓN POR PRODUCTO:
     * Recupera todas las reseñas de un producto para que otros clientes puedan leerlas.
     */
    public function porProducto($productoId): JsonResponse
    {
        $calificaciones = Calificacion::where('producto_id', $productoId)
            // Usa Eager Loading para traer el nombre de quien comentó sin exponer datos privados.
            ->with('usuario:id,name') 
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($calificaciones);
    }
}