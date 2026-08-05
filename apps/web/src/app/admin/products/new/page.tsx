"use client";

import { useRouter } from "next/navigation";

import { ProductForm } from "@/components/features/admin/product-form";
import { ROUTES } from "@/constants/routes";
import { useCreateProduct } from "@/hooks/use-products";

export default function NewProductPage() {
  const router = useRouter();
  const createProduct = useCreateProduct();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Novo produto</h1>
        <p className="text-sm text-muted-foreground">Cadastre um novo jogo no catálogo.</p>
      </div>

      <ProductForm
        submitLabel="Criar produto"
        onSubmit={async (input) => {
          await createProduct.mutateAsync(input);
          router.push(ROUTES.adminProducts);
        }}
      />
    </div>
  );
}
