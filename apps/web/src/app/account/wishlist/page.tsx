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
        <h1 className="text-2xl font-semibold">Favoritos</h1>
        <p className="text-sm text-muted-foreground">Produtos que você salvou para depois.</p>
      </div>

      {isLoading ? <LoadingSpinner /> : null}
      {error ? (
        <ErrorState
          title="Não foi possível carregar seus favoritos"
          message="Tente novamente em instantes."
        />
      ) : null}
      {!isLoading && !error && items.length === 0 ? (
        <EmptyState
          icon={<Heart className="size-10" />}
          title="Sua lista de favoritos está vazia"
          description="Toque no coração de um produto para salvá-lo aqui."
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
