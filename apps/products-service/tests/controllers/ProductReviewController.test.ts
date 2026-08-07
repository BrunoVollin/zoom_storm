import { Hono } from 'hono';
import { Status } from '../../src/application/contracts/UseCase';
import { CreateReviewUseCase } from '../../src/application/usecases/CreateReviewUseCase';
import { ProductController } from '../../src/infrastructure/http/controllers/ProductController';

describe('ProductController.createReview', () => {
  const execute = jest.fn();
  let app: Hono<{
    Variables: { userId: string; userName: string; userEmail: string };
  }>;

  beforeEach(() => {
    jest.clearAllMocks();
    execute.mockResolvedValue({ status: Status.SUCCESS, product: {} });
    const controller = new ProductController(
      null as never,
      null as never,
      null as never,
      null as never,
      null as never,
      null as never,
      null as never,
      null as never,
      null as never,
      { execute } as unknown as CreateReviewUseCase,
    );
    app = new Hono<{
      Variables: { userId: string; userName: string; userEmail: string };
    }>();
    app.use('/products/:id/reviews', async (c, next) => {
      c.set('userId', 'token-user');
      c.set('userName', 'Token Name');
      c.set('userEmail', 'token@example.com');
      await next();
    });
    app.post('/products/:id/reviews', (c) => controller.createReview(c));
  });

  it('builds the review identity exclusively from authenticated claims', async () => {
    const response = await app.request('/products/product-1/reviews', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        orderId: 'order-1',
        rating: 5,
        comment: 'Excellent game',
      }),
    });

    expect(response.status).toBe(201);
    expect(execute).toHaveBeenCalledWith({
      productId: 'product-1',
      orderId: 'order-1',
      rating: 5,
      comment: 'Excellent game',
      userId: 'token-user',
      reviewerName: 'Token Name',
      reviewerEmail: 'token@example.com',
    });
  });

  it('rejects attempts to forge reviewer identity in the request body', async () => {
    const response = await app.request('/products/product-1/reviews', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        orderId: 'order-1',
        rating: 5,
        comment: 'Excellent game',
        reviewerName: 'Forged Name',
        reviewerEmail: 'forged@example.com',
      }),
    });

    expect(response.status).toBe(400);
    expect(execute).not.toHaveBeenCalled();
  });
});
