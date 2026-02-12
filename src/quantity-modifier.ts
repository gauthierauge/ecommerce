import { PartialCancellationError, err } from './types';
import type {
  Order, CartItem, Promotion, Discount, Refund,
  RefundResult, RefundNegativeError, Result,
  IStockManager,
} from './types';
import type { RefundCalculatorDeps } from './refund-calculator';

type CalculateRefundFn = (
  order: Order,
  remainingItems: readonly CartItem[],
  promotions: readonly Promotion[],
  deps: RefundCalculatorDeps,
) => Result<RefundResult, RefundNegativeError>;

type ApplyPromotionsFn = (cart: readonly CartItem[], promos: readonly Promotion[], now: Date, subtotal: number) => Discount[];
type CalculateTotalFn = (cart: readonly CartItem[], discounts: readonly Discount[]) => number;

export interface QuantityModificationDeps {
  calculateRefund: CalculateRefundFn;
  applyPromotions: ApplyPromotionsFn;
  calculateTotal: CalculateTotalFn;
  stockManager: IStockManager;
}

type ModificationError = PartialCancellationError | RefundNegativeError;

let nextRefundId = 0;

export function handleQuantityModification(
  order: Order,
  productId: string,
  newQuantity: number,
  promotions: readonly Promotion[],
  deps: QuantityModificationDeps,
  now: Date = new Date(),
): Result<{ order: Order; refund: Refund }, ModificationError> {
  // 1. Vérifier état paid (I16)
  if (order.state !== 'paid') {
    return err(new PartialCancellationError(
      `Modification impossible : commande en état ${order.state}`,
    ));
  }

  // 2. Vérifier que l'article existe
  const item = order.items.find(i => i.productId === productId);
  if (!item) {
    return err(new PartialCancellationError(`Article ${productId} absent de la commande`));
  }

  // 3. Vérifier I20 (newQty >= 1) et I19 (newQty < oldQty)
  if (newQuantity <= 0) {
    return err(new PartialCancellationError(
      'Quantité minimum : 1. Pour retirer un article, utilisez l\'annulation partielle.',
    ));
  }
  if (newQuantity >= item.quantity) {
    return err(new PartialCancellationError(
      `Impossible : la quantité ne peut que diminuer (actuelle : ${item.quantity})`,
    ));
  }

  // 4. Construire remainingItems avec quantité modifiée
  const remainingItems: CartItem[] = order.items.map(i =>
    i.productId === productId ? { ...i, quantity: newQuantity } : { ...i },
  );

  // 5. Calculer refund via refund-calculator (I22, I17)
  const calcResult = deps.calculateRefund(order, remainingItems, promotions, {
    applyPromotions: deps.applyPromotions,
    calculateTotal: deps.calculateTotal,
  });
  if (!calcResult.ok) return err(calcResult.error);

  const { newDiscounts, newTotal, refundAmount } = calcResult.value;

  // 6. Ajuster la réservation (I21, I23)
  const reservation = order.reservations.find(r => r.productId === productId);
  if (reservation) {
    deps.stockManager.adjustReservation(reservation.id, newQuantity);
  }

  // 7. Créer Refund (I18)
  const delta = item.quantity - newQuantity;
  const refund: Refund = {
    id: `refund-${++nextRefundId}`,
    orderId: order.id,
    removedItems: [{ productId, quantity: delta, unitPrice: item.unitPrice }],
    oldTotal: order.total,
    newTotal,
    amount: refundAmount,
    createdAt: now,
  };

  // 8. Retourner order mis à jour
  const updatedReservations = order.reservations.map(r =>
    r.productId === productId ? { ...r, quantity: newQuantity } : r,
  );

  return {
    ok: true,
    value: {
      order: {
        ...order,
        items: remainingItems,
        total: newTotal,
        discounts: newDiscounts,
        reservations: updatedReservations,
        refunds: [...(order.refunds ?? []), refund],
      },
      refund,
    },
  };
}
