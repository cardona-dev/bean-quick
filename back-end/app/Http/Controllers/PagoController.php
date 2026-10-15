<?php

namespace App\Http\Controllers;

use App\Models\Pedido;
use App\Payments\MercadoPagoSignature;
use App\Payments\PaymentLookup;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use MercadoPago\Client\Preference\PreferenceClient;
use MercadoPago\MercadoPagoConfig;

class PagoController extends Controller
{
    public function pagar($id)
    {
        $pedido = Pedido::findOrFail($id);

        if ($pedido->user_id !== auth()->id()) {
            return response()->json([
                'message' => 'No autorizado para pagar este pedido.'
            ], 403);
        }

        if ($pedido->estado_pago === 'aprobado') {
            return response()->json([
                'message' => 'Este pedido ya fue pagado.'
            ], 400);
        }

        // Siempre que vaya a pagar, lo marcamos como pendiente
        $pedido->estado_pago = 'pendiente';
        $pedido->save();

        $token = config('services.mercadopago.access_token');
        MercadoPagoConfig::setAccessToken($token);

        $client = new PreferenceClient();

        $preference = $client->create([
            "items" => [
                [
                    "title" => "Pedido BeanQuick #" . $pedido->id,
                    "quantity" => 1,
                    "unit_price" => (float) $pedido->total
                ]
            ],
            "external_reference" => (string) $pedido->id,
            "notification_url" => env('WEBHOOK_URL'),
            "back_urls" => [
                "success" => env('APP_FRONTEND_URL') . "/pago-exitoso",
                "failure" => env('APP_FRONTEND_URL') . "/pago-fallido",
                "pending" => env('APP_FRONTEND_URL') . "/pago-pendiente"
            ],
            "auto_return" => "approved",
        ]);

        return response()->json([
            "init_point" => $preference->init_point
        ]);
    }

    public function webhook(Request $request, MercadoPagoSignature $signature, PaymentLookup $payments)
    {
        if (!$signature->valid($request)) {
            Log::warning('Webhook Mercado Pago rechazado: firma inválida', [
                'ip' => $request->ip(),
            ]);

            return response()->json(['message' => 'Firma inválida'], 401);
        }

        $topic = $request->input('type') ?? $request->input('topic');
        if ($topic !== 'payment') {
            return response()->json(['ok' => true]);
        }

        $paymentId = $request->input('data.id')
            ?? $request->input('data_id')
            ?? $request->query('data_id');

        if (!$paymentId) {
            return response()->json(['ok' => true]);
        }

        try {
            $payment = $payments->find((string) $paymentId);
        } catch (\Throwable $e) {
            Log::error('Webhook Mercado Pago: consulta del pago fallida', [
                'payment_id' => $paymentId,
                'message' => $e->getMessage(),
            ]);

            return response()->json(['ok' => true]);
        }

        if (!$payment || !$payment->externalReference) {
            return response()->json(['ok' => true]);
        }

        $pedido = Pedido::with('productos')->find($payment->externalReference);
        if (!$pedido) {
            return response()->json(['ok' => true]);
        }

        $nuevoEstado = match ($payment->status) {
            'approved' => 'aprobado',
            'pending', 'in_process' => 'pendiente',
            'rejected', 'cancelled' => 'rechazado',
            'refunded', 'charged_back' => 'reembolsado',
            default => null,
        };

        if ($nuevoEstado === null || $pedido->estado_pago === $nuevoEstado) {
            return response()->json(['ok' => true]);
        }

        DB::transaction(function () use ($pedido, $nuevoEstado) {
            $pedido->estado_pago = $nuevoEstado;
            $pedido->save();

            if ($nuevoEstado !== 'aprobado') {
                return;
            }

            $pedido->estado = 'Pagado';
            $pedido->save();

            foreach ($pedido->productos as $producto) {
                $producto->decrement('stock', $producto->pivot->cantidad);
            }

            $carrito = \App\Models\Carrito::where('user_id', $pedido->user_id)->first();
            if ($carrito) {
                $carrito->productos()->detach();
            }
        });

        Log::info('Pedido actualizado por webhook de pago', [
            'pedido_id' => $pedido->id,
            'nuevo_estado' => $nuevoEstado,
        ]);

        return response()->json(['ok' => true]);
    }
}