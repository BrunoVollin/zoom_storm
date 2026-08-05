-- AlterTable: CartItem now snapshots a specific ProductVariant, not just a Product.
ALTER TABLE "CartItem" RENAME COLUMN "productPrice" TO "variantPrice";
ALTER TABLE "CartItem" RENAME COLUMN "productStock" TO "variantStock";
ALTER TABLE "CartItem" ADD COLUMN     "variantId" TEXT;
ALTER TABLE "CartItem" ADD COLUMN     "variantSku" TEXT;
ALTER TABLE "CartItem" ADD COLUMN     "variantName" TEXT;

-- AlterTable: price now lives on the variant, not the product — a wishlist
-- entry is a "I'm interested" signal, not a checkout snapshot, so it no
-- longer freezes a price.
ALTER TABLE "WishlistItem" DROP COLUMN "productPrice";
