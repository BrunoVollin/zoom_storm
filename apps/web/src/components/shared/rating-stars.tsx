import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

interface RatingStarsProps {
  value: number;
  className?: string;
}

export function RatingStars({ value, className }: RatingStarsProps) {
  const rounded = Math.round(value);

  return (
    <div className={cn("flex items-center gap-1", className)} aria-label={`Avaliação ${value.toFixed(1)} de 5`}>
      <div className="flex">
        {Array.from({ length: 5 }, (_, index) => (
          <Star
            key={index}
            className={cn(
              "size-3.5",
              index < rounded ? "fill-amber-400 text-amber-400" : "text-muted-foreground",
            )}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground tabular-nums">{value.toFixed(1)}</span>
    </div>
  );
}
