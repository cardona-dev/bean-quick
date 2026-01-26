<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Pedido;
use App\Models\PedidoProducto;
use App\Models\Carrito;
use App\Models\Producto;
use App\Models\Empresa;
use Illuminate\Http\JsonResponse;

class PedidoController extends Controller
{
    /**
     * Obtener datos para el checkout.
     * Prepara la vista previa de la compra para el usuario.
     */
    public function checkout(): JsonResponse
    {
        $user = Auth::user();
        $carrito = Carrito::where('user_id', $user->id)->with('productos')->first();

        if (!$carrito || $carrito->productos->isEmpty()) {
            return response()->json(['message' => 'Tu carrito está vacío.'], 400);
        }

        return response()->json([
            'carrito' => $carrito,
            'productos' => $carrito->productos,
        ]);
    }

    /**
     * Crear un pedido específico para una tienda.
     * Filtra los productos del carrito por empresa y genera el registro del pedido.
     */
    public function store(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        // 1. Validamos datos de entrada
        $request->validate([
            'empresa_id'    => 'required|exists:empresas,id',
            'hora_recogida' => 'required|date_format:H:i'
        ]);

        // 2. Buscamos el carrito con TODOS los productos que tenga el usuario
        $carrito = Carrito::where('user_id', $user->id)->with('productos')->first();

        if (!$carrito || $carrito->productos->isEmpty()) {
            return response()->json(['message' => 'Tu carrito está vacío.'], 400);
        }

        // 3. FILTRADO CRÍTICO: Seleccionamos solo los productos que pertenecen a la empresa_id enviada
        $productosTienda = $carrito->productos->filter(function ($producto) use ($request) {
            return (int)$producto->empresa_id === (int)$request->empresa_id;
        });

        if ($productosTienda->isEmpty()) {
            return response()->json(['message' => 'No hay productos de esta empresa en tu carrito.'], 422);
        }

        // 4. Calcular el total usando ÚNICAMENTE los productos filtrados
        $total = 0;
        foreach ($productosTienda as $producto) {
            $cantidad = $producto->pivot->cantidad ?? 1;
            $precio = $producto->precio ?? 0;
            $total += $precio * $cantidad;
        }

        // 5. Crear el pedido asociado solo a esa empresa
        $pedido = Pedido::create([
            'empresa_id'    => $request->empresa_id,
            'user_id'       => $user->id,
            'estado'        => 'pendiente',
            'hora_recogida' => $request->hora_recogida,
            'total'         => $total,
        ]);

        // 6. Registrar productos en la tabla intermedia y LIMPIAR el carrito selectivamente
        foreach ($productosTienda as $producto) {
            PedidoProducto::create([
                'pedido_id'       => $pedido->id,
                'producto_id'     => $producto->id,
                'cantidad'        => $producto->pivot->cantidad ?? 1,
                'precio_unitario' => $producto->precio ?? 0,
            ]);

            // IMPORTANTE: Solo quitamos del carrito los productos que acabamos de pedir
            $carrito->productos()->detach($producto->id);
        }

        return response()->json([
            'message' => 'Pedido generado correctamente para esta tienda.',
            'pedido'  => $pedido->load('productos')
        ], 201);
    }

    /**
     * Listar los pedidos del cliente logueado.
     */
    public function indexCliente(): JsonResponse
    {
        $pedidos = Pedido::where('user_id', Auth::id())
            ->with(['empresa', 'productos'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($pedidos);
    }

    /**
     * Listar los pedidos recibidos por la empresa logueada.
     */
    public function indexEmpresa(): JsonResponse
    {
        try {
            $user = Auth::user();

            if (!$user->empresa) {
                return response()->json(['message' => 'No tienes empresa asociada.'], 404);
            }

            $pedidos = Pedido::where('empresa_id', $user->empresa->id)
                ->with(['productos', 'cliente'])
                // Orden ascendente para que los pedidos más antiguos (prioritarios) salgan primero
                ->orderBy('created_at', 'asc') 
                ->get();

            return response()->json($pedidos);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Cancelar un pedido (Flujo de Cliente).
     */
    public function cancelar($id): JsonResponse
    {
        try {
            $user = Auth::user();

            // Buscamos el pedido validando que sea del usuario
            $pedido = Pedido::where('id', $id)
                ->where('user_id', $user->id)
                ->first();

            if (!$pedido) {
                return response()->json(['message' => 'Pedido no encontrado'], 404);
            }

            // Verificamos estado (usando strtolower para evitar fallos por mayúsculas)
            if (strtolower($pedido->estado) !== 'pendiente') {
                return response()->json([
                    'message' => 'No puedes cancelar un pedido que ya está: ' . $pedido->estado
                ], 400);
            }

            $pedido->update([
                'estado' => 'Cancelado'
            ]);

            return response()->json([
                'message' => 'Pedido cancelado con éxito',
                'pedido' => $pedido
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error en el servidor',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar el estado del pedido (Flujo de Empresa).
     */
    public function actualizarEstado(Request $request, $id): JsonResponse
    {
        $request->validate([
            'estado' => 'required'
        ]);

        try {
            $pedido = Pedido::findOrFail($id);

            // ucfirst(strtolower()) asegura que el formato sea "Estado" (ej: "Preparando")
            // Esto previene errores de "Data truncated" en bases de datos estrictas
            $nuevoEstado = ucfirst(strtolower($request->estado));

            $pedido->update([
                'estado' => $nuevoEstado
            ]);

            return response()->json([
                'message' => 'Estado actualizado con éxito',
                'pedido' => $pedido
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error en el servidor',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}