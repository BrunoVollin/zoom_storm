"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import {
  Laptop,
  Smartphone,
  Tablet,
  Watch,
  Shirt,
  Footprints,
  Home,
  ShoppingBasket,
  Sparkles,
  Gem,
  Glasses,
  Bike,
  Car,
  Utensils,
  Backpack,
  Package,
  type LucideIcon,
} from "lucide-react";

import { ROUTES } from "@/constants/routes";
import { useProductCategories, useProducts } from "@/hooks/use-products";
import { seededShuffle } from "@/utils/seeded-shuffle";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  smartphones: Smartphone,
  laptops: Laptop,
  tablets: Tablet,
  "mobile-accessories": Smartphone,
  "mens-watches": Watch,
  "womens-watches": Watch,
  "mens-shirts": Shirt,
  "mens-shoes": Footprints,
  "womens-shoes": Footprints,
  tops: Shirt,
  "womens-dresses": Shirt,
  "womens-bags": Backpack,
  "womens-jewellery": Gem,
  sunglasses: Glasses,
  "home-decoration": Home,
  furniture: Home,
  groceries: ShoppingBasket,
  "kitchen-accessories": Utensils,
  beauty: Sparkles,
  fragrances: Sparkles,
  "skin-care": Sparkles,
  "sports-accessories": Bike,
  motorcycle: Bike,
  vehicle: Car,
};

function formatCategoryLabel(category: string): string {
  return category
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function CategoryTile({ category, seed }: { category: string; seed: string }) {
  const Icon = CATEGORY_ICONS[category] ?? Package;
  // There's no dedicated "image per category" endpoint — the categories API
  // only returns strings — so we borrow the thumbnail of one product from
  // that category as a stand-in cover image, falling back to the icon when
  // there's no product or the fetch fails.
  const { data: categoryProducts } = useProducts({ category });
  const thumbnail = useMemo(() => {
    const coverImages = (categoryProducts ?? [])
      .map((product) => product.thumbnail ?? product.images[0])
      .filter((image): image is string => Boolean(image));

    return seededShuffle(coverImages, `${seed}:${category}`)[0] ?? null;
  }, [category, categoryProducts, seed]);

  return (
    <Link
      href={`${ROUTES.search}?category=${encodeURIComponent(category)}`}
      className="flex flex-col items-center gap-2 rounded-lg border border-border bg-muted/50 p-3 transition-colors hover:bg-muted"
    >
      <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg bg-muted">
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={formatCategoryLabel(category)}
            fill
            className="object-cover"
          />
        ) : (
          <Icon className="size-8 text-muted-foreground" />
        )}
      </div>
      <span className="text-center text-sm font-medium">{formatCategoryLabel(category)}</span>
    </Link>
  );
}

export function CategoryGrid({ seed }: { seed: string }) {
  const { data: categories = [] } = useProductCategories();
  const visibleCategories = useMemo(
    () => seededShuffle(categories, `${seed}:categories`).slice(0, 12),
    [categories, seed],
  );

  if (categories.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-semibold">Shop by category</h2>
      <div className="grid grid-cols-3 gap-4">
        {visibleCategories.map((category) => (
          <CategoryTile key={category} category={category} seed={seed} />
        ))}
      </div>
    </section>
  );
}
