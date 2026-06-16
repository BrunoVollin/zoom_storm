-- DropForeignKey
ALTER TABLE "CartItem" DROP CONSTRAINT "CartItem_productId_fkey";

-- DropTable
DROP TABLE "Product";

-- AlterTable: add product snapshot columns to CartItem
ALTER TABLE "CartItem"
  ADD COLUMN "productName" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "productPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "productDescription" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "productCategory" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "productStock" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "productWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "transportHeight" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "transportWidth" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "transportLength" INTEGER NOT NULL DEFAULT 0;

-- AlterTable: drop defaults now that columns are populated on every write
ALTER TABLE "CartItem"
  ALTER COLUMN "productName" DROP DEFAULT,
  ALTER COLUMN "productPrice" DROP DEFAULT,
  ALTER COLUMN "productDescription" DROP DEFAULT,
  ALTER COLUMN "productCategory" DROP DEFAULT,
  ALTER COLUMN "productStock" DROP DEFAULT,
  ALTER COLUMN "productWeight" DROP DEFAULT,
  ALTER COLUMN "transportHeight" DROP DEFAULT,
  ALTER COLUMN "transportWidth" DROP DEFAULT,
  ALTER COLUMN "transportLength" DROP DEFAULT;
