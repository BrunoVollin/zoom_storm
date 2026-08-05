import { FlashOffer } from '../../domain/entities/FlashOffer';
import { IdType } from '../../domain/shared/IdType';
import { FlashOfferRepository } from '../../domain/repositories/FlashOfferRepository';
import { UseCase, Status } from '../contracts/UseCase';
import { FlashOfferMapper, FlashOfferPrimitives } from '../mappers/FlashOfferMapper';

interface Input {
  productId: string;
  title: string;
  discountPct: number;
  startsAt: string;
  endsAt: string;
}

interface SuccessOutput {
  status: Status.SUCCESS;
  offer: FlashOfferPrimitives;
}

interface ErrorOutput {
  status: Status.ERROR;
  message: string;
}

type Output = SuccessOutput | ErrorOutput;

export class CreateFlashOfferUseCase implements UseCase<Input, Output> {
  constructor(private readonly flashOfferRepository: FlashOfferRepository) {}

  async execute(input: Input): Promise<Output> {
    const startsAt = new Date(input.startsAt);
    const endsAt = new Date(input.endsAt);

    if (endsAt <= startsAt) {
      return { status: Status.ERROR, message: 'endsAt must be after startsAt' };
    }

    const offer = new FlashOffer(
      IdType.create(),
      IdType.create(input.productId),
      input.title,
      input.discountPct,
      startsAt,
      endsAt,
    );

    await this.flashOfferRepository.save(offer);

    return { status: Status.SUCCESS, offer: FlashOfferMapper.toPrimitives(offer) };
  }
}
