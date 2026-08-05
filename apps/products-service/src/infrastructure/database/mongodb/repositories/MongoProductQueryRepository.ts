import {
  ProductDTO,
  ProductListFilters,
  ProductQueryRepository,
} from '../../../../domain/repositories/ProductQueryRepository';
import { mongoClient } from '../mongodb-connection';

export class MongoProductQueryRepository implements ProductQueryRepository {
  async findAll(filters: ProductListFilters = {}): Promise<ProductDTO[]> {
    const collection = mongoClient.getCollection('products');

    const query: Record<string, unknown> = {};

    if (filters.category) {
      query.category = filters.category;
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      // Price now lives per-variant (see ProductVariant) — match products
      // that have at least one variant inside the requested range.
      const priceFilter: Record<string, number> = {};
      if (filters.minPrice !== undefined) priceFilter.$gte = filters.minPrice;
      if (filters.maxPrice !== undefined) priceFilter.$lte = filters.maxPrice;
      query.variants = { $elemMatch: { price: priceFilter } };
    }

    if (filters.search) {
      const regex = { $regex: filters.search, $options: 'i' };
      query.$or = [{ name: regex }, { description: regex }];
    }

    // MongoDB sorts array fields by their min (asc) / max (desc) element,
    // so sorting by "variants.price" naturally sorts by the cheapest /
    // priciest variant without a separate aggregation pipeline.
    const sortField =
      filters.sortBy === 'price' ? 'variants.price' : filters.sortBy === 'name' ? 'name' : null;
    const sortDirection = filters.sortOrder === 'desc' ? -1 : 1;

    let cursor = collection.find(query);
    if (sortField) cursor = cursor.sort({ [sortField]: sortDirection });

    const docs = await cursor.toArray();

    return docs.map(({ _id, ...productData }) => productData);
  }

  async findById(id: string): Promise<ProductDTO | null> {
    const collection = mongoClient.getCollection('products');
    const doc = await collection.findOne({ id });

    if (!doc) return null;

    const { _id, ...productData } = doc;

    return productData;
  }

  async findDistinctCategories(): Promise<string[]> {
    const collection = mongoClient.getCollection('products');
    const categories = await collection.distinct('category');

    return (categories as unknown[]).filter(
      (c): c is string => typeof c === 'string',
    );
  }
}
