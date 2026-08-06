import Image from "next/image";
import Link from "next/link";
import { Gamepad2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PriceTag } from "@/components/shared/price-tag";
import { RatingStars } from "@/components/shared/rating-stars";
import { ROUTES } from "@/constants/routes";
import { formatPrice } from "@/utils/format-price";
import { getDefaultVariant, type Product } from "@/types/product";
import { useActiveFlashOffers } from "@/hooks/use-flash-offers";

import { AddToCartButton } from "@/components/features/cart/add-to-cart-button";
import { WishlistButton } from "@/components/features/products/wishlist-button";

// dummyjson's shippingInformation never actually says "free"/"grátis" — as a
// stand-in signal until the API exposes real shipping cost, treat higher-
// priced items (>= R$200) as free-shipping eligible, matching common
// marketplace free-shipping thresholds.
const FREE_SHIPPING_THRESHOLD_CENTS = 20000;

export function ProductCard({ product }: { product: Product }) {
  const variant = getDefaultVariant(product);
  const { data: activeFlashOffers } = useActiveFlashOffers();
  // Only Flash Offers (time-limited, item-specific promotions managed in
  // /admin/flash-offers) should drive the discount badge/strikethrough —
  // product.discountPercentage is raw dummyjson seed data present on nearly
  // every product and doesn't represent a real, active promotion.
  const flashOffer = activeFlashOffers?.find((offer) => offer.productId === product.id) ?? null;
  const oldPriceCents = flashOffer
    ? Math.round(variant.price / (1 - flashOffer.discountPct / 100))
    : null;
  const isFreeShipping = variant.price >= FREE_SHIPPING_THRESHOLD_CENTS;

  return (
    <Card className="relative flex h-full flex-col overflow-hidden">
      <WishlistButton productId={product.id} className="absolute right-2 top-2 z-10" />
      <Link href={ROUTES.product(product.id)} className="flex flex-1 flex-col">
        <div className="relative flex aspect-square items-center justify-center bg-muted text-muted-foreground">
          {product.thumbnail ? (
            <Image src={product.thumbnail} alt={product.name} fill className="object-cover" />
          ) : (
            <Gamepad2 className="size-12" />
          )}
          {flashOffer ? (
            <Badge className="absolute left-2 top-2 border-transparent bg-brand-green text-white">
              -{Math.round(flashOffer.discountPct)}%
            </Badge>
          ) : null}
        </div>
        <CardHeader>
          <Badge variant="muted" className="w-fit">
            {product.category}
          </Badge>
          <CardTitle className="line-clamp-2 text-base">{product.name}</CardTitle>
          <div className="flex h-5 items-center">
            {product.rating ? <RatingStars value={product.rating} /> : null}
          </div>
        </CardHeader>
        <CardContent className="mt-auto flex flex-col gap-1">
          {oldPriceCents ? (
            <span className="text-xs text-muted-foreground line-through">{formatPrice(oldPriceCents)}</span>
          ) : null}
          <PriceTag cents={variant.price} className="text-lg" />
          {isFreeShipping ? (
            <span className="text-xs font-medium text-brand-green">Free shipping</span>
          ) : null}
        </CardContent>
      </Link>
      {/* <CardFooter>
        <AddToCartButton productId={variant.id} className="w-full" disabled={variant.stock <= 0} />
      </CardFooter> */}
    </Card>
  );
}
