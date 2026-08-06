"use client";

import Image from "next/image";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import { useQueries } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { queryKeys } from "@/constants/query-keys";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/utils/format-price";
import { useActiveFlashOffers } from "@/hooks/use-flash-offers";
import { productService } from "@/services/product-service";
import { getDefaultVariant, type Product } from "@/types/product";
import type { FlashOffer } from "@/types/flash-offer";

const AUTOPLAY_INTERVAL_MS = 5000;

interface PromoSlideConfig {
  key: string;
  categories: string[];
  personImageUrl: string;
  personImageAlt: string;
  cardClassName: string;
  titleClassName: string;
  priceClassName: string;
  originalPriceClassName: string;
  buttonClassName?: string;
}

const SLIDE_CONFIGS: PromoSlideConfig[] = [
  {
    key: "groceries",
    categories: ["groceries"],
    personImageUrl:
      "https://plus.unsplash.com/premium_photo-1686285539247-818ad6be256c?auto=format&fit=crop&w=800&q=80",
    personImageAlt: "Happy woman carrying a grocery shopping bag",
    cardClassName: "bg-gradient-to-r from-emerald-800 to-amber-700 text-white",
    titleClassName: "text-white",
    priceClassName: "text-brand-yellow",
    originalPriceClassName: "text-white/70",
  },
  {
    key: "tech",
    categories: ["laptops", "smartphones", "tablets", "mobile-accessories"],
    personImageUrl:
      "https://plus.unsplash.com/premium_photo-1704757142523-e26298fdcf6a?auto=format&fit=crop&w=800&q=80",
    personImageAlt: "Young gamer wearing a headset",
    cardClassName:
      "bg-gradient-to-r from-slate-950 to-slate-900 text-white shadow-[0_0_40px_rgba(56,189,248,0.35)]",
    titleClassName: "text-white",
    priceClassName: "text-cyan-400",
    originalPriceClassName: "text-white/60",
  },
  {
    key: "beauty",
    categories: ["beauty", "skin-care", "fragrances"],
    personImageUrl:
      "https://images.unsplash.com/photo-1758272421251-61be99aaf20b?auto=format&fit=crop&w=800&q=80",
    personImageAlt: "Woman applying makeup in front of a mirror",
    cardClassName: "bg-gradient-to-r from-rose-200 to-rose-100 text-rose-950",
    titleClassName: "text-rose-950",
    priceClassName: "text-rose-700",
    originalPriceClassName: "text-rose-950/60",
  },
];

interface ResolvedSlide {
  config: PromoSlideConfig;
  offer: FlashOffer;
  product: Product;
}

function useCategoryMatchedOffers(offers: FlashOffer[] | undefined) {
  const productQueries = useQueries({
    queries: (offers ?? []).map((offer) => ({
      queryKey: queryKeys.products.detail(offer.productId),
      queryFn: () => productService.getById(offer.productId),
      enabled: Boolean(offer.productId),
    })),
  });

  return useMemo(() => {
    if (!offers || offers.length === 0) return [];

    const slides: ResolvedSlide[] = [];

    for (const config of SLIDE_CONFIGS) {
      const candidates: ResolvedSlide[] = [];

      for (let i = 0; i < offers.length; i += 1) {
        const offer = offers[i];
        const product = productQueries[i]?.data;
        if (offer && product && config.categories.includes(product.category)) {
          candidates.push({ config, offer, product });
        }
      }

      const chosen = candidates[Math.floor(Math.random() * candidates.length)];
      if (chosen) {
        slides.push(chosen);
      }
    }

    return slides;
  }, [offers, productQueries]);
}

function PromoSlide({ slide }: { slide: ResolvedSlide }) {
  const { config, offer, product } = slide;
  const originalPrice = getDefaultVariant(product).price;
  const promoPrice = Math.round(originalPrice * (1 - offer.discountPct / 100));

  return (
    <div className="min-w-0 flex-[0_0_100%] px-1">
      <div
        className={cn(
          "flex h-[240px] overflow-hidden rounded-2xl shadow-lg md:h-[380px]",
          config.cardClassName,
        )}
      >
        <div className="relative w-[55%] shrink-0">
          <Image
            src={config.personImageUrl}
            alt={config.personImageAlt}
            fill
            sizes="(max-width: 768px) 55vw, 400px"
            className="object-cover"
          />
        </div>
        <div className="flex w-[45%] flex-col justify-center gap-1 p-3 sm:gap-2 sm:p-6">
          <h3 className={cn("line-clamp-2 text-sm font-semibold sm:text-xl", config.titleClassName)}>
            {product.name}
          </h3>
          <span className={cn("text-xs line-through sm:text-base", config.originalPriceClassName)}>
            {formatPrice(originalPrice)}
          </span>
          <span className={cn("text-lg font-extrabold sm:text-3xl", config.priceClassName)}>
            {formatPrice(promoPrice)}
          </span>
          <Button asChild size="sm" className="mt-1 w-fit">
            <Link href={ROUTES.product(product.id)}>View deal</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export function PromoCarousel() {
  const { data: offers } = useActiveFlashOffers();
  const slides = useCategoryMatchedOffers(offers);

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

  if (slides.length === 0) return null;

  return (
    <div className="relative overflow-hidden" ref={emblaRef}>
      <div className="flex">
        {slides.map((slide) => (
          <PromoSlide key={slide.config.key} slide={slide} />
        ))}
      </div>
      {scrollSnaps.length > 1 ? (
        <div className="mt-3 flex justify-center gap-1.5">
          {scrollSnaps.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Go to slide ${index + 1}`}
              onClick={() => emblaApi?.scrollTo(index)}
              className={cn(
                "size-2 rounded-full transition-colors",
                index === selectedIndex ? "bg-brand-purple" : "bg-neutral-300",
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
