"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, Truck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PriceTag } from "@/components/shared/price-tag";
import { cartService } from "@/services/cart-service";
import { shippingEstimateSchema, type ShippingEstimateInput } from "@/schemas/cart.schema";
import type { Cart } from "@/types/cart";

interface CartSummaryProps {
  cart: Cart;
}

/** Subtotal in cents, computed client-side from the cart's line items. */
function getSubtotal(cart: Cart): number {
  return cart.items.reduce((total, item) => total + item.product.price * item.quantity, 0);
}

export function CartSummary({ cart }: CartSummaryProps) {
  const [shipping, setShipping] = useState<number | null>(null);
  const subtotal = getSubtotal(cart);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ShippingEstimateInput>({
    resolver: zodResolver(shippingEstimateSchema),
    defaultValues: { distance: 10 },
  });

  const estimateShipping = useMutation({
    mutationFn: ({ distance }: ShippingEstimateInput) =>
      cartService.estimateShipping(cart.id, distance),
    onSuccess: setShipping,
  });

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
      <h2 className="font-semibold">Resumo</h2>

      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Subtotal</span>
        <PriceTag cents={subtotal} />
      </div>

      <form
        className="flex flex-col gap-2"
        onSubmit={handleSubmit((values) => estimateShipping.mutate(values))}
      >
        <label className="text-sm text-muted-foreground" htmlFor="distance">
          Calcular frete (distância em km)
        </label>
        <div className="flex gap-2">
          <Input id="distance" type="number" min={1} {...register("distance")} />
          <Button type="submit" variant="outline" disabled={estimateShipping.isPending}>
            {estimateShipping.isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Truck className="size-4" />
            )}
          </Button>
        </div>
        {errors.distance ? (
          <p className="text-xs text-destructive">{errors.distance.message}</p>
        ) : null}
      </form>

      {shipping !== null ? (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Frete estimado</span>
          <PriceTag cents={shipping} />
        </div>
      ) : null}

      <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
        <span>Total</span>
        <PriceTag cents={subtotal + (shipping ?? 0)} />
      </div>

      <Button
        size="lg"
        disabled={shipping === null || cart.items.length === 0}
        title={shipping === null ? "Calcule o frete antes de finalizar" : undefined}
      >
        Finalizar compra
      </Button>
    </div>
  );
}
