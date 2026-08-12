import { KUWAIT_AREAS } from "@/lib/kuwait";

// Orders the driver's stops so that all orders in one area are done together, and
// areas are visited by proximity — starting from the shop, always hopping to the
// NEAREST remaining area next (not alphabetically). Within an area, the nearest
// order to where the driver just was comes first. Stops with no known location
// fall to the end.
//
// Example: 3 orders in Jabriya, 1 in Surra, 1 in Mazraa → all of the nearest
// area first (each order nearest-first), then the next-nearest area, and so on.

const SHOP = { lat: 29.3348158, lng: 48.072984 };

type Coord = { lat: number; lng: number };
type Addr = { area?: string | null; lat?: number | null; lng?: number | null } | null | undefined;
type HasAddr = { pickup_address?: Addr };

// Squared euclidean distance — fine for ordering stops within Kuwait.
function dist(a: Coord, b: Coord): number {
  const dLat = a.lat - b.lat;
  const dLng = a.lng - b.lng;
  return dLat * dLat + dLng * dLng;
}

// Best-effort coordinate for an address: its own lat/lng, else the centre of its
// named area from the Kuwait area table.
function coordOf(addr: Addr): Coord | null {
  if (addr?.lat != null && addr?.lng != null) return { lat: addr.lat, lng: addr.lng };
  if (addr?.area) {
    const a = KUWAIT_AREAS.find((x) => x.en === addr.area || x.ar === addr.area);
    if (a) return { lat: a.lat, lng: a.lng };
  }
  return null;
}

function avg(nums: number[]): number {
  return nums.reduce((s, n) => s + n, 0) / nums.length;
}

// Nearest-neighbour chain over a set of orders, starting from `from`.
function nearestChain<T extends HasAddr>(orders: T[], from: Coord): T[] {
  const remaining = [...orders];
  const out: T[] = [];
  let cur = from;
  while (remaining.length) {
    let bestIdx = 0;
    let bestD = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const c = coordOf(remaining[i].pickup_address);
      const d = c ? dist(cur, c) : Infinity;
      if (d < bestD) {
        bestD = d;
        bestIdx = i;
      }
    }
    const [picked] = remaining.splice(bestIdx, 1);
    out.push(picked);
    const pc = coordOf(picked.pickup_address);
    if (pc) cur = pc;
  }
  return out;
}

export function routeOrders<T extends HasAddr>(orders: T[]): T[] {
  if (orders.length <= 1) return [...orders];

  // Group by area label.
  const groups = new Map<string, T[]>();
  for (const o of orders) {
    const key = o.pickup_address?.area ?? "—";
    const arr = groups.get(key);
    if (arr) arr.push(o);
    else groups.set(key, [o]);
  }

  // A node per area, with a representative coordinate (centroid of its orders).
  const nodes = [...groups.entries()].map(([area, os]) => {
    const coords = os.map((o) => coordOf(o.pickup_address)).filter((c): c is Coord => c != null);
    const coord = coords.length
      ? { lat: avg(coords.map((c) => c.lat)), lng: avg(coords.map((c) => c.lng)) }
      : null;
    return { area, orders: os, coord };
  });

  const located = nodes.filter((n) => n.coord) as { area: string; orders: T[]; coord: Coord }[];
  const unlocated = nodes
    .filter((n) => !n.coord)
    .sort((a, b) => a.area.localeCompare(b.area));

  // Greedy nearest-area tour starting from the shop.
  const remaining = new Set(located);
  let cur: Coord = SHOP;
  const result: T[] = [];
  while (remaining.size) {
    let best: (typeof located)[number] | null = null;
    let bestD = Infinity;
    for (const n of remaining) {
      const d = dist(cur, n.coord);
      if (d < bestD) {
        bestD = d;
        best = n;
      }
    }
    if (!best) break;
    remaining.delete(best);
    // Within the area, order the orders nearest-first from where we arrived.
    const chained = nearestChain(best.orders, cur);
    result.push(...chained);
    // Continue the tour from the last stop we actually served.
    const last = chained[chained.length - 1];
    cur = coordOf(last?.pickup_address) ?? best.coord;
  }

  // Orders with no known location go last.
  for (const n of unlocated) result.push(...n.orders);
  return result;
}
