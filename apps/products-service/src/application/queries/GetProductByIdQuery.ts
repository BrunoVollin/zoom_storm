import { ProductRepository } from '../../domain/repositories/ProductRepository';
import { IdType } from '../../domain/shared/IdType';
import { Query, Status } from '../contracts/Query';
import { ProductMapper, ProductPrimitives } from '../mappers/ProductMapper';

interface Input {
  id: string;
}

interface SuccessOutput {
  status: Status.SUCCESS;
  product: ProductPrimitives;
}

interface ErrorOutput {
  status: Status.ERROR;
  message: string;
}

type Output = SuccessOutput | ErrorOutput;

export class GetProductByIdQuery implements Query<Input, Output> {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(input: Input): Promise<Output> {
    const product = await this.productRepository.findById(
      IdType.create(input.id),
    );

    if (!product) {
      return { status: Status.ERROR, message: 'Product not found' };
    }

    return {
      status: Status.SUCCESS,
      product: ProductMapper.toPrimitives(product),
    };
  }
}
