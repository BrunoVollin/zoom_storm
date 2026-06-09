"use client";

import Link from "next/link";
import { LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";

/**
 * Sends the browser to `/api/auth/login`, which the BFF turns into a
 * Keycloak OAuth2/PKCE redirect. The frontend never builds the auth URL
 * itself — that logic stays server-side in the BFF.
 */
export function LoginButton() {
  const { loginUrl } = useAuth();

  return (
    <Button asChild size="sm">
      <Link href={loginUrl}>
        <LogIn />
        Entrar
      </Link>
    </Button>
  );
}
