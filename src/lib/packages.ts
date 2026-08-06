// Blue Point prepaid credit packages (amounts in fils; 1 KWD = 1000 fils).
// Customer pays `deposit`, wallet is credited with `credit` (deposit + bonus).

export type CreditPackage = {
  deposit: number;
  credit: number;
  save: number; // percentage
};

export const CREDIT_PACKAGES: CreditPackage[] = [
  { deposit: 10_000, credit: 12_500, save: 25 },
  { deposit: 20_000, credit: 25_000, save: 25 },
  { deposit: 30_000, credit: 40_000, save: 33 },
  { deposit: 40_000, credit: 55_000, save: 37.5 },
  { deposit: 50_000, credit: 70_000, save: 40 },
  { deposit: 100_000, credit: 150_000, save: 50 },
];

// Look up a package by its deposit amount (server-side validation).
export function findPackage(depositFils: number): CreditPackage | undefined {
  return CREDIT_PACKAGES.find((p) => p.deposit === depositFils);
}
