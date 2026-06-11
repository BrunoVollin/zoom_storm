import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  http: {
    port: Number(process.env.API_GATEWAY_PORT) || 3333,
  },
  services: {
    cart: process.env.CART_SERVICE_URL || 'http://localhost:3000',
    products: process.env.PRODUCTS_SERVICE_URL || 'http://localhost:3001',
  },
};
