import { LoyaltyAccount } from '@src/domain/entities/loyalty/LoyaltyAccount';
import {
  PaymentAttempt,
  PaymentAttemptStatus,
} from '@src/domain/entities/payment/PaymentAttempt';
import {
  NewCardPaymentMethod,
  PaymentMethod,
  PaymentMethodRequest,
  PaymentMethodType,
  SavedCardPaymentMethod,
} from '@src/domain/entities/payment/PaymentMethod';
import { SavedCard } from '@src/domain/entities/payment/SavedCard';
import { DomainEvent, DomainEventName } from '@src/domain/events/DomainEvent';
import { LoyaltyRepository } from '@src/domain/repositories/LoyaltyRepository';
import { LoyaltyReservationRepository } from '@src/domain/repositories/LoyaltyReservationRepository';
import { LoyaltyReservationStatus } from '@src/domain/entities/loyalty/LoyaltyReservation';
import { OrderRepository } from '@src/domain/repositories/OrderRepository';
import { PaymentAttemptRepository } from '@src/domain/repositories/PaymentAttemptRepository';
import { SavedCardRepository } from '@src/domain/repositories/SavedCardRepository';
import { InventoryReservationService } from '@src/domain/repositories/InventoryReservationService';
import { IdType } from '@src/domain/shared/IdType';
import { ErrorOutput, Status, UseCase } from '../contracts/UseCase';
import { OrderMapper, OrderPrimitives } from '../mappers/OrderMapper';
import {
  PaymentAttemptMapper,
  PaymentAttemptPrimitives,
} from '../mappers/PaymentAttemptMapper';
import { handleUnexpectedError } from '../shared/handleUnexpectedError';
import { ConsumeLoyaltyReservationUseCase } from './ConsumeLoyaltyReservationUseCase';

const CENTS_PER_POINT = 100;

export class PayOrderUseCase implements UseCase<PayOrderInput, Output> {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly loyaltyRepository: LoyaltyRepository,
    private readonly savedCardRepository: SavedCardRepository,
    private readonly paymentAttemptRepository: PaymentAttemptRepository,
    private readonly inventoryReservationService: InventoryReservationService,
    private readonly loyaltyReservationRepository: LoyaltyReservationRepository,
    private readonly consumeLoyaltyReservation: ConsumeLoyaltyReservationUseCase,
  ) {}

  async execute(input: PayOrderInput): Promise<Output> {
    try {
      const userId = IdType.create(input.userId);
      const orderId = IdType.create(input.orderId);
      const order = await this.orderRepository.findById(orderId);

      if (!order || !order.belongsTo(userId)) {
        return { status: Status.ERROR, message: 'Order not found' };
      }

      const existingAttempt = await this.paymentAttemptRepository.findByIdempotencyKey(
        userId,
        input.idempotencyKey,
      );
      const requestMethod = this.toPaymentMethodRequest(input.paymentMethod);

      if (
        existingAttempt &&
        !existingAttempt.matchesRequest(orderId, input.installments, requestMethod)
      ) {
        return {
          status: Status.ERROR,
          message: 'Idempotency key was already used for another payment request',
          code: 'IDEMPOTENCY_CONFLICT',
        };
      }

      if (existingAttempt?.getStatus() === PaymentAttemptStatus.SUCCEEDED) {
        if (!order.isNotifiablePurchase()) {
          throw new Error('Completed payment attempt has an unpaid order');
        }
        return {
          status: Status.SUCCESS,
          order: OrderMapper.toPrimitives(order),
          payment: PaymentAttemptMapper.toPrimitives(existingAttempt),
          replayed: true,
        };
      }

      if (existingAttempt?.getStatus() === PaymentAttemptStatus.FAILED) {
        return {
          status: Status.ERROR,
          message: 'Payment attempt has already failed',
        };
      }

      const resolved = await this.resolvePaymentMethod(input.paymentMethod, userId);
      if ('error' in resolved) return resolved.error;

      const attempt =
        existingAttempt ??
        new PaymentAttempt(
          IdType.create(),
          orderId,
          userId,
          input.idempotencyKey,
          resolved.method,
          input.installments,
        );

      const inventoryConfirmation =
        await this.inventoryReservationService.confirm(orderId.toString());
      if (!inventoryConfirmation.ok) {
        return {
          status: Status.ERROR,
          message: inventoryConfirmation.message,
          code: inventoryConfirmation.code,
        };
      }

      const loyaltyReservation =
        await this.loyaltyReservationRepository.findByOrderId(orderId);
      if (
        loyaltyReservation &&
        loyaltyReservation.getStatus() === LoyaltyReservationStatus.ACTIVE
      ) {
        const consumeResult = await this.consumeLoyaltyReservation.execute({
          orderId: orderId.toString(),
          userId: input.userId,
        });
        if (consumeResult.status === Status.ERROR) {
          return consumeResult;
        }
      }

      order.markAsPaid();

      const statusChangedEvent = new DomainEvent(
        DomainEventName.ORDER_STATUS_CHANGED,
        OrderMapper.toPrimitives(order),
        new Date(),
      );

      const pointsEarned = Math.floor(order.total / CENTS_PER_POINT);
      let loyalty: { account: LoyaltyAccount; points: number } | undefined;

      if (pointsEarned > 0) {
        const account =
          (await this.loyaltyRepository.findByUserId(userId)) ??
          new LoyaltyAccount(userId, 0);
        account.earn(pointsEarned);
        loyalty = { account, points: pointsEarned };
      }

      attempt.succeed();
      await this.paymentAttemptRepository.complete({
        attempt,
        order,
        event: statusChangedEvent,
        loyalty,
        savedCard: resolved.cardToSave,
      });

      return {
        status: Status.SUCCESS,
        order: OrderMapper.toPrimitives(order),
        payment: PaymentAttemptMapper.toPrimitives(attempt),
        replayed: false,
      };
    } catch (error) {
      if (error instanceof Error) {
        return { status: Status.ERROR, message: error.message };
      }
      return handleUnexpectedError(error);
    }
  }

  private toPaymentMethodRequest(input: PaymentMethodInput): PaymentMethodRequest {
    if (input.type === PaymentMethodType.SAVED_CARD) {
      return { type: input.type, savedCardId: input.savedCardId };
    }

    return {
      type: input.type,
      brand: input.brand,
      lastFour: input.lastFour,
      holderName: input.holderName,
      expiry: input.expiry,
      saveCard: input.saveCard,
    };
  }

  private async resolvePaymentMethod(
    input: PaymentMethodInput,
    userId: IdType,
  ): Promise<
    | { method: PaymentMethod; cardToSave?: SavedCard }
    | { error: ErrorOutput }
  > {
    if (input.type === PaymentMethodType.SAVED_CARD) {
      const card = await this.savedCardRepository.findById(
        IdType.create(input.savedCardId),
      );
      if (!card || !card.belongsTo(userId) || card.isExpired()) {
        return {
          error: {
            status: Status.ERROR,
            message: 'Payment method not found',
            code: 'PAYMENT_METHOD_NOT_FOUND',
          },
        };
      }

      const method: SavedCardPaymentMethod = {
        type: PaymentMethodType.SAVED_CARD,
        savedCardId: card.id.toString(),
        brand: card.getBrand(),
        lastFour: card.getLastFour(),
        holderName: card.getHolderName(),
        expiry: card.getExpiry(),
      };
      return { method };
    }

    if (!input.token.trim()) throw new Error('Payment token is required');

    const method: NewCardPaymentMethod = {
      type: PaymentMethodType.NEW_CARD,
      brand: input.brand,
      lastFour: input.lastFour,
      holderName: input.holderName,
      expiry: input.expiry,
      saveCard: input.saveCard,
    };

    const validationCard = new SavedCard(
      IdType.create(),
      userId,
      input.brand,
      input.lastFour,
      input.holderName,
      input.expiry,
    );
    if (validationCard.isExpired()) {
      throw new Error('Card is expired');
    }

    if (!input.saveCard) return { method };

    const existingCards = await this.savedCardRepository.findByUserId(userId);
    const cardToSave = new SavedCard(
      validationCard.id,
      userId,
      input.brand,
      input.lastFour,
      input.holderName,
      input.expiry,
      validationCard.createdAt,
      existingCards.length === 0,
    );
    return { method, cardToSave };
  }
}

export interface SavedCardPaymentInput {
  type: PaymentMethodType.SAVED_CARD;
  savedCardId: string;
}

export interface NewCardPaymentInput {
  type: PaymentMethodType.NEW_CARD;
  token: string;
  brand: string;
  lastFour: string;
  holderName: string;
  expiry: string;
  saveCard: boolean;
}

export type PaymentMethodInput = SavedCardPaymentInput | NewCardPaymentInput;

export interface PayOrderInput {
  orderId: string;
  userId: string;
  idempotencyKey: string;
  installments: number;
  paymentMethod: PaymentMethodInput;
}

interface SuccessOutput {
  status: Status.SUCCESS;
  order: OrderPrimitives;
  payment: PaymentAttemptPrimitives;
  replayed: boolean;
}

type Output = SuccessOutput | ErrorOutput;
