"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { profileService } from "@/services/profile-service";
import { queryKeys } from "@/constants/query-keys";
import { useCurrentUser } from "@/hooks/use-current-user";
import type { UpdateProfileInput } from "@/types/profile";

export function useProfile() {
  const { data: user, isLoading: isUserLoading } = useCurrentUser();

  const query = useQuery({
    queryKey: queryKeys.profile.detail,
    queryFn: () => profileService.get(),
    enabled: Boolean(user),
  });

  return {
    ...query,
    // `query.isLoading` is false while the query sits disabled waiting for
    // `user` to resolve (no fetch in flight yet), which would let a
    // consumer render a form with stale/empty defaults before the profile
    // ever loads. `isPending` stays true in that window (no data yet,
    // regardless of `enabled`), so combine it with the user's own loading
    // state to get a single accurate "not ready to render yet" flag.
    isLoading: isUserLoading || query.isPending,
  };
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateProfileInput) => profileService.update(input),
    onSuccess: (profile) => {
      queryClient.setQueryData(queryKeys.profile.detail, profile);
    },
  });
}
