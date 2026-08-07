"use client";

import Link from "next/link";
import { LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";

/** Opens the storefront sign-in screen; provider buttons on that screen
 * hand off to the BFF-owned OAuth2/PKCE routes. */
export function LoginButton() {
  return (
    <Button asChild size="sm">
      <Link data-testid="login-btn" href={ROUTES.login}>
        <LogIn />
        Sign in
      </Link>
    </Button>
  );
}
