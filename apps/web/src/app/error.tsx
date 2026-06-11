"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/error-state";

/**
 * Global error boundary for the App Router — catches render/data errors that
 * escape page-level handling so the user never sees a raw Next.js crash page.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center gap-4">
      <ErrorState title="Ocorreu um erro inesperado" message={error.message} />
      <Button onClick={reset} variant="outline">
        Tentar novamente
      </Button>
    </div>
  );
}
