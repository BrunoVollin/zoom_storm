import { Cart } from '../../domain/entities/cart/Cart';
import { Order, OrderAddressSnapshot } from '../../domain/entities/order/Order';
import { OrderItem } from '../../domain/entities/order/OrderItem';
import { DomainEvent, DomainEventName } from '../../domain/events/DomainEvent';
import { CartRepository } from '../../domain/repositories/CartRepository';
import { InventoryReservationService } from '../../domain/repositories/InventoryReservationService';
import { OrderRepository } from '../../domain/repositories/OrderRepository';
import { SavedAddressRepository } from '../../domain/repositories/SavedAddressRepository';
import { ShippingQuoteRepository } from '../../domain/repositories/ShippingQuoteRepository';
import { IdType } from '../../domain/shared/IdType';
import { ErrorOutput, Status, UseCase } from '../contracts/UseCase';
import { CartMapper, CartPrimitives } from '../mappers/CartMapper';
import { OrderMapper, OrderPrimitives } from '../mappers/OrderMapper';
import { handleUnexpectedError } from '../shared/handleUnexpectedError';
import { ReserveLoyaltyPointsUseCase } from './ReserveLoyaltyPointsUseCase';
import { RevalidateCartCouponsUseCase } from './RevalidateCartCouponsUseCase';

export class CheckoutUseCase implements UseCase<Input, Output> {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly orderRepository: OrderRepository,
    private readonly savedAddressRepository: SavedAddressRepository,
    private readonly inventoryReservationService: InventoryReservationService,
    private readonly shippingQuoteRepository: ShippingQuoteRepository,
    private readonly revalidateCoupons: RevalidateCartCouponsUseCase,
    private readonly reserveLoyaltyPoints: ReserveLoyaltyPointsUseCase,
  ) {}

  async execute(input: Input): Promise<Output> {
    try {
      if (!input.idempotencyKey.trim()) {
        return {
          status: Status.ERROR,
          message: 'Idempotency key is required',
        };
      }

      const userId = IdType.create(input.userId);
      const cart = await this.cartRepository.findById(IdType.create(input.cartId));
      if (!cart || cart.getUserId().toString() !== input.userId) {
        return { status: Status.ERROR, message: 'Cart not found' };
      }

      const replay = await this.orderRepository.findByCheckoutIdempotencyKey(
        userId,
        input.idempotencyKey,
      );
      if (replay) {
        if (
          replay.cartId.toString() !== input.cartId ||
          replay.savedAddressId !== input.addressId
        ) {
          return {
            status: Status.ERROR,
            message: 'Idempotency key was already used for another checkout request',
            code: 'IDEMPOTENCY_CONFLICT',
          };
        }

        await this.completePendingCartClear(cart, replay);
        return this.success(cart, replay, true);
      }

      const items = cart.getItems();
      if (items.length === 0) {
        return { status: Status.ERROR, message: 'Cart is empty' };
      }

      const savedAddress = await this.savedAddressRepository.findById(
        IdType.create(input.addressId),
      );
      if (!savedAddress || !savedAddress.belongsTo(userId)) {
        return {
          status: Status.ERROR,
          message: 'Address not found',
          code: 'ADDRESS_NOT_FOUND',
        };
      }

      const couponsResult = await this.revalidateCoupons.execute({
        cartId: input.cartId,
        userId: input.userId,
      });
      if (couponsResult.status === Status.ERROR) {
        return couponsResult;
      }

      const quote = await this.shippingQuoteRepository.findById(
        IdType.create(input.shippingQuoteId),
      );
      const now = new Date();
      if (
        !quote ||
        !quote.isValidFor(cart.getId(), savedAddress.id, cart.getVersion(), now)
      ) {
        return {
          status: Status.ERROR,
          message: 'Shipping quote is expired or no longer matches the cart/address',
          code: 'SHIPPING_QUOTE_EXPIRED',
        };
      }

      const shipping = quote.shipping;
      const subtotal = cart.calcSubtotal();
      const discount = cart.calcTotalDiscount(subtotal);
      const total = cart.calcTotal() + shipping;
      const orderId = IdType.create();

      const reservation = await this.inventoryReservationService.reserve({
        orderId: orderId.toString(),
        lines: items.map((item) => ({
          variantId: item.product.id.toString(),
          quantity: item.quantity,
          expectedUnitPrice: item.product.price,
        })),
      });
      if (!reservation.ok) {
        return {
          status: Status.ERROR,
          message: reservation.message,
          code: reservation.code,
        };
      }

      const loyaltyPoints = cart.getLoyaltyRedemptionPoints();
      if (loyaltyPoints > 0) {
        const loyaltyResult = await this.reserveLoyaltyPoints.execute({
          orderId: orderId.toString(),
          userId: input.userId,
          points: loyaltyPoints,
          expiresAt: reservation.reservation.expiresAt,
          createdAt: reservation.reservation.createdAt,
        });
        if (loyaltyResult.status === Status.ERROR) {
          await this.inventoryReservationService
            .release(orderId.toString())
            .catch(() => undefined);
          return loyaltyResult;
        }
      }

      const shippingAddress: OrderAddressSnapshot = {
        label: savedAddress.getLabel(),
        recipient: savedAddress.getRecipient(),
        street: savedAddress.getAddress().street,
        number: savedAddress.getAddress().number,
        complement: savedAddress.getAddress().complement,
        neighborhood: savedAddress.getAddress().neighborhood,
        city: savedAddress.getAddress().city,
        state: savedAddress.getAddress().state,
        zip: savedAddress.getAddress().zip,
      };
      const createdAt = reservation.reservation.createdAt;
      const order = new Order(
        orderId,
        cart.getUserId(),
        cart.getId(),
        items.map(
          (item) =>
            new OrderItem(
              IdType.create(),
              item.product.productId,
              item.product.productName,
              item.product.price,
              item.quantity,
              item.product.id,
            ),
        ),
        subtotal,
        discount,
        shipping,
        total,
        undefined,
        createdAt,
        undefined,
        savedAddress.getAddress().city,
        createdAt,
        reservation.reservation.expiresAt,
        input.idempotencyKey,
        reservation.reservation.id,
        savedAddress.id.toString(),
        shippingAddress,
      );

      try {
        await this.orderRepository.save(
          order,
          new DomainEvent(
            DomainEventName.ORDER_CREATED,
            OrderMapper.toPrimitives(order),
            createdAt,
          ),
        );
      } catch (error) {
        await this.inventoryReservationService
          .release(orderId.toString())
          .catch(() => undefined);
        throw error;
      }

      await this.clearCheckedOutCart(cart, shipping, total);
      return this.success(cart, order, false);
    } catch (error) {
      return handleUnexpectedError(error);
    }
  }

  private async completePendingCartClear(cart: Cart, order: Order): Promise<void> {
    const currentItems = cart.getItems();
    const matchesOrder =
      currentItems.length === order.items.length &&
      currentItems.every((item) => {
        const orderItem = order.items.find(
          (candidate) =>
            candidate.variantId.toString() === item.product.id.toString(),
        );
        return (
          orderItem?.quantity === item.quantity &&
          orderItem.productPrice === item.product.price
        );
      });

    if (matchesOrder) {
      await this.clearCheckedOutCart(cart, order.shipping, order.total);
    }
  }

  private async clearCheckedOutCart(
    cart: Cart,
    shipping: number,
    total: number,
  ): Promise<void> {
    const checkedOutEvent = new DomainEvent(
      DomainEventName.CART_CHECKED_OUT,
      { ...CartMapper.toPrimitives(cart), shipping, total },
      new Date(),
    );
    cart.clear();
    const clearedCartEvent = new DomainEvent(
      DomainEventName.CART_UPDATED,
      CartMapper.toPrimitives(cart),
      new Date(),
    );
    await this.cartRepository.save(cart, [checkedOutEvent, clearedCartEvent]);
  }

  private success(cart: Cart, order: Order, replayed: boolean): SuccessOutput {
    return {
      status: Status.SUCCESS,
      cart: CartMapper.toPrimitives(cart),
      order: OrderMapper.toPrimitives(order),
      subtotal: order.subtotal,
      discount: order.discount,
      shipping: order.shipping,
      total: order.total,
      replayed,
    };
  }
}

interface Input {
  cartId: string;
  userId: string;
  addressId: string;
  idempotencyKey: string;
  shippingQuoteId: string;
}

interface SuccessOutput {
  status: Status.SUCCESS;
  cart: CartPrimitives;
  order: OrderPrimitives;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  replayed: boolean;
}

type Output = SuccessOutput | ErrorOutput;
