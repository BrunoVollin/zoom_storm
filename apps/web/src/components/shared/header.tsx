"use client";

import { Suspense } from "react";
import Link from "next/link";
import { Heart, MapPin, MagnetIcon, Package, ShieldCheck } from "lucide-react";

import { ROUTES } from "@/constants/routes";
import { CartLink } from "@/components/features/cart/cart-link";
import { UserMenu } from "@/components/features/auth/user-menu";
import { LoyaltyBalance } from "@/components/features/loyalty/loyalty-balance";
import { NotificationBell } from "@/components/shared/notification-bell";
import { SearchBar } from "@/components/shared/search-bar";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsAdmin } from "@/hooks/use-current-user";
import { useProductCategories } from "@/hooks/use-products";
import { useProfile } from "@/hooks/use-profile";
import { useAuth } from "@/providers/auth-provider";
import { useRouter } from "next/navigation";

function DeliveryAddress() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();

  let label = "Enter your zip code";
  if (user && isLoading) {
    return <Skeleton className="h-3 w-32 bg-white/20" />;
  }
  if (user && profile) {
    label = `Deliver to ${profile.address.city}, ${profile.address.zip}`;
  }

  return (
    <span className="flex items-center gap-1.5 text-xs text-white/80 sm:text-sm">
      <MapPin className="size-4 shrink-0" />
      {label}
    </span>
  );
}

function CategorySelect() {
  const router = useRouter();
  const { data: categories = [] } = useProductCategories();

  return (
    <Select
      aria-label="Categories"
      className="h-9 w-44 border-white/30 bg-transparent text-xs text-white focus-visible:ring-white/40"
      defaultValue=""
      onChange={(event) => {
        if (!event.target.value) return;
        router.push(`${ROUTES.search}?category=${encodeURIComponent(event.target.value)}`);
      }}
    >
      <option className="text-foreground" value="">
        Categories
      </option>
      {categories.map((category) => (
        <option className="text-foreground" key={category} value={category}>
          {category}
        </option>
      ))}
    </Select>
  );
}

export function Header() {
  const { user } = useAuth();
  const isAdmin = useIsAdmin();

  return (
    <header className="sticky top-0 z-20 bg-brand-purple text-white">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link
          href={ROUTES.home}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-brand-yellow px-3 py-1.5 font-bold text-brand-purple"
        >
          <MagnetIcon className="size-5" />
          Zoom Storm
        </Link>
        <div className="flex-1">
          <Suspense fallback={<Skeleton aria-hidden="true" className="h-9 w-full bg-white/20" />}>
            <SearchBar />
          </Suspense>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2 text-sm sm:px-6">
          <div className="hidden sm:block">
            <DeliveryAddress />
          </div>
          <div className="hidden md:block">
            <CategorySelect />
          </div>
          <div className="flex items-center gap-1">
            {isAdmin ? (
              <Link
                href={ROUTES.adminProducts}
                className="hidden items-center gap-1.5 rounded-md px-2 py-1.5 text-white/90 hover:bg-white/10 hover:text-white sm:flex"
              >
                <ShieldCheck className="size-4" />
                Admin
              </Link>
            ) : null}
            {user ? (
              <Link
                href={ROUTES.orders}
                aria-label="My orders"
                className="flex items-center gap-1.5 rounded-md p-2 text-white/90 hover:bg-white/10 hover:text-white"
              >
                <Package className="size-5" />
              </Link>
            ) : null}
            {user ? <LoyaltyBalance /> : null}
            {user ? <NotificationBell /> : null}
            <UserMenu />
            <Link
              href={ROUTES.wishlist}
              aria-label="Wishlist"
              className="flex items-center gap-1.5 rounded-md p-2 text-white/90 hover:bg-white/10 hover:text-white"
            >
              <Heart className="size-5" />
            </Link>
            <CartLink />
          </div>
        </div>
      </div>
    </header>
  );
}
