<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Pedido;
use App\Models\PedidoProducto;
use App\Models\Carrito;
use App\Models\Producto;
use App\Models\Empresa;
use App\Mail\PedidoCreadoMail;
use Illuminate\Support\Facades\Mail;
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
public function store(Request $request): JsonResponse
{
    $user = Auth::user();

    // Evitar múltiples pedidos pendientes sin pagar
    $pedidoExistente = Pedido::where('user_id', $user->id)
        ->where('estado', 'Pendiente')
        ->where('estado_pago', 'pendiente')
        ->first();
    
    if ($pedidoExistente) {
        return response()->json([
            'message' => 'Ya tienes un pedido pendiente de pago.',
            'pedido' => $pedidoExistente->load('productos')
        ], 200);
    }
      
    $request->validate([
        'empresa_id'    => 'required|exists:empresas,id',
        'hora_recogida' => 'required|date_format:H:i'
    ]);

    return \DB::transaction(function () use ($user, $request) {
        
        $carrito = Carrito::where('user_id', $user->id)
            ->with('productos')
            ->first();

        if (!$carrito || $carrito->productos->isEmpty()) {
            return response()->json(['message' => 'Tu carrito está vacío.'], 400);
        }

        $productosTienda = $carrito->productos->filter(function ($producto) use ($request) {
            return (int)$producto->empresa_id === (int)$request->empresa_id;
        });

        if ($productosTienda->isEmpty()) {
            return response()->json([
                'message' => 'No hay productos de esta empresa en tu carrito.'
            ], 422);
        }

        // 🔎 Validar stock (pero NO descontar aún)
        foreach ($productosTienda as $producto) {
            $cantidadPedida = $producto->pivot->cantidad ?? 1;

            if ($producto->stock < $cantidadPedida) {
                return response()->json([
                    'message' => "Stock insuficiente para: {$producto->nombre}. Disponible: {$producto->stock}"
                ], 422);
            }
        }

        // 💰 Calcular total
        $total = 0;

        foreach ($productosTienda as $producto) {
            $cantidad = $producto->pivot->cantidad ?? 1;
            $precio   = $producto->precio ?? 0;
            $total   += $precio * $cantidad;
        }

        // 🧾 Crear pedido (PENDIENTE DE PAGO)
        $pedido = Pedido::create([
            'empresa_id'    => $request->empresa_id,
            'user_id'       => $user->id,
            'estado'        => 'Pendiente',   // estado logístico
            'hora_recogida' => $request->hora_recogida,
            'total'         => $total,
            // 👇 importante si tienes campo estado_pago
            'estado_pago'   => 'pendiente'
        ]);

        // 📦 Registrar productos (SIN tocar stock)
        foreach ($productosTienda as $producto) {

            PedidoProducto::create([
                'pedido_id'       => $pedido->id,
                'producto_id'     => $producto->id,
                'cantidad'        => $producto->pivot->cantidad ?? 1,
                'precio_unitario' => $producto->precio ?? 0,
            ]);
        }
        // Enviar correo (si falla, el pedido ya fue creado)
        try {
            Mail::to($user->email)->send(new PedidoCreadoMail($pedido, $user));
        } catch (\Exception $e) {
            \Log::error('Error enviando correo de pedido: ' . $e->getMessage());
        }
        return response()->json([
            'message' => 'Pedido generado pendiente de pago.',
            'pedido'  => $pedido->load('productos')
        ], 201);
    });
}

    /**
     * Listar los pedidos del cliente logueado.
     */
    public function indexCliente(): JsonResponse
    {
        $estadosPermitidos = ['pendiente', 'pagado', 'preparando', 'listo', 'entregado', 'cancelado'];
        $pedidos = Pedido::where('user_id', Auth::id())
            ->with(['empresa', 'productos'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function($pedido) {
                $estado = strtolower($pedido->estado);
                $estado_pago = strtolower($pedido->estado_pago);
                if ($estado === 'pendiente' && $estado_pago === 'aprobado') {
                    $pedido->pedido_estado_final = 'pagado';
                } else {
                    $pedido->pedido_estado_final = $estado;
                }
                return $pedido;
            })
            ->filter(function($pedido) use ($estadosPermitidos) {
                return in_array(strtolower($pedido->pedido_estado_final), $estadosPermitidos);
            })
            ->values();
        return response()->json($pedidos);
    }

    /**
     * Listar los pedidos recibidos por la empresa logueada.
     */
    public function indexEmpresa(): JsonResponse
    {
        $user = Auth::user();
    
        $empresa = Empresa::where('user_id', $user->id)->first();
    
        if (!$empresa) {
            return response()->json([
                'message' => 'No tienes empresa asociada.'
            ], 404);
        }
    
        $pedidos = Pedido::where('empresa_id', $empresa->id)
            ->where('estado_pago', 'aprobado')
            ->with(['productos', 'cliente'])
            ->orderBy('created_at', 'asc')
            ->get();
    
        return response()->json($pedidos);
    }
    /**
     * Cancelar un pedido (Flujo de Cliente).
     */public function cancelar($id): JsonResponse
    {
        try {
            $user = Auth::user();
            // Cargamos los productos del pedido para devolver el stock
            $pedido = Pedido::where('id', $id)
                ->where('user_id', $user->id)
                ->with('productos')
                ->first();

            if (!$pedido) return response()->json(['message' => 'Pedido no encontrado'], 404);

            if (strtolower($pedido->estado) !== 'pendiente') {
                return response()->json(['message' => 'No puedes cancelar un pedido ' . $pedido->estado], 400);
            }

            \DB::transaction(function () use ($pedido) {
            
                // Solo devolver stock si ya estaba pagado
                if ($pedido->estado_pago === 'aprobado') {
                    foreach ($pedido->productos as $producto) {
                        $producto->increment('stock', $producto->pivot->cantidad);
                    }
                }
            
                $pedido->update([
                    'estado' => 'Cancelado',
                    'estado_pago' => 'rechazado'
                ]);
            });

            return response()->json(['message' => 'Pedido cancelado y stock devuelto']);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Error', 'error' => $e->getMessage()], 500);
        }
    }
    /**
     * Actualizar el estado del pedido (Flujo de Empresa).
     */
    public function actualizarEstado(Request $request, $id): JsonResponse
{
    $request->validate([
        'estado' => 'required|in:Preparando,Listo,Entregado,Cancelado'
    ]);

    try {
        $empresa = Empresa::where('user_id', Auth::id())->first();
        $pedido = Pedido::find($id);

        if (!$empresa || !$pedido || (int) $pedido->empresa_id !== (int) $empresa->id) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        // BLOQUEO: no permitir modificar si no está pagado
                if ($pedido->estado_pago !== 'aprobado') {
                    return response()->json([
                        'message' => 'No puedes modificar un pedido que no ha sido pagado.'
                    ], 400);
                }
        
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