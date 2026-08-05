import { Order, STATUS_PROGRESSION } from '../../../../domain/entities/order/Order';
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
          originCity: order.getOriginCity(),
          destinationCity: order.destinationCity,
          items: {
            create: order.items.map((item) => ({
              id: item.id.toString(),
              productId: item.productId.toString(),
              productName: item.productName,
              productPrice: item.productPrice,
              quantity: item.quantity,
            })),
          },
        },
        update: {
          status: order.getStatus(),
          originCity: order.getOriginCity(),
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

  async findInProgress(): Promise<Array<Order>> {
    const lastStatus = STATUS_PROGRESSION[STATUS_PROGRESSION.length - 1];
    const firstStatus = STATUS_PROGRESSION[0];

    const dbOrders = await prisma.order.findMany({
      where: {
        status: {
          notIn: [firstStatus, lastStatus],
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
    );
  }
}
