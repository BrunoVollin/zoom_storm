"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Gift, Loader2, Tag, Truck, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InstallmentOptions } from "@/components/shared/installment-options";
import { PriceTag } from "@/components/shared/price-tag";
import { cartService } from "@/services/cart-service";
import { useCart } from "@/hooks/use-cart";
import { useLoyaltyBalance, useRedeemLoyaltyPoints } from "@/hooks/use-loyalty";
import { ROUTES } from "@/constants/routes";
import {
  applyCouponSchema,
  shippingEstimateSchema,
  type ApplyCouponInput,
  type ShippingEstimateInput,
} from "@/schemas/cart.schema";
import type { Cart, ShippingEstimate } from "@/types/cart";

interface CartSummaryProps {
  cart: Cart;
}

/** Subtotal in cents, computed client-side from the cart's line items. */
function getSubtotal(cart: Cart): number {
  return cart.items.reduce((total, item) => total + item.variant.price * item.quantity, 0);
}

export function CartSummary({ cart }: CartSummaryProps) {
  const router = useRouter();
  const [shippingEstimate, setShippingEstimate] = useState<ShippingEstimate | null>(null);
  const [redeemPoints, setRedeemPoints] = useState("");
  const subtotal = getSubtotal(cart);
  const { checkout, applyCoupon, removeCoupon } = useCart();
  const { data: loyaltyBalance } = useLoyaltyBalance();
  const redeemLoyaltyPoints = useRedeemLoyaltyPoints(cart.id);

  const shippingForm = useForm<ShippingEstimateInput>({
    resolver: zodResolver(shippingEstimateSchema),
  });

  const couponForm = useForm<ApplyCouponInput>({
    resolver: zodResolver(applyCouponSchema),
  });

  const estimateShipping = useMutation({
    mutationFn: ({ cep }: ShippingEstimateInput) => cartService.estimateShipping(cart.id, cep),
    onSuccess: setShippingEstimate,
  });

  const shipping = shippingEstimate?.shipping ?? null;
  const totalDiscount = cart.totalDiscount ?? 0;

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
      <h2 className="font-semibold">Resumo</h2>

      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Subtotal</span>
        <PriceTag cents={subtotal} />
      </div>

      {cart.coupons.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          {cart.coupons.map((coupon) => (
            <div key={coupon.id} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Tag className="size-3.5" />
                {coupon.name}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-emerald-600">-<PriceTag cents={coupon.discount} /></span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-6"
                  aria-label={`Remover cupom ${coupon.name}`}
                  disabled={removeCoupon.isPending}
                  onClick={() => removeCoupon.mutate(coupon.id)}
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <form
        className="flex flex-col gap-2"
        onSubmit={couponForm.handleSubmit((values) => {
          applyCoupon.mutate(values.couponId, {
            onSuccess: () => couponForm.reset(),
          });
        })}
      >
        <label className="text-sm text-muted-foreground" htmlFor="couponId">
          Cupom de desconto
        </label>
        <div className="flex gap-2">
          <Input id="couponId" placeholder="Código do cupom" {...couponForm.register("couponId")} />
          <Button type="submit" variant="outline" disabled={applyCoupon.isPending}>
            {applyCoupon.isPending ? <Loader2 className="animate-spin" /> : <Tag className="size-4" />}
          </Button>
        </div>
        {couponForm.formState.errors.couponId ? (
          <p className="text-xs text-destructive">{couponForm.formState.errors.couponId.message}</p>
        ) : null}
        {applyCoupon.isError ? (
          <p className="text-xs text-destructive">
            {applyCoupon.error instanceof Error ? applyCoupon.error.message : "Cupom inválido"}
          </p>
        ) : null}
      </form>

      {loyaltyBalance && loyaltyBalance > 0 && cart.coupons.length === 0 ? (
        <div className="flex flex-col gap-2">
          <label className="text-sm text-muted-foreground" htmlFor="redeemPoints">
            <Gift className="mr-1 inline size-3.5" />
            Usar pontos como desconto (você tem {loyaltyBalance} pts — 1 pt = R$1,00)
          </label>
          <div className="flex gap-2">
            <Input
              id="redeemPoints"
              type="number"
              min={1}
              max={loyaltyBalance}
              value={redeemPoints}
              onChange={(event) => setRedeemPoints(event.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              disabled={redeemLoyaltyPoints.isPending || !redeemPoints}
              onClick={() => {
                const points = Number(redeemPoints);
                if (points > 0) {
                  redeemLoyaltyPoints.mutate(points, {
                    onSuccess: () => setRedeemPoints(""),
                  });
                }
              }}
            >
              {redeemLoyaltyPoints.isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Resgatar"
              )}
            </Button>
          </div>
          {redeemLoyaltyPoints.isError ? (
            <p className="text-xs text-destructive">
              {redeemLoyaltyPoints.error instanceof Error
                ? redeemLoyaltyPoints.error.message
                : "Não foi possível resgatar os pontos"}
            </p>
          ) : null}
        </div>
      ) : null}

      {cart.coupons.length > 0 && loyaltyBalance && loyaltyBalance > 0 ? (
        <p className="text-xs text-muted-foreground">
          Remova o cupom aplicado para usar seus pontos de fidelidade.
        </p>
      ) : null}

      <form
        className="flex flex-col gap-2"
        onSubmit={shippingForm.handleSubmit((values) => estimateShipping.mutate(values))}
      >
        <label className="text-sm text-muted-foreground" htmlFor="cep">
          Calcular frete (CEP)
        </label>
        <div className="flex gap-2">
          <Input id="cep" placeholder="00000-000" {...shippingForm.register("cep")} />
          <Button type="submit" variant="outline" disabled={estimateShipping.isPending}>
            {estimateShipping.isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Truck className="size-4" />
            )}
          </Button>
        </div>
        {shippingForm.formState.errors.cep ? (
          <p className="text-xs text-destructive">{shippingForm.formState.errors.cep.message}</p>
        ) : null}
        {estimateShipping.isError ? (
          <p className="text-xs text-destructive">
            {estimateShipping.error instanceof Error
              ? estimateShipping.error.message
              : "Não foi possível calcular o frete"}
          </p>
        ) : null}
      </form>

      {shippingEstimate ? (
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Frete para {shippingEstimate.city}/{shippingEstimate.state}
            </span>
            <PriceTag cents={shippingEstimate.shipping} />
          </div>
          <p className="text-xs text-muted-foreground">
            Entrega estimada em até {shippingEstimate.estimatedDays}{" "}
            {shippingEstimate.estimatedDays === 1 ? "dia útil" : "dias úteis"}
          </p>
        </div>
      ) : null}

      <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
        <span>Total</span>
        <PriceTag cents={Math.max(0, subtotal - totalDiscount + (shipping ?? 0))} />
      </div>
      <InstallmentOptions totalCents={Math.max(0, subtotal - totalDiscount + (shipping ?? 0))} />

      <Button
        data-testid="checkout-btn"
        size="lg"
        disabled={shipping === null || cart.items.length === 0 || checkout.isPending}
        title={shipping === null ? "Calcule o frete antes de finalizar" : undefined}
        onClick={() => {
          if (shipping === null) return;
          checkout.mutate(
            { shipping, cep: shippingForm.getValues("cep") },
            {
              onSuccess: ({ order }) => router.push(ROUTES.checkoutPayment(order.id)),
            },
          );
        }}
      >
        {checkout.isPending ? <Loader2 className="animate-spin" /> : "Finalizar compra"}
      </Button>
    </div>
  );
}
