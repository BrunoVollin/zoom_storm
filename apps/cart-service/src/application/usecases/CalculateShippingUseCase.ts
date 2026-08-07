import { CartRepository } from '../../domain/repositories/CartRepository';
import { SavedAddressRepository } from '../../domain/repositories/SavedAddressRepository';
import { ShippingQuoteRepository } from '../../domain/repositories/ShippingQuoteRepository';
import { calculateShipmentForItems } from '../../domain/entities/freight/calculateShipmentForItems';
import { ShippingQuote } from '../../domain/entities/freight/ShippingQuote';
import { IdType } from '../../domain/shared/IdType';
import { ErrorOutput, Status, UseCase } from '../contracts/UseCase';
import { Freight } from '../../domain/entities/freight/Freight';
import { handleUnexpectedError } from '../shared/handleUnexpectedError';

/** Same payment/reservation window used for inventory reservations. */
export const SHIPPING_QUOTE_VALIDITY_MS = 15 * 60 * 1000;

export class CalculateShippingUseCase implements UseCase<Input, Output> {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly savedAddressRepository: SavedAddressRepository,
    private readonly freightCalculator: Freight,
    private readonly shippingQuoteRepository: ShippingQuoteRepository,
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

      const savedAddress = await this.savedAddressRepository.findById(
        IdType.create(input.addressId),
      );

      if (!savedAddress || !savedAddress.belongsTo(IdType.create(input.userId))) {
        return {
          status: Status.ERROR,
          message: 'Address not found',
          code: 'ADDRESS_NOT_FOUND',
        };
      }

      const address = savedAddress.getAddress();
      const { shipping, estimatedDays } = calculateShipmentForItems(
        items,
        address.state,
        this.freightCalculator,
      );

      const now = new Date();
      const quote = new ShippingQuote(
        IdType.create(),
        cart.getId(),
        savedAddress.id,
        cart.getVersion(),
        shipping,
        estimatedDays,
        new Date(now.getTime() + SHIPPING_QUOTE_VALIDITY_MS),
        now,
      );
      await this.shippingQuoteRepository.save(quote);

      return {
        status: Status.SUCCESS,
        shippingQuoteId: quote.id.toString(),
        shipping,
        estimatedDays,
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
  addressId: string;
}

interface SuccessOutput {
  status: Status.SUCCESS;
  shippingQuoteId: string;
  shipping: number;
  estimatedDays: number;
  city: string;
  state: string;
}

type Output = SuccessOutput | ErrorOutput;
