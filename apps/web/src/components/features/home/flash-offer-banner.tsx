"use client";

import Image from "next/image";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect } from "react";
import { Gamepad2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { useActiveFlashOffers } from "@/hooks/use-flash-offers";
import { useProduct } from "@/hooks/use-products";
import type { FlashOffer } from "@/types/flash-offer";

const AUTOPLAY_INTERVAL_MS = 5000;

function FlashOfferSlide({ offer }: { offer: FlashOffer }) {
  const { data: product } = useProduct(offer.productId);

  return (
    <div className="relative flex min-w-0 flex-[0_0_100%] items-center gap-6 overflow-hidden rounded-lg border border-border bg-muted p-6">
      <div className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-md bg-background sm:size-32">
        {product?.thumbnail ? (
          <Image src={product.thumbnail} alt={offer.title} fill className="object-cover" />
        ) : (
          <Gamepad2 className="size-10 text-muted-foreground" />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <Badge className="w-fit">-{Math.round(offer.discountPct)}%</Badge>
        <h3 className="text-lg font-semibold">{offer.title}</h3>
        {product ? (
          <Button asChild size="sm" className="w-fit">
            <Link href={ROUTES.product(product.id)}>Ver oferta</Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function FlashOfferBanner() {
  const { data: offers } = useActiveFlashOffers();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });

  const autoplay = useCallback(() => {
    if (!emblaApi) return;
    emblaApi.scrollNext();
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const interval = setInterval(autoplay, AUTOPLAY_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [emblaApi, autoplay]);

  if (!offers || offers.length === 0) return null;

  return (
    <div className="overflow-hidden" ref={emblaRef}>
      <div className="flex">
        {offers.map((offer) => (
          <FlashOfferSlide key={offer.id} offer={offer} />
        ))}
      </div>
    </div>
  );
}
