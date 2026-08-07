import { ExpireOrderUseCase } from '../../application/usecases/ExpireOrderUseCase';
import { ExpireLoyaltyReservationsUseCase } from '../../application/usecases/ExpireLoyaltyReservationsUseCase';
import { Status } from '../../application/contracts/UseCase';
import { OrderRepository } from '../../domain/repositories/OrderRepository';

export class OrderExpirationWorker {
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly expireOrder: ExpireOrderUseCase,
    private readonly pollIntervalMs: number,
    private readonly expireLoyaltyReservations?: ExpireLoyaltyReservationsUseCase,
  ) {}

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => void this.tick(), this.pollIntervalMs);
    this.timer.unref();
    void this.tick();
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  async tick(referenceDate: Date = new Date()): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const orders =
        await this.orderRepository.findAwaitingPaymentExpiredAtOrBefore(
          referenceDate,
        );
      for (const order of orders) {
        const result = await this.expireOrder.execute({
          orderId: order.id.toString(),
          referenceDate,
        });
        if (result.status === Status.ERROR) {
          console.error(
            `[OrderExpirationWorker] order=${order.id.toString()} error=${result.message}`,
          );
        }
      }

      if (this.expireLoyaltyReservations) {
        const loyaltyResult = await this.expireLoyaltyReservations.execute({
          referenceDate,
        });
        if (loyaltyResult.status === Status.ERROR) {
          console.error(
            `[OrderExpirationWorker] loyalty reservation expiration error=${loyaltyResult.message}`,
          );
        }
      }
    } catch (error) {
      console.error('[OrderExpirationWorker] Poll failed:', error);
    } finally {
      this.running = false;
    }
  }
}
