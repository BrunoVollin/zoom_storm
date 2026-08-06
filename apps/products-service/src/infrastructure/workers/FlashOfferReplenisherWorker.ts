import { ReplenishExpiredFlashOffersUseCase } from '../../application/usecases/ReplenishExpiredFlashOffersUseCase';
import { Status } from '../../application/contracts/UseCase';

const DEFAULT_POLL_INTERVAL_MS = 60_000;

/**
 * Periodically replenishes expired flash offers: there's no real event
 * driving this, so this worker polls for flash offers whose `endsAt` has
 * passed and creates a fresh replacement for the same product, one hour
 * long, reusing ReplenishExpiredFlashOffersUseCase for the actual logic.
 */
export class FlashOfferReplenisherWorker {
  private timer: NodeJS.Timeout | null = null;
  private polling = false;

  constructor(
    private readonly replenishExpiredFlashOffersUseCase: ReplenishExpiredFlashOffersUseCase,
    private readonly pollIntervalMs: number = DEFAULT_POLL_INTERVAL_MS,
  ) {}

  start(): void {
    if (this.timer) return;

    this.timer = setInterval(() => {
      void this.pollOnce();
    }, this.pollIntervalMs);
  }

  async pollOnce(): Promise<void> {
    if (this.polling) return;
    this.polling = true;

    try {
      const result = await this.replenishExpiredFlashOffersUseCase.execute();

      if (result.status === Status.ERROR) {
        console.error(
          `[FlashOfferReplenisherWorker] Poll failed: ${result.message}`,
        );
        return;
      }

      if (result.replenishedCount > 0) {
        console.log(
          `[FlashOfferReplenisherWorker] Replenished ${result.replenishedCount} expired flash offer(s).`,
        );
      }
    } catch (error) {
      console.error('[FlashOfferReplenisherWorker] Poll failed:', error);
    } finally {
      this.polling = false;
    }
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
