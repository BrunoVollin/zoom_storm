import { useQuery } from "@tanstack/react-query";
import { authService } from "@/services/auth-service";
import { queryKeys } from "@/constants/query-keys";

export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: authService.getCurrentUser,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
