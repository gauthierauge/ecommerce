import type { CartItem, Promotion, Discount } from '../types';

function isValid(promo: Promotion, now: Date): boolean {
  return now >= promo.validFrom && now <= promo.validUntil;
}

export function applyPromotions(
  cart: readonly CartItem[],
  promotions: readonly Promotion[],
  now: Date,
  subtotal: number,
): Discount[] {
  const discounts: Discount[] = [];
  let remaining = subtotal;

  for (const promo of promotions) {
    if (!isValid(promo, now)) continue;

    let amount: number;

    switch (promo.type) {
      case 'percentage':
        amount = Math.round(remaining * (promo.value / 100) * 100) / 100;
        break;
      case 'fixed_amount':
        amount = promo.value;
        break;
    }

    amount = Math.min(amount, remaining);
    discounts.push({ promotionId: promo.id, amount });
    remaining -= amount;
    if (remaining <= 0) break;
  }

  return discounts;
}