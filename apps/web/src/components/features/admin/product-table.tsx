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
import { PriceTag } from "@/components/shared/price-tag";
import { ROUTES } from "@/constants/routes";
import { useDeleteProduct } from "@/hooks/use-products";
import { getDefaultVariant, type Product } from "@/types/product";

export function ProductTable({ products }: { products: Product[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Categoria</TableHead>
          <TableHead>Preço</TableHead>
          <TableHead>Estoque</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <ProductRow key={product.id} product={product} />
        ))}
      </TableBody>
    </Table>
  );
}

function ProductRow({ product }: { product: Product }) {
  const [open, setOpen] = useState(false);
  const deleteProduct = useDeleteProduct();
  const variant = getDefaultVariant(product);

  const handleDelete = async () => {
    await deleteProduct.mutateAsync(product.id);
    setOpen(false);
  };

  return (
    <TableRow>
      <TableCell className="font-medium">{product.name}</TableCell>
      <TableCell>{product.category}</TableCell>
      <TableCell>
        <PriceTag cents={variant.price} />
      </TableCell>
      <TableCell>{variant.stock}</TableCell>
      <TableCell className="flex justify-end gap-2">
        <Button asChild variant="outline" size="icon">
          <Link href={ROUTES.adminProductEdit(product.id)} aria-label={`Editar ${product.name}`}>
            <Pencil className="size-4" />
          </Link>
        </Button>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" size="icon" aria-label={`Excluir ${product.name}`}>
              <Trash2 className="size-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Excluir produto</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir &quot;{product.name}&quot;? Essa ação não pode ser
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
                disabled={deleteProduct.isPending}
              >
                {deleteProduct.isPending ? "Excluindo..." : "Excluir"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </TableCell>
    </TableRow>
  );
}
