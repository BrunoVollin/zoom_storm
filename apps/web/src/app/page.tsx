import { FlashOfferBanner } from "@/components/features/home/flash-offer-banner";
import { PromoCarousel } from "@/components/features/home/promo-carousel";
import { RecentlyViewedLayer } from "@/components/features/home/recently-viewed-layer";
import { CategoryGrid } from "@/components/features/home/category-grid";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const homeSeed = crypto.randomUUID();

  return (
    <div className="flex flex-col gap-8">
      <FlashOfferBanner />
      <PromoCarousel />
      <RecentlyViewedLayer seed={homeSeed} />
      <CategoryGrid seed={homeSeed} />
    </div>
  );
}
