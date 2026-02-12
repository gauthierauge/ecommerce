import { describe, it, expect } from 'vitest';
import { calculateRefund } from '../src/refund/refund-calculator';
import { applyPromotions } from '../src/pricing/promotion-engine';
import { calculateTotal } from '../src/pricing/total-calculator';
import type { Order, Promotion } from '../src/types';

const deps = { applyPromotions, calculateTotal };

const validPromo: Promotion = {
  id: 'promo-10',
  type: 'percentage',
  value: 10,
  incompatibleWith: [],
  validFrom: new Date('2026-06-01'),
  validUntil: new Date('2026-06-30'),
};

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'order-1',
    cartId: 'cart-1',
    userId: 'user-1',
    items: [
      { productId: 'A', quantity: 1, unitPrice: 50 },
      { productId: 'B', quantity: 1, unitPrice: 30 },
      { productId: 'C', quantity: 1, unitPrice: 20 },
    ],
    state: 'paid',
    total: 100,
    discounts: [],
    reservations: [],
    createdAt: new Date('2026-06-15T10:00:00'),
    ...overrides,
  };
}

describe('refund-calculator', () => {
  it('retrait 1 article sur 3 → remboursement correct (I13)', () => {
    const order = makeOrder(); // {A:50, B:30, C:20}, total=100
    const remaining = [
      { productId: 'A', quantity: 1, unitPrice: 50 },
      { productId: 'C', quantity: 1, unitPrice: 20 },
    ];
    const result = calculateRefund(order, remaining, [], deps);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.remainingItems).toHaveLength(2);
      expect(result.value.newTotal).toBe(70); // 50 + 20
      expect(result.value.refundAmount).toBe(30); // 100 - 70
    }
  });

  it('retrait avec promo % → recalcul cascade sur restants', () => {
    const order = makeOrder({ total: 90 });
    const remaining = [
      { productId: 'A', quantity: 1, unitPrice: 50 },
      { productId: 'C', quantity: 1, unitPrice: 20 },
    ];
    const result = calculateRefund(order, remaining, [validPromo], deps);

    expect(result.ok).toBe(true);
    if (result.ok) {
      // Remaining: {A:50, C:20}, subtotal=70, promo 10%=7, total=63
      expect(result.value.newTotal).toBe(63);
      expect(result.value.refundAmount).toBe(27); // 90 - 63
      expect(result.value.newDiscounts).toHaveLength(1);
    }
  });

  it('remboursement = ancien total - nouveau total, pas somme brute (I13)', () => {
    const order = makeOrder({ total: 90 });
    const remaining = [
      { productId: 'A', quantity: 1, unitPrice: 50 },
      { productId: 'C', quantity: 1, unitPrice: 20 },
    ];
    const result = calculateRefund(order, remaining, [validPromo], deps);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.refundAmount).not.toBe(30); // pas la somme brute
      expect(result.value.refundAmount).toBe(27);      // ancien - nouveau
    }
  });

  it('refund négatif → RefundNegativeError (I17)', () => {
    const order = makeOrder({
      items: [
        { productId: 'A', quantity: 1, unitPrice: 100 },
        { productId: 'B', quantity: 1, unitPrice: 10 },
      ],
      total: 10, // payé 10€ grâce à une grosse promo
    });
    const remaining = [{ productId: 'A', quantity: 1, unitPrice: 100 }];

    // Sans promo au recalcul, remaining {A:100} → total 100 > 10
    const result = calculateRefund(order, remaining, [], deps);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.name).toBe('RefundNegativeError');
    }
  });

  it('utilise order.createdAt pour les promos, pas now (H6)', () => {
    const shortPromo: Promotion = {
      ...validPromo,
      validUntil: new Date('2026-06-15T12:00:00'),
    };
    const order = makeOrder({
      total: 90,
      createdAt: new Date('2026-06-15T10:00:00'),
    });
    const remaining = [
      { productId: 'A', quantity: 1, unitPrice: 50 },
      { productId: 'C', quantity: 1, unitPrice: 20 },
    ];

    const result = calculateRefund(order, remaining, [shortPromo], deps);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.newDiscounts).toHaveLength(1);
      expect(result.value.newTotal).toBe(63); // 70 - 7
    }
  });

  it('retrait d\'un article à 0€ → refund = 0€, accepté', () => {
    const order = makeOrder({
      items: [
        { productId: 'A', quantity: 1, unitPrice: 50 },
        { productId: 'FREE', quantity: 1, unitPrice: 0 },
      ],
      total: 50,
    });
    const remaining = [{ productId: 'A', quantity: 1, unitPrice: 50 }];
    const result = calculateRefund(order, remaining, [], deps);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.refundAmount).toBe(0);
      expect(result.value.newTotal).toBe(50);
    }
  });

  it('fonction pure — même input = même output', () => {
    const order = makeOrder({ total: 90 });
    const remaining = [
      { productId: 'A', quantity: 1, unitPrice: 50 },
      { productId: 'C', quantity: 1, unitPrice: 20 },
    ];
    const result1 = calculateRefund(order, remaining, [validPromo], deps);
    const result2 = calculateRefund(order, remaining, [validPromo], deps);

    expect(result1).toEqual(result2);
  });
});