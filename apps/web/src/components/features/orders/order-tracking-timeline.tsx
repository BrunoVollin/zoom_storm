import { Check, MapPin } from "lucide-react";

import { cn } from "@/lib/utils";
import { buildTrackingSteps } from "@/utils/order-status";
import type { Order } from "@/types/order";

function cityForStep(order: Order, status: Order["status"]): string | null {
  if (status === "IN_TRANSIT") return order.originCity;
  if (status === "OUT_FOR_DELIVERY" || status === "DELIVERED") return order.destinationCity;
  return null;
}

export function OrderTrackingTimeline({ order }: { order: Order }) {
  const steps = buildTrackingSteps(order.status);

  return (
    <ol className="flex flex-col gap-0">
      {steps.map((step, index) => {
        const city = cityForStep(order, step.status);

        return (
          <li key={step.status} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs",
                  step.reached
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground",
                )}
              >
                {step.reached ? <Check className="size-3.5" /> : index + 1}
              </div>
              {index < steps.length - 1 ? (
                <div className={cn("w-px flex-1", step.reached ? "bg-primary" : "bg-border")} />
              ) : null}
            </div>
            <div className="pb-6">
              <p className={cn("font-medium", step.current && "text-primary")}>{step.label}</p>
              {city ? (
                <p className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="size-3.5" />
                  {city}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
