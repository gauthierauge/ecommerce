import { describe, it, expect, beforeEach } from 'vitest';
import { StockManager } from '../src/stock-manager';

describe('stock-manager', () => {
  let manager: StockManager;
  const expiresAt = new Date('2026-12-31');

  beforeEach(() => {
    manager = new StockManager({ 'ARTICLE-A': 10, 'ARTICLE-B': 1 });
  });

  describe('réservation — cas nominaux', () => {
    it('réserve du stock quand il est disponible', () => {
      const result = manager.reserve('ARTICLE-A', 3, expiresAt);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.productId).toBe('ARTICLE-A');
        expect(result.value.quantity).toBe(3);
        expect(result.value.expiresAt).toBe(expiresAt);
        expect(result.value.id).toBeDefined();
      }
    });

    it('réserve le dernier article → stock dispo = 0', () => {
      const result = manager.reserve('ARTICLE-B', 1, expiresAt);
      expect(result.ok).toBe(true);
      expect(manager.getAvailableStock('ARTICLE-B')).toBe(0);
    });

    it('la réservation porte un expiresAt (H5)', () => {
      const result = manager.reserve('ARTICLE-A', 1, expiresAt);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.expiresAt).toEqual(expiresAt);
      }
    });
  });

  describe('réservation — erreurs I1 (pas de survente)', () => {
    it('refuse de réserver plus que le stock disponible', () => {
      const result = manager.reserve('ARTICLE-A', 11, expiresAt);
      expect(result.ok).toBe(false);
    });

    it('refuse de réserver quand stock = 0', () => {
      manager.reserve('ARTICLE-B', 1, expiresAt);
      const result = manager.reserve('ARTICLE-B', 1, expiresAt);
      expect(result.ok).toBe(false);
    });

    it('refuse de réserver un produit inexistant', () => {
      const result = manager.reserve('INEXISTANT', 1, expiresAt);
      expect(result.ok).toBe(false);
    });
  });

  describe('libération — I4', () => {
    it('libérer une réservation rend le stock disponible', () => {
      const result = manager.reserve('ARTICLE-B', 1, expiresAt);
      expect(result.ok).toBe(true);
      expect(manager.getAvailableStock('ARTICLE-B')).toBe(0);

      if (result.ok) {
        manager.release(result.value.id);
        expect(manager.getAvailableStock('ARTICLE-B')).toBe(1);
      }
    });

    it('libérer une réservation inexistante ne fait rien', () => {
      expect(() => manager.release('FAKE-ID')).not.toThrow();
    });
  });

  describe('stock disponible', () => {
    it('stock disponible = stock total - tokens actifs', () => {
      expect(manager.getAvailableStock('ARTICLE-A')).toBe(10);
      manager.reserve('ARTICLE-A', 3, expiresAt);
      expect(manager.getAvailableStock('ARTICLE-A')).toBe(7);
      manager.reserve('ARTICLE-A', 2, expiresAt);
      expect(manager.getAvailableStock('ARTICLE-A')).toBe(5);
    });

    it('stock disponible = 0 pour un produit inexistant', () => {
      expect(manager.getAvailableStock('INEXISTANT')).toBe(0);
    });
  });

  describe('atomicité — I1 (deux réservations sur le dernier article)', () => {
    it('deux réservations sur le dernier article : une réussit, l\'autre échoue', () => {
      const manager1 = new StockManager({ 'RARE': 1 });
      const result1 = manager1.reserve('RARE', 1, expiresAt);
      const result2 = manager1.reserve('RARE', 1, expiresAt);

      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(false);
    });

    it('la réservation est synchrone (pas de Promise retournée)', () => {
      const result = manager.reserve('ARTICLE-A', 1, expiresAt);
      // Si c'était async, result serait une Promise, pas un Result
      expect(result).toHaveProperty('ok');
      expect(result.ok).toBe(true);
    });
  });
});