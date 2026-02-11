import { describe, it, expect } from 'vitest';
import { checkCompatibility } from '../src/compatibility-checker';
import type { Promotion } from '../src/types';

const baseDate = new Date('2026-01-01');
const endDate = new Date('2026-12-31');

function makePromo(id: string, incompatibleWith: string[] = []): Promotion {
  return {
    id,
    type: 'percentage',
    value: 10,
    incompatibleWith,
    validFrom: baseDate,
    validUntil: endDate,
  };
}

describe('compatibility-checker', () => {
  it('deux promos compatibles → OK', () => {
    const promoA = makePromo('A');
    const promoB = makePromo('B');
    const result = checkCompatibility([promoA, promoB]);
    expect(result.ok).toBe(true);
  });

  it('deux promos incompatibles → erreur (I3)', () => {
    const promoA = makePromo('A', ['B']);
    const promoB = makePromo('B');
    const result = checkCompatibility([promoA, promoB]);
    expect(result.ok).toBe(false);
  });

  it('incompatibilité dans l\'autre sens → erreur (I3)', () => {
    const promoA = makePromo('A');
    const promoB = makePromo('B', ['A']);
    const result = checkCompatibility([promoA, promoB]);
    expect(result.ok).toBe(false);
  });

  it('une seule promo → toujours OK', () => {
    const promoA = makePromo('A', ['B']);
    const result = checkCompatibility([promoA]);
    expect(result.ok).toBe(true);
  });

  it('liste vide → OK', () => {
    const result = checkCompatibility([]);
    expect(result.ok).toBe(true);
  });

  it('trois promos dont deux incompatibles → erreur (I3)', () => {
    const promoA = makePromo('A', ['C']);
    const promoB = makePromo('B');
    const promoC = makePromo('C');
    const result = checkCompatibility([promoA, promoB, promoC]);
    expect(result.ok).toBe(false);
  });
});