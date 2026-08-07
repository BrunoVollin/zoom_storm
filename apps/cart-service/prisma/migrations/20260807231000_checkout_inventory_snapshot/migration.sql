ALTER TABLE "Order"
ADD COLUMN "checkoutIdempotencyKey" TEXT,
ADD COLUMN "inventoryReservationId" TEXT,
ADD COLUMN "savedAddressId" TEXT,
ADD COLUMN "shippingAddress" JSONB;

ALTER TABLE "OrderItem"
ADD COLUMN "variantId" TEXT;

-- Legacy paid orders predate reservation-backed checkout. Stable synthetic
-- values preserve them while all new writes use real identifiers/snapshots.
UPDATE "Order"
SET
  "checkoutIdempotencyKey" = CONCAT('legacy-', "id"),
  "inventoryReservationId" = CONCAT('legacy-', "id"),
  "savedAddressId" = 'legacy-address',
  "shippingAddress" = jsonb_build_object(
    'label', 'Legacy',
    'recipient', '',
    'street', '',
    'number', '',
    'complement', NULL,
    'neighborhood', '',
    'city', COALESCE("destinationCity", ''),
    'state', '',
    'zip', ''
  )
WHERE "checkoutIdempotencyKey" IS NULL;

UPDATE "OrderItem"
SET "variantId" = "productId"
WHERE "variantId" IS NULL;

ALTER TABLE "Order"
ALTER COLUMN "checkoutIdempotencyKey" SET NOT NULL,
ALTER COLUMN "inventoryReservationId" SET NOT NULL,
ALTER COLUMN "savedAddressId" SET NOT NULL,
ALTER COLUMN "shippingAddress" SET NOT NULL;

ALTER TABLE "OrderItem"
ALTER COLUMN "variantId" SET NOT NULL;

CREATE UNIQUE INDEX "Order_userId_checkoutIdempotencyKey_key"
ON "Order"("userId", "checkoutIdempotencyKey");

CREATE INDEX "Order_status_expiresAt_idx"
ON "Order"("status", "expiresAt");
