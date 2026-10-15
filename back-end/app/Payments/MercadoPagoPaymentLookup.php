<?php

namespace App\Payments;

use MercadoPago\Client\Payment\PaymentClient;
use MercadoPago\MercadoPagoConfig;

class MercadoPagoPaymentLookup implements PaymentLookup
{
    public function find(string $paymentId): ?PaymentSnapshot
    {
        MercadoPagoConfig::setAccessToken((string) config('services.mercadopago.access_token'));
        $payment = (new PaymentClient())->get($paymentId);

        return new PaymentSnapshot(
            (string) ($payment->status ?? ''),
            $payment->external_reference !== null ? (string) $payment->external_reference : null,
        );
    }
}
