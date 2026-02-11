import { describe, it, expect } from 'vitest';
import { calculateTotal } from '../src/total-calculator';
import type { CartItem, Discount } from '../src/types';

describe('total-calculator', () => {
  const cart: readonly CartItem[] = [
    { productId: 'A', quantity: 2, unitPrice: 50 },
    { productId: 'B', quantity: 1, unitPrice: 20 },
  ];
  // sous-total = 2*50 + 1*20 = 120€

  it('panier sans réduction → total = somme des lignes', () => {
    const total = calculateTotal(cart, []);
    expect(total).toBe(120);
  });

  it('panier avec une réduction pourcentage → total correct', () => {
    const discounts: Discount[] = [{ promotionId: 'P1', amount: 24 }]; // -20%
    const total = calculateTotal(cart, discounts);
    expect(total).toBe(96);
  });

  it('panier avec une réduction montant fixe → total correct', () => {
    const discounts: Discount[] = [{ promotionId: 'P2', amount: 10 }];
    const total = calculateTotal(cart, discounts);
    expect(total).toBe(110);
  });

  it('réductions qui dépassent le sous-total → total = 0, pas négatif (I7)', () => {
    const discounts: Discount[] = [
      { promotionId: 'P1', amount: 100 },
      { promotionId: 'P2', amount: 50 },
    ];
    const total = calculateTotal(cart, discounts);
    expect(total).toBe(0);
  });

  it('plusieurs articles et plusieurs réductions → calcul correct', () => {
    const bigCart: readonly CartItem[] = [
      { productId: 'A', quantity: 3, unitPrice: 30 },
      { productId: 'B', quantity: 2, unitPrice: 15 },
      { productId: 'C', quantity: 1, unitPrice: 45 },
    ];
    // sous-total = 90 + 30 + 45 = 165
    const discounts: Discount[] = [
      { promotionId: 'P1', amount: 33 },  // -20%
      { promotionId: 'P2', amount: 10 },  // -10€
    ];
    const total = calculateTotal(bigCart, discounts);
    expect(total).toBe(122); // 165 - 33 - 10
  });

  it('fonction pure — même input = même output', () => {
    const discounts: Discount[] = [{ promotionId: 'P1', amount: 20 }];
    const total1 = calculateTotal(cart, discounts);
    const total2 = calculateTotal(cart, discounts);
    expect(total1).toBe(total2);
    expect(total1).toBe(100);
  });
});