import { WishlistItem } from '../../../../domain/entities/wishlist/WishlistItem';
import { IdType } from '../../../../domain/shared/IdType';
import { WishlistRepository } from '../../../../domain/repositories/WishlistRepository';
import { prisma } from '../prisma-connection';

export class PrismaWishlistRepository implements WishlistRepository {
  async add(item: WishlistItem): Promise<void> {
    const userId = item.userId.toString();
    const productId = item.productId.toString();

    await prisma.wishlistItem.upsert({
      where: { userId_productId: { userId, productId } },
      create: {
        id: item.id.toString(),
        userId,
        productId,
        productName: item.productName,
      },
      update: {},
    });
  }

  async remove(userId: IdType, productId: IdType): Promise<void> {
    await prisma.wishlistItem.deleteMany({
      where: { userId: userId.toString(), productId: productId.toString() },
    });
  }

  async findByUserId(userId: IdType): Promise<Array<WishlistItem>> {
    const items = await prisma.wishlistItem.findMany({
      where: { userId: userId.toString() },
      orderBy: { createdAt: 'desc' },
    });

    return items.map(
      (item) =>
        new WishlistItem(
          IdType.create(item.id),
          IdType.create(item.userId),
          IdType.create(item.productId),
          item.productName,
          item.createdAt,
        ),
    );
  }
}
