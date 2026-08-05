"use client";

import { useParams } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { PriceTag } from "@/components/shared/price-tag";
import { OrderTrackingTimeline } from "@/components/features/orders/order-tracking-timeline";
import { useOrder } from "@/hooks/use-orders";
import { ORDER_STATUS_LABEL } from "@/utils/order-status";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading, error } = useOrder(id);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !order) {
    return <ErrorState title="Pedido não encontrado" />;
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Pedido #{order.id.slice(0, 8)}</h1>
          <p className="text-sm text-muted-foreground">
            {new Date(order.createdAt).toLocaleString("pt-BR")}
          </p>
        </div>
        <Badge variant="muted">{ORDER_STATUS_LABEL[order.status]}</Badge>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="mb-4 text-lg font-semibold">Rastreamento</h2>
          <OrderTrackingTimeline order={order} />
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <h2 className="mb-2 text-lg font-semibold">Itens</h2>
            <div className="flex flex-col gap-2">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>
                    {item.quantity}x {item.productName}
                  </span>
                  <PriceTag cents={item.subtotal} />
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1 border-t border-border pt-4 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <PriceTag cents={order.subtotal} />
            </div>
            {order.discount > 0 ? (
              <div className="flex justify-between text-muted-foreground">
                <span>Desconto</span>
                <span>-<PriceTag cents={order.discount} /></span>
              </div>
            ) : null}
            <div className="flex justify-between text-muted-foreground">
              <span>Frete</span>
              <PriceTag cents={order.shipping} />
            </div>
            <div className="flex justify-between text-base font-semibold">
              <span>Total</span>
              <PriceTag cents={order.total} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
