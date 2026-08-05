import {
  startTestEnvironment,
  TestEnvironment,
} from './helpers/testEnvironment';
import { createProduct } from './helpers/productFactory';
import { createCart } from './helpers/cartFactory';

async function getCart(gatewayUrl: string, cartId: string) {
  const response = await fetch(`${gatewayUrl}/cart/carts/${cartId}`);
  const body = await response.json();

  return { response, body };
}

async function addItem(
  gatewayUrl: string,
  cartId: string,
  products: Array<{ id: string; quantity: number }>,
) {
  const response = await fetch(`${gatewayUrl}/cart/carts/${cartId}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ products }),
  });
  const body = await response.json();

  return { response, body };
}

async function updateItemQuantity(
  gatewayUrl: string,
  cartId: string,
  itemId: string,
  quantity: number,
) {
  const response = await fetch(
    `${gatewayUrl}/cart/carts/${cartId}/items/${itemId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity }),
    },
  );
  const body = await response.json();

  return { response, body };
}

async function removeItem(gatewayUrl: string, cartId: string, itemId: string) {
  const response = await fetch(
    `${gatewayUrl}/cart/carts/${cartId}/items/${itemId}`,
    {
      method: 'DELETE',
    },
  );
  const body = await response.json();

  return { response, body };
}

async function checkout(gatewayUrl: string, cartId: string, shipping: number) {
  const response = await fetch(`${gatewayUrl}/cart/carts/${cartId}/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ shipping }),
  });
  const body = await response.json();

  return { response, body };
}

describe('API Gateway → Cart flow', () => {
  let env: TestEnvironment;
  let productA: { id: string; price: number };
  let productB: { id: string; price: number };

  beforeAll(async () => {
    env = await startTestEnvironment();
  }, 30000);

  afterAll(async () => {
    await env.stop();
  });

  beforeEach(async () => {
    // Cart items now reference a product *variant* id (price/stock moved off
    // Product onto ProductVariant) — the default variant is what the
    // cart-service read model resolves items by.
    const { body: created } = await createProduct(env.gatewayUrl, {
      name: 'Product A',
      price: 1000,
    });
    productA = {
      id: created.product.variants[0].id,
      price: created.product.variants[0].price,
    };

    const { body: createdB } = await createProduct(env.gatewayUrl, {
      name: 'Product B',
      price: 2000,
    });
    productB = {
      id: createdB.product.variants[0].id,
      price: createdB.product.variants[0].price,
    };
  });

  afterEach(() => {
    env.productStore.clear();
  });

  describe('POST /cart/carts', () => {
    it('Given valid products, when creating a cart, then returns 201 with the cart and its items', async () => {
      const { response, body } = await createCart(env.gatewayUrl, {
        products: [{ id: productA.id, quantity: 2 }],
      });

      expect(response.status).toBe(201);
      expect(body.status).toBe('SUCCESS');
      expect(body.cart).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          userId: 'local-dev-user',
          items: [
            expect.objectContaining({
              quantity: 2,
              variant: expect.objectContaining({ id: productA.id }),
              subtotal: 2000,
            }),
          ],
        }),
      );
    });

    it('Given no products, when creating a cart, then returns 201 with an empty cart', async () => {
      const { response, body } = await createCart(env.gatewayUrl);

      expect(response.status).toBe(201);
      expect(body.cart).toEqual(
        expect.objectContaining({ items: [], subtotal: 0, total: 0 }),
      );
    });

    it('Given a non-existent product id, when creating a cart, then returns 422 with an error message', async () => {
      const { response, body } = await createCart(env.gatewayUrl, {
        products: [{ id: 'does-not-exist', quantity: 1 }],
      });

      expect(response.status).toBe(422);
      expect(body).toEqual({ status: 'ERROR', message: 'Product not found' });
    });
  });

  describe('GET /cart/carts/:cartId', () => {
    it('Given an existing cart, when fetching it, then returns 200 with the cart data', async () => {
      const { body: created } = await createCart(env.gatewayUrl, {
        products: [{ id: productA.id, quantity: 1 }],
      });

      const { response, body } = await getCart(env.gatewayUrl, created.cart.id);

      expect(response.status).toBe(200);
      expect(body).toEqual({ status: 'SUCCESS', cart: created.cart });
    });

    it('Given a non-existent cart id, when fetching it, then returns 404 with an error message', async () => {
      const { response, body } = await getCart(
        env.gatewayUrl,
        'does-not-exist',
      );

      expect(response.status).toBe(404);
      expect(body).toEqual({ status: 'ERROR', message: 'Cart not found' });
    });
  });

  describe('Subtotal and total calculations', () => {
    it('Given multiple items, when creating a cart, then subtotal and total reflect price × quantity for every item', async () => {
      const { body } = await createCart(env.gatewayUrl, {
        products: [
          { id: productA.id, quantity: 2 },
          { id: productB.id, quantity: 1 },
        ],
      });

      expect(body.cart.subtotal).toBe(productA.price * 2 + productB.price * 1);
      expect(body.cart.totalDiscount).toBe(0);
      expect(body.cart.total).toBe(body.cart.subtotal);
    });
  });

  describe('POST /cart/carts/:cartId/items', () => {
    it('Given an existing cart, when adding a product, then it appears in the items list and totals are recalculated', async () => {
      const { body: created } = await createCart(env.gatewayUrl);

      const { response, body } = await addItem(
        env.gatewayUrl,
        created.cart.id,
        [{ id: productA.id, quantity: 3 }],
      );

      expect(response.status).toBe(200);
      expect(body.cart.items).toEqual([
        expect.objectContaining({
          quantity: 3,
          variant: expect.objectContaining({ id: productA.id }),
          subtotal: productA.price * 3,
        }),
      ]);
      expect(body.cart.subtotal).toBe(productA.price * 3);
      expect(body.cart.total).toBe(productA.price * 3);
    });

    it('Given the same product is added twice, when adding it again, then quantities accumulate on a single item instead of duplicating it', async () => {
      const { body: created } = await createCart(env.gatewayUrl);

      await addItem(env.gatewayUrl, created.cart.id, [
        { id: productA.id, quantity: 2 },
      ]);
      const { response, body } = await addItem(
        env.gatewayUrl,
        created.cart.id,
        [{ id: productA.id, quantity: 3 }],
      );

      expect(response.status).toBe(200);
      expect(body.cart.items).toHaveLength(1);
      expect(body.cart.items[0]).toEqual(
        expect.objectContaining({ quantity: 5, subtotal: productA.price * 5 }),
      );
    });

    it('Given a non-existent cart id, when adding a product, then returns 422 with an error message', async () => {
      const { response, body } = await addItem(
        env.gatewayUrl,
        'does-not-exist',
        [{ id: productA.id, quantity: 1 }],
      );

      expect(response.status).toBe(422);
      expect(body).toEqual({ status: 'ERROR', message: 'Cart not found' });
    });

    it('Given a non-existent product id, when adding it to an existing cart, then returns 422 with an error message', async () => {
      const { body: created } = await createCart(env.gatewayUrl);

      const { response, body } = await addItem(
        env.gatewayUrl,
        created.cart.id,
        [{ id: 'does-not-exist', quantity: 1 }],
      );

      expect(response.status).toBe(422);
      expect(body).toEqual({ status: 'ERROR', message: 'Product not found' });
    });
  });

  describe('PATCH /cart/carts/:cartId/items/:itemId', () => {
    it('Given an existing item, when updating its quantity, then the cart totals are recalculated', async () => {
      const { body: created } = await createCart(env.gatewayUrl, {
        products: [{ id: productA.id, quantity: 1 }],
      });
      const itemId = created.cart.items[0].id;

      const { response, body } = await updateItemQuantity(
        env.gatewayUrl,
        created.cart.id,
        itemId,
        5,
      );

      expect(response.status).toBe(200);
      expect(body.cart.items[0]).toEqual(
        expect.objectContaining({
          id: itemId,
          quantity: 5,
          subtotal: productA.price * 5,
        }),
      );
      expect(body.cart.subtotal).toBe(productA.price * 5);
    });

    it('Given a non-existent item id, when updating its quantity, then returns 422 with an error message', async () => {
      const { body: created } = await createCart(env.gatewayUrl, {
        products: [{ id: productA.id, quantity: 1 }],
      });

      const { response, body } = await updateItemQuantity(
        env.gatewayUrl,
        created.cart.id,
        'does-not-exist',
        2,
      );

      expect(response.status).toBe(422);
      expect(body).toEqual({
        status: 'ERROR',
        message: 'Item not found in cart',
      });
    });

    it('Given a non-existent cart id, when updating an item quantity, then returns 422 with an error message', async () => {
      const { response, body } = await updateItemQuantity(
        env.gatewayUrl,
        'does-not-exist',
        'item-1',
        2,
      );

      expect(response.status).toBe(422);
      expect(body).toEqual({ status: 'ERROR', message: 'Cart not found' });
    });
  });

  describe('DELETE /cart/carts/:cartId/items/:itemId', () => {
    it('Given an existing item, when removing it, then it is no longer present in the cart', async () => {
      const { body: created } = await createCart(env.gatewayUrl, {
        products: [{ id: productA.id, quantity: 1 }],
      });
      const itemId = created.cart.items[0].id;

      const { response, body } = await removeItem(
        env.gatewayUrl,
        created.cart.id,
        itemId,
      );

      expect(response.status).toBe(200);
      expect(body.cart.items).toEqual([]);
      expect(body.cart.subtotal).toBe(0);
      expect(body.cart.total).toBe(0);
    });

    it('Given an item already removed, when removing it again, then returns 422 (not idempotent — documents current behavior)', async () => {
      const { body: created } = await createCart(env.gatewayUrl, {
        products: [{ id: productA.id, quantity: 1 }],
      });
      const itemId = created.cart.items[0].id;

      const first = await removeItem(env.gatewayUrl, created.cart.id, itemId);
      const second = await removeItem(env.gatewayUrl, created.cart.id, itemId);

      expect(first.response.status).toBe(200);
      expect(second.response.status).toBe(422);
      expect(second.body).toEqual({
        status: 'ERROR',
        message: 'Item not found in cart',
      });
    });

    it('Given a non-existent cart id, when removing an item, then returns 422 with an error message', async () => {
      const { response, body } = await removeItem(
        env.gatewayUrl,
        'does-not-exist',
        'item-1',
      );

      expect(response.status).toBe(422);
      expect(body).toEqual({ status: 'ERROR', message: 'Cart not found' });
    });
  });

  describe('Emptying the cart', () => {
    it('Given a cart with multiple items, when removing every item, then the cart ends up empty with zeroed totals', async () => {
      const { body: created } = await createCart(env.gatewayUrl, {
        products: [
          { id: productA.id, quantity: 2 },
          { id: productB.id, quantity: 1 },
        ],
      });

      const [firstItem, secondItem] = created.cart.items;

      await removeItem(env.gatewayUrl, created.cart.id, firstItem.id);
      const { response, body } = await removeItem(
        env.gatewayUrl,
        created.cart.id,
        secondItem.id,
      );

      expect(response.status).toBe(200);
      expect(body.cart.items).toEqual([]);
      expect(body.cart.subtotal).toBe(0);
      expect(body.cart.total).toBe(0);

      const { body: fetched } = await getCart(env.gatewayUrl, created.cart.id);
      expect(fetched.cart.items).toEqual([]);
    });
  });

  describe('POST /cart/carts/:cartId/checkout', () => {
    it('Given a cart with items, when checking out, then returns 200 with totals and an emptied cart', async () => {
      const { body: created } = await createCart(env.gatewayUrl, {
        products: [
          { id: productA.id, quantity: 2 },
          { id: productB.id, quantity: 1 },
        ],
      });
      const subtotal = productA.price * 2 + productB.price * 1;

      const { response, body } = await checkout(
        env.gatewayUrl,
        created.cart.id,
        500,
      );

      expect(response.status).toBe(200);
      expect(body).toEqual(
        expect.objectContaining({
          status: 'SUCCESS',
          subtotal,
          discount: 0,
          shipping: 500,
          total: subtotal + 500,
          cart: expect.objectContaining({ id: created.cart.id, items: [] }),
        }),
      );

      const { body: fetched } = await getCart(env.gatewayUrl, created.cart.id);
      expect(fetched.cart.items).toEqual([]);
    });

    it('Given products were added to a cart in separate requests, when checking out, then the full flow (create → add → checkout) succeeds', async () => {
      const { body: created } = await createCart(env.gatewayUrl);

      await addItem(env.gatewayUrl, created.cart.id, [
        { id: productA.id, quantity: 1 },
      ]);
      const { body: withItemB } = await addItem(
        env.gatewayUrl,
        created.cart.id,
        [{ id: productB.id, quantity: 2 }],
      );
      expect(withItemB.cart.items).toHaveLength(2);

      const { response, body } = await checkout(
        env.gatewayUrl,
        created.cart.id,
        0,
      );

      expect(response.status).toBe(200);
      expect(body.total).toBe(productA.price * 1 + productB.price * 2);
      expect(body.cart.items).toEqual([]);
    });

    it('Given an empty cart, when checking out, then returns 422 with an error message', async () => {
      const { body: created } = await createCart(env.gatewayUrl);

      const { response, body } = await checkout(
        env.gatewayUrl,
        created.cart.id,
        500,
      );

      expect(response.status).toBe(422);
      expect(body).toEqual({ status: 'ERROR', message: 'Cart is empty' });
    });

    it('Given a non-existent cart id, when checking out, then returns 422 with an error message', async () => {
      const { response, body } = await checkout(
        env.gatewayUrl,
        'does-not-exist',
        500,
      );

      expect(response.status).toBe(422);
      expect(body).toEqual({ status: 'ERROR', message: 'Cart not found' });
    });

    it('Given a negative shipping value, when checking out, then returns 400 with a validation error', async () => {
      const { body: created } = await createCart(env.gatewayUrl, {
        products: [{ id: productA.id, quantity: 1 }],
      });

      const response = await fetch(
        `${env.gatewayUrl}/cart/carts/${created.cart.id}/checkout`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shipping: -10 }),
        },
      );
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.status).toBe('ERROR');
    });
  });

  describe('Downstream service errors', () => {
    beforeAll(async () => {
      await env.stopCartService();
    });

    it('Given the cart-service is unavailable, when fetching a cart through the gateway, then returns a server error', async () => {
      const response = await fetch(`${env.gatewayUrl}/cart/carts/any-id`);

      expect(response.status).toBeGreaterThanOrEqual(500);
    });
  });
});
