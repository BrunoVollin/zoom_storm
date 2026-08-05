"use client";

import Link from "next/link";
import { Heart, Package, ShieldCheck, MagnetIcon } from "lucide-react";

import { ROUTES } from "@/constants/routes";
import { CartLink } from "@/components/features/cart/cart-link";
import { UserMenu } from "@/components/features/auth/user-menu";
import { NotificationBell } from "@/components/shared/notification-bell";
import { LoyaltyBalance } from "@/components/features/loyalty/loyalty-balance";
import { useIsAdmin } from "@/hooks/use-current-user";
import { useAuth } from "@/providers/auth-provider";

export function Header() {
  const { user } = useAuth();
  const isAdmin = useIsAdmin();

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href={ROUTES.home} className="flex items-center gap-2 font-semibold">
          <MagnetIcon className="size-6" />
          Zoom Storm
        </Link>
        <div className="flex items-center gap-2">
          {isAdmin ? (
            <Link
              href={ROUTES.adminProducts}
              className="hidden items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground sm:flex"
            >
              <ShieldCheck className="size-4" />
              Admin
            </Link>
          ) : null}
          {user ? (
            <Link
              href={ROUTES.orders}
              aria-label="Meus pedidos"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <Package className="size-5" />
            </Link>
          ) : null}
          {user ? (
            <Link
              href={ROUTES.wishlist}
              aria-label="Favoritos"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <Heart className="size-5" />
            </Link>
          ) : null}
          {user ? <LoyaltyBalance /> : null}
          {user ? <NotificationBell /> : null}
          <CartLink />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
