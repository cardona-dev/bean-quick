<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Reporte Dashboard</title>

    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 12px;
            color: #333;
        }

        h1 {
            margin-bottom: 5px;
        }

        h2 {
            margin-top: 25px;
            margin-bottom: 10px;
        }

        .resumen p {
            margin: 4px 0;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }

        th, td {
            border: 1px solid #ccc;
            padding: 6px;
        }

        th {
            background-color: #f2f2f2;
        }

        .text-right {
            text-align: right;
        }
    </style>
</head>
<body>

    {{-- TITULO --}}
    <h1>
        Reporte Dashboard - {{ $data['empresa']->nombre }}
    </h1>

    <p style="font-size: 11px; color: #666; margin-top: 2px; text-align: right;">
    Generado el {{ \Carbon\Carbon::now()->format('d/m/Y H:i') }}
    </p>

    {{-- RESUMEN --}}
    <div class="resumen">
        <p>
            <strong>Ventas hoy:</strong>
            ${{ number_format($data['stats_cards']['ventas_hoy']) }}
        </p>

        <p>
            <strong>Calificación promedio:</strong>
            {{ $data['stats_cards']['promedio_calificacion'] }} ⭐
        </p>

        <p>
            <strong>Total calificaciones:</strong>
            {{ $data['stats_cards']['total_calificaciones'] }}
        </p>
    </div>

    {{-- TOP PRODUCTOS --}}
    <h2>Top Productos</h2>

    <table>
        <thead>
            <tr>
                <th>Producto</th>
                <th>Ventas</th>
                <th>Precio</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($data['top_productos'] as $producto)
                <tr>
                    <td>{{ $producto['nombre'] }}</td>
                    <td class="text-right">{{ $producto['ventas'] }}</td>
                    <td class="text-right">
                        ${{ number_format($producto['precio']) }}
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="3">No hay productos</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    {{-- ULTIMOS PEDIDOS --}}
    <h2>Últimos Pedidos</h2>

    <table>
        <thead>
            <tr>
                <th>Cliente</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Hora</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($data['ultimos_pedidos'] as $pedido)
                <tr>
                    <td>{{ $pedido['cliente'] }}</td>
                    <td class="text-right">
                        ${{ number_format($pedido['total']) }}
                    </td>
                    <td>{{ ucfirst($pedido['estado']) }}</td>
                    <td>{{ $pedido['hora'] }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="4">No hay pedidos recientes</td>
                </tr>
            @endforelse
        </tbody>
    </table>

</body>
</html>
