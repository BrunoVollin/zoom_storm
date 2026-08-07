import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { couponService } from "@/services/coupon-service";
import type { CouponWriteInput } from "@/types/coupon";

const couponsKey = ["coupons", "admin"] as const;

export function useCoupons() {
  return useQuery({
    queryKey: couponsKey,
    queryFn: () => couponService.list(),
  });
}

function invalidateCoupons(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: couponsKey });
}

export function useCreateCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CouponWriteInput) => couponService.create(input),
    onSuccess: () => invalidateCoupons(queryClient),
  });
}

export function useUpdateCoupon(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CouponWriteInput) => couponService.update(id, input),
    onSuccess: () => invalidateCoupons(queryClient),
  });
}

export function useDeleteCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => couponService.remove(id),
    onSuccess: () => invalidateCoupons(queryClient),
  });
}
