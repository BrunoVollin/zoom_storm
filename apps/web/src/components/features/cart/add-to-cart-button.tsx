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
  const [justAdded, setJustAdded] = useState(false);

  if (!user) {
    return (
      <Button asChild variant="outline" className={cn(className)}>
        <Link href="/api/auth/login">
          <ShoppingCart />
          Entre para comprar
        </Link>
      </Button>
    );
  }

  return (
    <Button
      className={cn(className)}
      disabled={disabled || addItem.isPending}
      onClick={(event) => {
        event.preventDefault();
        addItem.mutate(
          { productId, quantity: 1 },
          {
            onSuccess: () => {
              setJustAdded(true);
              setTimeout(() => setJustAdded(false), 1500);
            },
          },
        );
      }}
    >
      {addItem.isPending ? <Loader2 className="animate-spin" /> : <ShoppingCart />}
      {justAdded ? "Adicionado!" : "Adicionar ao carrinho"}
    </Button>
  );
}
