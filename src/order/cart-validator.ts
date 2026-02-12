import { CartValidationError, ok, err } from '../types';
import type { CartItem, Result } from '../types';

export function validateCart(
  items: readonly CartItem[],
): Result<void, CartValidationError> {
  if (items.length === 0) {
    return err(new CartValidationError('Le panier est vide'));
  }

  for (const item of items) {
    if (item.quantity < 1) {
      return err(new CartValidationError(
        `Quantité invalide pour ${item.productId} : ${item.quantity} (doit être ≥ 1)`,
      ));
    }

    if (item.unitPrice <= 0) {
      return err(new CartValidationError(
        `Prix invalide pour ${item.productId} : ${item.unitPrice} (doit être > 0)`,
      ));
    }
  }

  return ok(undefined);
}