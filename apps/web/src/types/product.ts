export interface ProductTransport {
  weight: number;
  volume: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  transport: ProductTransport;
}
