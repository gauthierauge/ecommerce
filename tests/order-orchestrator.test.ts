import { describe, it, expect, beforeEach } from 'vitest';
import { createOrder } from '../src/order-orchestrator';
import { validateCart } from '../src/cart-validator';
import { checkCompatibility } from '../src/compatibility-checker';
import { applyPromotions } from '../src/promotion-engine';
import { calculateTotal } from '../src/total-calculator';
import { StockManager } from '../src/stock-manager';
import { transition } from '../src/order-state-machine';
import type { Cart, Order, Promotion } from '../src/types';

const now = new Date('2026-06-15T10:00:00');

const validPromo: Promotion = {
  id: 'promo-1',
  type: 'percentage',
  value: 10,
  incompatibleWith: [],
  validFrom: new Date('2026-06-01'),
  validUntil: new Date('2026-06-30'),
};

function makeCart(overrides: Partial<Cart> = {}): Cart {
  return {
    id: 'cart-1',
    userId: 'user-1',
    items: [{ productId: 'A', quantity: 2, unitPrice: 50 }],
    createdAt: new Date('2026-06-15T09:00:00'),
    ...overrides,
  };
}

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'order-1',
    cartId: 'cart-1',
    userId: 'user-1',
    items: [{ productId: 'A', quantity: 2, unitPrice: 50 }],
    state: 'created',
    total: 100,
    discounts: [],
    reservations: [],
    createdAt: new Date('2026-06-15'),
    ...overrides,
  };
}

const deps = {
  validateCart,
  checkCompatibility,
  applyPromotions,
  calculateTotal,
  stockManager: new StockManager({}), // remplacé dans beforeEach
  transition,
};

describe('order-orchestrator', () => {
  let stockManager: StockManager;

  beforeEach(() => {
    stockManager = new StockManager({ 'A': 10, 'B': 5 });
  });

  it('workflow nominal → commande créée en état created', () => {
    const cart = makeCart();
    const result = createOrder(cart, [], [], { ...deps, stockManager }, now);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.state).toBe('created');
      expect(result.value.cartId).toBe('cart-1');
      expect(result.value.userId).toBe('user-1');
      expect(result.value.total).toBe(100); // 2 × 50
      expect(result.value.reservations).toHaveLength(1);
    }
  });

  it('workflow avec promo → total réduit et discount enregistré', () => {
    const cart = makeCart();
    const result = createOrder(cart, [validPromo], [], { ...deps, stockManager }, now);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.total).toBe(90); // 100 - 10%
      expect(result.value.discounts).toHaveLength(1);
    }
  });

  it('panier invalide → erreur, rien réservé', () => {
    const cart = makeCart({ items: [] });
    const result = createOrder(cart, [], [], { ...deps, stockManager }, now);

    expect(result.ok).toBe(false);
    expect(stockManager.getReservations()).toHaveLength(0);
  });

  it('stock insuffisant → erreur, pas de commande', () => {
    const cart = makeCart({
      items: [{ productId: 'A', quantity: 20, unitPrice: 50 }],
    });
    const result = createOrder(cart, [], [], { ...deps, stockManager }, now);

    expect(result.ok).toBe(false);
  });

  it('promos incompatibles → erreur avant réservation stock', () => {
    const promoA: Promotion = { ...validPromo, id: 'promo-A', incompatibleWith: ['promo-B'] };
    const promoB: Promotion = { ...validPromo, id: 'promo-B' };
    const cart = makeCart();

    const result = createOrder(cart, [promoA, promoB], [], { ...deps, stockManager }, now);

    expect(result.ok).toBe(false);
    expect(stockManager.getReservations()).toHaveLength(0);
  });

  it('commande existante pour ce panier → DuplicateOrderError (I11)', () => {
    const cart = makeCart();
    const existingOrder = makeOrder({ cartId: 'cart-1' });

    const result = createOrder(cart, [], [existingOrder], { ...deps, stockManager }, now);

    expect(result.ok).toBe(false);
    expect(stockManager.getReservations()).toHaveLength(0);
  });

  it('snapshot immutable — mutation du panier après création sans effet (S6)', () => {
    const mutableItems = [{ productId: 'A', quantity: 2, unitPrice: 50 }];
    const cart = makeCart({ items: mutableItems });

    const result = createOrder(cart, [], [], { ...deps, stockManager }, now);

    expect(result.ok).toBe(true);
    if (result.ok) {
      mutableItems[0].quantity = 999;
      expect(result.value.items[0].quantity).toBe(2);
    }
  });

  it('multi-produits — tous les items sont réservés', () => {
    const cart = makeCart({
      items: [
        { productId: 'A', quantity: 1, unitPrice: 50 },
        { productId: 'B', quantity: 2, unitPrice: 30 },
      ],
    });

    const result = createOrder(cart, [], [], { ...deps, stockManager }, now);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.reservations).toHaveLength(2);
      expect(result.value.total).toBe(110); // 50 + 60
    }
  });

  it('stock insuffisant sur 2ème produit → rollback 1ère réservation', () => {
    const cart = makeCart({
      items: [
        { productId: 'A', quantity: 1, unitPrice: 50 },
        { productId: 'B', quantity: 10, unitPrice: 30 }, // B n'a que 5
      ],
    });

    const result = createOrder(cart, [], [], { ...deps, stockManager }, now);

    expect(result.ok).toBe(false);
    // La réservation de A doit être libérée (rollback)
    expect(stockManager.getAvailableStock('A')).toBe(10);
    expect(stockManager.getReservations()).toHaveLength(0);
  });
});