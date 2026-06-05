import {
  CartDTO,
  CartReadRepository,
} from '../../../../domain/repositories/CartReadRepository';
import { IdType } from '../../../../domain/shared/IdType';
// import { prisma } from "../prisma-connection";

export class PrismaCartReadRepository implements CartReadRepository {
  findById(id: IdType): Promise<CartDTO | null> {
    return new Promise(() => new Object(id));
  }
}
