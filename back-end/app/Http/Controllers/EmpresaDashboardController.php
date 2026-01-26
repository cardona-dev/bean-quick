<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\JsonResponse;
use App\Models\Empresa;
use App\Models\Pedido;
use App\Models\Producto;
use App\Models\Calificacion;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EmpresaDashboardController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            $user = Auth::user();
            $empresa = Empresa::where('user_id', $user->id)->first();

            if (!$empresa) {
                return response()->json(['message' => 'No tienes una empresa asociada'], 404);
            }

            $estadosExitosos = ['entregado', 'Entregado', 'ENTREGADO'];
            $hoy = Carbon::today();

            // 1. Ventas de Hoy
            $ventasHoy = Pedido::where('empresa_id', $empresa->id)
                ->whereIn('estado', $estadosExitosos)
                ->whereDate('created_at', $hoy)
                ->sum('total') ?? 0;

            // 2. Calificaciones
            $statsCalificaciones = Calificacion::whereHas('producto', function ($q) use ($empresa) {
                $q->where('empresa_id', $empresa->id);
            })->selectRaw('COUNT(*) as total, AVG(estrellas) as promedio')->first();

            // --- 3. GRÁFICO SEMANAL (Con relleno de ceros y últimos 7 días) ---
            $diasLabels = [];
            for ($i = 6; $i >= 0; $i--) {
                // Generamos los últimos 7 días terminando en "Hoy"
                $diasLabels[now()->subDays($i)->format('d/m')] = 0;
            }

            $ventasReales = Pedido::where('empresa_id', $empresa->id)
                ->whereIn('estado', $estadosExitosos)
                ->where('created_at', '>=', now()->subDays(6)->startOfDay())
                ->selectRaw('DATE_FORMAT(created_at, "%d/%m") as label, SUM(total) as total')
                ->groupBy('label')
                ->get();

            foreach ($ventasReales as $venta) {
                if (isset($diasLabels[$venta->label])) {
                    $diasLabels[$venta->label] = round(floatval($venta->total), 2);
                }
            }

            $ventasSemanalesFinal = [];
            foreach ($diasLabels as $label => $total) {
                $ventasSemanalesFinal[] = ['label' => $label, 'total' => $total];
            }

            // --- 4. GRÁFICO ANUAL ---
            $ventasAnuales = Pedido::where('empresa_id', $empresa->id)
                ->whereIn('estado', $estadosExitosos)
                ->whereYear('created_at', date('Y'))
                ->selectRaw('MONTHNAME(created_at) as label, SUM(total) as total')
                ->groupBy('label')
                ->orderByRaw('MIN(created_at)')
                ->get();

            // 5. TOP PRODUCTOS
            $topProductos = Producto::where('empresa_id', $empresa->id)
                ->withSum(['pedidos as total_unidades' => function($query) use ($estadosExitosos) {
                    $query->whereIn('estado', $estadosExitosos);
                }], 'pedido_productos.cantidad')
                ->orderBy('total_unidades', 'desc')
                ->take(5)
                ->get()
                ->map(function($p) {
                    return [
                        'nombre' => $p->nombre,
                        'ventas' => (int) ($p->total_unidades ?? 0), 
                        'imagen' => $p->imagen_url, // Usando tu accessor
                        'precio' => $p->precio
                    ];
                });

            // 6. ÚLTIMOS PEDIDOS
            $ultimosPedidos = Pedido::where('empresa_id', $empresa->id)
                ->with('cliente:id,name') 
                ->latest() 
                ->take(5)
                ->get()
                ->map(function($pedido) {
                    return [
                        'id' => $pedido->id,
                        'cliente' => $pedido->cliente->name ?? 'Cliente Anónimo', 
                        'total' => $pedido->total,
                        'estado' => $pedido->estado,
                        'hora' => $pedido->created_at->diffForHumans()
                    ];
                });

            return response()->json([
                'empresa' => $empresa, // Devuelve el modelo completo con logo_url y foto_local_url
                'stats_cards' => [
                    'ventas_hoy' => round(floatval($ventasHoy), 2),
                    'promedio_calificacion' => round($statsCalificaciones->promedio ?? 0, 1),
                    'total_calificaciones' => $statsCalificaciones->total ?? 0,
                ],
                'charts' => [
                    'ventas_semanales' => $ventasSemanalesFinal,
                    'ventas_anuales' => $ventasAnuales
                ],
                'top_productos' => $topProductos,
                'ultimos_pedidos' => $ultimosPedidos
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error en el servidor',
                'detalle' => $e->getMessage()
            ], 500);
        }
    }
    public function calificaciones(Request $request): JsonResponse
{
    try {
        $user = $request->user();
        
        // Buscamos la empresa asociada al usuario autenticado
        $empresa = \App\Models\Empresa::where('user_id', $user->id)->first();

        if (!$empresa) {
            return response()->json(['error' => 'No se encontró una empresa vinculada a este usuario.'], 404);
        }

        // Obtenemos las calificaciones de los productos de ESTA empresa
        $calificaciones = \App\Models\Calificacion::whereHas('producto', function($query) use ($empresa) {
            $query->where('empresa_id', $empresa->id);
        })
        ->with([
            'usuario:id,name', 
            'producto:id,nombre' // Agregamos el nombre del producto para saber qué calificaron
        ])
        ->latest()
        ->get();

        return response()->json($calificaciones);

    } catch (\Exception $e) {
        // Esto te ayudará a ver el error real en los logs de Laravel o en la respuesta
        return response()->json([
            'error' => 'Error interno al obtener calificaciones',
            'detalle' => $e->getMessage()
        ], 500);
    }
}
}