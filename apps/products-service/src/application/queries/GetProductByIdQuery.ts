import {
  ProductDTO,
  ProductQueryRepository,
} from '../../domain/repositories/ProductQueryRepository';
import { Query, Status } from '../contracts/Query';

interface Input {
  id: string;
}

interface SuccessOutput {
  status: Status.SUCCESS;
  product: ProductDTO;
}

interface ErrorOutput {
  status: Status.ERROR;
  message: string;
}

type Output = SuccessOutput | ErrorOutput;

export class GetProductByIdQuery implements Query<Input, Output> {
  constructor(
    private readonly productQueryRepository: ProductQueryRepository,
  ) {}

  async execute(input: Input): Promise<Output> {
    const product = await this.productQueryRepository.findById(input.id);

    if (!product) {
      return { status: Status.ERROR, message: 'Product not found' };
    }

    return {
      status: Status.SUCCESS,
      product,
    };
  }
}
