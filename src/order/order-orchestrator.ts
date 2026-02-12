import { DuplicateOrderError, ok, err } from '../types';
import type {
  Cart, CartItem, Order, OrderState, Promotion, Discount,
  Reservation, Result, IStockManager,
  CartValidationError, IncompatiblePromotionsError,
  InsufficientStockError, InvalidTransitionError,
} from '../types';

const RESERVATION_DURATION_MS = 30 * 60 * 1000; // 30 minutes

type ValidateCartFn = (items: readonly CartItem[]) => Result<void, CartValidationError>;
type CheckCompatibilityFn = (promos: readonly Promotion[]) => Result<void, IncompatiblePromotionsError>;
type ApplyPromotionsFn = (cart: readonly CartItem[], promos: readonly Promotion[], now: Date, subtotal: number) => Discount[];
type CalculateTotalFn = (cart: readonly CartItem[], discounts: readonly Discount[]) => number;
type TransitionFn = (from: OrderState, to: OrderState) => Result<OrderState, InvalidTransitionError>;

export interface CreateOrderDeps {
  validateCart: ValidateCartFn;
  checkCompatibility: CheckCompatibilityFn;
  applyPromotions: ApplyPromotionsFn;
  calculateTotal: CalculateTotalFn;
  stockManager: IStockManager;
  transition: TransitionFn;
}

type CreateOrderError =
  | CartValidationError
  | IncompatiblePromotionsError
  | InsufficientStockError
  | DuplicateOrderError
  | InvalidTransitionError;

let nextOrderId = 0;

export function createOrder(
  cart: Cart,
  promotions: readonly Promotion[],
  existingOrders: readonly Order[],
  deps: CreateOrderDeps,
  now: Date,
): Result<Order, CreateOrderError> {
  // Snapshot immutable du panier (S6)
  const items: CartItem[] = cart.items.map(i => ({ ...i }));

  // I11 — unicité commande/panier
  const duplicate = existingOrders.some(o => o.cartId === cart.id);
  if (duplicate) {
    return err(new DuplicateOrderError(cart.id));
  }

  // 1. Valider le panier (I6, I9)
  const validation = deps.validateCart(items);
  if (!validation.ok) return err(validation.error);

  // 2. Vérifier compatibilité des promos (I3)
  const compat = deps.checkCompatibility(promotions);
  if (!compat.ok) return err(compat.error);

  // 3. Calculer le subtotal puis appliquer les promos (I12)
  const subtotal = deps.calculateTotal(items, []);
  const discounts = deps.applyPromotions(items, promotions, now, subtotal);

  // 4. Calculer le total final (I7)
  const total = deps.calculateTotal(items, discounts);

  // 5. Réserver le stock pour chaque item (I1)
  const expiresAt = new Date(now.getTime() + RESERVATION_DURATION_MS);
  const orderId = `order-${++nextOrderId}`;
  const reservations: Reservation[] = [];

  for (const item of items) {
    const res = deps.stockManager.reserve(item.productId, item.quantity, expiresAt, orderId);
    if (!res.ok) {
      // Rollback des réservations précédentes
      for (const prev of reservations) {
        deps.stockManager.release(prev.id);
      }
      return err(res.error);
    }
    reservations.push(res.value);
  }

  // 6. Créer la commande en état created (I2)
  const order: Order = {
    id: orderId,
    cartId: cart.id,
    userId: cart.userId,
    items,
    state: 'created',
    total,
    discounts,
    reservations,
    createdAt: now,
  };

  return ok(order);
}