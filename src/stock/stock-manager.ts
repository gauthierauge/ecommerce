import { InsufficientStockError, ok, err } from '../types';
import type { IStockManager, Reservation, Result } from '../types';

export class StockManager implements IStockManager {
  private stock: Map<string, number>;
  private reservations: Map<string, Reservation> = new Map();
  private nextId = 0;

  constructor(initialStock: Record<string, number>) {
    this.stock = new Map(Object.entries(initialStock));
  }

  reserve(
    productId: string,
    quantity: number,
    expiresAt: Date,
    orderId: string = '',
  ): Result<Reservation, InsufficientStockError> {
    const available = this.getAvailableStock(productId);

    if (available < quantity) {
      return err(new InsufficientStockError(productId, available, quantity));
    }

    const reservation: Reservation = {
      id: `res-${++this.nextId}`,
      orderId,
      productId,
      quantity,
      expiresAt,
    };

    this.reservations.set(reservation.id, reservation);
    return ok(reservation);
  }

  release(reservationId: string): void {
    this.reservations.delete(reservationId);
  }

  adjustReservation(
    reservationId: string,
    newQuantity: number,
  ): Result<Reservation, InsufficientStockError> {
    const existing = this.reservations.get(reservationId);
    if (!existing) {
      return err(new InsufficientStockError(reservationId, 0, newQuantity));
    }
    if (newQuantity <= 0 || newQuantity > existing.quantity) {
      return err(new InsufficientStockError(existing.productId, existing.quantity, newQuantity));
    }
    const updated: Reservation = { ...existing, quantity: newQuantity };
    this.reservations.set(reservationId, updated);
    return ok(updated);
  }

  getAvailableStock(productId: string): number {
    const total = this.stock.get(productId) ?? 0;
    let reserved = 0;

    for (const res of this.reservations.values()) {
      if (res.productId === productId) {
        reserved += res.quantity;
      }
    }

    return total - reserved;
  }

  getReservation(reservationId: string): Reservation | undefined {
    return this.reservations.get(reservationId);
  }

  getReservations(): Reservation[] {
    return Array.from(this.reservations.values());
  }
}
