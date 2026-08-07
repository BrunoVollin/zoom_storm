"use client";

import { useParams, useRouter } from "next/navigation";

import { CouponForm } from "@/components/features/admin/coupon-form";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { ROUTES } from "@/constants/routes";
import { useCoupons, useUpdateCoupon } from "@/hooks/use-coupons";

export default function EditCouponPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { data: coupons, isLoading, error } = useCoupons();
  const coupon = coupons?.find((c) => c.id === id);
  const updateCoupon = useUpdateCoupon(id);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !coupon) {
    return <ErrorState title="Cupom não encontrado" />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Editar cupom</h1>
        <p className="text-sm text-muted-foreground">{coupon.name}</p>
      </div>

      <CouponForm
        initialCoupon={coupon}
        submitLabel="Salvar"
        onSubmit={async (input) => {
          await updateCoupon.mutateAsync(input);
          router.push(ROUTES.adminCoupons);
        }}
      />
    </div>
  );
}
