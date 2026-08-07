"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { useCart } from "@/hooks/use-cart";
import { useCartIndicatorCount } from "@/hooks/use-cart-indicator";

export function CartLink() {
  const { cart } = useCart();
  const itemCount = cart?.items.reduce((total, item) => total + item.quantity, 0) ?? 0;
  const indicatorCount = useCartIndicatorCount(cart?.id, itemCount);

  return (
    <Button
      asChild
      variant="ghost"
      size="icon"
      className="relative text-white hover:bg-white/10 hover:text-white"
    >
      <Link
        data-testid="cart-link"
        href={ROUTES.cart}
        aria-label={
          itemCount > 0
            ? `Cart, ${itemCount} ${itemCount === 1 ? "item" : "items"}${indicatorCount > 0 ? `, ${indicatorCount} new` : ""}`
            : "Cart"
        }
      >
        <ShoppingCart className="size-5" />
        {indicatorCount > 0 ? (
          <Badge
            aria-hidden="true"
            data-testid="cart-count-badge"
            className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full border-2 border-brand-purple bg-destructive p-0 text-[10px] font-semibold text-destructive-foreground"
          >
            {indicatorCount > 9 ? "9+" : indicatorCount}
          </Badge>
        ) : null}
      </Link>
    </Button>
  );
}
