import { IdType } from '../shared/IdType';

export interface CartQueryRepository {
  findById(id: IdType): Promise<CartDTO | null>;
}

export type CartDTO = object;
