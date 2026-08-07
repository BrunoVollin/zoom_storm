import { CalculateShippingUseCase } from '../../src/application/usecases/CalculateShippingUseCase';
import { createIdFromString } from '../factories/IdFactory';
import { createProduct } from '../factories/ProductFactory';
import { CartRepository } from '../../src/domain/repositories/CartRepository';
import { SavedAddressRepository } from '../../src/domain/repositories/SavedAddressRepository';
import { ShippingQuoteRepository } from '../../src/domain/repositories/ShippingQuoteRepository';
import { Address } from '../../src/domain/entities/profile/Address';
import { SavedAddress } from '../../src/domain/entities/profile/SavedAddress';
import { Status } from '../../src/application/contracts/UseCase';
import { FreightRoadCalculator } from '../../src/domain/entities/freight/FreightCalculator';

describe('CalculateShippingUseCase', () => {
  let cartRepositoryMock: CartRepository;
  let savedAddressRepositoryMock: SavedAddressRepository;
  let shippingQuoteRepositoryMock: ShippingQuoteRepository;
  let useCase: CalculateShippingUseCase;
  let cartMock: Record<string, unknown>;
  let freightCalculator: FreightRoadCalculator;
  let savedAddress: SavedAddress;

  const cartId = 'cart-1';
  const addressId = 'address-1';
  const userId = 'user-1';

  beforeEach(() => {
    freightCalculator = new FreightRoadCalculator();

    cartRepositoryMock = {
      save: jest.fn(),
      findById: jest.fn(),
    };

    savedAddress = new SavedAddress(
      createIdFromString(addressId),
      createIdFromString(userId),
      'Home',
      'Bruno Almeida',
      new Address('Rua A', '100', 'Centro', 'São Paulo', 'SP', '01310-100'),
    );

    savedAddressRepositoryMock = {
      save: jest.fn(),
      findById: jest.fn().mockResolvedValue(savedAddress),
      findByUserId: jest.fn(),
      delete: jest.fn(),
    };

    shippingQuoteRepositoryMock = {
      save: jest.fn(),
      findById: jest.fn(),
    };

    cartMock = {
      id: createIdFromString(cartId),
      getId: jest.fn(() => createIdFromString(cartId)),
      getUserId: jest.fn(() => ({ toString: () => userId })),
      getVersion: jest.fn(() => 0),
      getItems: jest.fn(),
    };

    useCase = new CalculateShippingUseCase(
      cartRepositoryMock,
      savedAddressRepositoryMock,
      freightCalculator,
      shippingQuoteRepositoryMock,
    );

    jest.clearAllMocks();
    (savedAddressRepositoryMock.findById as jest.Mock).mockResolvedValue(
      savedAddress,
    );
  });

  describe('Success Scenario', () => {
    it('should calculate shipping cost and persist a quote', async () => {
      const product = createProduct({
        id: createIdFromString('product-1'),
        price: 1000,
      });

      const mockItem = {
        getVolume: jest.fn(() => 0.004),
        getWeight: jest.fn(() => 2),
        quantity: 2,
        product,
      };

      (cartRepositoryMock.findById as jest.Mock).mockResolvedValue(cartMock);
      (cartMock.getItems as jest.Mock).mockReturnValue([mockItem]);

      const result = await useCase.execute({ cartId, userId, addressId });

      expect(result.status).toBe(Status.SUCCESS);
      if (result.status === Status.SUCCESS) {
        expect(result.shipping).toBe(1910);
        expect(result.estimatedDays).toBeGreaterThan(0);
        expect(result.city).toBe('São Paulo');
        expect(result.state).toBe('SP');
        expect(result.shippingQuoteId).toEqual(expect.any(String));
      }
      expect(cartRepositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(cartMock.getItems).toHaveBeenCalledTimes(1);
      expect(savedAddressRepositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(shippingQuoteRepositoryMock.save).toHaveBeenCalledTimes(1);
    });

    it('should calculate shipping with multiple items', async () => {
      const product1 = createProduct({
        id: createIdFromString('product-1'),
      });
      const product2 = createProduct({
        id: createIdFromString('product-2'),
      });

      const mockItem1 = {
        getVolume: jest.fn(() => 0.004),
        getWeight: jest.fn(() => 2),
        quantity: 2,
        product: product1,
      };

      const mockItem2 = {
        getVolume: jest.fn(() => 0.006),
        getWeight: jest.fn(() => 3),
        quantity: 3,
        product: product2,
      };

      (cartRepositoryMock.findById as jest.Mock).mockResolvedValue(cartMock);
      (cartMock.getItems as jest.Mock).mockReturnValue([mockItem1, mockItem2]);

      const result = await useCase.execute({ cartId, userId, addressId });

      expect(result.status).toBe(Status.SUCCESS);
      if (result.status === Status.SUCCESS) {
        expect(result.shipping).toBe(2600);
      }
    });

    it('should use a larger distance estimate for a farther state', async () => {
      const product = createProduct({ id: createIdFromString('product-1') });
      const mockItem = {
        getVolume: jest.fn(() => 0.004),
        getWeight: jest.fn(() => 2),
        quantity: 1,
        product,
      };

      const farAddress = new SavedAddress(
        createIdFromString(addressId),
        createIdFromString(userId),
        'Home',
        'Bruno Almeida',
        new Address('Rua B', '1', 'Centro', 'Manaus', 'AM', '69000-000'),
      );
      (savedAddressRepositoryMock.findById as jest.Mock).mockResolvedValue(
        farAddress,
      );
      (cartRepositoryMock.findById as jest.Mock).mockResolvedValue(cartMock);
      (cartMock.getItems as jest.Mock).mockReturnValue([mockItem]);

      const result = await useCase.execute({ cartId, userId, addressId });

      expect(result.status).toBe(Status.SUCCESS);
      if (result.status === Status.SUCCESS) {
        expect(result.state).toBe('AM');
        expect(result.estimatedDays).toBeGreaterThan(1);
        expect(result.shipping).toBe(19160);
      }
    });
  });

  describe('Business Rule Violations', () => {
    it('should return error when cart is not found', async () => {
      (cartRepositoryMock.findById as jest.Mock).mockResolvedValue(null);

      const result = await useCase.execute({ cartId, userId, addressId });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe('Cart not found');
      }
    });

    it('should return error when cart is empty', async () => {
      (cartRepositoryMock.findById as jest.Mock).mockResolvedValue(cartMock);
      (cartMock.getItems as jest.Mock).mockReturnValue([]);

      const result = await useCase.execute({ cartId, userId, addressId });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe('Cart is empty');
      }
    });

    it('should return error when the address does not exist', async () => {
      const product = createProduct({ id: createIdFromString('product-1') });
      const mockItem = {
        getVolume: jest.fn(() => 0.004),
        getWeight: jest.fn(() => 2),
        quantity: 1,
        product,
      };

      (cartRepositoryMock.findById as jest.Mock).mockResolvedValue(cartMock);
      (cartMock.getItems as jest.Mock).mockReturnValue([mockItem]);
      (savedAddressRepositoryMock.findById as jest.Mock).mockResolvedValue(null);

      const result = await useCase.execute({ cartId, userId, addressId });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe('Address not found');
        expect(result.code).toBe('ADDRESS_NOT_FOUND');
      }
    });

    it('should return error when the address belongs to another user', async () => {
      const product = createProduct({ id: createIdFromString('product-1') });
      const mockItem = {
        getVolume: jest.fn(() => 0.004),
        getWeight: jest.fn(() => 2),
        quantity: 1,
        product,
      };
      const othersAddress = new SavedAddress(
        createIdFromString(addressId),
        createIdFromString('other-user'),
        'Work',
        'Other User',
        new Address('Rua B', '200', 'Centro', 'Rio de Janeiro', 'RJ', '20000-000'),
      );

      (cartRepositoryMock.findById as jest.Mock).mockResolvedValue(cartMock);
      (cartMock.getItems as jest.Mock).mockReturnValue([mockItem]);
      (savedAddressRepositoryMock.findById as jest.Mock).mockResolvedValue(
        othersAddress,
      );

      const result = await useCase.execute({ cartId, userId, addressId });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.code).toBe('ADDRESS_NOT_FOUND');
      }
    });
  });

  describe('Exception Handling Scenario', () => {
    it('should return error when cartRepository.findById throws exception', async () => {
      (cartRepositoryMock.findById as jest.Mock).mockRejectedValue(
        new Error('Database failure'),
      );

      const result = await useCase.execute({ cartId, userId, addressId });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe(
          'An unexpected error occurred. Please try again later.',
        );
      }
    });
  });
});
