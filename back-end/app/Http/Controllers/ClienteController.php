<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Empresa;
use App\Models\Calificacion;
use App\Models\Producto;
use App\Models\Categoria;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Http\JsonResponse;

class ClienteController extends Controller
{
    /**
     * ACTUALIZAR PERFIL (Nombre, Email y Contraseña)
     * Este método se conecta con tu interfaz de PerfilUsuario.js
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = Auth::user();

        // Validamos los datos según lo que se reciba
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|max:255|unique:users,email,' . $user->id,
            'current_password' => 'required_with:password|current_password', // Valida que la contraseña actual sea correcta
            'password' => ['sometimes', 'confirmed', Password::defaults()],
        ], [
            'current_password.current_password' => 'La contraseña actual no es correcta.',
            'password.confirmed' => 'La confirmación de la nueva contraseña no coincide.',
            'email.unique' => 'Este correo electrónico ya está en uso.'
        ]);

        // Actualizar Nombre
        if ($request->has('name')) {
            $user->name = $request->name;
        }

        // Actualizar Email
        if ($request->has('email')) {
            $user->email = $request->email;
        }

        // Actualizar Contraseña
        if ($request->has('password')) {
            $user->password = Hash::make($request->password);
        }

        $user->save();

        return response()->json([
            'message' => 'Perfil actualizado correctamente',
            'user' => $user
        ]);
    }

    /**
     * Dashboard del cliente con productos destacados y promedios.
     */
    public function dashboard(): JsonResponse
    {
        $user = Auth::user();

        $productosDestacados = Producto::select('productos.*', DB::raw('COALESCE(SUM(pedido_productos.cantidad), 0) as total_vendido'))
            ->leftJoin('pedido_productos', 'productos.id', '=', 'pedido_productos.producto_id')
            ->with('empresa')
            ->withAvg('calificaciones', 'estrellas')
            ->groupBy('productos.id') 
            ->orderBy('total_vendido', 'DESC')
            ->limit(8)
            ->get();

        return response()->json([
            'user' => $user,
            'productosDestacados' => $productosDestacados
        ]);
    }

    public function showEmpresa($id)
    {
        $empresa = Empresa::find($id);
        if (!$empresa) {
            return response()->json(['message' => 'Empresa no encontrada'], 404);
        }
        return response()->json($empresa);
    }

    public function indexEmpresas(): JsonResponse
    {
        return response()->json(Empresa::all());
    }

    public function productosPorEmpresa(Request $request, $id): JsonResponse
    {
        $userId = Auth::guard('sanctum')->id(); 

        $query = Producto::where('empresa_id', $id)
            ->withAvg('calificaciones', 'estrellas');

        if ($userId) {
            $query->withExists(['calificaciones as ya_calificado' => function($q) use ($userId) {
                $q->where('user_id', $userId);
            }]);
        }

        $productos = $query->with('categoria')->get();

        return response()->json([
            'empresa' => Empresa::findOrFail($id),
            'productos' => $productos,
            'categorias' => \App\Models\Categoria::all()
        ]);
    }

    public function calificar(Request $request): JsonResponse
    {
        $request->validate([
            'producto_id' => 'required|exists:productos,id',
            'estrellas'   => 'required|integer|min:1|max:5',
        ]);

        $userId = auth()->id();

        $yaCalifico = Calificacion::where('user_id', $userId)
                                    ->where('producto_id', $request->producto_id)
                                    ->exists();

        if ($yaCalifico) {
            return response()->json(['message' => 'Ya calificaste este producto.'], 403);
        }

        Calificacion::create([
            'user_id'     => $userId, 
            'producto_id' => $request->producto_id,
            'pedido_id'   => $request->pedido_id,
            'estrellas'   => $request->estrellas,
            'comentario'  => $request->comentario,
        ]);

        return response()->json(['message' => 'Calificación guardada correctamente']);
    }
    public function misCalificaciones(): JsonResponse
{
    try {
        $userId = auth()->id();
        
        // Cargamos las calificaciones del usuario logueado
        $calificaciones = Calificacion::where('user_id', $userId)
            ->with(['producto.empresa']) // Carga producto y la empresa de ese producto
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($calificaciones);
    } catch (\Exception $e) {
        // Esto te ayudará a ver el error real en los logs de Laravel (storage/logs/laravel.log)
        return response()->json([
            'error' => 'Error interno en el servidor',
            'message' => $e->getMessage()
        ], 500);
    }
}
}