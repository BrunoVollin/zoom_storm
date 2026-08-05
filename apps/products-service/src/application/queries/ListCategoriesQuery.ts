import { ProductQueryRepository } from '../../domain/repositories/ProductQueryRepository';
import { Query, Status } from '../contracts/Query';

type Input = Record<string, never>;

interface SuccessOutput {
  status: Status.SUCCESS;
  categories: string[];
}

interface ErrorOutput {
  status: Status.ERROR;
  message: string;
}

type Output = SuccessOutput | ErrorOutput;

export class ListCategoriesQuery implements Query<Input, Output> {
  constructor(
    private readonly productQueryRepository: ProductQueryRepository,
  ) {}

  async execute(_input: Input): Promise<Output> {
    const categories = await this.productQueryRepository.findDistinctCategories();

    return { status: Status.SUCCESS, categories };
  }
}
