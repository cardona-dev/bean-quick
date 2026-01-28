<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Producto;
use App\Models\Empresa;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\JsonResponse;

class ProductoController extends Controller
{
    private function getEmpresaAutenticada()
    {
        return Empresa::where('user_id', Auth::id())->first();
    }

    public function index(): JsonResponse
    {
        $empresa = $this->getEmpresaAutenticada();

        if (!$empresa) {
            return response()->json(['message' => 'No tienes una empresa vinculada.'], 404);
        }

        $productos = Producto::where('empresa_id', $empresa->id)
            ->with('categoria')
            ->get();

        return response()->json($productos);
    }

    public function show($id): JsonResponse
    {
        $empresa = $this->getEmpresaAutenticada();
        
        $producto = Producto::where('id', $id)
            ->where('empresa_id', $empresa->id)
            ->first();

        if (!$producto) {
            return response()->json(['message' => 'Producto no encontrado.'], 404);
        }

        return response()->json($producto);
    }

    /**
     * Guardar un nuevo producto con STOCK.
     */
    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:255',
            'precio' => 'required|numeric|min:0',
            'stock' => 'required|integer|min:0', // <--- Validación de stock
            'categoria_id' => 'required|exists:categorias,id',
            'descripcion' => 'nullable|string',
            'imagen' => 'nullable|image|max:2048',
        ]);

        $empresa = $this->getEmpresaAutenticada();

        $producto = new Producto();
        $producto->nombre = $request->nombre;
        $producto->descripcion = $request->descripcion;
        $producto->precio = $request->precio;
        $producto->stock = $request->stock; // <--- Guardamos el stock
        $producto->empresa_id = $empresa->id;
        $producto->categoria_id = $request->categoria_id;

        if ($request->hasFile('imagen')) {
            $producto->imagen = $request->file('imagen')->store('productos', 'public');
        }

        $producto->save();

        return response()->json([
            'message' => 'Producto creado con éxito',
            'producto' => $producto
        ], 201);
    }

    /**
     * Actualizar producto incluyendo STOCK.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $empresa = $this->getEmpresaAutenticada();
        $producto = Producto::where('id', $id)->where('empresa_id', $empresa->id)->first();

        if (!$producto) {
            return response()->json(['message' => 'Producto no encontrado.'], 404);
        }

        $request->validate([
            'nombre' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'precio' => 'required|numeric|min:0',
            'stock' => 'required|integer|min:0', // <--- Validación en update
            'categoria_id' => 'required|exists:categorias,id',
            'imagen' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048'
        ]);

        // Añadimos 'stock' al fill para actualización masiva
        $producto->fill($request->only(['nombre', 'descripcion', 'precio', 'categoria_id', 'stock']));

        if ($request->hasFile('imagen')) {
            if ($producto->imagen) {
                Storage::disk('public')->delete($producto->imagen);
            }
            $producto->imagen = $request->file('imagen')->store('productos', 'public');
        }

        $producto->save();

        return response()->json([
            'message' => 'Producto actualizado correctamente.',
            'producto' => $producto
        ]);
    }

    public function destroy($id): JsonResponse
    {
        $empresa = $this->getEmpresaAutenticada();
        $producto = Producto::where('id', $id)->where('empresa_id', $empresa->id)->first();

        if (!$producto) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        if ($producto->imagen) {
            Storage::disk('public')->delete($producto->imagen);
        }

        $producto->delete();

        return response()->json(['message' => 'Producto eliminado correctamente.']);
    }

    /**
     * Obtener productos destacados (Solo si tienen STOCK).
     */
    public function destacados(): JsonResponse
    {
        try {
            $productos = Producto::select('id', 'nombre', 'precio', 'imagen', 'empresa_id', 'stock')
                ->where('stock', '>', 0) // <--- Solo mostramos lo que hay disponible
                ->with(['empresa:id,nombre,logo', 'calificaciones:id,producto_id,estrellas'])
                ->get();

            $destacados = $productos->map(function ($producto) {
                $promedio = $producto->calificaciones->avg('estrellas');
                $producto->calificaciones_avg_estrellas = $promedio ? round($promedio, 1) : 0;
                
                if ($producto->empresa) {
                    $producto->empresa->logo_url = $producto->empresa->logo 
                        ? asset('storage/' . $producto->empresa->logo) 
                        : asset('images/default-logo.png'); 
                }

                unset($producto->calificaciones);
                return $producto;
            })
            ->filter(fn($p) => $p->calificaciones_avg_estrellas > 0)
            ->sortByDesc('calificaciones_avg_estrellas')
            ->take(4) 
            ->values();

            return response()->json($destacados);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al procesar destacados',
                'details' => $e->getMessage()
            ], 500);
        }
    }
}