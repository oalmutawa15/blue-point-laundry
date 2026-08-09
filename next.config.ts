import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
