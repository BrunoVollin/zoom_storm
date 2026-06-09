"use client";

import { UserRound } from "lucide-react";

import { LoginButton } from "@/components/features/auth/login-button";
import { LogoutButton } from "@/components/features/auth/logout-button";
import { useAuth } from "@/providers/auth-provider";

/**
 * Composes the session state into either a login CTA or the signed-in
 * user's identity plus a logout action — the only place that branches on
 * `user` for the header.
 */
export function UserMenu() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="h-9 w-20 animate-pulse rounded-md bg-muted" />;
  }

  if (!user) {
    return <LoginButton />;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="hidden items-center gap-1.5 text-sm text-muted-foreground sm:flex">
        <UserRound className="size-4" />
        {user.name ?? user.email ?? user.subject}
      </span>
      <LogoutButton />
    </div>
  );
}
