import dotenv from 'dotenv';

dotenv.config();

export const env = {
  http: {
    port: Number(process.env.PRODUCTS_SERVICE_PORT) || 3001,
  },
};
