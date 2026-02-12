import { describe, it, expect } from 'vitest';
import { applyPromotions } from '../src/pricing/promotion-engine';
import type { CartItem, Promotion } from '../src/types';

const now = new Date('2026-06-15');
const validFrom = new Date('2026-01-01');
const validUntil = new Date('2026-12-31');

const cart: readonly CartItem[] = [
  { productId: 'A', quantity: 2, unitPrice: 50 },
  { productId: 'B', quantity: 1, unitPrice: 20 },
];
// sous-total = 2*50 + 1*20 = 120€

function makePromo(
  overrides: Partial<Promotion> & { id: string; type: Promotion['type']; value: number },
): Promotion {
  return {
    incompatibleWith: [],
    validFrom,
    validUntil,
    ...overrides,
  };
}

describe('promotion-engine', () => {
  describe('application des promos — cas nominaux', () => {
    it('promo pourcentage (-20%) → réduction correcte', () => {
      const promo = makePromo({ id: 'P1', type: 'percentage', value: 20 });
      const discounts = applyPromotions(cart, [promo], now, 120);
      expect(discounts).toHaveLength(1);
      expect(discounts[0].promotionId).toBe('P1');
      expect(discounts[0].amount).toBe(24); // 120 * 0.20
    });

    it('promo montant fixe (-10€) → réduction correcte', () => {
      const promo = makePromo({ id: 'P2', type: 'fixed_amount', value: 10 });
      const discounts = applyPromotions(cart, [promo], now, 120);
      expect(discounts).toHaveLength(1);
      expect(discounts[0].promotionId).toBe('P2');
      expect(discounts[0].amount).toBe(10);
    });

    it('plusieurs promos compatibles → toutes appliquées', () => {
      const p1 = makePromo({ id: 'P1', type: 'percentage', value: 10 });
      const p2 = makePromo({ id: 'P2', type: 'fixed_amount', value: 5 });
      const discounts = applyPromotions(cart, [p1, p2], now, 120);
      expect(discounts).toHaveLength(2);
    });

    it('deux promos % s\'appliquent en cascade, pas sur le brut (D3)', () => {
      // 120€, deux promos -20%
      // Cascade : 120*0.20=24, reste 96, puis 96*0.20=19.2
      // Brut (ancien) : 120*0.20=24, puis 120*0.20=24 → FAUX
      const p1 = makePromo({ id: 'P1', type: 'percentage', value: 20 });
      const p2 = makePromo({ id: 'P2', type: 'percentage', value: 20 });
      const discounts = applyPromotions(cart, [p1, p2], now, 120);
      expect(discounts[0].amount).toBe(24);     // 120 * 0.20
      expect(discounts[1].amount).toBeCloseTo(19.2); // (120-24) * 0.20
    });

    it('promo fixe puis promo % → cascade correcte', () => {
      // 120€, -10€ fixe, puis -20%
      // Fixe : 10, reste 110, puis 110*0.20=22
      const p1 = makePromo({ id: 'P1', type: 'fixed_amount', value: 10 });
      const p2 = makePromo({ id: 'P2', type: 'percentage', value: 20 });
      const discounts = applyPromotions(cart, [p1, p2], now, 120);
      expect(discounts[0].amount).toBe(10);
      expect(discounts[1].amount).toBe(22);
    });
  });

  describe('validité temporelle — I12', () => {
    it('promo expirée (validUntil dépassé) → rejetée', () => {
      const promo = makePromo({
        id: 'EXPIRED',
        type: 'percentage',
        value: 10,
        validUntil: new Date('2026-01-01'),
      });
      const discounts = applyPromotions(cart, [promo], now, 120);
      expect(discounts).toHaveLength(0);
    });

    it('promo pas encore active (validFrom pas atteint) → rejetée', () => {
      const promo = makePromo({
        id: 'FUTURE',
        type: 'percentage',
        value: 10,
        validFrom: new Date('2027-01-01'),
      });
      const discounts = applyPromotions(cart, [promo], now, 120);
      expect(discounts).toHaveLength(0);
    });
  });

  describe('panier immutable — H3', () => {
    it('le panier n\'est pas modifié après application', () => {
      const cartCopy: CartItem[] = [
        { productId: 'A', quantity: 2, unitPrice: 50 },
        { productId: 'B', quantity: 1, unitPrice: 20 },
      ];
      const original = JSON.stringify(cartCopy);
      const promo = makePromo({ id: 'P1', type: 'percentage', value: 20 });
      applyPromotions(cartCopy, [promo], now, 120);
      expect(JSON.stringify(cartCopy)).toBe(original);
    });
  });

  describe('aucune promo', () => {
    it('liste vide → aucune réduction', () => {
      const discounts = applyPromotions(cart, [], now, 120);
      expect(discounts).toHaveLength(0);
    });
  });
});