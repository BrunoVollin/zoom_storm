"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { useCart } from "@/hooks/use-cart";

export function CartLink() {
  const { cart } = useCart();
  const itemCount = cart?.items.reduce((total, item) => total + item.quantity, 0) ?? 0;

  return (
    <Button asChild variant="ghost" size="icon" className="relative">
      <Link href={ROUTES.cart} aria-label="Carrinho">
        <ShoppingCart className="size-5" />
        {itemCount > 0 ? (
          <Badge className="absolute -right-1 -top-1 h-5 min-w-5 justify-center px-1 text-[10px]">
            {itemCount}
          </Badge>
        ) : null}
      </Link>
    </Button>
  );
}
