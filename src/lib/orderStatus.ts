import type { OrderStatus } from "@/types/database";

// The status dictionary shape we need (a subset of t.status).
type StatusDict = Record<OrderStatus, string> & {
  readyPickup: string;
  collected: string;
};

// Human label for an order status, adjusted for how the order is handed over.
// For self-pickup orders the "ready" and "delivered" stages read as
// "ready for pickup" and "picked up" instead of the delivery wording.
export function statusLabel(
  status: StatusDict,
  value: OrderStatus,
  fulfillment?: string | null,
): string {
  if (fulfillment === "self_pickup") {
    if (value === "ready") return status.readyPickup;
    if (value === "delivered") return status.collected;
  }
  return status[value];
}
