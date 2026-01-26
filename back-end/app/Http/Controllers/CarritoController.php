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
        $carrito = Carrito::firstOrCreate(['user_id' => $user->id]);
        
        $carritoProducto = $carrito->productos()->where('producto_id', $productoId)->first();
    
        if ($carritoProducto) {
            // Lógica de suma: cantidad actual en base de datos + cantidad nueva del request
            $nuevaCantidad = $carritoProducto->pivot->cantidad + $request->cantidad;
            $carrito->productos()->updateExistingPivot($productoId, ['cantidad' => $nuevaCantidad]);
        } else {
            // Vinculación inicial
            $carrito->productos()->attach($productoId, ['cantidad' => $request->cantidad]);
        }
    
        return response()->json([
            'message' => 'Producto agregado al carrito correctamente.',
            'productos' => $carrito->productos()->with(['empresa'])->withPivot('cantidad')->get()
        ]);
    }

    /**
     * FUNCIÓN ACTUALIZAR:
     * Modifica directamente la cantidad de un producto específico que ya está en el carrito.
     */
    public function actualizar(Request $request, $productoId): JsonResponse
    {
        $request->validate(['cantidad' => 'required|integer|min:1']);

        $carrito = Carrito::where('user_id', Auth::id())->first();

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