import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { readFileSync } from 'fs';
import { join } from 'path';
import { CartQuery } from '@application/Queries/CartQuery';
import { CreateCartUseCase } from '@application/usecases/CreateCartUseCase';
import { AddItemToCartUseCase } from '@application/usecases/AddItemToCartUseCase';
import { RemoveItemFromCartUseCase } from '@application/usecases/RemoveItemFromCartUseCase';
import { UpdateItemQuantityUseCase } from '@application/usecases/UpdateItemQuantityUseCase';
import { ApplyCouponUseCase } from '@application/usecases/ApplyCouponUseCase';
import { RemoveCouponUseCase } from '@application/usecases/RemoveCouponUseCase';
import { CalculateShippingUseCase } from '@application/usecases/CalculateShippingUseCase';
import { CheckoutUseCase } from '@application/usecases/CheckoutUseCase';
import { CartController } from './controllers/CartController';
import { CartItemController } from './controllers/CartItemController';
import { CartCouponController } from './controllers/CartCouponController';
import { CartShippingController } from './controllers/CartShippingController';
import { CartCheckoutController } from './controllers/CartCheckoutController';

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

const openapiSpec = readFileSync(
  join(__dirname, '../../../openapi.yml'),
  'utf-8',
);

export function buildRouter(deps: Dependencies): Hono {
  const app = new Hono();

  app.use('*', cors());

  const cart = new CartController(deps.getCart, deps.createCart);
  const cartItem = new CartItemController(
    deps.addItemToCart,
    deps.removeItemFromCart,
    deps.updateItemQuantity,
  );
  const cartCoupon = new CartCouponController(
    deps.applyCoupon,
    deps.removeCoupon,
  );
  const cartShipping = new CartShippingController(deps.calculateShipping);
  const cartCheckout = new CartCheckoutController(deps.checkout);

  app.get('/openapi.yml', (c) =>
    c.text(openapiSpec, 200, { 'Content-Type': 'application/yaml' }),
  );

  app.get('/docs', (c) =>
    c.html(`<!DOCTYPE html>
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
</html>`),
  );

  app.get('/carts/:cartId', (c) => cart.getById(c));
  app.post('/carts', (c) => cart.create(c));

  app.post('/carts/:cartId/items', (c) => cartItem.add(c));
  app.delete('/carts/:cartId/items/:itemId', (c) => cartItem.remove(c));
  app.patch('/carts/:cartId/items/:itemId', (c) => cartItem.updateQuantity(c));

  app.post('/carts/:cartId/coupons', (c) => cartCoupon.apply(c));
  app.delete('/carts/:cartId/coupons/:couponId', (c) => cartCoupon.remove(c));

  app.get('/carts/:cartId/shipping', (c) => cartShipping.calculate(c));

  app.post('/carts/:cartId/checkout', (c) => cartCheckout.handle(c));

  return app;
}
