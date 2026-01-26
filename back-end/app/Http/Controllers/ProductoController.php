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
    /**
     * Obtener la empresa del usuario autenticado.
     * Método privado de apoyo para reutilizar lógica.
     */
    private function getEmpresaAutenticada()
    {
        return Empresa::where('user_id', Auth::id())->first();
    }

    /**
     * Listar productos de la empresa autenticada (Panel Administrativo).
     */
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

    /**
     * Mostrar un producto específico.
     */
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
     * Guardar un nuevo producto.
     */
    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:255',
            'precio' => 'required|numeric',
            'categoria_id' => 'required|exists:categorias,id',
            'descripcion' => 'nullable|string',
            'imagen' => 'nullable|image|max:2048',
        ]);

        $empresa = $this->getEmpresaAutenticada();

        $producto = new Producto();
        $producto->nombre = $request->nombre;
        $producto->descripcion = $request->descripcion;
        $producto->precio = $request->precio;
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
     * Actualizar un producto existente.
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
            'categoria_id' => 'required|exists:categorias,id',
            'imagen' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048'
        ]);

        $producto->fill($request->only(['nombre', 'descripcion', 'precio', 'categoria_id']));

        if ($request->hasFile('imagen')) {
            // Eliminar imagen anterior para ahorrar espacio
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

    /**
     * Eliminar un producto.
     */
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
     * Obtener productos destacados para el HOME.
     * Esta ruta calcula el promedio de estrellas y devuelve los 4 mejores.
     */
    public function destacados(): JsonResponse
    {
        try {
            // 1. Carga masiva de productos con sus relaciones
            $productos = Producto::select('id', 'nombre', 'precio', 'imagen', 'empresa_id')
                ->with(['empresa:id,nombre,logo', 'calificaciones:id,producto_id,estrellas'])
                ->get();

            $destacados = $productos->map(function ($producto) {
                // 2. Cálculo dinámico del promedio
                $promedio = $producto->calificaciones->avg('estrellas');
                $producto->calificaciones_avg_estrellas = $promedio ? round($promedio, 1) : 0;
                
                // 3. Generación de URL absoluta para el logo de la empresa
                if ($producto->empresa) {
                    $producto->empresa->logo_url = $producto->empresa->logo 
                        ? asset('storage/' . $producto->empresa->logo) 
                        : asset('images/default-logo.png'); 
                }

                // 4. Limpieza para enviar un JSON ligero
                unset($producto->calificaciones);
                
                return $producto;
            })
            // 5. Filtramos solo los que tienen calificación y tomamos los 4 mejores
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