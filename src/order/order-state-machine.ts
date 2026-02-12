import { InvalidTransitionError, ok, err } from '../types';
import type { OrderState, Result } from '../types';

export type { OrderState };

const TRANSITIONS: Record<OrderState, readonly OrderState[]> = {
  created:   ['paid', 'cancelled'],
  paid:      ['prepared', 'cancelled'],
  prepared:  ['shipped'],
  shipped:   [],
  cancelled: [],
};

export function transition(
  from: OrderState,
  to: OrderState,
): Result<OrderState, InvalidTransitionError> {
  const allowed = TRANSITIONS[from];

  if (allowed.includes(to)) {
    return ok(to);
  }

  return err(new InvalidTransitionError(from, to));
}
