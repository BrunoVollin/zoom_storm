import { ExpireInventoryReservationsUseCase } from '../../application/usecases/ExpireInventoryReservationsUseCase';

export class InventoryReservationExpirationWorker {
  private timer: NodeJS.Timeout | null = null;
  private polling = false;

  constructor(
    private readonly expireReservations: ExpireInventoryReservationsUseCase,
    private readonly pollIntervalMs: number,
  ) {}

  start(): void {
    if (this.timer) return;

    this.timer = setInterval(() => {
      void this.pollOnce();
    }, this.pollIntervalMs);
    this.timer.unref();
  }

  async pollOnce(): Promise<void> {
    if (this.polling) return;
    this.polling = true;

    try {
      const result = await this.expireReservations.execute({ limit: 100 });
      if (result.expired > 0 || result.conflicts > 0) {
        console.log(
          `[InventoryReservationExpirationWorker] expired=${result.expired} conflicts=${result.conflicts}`,
        );
      }
    } catch (error) {
      console.error(
        '[InventoryReservationExpirationWorker] Poll failed:',
        error,
      );
    } finally {
      this.polling = false;
    }
  }

  stop(): void {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
  }
}
