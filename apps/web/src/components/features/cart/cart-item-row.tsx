"use client";

import { Loader2, Minus, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PriceTag } from "@/components/shared/price-tag";
import { useCart } from "@/hooks/use-cart";
import type { CartItem } from "@/types/cart";

export function CartItemRow({ item }: { item: CartItem }) {
  const { updateItemQuantity, removeItem } = useCart();
  const isMutating =
    (updateItemQuantity.isPending && updateItemQuantity.variables?.itemId === item.id) ||
    (removeItem.isPending && removeItem.variables === item.id);

  return (
    <div className="flex items-center gap-4 border-b border-border py-4 last:border-none">
      <div className="flex-1">
        <p className="font-medium">{item.product.name}</p>
        <PriceTag cents={item.product.price} className="text-sm text-muted-foreground" />
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          disabled={item.quantity <= 1 || isMutating}
          onClick={() =>
            updateItemQuantity.mutate({ itemId: item.id, quantity: item.quantity - 1 })
          }
        >
          <Minus className="size-3.5" />
        </Button>
        <span className="w-8 text-center text-sm tabular-nums">{item.quantity}</span>
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          disabled={isMutating}
          onClick={() =>
            updateItemQuantity.mutate({ itemId: item.id, quantity: item.quantity + 1 })
          }
        >
          <Plus className="size-3.5" />
        </Button>
      </div>

      <PriceTag cents={item.product.price * item.quantity} className="w-24 text-right" />

      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:text-destructive"
        disabled={isMutating}
        onClick={() => removeItem.mutate(item.id)}
      >
        {removeItem.isPending && removeItem.variables === item.id ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Trash2 className="size-4" />
        )}
      </Button>
    </div>
  );
}
