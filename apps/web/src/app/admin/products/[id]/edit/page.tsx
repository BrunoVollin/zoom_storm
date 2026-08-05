"use client";

import { useParams, useRouter } from "next/navigation";

import { ProductForm } from "@/components/features/admin/product-form";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { ROUTES } from "@/constants/routes";
import { useProduct, useUpdateProduct } from "@/hooks/use-products";

export default function EditProductPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading, error } = useProduct(id);
  const updateProduct = useUpdateProduct(id);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !product) {
    return <ErrorState title="Produto não encontrado" />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Editar produto</h1>
        <p className="text-sm text-muted-foreground">{product.name}</p>
      </div>

      <ProductForm
        initialProduct={product}
        submitLabel="Salvar alterações"
        onSubmit={async (input) => {
          await updateProduct.mutateAsync(input);
          router.push(ROUTES.adminProducts);
        }}
      />
    </div>
  );
}
