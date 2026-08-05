import { IdType } from '../../domain/shared/IdType';
import { FlashOfferRepository } from '../../domain/repositories/FlashOfferRepository';
import { UseCase, Status } from '../contracts/UseCase';

interface Input {
  id: string;
}

interface SuccessOutput {
  status: Status.SUCCESS;
}

interface ErrorOutput {
  status: Status.ERROR;
  message: string;
}

type Output = SuccessOutput | ErrorOutput;

export class DeleteFlashOfferUseCase implements UseCase<Input, Output> {
  constructor(private readonly flashOfferRepository: FlashOfferRepository) {}

  async execute(input: Input): Promise<Output> {
    const id = IdType.create(input.id);
    const existing = await this.flashOfferRepository.findById(id);
    if (!existing) {
      return { status: Status.ERROR, message: 'Flash offer not found' };
    }

    await this.flashOfferRepository.delete(id);

    return { status: Status.SUCCESS };
  }
}
