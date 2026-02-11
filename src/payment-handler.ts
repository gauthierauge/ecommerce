import { PaymentExpiredError, ok, err } from './types';
import type { Order, OrderState, Result, IStockManager, InvalidTransitionError } from './types';

type TransitionFn = (from: OrderState, to: OrderState) => Result<OrderState, InvalidTransitionError>;

export function handlePayment(
  order: Order,
  now: Date,
  stockManager: IStockManager,
  transition: TransitionFn,
): Result<Order, PaymentExpiredError | InvalidTransitionError> {
  // Vérifier que la transition created → paid est possible (I8, S1)
  const transitionResult = transition(order.state, 'paid');
  if (!transitionResult.ok) {
    return err(transitionResult.error);
  }

  // Vérifier qu'il y a des réservations
  if (order.reservations.length === 0) {
    return err(new PaymentExpiredError(order.id, 'aucune réservation trouvée'));
  }

  // Vérifier qu'aucune réservation n'est expirée (I5, S2)
  for (const reservation of order.reservations) {
    if (reservation.expiresAt <= now) {
      return err(new PaymentExpiredError(order.id));
    }
  }

  return ok({ ...order, state: 'paid' as const });
}
