import type { Tables } from "@/types/database";

export type CustomerLite = { full_name: string | null; phone: string } | null;

export type OrderWithRelations = Tables<"orders"> & {
  customer: CustomerLite;
  pickup_address: Tables<"addresses"> | null;
};

export type DriverLite = { id: string; full_name: string | null; phone: string };
