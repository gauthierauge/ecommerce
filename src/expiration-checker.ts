// @ts-ignore
import type { Order, OrderState, Result, IStockManager, InvalidTransitionError } from './types';

type TransitionFn = (from: OrderState, to: OrderState) => Result<OrderState, InvalidTransitionError>;

export function checkExpirations(
  orders: readonly Order[],
  now: Date,
  stockManager: IStockManager,
  transition: TransitionFn,
): Order[] {
  const cancelled: Order[] = [];

  for (const order of orders) {
    // Seules les commandes en 'created' sont concernées par l'expiration (I4)
    if (order.state !== 'created') continue;

    // Vérifier si au moins une réservation est expirée
    const hasExpired = order.reservations.some(r => r.expiresAt <= now);
    if (!hasExpired) continue;

    // Libérer le stock de toutes les réservations
    for (const reservation of order.reservations) {
      stockManager.release(reservation.id);
    }

    const newState = transition(order.state, 'cancelled');
    if (newState.ok) {
      cancelled.push({ ...order, state: newState.value });
    }
  }

  return cancelled;
}
