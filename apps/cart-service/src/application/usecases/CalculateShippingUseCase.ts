import { CartRepository } from '../../domain/repositories/CartRepository';
import { Shipment } from '../../domain/entities/freight/Freight';
import { IdType } from '../../domain/shared/IdType';
import { Status, UseCase } from '../contracts/UseCase';
import { Freight } from '../../domain/entities/freight/Freight';

export class CalculateShippingUseCase implements UseCase<Input, Output> {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly freightCalculator: Freight,
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

      const items = cart.getItems();

      if (items.length === 0) {
        return {
          status: Status.ERROR,
          message: 'Cart is empty',
        };
      }

      const totalVolume = items.reduce((acc, item) => {
        return acc + item.getVolume();
      }, 0);

      const totalWeight = items.reduce((acc, item) => {
        return acc + item.quantity;
      }, 0);

      const shipment = new Shipment(input.distance, totalVolume, totalWeight);
      const shipping = this.freightCalculator.calculate(shipment);

      return {
        status: Status.SUCCESS,
        shipping,
      };
    } catch (error) {
      return {
        status: Status.ERROR,
        message:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred.',
      };
    }
  }
}

interface Input {
  cartId: string;
  distance: number;
}

interface SuccessOutput {
  status: Status.SUCCESS;
  shipping: number;
}

interface ErrorOutput {
  status: Status.ERROR;
  message: string;
}

type Output = SuccessOutput | ErrorOutput;
