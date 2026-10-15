<?php

namespace App\Payments;

interface PaymentLookup
{
    public function find(string $paymentId): ?PaymentSnapshot;
}
