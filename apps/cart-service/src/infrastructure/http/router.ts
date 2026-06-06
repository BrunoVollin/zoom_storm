import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { readFileSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';
import { CreateCartUseCase } from '@application/usecases/CreateCartUseCase';
import { AddItemToCartUseCase } from '@application/usecases/AddItemToCartUseCase';
import { RemoveItemFromCartUseCase } from '@application/usecases/RemoveItemFromCartUseCase';
import { UpdateItemQuantityUseCase } from '@application/usecases/UpdateItemQuantityUseCase';
import { ApplyCouponUseCase } from '@application/usecases/ApplyCouponUseCase';
import { RemoveCouponUseCase } from '@application/usecases/RemoveCouponUseCase';
import { CalculateShippingUseCase } from '@application/usecases/CalculateShippingUseCase';
import { CheckoutUseCase } from '@application/usecases/CheckoutUseCase';
import { CartQuery } from '@application/Queries/CartQuery';
import { Status } from '@application/contracts/UseCase';

const ProductInputSchema = z.object({
  id: z.string().min(1),
  quantity: z.int().min(1),
});

const CreateCartSchema = z.object({
  userId: z.string().min(1),
  products: z.array(ProductInputSchema).optional().default([]),
  coupons: z.array(z.string().min(1)).optional().default([]),
});

const AddItemsSchema = z.object({
  products: z.array(ProductInputSchema).min(1),
});

const UpdateQuantitySchema = z.object({
  quantity: z.int().min(1),
});

const ApplyCouponSchema = z.object({
  couponId: z.string().min(1),
});

const CheckoutSchema = z.object({
  shipping: z.int().min(0),
});

function validate<T>(schema: z.ZodType<T>, data: unknown): { data: T } | { error: string } {
  const result = schema.safeParse(data);

  if (!result.success) {
    const message = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');

    return { error: message };
  }

  return { data: result.data };
}

interface Dependencies {
  getCart: CartQuery;
  createCart: CreateCartUseCase;
  addItemToCart: AddItemToCartUseCase;
  removeItemFromCart: RemoveItemFromCartUseCase;
  updateItemQuantity: UpdateItemQuantityUseCase;
  applyCoupon: ApplyCouponUseCase;
  removeCoupon: RemoveCouponUseCase;
  calculateShipping: CalculateShippingUseCase;
  checkout: CheckoutUseCase;
}

const openapiSpec = readFileSync(join(__dirname, '../../../openapi.yml'), 'utf-8');

export function buildRouter(deps: Dependencies): Hono {
  const app = new Hono();

  app.use('*', cors());

  app.get('/openapi.yml', (c) => {
    return c.text(openapiSpec, 200, { 'Content-Type': 'application/yaml' });
  });

  app.get('/docs', (c) => {
    return c.html(`<!DOCTYPE html>
<html>
  <head>
    <title>Cart Service API</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
    <script>
      SwaggerUIBundle({ url: '/openapi.yml', dom_id: '#swagger-ui' });
    </script>
  </body>
</html>`);
  });

  app.get('/carts/:cartId', async (c) => {
    const result = await deps.getCart.execute({ cartId: c.req.param('cartId') });
    const status = result.status === Status.SUCCESS ? 200 : 404;

    return c.json(result, status);
  });

  app.post('/carts', async (c) => {
    const parsed = validate(CreateCartSchema, await c.req.json());

    if ('error' in parsed) {
      return c.json({ status: Status.ERROR, message: parsed.error }, 400);
    }

    const result = await deps.createCart.execute(parsed.data);
    const status = result.status === Status.SUCCESS ? 201 : 422;

    return c.json(result, status);
  });

  app.post('/carts/:cartId/items', async (c) => {
    const parsed = validate(AddItemsSchema, await c.req.json());

    if ('error' in parsed) {
      return c.json({ status: Status.ERROR, message: parsed.error }, 400);
    }

    const result = await deps.addItemToCart.execute({
      cartId: c.req.param('cartId'),
      products: parsed.data.products,
    });

    const status = result.status === Status.SUCCESS ? 200 : 422;

    return c.json(result, status);
  });

  app.delete('/carts/:cartId/items/:itemId', async (c) => {
    const result = await deps.removeItemFromCart.execute({
      cartId: c.req.param('cartId'),
      itemId: c.req.param('itemId'),
    });

    const status = result.status === Status.SUCCESS ? 200 : 422;

    return c.json(result, status);
  });

  app.patch('/carts/:cartId/items/:itemId', async (c) => {
    const parsed = validate(UpdateQuantitySchema, await c.req.json());

    if ('error' in parsed) {
      return c.json({ status: Status.ERROR, message: parsed.error }, 400);
    }

    const result = await deps.updateItemQuantity.execute({
      cartId: c.req.param('cartId'),
      itemId: c.req.param('itemId'),
      quantity: parsed.data.quantity,
    });

    const status = result.status === Status.SUCCESS ? 200 : 422;

    return c.json(result, status);
  });

  app.post('/carts/:cartId/coupons', async (c) => {
    const parsed = validate(ApplyCouponSchema, await c.req.json());

    if ('error' in parsed) {
      return c.json({ status: Status.ERROR, message: parsed.error }, 400);
    }

    const result = await deps.applyCoupon.execute({
      cartId: c.req.param('cartId'),
      couponId: parsed.data.couponId,
    });

    const status = result.status === Status.SUCCESS ? 200 : 422;

    return c.json(result, status);
  });

  app.delete('/carts/:cartId/coupons/:couponId', async (c) => {
    const result = await deps.removeCoupon.execute({
      cartId: c.req.param('cartId'),
      couponId: c.req.param('couponId'),
    });

    const status = result.status === Status.SUCCESS ? 200 : 422;

    return c.json(result, status);
  });

  app.get('/carts/:cartId/shipping', async (c) => {
    const distance = Number(c.req.query('distance'));

    if (isNaN(distance) || distance <= 0) {
      return c.json({ status: Status.ERROR, message: 'Invalid distance query param' }, 400);
    }

    const result = await deps.calculateShipping.execute({
      cartId: c.req.param('cartId'),
      distance,
    });

    const status = result.status === Status.SUCCESS ? 200 : 422;

    return c.json(result, status);
  });

  app.post('/carts/:cartId/checkout', async (c) => {
    const parsed = validate(CheckoutSchema, await c.req.json());

    if ('error' in parsed) {
      return c.json({ status: Status.ERROR, message: parsed.error }, 400);
    }

    const result = await deps.checkout.execute({
      cartId: c.req.param('cartId'),
      shipping: parsed.data.shipping,
    });

    const status = result.status === Status.SUCCESS ? 200 : 422;

    return c.json(result, status);
  });

  return app;
}
