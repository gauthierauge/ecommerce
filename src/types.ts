// === États de la commande ===

export type OrderState = 'created' | 'paid' | 'prepared' | 'shipped' | 'cancelled';

// === Panier ===

export interface CartItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface Cart {
  id: string;
  userId: string;
  items: readonly CartItem[];
  createdAt: Date;
}

// === Commande ===

export interface Order {
  id: string;
  cartId: string;
  userId: string;
  items: readonly CartItem[];
  state: OrderState;
  total: number;
  discounts: readonly Discount[];
  reservations: readonly Reservation[];
  refunds?: readonly Refund[];
  createdAt: Date;
}

// === Remboursement (Cycle 2) ===

export interface Refund {
  id: string;
  orderId: string;
  removedItems: readonly CartItem[];
  oldTotal: number;
  newTotal: number;
  amount: number;
  createdAt: Date;
}

export interface RefundResult {
  remainingItems: readonly CartItem[];
  newDiscounts: readonly Discount[];
  newTotal: number;
  refundAmount: number;
}

// === Réservation de stock ===

export interface Reservation {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  expiresAt: Date;
}

export interface IStockManager {
  reserve(productId: string, quantity: number, expiresAt: Date, orderId?: string): Result<Reservation, InsufficientStockError>;
  release(reservationId: string): void;
  adjustReservation(reservationId: string, newQuantity: number): Result<Reservation, InsufficientStockError>;
  getAvailableStock(productId: string): number;
  getReservation(reservationId: string): Reservation | undefined;
  getReservations(): Reservation[];
}

// === Promotions ===

export type PromotionType = 'percentage' | 'fixed_amount';

export interface Promotion {
  id: string;
  type: PromotionType;
  value: number;
  incompatibleWith: readonly string[];
  validFrom: Date;
  validUntil: Date;
}

export interface Discount {
  promotionId: string;
  amount: number;
}

// === Result type ===

export type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

// === Erreurs typées ===

export class InvalidTransitionError extends Error {
  constructor(from: OrderState, to: OrderState) {
    super(`Transition invalide : ${from} → ${to}`);
    this.name = 'InvalidTransitionError';
  }
}

export class InsufficientStockError extends Error {
  constructor(productId: string, available: number, requested: number) {
    super(`Stock insuffisant pour ${productId} : disponible=${available}, demandé=${requested}`);
    this.name = 'InsufficientStockError';
  }
}

export class IncompatiblePromotionsError extends Error {
  constructor(promoA: string, promoB: string) {
    super(`Promotions incompatibles : ${promoA} et ${promoB}`);
    this.name = 'IncompatiblePromotionsError';
  }
}

export class CartValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CartValidationError';
  }
}

export class ExpiredPromotionError extends Error {
  constructor(promotionId: string) {
    super(`Promotion expirée : ${promotionId}`);
    this.name = 'ExpiredPromotionError';
  }
}

export class PaymentExpiredError extends Error {
  constructor(orderId: string, reason = 'réservation expirée') {
    super(`Paiement rejeté : ${reason} pour la commande ${orderId}`);
    this.name = 'PaymentExpiredError';
  }
}

export class DuplicateOrderError extends Error {
  constructor(cartId: string) {
    super(`Une commande existe déjà pour le panier ${cartId}`);
    this.name = 'DuplicateOrderError';
  }
}

export class RefundNegativeError extends Error {
  constructor(orderId: string, refundAmount: number) {
    super(`Remboursement négatif pour ${orderId} : ${refundAmount}€`);
    this.name = 'RefundNegativeError';
  }
}

export class PartialCancellationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PartialCancellationError';
  }
}