export interface ProductListFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sortBy?: 'price' | 'name';
  sortOrder?: 'asc' | 'desc';
}

export interface ProductQueryRepository {
  findAll(filters?: ProductListFilters): Promise<ProductDTO[]>;
  findById(id: string): Promise<ProductDTO | null>;
  findDistinctCategories(): Promise<string[]>;
}

export type ProductDTO = object;
