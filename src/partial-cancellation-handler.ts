import { PartialCancellationError, err } from './types';
import type {
  Order, CartItem, Promotion, Discount, Refund,
  RefundResult, RefundNegativeError, Result, OrderState,
  IStockManager, InvalidTransitionError,
} from './types';
import type { RefundCalculatorDeps } from './refund-calculator';

type CalculateRefundFn = (
  order: Order,
  remainingItems: readonly CartItem[],
  promotions: readonly Promotion[],
  deps: RefundCalculatorDeps,
) => Result<RefundResult, RefundNegativeError>;

type TransitionFn = (from: OrderState, to: OrderState) => Result<OrderState, InvalidTransitionError>;
type ApplyPromotionsFn = (cart: readonly CartItem[], promos: readonly Promotion[], now: Date, subtotal: number) => Discount[];
type CalculateTotalFn = (cart: readonly CartItem[], discounts: readonly Discount[]) => number;

export interface PartialCancellationDeps {
  calculateRefund: CalculateRefundFn;
  applyPromotions: ApplyPromotionsFn;
  calculateTotal: CalculateTotalFn;
  stockManager: IStockManager;
  transition: TransitionFn;
}

type HandlerError = PartialCancellationError | RefundNegativeError | InvalidTransitionError;

let nextRefundId = 0;

export function handlePartialCancellation(
  order: Order,
  itemsToRemove: readonly string[],
  promotions: readonly Promotion[],
  deps: PartialCancellationDeps,
  now: Date = new Date(),
): Result<{ order: Order; refund: Refund }, HandlerError> {
  // 1. Vérifier état paid (I16)
  if (order.state !== 'paid') {
    return err(new PartialCancellationError(`Annulation partielle impossible : commande en état ${order.state}`));
  }

  // 2. Vérifier que les items à retirer existent (S9)
  const itemProductIds = new Set(order.items.map(i => i.productId));
  for (const productId of itemsToRemove) {
    if (!itemProductIds.has(productId)) {
      return err(new PartialCancellationError(`Article ${productId} absent de la commande`));
    }
  }

  // 3. Calculer les items restants
  const removeSet = new Set(itemsToRemove);
  const remainingItems = order.items.filter(i => !removeSet.has(i.productId));

  // 4. Vérifier I14 : si 0 items restants → annulation totale
  if (remainingItems.length === 0) {
    const transitionResult = deps.transition(order.state, 'cancelled');
    if (!transitionResult.ok) return err(transitionResult.error);

    // Libérer TOUTES les réservations
    for (const res of order.reservations) {
      deps.stockManager.release(res.id);
    }

    const refund: Refund = {
      id: `refund-${++nextRefundId}`,
      orderId: order.id,
      removedItems: [...order.items],
      oldTotal: order.total,
      newTotal: 0,
      amount: order.total,
      createdAt: now,
    };

    return {
      ok: true,
      value: {
        order: {
          ...order,
          state: 'cancelled',
          items: [],
          total: 0,
          discounts: [],
          reservations: [],
          refunds: [...(order.refunds ?? []), refund],
        },
        refund,
      },
    };
  }

  // 5. Appeler refund-calculator (I13, I17)
  const calcResult = deps.calculateRefund(order, remainingItems, promotions, {
    applyPromotions: deps.applyPromotions,
    calculateTotal: deps.calculateTotal,
  });
  if (!calcResult.ok) return err(calcResult.error);

  const { newDiscounts, newTotal, refundAmount } = calcResult.value;

  // 6. Libérer stock des items retirés (I15)
  for (const productId of itemsToRemove) {
    const reservation = order.reservations.find(r => r.productId === productId);
    if (reservation) {
      deps.stockManager.release(reservation.id);
    }
  }

  // 7. Créer Refund (I18)
  const removedItems = order.items.filter(i => removeSet.has(i.productId));
  const refund: Refund = {
    id: `refund-${++nextRefundId}`,
    orderId: order.id,
    removedItems,
    oldTotal: order.total,
    newTotal,
    amount: refundAmount,
    createdAt: now,
  };

  // 8. Retourner order mis à jour
  const remainingReservations = order.reservations.filter(r => !removeSet.has(r.productId));

  return {
    ok: true,
    value: {
      order: {
        ...order,
        items: remainingItems,
        total: newTotal,
        discounts: newDiscounts,
        reservations: remainingReservations,
        refunds: [...(order.refunds ?? []), refund],
      },
      refund,
    },
  };
}