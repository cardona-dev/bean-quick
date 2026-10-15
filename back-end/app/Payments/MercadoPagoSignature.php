<?php

namespace App\Payments;

use Illuminate\Http\Request;

/**
 * Mercado Pago webhook manifest:
 * id:{data.id};request-id:{x-request-id};ts:{ts};
 * signed with HMAC-SHA256 using the webhook secret.
 */
class MercadoPagoSignature
{
    public function valid(Request $request): bool
    {
        $secret = (string) config('services.mercadopago.webhook_secret');
        if ($secret === '') {
            return false;
        }

        $parsed = $this->parseSignature((string) $request->header('x-signature'));
        $requestId = (string) $request->header('x-request-id');
        $dataId = $this->dataId($request);

        if ($parsed === null || $requestId === '' || $dataId === '') {
            return false;
        }

        $manifest = 'id:'.$dataId.';request-id:'.$requestId.';ts:'.$parsed['ts'].';';
        $expected = hash_hmac('sha256', $manifest, $secret);

        return hash_equals($expected, $parsed['v1']);
    }

    private function parseSignature(string $header): ?array
    {
        $parts = [];
        foreach (explode(',', $header) as $chunk) {
            $pair = explode('=', trim($chunk), 2);
            if (count($pair) === 2 && $pair[0] !== '') {
                $parts[$pair[0]] = $pair[1];
            }
        }

        if (empty($parts['ts']) || empty($parts['v1'])) {
            return null;
        }

        return ['ts' => $parts['ts'], 'v1' => $parts['v1']];
    }

    private function dataId(Request $request): string
    {
        $fromQueryData = $request->query('data');
        $candidates = [
            $request->query('data_id'),
            $request->query('data.id'),
            is_array($fromQueryData) ? ($fromQueryData['id'] ?? null) : null,
            $request->input('data.id'),
            $request->input('data_id'),
        ];

        foreach ($candidates as $value) {
            if ($value !== null && $value !== '') {
                return strtolower((string) $value);
            }
        }

        return '';
    }
}
