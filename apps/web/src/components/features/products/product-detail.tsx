import { Gamepad2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { PriceTag } from "@/components/shared/price-tag";
import type { Product } from "@/types/product";

import { AddToCartButton } from "@/components/features/cart/add-to-cart-button";

export function ProductDetail({ product }: { product: Product }) {
  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="flex aspect-square items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Gamepad2 className="size-24" />
      </div>
      <div className="flex flex-col gap-4">
        <div>
          <Badge variant="muted" className="mb-2 w-fit">
            {product.category}
          </Badge>
          <h1 className="text-2xl font-semibold">{product.name}</h1>
        </div>
        <p className="text-muted-foreground">{product.description}</p>
        <PriceTag cents={product.price} className="text-3xl" />
        <p className="text-sm text-muted-foreground">
          {product.stock > 0 ? `${product.stock} unidades em estoque` : "Sem estoque no momento"}
        </p>
        <AddToCartButton
          productId={product.id}
          disabled={product.stock <= 0}
          className="w-full md:w-auto"
        />
      </div>
    </div>
  );
}
