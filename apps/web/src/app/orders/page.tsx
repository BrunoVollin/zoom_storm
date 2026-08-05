"use client";

import Link from "next/link";
import { Package } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { PriceTag } from "@/components/shared/price-tag";
import { ROUTES } from "@/constants/routes";
import { useOrders } from "@/hooks/use-orders";
import { ORDER_STATUS_LABEL } from "@/utils/order-status";

export default function OrdersPage() {
  const { data: orders, isLoading, error } = useOrders();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Meus pedidos</h1>
        <p className="text-sm text-muted-foreground">Acompanhe o status das suas compras.</p>
      </div>

      {isLoading ? <LoadingSpinner /> : null}
      {error ? (
        <ErrorState
          title="Não foi possível carregar seus pedidos"
          message="Tente novamente em instantes."
        />
      ) : null}
      {!isLoading && !error && orders?.length === 0 ? (
        <EmptyState
          icon={<Package className="size-10" />}
          title="Você ainda não tem pedidos"
          description="Quando finalizar uma compra, ela aparecerá aqui."
        />
      ) : null}

      {orders && orders.length > 0 ? (
        <div className="flex flex-col gap-3">
          {orders.map((order) => (
            <Link key={order.id} href={ROUTES.order(order.id)}>
              <Card className="transition-colors hover:bg-muted/40">
                <CardHeader className="flex-row items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Pedido #{order.id.slice(0, 8)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <Badge variant="muted">{ORDER_STATUS_LABEL[order.status]}</Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {order.items.length} {order.items.length === 1 ? "item" : "itens"}
                  </p>
                </CardContent>
                <CardFooter>
                  <PriceTag cents={order.total} />
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
