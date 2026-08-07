import { Order } from '../../../../domain/entities/order/Order';
import { OrderAddressSnapshot } from '../../../../domain/entities/order/Order';
import { OrderItem } from '../../../../domain/entities/order/OrderItem';
import { OrderStatus } from '../../../../domain/entities/order/OrderStatus';
import { IdType } from '../../../../domain/shared/IdType';
import { OrderRepository } from '../../../../domain/repositories/OrderRepository';
import { DomainEvent } from '../../../../domain/events/DomainEvent';
import { prisma } from '../prisma-connection';
import { Prisma } from '../../../../generated/prisma/client';

type OrderWithItems = Prisma.OrderGetPayload<{ include: { items: true } }>;

export class PrismaOrderRepository implements OrderRepository {
  async save(
    order: Order,
    events?: DomainEvent | Array<DomainEvent>,
  ): Promise<void> {
    const orderId = order.id.toString();
    const eventList = events ? [events].flat() : [];

    await prisma.$transaction(async (tx) => {
      await tx.order.upsert({
        where: { id: orderId },
        create: {
          id: orderId,
          userId: order.userId.toString(),
          cartId: order.cartId.toString(),
          subtotal: order.subtotal,
          discount: order.discount,
          shipping: order.shipping,
          total: order.total,
          status: order.getStatus(),
          expiresAt: order.expiresAt,
          originCity: order.getOriginCity(),
          destinationCity: order.destinationCity,
          checkoutIdempotencyKey:
            order.checkoutIdempotencyKey ?? `legacy-${orderId}`,
          inventoryReservationId:
            order.inventoryReservationId ?? `legacy-${orderId}`,
          savedAddressId: order.savedAddressId ?? 'legacy-address',
          shippingAddress: (order.shippingAddress ?? {
            label: 'Legacy',
            recipient: '',
            street: '',
            number: '',
            complement: null,
            neighborhood: '',
            city: order.destinationCity ?? '',
            state: '',
            zip: '',
          }) as Prisma.InputJsonValue,
          items: {
            create: order.items.map((item) => ({
              id: item.id.toString(),
              productId: item.productId.toString(),
              variantId: item.variantId.toString(),
              productName: item.productName,
              productPrice: item.productPrice,
              quantity: item.quantity,
            })),
          },
        },
        update: {
          status: order.getStatus(),
          originCity: order.getOriginCity(),
          expiresAt: order.expiresAt,
        },
      });

      for (const event of eventList) {
        await tx.outboxEvent.create({
          data: {
            eventType: event.name,
            payload: event.payload as Prisma.InputJsonValue,
            occurredAt: event.occurredAt,
          },
        });
      }
    });
  }

  async findById(id: IdType): Promise<Order | null> {
    const dbOrder = await prisma.order.findUnique({
      where: { id: id.toString() },
      include: { items: true },
    });

    if (!dbOrder) return null;

    return this.toDomain(dbOrder);
  }

  async findByUserId(userId: IdType): Promise<Array<Order>> {
    const dbOrders = await prisma.order.findMany({
      where: { userId: userId.toString() },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });

    return dbOrders.map((dbOrder) => this.toDomain(dbOrder));
  }

  async findByCheckoutIdempotencyKey(
    userId: IdType,
    key: string,
  ): Promise<Order | null> {
    const dbOrder = await prisma.order.findUnique({
      where: {
        userId_checkoutIdempotencyKey: {
          userId: userId.toString(),
          checkoutIdempotencyKey: key,
        },
      },
      include: { items: true },
    });

    return dbOrder ? this.toDomain(dbOrder) : null;
  }

  async findAwaitingPaymentExpiredAtOrBefore(
    at: Date,
  ): Promise<Array<Order>> {
    const dbOrders = await prisma.order.findMany({
      where: { status: OrderStatus.CREATED, expiresAt: { lte: at } },
      include: { items: true },
    });

    return dbOrders.map((dbOrder) => this.toDomain(dbOrder));
  }

  async findInProgress(): Promise<Array<Order>> {
    const dbOrders = await prisma.order.findMany({
      where: {
        status: {
          in: [
            OrderStatus.PAID,
            OrderStatus.IN_TRANSIT,
            OrderStatus.OUT_FOR_DELIVERY,
          ],
        },
      },
      include: { items: true },
    });

    return dbOrders.map((dbOrder) => this.toDomain(dbOrder));
  }

  private toDomain(dbOrder: OrderWithItems): Order {
    const items = dbOrder.items.map(
      (item) =>
        new OrderItem(
          IdType.create(item.id),
          IdType.create(item.productId),
          item.productName,
          item.productPrice,
          item.quantity,
          IdType.create(item.variantId),
        ),
    );

    return new Order(
      IdType.create(dbOrder.id),
      IdType.create(dbOrder.userId),
      IdType.create(dbOrder.cartId),
      items,
      dbOrder.subtotal,
      dbOrder.discount,
      dbOrder.shipping,
      dbOrder.total,
      dbOrder.status as OrderStatus,
      dbOrder.createdAt,
      dbOrder.originCity,
      dbOrder.destinationCity,
      dbOrder.updatedAt,
      dbOrder.expiresAt,
      dbOrder.checkoutIdempotencyKey,
      dbOrder.inventoryReservationId,
      dbOrder.savedAddressId,
      dbOrder.shippingAddress as unknown as OrderAddressSnapshot,
    );
  }
}
