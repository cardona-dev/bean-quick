<?php

use App\Models\Categoria;
use App\Models\Empresa;
use App\Models\Pedido;
use App\Models\Producto;
use App\Models\User;
use App\Payments\PaymentLookup;
use App\Payments\PaymentSnapshot;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

function cafeConUsuario(string $email): array
{
    $user = User::factory()->create([
        'email' => $email,
        'rol' => 'empresa',
    ]);

    $empresa = Empresa::query()->create([
        'user_id' => $user->id,
        'nombre' => 'Cafe '.$email,
    ]);

    return [$user, $empresa];
}

function productoDe(Empresa $empresa, Categoria $categoria, string $nombre, int $stock): Producto
{
    return Producto::query()->create([
        'empresa_id' => $empresa->id,
        'categoria_id' => $categoria->id,
        'nombre' => $nombre,
        'precio' => 8,
        'stock' => $stock,
    ]);
}

function firmaMercadoPago(string $dataId, string $secret, ?string $v1 = null): array
{
    $requestId = 'req-beanquick-1';
    $ts = '1700000000';
    $manifest = "id:{$dataId};request-id:{$requestId};ts:{$ts};";
    $hash = $v1 ?? hash_hmac('sha256', $manifest, $secret);

    return [
        'x-request-id' => $requestId,
        'x-signature' => "ts={$ts},v1={$hash}",
    ];
}

test('public register with rol=admin creates a cliente and stores a password hash', function () {
    $password = 'Segura123';

    $response = $this->postJson('/api/register', [
        'name' => 'Ana Cliente',
        'email' => 'ana@example.com',
        'password' => $password,
        'password_confirmation' => $password,
        'rol' => 'admin',
    ]);

    $response->assertCreated();
    $response->assertJsonPath('user.rol', 'cliente');

    $user = User::query()->where('email', 'ana@example.com')->first();
    expect($user)->not->toBeNull()
        ->and($user->rol)->toBe('cliente')
        ->and($user->password)->not->toBe($password)
        ->and(Hash::check($password, $user->password))->toBeTrue();

    $this->withToken($response->json('token'))
        ->postJson('/api/admin/categorias', ['nombre' => 'Bebidas'])
        ->assertForbidden();
});

test('a guest receives 401 on the client cart', function () {
    $this->getJson('/api/cliente/carrito')->assertUnauthorized();
});

test('a cliente is forbidden from admin mutations and from creating an empresa product', function () {
    $cliente = User::factory()->create([
        'email' => 'cliente@example.com',
        'rol' => 'cliente',
    ]);

    $this->actingAs($cliente, 'sanctum')
        ->postJson('/api/admin/categorias', ['nombre' => 'Postres'])
        ->assertForbidden();

    $this->actingAs($cliente, 'sanctum')
        ->postJson('/api/empresa/productos', [
            'nombre' => 'Intruso',
            'precio' => 5,
            'stock' => 1,
            'categoria_id' => 1,
        ])
        ->assertForbidden();
});

test('an empresa is forbidden from admin mutations', function () {
    [$empresaUser] = cafeConUsuario('duena@example.com');

    $this->actingAs($empresaUser, 'sanctum')
        ->postJson('/api/admin/categorias', ['nombre' => 'No'])
        ->assertForbidden();
});

test('an admin can read an admin route', function () {
    $admin = User::factory()->create([
        'email' => 'admin@example.com',
        'rol' => 'admin',
    ]);

    $this->actingAs($admin, 'sanctum')
        ->getJson('/api/admin/empresas')
        ->assertOk();
});

test('an empresa cannot update or delete another empresa product or change its order', function () {
    [$userA] = cafeConUsuario('cafe-a@example.com');
    [$userB, $cafeB] = cafeConUsuario('cafe-b@example.com');

    $categoria = Categoria::query()->create(['nombre' => 'Clasicos']);
    $producto = productoDe($cafeB, $categoria, 'Espresso', 10);

    $this->actingAs($userA, 'sanctum')
        ->putJson('/api/empresa/productos/'.$producto->id, [
            'nombre' => 'Robado',
            'precio' => 1,
            'stock' => 1,
            'categoria_id' => $categoria->id,
        ])
        ->assertForbidden();

    expect($producto->fresh()->nombre)->toBe('Espresso');

    $this->actingAs($userA, 'sanctum')
        ->deleteJson('/api/empresa/productos/'.$producto->id)
        ->assertForbidden();

    expect(Producto::query()->find($producto->id))->not->toBeNull();

    $cliente = User::factory()->create([
        'email' => 'pide@example.com',
        'rol' => 'cliente',
    ]);

    $pedido = Pedido::query()->create([
        'user_id' => $cliente->id,
        'empresa_id' => $cafeB->id,
        'total' => 10,
        'estado' => 'Pagado',
        'estado_pago' => 'aprobado',
        'hora_recogida' => '10:30:00',
    ]);

    $this->actingAs($userA, 'sanctum')
        ->patchJson('/api/empresa/pedidos/'.$pedido->id.'/estado', [
            'estado' => 'Preparando',
        ])
        ->assertForbidden();

    expect($pedido->fresh()->estado)->toBe('Pagado');

    $this->actingAs($userB, 'sanctum')
        ->patchJson('/api/empresa/pedidos/'.$pedido->id.'/estado', [
            'estado' => 'Cancelado',
        ])
        ->assertOk();

    expect($pedido->fresh()->estado)->toBe('Cancelado');
});

test('a user cannot start payment for another user pedido', function () {
    [, $cafe] = cafeConUsuario('caja@example.com');
    $owner = User::factory()->create([
        'email' => 'owner@example.com',
        'rol' => 'cliente',
    ]);
    $other = User::factory()->create([
        'email' => 'other@example.com',
        'rol' => 'cliente',
    ]);

    $pedido = Pedido::query()->create([
        'user_id' => $owner->id,
        'empresa_id' => $cafe->id,
        'total' => 12,
        'estado' => 'Pendiente',
        'estado_pago' => 'pendiente',
    ]);

    $this->actingAs($other, 'sanctum')
        ->postJson('/api/cliente/pedidos/'.$pedido->id.'/pagar')
        ->assertForbidden();

    expect($pedido->fresh()->estado_pago)->toBe('pendiente');
});

test('webhook without a valid signature does not change payment or stock', function () {
    [, $cafe] = cafeConUsuario('webhook-a@example.com');
    $cliente = User::factory()->create([
        'email' => 'webhook-cliente@example.com',
        'rol' => 'cliente',
    ]);
    $categoria = Categoria::query()->create(['nombre' => 'Filtro']);
    $producto = productoDe($cafe, $categoria, 'V60', 10);

    $pedido = Pedido::query()->create([
        'user_id' => $cliente->id,
        'empresa_id' => $cafe->id,
        'total' => 16,
        'estado' => 'Pendiente',
        'estado_pago' => 'pendiente',
    ]);
    $pedido->productos()->attach($producto->id, [
        'cantidad' => 3,
        'precio_unitario' => 8,
    ]);

    app()->instance(PaymentLookup::class, new class($pedido->id) implements PaymentLookup
    {
        public function __construct(private int $pedidoId)
        {
        }

        public function find(string $paymentId): ?PaymentSnapshot
        {
            return new PaymentSnapshot('approved', (string) $this->pedidoId);
        }
    });

    $this->postJson('/api/webhook/mercadopago', [
        'type' => 'payment',
        'data' => ['id' => '555'],
    ], firmaMercadoPago('555', 'test-webhook-secret', 'firma-invalida'))
        ->assertUnauthorized();

    expect($pedido->fresh()->estado_pago)->toBe('pendiente')
        ->and($pedido->fresh()->estado)->toBe('Pendiente')
        ->and($producto->fresh()->stock)->toBe(10);
});

test('webhook with a valid signature and an approved payment updates the pedido', function () {
    [, $cafe] = cafeConUsuario('webhook-b@example.com');
    $cliente = User::factory()->create([
        'email' => 'webhook-ok@example.com',
        'rol' => 'cliente',
    ]);
    $categoria = Categoria::query()->create(['nombre' => 'Espresso']);
    $producto = productoDe($cafe, $categoria, 'Doppio', 10);

    $pedido = Pedido::query()->create([
        'user_id' => $cliente->id,
        'empresa_id' => $cafe->id,
        'total' => 16,
        'estado' => 'Pendiente',
        'estado_pago' => 'pendiente',
    ]);
    $pedido->productos()->attach($producto->id, [
        'cantidad' => 3,
        'precio_unitario' => 8,
    ]);

    app()->instance(PaymentLookup::class, new class($pedido->id) implements PaymentLookup
    {
        public function __construct(private int $pedidoId)
        {
        }

        public function find(string $paymentId): ?PaymentSnapshot
        {
            return new PaymentSnapshot('approved', (string) $this->pedidoId);
        }
    });

    $this->postJson('/api/webhook/mercadopago', [
        'type' => 'payment',
        'data' => ['id' => '555'],
    ], firmaMercadoPago('555', (string) config('services.mercadopago.webhook_secret')))
        ->assertOk();

    expect($pedido->fresh()->estado_pago)->toBe('aprobado')
        ->and($pedido->fresh()->estado)->toBe('Pagado')
        ->and($producto->fresh()->stock)->toBe(7);
});
