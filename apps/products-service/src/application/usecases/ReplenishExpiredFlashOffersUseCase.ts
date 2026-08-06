import { FlashOffer } from '../../domain/entities/FlashOffer';
import { IdType } from '../../domain/shared/IdType';
import { FlashOfferRepository } from '../../domain/repositories/FlashOfferRepository';
import { UseCase, Status } from '../contracts/UseCase';

const FLASH_OFFER_DURATION_MS = 60 * 60 * 1000;
const DEFAULT_DISCOUNT_PCT = 15;

interface Input {
  now?: Date;
}

interface SuccessOutput {
  status: Status.SUCCESS;
  replenishedCount: number;
}

interface ErrorOutput {
  status: Status.ERROR;
  message: string;
}

type Output = SuccessOutput | ErrorOutput;

export class ReplenishExpiredFlashOffersUseCase implements UseCase<Input, Output> {
  constructor(private readonly flashOfferRepository: FlashOfferRepository) {}

  async execute(input: Input = {}): Promise<Output> {
    try {
      const now = input.now ?? new Date();
      const expiredOffers = await this.flashOfferRepository.findExpired(now);

      for (const expiredOffer of expiredOffers) {
        const replacement = new FlashOffer(
          IdType.create(),
          expiredOffer.productId,
          expiredOffer.title,
          expiredOffer.discountPct ?? DEFAULT_DISCOUNT_PCT,
          now,
          new Date(now.getTime() + FLASH_OFFER_DURATION_MS),
        );

        await this.flashOfferRepository.save(replacement);
        await this.flashOfferRepository.delete(expiredOffer.getId());
      }

      return { status: Status.SUCCESS, replenishedCount: expiredOffers.length };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error';
      return { status: Status.ERROR, message };
    }
  }
}
