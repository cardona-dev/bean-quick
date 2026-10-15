import assert from 'node:assert/strict';
import test from 'node:test';
import {
    ORDER_STATES,
    canAddProductToCart,
    canReachCanceladoFrom,
    isOrderState,
    menuTarget,
} from '../src/domain/orderRules.js';

test('rejects a product from a second café while the cart holds another', () => {
    const cart = [{ id: 1, empresa_id: 10, nombre: 'Espresso' }];
    const otherCafe = { id: 9, empresa_id: 22, nombre: 'Latte' };
    const sameCafe = { id: 2, empresa: { id: 10 }, nombre: 'Americano' };

    assert.equal(canAddProductToCart(cart, otherCafe), false);
    assert.equal(canAddProductToCart(cart, sameCafe), true);
    assert.equal(canAddProductToCart([], otherCafe), true);
});

test('menu action depends on the auth token and the cliente role', () => {
    assert.equal(menuTarget({ token: null, role: null }), '/login');
    assert.equal(menuTarget({ token: '', role: 'cliente' }), '/login');
    assert.equal(menuTarget({ token: 'cliente-token', role: 'cliente' }), '/cliente/dashboard');
    assert.equal(menuTarget({ token: 'admin-token', role: 'admin' }), '/login');
});

test('the only order states are the six pickup states and Cancelado is reachable from Pagado', () => {
    assert.deepEqual(ORDER_STATES, [
        'Pendiente',
        'Pagado',
        'Preparando',
        'Listo',
        'Entregado',
        'Cancelado',
    ]);
    assert.equal(isOrderState('Pagado'), true);
    assert.equal(isOrderState('Reembolsado'), false);
    assert.equal(canReachCanceladoFrom('Pagado'), true);
    assert.equal(canReachCanceladoFrom('Pendiente'), false);
    assert.equal(canReachCanceladoFrom('Preparando'), false);
});
