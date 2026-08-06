import { Gift } from "lucide-react";

import { useLoyaltyBalance } from "@/hooks/use-loyalty";

export function LoyaltyBalance() {
  const { data: balance } = useLoyaltyBalance();

  if (balance === undefined) return null;

  return (
    <span
      className="hidden items-center gap-1 rounded-md px-2 py-1.5 text-sm text-white/90 sm:flex"
      title="Loyalty points"
    >
      <Gift className="size-4" />
      {balance}
    </span>
  );
}
