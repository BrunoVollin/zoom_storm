import Image from "next/image";
import Link from "next/link";
import { Gamepad2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PriceTag } from "@/components/shared/price-tag";
import { RatingStars } from "@/components/shared/rating-stars";
import { ROUTES } from "@/constants/routes";
import { getDefaultVariant, type Product } from "@/types/product";

import { AddToCartButton } from "@/components/features/cart/add-to-cart-button";
import { WishlistButton } from "@/components/features/products/wishlist-button";

export function ProductCard({ product }: { product: Product }) {
  const variant = getDefaultVariant(product);

  return (
    <Card className="relative flex flex-col overflow-hidden">
      <WishlistButton productId={product.id} className="absolute right-2 top-2 z-10" />
      <Link href={ROUTES.product(product.id)} className="flex flex-1 flex-col">
        <div className="relative flex aspect-square items-center justify-center bg-muted text-muted-foreground">
          {product.thumbnail ? (
            <Image src={product.thumbnail} alt={product.name} fill className="object-cover" />
          ) : (
            <Gamepad2 className="size-12" />
          )}
          {product.discountPercentage ? (
            <Badge className="absolute left-2 top-2">-{Math.round(product.discountPercentage)}%</Badge>
          ) : null}
        </div>
        <CardHeader>
          <Badge variant="muted" className="w-fit">
            {product.category}
          </Badge>
          <CardTitle className="line-clamp-2 text-base">{product.name}</CardTitle>
          {product.rating ? <RatingStars value={product.rating} /> : null}
        </CardHeader>
        <CardContent className="mt-auto">
          <PriceTag cents={variant.price} className="text-lg" />
        </CardContent>
      </Link>
      {/* <CardFooter>
        <AddToCartButton productId={variant.id} className="w-full" disabled={variant.stock <= 0} />
      </CardFooter> */}
    </Card>
  );
}
