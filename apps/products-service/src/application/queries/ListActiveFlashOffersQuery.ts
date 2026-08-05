import { FlashOfferRepository } from '../../domain/repositories/FlashOfferRepository';
import { Query, Status } from '../contracts/Query';
import { FlashOfferMapper, FlashOfferPrimitives } from '../mappers/FlashOfferMapper';

type Input = Record<string, never>;

interface SuccessOutput {
  status: Status.SUCCESS;
  offers: FlashOfferPrimitives[];
}

interface ErrorOutput {
  status: Status.ERROR;
  message: string;
}

type Output = SuccessOutput | ErrorOutput;

export class ListActiveFlashOffersQuery implements Query<Input, Output> {
  constructor(private readonly flashOfferRepository: FlashOfferRepository) {}

  async execute(_input: Input): Promise<Output> {
    const offers = await this.flashOfferRepository.findActive();

    return { status: Status.SUCCESS, offers: offers.map(FlashOfferMapper.toPrimitives) };
  }
}
