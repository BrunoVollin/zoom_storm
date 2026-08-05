"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { FlashOfferFormSchema, type FlashOfferFormValues } from "@/schemas/flash-offer.schema";
import { useProducts } from "@/hooks/use-products";
import type { FlashOffer, FlashOfferWriteInput } from "@/types/flash-offer";

interface FlashOfferFormProps {
  initialOffer?: FlashOffer;
  onSubmit: (input: FlashOfferWriteInput) => Promise<unknown>;
  submitLabel: string;
}

function toDatetimeLocal(iso?: string): string {
  if (!iso) return "";
  return iso.slice(0, 16);
}

export function FlashOfferForm({ initialOffer, onSubmit, submitLabel }: FlashOfferFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { data: products } = useProducts();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FlashOfferFormValues>({
    resolver: zodResolver(FlashOfferFormSchema),
    defaultValues: initialOffer
      ? {
          productId: initialOffer.productId,
          title: initialOffer.title,
          discountPct: initialOffer.discountPct,
          startsAt: toDatetimeLocal(initialOffer.startsAt),
          endsAt: toDatetimeLocal(initialOffer.endsAt),
        }
      : { discountPct: 10 },
  });

  const submit = handleSubmit(async (values) => {
    setSubmitError(null);

    try {
      await onSubmit({
        productId: values.productId,
        title: values.title,
        discountPct: values.discountPct,
        startsAt: new Date(values.startsAt).toISOString(),
        endsAt: new Date(values.endsAt).toISOString(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível salvar a oferta.";
      setSubmitError(message);
    }
  });

  return (
    <form onSubmit={submit} className="flex max-w-xl flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="productId">Produto</Label>
        <Select id="productId" disabled={Boolean(initialOffer)} {...register("productId")}>
          <option value="">Selecione um produto</option>
          {(products ?? []).map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </Select>
        {errors.productId ? (
          <p className="text-sm text-destructive">{errors.productId.message}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Título da oferta</Label>
        <Input id="title" {...register("title")} />
        {errors.title ? <p className="text-sm text-destructive">{errors.title.message}</p> : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="discountPct">Desconto (%)</Label>
        <Input id="discountPct" type="number" step="0.01" min="0" max="100" {...register("discountPct")} />
        {errors.discountPct ? (
          <p className="text-sm text-destructive">{errors.discountPct.message}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="startsAt">Início</Label>
          <Input id="startsAt" type="datetime-local" {...register("startsAt")} />
          {errors.startsAt ? (
            <p className="text-sm text-destructive">{errors.startsAt.message}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="endsAt">Término</Label>
          <Input id="endsAt" type="datetime-local" {...register("endsAt")} />
          {errors.endsAt ? <p className="text-sm text-destructive">{errors.endsAt.message}</p> : null}
        </div>
      </div>

      {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}

      <Button type="submit" disabled={isSubmitting} className="w-fit">
        {isSubmitting ? "Salvando..." : submitLabel}
      </Button>
    </form>
  );
}
