import { Status } from '../../src/application/contracts/UseCase';
import { CreateCartUseCase } from '../../src/application/usecases/CreateCartUseCase';
import { CartRepository } from '../../src/domain/repositories/CartRepository';
import { CouponRepository } from '../../src/domain/repositories/CouponRepository';
import { ProductRepository } from '../../src/domain/repositories/ProductRepository';
import {
  createInvalidCoupon,
  createValidCoupon,
} from '../factories/CouponFactory';
import { createIdFromString } from '../factories/IdFactory';
import { createProduct } from '../factories/ProductFactory';

describe('CreateCartUseCase', () => {
  let productRepositoryMock: ProductRepository;
  let couponRepositoryMock: CouponRepository;
  let cartRepositoryMock: CartRepository;
  let useCase: CreateCartUseCase;
  const userId = 'user-1';

  beforeEach(() => {
    productRepositoryMock = {
      save: jest.fn(),
      findById: jest.fn(),
      findByIds: jest.fn(),
    };

    couponRepositoryMock = {
      save: jest.fn(),
      findById: jest.fn(),
      findByIds: jest.fn(),
    };

    cartRepositoryMock = {
      save: jest.fn(),
      findById: jest.fn(),
    };

    useCase = new CreateCartUseCase(
      productRepositoryMock,
      couponRepositoryMock,
      cartRepositoryMock,
    );

    jest.clearAllMocks();
  });

  describe('Success Scenario', () => {
    it('should create cart successfully with one product and valid coupon', async () => {
      const productId = 'product-1';
      const product = createProduct({ id: createIdFromString(productId) });
      const validCoupon = createValidCoupon();
      const quantity = 1;

      (productRepositoryMock.findByIds as jest.Mock).mockResolvedValue([
        product,
      ]);
      (couponRepositoryMock.findByIds as jest.Mock).mockResolvedValue([
        validCoupon,
      ]);
      (cartRepositoryMock.save as jest.Mock).mockResolvedValue(undefined);

      const result = await useCase.execute({
        userId,
        products: [{ id: productId, quantity }],
        coupons: ['coupon-1'],
      });

      expect(result.status).toBe(Status.SUCCESS);
      expect(productRepositoryMock.findByIds).toHaveBeenCalledTimes(1);
      expect(couponRepositoryMock.findByIds).toHaveBeenCalledTimes(1);
      expect(cartRepositoryMock.save).toHaveBeenCalledTimes(1);
    });

    it('should respect the quantity informed in the input', async () => {
      const productId = 'product-2';
      const product = createProduct({
        id: createIdFromString(productId),
        price: 100,
      });
      const quantity = 5;

      (productRepositoryMock.findByIds as jest.Mock).mockResolvedValue([
        product,
      ]);
      (couponRepositoryMock.findByIds as jest.Mock).mockResolvedValue([]);
      (cartRepositoryMock.save as jest.Mock).mockResolvedValue(undefined);

      const result = await useCase.execute({
        userId,
        products: [{ id: productId, quantity }],
        coupons: [],
      });

      expect(result.status).toBe(Status.SUCCESS);
      expect(cartRepositoryMock.save).toHaveBeenCalledTimes(1);
    });

    it('should create cart with multiple products', async () => {
      const product1 = createProduct({
        id: createIdFromString('product-1'),
        price: 100,
      });
      const product2 = createProduct({
        id: createIdFromString('product-2'),
        price: 200,
      });

      (productRepositoryMock.findByIds as jest.Mock).mockResolvedValue([
        product1,
        product2,
      ]);
      (couponRepositoryMock.findByIds as jest.Mock).mockResolvedValue([]);
      (cartRepositoryMock.save as jest.Mock).mockResolvedValue(undefined);

      const result = await useCase.execute({
        userId,
        products: [
          { id: 'product-1', quantity: 2 },
          { id: 'product-2', quantity: 3 },
        ],
        coupons: [],
      });

      expect(result.status).toBe(Status.SUCCESS);
      expect(productRepositoryMock.findByIds).toHaveBeenCalledTimes(1);
      expect(couponRepositoryMock.findByIds).toHaveBeenCalledTimes(1);
      expect(cartRepositoryMock.save).toHaveBeenCalledTimes(1);
    });

    it('should apply multiple coupons correctly with cumulative discounts', async () => {
      const product = createProduct({ price: 1000 });
      const coupon1 = createValidCoupon({
        id: createIdFromString('coupon-1'),
        percent: 0.1,
      });
      const coupon2 = createValidCoupon({
        id: createIdFromString('coupon-2'),
        percent: 0.05,
      });

      (productRepositoryMock.findByIds as jest.Mock).mockResolvedValue([
        product,
      ]);
      (couponRepositoryMock.findByIds as jest.Mock).mockResolvedValue([
        coupon1,
        coupon2,
      ]);
      (cartRepositoryMock.save as jest.Mock).mockResolvedValue(undefined);

      const result = await useCase.execute({
        userId,
        products: [{ id: 'product-1', quantity: 1 }],
        coupons: ['coupon-1', 'coupon-2'],
      });

      expect(result.status).toBe(Status.SUCCESS);
      expect(cartRepositoryMock.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('Invalid Coupon Scenario', () => {
    it('should return error when coupon is outside validity period', async () => {
      const product = createProduct();
      const invalidCoupon = createInvalidCoupon();

      (productRepositoryMock.findByIds as jest.Mock).mockResolvedValue([
        product,
      ]);
      (couponRepositoryMock.findByIds as jest.Mock).mockResolvedValue([
        invalidCoupon,
      ]);

      const result = await useCase.execute({
        userId,
        products: [{ id: 'product-1', quantity: 1 }],
        coupons: ['coupon-invalid'],
      });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe(`Error: ${invalidCoupon.getName()}`);
      }

      expect(cartRepositoryMock.save).toHaveBeenCalledTimes(0);
      expect(productRepositoryMock.findByIds).toHaveBeenCalledTimes(1);
      expect(couponRepositoryMock.findByIds).toHaveBeenCalledTimes(1);
    });
  });

  describe('Exception Handling Scenario', () => {
    it('should return error when productRepository.findByIds throws exception', async () => {
      const errorMessage = 'Database connection failed';
      (productRepositoryMock.findByIds as jest.Mock).mockRejectedValue(
        new Error(errorMessage),
      );

      const result = await useCase.execute({
        userId,
        products: [{ id: 'product-1', quantity: 1 }],
        coupons: [],
      });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe(errorMessage);
      }

      expect(cartRepositoryMock.save).toHaveBeenCalledTimes(0);
    });

    it('should return error when couponRepository.findByIds throws exception', async () => {
      const product = createProduct();
      const errorMessage = 'Coupon service unavailable';

      (productRepositoryMock.findByIds as jest.Mock).mockResolvedValue([
        product,
      ]);
      (couponRepositoryMock.findByIds as jest.Mock).mockRejectedValue(
        new Error(errorMessage),
      );

      const result = await useCase.execute({
        userId,
        products: [{ id: 'product-1', quantity: 1 }],
        coupons: ['coupon-1'],
      });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe(errorMessage);
      }

      expect(cartRepositoryMock.save).toHaveBeenCalledTimes(0);
    });

    it('should return error when cartRepository.save throws exception', async () => {
      const product = createProduct();
      const validCoupon = createValidCoupon();
      const errorMessage = 'Failed to save cart';

      (productRepositoryMock.findByIds as jest.Mock).mockResolvedValue([
        product,
      ]);
      (couponRepositoryMock.findByIds as jest.Mock).mockResolvedValue([
        validCoupon,
      ]);
      (cartRepositoryMock.save as jest.Mock).mockRejectedValue(
        new Error(errorMessage),
      );

      const result = await useCase.execute({
        userId,
        products: [{ id: 'product-1', quantity: 1 }],
        coupons: ['coupon-1'],
      });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe(errorMessage);
      }

      expect(cartRepositoryMock.save).toHaveBeenCalledTimes(1);
    });

    it('should return generic error message for non-Error objects', async () => {
      (productRepositoryMock.findByIds as jest.Mock).mockRejectedValue(
        'String error instead of Error object',
      );

      const result = await useCase.execute({
        userId,
        products: [{ id: 'product-1', quantity: 1 }],
        coupons: [],
      });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe('An unexpected error occurred.');
      }
    });
  });

  describe('Repository Interaction Validations', () => {
    it('should call productRepository.findByIds with correct IDs', async () => {
      const product = createProduct();
      (productRepositoryMock.findByIds as jest.Mock).mockResolvedValue([
        product,
      ]);
      (couponRepositoryMock.findByIds as jest.Mock).mockResolvedValue([]);
      (cartRepositoryMock.save as jest.Mock).mockResolvedValue(undefined);

      await useCase.execute({
        userId,
        products: [{ id: 'product-1', quantity: 1 }],
        coupons: [],
      });

      expect(productRepositoryMock.findByIds).toHaveBeenCalledTimes(1);
      const callArgs = (productRepositoryMock.findByIds as jest.Mock).mock
        .calls[0][0];
      expect(Array.isArray(callArgs)).toBe(true);
      expect(callArgs.length).toBe(1);
    });

    it('should call couponRepository.findByIds with correct IDs', async () => {
      const product = createProduct();
      (productRepositoryMock.findByIds as jest.Mock).mockResolvedValue([
        product,
      ]);
      (couponRepositoryMock.findByIds as jest.Mock).mockResolvedValue([]);
      (cartRepositoryMock.save as jest.Mock).mockResolvedValue(undefined);

      await useCase.execute({
        userId,
        products: [{ id: 'product-1', quantity: 1 }],
        coupons: ['coupon-1', 'coupon-2'],
      });

      expect(couponRepositoryMock.findByIds).toHaveBeenCalledTimes(1);
      const callArgs = (couponRepositoryMock.findByIds as jest.Mock).mock
        .calls[0][0];
      expect(Array.isArray(callArgs)).toBe(true);
      expect(callArgs.length).toBe(2);
    });

    it('should call cartRepository.save exactly once on success', async () => {
      const product = createProduct();
      (productRepositoryMock.findByIds as jest.Mock).mockResolvedValue([
        product,
      ]);
      (couponRepositoryMock.findByIds as jest.Mock).mockResolvedValue([]);
      (cartRepositoryMock.save as jest.Mock).mockResolvedValue(undefined);

      await useCase.execute({
        userId,
        products: [{ id: 'product-1', quantity: 1 }],
        coupons: [],
      });

      expect(cartRepositoryMock.save).toHaveBeenCalledTimes(1);
    });

    it('should return Product not found', async () => {
      (productRepositoryMock.findByIds as jest.Mock).mockResolvedValue([]);
      (couponRepositoryMock.findByIds as jest.Mock).mockResolvedValue([]);
      (cartRepositoryMock.save as jest.Mock).mockResolvedValue(undefined);

      const result = await useCase.execute({
        userId,
        products: [{ id: 'product-1', quantity: 1 }],
        coupons: [],
      });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR)
        expect(result.message).toBe('Product not found');
    });

    it('should return Coupon not found', async () => {
      const product = createProduct();
      (productRepositoryMock.findByIds as jest.Mock).mockResolvedValue([
        product,
      ]);
      (couponRepositoryMock.findByIds as jest.Mock).mockResolvedValue([]);
      (cartRepositoryMock.save as jest.Mock).mockResolvedValue(undefined);

      const result = await useCase.execute({
        userId,
        products: [{ id: 'product-1', quantity: 1 }],
        coupons: ['coupon-1'],
      });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR)
        expect(result.message).toBe('Coupon not found');
    });
  });
});
