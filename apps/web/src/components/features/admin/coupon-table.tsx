"use client";

import Link from "next/link";
import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
import { useDeleteCoupon } from "@/hooks/use-coupons";
import type { AdminCoupon } from "@/types/coupon";

function formatCouponValue(coupon: AdminCoupon): string {
  if (coupon.type === "PERCENT") {
    return `${Math.round((coupon.percent ?? 0) * 100)}%`;
  }
  return ((coupon.amount ?? 0) / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function CouponTable({ coupons }: { coupons: AdminCoupon[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Valor</TableHead>
          <TableHead>Início</TableHead>
          <TableHead>Término</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {coupons.map((coupon) => (
          <CouponRow key={coupon.id} coupon={coupon} />
        ))}
      </TableBody>
    </Table>
  );
}

function CouponRow({ coupon }: { coupon: AdminCoupon }) {
  const [open, setOpen] = useState(false);
  const deleteCoupon = useDeleteCoupon();

  const handleDelete = async () => {
    await deleteCoupon.mutateAsync(coupon.id);
    setOpen(false);
  };

  return (
    <TableRow data-testid={`admin-coupon-row-${coupon.id}`}>
      <TableCell className="font-medium">{coupon.name}</TableCell>
      <TableCell>{coupon.type === "PERCENT" ? "Percentual" : "Valor fixo"}</TableCell>
      <TableCell>{formatCouponValue(coupon)}</TableCell>
      <TableCell>{new Date(coupon.start).toLocaleString("pt-BR")}</TableCell>
      <TableCell>{new Date(coupon.end).toLocaleString("pt-BR")}</TableCell>
      <TableCell>
        {coupon.isValid ? (
          <Badge variant="outline" className="border-emerald-500 text-emerald-700">
            Válido
          </Badge>
        ) : (
          <Badge className="border-transparent bg-destructive text-destructive-foreground">
            Expirado
          </Badge>
        )}
      </TableCell>
      <TableCell className="flex justify-end gap-2">
        <Button asChild variant="outline" size="icon">
          <Link
            data-testid={`edit-coupon-${coupon.id}`}
            href={ROUTES.adminCouponEdit(coupon.id)}
            aria-label={`Editar ${coupon.name}`}
          >
            <Pencil className="size-4" />
          </Link>
        </Button>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              data-testid={`delete-coupon-${coupon.id}`}
              variant="destructive"
              size="icon"
              aria-label={`Excluir ${coupon.name}`}
            >
              <Trash2 className="size-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Excluir cupom</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir &quot;{coupon.name}&quot;? Essa ação não pode ser
                desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button
                data-testid="confirm-delete-coupon-btn"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteCoupon.isPending}
              >
                {deleteCoupon.isPending ? "Excluindo..." : "Excluir"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </TableCell>
    </TableRow>
  );
}
