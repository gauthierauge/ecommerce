import type { Cart, Order } from './types';

const ABANDONED_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24h

export function findAbandonedCarts(
  carts: readonly Cart[],
  orders: readonly Order[],
  now: Date,
): Cart[] {
  const cartIdsWithOrder = new Set(orders.map(o => o.cartId));

  return carts.filter(cart => {
    // Panier vide → pas relancé
    if (cart.items.length === 0) return false;

    // Panier avec commande existante → pas relancé (I10)
    if (cartIdsWithOrder.has(cart.id)) return false;

    // Panier < 24h → pas abandonné
    const elapsed = now.getTime() - cart.createdAt.getTime();
    return elapsed > ABANDONED_THRESHOLD_MS;
  });
}