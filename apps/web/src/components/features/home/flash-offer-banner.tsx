"use client";

import Image from "next/image";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";
import { Gamepad2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { useActiveFlashOffers } from "@/hooks/use-flash-offers";
import { useProduct } from "@/hooks/use-products";
import type { FlashOffer } from "@/types/flash-offer";

const AUTOPLAY_INTERVAL_MS = 5000;

function FlashOfferSlide({ offer }: { offer: FlashOffer }) {
  const { data: product } = useProduct(offer.productId);

  return (
    <div className="relative flex min-w-0 flex-[0_0_100%] items-center gap-6 overflow-hidden rounded-lg bg-gradient-to-r from-brand-purple to-brand-purple-dark p-6 pb-12">
      <div className="flex flex-1 flex-col gap-2">
        <span className="w-fit rounded-full bg-brand-yellow px-3 py-1 text-xs font-bold text-brand-purple">
          DEAL OF THE DAY
        </span>
        <p className="text-4xl font-extrabold text-brand-yellow">up to {Math.round(offer.discountPct)}%</p>
        <h3 className="text-lg font-semibold text-white">{offer.title}</h3>
        {product ? (
          <Button asChild size="sm" className="w-fit">
            <Link href={ROUTES.product(product.id)}>View deal</Link>
          </Button>
        ) : null}
      </div>
      <div className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/15 sm:size-32">
        {product?.thumbnail ? (
          <Image src={product.thumbnail} alt={offer.title} fill className="object-cover" />
        ) : (
          <Gamepad2 className="size-10 text-white/70" />
        )}
      </div>
    </div>
  );
}

export function FlashOfferBanner() {
  const { data: offers } = useActiveFlashOffers();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const autoplay = useCallback(() => {
    if (!emblaApi) return;
    emblaApi.scrollNext();
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const interval = setInterval(autoplay, AUTOPLAY_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [emblaApi, autoplay]);

  useEffect(() => {
    if (!emblaApi) return;
    setScrollSnaps(emblaApi.scrollSnapList());
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi]);

  if (!offers || offers.length === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-lg" ref={emblaRef}>
      <div className="flex">
        {offers.map((offer) => (
          <FlashOfferSlide key={offer.id} offer={offer} />
        ))}
      </div>
      {scrollSnaps.length > 1 ? (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
          {scrollSnaps.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Go to slide ${index + 1}`}
              onClick={() => emblaApi?.scrollTo(index)}
              className={cn(
                "size-2 rounded-full transition-colors",
                index === selectedIndex ? "bg-brand-yellow" : "bg-white/40",
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
