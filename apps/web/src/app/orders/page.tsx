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
        <h1 className="text-2xl font-semibold">My orders</h1>
        <p className="text-sm text-muted-foreground">Track the status of your purchases.</p>
      </div>

      {isLoading ? <LoadingSpinner /> : null}
      {error ? (
        <ErrorState
          title="We couldn't load your orders"
          message="Please try again in a moment."
        />
      ) : null}
      {!isLoading && !error && orders?.length === 0 ? (
        <EmptyState
          icon={<Package className="size-10" />}
          title="You don't have any orders yet"
          description="When you complete a purchase, it will show up here."
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
                      Order #{order.id.slice(0, 8)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString("en-US")}
                    </p>
                  </div>
                  <Badge variant="muted">{ORDER_STATUS_LABEL[order.status]}</Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {order.items.length} {order.items.length === 1 ? "item" : "items"}
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
