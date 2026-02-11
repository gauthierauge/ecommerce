import { describe, it, expect } from 'vitest';
import { findAbandonedCarts } from '../src/abandoned-cart';
import type { Cart, Order } from '../src/types';

const now = new Date('2026-06-16T12:00:00');

function makeCart(overrides: Partial<Cart> = {}): Cart {
  return {
    id: 'cart-1',
    userId: 'user-1',
    items: [{ productId: 'A', quantity: 1, unitPrice: 50 }],
    createdAt: new Date('2026-06-15T10:00:00'), // 26h avant now
    ...overrides,
  };
}

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'order-1',
    cartId: 'cart-1',
    userId: 'user-1',
    items: [{ productId: 'A', quantity: 1, unitPrice: 50 }],
    state: 'created',
    total: 50,
    discounts: [],
    reservations: [],
    createdAt: new Date('2026-06-15'),
    ...overrides,
  };
}

describe('abandoned-cart', () => {
  it('panier > 24h sans commande → abandonné', () => {
    const cart = makeCart(); // 26h avant now
    const result = findAbandonedCarts([cart], [], now);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('cart-1');
  });

  it('panier < 24h → pas abandonné', () => {
    const recentCart = makeCart({
      createdAt: new Date('2026-06-16T11:00:00'), // 1h avant now
    });
    const result = findAbandonedCarts([recentCart], [], now);
    expect(result).toHaveLength(0);
  });

  it('panier > 24h mais commande existante → pas relancé (I10)', () => {
    const cart = makeCart();
    const order = makeOrder({ cartId: 'cart-1' });
    const result = findAbandonedCarts([cart], [order], now);
    expect(result).toHaveLength(0);
  });

  it('plusieurs paniers → seuls les abandonnés sans commande', () => {
    const abandoned = makeCart({ id: 'cart-1' });
    const recent = makeCart({ id: 'cart-2', createdAt: new Date('2026-06-16T11:30:00') });
    const withOrder = makeCart({ id: 'cart-3' });
    const order = makeOrder({ cartId: 'cart-3' });

    const result = findAbandonedCarts([abandoned, recent, withOrder], [order], now);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('cart-1');
  });

  it('panier vide → pas relancé', () => {
    const emptyCart = makeCart({ items: [] });
    const result = findAbandonedCarts([emptyCart], [], now);
    expect(result).toHaveLength(0);
  });
});