import { formatPrice } from "@/utils/format-price";
import { cn } from "@/lib/utils";

interface PriceTagProps {
  cents: number;
  className?: string;
}

export function PriceTag({ cents, className }: PriceTagProps) {
  return <span className={cn("font-semibold tabular-nums", className)}>{formatPrice(cents)}</span>;
}
