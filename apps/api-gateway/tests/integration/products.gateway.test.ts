import {
  startTestEnvironment,
  TestEnvironment,
} from './helpers/testEnvironment';
import { buildProductPayload, createProduct } from './helpers/productFactory';

describe('API Gateway → Products flow', () => {
  let env: TestEnvironment;

  beforeAll(async () => {
    env = await startTestEnvironment();
  }, 30000);

  afterAll(async () => {
    await env.stop();
  });

  afterEach(() => {
    env.productStore.clear();
  });

  describe('GET /products', () => {
    it('Given no products, when listing products, then returns an empty list', async () => {
      const response = await fetch(`${env.gatewayUrl}/products`);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({ status: 'SUCCESS', products: [] });
    });

    it('Given a product was created, when listing products, then it appears in the list', async () => {
      const { body: created } = await createProduct(env.gatewayUrl, {
        name: 'Wireless Headphones',
      });

      const response = await fetch(`${env.gatewayUrl}/products`);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.status).toBe('SUCCESS');
      expect(body.products).toContainEqual(
        expect.objectContaining({
          id: created.product.id,
          name: 'Wireless Headphones',
        }),
      );
    });
  });

  describe('POST /products', () => {
    it('Given a valid payload, when creating a product, then returns 201 with the created product', async () => {
      const { response, body } = await createProduct(env.gatewayUrl, {
        name: 'Mechanical Keyboard',
        price: 35990,
      });

      expect(response.status).toBe(201);
      expect(body.status).toBe('SUCCESS');
      expect(body.product).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          name: 'Mechanical Keyboard',
        }),
      );
      expect(body.product.variants[0].price).toBe(35990);
    });

    it('Given an invalid payload, when creating a product, then returns 400 with a validation error', async () => {
      const response = await fetch(`${env.gatewayUrl}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '' }),
      });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.status).toBe('ERROR');
      expect(body.message).toEqual(expect.any(String));
    });
  });

  describe('GET /products/:id', () => {
    it('Given an existing product, when fetching it by id, then returns 200 with the product', async () => {
      const { body: created } = await createProduct(env.gatewayUrl, {
        name: 'Gaming Mouse',
      });

      const response = await fetch(
        `${env.gatewayUrl}/products/${created.product.id}`,
      );
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({ status: 'SUCCESS', product: created.product });
    });

    it('Given a non-existent id, when fetching a product by id, then returns 404 with an error message', async () => {
      const response = await fetch(`${env.gatewayUrl}/products/does-not-exist`);
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body).toEqual({ status: 'ERROR', message: 'Product not found' });
    });
  });

  describe('PUT /products/:id', () => {
    it('Given an existing product, when updating it, then returns 200 with the updated fields', async () => {
      const { body: created } = await createProduct(env.gatewayUrl, {
        name: 'Old Name',
        price: 1000,
      });

      const response = await fetch(
        `${env.gatewayUrl}/products/${created.product.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            buildProductPayload({ name: 'New Name', price: 2000 }),
          ),
        },
      );
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.status).toBe('SUCCESS');
      expect(body.product).toEqual(
        expect.objectContaining({
          id: created.product.id,
          name: 'New Name',
        }),
      );

      const getResponse = await fetch(
        `${env.gatewayUrl}/products/${created.product.id}`,
      );
      const getBody = await getResponse.json();
      expect(getBody.product.name).toBe('New Name');
    });

    it('Given a non-existent id, when updating a product, then returns 422 with an error message', async () => {
      const response = await fetch(
        `${env.gatewayUrl}/products/does-not-exist`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildProductPayload()),
        },
      );
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body).toEqual({ status: 'ERROR', message: 'Product not found' });
    });
  });

  describe('DELETE /products/:id', () => {
    it('Given an existing product, when deleting it, then it is removed and no longer retrievable', async () => {
      const { body: created } = await createProduct(env.gatewayUrl, {
        name: 'Disposable Item',
      });

      const deleteResponse = await fetch(
        `${env.gatewayUrl}/products/${created.product.id}`,
        {
          method: 'DELETE',
        },
      );
      const deleteBody = await deleteResponse.json();

      expect(deleteResponse.status).toBe(200);
      expect(deleteBody).toEqual({ status: 'SUCCESS' });

      const getResponse = await fetch(
        `${env.gatewayUrl}/products/${created.product.id}`,
      );
      expect(getResponse.status).toBe(404);
    });

    it('Given a non-existent id, when deleting a product, then returns 422 with an error message', async () => {
      const response = await fetch(
        `${env.gatewayUrl}/products/does-not-exist`,
        {
          method: 'DELETE',
        },
      );
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body).toEqual({ status: 'ERROR', message: 'Product not found' });
    });

    it('Given a product already deleted, when deleting it again, then it remains deleted (repeated calls do not resurrect or error fatally)', async () => {
      const { body: created } = await createProduct(env.gatewayUrl, {
        name: 'Delete Twice',
      });

      const first = await fetch(
        `${env.gatewayUrl}/products/${created.product.id}`,
        {
          method: 'DELETE',
        },
      );
      const second = await fetch(
        `${env.gatewayUrl}/products/${created.product.id}`,
        {
          method: 'DELETE',
        },
      );
      const secondBody = await second.json();

      expect(first.status).toBe(200);
      expect(second.status).toBe(422);
      expect(secondBody.message).toBe('Product not found');

      const getResponse = await fetch(
        `${env.gatewayUrl}/products/${created.product.id}`,
      );
      expect(getResponse.status).toBe(404);
    });
  });

  describe('Downstream service errors', () => {
    beforeAll(async () => {
      await env.stopProductsService();
    });

    it('Given the products-service is unavailable, when listing products through the gateway, then returns a server error', async () => {
      const response = await fetch(`${env.gatewayUrl}/products`);

      expect(response.status).toBeGreaterThanOrEqual(500);
    });
  });
});
