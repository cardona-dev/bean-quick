<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Carrito;
use App\Models\Producto;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\JsonResponse;

class CarritoController extends Controller
{
    // Carga los productos y nos asegura que React reciba el stock actual
    public function index()
    {
        $user = Auth::user();
        $carrito = Carrito::firstOrCreate(['user_id' => $user->id]);

        $productos = $carrito->productos()
            ->with('empresa')
            ->withPivot('cantidad')
            ->get()
            ->map(function ($producto) {
                $producto->precio = (float) $producto->precio;
                // Nos aseguramos que el stock sea un entero para las validaciones en React
                $producto->stock = (int) $producto->stock; 
                return $producto;
            });

        return response()->json($productos);
    }

    public function agregar(Request $request, $productoId): JsonResponse
    {
        $request->validate(['cantidad' => 'required|integer|min:1']);
    
        //  cargamos la empresa junto al producto
        $producto = Producto::with('empresa')->findOrFail($productoId);
    
        //  BLOQUEO: empresa cerrada
        if (!$producto->empresa->is_open) {
            return response()->json([
                'error' => 'Esta tienda está cerrada actualmente.'
            ], 403);
        }
    
        $user = Auth::user();
        $carrito = Carrito::firstOrCreate(['user_id' => $user->id]);

        $otraCafeteria = $carrito->productos()
            ->where('productos.empresa_id', '!=', $producto->empresa_id)
            ->exists();

        if ($otraCafeteria) {
            return response()->json([
                'message' => 'Solo puedes agregar productos de una sola cafetería. Vacía el carrito para cambiar de empresa.',
            ], 422);
        }

        $carritoProducto = $carrito->productos()->where('producto_id', $productoId)->first();
        $cantidadActual = $carritoProducto ? $carritoProducto->pivot->cantidad : 0;
        $nuevaCantidad = $cantidadActual + $request->cantidad;
    
        if ($producto->stock < $nuevaCantidad) {
            return response()->json([
                'error' => "Lo sentimos, solo quedan {$producto->stock} unidades disponibles."
            ], 422);
        }
    
        if ($carritoProducto) {
            $carrito->productos()->updateExistingPivot($productoId, ['cantidad' => $nuevaCantidad]);
        } else {
            $carrito->productos()->attach($productoId, ['cantidad' => $request->cantidad]);
        }
    
        return response()->json([
            'message' => 'Producto agregado.',
            'productos' => $this->obtenerProductosCarrito($carrito)
        ]);
    }


    public function actualizar(Request $request, $productoId): JsonResponse
    {
        $request->validate(['cantidad' => 'required|integer|min:1']);
    
        // cargamos empresa
        $producto = Producto::with('empresa')->findOrFail($productoId);
    
        // BLOQUEO: empresa cerrada
        if (!$producto->empresa->is_open) {
            return response()->json([
                'error' => 'No puedes modificar productos de una tienda cerrada.'
            ], 403);
        }
    
        if ($producto->stock < $request->cantidad) {
            return response()->json(['error' => "Stock insuficiente."], 422);
        }
    
        $carrito = Carrito::where('user_id', Auth::id())->first();
        if ($carrito) {
            $carrito->productos()->updateExistingPivot($productoId, ['cantidad' => $request->cantidad]);
        }
    
        return response()->json([
            'message' => 'Cantidad actualizada.',
            'productos' => $this->obtenerProductosCarrito($carrito)
        ]);
    }


    // --- FUNCIÓN AUXILIAR PARA NO REPETIR CÓDIGO ---
    private function obtenerProductosCarrito($carrito) {
        return $carrito->productos()
            ->with('empresa')
            ->withPivot('cantidad')
            ->get()
            ->map(function ($p) {
                $p->precio = (float) $p->precio;
                $p->stock = (int) $p->stock;
                return $p;
            });
    }

    public function eliminar($productoId): JsonResponse
    {
        $carrito = Carrito::where('user_id', Auth::id())->first();
        if ($carrito) $carrito->productos()->detach($productoId);

        return response()->json([
            'message' => 'Eliminado.',
            'productos' => $this->obtenerProductosCarrito($carrito)
        ]);
    }

    public function vaciar(): JsonResponse
    {
        $carrito = Carrito::where('user_id', Auth::id())->first();
        if ($carrito) $carrito->productos()->detach();

        return response()->json(['message' => 'Vaciado.', 'productos' => []]);
    }
}