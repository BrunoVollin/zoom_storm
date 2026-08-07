-- Coupon versioning + soft delete
ALTER TABLE "Coupon"
ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Snapshot the coupon version that was applied to the cart, so the checkout
-- can detect COUPON_CHANGED when an admin edits it afterwards.
ALTER TABLE "CartCoupon"
ADD COLUMN "appliedVersion" INTEGER NOT NULL DEFAULT 1;

-- Loyalty point reservations (checkout -> payment / cancellation / expiration)
CREATE TYPE "LoyaltyReservationStatus" AS ENUM ('ACTIVE', 'CONSUMED', 'RELEASED', 'EXPIRED');

CREATE TABLE "LoyaltyReservation" (
  "orderId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "points" INTEGER NOT NULL,
  "status" "LoyaltyReservationStatus" NOT NULL DEFAULT 'ACTIVE',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "LoyaltyReservation_pkey" PRIMARY KEY ("orderId")
);

CREATE INDEX "LoyaltyReservation_userId_idx" ON "LoyaltyReservation"("userId");
CREATE INDEX "LoyaltyReservation_status_expiresAt_idx" ON "LoyaltyReservation"("status", "expiresAt");

-- Short-lived shipping quotes bound to cart/address/version
CREATE TABLE "ShippingQuote" (
  "id" TEXT NOT NULL,
  "cartId" TEXT NOT NULL,
  "addressId" TEXT NOT NULL,
  "cartVersion" INTEGER NOT NULL,
  "shipping" DOUBLE PRECISION NOT NULL,
  "estimatedDays" INTEGER NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ShippingQuote_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ShippingQuote_cartId_idx" ON "ShippingQuote"("cartId");
