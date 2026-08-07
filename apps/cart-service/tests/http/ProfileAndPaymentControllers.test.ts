import { Hono } from 'hono';
import { ListSavedAddressesQuery } from '../../src/application/Queries/ListSavedAddressesQuery';
import { ListSavedCardsQuery } from '../../src/application/Queries/ListSavedCardsQuery';
import { Status } from '../../src/application/contracts/UseCase';
import { AddSavedAddressUseCase } from '../../src/application/usecases/AddSavedAddressUseCase';
import { AddSavedCardUseCase } from '../../src/application/usecases/AddSavedCardUseCase';
import { DeleteSavedAddressUseCase } from '../../src/application/usecases/DeleteSavedAddressUseCase';
import { DeleteSavedCardUseCase } from '../../src/application/usecases/DeleteSavedCardUseCase';
import { PayOrderUseCase } from '../../src/application/usecases/PayOrderUseCase';
import { SetDefaultSavedAddressUseCase } from '../../src/application/usecases/SetDefaultSavedAddressUseCase';
import { SetDefaultSavedCardUseCase } from '../../src/application/usecases/SetDefaultSavedCardUseCase';
import { UpdateOrderStatusUseCase } from '../../src/application/usecases/UpdateOrderStatusUseCase';
import { UpdateSavedAddressUseCase } from '../../src/application/usecases/UpdateSavedAddressUseCase';
import { UpdateSavedCardUseCase } from '../../src/application/usecases/UpdateSavedCardUseCase';
import { ListOrdersQuery } from '../../src/application/Queries/ListOrdersQuery';
import { OrderQuery } from '../../src/application/Queries/OrderQuery';
import { PaymentMethodType } from '../../src/domain/entities/payment/PaymentMethod';
import { OrderController } from '../../src/infrastructure/http/controllers/OrderController';
import { SavedAddressController } from '../../src/infrastructure/http/controllers/SavedAddressController';
import { SavedCardController } from '../../src/infrastructure/http/controllers/SavedCardController';
import { InMemorySavedAddressRepository } from '../helpers/InMemorySavedAddressRepository';
import { InMemorySavedCardRepository } from '../helpers/InMemorySavedCardRepository';

describe('profile and payment HTTP controllers', () => {
  it('manages multiple addresses and switches the default address', async () => {
    const repository = new InMemorySavedAddressRepository();
    const controller = new SavedAddressController(
      new ListSavedAddressesQuery(repository),
      new AddSavedAddressUseCase(repository),
      new UpdateSavedAddressUseCase(repository),
      new DeleteSavedAddressUseCase(repository),
      new SetDefaultSavedAddressUseCase(repository),
    );
    const app = authenticatedApp();
    app.get('/addresses', (c) => controller.list(c));
    app.post('/addresses', (c) => controller.add(c));
    app.put('/addresses/:addressId/default', (c) => controller.setDefault(c));

    const first = await request(app, '/addresses', 'POST', addressBody('Home'));
    const second = await request(app, '/addresses', 'POST', addressBody('Work'));
    const secondBody = await second.json() as { address: { id: string } };
    const changed = await app.request(`/addresses/${secondBody.address.id}/default`, {
      method: 'PUT',
    });
    const listed = await app.request('/addresses');
    const listedBody = await listed.json() as {
      addresses: Array<{ label: string; isDefault: boolean }>;
    };

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(changed.status).toBe(200);
    expect(listedBody.addresses).toHaveLength(2);
    expect(listedBody.addresses.filter((address) => address.isDefault)).toEqual([
      expect.objectContaining({ label: 'Work' }),
    ]);
  });

  it('manages multiple safe card snapshots and switches the default card', async () => {
    const repository = new InMemorySavedCardRepository();
    const controller = new SavedCardController(
      new ListSavedCardsQuery(repository),
      new AddSavedCardUseCase(repository),
      new UpdateSavedCardUseCase(repository),
      new DeleteSavedCardUseCase(repository),
      new SetDefaultSavedCardUseCase(repository),
    );
    const app = authenticatedApp();
    app.get('/cards', (c) => controller.list(c));
    app.post('/cards', (c) => controller.add(c));
    app.put('/cards/:cardId/default', (c) => controller.setDefault(c));

    await request(app, '/cards', 'POST', cardBody('Visa', '4242'));
    const second = await request(
      app,
      '/cards',
      'POST',
      cardBody('Mastercard', '5555'),
    );
    const secondBody = await second.json() as { card: { id: string } };
    await app.request(`/cards/${secondBody.card.id}/default`, { method: 'PUT' });
    const listed = await app.request('/cards');
    const listedBody = await listed.json() as {
      cards: Array<Record<string, unknown>>;
    };

    expect(listedBody.cards).toHaveLength(2);
    expect(listedBody.cards.filter((card) => card.isDefault)).toEqual([
      expect.objectContaining({ brand: 'Mastercard', lastFour: '5555' }),
    ]);
    expect(JSON.stringify(listedBody)).not.toMatch(/pan|cvc|cvv/i);
  });

  it('requires Idempotency-Key and rejects PAN/CVC fields', async () => {
    const execute = jest.fn().mockResolvedValue({ status: Status.SUCCESS });
    const app = paymentApp(execute);
    const validBody = {
      installments: 1,
      paymentMethod: {
        type: PaymentMethodType.SAVED_CARD,
        savedCardId: 'card-1',
      },
    };

    const withoutHeader = await request(app, '/orders/order-1/pay', 'POST', validBody);
    const withCvc = await request(
      app,
      '/orders/order-1/pay',
      'POST',
      {
        ...validBody,
        paymentMethod: { ...validBody.paymentMethod, cvc: '123' },
      },
      { 'Idempotency-Key': 'pay-1' },
    );

    expect(withoutHeader.status).toBe(400);
    expect(withCvc.status).toBe(400);
    expect(execute).not.toHaveBeenCalled();
  });

  it('passes the discriminated payment method and maps idempotency conflicts to 409', async () => {
    const execute = jest.fn().mockResolvedValue({
      status: Status.ERROR,
      code: 'IDEMPOTENCY_CONFLICT',
      message: 'conflict',
    });
    const app = paymentApp(execute);
    const response = await request(
      app,
      '/orders/order-1/pay',
      'POST',
      {
        installments: 3,
        paymentMethod: {
          type: PaymentMethodType.NEW_CARD,
          token: 'simulated-token',
          brand: 'Visa',
          lastFour: '4242',
          holderName: 'Test User',
          expiry: '12/99',
          saveCard: true,
        },
      },
      { 'Idempotency-Key': 'pay-1' },
    );

    expect(response.status).toBe(409);
    expect(execute).toHaveBeenCalledWith({
      orderId: 'order-1',
      userId: 'user-1',
      idempotencyKey: 'pay-1',
      installments: 3,
      paymentMethod: expect.objectContaining({
        type: PaymentMethodType.NEW_CARD,
        lastFour: '4242',
      }),
    });
  });
});

function authenticatedApp(): Hono {
  const app = new Hono();
  app.use('*', async (c, next) => {
    c.set('userId', 'user-1');
    await next();
  });
  return app;
}

function paymentApp(execute: jest.Mock): Hono {
  const controller = new OrderController(
    { execute: jest.fn() } as unknown as ListOrdersQuery,
    { execute: jest.fn() } as unknown as OrderQuery,
    { execute: jest.fn() } as unknown as UpdateOrderStatusUseCase,
    { execute } as unknown as PayOrderUseCase,
  );
  const app = authenticatedApp();
  app.post('/orders/:orderId/pay', (c) => controller.pay(c));
  return app;
}

function request(
  app: Hono,
  path: string,
  method: string,
  body: unknown,
  headers: Record<string, string> = {},
) {
  return app.request(path, {
    method,
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

function addressBody(label: string) {
  return {
    label,
    recipient: 'Test User',
    street: 'Main Street',
    number: '10',
    neighborhood: 'Center',
    city: 'Sao Paulo',
    state: 'SP',
    zip: '01001000',
  };
}

function cardBody(brand: string, lastFour: string) {
  return {
    brand,
    lastFour,
    holderName: 'Test User',
    expiry: '12/99',
  };
}
