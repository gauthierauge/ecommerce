import { describe, it, expect, beforeEach } from 'vitest';
import { createOrder } from '../src/order/order-orchestrator';
import { handlePayment } from '../src/order/payment-handler';
import { checkExpirations } from '../src/stock/expiration-checker';
import { handlePartialCancellation } from '../src/refund/partial-cancellation-handler';
import { calculateRefund } from '../src/refund/refund-calculator';
import { validateCart } from '../src/order/cart-validator';
import { checkCompatibility } from '../src/pricing/compatibility-checker';
import { applyPromotions } from '../src/pricing/promotion-engine';
import { calculateTotal } from '../src/pricing/total-calculator';
import { StockManager } from '../src/stock/stock-manager';
import { transition } from '../src/order/order-state-machine';
import type { Cart, CartItem, Promotion } from '../src/types';

const now = new Date('2026-06-15T10:00:00');
const promo10: Promotion = {
  id: 'promo-10', type: 'percentage', value: 10,
  incompatibleWith: [],
  validFrom: new Date('2026-06-01'), validUntil: new Date('2026-06-30'),
};

function makeCart(id: string, items: CartItem[]): Cart {
  return { id, userId: 'user-1', items, createdAt: now };
}

describe('e2e-workflow', () => {
  let stockManager: StockManager;
  const orderDeps = () => ({
    validateCart, checkCompatibility, applyPromotions,
    calculateTotal, stockManager, transition,
  });
  const cancelDeps = () => ({
    calculateRefund, applyPromotions, calculateTotal, stockManager, transition,
  });

  beforeEach(() => {
    stockManager = new StockManager({ A: 10, B: 10, C: 10 });
  });

  it('Scénario 1 — Workflow nominal : panier → commande → paiement → préparation → expédition', () => {
    const cart = makeCart('cart-1', [
      { productId: 'A', quantity: 2, unitPrice: 50 },
      { productId: 'B', quantity: 1, unitPrice: 30 },
    ]);
    // Créer commande avec promo -10% : subtotal=130, promo=13, total=117
    const orderResult = createOrder(cart, [promo10], [], orderDeps(), now);
    expect(orderResult.ok).toBe(true);
    if (!orderResult.ok) return;
    const order = orderResult.value;
    expect(order.total).toBe(117);
    expect(order.state).toBe('created');
    expect(order.reservations).toHaveLength(2);
    expect(stockManager.getAvailableStock('A')).toBe(8);
    expect(stockManager.getAvailableStock('B')).toBe(9);
    // Payer → paid
    const payResult = handlePayment(order, now, stockManager, transition);
    expect(payResult.ok).toBe(true);
    if (!payResult.ok) return;
    expect(payResult.value.state).toBe('paid');
    // Préparer → prepared → Expédier → shipped
    const prepResult = transition(payResult.value.state, 'prepared');
    expect(prepResult.ok).toBe(true);
    if (!prepResult.ok) return;
    const prepared = { ...payResult.value, state: prepResult.value };
    const shipResult = transition(prepared.state, 'shipped');
    expect(shipResult.ok).toBe(true);
    if (!shipResult.ok) return;
    expect({ ...prepared, state: shipResult.value }.state).toBe('shipped');
  });

  it('Scénario 2 — Paiement expiré : commande → expiration → stock libéré → paiement rejeté', () => {
    const cart = makeCart('cart-2', [
      { productId: 'A', quantity: 1, unitPrice: 50 },
      { productId: 'B', quantity: 1, unitPrice: 30 },
    ]);
    const orderResult = createOrder(cart, [], [], orderDeps(), now);
    expect(orderResult.ok).toBe(true);
    if (!orderResult.ok) return;
    const order = orderResult.value;
    expect(stockManager.getAvailableStock('A')).toBe(9);
    // 31 min plus tard — réservations expirées (durée = 30 min)
    const later = new Date(now.getTime() + 31 * 60 * 1000);
    // Expiration-checker libère le stock et annule
    const cancelled = checkExpirations([order], later, stockManager, transition);
    expect(cancelled).toHaveLength(1);
    expect(cancelled[0].state).toBe('cancelled');
    expect(stockManager.getAvailableStock('A')).toBe(10);
    expect(stockManager.getAvailableStock('B')).toBe(10);
    // Paiement tardif rejeté
    const payResult = handlePayment(order, later, stockManager, transition);
    expect(payResult.ok).toBe(false);
    if (!payResult.ok) expect(payResult.error.name).toBe('PaymentExpiredError');
  });

  it('Scénario 3 — Annulation partielle : payer → retirer B → nouveau total, stock B libéré, refund', () => {
    const cart = makeCart('cart-3', [
      { productId: 'A', quantity: 1, unitPrice: 50 },
      { productId: 'B', quantity: 1, unitPrice: 30 },
      { productId: 'C', quantity: 1, unitPrice: 20 },
    ]);
    // Créer avec promo -10% : subtotal=100, promo=10, total=90
    const orderResult = createOrder(cart, [promo10], [], orderDeps(), now);
    expect(orderResult.ok).toBe(true);
    if (!orderResult.ok) return;
    expect(orderResult.value.total).toBe(90);
    // Payer
    const payResult = handlePayment(orderResult.value, now, stockManager, transition);
    expect(payResult.ok).toBe(true);
    if (!payResult.ok) return;
    // Annulation partielle : retirer B
    const cancelResult = handlePartialCancellation(
      payResult.value, ['B'], [promo10], cancelDeps(), now,
    );
    expect(cancelResult.ok).toBe(true);
    if (!cancelResult.ok) return;
    const updated = cancelResult.value.order;
    // Nouveau total : {A:50, C:20} subtotal=70, promo 10%=7, total=63
    expect(updated.total).toBe(63);
    expect(updated.items).toHaveLength(2);
    expect(updated.state).toBe('paid');
    expect(cancelResult.value.refund.amount).toBe(27); // 90 - 63
    expect(updated.refunds).toHaveLength(1);
    // Stock B libéré, A et C toujours réservés
    expect(stockManager.getAvailableStock('A')).toBe(9);
    expect(stockManager.getAvailableStock('B')).toBe(10);
    expect(stockManager.getAvailableStock('C')).toBe(9);
  });

  it('Scénario 4 — Annulation partielle puis expédition : payer → retirer B → préparer → expédier', () => {
    const cart = makeCart('cart-4', [
      { productId: 'A', quantity: 1, unitPrice: 50 },
      { productId: 'B', quantity: 1, unitPrice: 30 },
      { productId: 'C', quantity: 1, unitPrice: 20 },
    ]);
    // Créer et payer (sans promo)
    const orderResult = createOrder(cart, [], [], orderDeps(), now);
    expect(orderResult.ok).toBe(true);
    if (!orderResult.ok) return;
    const payResult = handlePayment(orderResult.value, now, stockManager, transition);
    expect(payResult.ok).toBe(true);
    if (!payResult.ok) return;
    // Retirer B → total passe de 100 à 70
    const cancelResult = handlePartialCancellation(
      payResult.value, ['B'], [], cancelDeps(), now,
    );
    expect(cancelResult.ok).toBe(true);
    if (!cancelResult.ok) return;
    const afterCancel = cancelResult.value.order;
    expect(afterCancel.total).toBe(70);
    expect(afterCancel.refunds![0].amount).toBe(30);
    // Préparer → prepared → Expédier → shipped
    const prepResult = transition(afterCancel.state, 'prepared');
    expect(prepResult.ok).toBe(true);
    if (!prepResult.ok) return;
    const prepared = { ...afterCancel, state: prepResult.value };
    const shipResult = transition(prepared.state, 'shipped');
    expect(shipResult.ok).toBe(true);
    if (!shipResult.ok) return;
    const shipped = { ...prepared, state: shipResult.value };
    // Vérifications finales
    expect(shipped.state).toBe('shipped');
    expect(shipped.total).toBe(70);
    expect(shipped.items).toHaveLength(2);
    expect(shipped.refunds).toHaveLength(1);
    // Stock : B libéré, A et C réservés
    expect(stockManager.getAvailableStock('A')).toBe(9);
    expect(stockManager.getAvailableStock('B')).toBe(10);
    expect(stockManager.getAvailableStock('C')).toBe(9);
  });
});
