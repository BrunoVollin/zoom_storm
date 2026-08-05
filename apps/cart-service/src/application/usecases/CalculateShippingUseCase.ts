import { CartRepository } from '../../domain/repositories/CartRepository';
import { CepLookupService } from '../../domain/repositories/CepLookupService';
import { Shipment } from '../../domain/entities/freight/Freight';
import { estimateFreightRegion } from '../../domain/entities/freight/FreightRegionEstimator';
import { IdType } from '../../domain/shared/IdType';
import { Status, UseCase } from '../contracts/UseCase';
import { Freight } from '../../domain/entities/freight/Freight';
import { handleUnexpectedError } from '../shared/handleUnexpectedError';

export class CalculateShippingUseCase implements UseCase<Input, Output> {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly freightCalculator: Freight,
    private readonly cepLookupService: CepLookupService,
  ) {}

  async execute(input: Input): Promise<Output> {
    try {
      const cart = await this.cartRepository.findById(
        IdType.create(input.cartId),
      );

      if (!cart) {
        return {
          status: Status.ERROR,
          message: 'Cart not found',
        };
      }

      if (cart.getUserId().toString() !== input.userId) {
        return {
          status: Status.ERROR,
          message: 'Cart not found',
        };
      }

      const items = cart.getItems();

      if (items.length === 0) {
        return {
          status: Status.ERROR,
          message: 'Cart is empty',
        };
      }

      const address = await this.cepLookupService.lookup(input.cep);

      if (!address) {
        return {
          status: Status.ERROR,
          message: 'CEP inválido ou não encontrado',
        };
      }

      const totalVolume = items.reduce((acc, item) => {
        return acc + item.getVolume();
      }, 0);

      const totalWeight = items.reduce((acc, item) => {
        return acc + item.getWeight();
      }, 0);

      const region = estimateFreightRegion(address.state);
      const shipment = new Shipment(region.distanceKm, totalVolume, totalWeight);
      const shipping = this.freightCalculator.calculate(shipment);

      return {
        status: Status.SUCCESS,
        shipping,
        estimatedDays: region.days,
        city: address.city,
        state: address.state,
      };
    } catch (error) {
      return handleUnexpectedError(error);
    }
  }
}

interface Input {
  cartId: string;
  userId: string;
  cep: string;
}

interface SuccessOutput {
  status: Status.SUCCESS;
  shipping: number;
  estimatedDays: number;
  city: string;
  state: string;
}

interface ErrorOutput {
  status: Status.ERROR;
  message: string;
}

type Output = SuccessOutput | ErrorOutput;
