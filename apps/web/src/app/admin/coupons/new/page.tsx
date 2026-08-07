"use client";

import { useRouter } from "next/navigation";

import { CouponForm } from "@/components/features/admin/coupon-form";
import { ROUTES } from "@/constants/routes";
import { useCreateCoupon } from "@/hooks/use-coupons";

export default function NewCouponPage() {
  const router = useRouter();
  const createCoupon = useCreateCoupon();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Novo cupom</h1>
        <p className="text-sm text-muted-foreground">Cadastre um novo cupom de desconto.</p>
      </div>

      <CouponForm
        submitLabel="Criar"
        onSubmit={async (input) => {
          await createCoupon.mutateAsync(input);
          router.push(ROUTES.adminCoupons);
        }}
      />
    </div>
  );
}
