"use client";

import { Heart } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { WishlistItemCard } from "@/components/features/wishlist/wishlist-item-card";
import { useWishlist } from "@/hooks/use-wishlist";

export default function WishlistPage() {
  const { items, isLoading, error } = useWishlist();

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
