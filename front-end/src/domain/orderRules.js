/** Product rules shared by the public UI and its tests. */

export const ORDER_STATES = Object.freeze([
    'Pendiente',
    'Pagado',
    'Preparando',
    'Listo',
    'Entregado',
    'Cancelado',
]);

/** Distinct badge colors so each order state is recognizable at a glance. */
export const ORDER_STATE_COLORS = Object.freeze({
    Pendiente: '#8A6A4F',
    Pagado: '#1F7A4D',
    Preparando: '#B86E00',
    Listo: '#0E6E8C',
    Entregado: '#3E2723',
    Cancelado: '#9B2C2C',
});

export function isOrderState(estado) {
    return ORDER_STATES.includes(estado);
}

/** Cancelado is reachable once the café has a paid order to undo. */
export function canReachCanceladoFrom(estado) {
    return estado === 'Pagado';
}

function cafeIdOf(item) {
    if (!item || typeof item !== 'object') return null;
    const id = item.empresa_id ?? item.empresa?.id ?? null;
    if (id === undefined || id === null || id === '') return null;
    return String(id);
}

/**
 * A cart may hold products from only one café.
 * Returns false when the cart already has another café's products.
 */
export function canAddProductToCart(cart, product) {
    if (!Array.isArray(cart) || cart.length === 0) return true;
    const current = cafeIdOf(cart[0]);
    const incoming = cafeIdOf(product);
    if (current === null || incoming === null) return false;
    return current === incoming;
}

/**
 * Logged-out visitors go to login. A cliente token opens the menu dashboard.
 */
export function menuTarget({ token, role } = {}) {
    if (!token) return '/login';
    if (role === 'cliente') return '/cliente/dashboard';
    return '/login';
}
