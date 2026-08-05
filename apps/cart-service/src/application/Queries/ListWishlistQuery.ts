import { IdType } from '@src/domain/shared/IdType';
import { WishlistRepository } from '@src/domain/repositories/WishlistRepository';
import { Query } from '../contracts/Query';
import { Status } from '../contracts/UseCase';
import { WishlistMapper, WishlistItemPrimitives } from '../mappers/WishlistMapper';

export class ListWishlistQuery implements Query<Input, Output> {
  constructor(private readonly wishlistRepository: WishlistRepository) {}

  async execute(input: Input): Promise<Output> {
    const items = await this.wishlistRepository.findByUserId(
      IdType.create(input.userId),
    );

    return {
      status: Status.SUCCESS,
      items: items.map((item) => WishlistMapper.toPrimitives(item)),
    };
  }
}

interface Input {
  userId: string;
}

interface SuccessOutput {
  status: Status.SUCCESS;
  items: Array<WishlistItemPrimitives>;
}

type Output = SuccessOutput;
