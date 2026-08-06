import { CalculateShippingUseCase } from '../../src/application/usecases/CalculateShippingUseCase';
import { createIdFromString } from '../factories/IdFactory';
import { createProduct } from '../factories/ProductFactory';
import { CartRepository } from '../../src/domain/repositories/CartRepository';
import { CepLookupService } from '../../src/domain/repositories/CepLookupService';
import { Status } from '../../src/application/contracts/UseCase';
import { FreightRoadCalculator } from '../../src/domain/entities/freight/FreightCalculator';

describe('CalculateShippingUseCase', () => {
  let cartRepositoryMock: CartRepository;
  let cepLookupServiceMock: CepLookupService;
  let useCase: CalculateShippingUseCase;
  let cartMock: Record<string, unknown>;
  let freightCalculator: FreightRoadCalculator;

  const cartId = 'cart-1';
  const cep = '01310-100';

  beforeEach(() => {
    freightCalculator = new FreightRoadCalculator();

    cartRepositoryMock = {
      save: jest.fn(),
      findById: jest.fn(),
    };

    cepLookupServiceMock = {
      lookup: jest.fn().mockResolvedValue({ city: 'São Paulo', state: 'SP' }),
    };

    cartMock = {
      getUserId: jest.fn(() => ({ toString: () => 'user-1' })),
      getItems: jest.fn(),
    };

    useCase = new CalculateShippingUseCase(
      cartRepositoryMock,
      freightCalculator,
      cepLookupServiceMock,
    );

    jest.clearAllMocks();
    (cepLookupServiceMock.lookup as jest.Mock).mockResolvedValue({
      city: 'São Paulo',
      state: 'SP',
    });
  });

  describe('Success Scenario', () => {
    it('should calculate shipping cost successfully', async () => {
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

      const result = await useCase.execute({
        cartId,
        userId: 'user-1',
        cep,
      });

      expect(result.status).toBe(Status.SUCCESS);
      if (result.status === Status.SUCCESS) {
        expect(result.shipping).toBe(1910);
        expect(result.estimatedDays).toBeGreaterThan(0);
        expect(result.city).toBe('São Paulo');
        expect(result.state).toBe('SP');
      }
      expect(cartRepositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(cartMock.getItems).toHaveBeenCalledTimes(1);
      expect(cepLookupServiceMock.lookup).toHaveBeenCalledWith(cep);
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

      const result = await useCase.execute({
        cartId,
        userId: 'user-1',
        cep,
      });

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

      (cartRepositoryMock.findById as jest.Mock).mockResolvedValue(cartMock);
      (cartMock.getItems as jest.Mock).mockReturnValue([mockItem]);
      (cepLookupServiceMock.lookup as jest.Mock).mockResolvedValue({
        city: 'Manaus',
        state: 'AM',
      });

      const result = await useCase.execute({ cartId, userId: 'user-1', cep: '69000-000' });

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

      const result = await useCase.execute({ cartId, userId: 'user-1', cep });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe('Cart not found');
      }
    });

    it('should return error when cart is empty', async () => {
      (cartRepositoryMock.findById as jest.Mock).mockResolvedValue(cartMock);
      (cartMock.getItems as jest.Mock).mockReturnValue([]);

      const result = await useCase.execute({ cartId, userId: 'user-1', cep });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe('Cart is empty');
      }
    });

    it('should return error when cep is not found', async () => {
      const product = createProduct({ id: createIdFromString('product-1') });
      const mockItem = {
        getVolume: jest.fn(() => 0.004),
        getWeight: jest.fn(() => 2),
        quantity: 1,
        product,
      };

      (cartRepositoryMock.findById as jest.Mock).mockResolvedValue(cartMock);
      (cartMock.getItems as jest.Mock).mockReturnValue([mockItem]);
      (cepLookupServiceMock.lookup as jest.Mock).mockResolvedValue(null);

      const result = await useCase.execute({ cartId, userId: 'user-1', cep: '00000-000' });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe('CEP inválido ou não encontrado');
      }
    });
  });

  describe('Exception Handling Scenario', () => {
    it('should return error when cartRepository.findById throws exception', async () => {
      const errorMessage = 'Database failure';
      (cartRepositoryMock.findById as jest.Mock).mockRejectedValue(
        new Error(errorMessage),
      );

      const result = await useCase.execute({ cartId, userId: 'user-1', cep });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe(
          'An unexpected error occurred. Please try again later.',
        );
      }
    });
  });
});
