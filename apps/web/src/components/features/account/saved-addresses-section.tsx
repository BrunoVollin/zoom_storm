"use client";

import { useState } from "react";
import { MapPinned, Plus } from "lucide-react";

import { ErrorState } from "@/components/shared/error-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { SavedAddressForm } from "@/components/features/account/saved-address-form";
import { SavedAddressesList } from "@/components/features/account/saved-addresses-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useAddSavedAddress,
  useDeleteSavedAddress,
  useSavedAddresses,
  useSetDefaultSavedAddress,
  useUpdateSavedAddress,
} from "@/hooks/use-saved-addresses";
import type { SavedAddressFormInput } from "@/schemas/saved-address.schema";
import type { SavedAddress } from "@/types/saved-address";

export function SavedAddressesSection() {
  const { data: addresses, isLoading, error, refetch } = useSavedAddresses();
  const addAddress = useAddSavedAddress();
  const updateAddress = useUpdateSavedAddress();
  const deleteAddress = useDeleteSavedAddress();
  const setDefaultAddress = useSetDefaultSavedAddress();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const openAdd = () => {
    setEditingAddress(null);
    setActionError(null);
    setDialogOpen(true);
  };

  const openEdit = (address: SavedAddress) => {
    setEditingAddress(address);
    setActionError(null);
    setDialogOpen(true);
  };

  const handleSubmit = async (values: SavedAddressFormInput) => {
    setActionError(null);
    try {
      if (editingAddress) {
        const { isDefault, ...input } = values;
        await updateAddress.mutateAsync({ addressId: editingAddress.id, input });
        if (isDefault && !editingAddress.isDefault) {
          await setDefaultAddress.mutateAsync(editingAddress.id);
        }
      } else {
        await addAddress.mutateAsync({
          ...values,
          complement: values.complement || null,
        });
      }
      setDialogOpen(false);
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : "Could not save the address");
    }
  };

  const handleDelete = async (addressId: string) => {
    if (!window.confirm("Remove this saved address?")) return;
    setActionError(null);
    try {
      await deleteAddress.mutateAsync(addressId);
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : "Could not remove the address");
    }
  };

  const handleSetDefault = async (addressId: string) => {
    setActionError(null);
    try {
      await setDefaultAddress.mutateAsync(addressId);
    } catch (caught) {
      setActionError(
        caught instanceof Error ? caught.message : "Could not define the default address",
      );
    }
  };

  const busyAddressId = deleteAddress.variables ?? setDefaultAddress.variables ?? null;
  const mutationPending = addAddress.isPending || updateAddress.isPending || setDefaultAddress.isPending;

  return (
    <>
      <Card data-testid="saved-addresses-section">
        <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPinned className="size-4" /> Shipping addresses
            </CardTitle>
            <CardDescription className="mt-1.5">
              Save multiple addresses and choose which one to use for each purchase.
            </CardDescription>
          </div>
          <Button data-testid="add-address-btn" type="button" size="sm" onClick={openAdd}>
            <Plus /> Add address
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {isLoading ? <LoadingSpinner /> : null}
          {error ? (
            <ErrorState
              title="We couldn't load your addresses"
              message="Please try again in a moment."
              onRetry={() => void refetch()}
            />
          ) : null}
          {!isLoading && !error && addresses?.length ? (
            <SavedAddressesList
              addresses={addresses}
              busyAddressId={busyAddressId}
              onEdit={openEdit}
              onDelete={(addressId) => void handleDelete(addressId)}
              onSetDefault={(addressId) => void handleSetDefault(addressId)}
            />
          ) : null}
          {!isLoading && !error && !addresses?.length ? (
            <p className="text-sm text-muted-foreground">
              You don&apos;t have a saved shipping address yet.
            </p>
          ) : null}
          {actionError ? (
            <p data-testid="saved-address-error" className="text-sm text-destructive" role="alert">
              {actionError}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAddress ? "Edit address" : "Add address"}</DialogTitle>
            <DialogDescription>
              This address will be available when calculating shipping and checking out.
            </DialogDescription>
          </DialogHeader>
          <SavedAddressForm
            key={editingAddress?.id ?? "new-address"}
            defaultValues={editingAddress ?? undefined}
            isSubmitting={mutationPending}
            onCancel={() => setDialogOpen(false)}
            onSubmit={handleSubmit}
          />
          {actionError ? (
            <p data-testid="saved-address-dialog-error" className="mt-3 text-sm text-destructive" role="alert">
              {actionError}
            </p>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
