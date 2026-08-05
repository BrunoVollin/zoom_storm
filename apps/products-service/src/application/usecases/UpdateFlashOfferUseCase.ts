import { FlashOffer } from '../../domain/entities/FlashOffer';
import { IdType } from '../../domain/shared/IdType';
import { FlashOfferRepository } from '../../domain/repositories/FlashOfferRepository';
import { UseCase, Status } from '../contracts/UseCase';
import { FlashOfferMapper, FlashOfferPrimitives } from '../mappers/FlashOfferMapper';

interface Input {
  id: string;
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

export class UpdateFlashOfferUseCase implements UseCase<Input, Output> {
  constructor(private readonly flashOfferRepository: FlashOfferRepository) {}

  async execute(input: Input): Promise<Output> {
    const existing = await this.flashOfferRepository.findById(IdType.create(input.id));
    if (!existing) {
      return { status: Status.ERROR, message: 'Flash offer not found' };
    }

    const startsAt = new Date(input.startsAt);
    const endsAt = new Date(input.endsAt);

    if (endsAt <= startsAt) {
      return { status: Status.ERROR, message: 'endsAt must be after startsAt' };
    }

    const updated = new FlashOffer(
      existing.getId(),
      existing.productId,
      input.title,
      input.discountPct,
      startsAt,
      endsAt,
      existing.createdAt,
    );

    await this.flashOfferRepository.save(updated);

    return { status: Status.SUCCESS, offer: FlashOfferMapper.toPrimitives(updated) };
  }
}
