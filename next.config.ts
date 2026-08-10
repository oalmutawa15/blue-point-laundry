import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Delivery-proof photos are compressed client-side, but allow headroom so an
  // uploaded photo never trips the server action body limit.
  experimental: { serverActions: { bodySizeLimit: "6mb" } },
  // Never let a browser cache the payment pages' HTML — a stale cached document
  // would load an old JS bundle and poll incorrectly. The hashed /_next assets
  // stay immutable/cacheable; only these dynamic documents are forced fresh.
  async headers() {
    return [
      {
        source: "/pay/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, must-revalidate" }],
      },
      {
        source: "/api/payment-status",
        headers: [{ key: "Cache-Control", value: "no-store, must-revalidate" }],
      },
    ];
  },
};

export default nextConfig;
