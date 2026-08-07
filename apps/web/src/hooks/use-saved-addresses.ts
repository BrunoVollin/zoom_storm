"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/constants/query-keys";
import { savedAddressService } from "@/services/saved-address-service";
import type { AddSavedAddressInput, SavedAddressInput } from "@/types/saved-address";

function useInvalidateAddresses() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.profile.addresses });
}

export function useSavedAddresses() {
  return useQuery({
    queryKey: queryKeys.profile.addresses,
    queryFn: () => savedAddressService.list(),
  });
}

export function useAddSavedAddress() {
  const invalidate = useInvalidateAddresses();
  return useMutation({
    mutationFn: (input: AddSavedAddressInput) => savedAddressService.add(input),
    onSuccess: invalidate,
  });
}

export function useUpdateSavedAddress() {
  const invalidate = useInvalidateAddresses();
  return useMutation({
    mutationFn: ({ addressId, input }: { addressId: string; input: SavedAddressInput }) =>
      savedAddressService.update(addressId, input),
    onSuccess: invalidate,
  });
}

export function useDeleteSavedAddress() {
  const invalidate = useInvalidateAddresses();
  return useMutation({
    mutationFn: (addressId: string) => savedAddressService.remove(addressId),
    onSuccess: invalidate,
  });
}

export function useSetDefaultSavedAddress() {
  const invalidate = useInvalidateAddresses();
  return useMutation({
    mutationFn: (addressId: string) => savedAddressService.setDefault(addressId),
    onSuccess: invalidate,
  });
}
