"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, ShoppingCart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";
import { useCart } from "@/hooks/use-cart";
import { cn } from "@/lib/utils";

interface AddToCartButtonProps {
  productId: string;
  className?: string;
  disabled?: boolean;
}

export function AddToCartButton({ productId, className, disabled }: AddToCartButtonProps) {
  const { user } = useAuth();
  const { addItem } = useCart();
  const [feedback, setFeedback] = useState<"idle" | "added" | "error">("idle");

  if (!user) {
    return (
      <Button asChild variant="outline" className={cn(className)}>
        <Link href="/api/auth/login">
          <ShoppingCart />
          Sign in to buy
        </Link>
      </Button>
    );
  }

  const label =
    feedback === "added"
      ? "Added!"
      : feedback === "error"
        ? (addItem.error?.message ?? "Error adding item")
        : "Add to cart";

  return (
    <Button
      data-testid="add-to-cart-btn"
      variant={feedback === "error" ? "destructive" : "default"}
      className={cn(className)}
      disabled={disabled || addItem.isPending}
      onClick={(event) => {
        event.preventDefault();
        addItem.mutate(
          { productId, quantity: 1 },
          {
            onSuccess: () => {
              setFeedback("added");
              setTimeout(() => setFeedback("idle"), 1500);
            },
            onError: () => {
              setFeedback("error");
              setTimeout(() => setFeedback("idle"), 3000);
            },
          },
        );
      }}
    >
      {addItem.isPending ? <Loader2 className="animate-spin" /> : <ShoppingCart />}
      {label}
    </Button>
  );
}
