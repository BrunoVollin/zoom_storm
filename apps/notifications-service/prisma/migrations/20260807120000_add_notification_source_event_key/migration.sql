-- AlterTable
ALTER TABLE "Notification" ADD COLUMN "sourceEventKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Notification_sourceEventKey_key" ON "Notification"("sourceEventKey");
