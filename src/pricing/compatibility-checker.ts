import { IncompatiblePromotionsError, ok, err } from '../types';
import type { Promotion, Result } from '../types';

export function checkCompatibility(
  promotions: readonly Promotion[],
): Result<void, IncompatiblePromotionsError> {
  for (let i = 0; i < promotions.length; i++) {
    for (let j = i + 1; j < promotions.length; j++) {
      const a = promotions[i];
      const b = promotions[j];

      if (a.incompatibleWith.includes(b.id) || b.incompatibleWith.includes(a.id)) {
        return err(new IncompatiblePromotionsError(a.id, b.id));
      }
    }
  }

  return ok(undefined);
}