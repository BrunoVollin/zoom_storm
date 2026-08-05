import { WishlistItem } from '../../domain/entities/wishlist/WishlistItem';
import { WishlistRepository } from '../../domain/repositories/WishlistRepository';
import { ProductRepository } from '../../domain/repositories/ProductRepository';
import { IdType } from '../../domain/shared/IdType';
import { ErrorOutput, Status, UseCase } from '../contracts/UseCase';
import { WishlistMapper, WishlistItemPrimitives } from '../mappers/WishlistMapper';
import { handleUnexpectedError } from '../shared/handleUnexpectedError';

export class AddToWishlistUseCase implements UseCase<Input, Output> {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly wishlistRepository: WishlistRepository,
  ) {}

  async execute(input: Input): Promise<Output> {
    try {
      const product = await this.productRepository.findById(
        IdType.create(input.productId),
      );

      if (!product) {
        return { status: Status.ERROR, message: 'Product not found' };
      }

      const item = new WishlistItem(
        IdType.create(),
        IdType.create(input.userId),
        product.productId,
        product.productName,
      );

      await this.wishlistRepository.add(item);

      return { status: Status.SUCCESS, item: WishlistMapper.toPrimitives(item) };
    } catch (error) {
      return handleUnexpectedError(error);
    }
  }
}

interface Input {
  userId: string;
  productId: string;
}

interface SuccessOutput {
  status: Status.SUCCESS;
  item: WishlistItemPrimitives;
}

type Output = SuccessOutput | ErrorOutput;
