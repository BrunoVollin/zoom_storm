"use client";

import Image from "next/image";
import Link from "next/link";
import { Gamepad2, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PriceTag } from "@/components/shared/price-tag";
import { AddToCartButton } from "@/components/features/cart/add-to-cart-button";
import { ROUTES } from "@/constants/routes";
import { useWishlist } from "@/hooks/use-wishlist";
import { useProduct } from "@/hooks/use-products";
import { getDefaultVariant } from "@/types/product";
import type { WishlistItem } from "@/types/wishlist";

export function WishlistItemCard({ item }: { item: WishlistItem }) {
  const { removeFromWishlist } = useWishlist();
  const { data: product } = useProduct(item.productId);
  const variant = product ? getDefaultVariant(product) : null;

  return (
    <Card className="flex flex-col overflow-hidden">
      <Link href={ROUTES.product(item.productId)} className="flex flex-1 flex-col">
        <div className="relative flex aspect-square items-center justify-center bg-muted text-muted-foreground">
          {product?.thumbnail ? (
            <Image
              src={product.thumbnail}
              alt={item.productName}
              fill
              className="object-cover"
            />
          ) : (
            <Gamepad2 className="size-12" />
          )}
        </div>
        <CardHeader>
          <CardTitle className="line-clamp-2 text-base">{item.productName}</CardTitle>
        </CardHeader>
        <CardContent className="mt-auto">
          {variant ? <PriceTag cents={variant.price} className="text-lg" /> : null}
        </CardContent>
      </Link>
      <CardFooter className="flex gap-2">
        <AddToCartButton
          productId={variant?.id ?? item.productId}
          disabled={!variant}
          className="flex-1"
        />
        <Button
          data-testid="wishlist-remove-btn"
          type="button"
          variant="outline"
          size="icon"
          aria-label="Remove from wishlist"
          disabled={removeFromWishlist.isPending}
          onClick={() => removeFromWishlist.mutate(item.productId)}
        >
          {removeFromWishlist.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <X className="size-4" />
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
