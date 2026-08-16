import type { CookieOptions } from "@supabase/ssr";

// Keep signed-in devices signed in: give the Supabase auth cookies (sb-*-auth-token)
// an explicit long lifetime so they survive the browser/PWA being closed instead
// of behaving like session cookies that clear on exit. The refresh token inside
// keeps issuing fresh access tokens, so the shop/drivers/customers stay logged in
// on the same device.
//
// Only extend the lifetime when a real value is being written — on sign-out the
// library writes an empty value with maxAge 0 to DELETE the cookie, and we must
// let that through unchanged so logout still works.
const ONE_YEAR = 60 * 60 * 24 * 365;

export function persistAuthCookie(
  name: string,
  value: string,
  options: CookieOptions | undefined,
): CookieOptions {
  const isAuthCookie = name.startsWith("sb-") && name.includes("auth-token");
  if (isAuthCookie && value) {
    return { ...options, maxAge: ONE_YEAR, path: "/", sameSite: "lax" };
  }
  return options ?? {};
}
