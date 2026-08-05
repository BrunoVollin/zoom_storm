"use client";

import Link from "next/link";
import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ROUTES } from "@/constants/routes";
import { useDeleteFlashOffer } from "@/hooks/use-flash-offers";
import type { FlashOffer } from "@/types/flash-offer";

export function FlashOfferTable({ offers }: { offers: FlashOffer[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Título</TableHead>
          <TableHead>Desconto</TableHead>
          <TableHead>Início</TableHead>
          <TableHead>Término</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {offers.map((offer) => (
          <FlashOfferRow key={offer.id} offer={offer} />
        ))}
      </TableBody>
    </Table>
  );
}

function FlashOfferRow({ offer }: { offer: FlashOffer }) {
  const [open, setOpen] = useState(false);
  const deleteFlashOffer = useDeleteFlashOffer();

  const handleDelete = async () => {
    await deleteFlashOffer.mutateAsync(offer.id);
    setOpen(false);
  };

  return (
    <TableRow>
      <TableCell className="font-medium">{offer.title}</TableCell>
      <TableCell>-{Math.round(offer.discountPct)}%</TableCell>
      <TableCell>{new Date(offer.startsAt).toLocaleString("pt-BR")}</TableCell>
      <TableCell>{new Date(offer.endsAt).toLocaleString("pt-BR")}</TableCell>
      <TableCell className="flex justify-end gap-2">
        <Button asChild variant="outline" size="icon">
          <Link href={ROUTES.adminFlashOfferEdit(offer.id)} aria-label={`Editar ${offer.title}`}>
            <Pencil className="size-4" />
          </Link>
        </Button>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" size="icon" aria-label={`Excluir ${offer.title}`}>
              <Trash2 className="size-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Excluir oferta</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir &quot;{offer.title}&quot;? Essa ação não pode ser
                desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteFlashOffer.isPending}
              >
                {deleteFlashOffer.isPending ? "Excluindo..." : "Excluir"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </TableCell>
    </TableRow>
  );
}
