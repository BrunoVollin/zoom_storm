export interface ProductQueryRepository {
  findAll(): Promise<ProductDTO[]>;
}

export type ProductDTO = object;
