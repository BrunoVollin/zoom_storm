import { IdType } from '../shared/IdType';

export interface CartReadRepository {
  findById(id: IdType): Promise<CartDTO | null>;
}

export type CartDTO = object;
