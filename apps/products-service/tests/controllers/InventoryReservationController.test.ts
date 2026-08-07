import { Hono } from 'hono';
import { ConfirmInventoryReservationUseCase } from '../../src/application/usecases/ConfirmInventoryReservationUseCase';
import { GetInventoryReservationUseCase } from '../../src/application/usecases/GetInventoryReservationUseCase';
import { ReleaseInventoryReservationUseCase } from '../../src/application/usecases/ReleaseInventoryReservationUseCase';
import { ReserveInventoryUseCase } from '../../src/application/usecases/ReserveInventoryUseCase';
import { env } from '../../src/config/env';
import { InventoryReservationController } from '../../src/infrastructure/http/controllers/InventoryReservationController';
import { requireInternalService } from '../../src/infrastructure/http/middlewares/requireInternalServiceMiddleware';
import { makeProduct } from '../factories/ProductFactory';
import { InMemoryInventoryReservationRepository } from '../helpers/InMemoryInventoryReservationRepository';

describe('InventoryReservationController', () => {
  const token = 'products-internal-test-token';
  const variantId = '109f20fc-a266-4fa9-b43a-a9d8dc35ef13';
  let app: Hono;

  beforeEach(() => {
    env.internal.serviceToken = token;
    const repository = new InMemoryInventoryReservationRepository();
    repository.seed(makeProduct({ variantId, stock: 5 }));
    const controller = new InventoryReservationController(
      new ReserveInventoryUseCase(repository),
      new ConfirmInventoryReservationUseCase(repository),
      new ReleaseInventoryReservationUseCase(repository),
      new GetInventoryReservationUseCase(repository),
    );

    app = new Hono();
    app.post('/internal/inventory/reservations', requireInternalService, (c) =>
      controller.reserve(c),
    );
    app.get(
      '/internal/inventory/reservations/:orderId',
      requireInternalService,
      (c) => controller.get(c),
    );
    app.post(
      '/internal/inventory/reservations/:orderId/confirm',
      requireInternalService,
      (c) => controller.confirm(c),
    );
    app.post(
      '/internal/inventory/reservations/:orderId/release',
      requireInternalService,
      (c) => controller.release(c),
    );
  });

  it('rejects requests without the internal service token', async () => {
    const response = await app.request('/internal/inventory/reservations/order-1');

    expect(response.status).toBe(401);
  });

  it('validates reservation input before invoking the use case', async () => {
    const response = await request('/internal/inventory/reservations', {
      method: 'POST',
      body: JSON.stringify({ orderId: '', lines: [] }),
    });

    expect(response.status).toBe(400);
  });

  it('reserves, reads, confirms and releases inventory idempotently', async () => {
    const reserve = await request('/internal/inventory/reservations', {
      method: 'POST',
      body: JSON.stringify({
        orderId: 'order-confirm',
        lines: [{ variantId, quantity: 2, expectedUnitPrice: 100 }],
      }),
    });
    expect(reserve.status).toBe(200);

    const status = await request(
      '/internal/inventory/reservations/order-confirm',
    );
    expect(await status.json()).toMatchObject({
      status: 'SUCCESS',
      reservation: { orderId: 'order-confirm', status: 'ACTIVE' },
    });

    const confirm = await request(
      '/internal/inventory/reservations/order-confirm/confirm',
      { method: 'POST' },
    );
    const repeatedConfirm = await request(
      '/internal/inventory/reservations/order-confirm/confirm',
      { method: 'POST' },
    );
    expect(confirm.status).toBe(200);
    expect(await repeatedConfirm.json()).toMatchObject({
      reservation: { status: 'CONFIRMED' },
    });

    await request('/internal/inventory/reservations', {
      method: 'POST',
      body: JSON.stringify({
        orderId: 'order-release',
        lines: [{ variantId, quantity: 1, expectedUnitPrice: 100 }],
      }),
    });
    const release = await request(
      '/internal/inventory/reservations/order-release/release',
      { method: 'POST' },
    );
    expect(await release.json()).toMatchObject({
      reservation: { status: 'RELEASED' },
    });
  });

  function request(path: string, init: RequestInit = {}) {
    return app.request(path, {
      ...init,
      headers: {
        'content-type': 'application/json',
        'x-internal-service-token': token,
        ...init.headers,
      },
    });
  }
});
