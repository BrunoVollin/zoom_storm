"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Gift, Loader2, MapPin, Tag, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InstallmentOptions } from "@/components/shared/installment-options";
import { PriceTag } from "@/components/shared/price-tag";
import { SavedAddressesList } from "@/components/features/account/saved-addresses-list";
import { cartService } from "@/services/cart-service";
import { useCart } from "@/hooks/use-cart";
import { useLoyaltyBalance, useRedeemLoyaltyPoints } from "@/hooks/use-loyalty";
import { useSavedAddresses } from "@/hooks/use-saved-addresses";
import { ROUTES } from "@/constants/routes";
import { applyCouponSchema, type ApplyCouponInput } from "@/schemas/cart.schema";
import type { ApiError } from "@/types/api";
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
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [checkoutNotice, setCheckoutNotice] = useState<string | null>(null);
  const [redeemPoints, setRedeemPoints] = useState("");
  const subtotal = getSubtotal(cart);
  const { checkout, applyCoupon, removeCoupon } = useCart();
  const { data: loyaltyBalance } = useLoyaltyBalance();
  const redeemLoyaltyPoints = useRedeemLoyaltyPoints(cart.id);
  const { data: savedAddresses } = useSavedAddresses();
  const initializedDefaultAddress = useRef(false);

  const couponForm = useForm<ApplyCouponInput>({
    resolver: zodResolver(applyCouponSchema),
  });

  const estimateShipping = useMutation({
    mutationFn: (addressId: string) => cartService.estimateShipping(cart.id, addressId),
    onSuccess: setShippingEstimate,
  });

  useEffect(() => {
    if (!savedAddresses || initializedDefaultAddress.current) return;
    initializedDefaultAddress.current = true;
    const defaultAddress = savedAddresses.find((address) => address.isDefault) ?? null;
    if (defaultAddress) {
      setSelectedAddressId(defaultAddress.id);
      estimateShipping.mutate(defaultAddress.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedAddresses]);

  function selectAddress(addressId: string) {
    setSelectedAddressId(addressId);
    setShippingEstimate(null);
    setCheckoutNotice(null);
    estimateShipping.mutate(addressId);
  }

  const shipping = shippingEstimate?.shipping ?? null;
  const totalDiscount = cart.totalDiscount ?? 0;

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
      <h2 className="font-semibold">Summary</h2>

      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Subtotal</span>
        <PriceTag cents={subtotal} />
      </div>

      {cart.coupons.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          {cart.coupons.map((coupon) => (
            <div
              key={coupon.id}
              data-testid="applied-coupon"
              className="flex items-center justify-between text-sm"
            >
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Tag className="size-3.5" />
                {coupon.name}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-emerald-600">-<PriceTag cents={coupon.discount} /></span>
                <Button
                  data-testid="remove-coupon-btn"
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-6"
                  aria-label={`Remove coupon ${coupon.name}`}
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
          Discount coupon
        </label>
        <div className="flex gap-2">
          <Input
            data-testid="coupon-input"
            id="couponId"
            placeholder="Coupon code"
            {...couponForm.register("couponId")}
          />
          <Button
            data-testid="apply-coupon-btn"
            type="submit"
            variant="outline"
            disabled={applyCoupon.isPending}
          >
            {applyCoupon.isPending ? <Loader2 className="animate-spin" /> : <Tag className="size-4" />}
          </Button>
        </div>
        {couponForm.formState.errors.couponId ? (
          <p className="text-xs text-destructive">{couponForm.formState.errors.couponId.message}</p>
        ) : null}
        {applyCoupon.isError ? (
          <p data-testid="coupon-error" className="text-xs text-destructive">
            {applyCoupon.error instanceof Error ? applyCoupon.error.message : "Invalid coupon"}
          </p>
        ) : null}
      </form>

      {loyaltyBalance && loyaltyBalance > 0 && cart.coupons.length === 0 ? (
        <div className="flex flex-col gap-2">
          <label className="text-sm text-muted-foreground" htmlFor="redeemPoints">
            <Gift className="mr-1 inline size-3.5" />
            Use points as discount (you have {loyaltyBalance} pts — 1 pt = $1.00)
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
                "Redeem"
              )}
            </Button>
          </div>
          {redeemLoyaltyPoints.isError ? (
            <p className="text-xs text-destructive">
              {redeemLoyaltyPoints.error instanceof Error
                ? redeemLoyaltyPoints.error.message
                : "Could not redeem points"}
            </p>
          ) : null}
        </div>
      ) : null}

      {cart.coupons.length > 0 && loyaltyBalance && loyaltyBalance > 0 ? (
        <p className="text-xs text-muted-foreground">
          Remove the applied coupon to use your loyalty points.
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-3.5" />
          Shipping address
        </span>

        {savedAddresses && savedAddresses.length > 0 ? (
          <SavedAddressesList
            addresses={savedAddresses}
            selectedAddressId={selectedAddressId}
            onSelect={selectAddress}
          />
        ) : savedAddresses ? (
          <div className="rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
            You have no saved addresses yet.{" "}
            <Link href={ROUTES.accountSettings} className="text-primary underline">
              Add an address
            </Link>{" "}
            before checking out.
          </div>
        ) : null}

        {estimateShipping.isError ? (
          <p className="text-xs text-destructive">
            {estimateShipping.error instanceof Error
              ? estimateShipping.error.message
              : "Could not calculate shipping"}
          </p>
        ) : null}
      </div>

      {shippingEstimate ? (
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Shipping to {shippingEstimate.city}/{shippingEstimate.state}
            </span>
            <PriceTag cents={shippingEstimate.shipping} />
          </div>
          <p className="text-xs text-muted-foreground">
            Estimated delivery within {shippingEstimate.estimatedDays}{" "}
            {shippingEstimate.estimatedDays === 1 ? "business day" : "business days"}
          </p>
        </div>
      ) : null}

      {checkoutNotice ? (
        <p data-testid="checkout-notice" className="text-xs text-amber-600">
          {checkoutNotice}
        </p>
      ) : null}

      {checkout.isError && !checkoutNotice ? (
        <p className="text-xs text-destructive">
          {checkout.error instanceof Error ? checkout.error.message : "Could not complete checkout"}
        </p>
      ) : null}

      <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
        <span>Total</span>
        <PriceTag cents={Math.max(0, subtotal - totalDiscount + (shipping ?? 0))} />
      </div>
      <InstallmentOptions totalCents={Math.max(0, subtotal - totalDiscount + (shipping ?? 0))} />

      <Button
        data-testid="checkout-btn"
        size="lg"
        disabled={
          !selectedAddressId ||
          !shippingEstimate ||
          cart.items.length === 0 ||
          checkout.isPending
        }
        title={!shippingEstimate ? "Select a shipping address before checking out" : undefined}
        onClick={() => {
          if (!selectedAddressId || !shippingEstimate) return;
          setCheckoutNotice(null);
          checkout.mutate(
            { addressId: selectedAddressId, shippingQuoteId: shippingEstimate.shippingQuoteId },
            {
              onSuccess: ({ order }) => router.push(ROUTES.checkoutPayment(order.id)),
              onError: (error) => {
                const apiError = error as Partial<ApiError>;
                if (apiError?.code === "SHIPPING_QUOTE_EXPIRED") {
                  setCheckoutNotice(
                    "Your shipping quote has expired. We recalculated it — please review and try checkout again.",
                  );
                  estimateShipping.mutate(selectedAddressId);
                }
              },
            },
          );
        }}
      >
        {checkout.isPending ? <Loader2 className="animate-spin" /> : "Checkout"}
      </Button>
    </div>
  );
}
