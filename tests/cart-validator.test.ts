import { describe, it, expect } from 'vitest';
import { validateCart } from '../src/cart-validator';
import type { CartItem } from '../src/types';

describe('cart-validator', () => {
  it('panier avec articles valides → OK', () => {
    const cart: CartItem[] = [
      { productId: 'A', quantity: 2, unitPrice: 10 },
      { productId: 'B', quantity: 1, unitPrice: 20 },
    ];
    const result = validateCart(cart);
    expect(result.ok).toBe(true);
  });

  it('panier vide → erreur (I6)', () => {
    const result = validateCart([]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('vide');
    }
  });

  it('article avec quantité 0 → erreur (I9)', () => {
    const cart: CartItem[] = [
      { productId: 'A', quantity: 0, unitPrice: 10 },
    ];
    const result = validateCart(cart);
    expect(result.ok).toBe(false);
  });

  it('article avec quantité négative → erreur (I9)', () => {
    const cart: CartItem[] = [
      { productId: 'A', quantity: -1, unitPrice: 10 },
    ];
    const result = validateCart(cart);
    expect(result.ok).toBe(false);
  });

  it('article avec prix ≤ 0 → erreur', () => {
    const cart: CartItem[] = [
      { productId: 'A', quantity: 1, unitPrice: 0 },
    ];
    const result = validateCart(cart);
    expect(result.ok).toBe(false);
  });

  it('article avec prix négatif → erreur', () => {
    const cart: CartItem[] = [
      { productId: 'A', quantity: 1, unitPrice: -5 },
    ];
    const result = validateCart(cart);
    expect(result.ok).toBe(false);
  });
});