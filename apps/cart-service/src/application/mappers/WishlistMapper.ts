import { WishlistItem } from '@src/domain/entities/wishlist/WishlistItem';

export class WishlistMapper {
  static toPrimitives(item: WishlistItem) {
    return {
      id: item.id.toString(),
      productId: item.productId.toString(),
      productName: item.productName,
      createdAt: item.createdAt.toISOString(),
    };
  }
}

export type WishlistItemPrimitives = ReturnType<typeof WishlistMapper.toPrimitives>;
