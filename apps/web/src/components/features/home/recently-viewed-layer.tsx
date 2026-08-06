"use client";

import { useMemo } from "react";

import { ProductLayer } from "@/components/shared/product-layer";
import { useProductCategories, useProducts } from "@/hooks/use-products";
import { seededShuffle } from "@/utils/seeded-shuffle";

function formatCategoryLabel(category: string): string {
  return category
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function CategoryProductLayer({ category }: { category: string }) {
  const { data: products } = useProducts({ category });

  return (
    <ProductLayer
      title="Based on what you've viewed"
      subtitle={`Fresh picks from ${formatCategoryLabel(category)}`}
      products={products?.slice(0, 12)}
    />
  );
}

// No recently-viewed tracking exists yet — using the general product list as
// a placeholder feed until real view-history data is available. A category is
// selected per Home request so repeat visits do not always show the same feed.
export function RecentlyViewedLayer({ seed }: { seed: string }) {
  const { data: categories = [] } = useProductCategories();
  const category = useMemo(
    () => seededShuffle(categories, `${seed}:viewed`)[0],
    [categories, seed],
  );

  return category ? (
    <CategoryProductLayer category={category} />
  ) : (
    <ProductLayer
      title="Based on what you've viewed"
      subtitle="We picked out a few products you might like"
      products={undefined}
    />
  );
}
