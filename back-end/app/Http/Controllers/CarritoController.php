<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Carrito;
use App\Models\Producto;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\JsonResponse;

class CarritoController extends Controller
{
    /**
     * FUNCIÓN INDEX:
     * Obtiene el carrito del usuario. Si no existe, lo crea en el momento (firstOrCreate).
     * Devuelve los productos con su respectiva empresa y la cantidad guardada en la tabla pivote.
     */
    public function index()
    {
        $user = Auth::user();
        $carrito = Carrito::firstOrCreate(['user_id' => $user->id]);

        $productos = $carrito->productos()
            ->with('empresa') // Carga la información de la tienda que vende el producto
            ->withPivot('cantidad') // Trae la columna 'cantidad' de la tabla intermedia
            ->get()
            ->map(function ($producto) {
                // Asegura que el precio sea tratado como un número decimal (float) en el JSON
                $producto->precio = (float) $producto->precio;
                return $producto;
            });

        return response()->json($productos);
    }

    /**
     * FUNCIÓN AGREGAR:
     * Si el producto ya está en el carrito, suma la nueva cantidad a la existente.
     * Si no está, lo vincula por primera vez usando attach().
 */
public function agregar(Request $request, $productoId): JsonResponse
{
    $request->validate([
        'cantidad' => 'required|integer|min:1'
    ]);

    $user = Auth::user();
    $producto = Producto::findOrFail($productoId); // Buscamos el producto real
    $carrito = Carrito::firstOrCreate(['user_id' => $user->id]);
    
    $carritoProducto = $carrito->productos()->where('producto_id', $productoId)->first();
    
    // Calculamos cuánto quiere tener el usuario en total
    $cantidadActualEnCarrito = $carritoProducto ? $carritoProducto->pivot->cantidad : 0;
    $totalDeseado = $cantidadActualEnCarrito + $request->cantidad;

    // VALIDACIÓN CRÍTICA: ¿Supera el stock de la base de datos?
    if ($totalDeseado > $producto->stock) {
        return response()->json([
            'message' => "No puedes agregar más. Stock disponible: {$producto->stock}. Ya tienes {$cantidadActualEnCarrito} en el carrito."
        ], 422); // Error de validación
    }

    if ($carritoProducto) {
        $carrito->productos()->updateExistingPivot($productoId, ['cantidad' => $totalDeseado]);
    } else {
        $carrito->productos()->attach($productoId, ['cantidad' => $request->cantidad]);
    }

    return response()->json([
        'message' => 'Producto agregado al carrito correctamente.',
        'productos' => $carrito->productos()->with(['empresa'])->withPivot('cantidad')->get()
    ]);
}

/**
 * FUNCIÓN ACTUALIZAR reforzada (para cuando mueven el + o - en el carrito)
 */
public function actualizar(Request $request, $productoId): JsonResponse
{
    $request->validate(['cantidad' => 'required|integer|min:1']);
    
    $producto = Producto::findOrFail($productoId);
    $carrito = Carrito::where('user_id', Auth::id())->first();

    // VALIDACIÓN: No permitir subir más del stock
    if ($request->cantidad > $producto->stock) {
        return response()->json([
            'message' => "Solo hay {$producto->stock} unidades disponibles."
        ], 422);
    }

    if ($carrito) {
        $carrito->productos()->updateExistingPivot($productoId, [
            'cantidad' => $request->cantidad,
        ]);
    }

    return response()->json([
        'message' => 'Cantidad actualizada correctamente.',
        'productos' => $carrito->productos()->with(['empresa'])->withPivot('cantidad')->get()
    ]);
}

    /**
     * FUNCIÓN ELIMINAR:
     * Quita un producto específico del carrito usando detach().
     */
    public function eliminar($productoId): JsonResponse
    {
        $carrito = Carrito::where('user_id', Auth::id())->first();

        if ($carrito) {
            $carrito->productos()->detach($productoId);
        }

        return response()->json([
            'message' => 'Producto eliminado del carrito.',
            'productos' => $carrito->productos()->with(['empresa'])->withPivot('cantidad')->get()
        ]);
    }

    /**
     * FUNCIÓN VACIAR:
     * Elimina todas las relaciones del carrito (lo deja limpio) sin borrar el carrito en sí.
     */
    public function vaciar(): JsonResponse
    {
        $carrito = Carrito::where('user_id', Auth::id())->first();

        if ($carrito) {
            $carrito->productos()->detach(); // Al no pasar ID, quita todos los productos vinculados
        }

        return response()->json([
            'message' => 'Carrito vaciado correctamente.',
            'productos' => []
        ]);
    }
}