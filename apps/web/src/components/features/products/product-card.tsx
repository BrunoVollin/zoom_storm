import Link from "next/link";
import { Gamepad2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PriceTag } from "@/components/shared/price-tag";
import { ROUTES } from "@/constants/routes";
import type { Product } from "@/types/product";

import { AddToCartButton } from "@/components/features/cart/add-to-cart-button";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Card className="flex flex-col overflow-hidden">
      <Link href={ROUTES.product(product.id)} className="flex flex-1 flex-col">
        <div className="flex aspect-square items-center justify-center bg-muted text-muted-foreground">
          <Gamepad2 className="size-12" />
        </div>
        <CardHeader>
          <Badge variant="muted" className="w-fit">
            {product.category}
          </Badge>
          <CardTitle className="line-clamp-2 text-base">{product.name}</CardTitle>
        </CardHeader>
        <CardContent className="mt-auto">
          <PriceTag cents={product.price} className="text-lg" />
        </CardContent>
      </Link>
      <CardFooter>
        <AddToCartButton productId={product.id} className="w-full" />
      </CardFooter>
    </Card>
  );
}
