export interface ProductQueryRepository {
  findAll(): Promise<ProductDTO[]>;
  findById(id: string): Promise<ProductDTO | null>;
}

export type ProductDTO = object;
