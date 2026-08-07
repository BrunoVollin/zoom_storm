import {
  startTestEnvironment,
  TestEnvironment,
} from './helpers/testEnvironment';

async function listCoupons(gatewayUrl: string) {
  const response = await fetch(`${gatewayUrl}/cart/admin/coupons`);
  const body = await response.json();

  return { response, body };
}

async function createCoupon(gatewayUrl: string, payload: Record<string, unknown>) {
  const response = await fetch(`${gatewayUrl}/cart/admin/coupons`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await response.json();

  return { response, body };
}

async function updateCoupon(
  gatewayUrl: string,
  id: string,
  payload: Record<string, unknown>,
) {
  const response = await fetch(`${gatewayUrl}/cart/admin/coupons/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await response.json();

  return { response, body };
}

async function deleteCoupon(gatewayUrl: string, id: string) {
  const response = await fetch(`${gatewayUrl}/cart/admin/coupons/${id}`, {
    method: 'DELETE',
  });
  const body = await response.json();

  return { response, body };
}

const percentCouponPayload = {
  name: 'PROMO10',
  type: 'PERCENT',
  start: '2026-01-01T00:00:00.000Z',
  end: '2026-12-31T23:59:59.000Z',
  percent: 0.1,
};

const fixedCouponPayload = {
  name: 'FIXED20',
  type: 'FIXED',
  start: '2026-01-01T00:00:00.000Z',
  end: '2026-12-31T23:59:59.000Z',
  amount: 2000,
};

describe('API Gateway → Admin Coupon management', () => {
  let env: TestEnvironment;

  beforeAll(async () => {
    env = await startTestEnvironment();
  }, 30000);

  afterAll(async () => {
    await env.stop();
  });

  afterEach(() => {
    env.couponRepository.clear();
  });

  describe('GET /cart/admin/coupons', () => {
    it('Given no coupons exist, when listing, then returns 200 with an empty list', async () => {
      const { response, body } = await listCoupons(env.gatewayUrl);

      expect(response.status).toBe(200);
      expect(body).toEqual({ status: 'SUCCESS', coupons: [] });
    });

    it('Given coupons exist, when listing, then returns every coupon', async () => {
      await createCoupon(env.gatewayUrl, percentCouponPayload);
      await createCoupon(env.gatewayUrl, fixedCouponPayload);

      const { response, body } = await listCoupons(env.gatewayUrl);

      expect(response.status).toBe(200);
      expect(body.status).toBe('SUCCESS');
      expect(body.coupons).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'PROMO10', type: 'PERCENT', percent: 0.1 }),
          expect.objectContaining({ name: 'FIXED20', type: 'FIXED', amount: 2000 }),
        ]),
      );
    });
  });

  describe('POST /cart/admin/coupons', () => {
    it('Given a valid PERCENT coupon, when creating it, then returns 201 with the created coupon', async () => {
      const { response, body } = await createCoupon(
        env.gatewayUrl,
        percentCouponPayload,
      );

      expect(response.status).toBe(201);
      expect(body).toEqual({
        status: 'SUCCESS',
        coupon: expect.objectContaining({
          id: expect.any(String),
          name: 'PROMO10',
          type: 'PERCENT',
          percent: 0.1,
          isValid: expect.any(Boolean),
        }),
      });
    });

    it('Given a valid FIXED coupon, when creating it, then returns 201 with the created coupon', async () => {
      const { response, body } = await createCoupon(
        env.gatewayUrl,
        fixedCouponPayload,
      );

      expect(response.status).toBe(201);
      expect(body.coupon).toEqual(
        expect.objectContaining({ name: 'FIXED20', type: 'FIXED', amount: 2000 }),
      );
    });

    it('Given a duplicate coupon name, when creating it, then returns 422 with an error message', async () => {
      await createCoupon(env.gatewayUrl, percentCouponPayload);

      const { response, body } = await createCoupon(
        env.gatewayUrl,
        percentCouponPayload,
      );

      expect(response.status).toBe(422);
      expect(body).toEqual({
        status: 'ERROR',
        message: 'A coupon named "PROMO10" already exists',
      });
    });

    it('Given a PERCENT coupon without percent, when creating it, then returns 400 with a validation error', async () => {
      const { response, body } = await createCoupon(env.gatewayUrl, {
        name: 'INVALID',
        type: 'PERCENT',
        start: '2026-01-01T00:00:00.000Z',
        end: '2026-12-31T23:59:59.000Z',
      });

      expect(response.status).toBe(400);
      expect(body.status).toBe('ERROR');
    });

    it('Given an invalid coupon type, when creating it, then returns 400 with a validation error', async () => {
      const { response, body } = await createCoupon(env.gatewayUrl, {
        name: 'INVALID',
        type: 'NOT_A_TYPE',
        start: '2026-01-01T00:00:00.000Z',
        end: '2026-12-31T23:59:59.000Z',
        percent: 0.1,
      });

      expect(response.status).toBe(400);
      expect(body.status).toBe('ERROR');
    });
  });

  describe('PUT /cart/admin/coupons/:id', () => {
    it('Given an existing coupon, when updating it, then returns 200 with the updated coupon', async () => {
      const { body: created } = await createCoupon(
        env.gatewayUrl,
        percentCouponPayload,
      );

      const { response, body } = await updateCoupon(
        env.gatewayUrl,
        created.coupon.id,
        { ...percentCouponPayload, name: 'PROMO10-RENAMED', percent: 0.2 },
      );

      expect(response.status).toBe(200);
      expect(body.coupon).toEqual(
        expect.objectContaining({
          id: created.coupon.id,
          name: 'PROMO10-RENAMED',
          percent: 0.2,
        }),
      );
    });

    it('Given a non-existent coupon id, when updating it, then returns 422 with an error message', async () => {
      const { response, body } = await updateCoupon(
        env.gatewayUrl,
        'does-not-exist',
        percentCouponPayload,
      );

      expect(response.status).toBe(422);
      expect(body).toEqual({ status: 'ERROR', message: 'Coupon not found' });
    });
  });

  describe('DELETE /cart/admin/coupons/:id', () => {
    it('Given an existing coupon, when deleting it, then it no longer appears in the list', async () => {
      const { body: created } = await createCoupon(
        env.gatewayUrl,
        percentCouponPayload,
      );

      const { response, body } = await deleteCoupon(
        env.gatewayUrl,
        created.coupon.id,
      );

      expect(response.status).toBe(200);
      expect(body).toEqual({ status: 'SUCCESS' });

      const { body: list } = await listCoupons(env.gatewayUrl);
      expect(list.coupons).toEqual([]);
    });

    it('Given a non-existent coupon id, when deleting it, then returns 422 with an error message', async () => {
      const { response, body } = await deleteCoupon(
        env.gatewayUrl,
        'does-not-exist',
      );

      expect(response.status).toBe(422);
      expect(body).toEqual({ status: 'ERROR', message: 'Coupon not found' });
    });
  });
});
