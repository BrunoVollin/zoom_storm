"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { WishlistItemCard } from "@/components/features/wishlist/wishlist-item-card";
import { useAuth } from "@/providers/auth-provider";
import { useWishlist } from "@/hooks/use-wishlist";

export default function WishlistPage() {
  const { isLoading: isAuthLoading } = useAuth();
  const { items, isLoading: isWishlistLoading, error } = useWishlist();

  // `useWishlist()`'s `isLoading` depends on `Boolean(user)` from the auth
  // query (see use-wishlist.ts), which resolves asynchronously on the
  // client. SSR always renders with no user yet, so if this page picked
  // between EmptyState/LoadingSpinner/content using that value directly, a
  // client render that manages to resolve auth before its first paint
  // (or a stale SSR pass) could hydrate with a different branch than the
  // server sent, producing a hydration mismatch (see CONCERN-0011). Track
  // whether we've mounted on the client and always render the same
  // LoadingSpinner-only markup SSR produces until then, so the branch that
  // depends on auth/wishlist state only ever renders after hydration has
  // already completed.
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);

  const isLoading = !hasMounted || isAuthLoading || isWishlistLoading;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Wishlist</h1>
        <p className="text-sm text-muted-foreground">Products you saved for later.</p>
      </div>

      {isLoading ? <LoadingSpinner /> : null}
      {error ? (
        <ErrorState
          title="We couldn't load your wishlist"
          message="Please try again in a moment."
        />
      ) : null}
      {!isLoading && !error && items.length === 0 ? (
        <EmptyState
          icon={<Heart className="size-10" />}
          title="Your wishlist is empty"
          description="Tap the heart on a product to save it here."
        />
      ) : null}
      {items.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <WishlistItemCard key={item.id} item={item} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
