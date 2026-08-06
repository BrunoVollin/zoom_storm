import { bestInstallmentOption } from "@/utils/installments";
import { formatPrice } from "@/utils/format-price";
import { cn } from "@/lib/utils";

interface InstallmentOptionsProps {
  totalCents: number;
  className?: string;
}

/** "Up to 12x of $X interest-free" teaser — pure display, no real payment
 * gateway or financing involved. */
export function InstallmentOptions({ totalCents, className }: InstallmentOptionsProps) {
  const option = bestInstallmentOption(totalCents);

  if (!option || option.count <= 1) return null;

  return (
    <p className={cn("text-sm text-muted-foreground", className)}>
      up to {option.count}x of {formatPrice(option.valueCents)} interest-free
    </p>
  );
}
