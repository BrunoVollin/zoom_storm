"use client";

import { Wand2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useIsAdmin } from "@/hooks/use-current-user";
import { generateTestCardData, type TestCardData } from "@/utils/test-card-data";

interface FillTestCardButtonProps {
  onFill: (data: TestCardData) => void;
}

/** Debug shortcut, visible only to admins, that fills a card form with
 * random-but-valid data (passes Luhn, future expiry, 3-digit CVV) so admins
 * can quickly exercise the checkout/saved-card flows without typing fake
 * numbers by hand. */
export function FillTestCardButton({ onFill }: FillTestCardButtonProps) {
  const isAdmin = useIsAdmin();

  if (!isAdmin) return null;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="w-fit gap-1.5"
      onClick={() => onFill(generateTestCardData())}
    >
      <Wand2 className="size-3.5" />
      Fill with test data
    </Button>
  );
}
