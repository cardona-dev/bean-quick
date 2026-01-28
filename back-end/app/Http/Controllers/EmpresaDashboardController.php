<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

use App\Models\Empresa;
use App\Models\Pedido;
use App\Models\Producto;
use App\Models\Calificacion;

use Barryvdh\DomPDF\Facade\Pdf;

class EmpresaDashboardController extends Controller
{
    /**
     * ============================
     * MÉTODO PRIVADO REUTILIZABLE
     * ============================
     */
    private function obtenerDatosDashboard($user): array
    {
        $empresa = Empresa::where('user_id', $user->id)->first();

        if (!$empresa) {
            throw new \Exception('No tienes una empresa asociada');
        }

        $estadosExitosos = ['entregado', 'Entregado', 'ENTREGADO'];
        $hoy = Carbon::today();

        /* =====================
         * VENTAS HOY
         * ===================== */
        $ventasHoy = Pedido::where('empresa_id', $empresa->id)
            ->whereIn('estado', $estadosExitosos)
            ->whereDate('created_at', $hoy)
            ->sum('total') ?? 0;

        /* =====================
         * CALIFICACIONES
         * ===================== */
        $statsCalificaciones = Calificacion::whereHas('producto', function ($q) use ($empresa) {
            $q->where('empresa_id', $empresa->id);
        })
        ->selectRaw('COUNT(*) as total, AVG(estrellas) as promedio')
        ->first();

        /* =====================
         * VENTAS SEMANALES
         * ===================== */
        $diasLabels = [];
        for ($i = 6; $i >= 0; $i--) {
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
                $diasLabels[$venta->label] = round((float)$venta->total, 2);
            }
        }

        $ventasSemanalesFinal = [];
        foreach ($diasLabels as $label => $total) {
            $ventasSemanalesFinal[] = [
                'label' => $label,
                'total' => $total
            ];
        }

        /* =====================
         * VENTAS ANUALES
         * ===================== */
        $ventasAnuales = Pedido::where('empresa_id', $empresa->id)
            ->whereIn('estado', $estadosExitosos)
            ->whereYear('created_at', date('Y'))
            ->selectRaw('MONTHNAME(created_at) as label, SUM(total) as total')
            ->groupBy('label')
            ->orderByRaw('MIN(created_at)')
            ->get();

        /* =====================
         * TOP PRODUCTOS
         * ===================== */
        $topProductos = Producto::where('empresa_id', $empresa->id)
            ->withSum(['pedidos as total_unidades' => function ($query) use ($estadosExitosos) {
                $query->whereIn('estado', $estadosExitosos);
            }], 'pedido_productos.cantidad')
            ->orderBy('total_unidades', 'desc')
            ->take(5)
            ->get()
            ->map(function ($p) {
                return [
                    'nombre' => $p->nombre,
                    'ventas' => (int)($p->total_unidades ?? 0),
                    'imagen' => $p->imagen_url,
                    'precio' => $p->precio
                ];
            });

        /* =====================
         * ÚLTIMOS PEDIDOS
         * ===================== */
        $ultimosPedidos = Pedido::where('empresa_id', $empresa->id)
            ->with('cliente:id,name')
            ->latest()
            ->take(5)
            ->get()
            ->map(function ($pedido) {
                return [
                    'id' => $pedido->id,
                    'cliente' => $pedido->cliente->name ?? 'Cliente Anónimo',
                    'total' => $pedido->total,
                    'estado' => $pedido->estado,
                    'hora' => $pedido->created_at->diffForHumans()
                ];
            });

        return [
            'empresa' => $empresa,
            'stats_cards' => [
                'ventas_hoy' => round((float)$ventasHoy, 2),
                'promedio_calificacion' => round($statsCalificaciones->promedio ?? 0, 1),
                'total_calificaciones' => $statsCalificaciones->total ?? 0,
            ],
            'charts' => [
                'ventas_semanales' => $ventasSemanalesFinal,
                'ventas_anuales' => $ventasAnuales
            ],
            'top_productos' => $topProductos,
            'ultimos_pedidos' => $ultimosPedidos
        ];
    }

    /**
     * ============================
     * DASHBOARD (API JSON)
     * ============================
     */
    public function index(): JsonResponse
    {
        try {
            $data = $this->obtenerDatosDashboard(Auth::user());
            return response()->json($data);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error en el servidor',
                'detalle' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * ============================
     * PDF DEL DASHBOARD
     * ============================
     */
    public function descargarReporte(Request $request)
{
    $user = $request->user();

    if (!$user) {
        abort(401, 'No autenticado');
    }

    // 👇 reutilizamos EXACTAMENTE los mismos datos del dashboard
    $data = $this->obtenerDatosDashboard($user);

    $pdf = Pdf::loadView('pdf.dashboard_empresa', [
        'data' => $data
    ])->setPaper('a4', 'portrait');

    return $pdf->download('reporte-dashboard-empresa.pdf');
}



    /**
     * ============================
     * CALIFICACIONES
     * ============================
     */
    public function calificaciones(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $empresa = Empresa::where('user_id', $user->id)->first();

            if (!$empresa) {
                return response()->json([
                    'error' => 'No se encontró una empresa vinculada a este usuario.'
                ], 404);
            }

            $calificaciones = Calificacion::whereHas('producto', function ($query) use ($empresa) {
                $query->where('empresa_id', $empresa->id);
            })
            ->with([
                'usuario:id,name',
                'producto:id,nombre'
            ])
            ->latest()
            ->get();

            return response()->json($calificaciones);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error interno al obtener calificaciones',
                'detalle' => $e->getMessage()
            ], 500);
        }
    }
}
