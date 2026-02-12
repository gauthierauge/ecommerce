import { describe, it, expect, beforeEach } from 'vitest';
import { checkExpirations } from '../src/stock/expiration-checker';
import { StockManager } from '../src/stock/stock-manager';
import { transition } from '../src/order/order-state-machine';
import type { Order } from '../src/types';

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

describe('expiration-checker', () => {
  let stockManager: StockManager;

  beforeEach(() => {
    stockManager = new StockManager({ 'A': 5 });
  });

  it('réservation expirée → stock libéré et commande cancelled (I4)', () => {
    const expiredAt = new Date('2026-06-15T09:00:00');
    const now = new Date('2026-06-15T10:00:00');
    const res = stockManager.reserve('A', 2, expiredAt, 'order-1');
    expect(res.ok).toBe(true);
    expect(stockManager.getAvailableStock('A')).toBe(3);

    const order = makeOrder({
      reservations: res.ok ? [res.value] : [],
    });

    const result = checkExpirations([order], now, stockManager, transition);
    expect(result).toHaveLength(1);
    expect(result[0].state).toBe('cancelled');
    expect(stockManager.getAvailableStock('A')).toBe(5); // stock libéré
  });

  it('réservation non expirée → rien ne change', () => {
    const futureExpiry = new Date('2026-06-15T11:00:00');
    const now = new Date('2026-06-15T10:00:00');
    const res = stockManager.reserve('A', 2, futureExpiry, 'order-1');

    const order = makeOrder({
      reservations: res.ok ? [res.value] : [],
    });

    const result = checkExpirations([order], now, stockManager, transition);
    expect(result).toHaveLength(0);
    expect(stockManager.getAvailableStock('A')).toBe(3); // inchangé
  });

  it('commande déjà payée → pas affectée même si réservation expirée', () => {
    const expiredAt = new Date('2026-06-15T09:00:00');
    const now = new Date('2026-06-15T10:00:00');
    const res = stockManager.reserve('A', 1, expiredAt, 'order-1');

    const order = makeOrder({
      state: 'paid',
      reservations: res.ok ? [res.value] : [],
    });

    const result = checkExpirations([order], now, stockManager, transition);
    expect(result).toHaveLength(0);
  });

  it('plusieurs commandes → seules les expirées en created sont annulées', () => {
    const expiredAt = new Date('2026-06-15T09:00:00');
    const futureExpiry = new Date('2026-06-15T11:00:00');
    const now = new Date('2026-06-15T10:00:00');

    const res1 = stockManager.reserve('A', 1, expiredAt, 'order-1');
    const res2 = stockManager.reserve('A', 1, futureExpiry, 'order-2');

    const orders = [
      makeOrder({ id: 'order-1', reservations: res1.ok ? [res1.value] : [] }),
      makeOrder({ id: 'order-2', reservations: res2.ok ? [res2.value] : [] }),
    ];

    const result = checkExpirations(orders, now, stockManager, transition);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('order-1');
  });
});