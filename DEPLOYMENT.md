# Deploying Blue Point Laundry to Vercel

The app is production-build verified (`npm run build` passes). The Supabase backend is
already live in the cloud — deploying only publishes the Next.js front end.

## Recommended: GitHub → Vercel (secrets stay encrypted)

1. **Create a GitHub repo** (private) and push this folder to it:
   ```bash
   git init
   git add .
   git commit -m "Blue Point Laundry"
   git branch -M main
   git remote add origin https://github.com/<you>/blue-point-laundry.git
   git push -u origin main
   ```
   `.gitignore` already excludes `.env.local`, `node_modules`, and `.next`, so **no secrets are committed**.

2. **Import the repo at [vercel.com/new](https://vercel.com/new)** — Vercel auto-detects Next.js.

3. **Add these Environment Variables** in the Vercel project (Settings → Environment Variables),
   for the Production environment:

   | Variable | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://uncuouwqveuajvzmrmfz.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_eblvNQZYoKkuP5QEluUKCA_fzFo58hX` |
   | `SUPABASE_SERVICE_ROLE_KEY` | *(secret — copy from your local `.env.local`)* |
   | `AUTH_PEPPER` | *(secret — copy from your local `.env.local`)* |
   | `PHONE_EMAIL_DOMAIN` | `phone.bluepoint.app` |
   | `UPAYMENTS_MODE` | `mock` |
   | `WHATSAPP_PROVIDER` | `ultramsg` |
   | `ULTRAMSG_INSTANCE_ID` | `instance187650` |
   | `ULTRAMSG_TOKEN` | *(secret — copy from your local `.env.local`)* |

4. **Deploy.** Vercel builds and gives you a live URL.

## After deploying
- The four interfaces are live at: `/` (customer login), `/shop`, `/driver`, `/admin`.
- WhatsApp sends for real (UltraMsg) — use a dedicated shop number.
- To swap mock UPayments for real: set `UPAYMENTS_MODE` and the real UPayments keys, and
  point the top-up flow at UPayments' create-charge API (the mock already mirrors its shape).

## Notes
- Supabase migrations live in `supabase/migrations/` (already applied to the live project).
- Seed staff/driver accounts: `node --env-file=.env.local scripts/seed-team.mjs`.
