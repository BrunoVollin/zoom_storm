import {
  ProductListFilters,
  ProductQueryRepository,
} from '../../domain/repositories/ProductQueryRepository';
import { Query, Status } from '../contracts/Query';

type Input = ProductListFilters;

interface SuccessOutput {
  status: Status.SUCCESS;
  products: object[];
}

interface ErrorOutput {
  status: Status.ERROR;
  message: string;
}

type Output = SuccessOutput | ErrorOutput;

export class ListProductsQuery implements Query<Input, Output> {
  constructor(
    private readonly productQueryRepository: ProductQueryRepository,
  ) {}

  async execute(input: Input): Promise<Output> {
    const products = await this.productQueryRepository.findAll(input);

    return { status: Status.SUCCESS, products };
  }
}
