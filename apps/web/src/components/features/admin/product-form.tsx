"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ProductFormSchema, type ProductFormValues } from "@/schemas/product.schema";
import { getDefaultVariant, type Product, type ProductWriteInput } from "@/types/product";

interface ProductFormProps {
  initialProduct?: Product;
  onSubmit: (input: ProductWriteInput) => Promise<unknown>;
  submitLabel: string;
}

function toDefaultValues(product?: Product): Partial<ProductFormValues> {
  if (!product) {
    return { stock: 0, transportHeight: 0, transportWidth: 0, transportLength: 0, weight: 0 };
  }

  const variant = getDefaultVariant(product);

  return {
    name: product.name,
    description: product.description,
    category: product.category,
    transportHeight: product.transportHeight,
    transportWidth: product.transportWidth,
    transportLength: product.transportLength,
    weight: product.weight,
    brand: product.brand ?? undefined,
    tags: product.tags.join(", "),
    thumbnail: product.thumbnail ?? undefined,
    discountPercentage: product.discountPercentage ?? undefined,
    sku: variant.sku,
    price: variant.price / 100,
    stock: variant.stock,
  };
}

export function ProductForm({ initialProduct, onSubmit, submitLabel }: ProductFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(ProductFormSchema),
    defaultValues: toDefaultValues(initialProduct),
  });

  const submit = handleSubmit(async (values) => {
    setSubmitError(null);

    try {
      const input: ProductWriteInput = {
        name: values.name,
        description: values.description,
        category: values.category,
        transportHeight: values.transportHeight,
        transportWidth: values.transportWidth,
        transportLength: values.transportLength,
        weight: values.weight,
        brand: values.brand || undefined,
        tags: values.tags
          ? values.tags.split(",").map((t) => t.trim()).filter(Boolean)
          : undefined,
        thumbnail: values.thumbnail || undefined,
        discountPercentage: values.discountPercentage,
        variants: [
          {
            sku: values.sku,
            price: Math.round(values.price * 100),
            stock: values.stock,
            isDefault: true,
          },
        ],
      };

      await onSubmit(input);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível salvar o produto.";
      setSubmitError(message);
    }
  });

  return (
    <form onSubmit={submit} className="flex max-w-xl flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" {...register("name")} />
        {errors.name ? <p className="text-sm text-destructive">{errors.name.message}</p> : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" rows={4} {...register("description")} />
        {errors.description ? (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="category">Categoria</Label>
          <Input id="category" {...register("category")} />
          {errors.category ? (
            <p className="text-sm text-destructive">{errors.category.message}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="brand">Marca</Label>
          <Input id="brand" {...register("brand")} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
          <Input id="tags" {...register("tags")} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="thumbnail">URL da imagem</Label>
          <Input id="thumbnail" {...register("thumbnail")} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sku">SKU</Label>
          <Input id="sku" {...register("sku")} />
          {errors.sku ? <p className="text-sm text-destructive">{errors.sku.message}</p> : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="price">Preço (R$)</Label>
          <Input id="price" type="number" step="0.01" min="0" {...register("price")} />
          {errors.price ? <p className="text-sm text-destructive">{errors.price.message}</p> : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="stock">Estoque</Label>
          <Input id="stock" type="number" min="0" {...register("stock")} />
          {errors.stock ? <p className="text-sm text-destructive">{errors.stock.message}</p> : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="discountPercentage">Desconto (%)</Label>
          <Input
            id="discountPercentage"
            type="number"
            step="0.01"
            min="0"
            max="100"
            {...register("discountPercentage")}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="weight">Peso (kg)</Label>
          <Input id="weight" type="number" step="0.01" min="0" {...register("weight")} />
          {errors.weight ? <p className="text-sm text-destructive">{errors.weight.message}</p> : null}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="transportHeight">Altura (cm)</Label>
          <Input id="transportHeight" type="number" min="0" {...register("transportHeight")} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="transportWidth">Largura (cm)</Label>
          <Input id="transportWidth" type="number" min="0" {...register("transportWidth")} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="transportLength">Comprimento (cm)</Label>
          <Input id="transportLength" type="number" min="0" {...register("transportLength")} />
        </div>
      </div>

      {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}

      <Button type="submit" disabled={isSubmitting} className="w-fit">
        {isSubmitting ? "Salvando..." : submitLabel}
      </Button>
    </form>
  );
}
