import dotenv from 'dotenv';

dotenv.config({ path: 'apps/cart-service/.env' });
dotenv.config({
  path: 'apps/cart-projection-worker/.env',
  override: true,
});
