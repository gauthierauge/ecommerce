import { RefundNegativeError, ok, err } from '../types';
import type { Order, CartItem, Promotion, Discount, RefundResult, Result } from '../types';

type ApplyPromotionsFn = (cart: readonly CartItem[], promos: readonly Promotion[], now: Date, subtotal: number) => Discount[];
type CalculateTotalFn = (cart: readonly CartItem[], discounts: readonly Discount[]) => number;

export interface RefundCalculatorDeps {
  applyPromotions: ApplyPromotionsFn;
  calculateTotal: CalculateTotalFn;
}

export function calculateRefund(
  order: Order,
  remainingItems: readonly CartItem[],
  promotions: readonly Promotion[],
  deps: RefundCalculatorDeps,
): Result<RefundResult, RefundNegativeError> {
  // Recalculer avec order.createdAt (H6)
  const subtotal = deps.calculateTotal(remainingItems, []);
  const newDiscounts = deps.applyPromotions(remainingItems, promotions, order.createdAt, subtotal);
  const newTotal = deps.calculateTotal(remainingItems, newDiscounts);

  const refundAmount = order.total - newTotal;

  // I17 — remboursement ≥ 0
  if (refundAmount < 0) {
    return err(new RefundNegativeError(order.id, refundAmount));
  }

  return ok({ remainingItems, newDiscounts, newTotal, refundAmount });
}