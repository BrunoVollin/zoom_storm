import { notFound } from "next/navigation";

import { ProductDetail } from "@/components/features/products/product-detail";
import { productService } from "@/services/product-service";
import type { ApiError } from "@/types/api";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;

  try {
    const product = await productService.getById(id);
    return <ProductDetail product={product} />;
  } catch (error) {
    if ((error as ApiError).status === 404) {
      notFound();
    }
    throw error;
  }
}
