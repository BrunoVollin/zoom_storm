"use client";

import type { ReactNode } from "react";

import { ErrorState } from "@/components/shared/error-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { useAuth } from "@/providers/auth-provider";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user?.roles.includes("admin")) {
    return (
      <ErrorState
        title="Acesso restrito"
        message="Esta área é exclusiva para administradores."
      />
    );
  }

  return <div className="flex flex-col gap-6">{children}</div>;
}
