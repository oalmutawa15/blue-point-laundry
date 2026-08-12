// How long after requesting a pickup the customer may still cancel it themselves.
// Client-safe (no "use server"), so both the UI and the server action can import it.
export const PICKUP_CANCEL_WINDOW_MS = 60 * 60 * 1000; // 1 hour
