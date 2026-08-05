"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Gamepad2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { InstallmentOptions } from "@/components/shared/installment-options";
import { PriceTag } from "@/components/shared/price-tag";
import { RatingStars } from "@/components/shared/rating-stars";
import { ShareButtons } from "@/components/shared/share-buttons";
import { ProductGrid } from "@/components/features/products/product-grid";
import { useProducts } from "@/hooks/use-products";
import { useHasDeliveredOrder } from "@/hooks/use-orders";
import { cn } from "@/lib/utils";
import { getDefaultVariant, type Product } from "@/types/product";

import { AddToCartButton } from "@/components/features/cart/add-to-cart-button";
import { WishlistButton } from "@/components/features/products/wishlist-button";
import { ReviewForm } from "@/components/features/products/review-form";
import { useAuth } from "@/providers/auth-provider";

export function ProductDetail({ product }: { product: Product }) {
  const { user } = useAuth();
  const canReview = useHasDeliveredOrder(product.id);
  const images = product.images.length > 0 ? product.images : [];
  const [activeImage, setActiveImage] = useState(images[0] ?? product.thumbnail ?? null);
  const [selectedVariantId, setSelectedVariantId] = useState(
    () => getDefaultVariant(product).id,
  );

  const variant =
    product.variants.find((v) => v.id === selectedVariantId) ?? getDefaultVariant(product);

  const { data: relatedAll } = useProducts({ category: product.category });
  const relatedProducts = useMemo(
    () => (relatedAll ?? []).filter((p) => p.id !== product.id).slice(0, 4),
    [relatedAll, product.id],
  );

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <div className="flex flex-col gap-12">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <div className="relative flex aspect-square items-center justify-center rounded-lg bg-muted text-muted-foreground">
            {activeImage ? (
              <Image src={activeImage} alt={product.name} fill className="rounded-lg object-cover" />
            ) : (
              <Gamepad2 className="size-24" />
            )}
          </div>
          {images.length > 1 ? (
            <div className="flex gap-2">
              {images.map((image) => (
                <button
                  key={image}
                  type="button"
                  onClick={() => setActiveImage(image)}
                  className={cn(
                    "relative size-16 overflow-hidden rounded-md border",
                    activeImage === image ? "border-primary" : "border-border",
                  )}
                >
                  <Image src={image} alt={product.name} fill className="object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <Badge variant="muted" className="mb-2 w-fit">
              {product.category}
            </Badge>
            <h1 className="text-2xl font-semibold">{product.name}</h1>
            {product.brand ? <p className="text-sm text-muted-foreground">{product.brand}</p> : null}
          </div>

          {product.rating ? <RatingStars value={product.rating} /> : null}

          <p className="text-muted-foreground">{product.description}</p>

          <div className="flex items-center gap-2">
            <PriceTag cents={variant.price} className="text-3xl" />
            {product.discountPercentage ? (
              <Badge>-{Math.round(product.discountPercentage)}%</Badge>
            ) : null}
          </div>
          <InstallmentOptions totalCents={variant.price} />

          {product.variants.length > 1 ? (
            <div className="flex flex-col gap-1.5">
              <span className="text-sm text-muted-foreground">Opções</span>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVariantId(v.id)}
                    className={cn(
                      "rounded-md border px-3 py-1.5 text-sm",
                      v.id === variant.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:bg-muted",
                    )}
                  >
                    {v.name ?? v.sku}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <p className="text-sm text-muted-foreground">
            {variant.stock > 0 ? `${variant.stock} unidades em estoque` : "Sem estoque no momento"}
          </p>

          {product.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {product.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          ) : null}

          <div className="flex items-center gap-2">
            <AddToCartButton
              productId={variant.id}
              disabled={variant.stock <= 0}
              className="w-full md:w-auto"
            />
            <WishlistButton productId={product.id} />
          </div>

          <div className="flex flex-col gap-1 text-sm text-muted-foreground">
            {product.warrantyInformation ? <p>Garantia: {product.warrantyInformation}</p> : null}
            {product.shippingInformation ? <p>Envio: {product.shippingInformation}</p> : null}
            {product.returnPolicy ? <p>Política de devolução: {product.returnPolicy}</p> : null}
          </div>

          <ShareButtons url={shareUrl} title={product.name} />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Avaliações</h2>
        {product.reviews.length > 0 ? (
          <div className="flex flex-col gap-4">
            {product.reviews.map((review) => (
              <div key={review.id} className="rounded-lg border border-border p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{review.reviewerName}</span>
                  <RatingStars value={review.rating} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{review.comment}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Ainda não há avaliações para este produto.
          </p>
        )}
        {user && canReview ? <ReviewForm productId={product.id} /> : null}
        {user && !canReview ? (
          <p className="text-sm text-muted-foreground">
            Avaliações ficam disponíveis depois que um pedido com este produto é entregue.
          </p>
        ) : null}
      </div>

      {relatedProducts.length > 0 ? (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Produtos relacionados</h2>
          <ProductGrid products={relatedProducts} />
        </div>
      ) : null}
    </div>
  );
}
