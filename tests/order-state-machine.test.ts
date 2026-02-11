import { describe, it, expect } from 'vitest';
import { transition, OrderState } from '../src/order-state-machine';

describe('order-state-machine', () => {
  describe('transitions valides', () => {
    it('created → paid (paiement ok)', () => {
      const result = transition('created', 'paid');
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value).toBe('paid');
    });

    it('created → cancelled (annulation)', () => {
      const result = transition('created', 'cancelled');
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value).toBe('cancelled');
    });

    it('paid → prepared (préparation)', () => {
      const result = transition('paid', 'prepared');
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value).toBe('prepared');
    });

    it('paid → cancelled (annulation après paiement)', () => {
      const result = transition('paid', 'cancelled');
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value).toBe('cancelled');
    });

    it('prepared → shipped (expédition)', () => {
      const result = transition('prepared', 'shipped');
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value).toBe('shipped');
    });
  });

  describe('transitions invalides — I2', () => {
    it('created → shipped est interdit (saut d\'étapes)', () => {
      const result = transition('created', 'shipped');
      expect(result.ok).toBe(false);
    });

    it('created → prepared est interdit (saut d\'étapes)', () => {
      const result = transition('created', 'prepared');
      expect(result.ok).toBe(false);
    });

    it('shipped → created est interdit (retour en arrière)', () => {
      const result = transition('shipped', 'created');
      expect(result.ok).toBe(false);
    });

    it('paid → created est interdit (retour en arrière)', () => {
      const result = transition('paid', 'created');
      expect(result.ok).toBe(false);
    });

    it('paid → shipped est interdit (saut d\'étapes)', () => {
      const result = transition('paid', 'shipped');
      expect(result.ok).toBe(false);
    });

    it('prepared → cancelled est interdit (trop tard)', () => {
      const result = transition('prepared', 'cancelled');
      expect(result.ok).toBe(false);
    });

    it('prepared → created est interdit (retour en arrière)', () => {
      const result = transition('prepared', 'created');
      expect(result.ok).toBe(false);
    });

    it('prepared → paid est interdit (retour en arrière)', () => {
      const result = transition('prepared', 'paid');
      expect(result.ok).toBe(false);
    });
  });

  describe('états finaux — aucune transition sortante', () => {
    const finalStates: OrderState[] = ['shipped', 'cancelled'];
    const allStates: OrderState[] = ['created', 'paid', 'prepared', 'shipped', 'cancelled'];

    for (const from of finalStates) {
      for (const to of allStates) {
        if (from === to) continue;
        it(`${from} → ${to} est interdit (état final)`, () => {
          const result = transition(from, to);
          expect(result.ok).toBe(false);
        });
      }
    }
  });

  describe('transition vers soi-même', () => {
    const allStates: OrderState[] = ['created', 'paid', 'prepared', 'shipped', 'cancelled'];

    for (const state of allStates) {
      it(`${state} → ${state} est interdit`, () => {
        const result = transition(state, state);
        expect(result.ok).toBe(false);
      });
    }
  });
});