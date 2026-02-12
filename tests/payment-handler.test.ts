import { describe, it, expect, beforeEach } from 'vitest';
import { handlePayment } from '../src/order/payment-handler';
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

describe('payment-handler', () => {
  let stockManager: StockManager;
  const now = new Date('2026-06-15T10:00:00');

  beforeEach(() => {
    stockManager = new StockManager({ 'A': 10 });
  });

  it('paiement OK → commande passe en paid', () => {
    const reservation = stockManager.reserve('A', 1, new Date('2026-06-15T11:00:00'), 'order-1');
    const order = makeOrder({
      state: 'created',
      reservations: reservation.ok ? [reservation.value] : [],
    });

    const result = handlePayment(order, now, stockManager, transition);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.state).toBe('paid');
    }
  });

  it('paiement après expiration de la réservation → rejeté (I5, S2)', () => {
    const expiredAt = new Date('2026-06-15T09:00:00'); // expiré avant now
    const reservation = stockManager.reserve('A', 1, expiredAt, 'order-1');
    const order = makeOrder({
      state: 'created',
      reservations: reservation.ok ? [reservation.value] : [],
    });

    const result = handlePayment(order, now, stockManager, transition);
    expect(result.ok).toBe(false);
  });

  it('paiement sur commande déjà payée → rejeté (I8, S1)', () => {
    const reservation = stockManager.reserve('A', 1, new Date('2026-06-15T11:00:00'), 'order-1');
    const order = makeOrder({
      state: 'paid',
      reservations: reservation.ok ? [reservation.value] : [],
    });

    const result = handlePayment(order, now, stockManager, transition);
    expect(result.ok).toBe(false);
  });

  it('paiement sur commande cancelled → rejeté', () => {
    const order = makeOrder({ state: 'cancelled' });
    const result = handlePayment(order, now, stockManager, transition);
    expect(result.ok).toBe(false);
  });

  it('expiresAt === now → traité comme expiré (borne inclusive)', () => {
    const reservation = stockManager.reserve('A', 1, now, 'order-1'); // expire exactement à now
    const order = makeOrder({
      state: 'created',
      reservations: reservation.ok ? [reservation.value] : [],
    });
    const result = handlePayment(order, now, stockManager, transition);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.name).toBe('PaymentExpiredError');
  });

  it('paiement sans réservation → rejeté', () => {
    const order = makeOrder({ state: 'created', reservations: [] });
    const result = handlePayment(order, now, stockManager, transition);
    expect(result.ok).toBe(false);
  });
});