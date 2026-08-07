-- Reservation lines retain the catalog price that the customer accepted.
-- Existing rows are backfilled from the owning variant before the column is
-- made mandatory.
ALTER TABLE "InventoryReservationLine"
ADD COLUMN "expectedUnitPrice" DOUBLE PRECISION;

UPDATE "InventoryReservationLine" AS line
SET "expectedUnitPrice" = variant."price"
FROM "ProductVariant" AS variant
WHERE variant."id" = line."variantId";

ALTER TABLE "InventoryReservationLine"
ALTER COLUMN "expectedUnitPrice" SET NOT NULL;

ALTER TABLE "InventoryReservationLine"
ADD CONSTRAINT "InventoryReservationLine_expectedUnitPrice_nonnegative_check"
CHECK ("expectedUnitPrice" >= 0);
