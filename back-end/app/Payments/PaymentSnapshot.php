<?php

namespace App\Payments;

final class PaymentSnapshot
{
    public function __construct(
        public readonly string $status,
        public readonly ?string $externalReference,
    ) {
    }
}
