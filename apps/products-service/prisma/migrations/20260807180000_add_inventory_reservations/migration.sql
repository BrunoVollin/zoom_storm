-- Soft deletion keeps historical catalog references available while removing
-- products from customer-facing projections.
ALTER TABLE "Product" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- `stock` remains physical stock; availability is stock - reservedStock.
ALTER TABLE "ProductVariant"
ADD COLUMN "reservedStock" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "ProductVariant"
ADD CONSTRAINT "ProductVariant_stock_nonnegative_check" CHECK ("stock" >= 0),
ADD CONSTRAINT "ProductVariant_reservedStock_nonnegative_check" CHECK ("reservedStock" >= 0),
ADD CONSTRAINT "ProductVariant_reservedStock_lte_stock_check" CHECK ("reservedStock" <= "stock");

CREATE TYPE "InventoryReservationStatus" AS ENUM (
  'ACTIVE',
  'CONFIRMED',
  'RELEASED',
  'EXPIRED'
);

CREATE TABLE "InventoryReservation" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "status" "InventoryReservationStatus" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InventoryReservation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InventoryReservationLine" (
  "id" TEXT NOT NULL,
  "reservationId" TEXT NOT NULL,
  "variantId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  CONSTRAINT "InventoryReservationLine_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "InventoryReservationLine_quantity_positive_check" CHECK ("quantity" > 0)
);

CREATE UNIQUE INDEX "InventoryReservation_orderId_key"
ON "InventoryReservation"("orderId");

CREATE INDEX "InventoryReservation_status_expiresAt_idx"
ON "InventoryReservation"("status", "expiresAt");

CREATE UNIQUE INDEX "InventoryReservationLine_reservationId_variantId_key"
ON "InventoryReservationLine"("reservationId", "variantId");

CREATE INDEX "InventoryReservationLine_variantId_idx"
ON "InventoryReservationLine"("variantId");

ALTER TABLE "InventoryReservationLine"
ADD CONSTRAINT "InventoryReservationLine_reservationId_fkey"
FOREIGN KEY ("reservationId") REFERENCES "InventoryReservation"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InventoryReservationLine"
ADD CONSTRAINT "InventoryReservationLine_variantId_fkey"
FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
