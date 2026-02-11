import type { CartItem, Discount } from './types';

function computeSubtotal(cart: readonly CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
}

export function calculateTotal(
  cart: readonly CartItem[],
  discounts: readonly Discount[],
): number {
  const subtotal = computeSubtotal(cart);
  const totalDiscount = discounts.reduce((sum, d) => sum + d.amount, 0);
  return Math.max(0, subtotal - totalDiscount);
}