"use client";

import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/features/products/product-card";
import type { Product } from "@/types/product";

interface ProductLayerProps {
  title: string;
  subtitle?: string;
  products: Product[] | undefined;
}

export function ProductLayer({ title, subtitle, products }: ProductLayerProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", containScroll: "trimSnaps" });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      setCanScrollPrev(emblaApi.canScrollPrev());
      setCanScrollNext(emblaApi.canScrollNext());
    };
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, products]);

  if (products && products.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
        {products && products.length > 0 ? (
          <div className="flex shrink-0 gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="View previous products"
              disabled={!canScrollPrev}
              onClick={scrollPrev}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="View next products"
              disabled={!canScrollNext}
              onClick={scrollNext}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        ) : null}
      </div>
      {products ? (
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-4">
            {products.map((product) => (
              <div key={product.id} className="w-40 shrink-0 sm:w-48">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="thin-scrollbar flex gap-4 overflow-x-auto pb-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="aspect-[3/4] w-40 shrink-0 sm:w-48" />
          ))}
        </div>
      )}
    </section>
  );
}
