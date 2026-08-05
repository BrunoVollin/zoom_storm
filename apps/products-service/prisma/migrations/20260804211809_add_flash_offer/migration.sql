-- CreateTable
CREATE TABLE "FlashOffer" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "discountPct" DOUBLE PRECISION NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FlashOffer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FlashOffer_startsAt_endsAt_idx" ON "FlashOffer"("startsAt", "endsAt");
