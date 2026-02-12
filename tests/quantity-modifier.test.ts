import { describe, it, expect, beforeEach } from 'vitest';
import { handleQuantityModification } from '../src/refund/quantity-modifier';
import { calculateRefund } from '../src/refund/refund-calculator';
import { applyPromotions } from '../src/pricing/promotion-engine';
import { calculateTotal } from '../src/pricing/total-calculator';
import { StockManager } from '../src/stock/stock-manager';
import type { Order, Promotion, Reservation } from '../src/types';
import type { QuantityModificationDeps } from '../src/refund/quantity-modifier';

const now = new Date('2026-06-15T10:00:00');
const promo10: Promotion = {
  id: 'promo-10', type: 'percentage', value: 10,
  incompatibleWith: [],
  validFrom: new Date('2026-06-01'), validUntil: new Date('2026-06-30'),
};

function makeReservation(id: string, productId: string, qty: number, orderId = 'order-1'): Reservation {
  return { id, orderId, productId, quantity: qty, expiresAt: new Date('2026-06-15T11:00:00') };
}

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'order-1', cartId: 'cart-1', userId: 'user-1',
    items: [
      { productId: 'A', quantity: 3, unitPrice: 50 },
      { productId: 'B', quantity: 1, unitPrice: 30 },
    ],
    state: 'paid', total: 162, // (150+30)*0.9
    discounts: [{ promotionId: 'promo-10', amount: 18 }],
    reservations: [makeReservation('res-1', 'A', 3), makeReservation('res-2', 'B', 1)],
    createdAt: now,
    ...overrides,
  };
}

describe('quantity-modifier', () => {
  let stockManager: StockManager;
  let deps: QuantityModificationDeps;

  beforeEach(() => {
    stockManager = new StockManager({ A: 10, B: 10 });
    // Créer les réservations réelles dans le stock-manager
    stockManager.reserve('A', 3, new Date('2026-06-15T11:00:00'), 'order-1');
    stockManager.reserve('B', 1, new Date('2026-06-15T11:00:00'), 'order-1');
    deps = { calculateRefund, applyPromotions, calculateTotal, stockManager };
  });

  it('diminuer qty 3 → 1 : total recalculé avec promos, refund correct (C13, C14)', () => {
    const order = makeOrder();
    const result = handleQuantityModification(order, 'A', 1, [promo10], deps, now);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // Remaining: {A:50*1, B:30*1} = 80, promo 10% = 8, total = 72
    expect(result.value.order.total).toBe(72);
    expect(result.value.refund.amount).toBe(90); // 162 - 72
    expect(result.value.order.items).toHaveLength(2);
    const itemA = result.value.order.items.find(i => i.productId === 'A');
    expect(itemA?.quantity).toBe(1);
  });

  it('état !== paid → erreur (I16)', () => {
    const order = makeOrder({ state: 'created' });
    const result = handleQuantityModification(order, 'A', 1, [], deps, now);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.name).toBe('PartialCancellationError');
  });

  it('article inexistant → erreur', () => {
    const order = makeOrder();
    const result = handleQuantityModification(order, 'INEXISTANT', 1, [], deps, now);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.name).toBe('PartialCancellationError');
  });

  it('newQty >= oldQty → erreur (I19, C16)', () => {
    const order = makeOrder();
    const result = handleQuantityModification(order, 'A', 5, [], deps, now);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toMatch(/diminuer/i);
  });

  it('newQty === oldQty → erreur (I19)', () => {
    const order = makeOrder();
    const result = handleQuantityModification(order, 'A', 3, [], deps, now);
    expect(result.ok).toBe(false);
  });

  it('newQty === 0 → erreur renvoyant vers cycle 2 (I20, C15)', () => {
    const order = makeOrder();
    const result = handleQuantityModification(order, 'A', 0, [], deps, now);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toMatch(/annulation partielle/i);
  });

  it('refund négatif → erreur propagée depuis calculator (I17)', () => {
    const order = makeOrder({
      items: [
        { productId: 'A', quantity: 3, unitPrice: 10 },
        { productId: 'B', quantity: 1, unitPrice: 30 },
      ],
      total: 5, // payé très peu grâce à une grosse promo
    });
    const result = handleQuantityModification(order, 'A', 1, [], deps, now);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.name).toBe('RefundNegativeError');
  });

  it('refunds[] mis à jour, tracé dans l\'historique (I18)', () => {
    const order = makeOrder();
    const result = handleQuantityModification(order, 'A', 1, [promo10], deps, now);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.order.refunds).toHaveLength(1);
    expect(result.value.order.refunds![0].amount).toBe(90);
    expect(result.value.order.refunds![0].removedItems).toEqual([
      { productId: 'A', quantity: 2, unitPrice: 50 },
    ]);
  });

  it('réservation mise à jour via adjustReservation (I23)', () => {
    const order = makeOrder();
    const result = handleQuantityModification(order, 'A', 1, [promo10], deps, now);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const resA = result.value.order.reservations.find(r => r.productId === 'A');
    expect(resA?.quantity).toBe(1);
    expect(stockManager.getAvailableStock('A')).toBe(9); // 10 - 1
  });
});
