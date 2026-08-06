import type { UserRole } from "@/types/database";

// Where each role lands after login. (admin → /shop for now; dedicated admin area is a later task.)
export function roleHomePath(role: UserRole): string {
  switch (role) {
    case "shop":
      return "/shop";
    case "driver":
      return "/driver";
    case "admin":
      return "/admin";
    default:
      return "/home";
  }
}
