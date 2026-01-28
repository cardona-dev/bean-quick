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
     */public function store(Request $request): JsonResponse
{
    $user = Auth::user();
    
    $request->validate([
        'empresa_id'    => 'required|exists:empresas,id',
        'hora_recogida' => 'required|date_format:H:i'
    ]);

    $carrito = Carrito::where('user_id', $user->id)->with('productos')->first();

    if (!$carrito || $carrito->productos->isEmpty()) {
        return response()->json(['message' => 'Tu carrito está vacío.'], 400);
    }

    $productosTienda = $carrito->productos->filter(function ($producto) use ($request) {
        return (int)$producto->empresa_id === (int)$request->empresa_id;
    });

    if ($productosTienda->isEmpty()) {
        return response()->json(['message' => 'No hay productos de esta empresa.'], 422);
    }

    // --- VALIDACIÓN DE STOCK ANTES DE CREAR EL PEDIDO ---
    foreach ($productosTienda as $producto) {
        $cantidadPedida = $producto->pivot->cantidad ?? 1;
        if ($producto->stock < $cantidadPedida) {
            return response()->json([
                'message' => "Lo sentimos, no hay stock suficiente de: {$producto->nombre}. Disponible: {$producto->stock}"
            ], 422);
        }
    }

    $total = 0;
    foreach ($productosTienda as $producto) {
        $cantidad = $producto->pivot->cantidad ?? 1;
        $total += ($producto->precio ?? 0) * $cantidad;
    }

    $pedido = Pedido::create([
        'empresa_id'    => $request->empresa_id,
        'user_id'       => $user->id,
        'estado'        => 'pendiente',
        'hora_recogida' => $request->hora_recogida,
        'total'         => $total,
    ]);

    foreach ($productosTienda as $producto) {
        $cantidadPedida = $producto->pivot->cantidad ?? 1;

        // 1. Registrar en la tabla intermedia
        PedidoProducto::create([
            'pedido_id'       => $pedido->id,
            'producto_id'     => $producto->id,
            'cantidad'        => $cantidadPedida,
            'precio_unitario' => $producto->precio ?? 0,
        ]);

        // 2. RESTAR STOCK DEL PRODUCTO (Crítico)
        $producto->decrement('stock', $cantidadPedida);

        // 3. Limpiar carrito selectivamente
        $carrito->productos()->detach($producto->id);
    }

    return response()->json([
        'message' => 'Pedido generado correctamente y stock actualizado.',
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

        // Cargamos el pedido con sus productos para poder acceder al pivot (cantidad)
        $pedido = Pedido::with('productos')
            ->where('id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (!$pedido) {
            return response()->json(['message' => 'Pedido no encontrado'], 404);
        }

        if (strtolower($pedido->estado) !== 'pendiente') {
            return response()->json([
                'message' => 'No puedes cancelar un pedido que ya está: ' . $pedido->estado
            ], 400);
        }

        // --- LÓGICA DE RESTAURACIÓN DE STOCK ---
        foreach ($pedido->productos as $producto) {
            // Accedemos a la cantidad guardada en la tabla pivote
            $cantidadPedida = $producto->pivot->cantidad;
            
            // Incrementamos el stock del producto
            $producto->increment('stock', $cantidadPedida);
        }

        $pedido->update([
            'estado' => 'Cancelado'
        ]);

        return response()->json([
            'message' => 'Pedido cancelado con éxito y stock restaurado',
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