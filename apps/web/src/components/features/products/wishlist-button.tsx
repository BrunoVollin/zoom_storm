"use client";

import { Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";
import { useIsWishlisted, useWishlist } from "@/hooks/use-wishlist";
import { cn } from "@/lib/utils";

interface WishlistButtonProps {
  productId: string;
  className?: string;
}

export function WishlistButton({ productId, className }: WishlistButtonProps) {
  const { user } = useAuth();
  const isWishlisted = useIsWishlisted(productId);
  const { addToWishlist, removeFromWishlist } = useWishlist();

  if (!user) return null;

  const isPending = addToWishlist.isPending || removeFromWishlist.isPending;

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={cn(className)}
      disabled={isPending}
      aria-label={isWishlisted ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (isWishlisted) {
          removeFromWishlist.mutate(productId);
        } else {
          addToWishlist.mutate(productId);
        }
      }}
    >
      <Heart className={cn("size-4", isWishlisted && "fill-destructive text-destructive")} />
    </Button>
  );
}
