import type { Context } from 'hono';
import { Status } from '../../../application/contracts/UseCase';
import { ConfirmInventoryReservationUseCase } from '../../../application/usecases/ConfirmInventoryReservationUseCase';
import { GetInventoryReservationUseCase } from '../../../application/usecases/GetInventoryReservationUseCase';
import { ReleaseInventoryReservationUseCase } from '../../../application/usecases/ReleaseInventoryReservationUseCase';
import { ReserveInventoryUseCase } from '../../../application/usecases/ReserveInventoryUseCase';
import { InventoryErrorCode } from '../../../domain/errors/InventoryError';
import {
  inventoryValidationError,
  ReserveInventorySchema,
  validateInventoryInput,
} from '../schemas/inventory.schemas';

export class InventoryReservationController {
  constructor(
    private readonly reserveInventory: ReserveInventoryUseCase,
    private readonly confirmInventory: ConfirmInventoryReservationUseCase,
    private readonly releaseInventory: ReleaseInventoryReservationUseCase,
    private readonly getInventoryReservation: GetInventoryReservationUseCase,
  ) {}

  async reserve(c: Context) {
    const parsed = validateInventoryInput(
      ReserveInventorySchema,
      await c.req.json().catch(() => undefined),
    );
    if ('error' in parsed) return inventoryValidationError(c, parsed.error);

    const result = await this.reserveInventory.execute(parsed.data);
    return c.json(result, this.statusCode(result));
  }

  async confirm(c: Context) {
    const result = await this.confirmInventory.execute({
      orderId: c.req.param('orderId') ?? '',
    });
    return c.json(result, this.statusCode(result));
  }

  async release(c: Context) {
    const result = await this.releaseInventory.execute({
      orderId: c.req.param('orderId') ?? '',
    });
    return c.json(result, this.statusCode(result));
  }

  async get(c: Context) {
    const result = await this.getInventoryReservation.execute({
      orderId: c.req.param('orderId') ?? '',
    });
    return c.json(result, this.statusCode(result));
  }

  private statusCode(result: {
    status: Status;
    code?: InventoryErrorCode;
  }): 200 | 404 | 409 | 410 | 422 {
    if (result.status === Status.SUCCESS) return 200;

    switch (result.code) {
      case InventoryErrorCode.RESERVATION_NOT_FOUND:
      case InventoryErrorCode.PRODUCT_UNAVAILABLE:
        return 404;
      case InventoryErrorCode.RESERVATION_EXPIRED:
        return 410;
      case InventoryErrorCode.INSUFFICIENT_STOCK:
      case InventoryErrorCode.CATALOG_CHANGED:
      case InventoryErrorCode.IDEMPOTENCY_CONFLICT:
      case InventoryErrorCode.INVENTORY_CONFLICT:
      case InventoryErrorCode.RESERVATION_NOT_ACTIVE:
      case InventoryErrorCode.PRODUCT_HAS_ACTIVE_RESERVATIONS:
        return 409;
      default:
        return 422;
    }
  }
}
