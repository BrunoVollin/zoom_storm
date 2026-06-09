import { useQuery } from "@tanstack/react-query";
import { productService } from "@/services/product-service";
import { queryKeys } from "@/constants/query-keys";

export function useProducts() {
  return useQuery({
    queryKey: queryKeys.products.all,
    queryFn: productService.list,
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: () => productService.getById(id),
    enabled: Boolean(id),
  });
}
