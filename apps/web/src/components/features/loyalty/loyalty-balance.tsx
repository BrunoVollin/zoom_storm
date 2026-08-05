import { Gift } from "lucide-react";

import { useLoyaltyBalance } from "@/hooks/use-loyalty";

export function LoyaltyBalance() {
  const { data: balance } = useLoyaltyBalance();

  if (balance === undefined) return null;

  return (
    <span
      className="flex items-center gap-1 text-sm text-muted-foreground"
      title="Pontos de fidelidade"
    >
      <Gift className="size-4" />
      {balance}
    </span>
  );
}
