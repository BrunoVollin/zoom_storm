import { CalculateShippingUseCase } from '@src/application/usecases/CalculateShippingUseCase';
import { createIdFromString } from '../factories/IdFactory';
import { createProduct } from '../factories/ProductFactory';
import { CartRepository } from '@src/domain/repositories/CartRepository';
import { Status } from '@src/application/contracts/UseCase';
import { FreightRoadCalculator } from '@src/domain/entities/freight/FreightCalculator';

describe('CalculateShippingUseCase', () => {
  let cartRepositoryMock: CartRepository;
  let useCase: CalculateShippingUseCase;
  let cartMock: any;
  let freightCalculator: FreightRoadCalculator;

  const cartId = 'cart-1';
  const distance = 100;

  beforeEach(() => {
    freightCalculator = new FreightRoadCalculator();

    cartRepositoryMock = {
      save: jest.fn(),
      findById: jest.fn(),
    };

    cartMock = {
      getItems: jest.fn(),
    };

    useCase = new CalculateShippingUseCase(
      cartRepositoryMock,
      freightCalculator,
    );

    jest.clearAllMocks();
  });

  describe('Success Scenario', () => {
    it('should calculate shipping cost successfully', async () => {
      const product = createProduct({
        id: createIdFromString('product-1'),
        price: 1000,
      });

      const mockItem = {
        getVolume: jest.fn(() => 1000),
        quantity: 2,
        product,
      };

      (cartRepositoryMock.findById as jest.Mock).mockResolvedValue(cartMock);
      (cartMock.getItems as jest.Mock).mockReturnValue([mockItem]);

      const result = await useCase.execute({
        cartId,
        distance,
      });

      expect(result.status).toBe(Status.SUCCESS);
      if (result.status === Status.SUCCESS) {
        expect(result.shipping).toBeGreaterThan(0);
      }
      expect(cartRepositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(cartMock.getItems).toHaveBeenCalledTimes(1);
    });

    it('should calculate shipping with multiple items', async () => {
      const product1 = createProduct({
        id: createIdFromString('product-1'),
      });
      const product2 = createProduct({
        id: createIdFromString('product-2'),
      });

      const mockItem1 = {
        getVolume: jest.fn(() => 1000),
        quantity: 2,
        product: product1,
      };

      const mockItem2 = {
        getVolume: jest.fn(() => 1000),
        quantity: 3,
        product: product2,
      };

      (cartRepositoryMock.findById as jest.Mock).mockResolvedValue(cartMock);
      (cartMock.getItems as jest.Mock).mockReturnValue([mockItem1, mockItem2]);

      const result = await useCase.execute({
        cartId,
        distance,
      });

      expect(result.status).toBe(Status.SUCCESS);
      if (result.status === Status.SUCCESS) {
        expect(result.shipping).toBeGreaterThan(0);
      }
    });
  });

  describe('Business Rule Violations', () => {
    it('should return error when cart is not found', async () => {
      (cartRepositoryMock.findById as jest.Mock).mockResolvedValue(null);

      const result = await useCase.execute({
        cartId,
        distance,
      });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe('Cart not found');
      }
    });

    it('should return error when cart is empty', async () => {
      (cartRepositoryMock.findById as jest.Mock).mockResolvedValue(cartMock);
      (cartMock.getItems as jest.Mock).mockReturnValue([]);

      const result = await useCase.execute({
        cartId,
        distance,
      });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe('Cart is empty');
      }
    });
  });

  describe('Exception Handling Scenario', () => {
    it('should return error when cartRepository.findById throws exception', async () => {
      const errorMessage = 'Database failure';
      (cartRepositoryMock.findById as jest.Mock).mockRejectedValue(
        new Error(errorMessage),
      );

      const result = await useCase.execute({
        cartId,
        distance,
      });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe(errorMessage);
      }
    });
  });
});
