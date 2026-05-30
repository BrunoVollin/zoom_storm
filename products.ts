// Interface for flexible technical specifications
export interface ITechnicalSpec {
  material?: string;
  warranty_months?: number;
  country_of_origin?: string;
  [key: string]: any; // Allows dynamic custom fields
}

// Interface for Product Images
export interface IProductImage {
  id?: number;
  image_url: string;
  display_order: number;
  is_main: boolean;
}

// Interface for Variants (The physical SKU in inventory)
export interface IProductVariant {
  id?: number;
  product_id?: number;
  sku: string;
  barcode_ean?: string;
  color?: string;
  size_voltage_flavor?: string;
  cost_price?: number; // Usually hidden on the frontend for security
  sale_price: number;
  promotional_price?: number;
  stock_quantity: number;
  weight_grams: number;
  height_cm: number;
  width_cm: number;
  depth_cm: number;
}

// Main Combined Product Interface
export interface IProduct {
  id?: number;
  name: string;
  brand?: string;
  short_description?: string;
  detailed_description?: string;
  category: string;
  subcategory?: string;
  meta_title?: string;
  meta_description?: string;
  tags: string[];
  technical_spec?: ITechnicalSpec;
  variants: IProductVariant[];
  images: IProductImage[];
  created_at?: Date;
  updated_at?: Date;
}
