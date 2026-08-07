"use client";

import { AdminNav } from "@/components/features/admin/admin-nav";
import { CouponTable } from "@/components/features/admin/coupon-table";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { useCoupons } from "@/hooks/use-coupons";

export default function AdminCouponsPage() {
  const { data: coupons, isLoading, error } = useCoupons();

  return (
    <div className="flex flex-col gap-6">
      <AdminNav />

      {isLoading ? <LoadingSpinner /> : null}
      {error ? (
        <ErrorState
          title="Não foi possível carregar os cupons"
          message="Tente novamente em instantes."
        />
      ) : null}
      {!isLoading && !error && coupons?.length === 0 ? (
        <EmptyState title="Nenhum cupom cadastrado" />
      ) : null}
      {coupons && coupons.length > 0 ? <CouponTable coupons={coupons} /> : null}
    </div>
  );
}
