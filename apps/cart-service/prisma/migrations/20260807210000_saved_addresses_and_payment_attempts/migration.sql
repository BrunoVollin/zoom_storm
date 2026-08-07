-- Extend the order lifecycle without treating CREATED orders as paid.
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'EXPIRED';

ALTER TABLE "Order"
ADD COLUMN "expiresAt" TIMESTAMP(3);

UPDATE "Order"
SET "expiresAt" = "createdAt" + INTERVAL '15 minutes'
WHERE "expiresAt" IS NULL;

ALTER TABLE "Order"
ALTER COLUMN "expiresAt" SET NOT NULL;

-- Saved cards remain safe snapshots (no PAN/CVC) and now support one default
-- per user. Existing cards are retained and the oldest becomes the default.
ALTER TABLE "SavedCard"
ADD COLUMN "isDefault" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "updatedAt" TIMESTAMP(3);

UPDATE "SavedCard"
SET "updatedAt" = "createdAt"
WHERE "updatedAt" IS NULL;

WITH first_card AS (
  SELECT DISTINCT ON ("userId") "id"
  FROM "SavedCard"
  ORDER BY "userId", "createdAt" ASC, "id" ASC
)
UPDATE "SavedCard"
SET "isDefault" = true
WHERE "id" IN (SELECT "id" FROM first_card);

ALTER TABLE "SavedCard"
ALTER COLUMN "updatedAt" SET NOT NULL;

CREATE UNIQUE INDEX "SavedCard_one_default_per_user"
ON "SavedCard" ("userId")
WHERE "isDefault" = true;

-- UserProfile keeps its embedded address for backwards compatibility. Every
-- legacy profile is copied once into the new 1:N address book.
CREATE TABLE "SavedAddress" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "recipient" TEXT NOT NULL,
  "street" TEXT NOT NULL,
  "number" TEXT NOT NULL,
  "complement" TEXT,
  "neighborhood" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "zip" TEXT NOT NULL,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SavedAddress_pkey" PRIMARY KEY ("id")
);

INSERT INTO "SavedAddress" (
  "id", "userId", "label", "recipient", "street", "number",
  "complement", "neighborhood", "city", "state", "zip", "isDefault",
  "createdAt", "updatedAt"
)
SELECT
  CONCAT('legacy-', MD5("userId")),
  "userId",
  'Home',
  "fullName",
  "addressStreet",
  "addressNumber",
  "addressComplement",
  "addressNeighborhood",
  "addressCity",
  "addressState",
  "addressZip",
  true,
  "updatedAt",
  "updatedAt"
FROM "UserProfile";

CREATE INDEX "SavedAddress_userId_idx" ON "SavedAddress"("userId");
CREATE UNIQUE INDEX "SavedAddress_one_default_per_user"
ON "SavedAddress" ("userId")
WHERE "isDefault" = true;

CREATE TYPE "PaymentAttemptStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED');
CREATE TYPE "PaymentMethodType" AS ENUM ('SAVED_CARD', 'NEW_CARD');

CREATE TABLE "PaymentAttempt" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "methodType" "PaymentMethodType" NOT NULL,
  "savedCardId" TEXT,
  "brand" TEXT NOT NULL,
  "lastFour" TEXT NOT NULL,
  "holderName" TEXT NOT NULL,
  "expiry" TEXT NOT NULL,
  "saveCard" BOOLEAN NOT NULL DEFAULT false,
  "installments" INTEGER NOT NULL,
  "status" "PaymentAttemptStatus" NOT NULL DEFAULT 'PENDING',
  "failureReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PaymentAttempt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PaymentAttempt_userId_idempotencyKey_key"
ON "PaymentAttempt"("userId", "idempotencyKey");
CREATE INDEX "PaymentAttempt_orderId_idx" ON "PaymentAttempt"("orderId");
CREATE UNIQUE INDEX "PaymentAttempt_one_success_per_order"
ON "PaymentAttempt"("orderId")
WHERE "status" = 'SUCCEEDED';

ALTER TABLE "PaymentAttempt"
ADD CONSTRAINT "PaymentAttempt_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "Order"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PaymentAttempt"
ADD CONSTRAINT "PaymentAttempt_installments_check"
CHECK ("installments" BETWEEN 1 AND 12),
ADD CONSTRAINT "PaymentAttempt_lastFour_check"
CHECK ("lastFour" ~ '^[0-9]{4}$'),
ADD CONSTRAINT "PaymentAttempt_expiry_check"
CHECK ("expiry" ~ '^(0[1-9]|1[0-2])/[0-9]{2}$'),
ADD CONSTRAINT "PaymentAttempt_method_check"
CHECK (
  ("methodType" = 'SAVED_CARD' AND "savedCardId" IS NOT NULL AND LENGTH("savedCardId") > 0 AND "saveCard" = false)
  OR
  ("methodType" = 'NEW_CARD' AND "savedCardId" IS NULL)
);
