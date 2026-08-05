import { bestInstallmentOption } from "@/utils/installments";
import { formatPrice } from "@/utils/format-price";
import { cn } from "@/lib/utils";

interface InstallmentOptionsProps {
  totalCents: number;
  className?: string;
}

/** "Em até 12x de R$X sem juros" teaser — pure display, no real payment
 * gateway or financing involved. */
export function InstallmentOptions({ totalCents, className }: InstallmentOptionsProps) {
  const option = bestInstallmentOption(totalCents);

  if (!option || option.count <= 1) return null;

  return (
    <p className={cn("text-sm text-muted-foreground", className)}>
      em até {option.count}x de {formatPrice(option.valueCents)} sem juros
    </p>
  );
}
