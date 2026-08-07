-- Existing reviews predate authenticated purchase authorization. Nullable
-- identifiers preserve them while all new reviews carry a purchase identity.
ALTER TABLE "ProductReview"
ADD COLUMN "userId" TEXT,
ADD COLUMN "orderId" TEXT;

CREATE UNIQUE INDEX "ProductReview_userId_orderId_productId_key"
ON "ProductReview"("userId", "orderId", "productId");

CREATE TABLE "ReviewEligibility" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "deliveredAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReviewEligibility_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ReviewEligibility_userId_orderId_productId_key"
ON "ReviewEligibility"("userId", "orderId", "productId");

CREATE INDEX "ReviewEligibility_productId_idx"
ON "ReviewEligibility"("productId");

ALTER TABLE "ReviewEligibility"
ADD CONSTRAINT "ReviewEligibility_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "Product"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
