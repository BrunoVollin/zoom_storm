import { redirect } from "next/navigation";

import { authService } from "@/services/auth-service";

/**
 * No UI of its own — immediately hands off to the BFF's `/auth/login`,
 * which owns the Keycloak OAuth2/PKCE redirect. Exists as a stable,
 * linkable entry point (`/login`) for the rest of the app.
 */
export default function LoginPage() {
  redirect(authService.loginUrl);
}
