import { describe, it, expect, beforeEach } from 'vitest';
import { handlePartialCancellation } from '../src/partial-cancellation-handler';
import { calculateRefund } from '../src/refund-calculator';
import { applyPromotions } from '../src/promotion-engine';
import { calculateTotal } from '../src/total-calculator';
import { StockManager } from '../src/stock-manager';
import { transition } from '../src/order-state-machine';
import type { Order, Promotion, Reservation } from '../src/types';

const expiresAt = new Date('2026-06-15T11:00:00');

const validPromo: Promotion = {
  id: 'promo-10',
  type: 'percentage',
  value: 10,
  incompatibleWith: [],
  validFrom: new Date('2026-06-01'),
  validUntil: new Date('2026-06-30'),
};

const deps = {
  calculateRefund,
  applyPromotions,
  calculateTotal,
  stockManager: new StockManager({}), // remplacé dans beforeEach
  transition,
};

function setupOrder(stockManager: StockManager): { order: Order; reservations: Reservation[] } {
  const resA = stockManager.reserve('A', 1, expiresAt, 'order-1');
  const resB = stockManager.reserve('B', 1, expiresAt, 'order-1');
  const resC = stockManager.reserve('C', 1, expiresAt, 'order-1');
  const reservations = [resA, resB, resC].map(r => r.ok ? r.value : null).filter(Boolean) as Reservation[];
  const order: Order = {
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
    reservations,
    createdAt: new Date('2026-06-15T10:00:00'),
  };

  return { order, reservations };
}

describe('partial-cancellation-handler', () => {
  let stockManager: StockManager;

  beforeEach(() => {
    stockManager = new StockManager({ 'A': 10, 'B': 10, 'C': 10 });
  });

  it('retrait nominal → order mis à jour et refund créé', () => {
    const { order } = setupOrder(stockManager);
    const result = handlePartialCancellation(order, ['B'], [], { ...deps, stockManager });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.order.items).toHaveLength(2);
      expect(result.value.order.total).toBe(70);
      expect(result.value.refund.amount).toBe(30);
      expect(result.value.order.state).toBe('paid');
    }
  });

  it('état !== paid → erreur (I16)', () => {
    const { order } = setupOrder(stockManager);
    const createdOrder = { ...order, state: 'created' as const };
    const result = handlePartialCancellation(createdOrder, ['B'], [], { ...deps, stockManager });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.name).toBe('PartialCancellationError');
    }
  });

  it('item inexistant → PartialCancellationError (S9)', () => {
    const { order } = setupOrder(stockManager);
    const result = handlePartialCancellation(order, ['Z'], [], { ...deps, stockManager });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.name).toBe('PartialCancellationError');
    }
  });

  it('retrait de tous les items → annulation totale paid → cancelled (I14)', () => {
    const { order } = setupOrder(stockManager);
    const result = handlePartialCancellation(order, ['A', 'B', 'C'], [], { ...deps, stockManager });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.order.state).toBe('cancelled');
      expect(result.value.order.items).toHaveLength(0);
      expect(result.value.refund.amount).toBe(100);
      // Stock entièrement libéré
      expect(stockManager.getAvailableStock('A')).toBe(10);
      expect(stockManager.getAvailableStock('B')).toBe(10);
      expect(stockManager.getAvailableStock('C')).toBe(10);
    }
  });

  it('stock libéré uniquement pour items retirés (I15)', () => {
    const { order } = setupOrder(stockManager);
    expect(stockManager.getAvailableStock('B')).toBe(9); // avant : réservé
    const result = handlePartialCancellation(order, ['B'], [], { ...deps, stockManager });

    expect(result.ok).toBe(true);
    // B libéré, A et C restent réservés
    expect(stockManager.getAvailableStock('A')).toBe(9);
    expect(stockManager.getAvailableStock('B')).toBe(10);
    expect(stockManager.getAvailableStock('C')).toBe(9);
  });

  it('refunds[] mis à jour avec le nouveau refund (I18)', () => {
    const { order } = setupOrder(stockManager);
    const result = handlePartialCancellation(order, ['B'], [], { ...deps, stockManager });

    expect(result.ok).toBe(true);
    if (result.ok) {
      const refunds = result.value.order.refunds ?? [];
      expect(refunds).toHaveLength(1);
      expect(refunds[0].amount).toBe(30);
      expect(refunds[0].orderId).toBe('order-1');
    }
  });

  it('annulations successives → cumul cohérent (I18)', () => {
    const { order } = setupOrder(stockManager);

    // 1ère annulation : retirer B
    const result1 = handlePartialCancellation(order, ['B'], [], { ...deps, stockManager });
    expect(result1.ok).toBe(true);
    if (!result1.ok) return;

    // 2ème annulation : retirer C de la commande mise à jour
    const result2 = handlePartialCancellation(result1.value.order, ['C'], [], { ...deps, stockManager });
    expect(result2.ok).toBe(true);
    if (!result2.ok) return;

    const finalOrder = result2.value.order;
    const refunds = finalOrder.refunds ?? [];
    expect(refunds).toHaveLength(2);

    const totalRefunded = refunds.reduce((sum, r) => sum + r.amount, 0);
    // 100 (original) - 50 (A restant) = 50
    expect(totalRefunded).toBe(50);
    expect(finalOrder.total).toBe(50);
  });

  it('annulation partielle puis totale → I14 déclenché (S8)', () => {
    const { order } = setupOrder(stockManager);
    // 1ère annulation : retirer B
    const result1 = handlePartialCancellation(order, ['B'], [], { ...deps, stockManager });
    expect(result1.ok).toBe(true);
    if (!result1.ok) return;

    expect(result1.value.order.state).toBe('paid');
    expect(result1.value.order.items).toHaveLength(2);

    // 2ème annulation : retirer tous les items restants (A + C)
    const result2 = handlePartialCancellation(result1.value.order, ['A', 'C'], [], { ...deps, stockManager });
    expect(result2.ok).toBe(true);
    if (!result2.ok) return;

    // I14 : 0 items restants → annulation totale, paid → cancelled
    expect(result2.value.order.state).toBe('cancelled');
    expect(result2.value.order.items).toHaveLength(0);
    expect(result2.value.order.total).toBe(0);

    // Historique : 2 refunds cumulés
    const refunds = result2.value.order.refunds ?? [];
    expect(refunds).toHaveLength(2);
    const totalRefunded = refunds.reduce((sum, r) => sum + r.amount, 0);
    expect(totalRefunded).toBe(100); // remboursement total = prix initial

    // Stock entièrement libéré
    expect(stockManager.getAvailableStock('A')).toBe(10);
    expect(stockManager.getAvailableStock('B')).toBe(10);
    expect(stockManager.getAvailableStock('C')).toBe(10);
  });

  it('refund négatif → erreur propagée (I17)', () => {
    const { order } = setupOrder(stockManager);
    // Simuler un total artificiellement bas
    const cheapOrder = { ...order, total: 5 };
    const result = handlePartialCancellation(cheapOrder, ['B'], [], { ...deps, stockManager });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.name).toBe('RefundNegativeError');
    }
  });
});