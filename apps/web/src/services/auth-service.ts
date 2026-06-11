import { http } from "@/lib/http";
import { BFF_ROUTES } from "@/constants/routes";
import type { SessionUser } from "@/types/user";

/**
 * Wraps the BFF's auth endpoints (proxied through `/api/auth/*`). The BFF
 * owns the Keycloak/OAuth2 token lifecycle entirely — this layer only ever
 * sees the resulting `SessionUser`, never a token.
 */
export const authService = {
  loginUrl: `/api${BFF_ROUTES.login}`,

  logoutUrl(global = false): string {
    return `/api${BFF_ROUTES.logout}${global ? "?global=true" : ""}`;
  },

  async getCurrentUser(): Promise<SessionUser | null> {
    try {
      const { data } = await http.get<{ status: string; user: SessionUser }>(BFF_ROUTES.me);
      return data.user;
    } catch {
      return null;
    }
  },

  async logout(global = false): Promise<void> {
    await http.post(`${BFF_ROUTES.logout}${global ? "?global=true" : ""}`);
  },
};
