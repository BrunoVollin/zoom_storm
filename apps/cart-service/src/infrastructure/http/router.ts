import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { readFileSync } from 'fs';
import { join } from 'path';
import { CartQuery } from '@application/Queries/CartQuery';
import { CreateCartUseCase } from '@application/usecases/CreateCartUseCase';
import { AddItemToCartUseCase } from '@application/usecases/AddItemToCartUseCase';
import { RemoveItemFromCartUseCase } from '@application/usecases/RemoveItemFromCartUseCase';
import { UpdateItemQuantityUseCase } from '@application/usecases/UpdateItemQuantityUseCase';
import { ApplyCouponUseCase } from '@application/usecases/ApplyCouponUseCase';
import { RemoveCouponUseCase } from '@application/usecases/RemoveCouponUseCase';
import { CalculateShippingUseCase } from '@application/usecases/CalculateShippingUseCase';
import { CheckoutUseCase } from '@application/usecases/CheckoutUseCase';
import { ListOrdersQuery } from '@application/Queries/ListOrdersQuery';
import { OrderQuery } from '@application/Queries/OrderQuery';
import { UpdateOrderStatusUseCase } from '@application/usecases/UpdateOrderStatusUseCase';
import { PayOrderUseCase } from '@application/usecases/PayOrderUseCase';
import { ListWishlistQuery } from '@application/Queries/ListWishlistQuery';
import { AddToWishlistUseCase } from '@application/usecases/AddToWishlistUseCase';
import { RemoveFromWishlistUseCase } from '@application/usecases/RemoveFromWishlistUseCase';
import { GetLoyaltyBalanceQuery } from '@application/Queries/GetLoyaltyBalanceQuery';
import { RedeemLoyaltyPointsUseCase } from '@application/usecases/RedeemLoyaltyPointsUseCase';
import { GetUserProfileQuery } from '@application/Queries/GetUserProfileQuery';
import { UpdateUserProfileUseCase } from '@application/usecases/UpdateUserProfileUseCase';
import { ListSavedCardsQuery } from '@application/Queries/ListSavedCardsQuery';
import { AddSavedCardUseCase } from '@application/usecases/AddSavedCardUseCase';
import { DeleteSavedCardUseCase } from '@application/usecases/DeleteSavedCardUseCase';
import { LookupCepQuery } from '@application/Queries/LookupCepQuery';
import { ListCouponsUseCase } from '@application/usecases/ListCouponsUseCase';
import { CreateCouponUseCase } from '@application/usecases/CreateCouponUseCase';
import { UpdateCouponUseCase } from '@application/usecases/UpdateCouponUseCase';
import { DeleteCouponUseCase } from '@application/usecases/DeleteCouponUseCase';
import { CartController } from './controllers/CartController';
import { CartItemController } from './controllers/CartItemController';
import { CartCouponController } from './controllers/CartCouponController';
import { AdminCouponController } from './controllers/AdminCouponController';
import { CartShippingController } from './controllers/CartShippingController';
import { CartCheckoutController } from './controllers/CartCheckoutController';
import { OrderController } from './controllers/OrderController';
import { WishlistController } from './controllers/WishlistController';
import { LoyaltyController } from './controllers/LoyaltyController';
import { UserProfileController } from './controllers/UserProfileController';
import { SavedCardController } from './controllers/SavedCardController';
import { CepLookupController } from './controllers/CepLookupController';
import { requireAuth } from './middlewares/requireAuthMiddleware';
import { requireAdmin } from './middlewares/requireAdminMiddleware';

interface Dependencies {
  getCart: CartQuery;
  createCart: CreateCartUseCase;
  addItemToCart: AddItemToCartUseCase;
  removeItemFromCart: RemoveItemFromCartUseCase;
  updateItemQuantity: UpdateItemQuantityUseCase;
  applyCoupon: ApplyCouponUseCase;
  removeCoupon: RemoveCouponUseCase;
  calculateShipping: CalculateShippingUseCase;
  checkout: CheckoutUseCase;
  listOrders: ListOrdersQuery;
  getOrder: OrderQuery;
  updateOrderStatus: UpdateOrderStatusUseCase;
  payOrder: PayOrderUseCase;
  listWishlist: ListWishlistQuery;
  addToWishlist: AddToWishlistUseCase;
  removeFromWishlist: RemoveFromWishlistUseCase;
  getLoyaltyBalance: GetLoyaltyBalanceQuery;
  redeemLoyaltyPoints: RedeemLoyaltyPointsUseCase;
  getUserProfile: GetUserProfileQuery;
  updateUserProfile: UpdateUserProfileUseCase;
  listSavedCards: ListSavedCardsQuery;
  addSavedCard: AddSavedCardUseCase;
  deleteSavedCard: DeleteSavedCardUseCase;
  lookupCep: LookupCepQuery;
  listCoupons: ListCouponsUseCase;
  createCoupon: CreateCouponUseCase;
  updateCoupon: UpdateCouponUseCase;
  deleteCoupon: DeleteCouponUseCase;
}

const openapiSpec = readFileSync(
  join(__dirname, '../../../openapi.yml'),
  'utf-8',
);

const docsHtml = readFileSync(join(__dirname, 'static/docs.html'), 'utf-8');

export function buildRouter(deps: Dependencies): Hono {
  const app = new Hono();

  app.use('*', cors());

  const cart = new CartController(deps.getCart, deps.createCart);
  const cartItem = new CartItemController(
    deps.addItemToCart,
    deps.removeItemFromCart,
    deps.updateItemQuantity,
  );
  const cartCoupon = new CartCouponController(
    deps.applyCoupon,
    deps.removeCoupon,
  );
  const cartShipping = new CartShippingController(deps.calculateShipping);
  const cartCheckout = new CartCheckoutController(deps.checkout);
  const order = new OrderController(
    deps.listOrders,
    deps.getOrder,
    deps.updateOrderStatus,
    deps.payOrder,
  );
  const wishlist = new WishlistController(
    deps.listWishlist,
    deps.addToWishlist,
    deps.removeFromWishlist,
  );
  const loyalty = new LoyaltyController(
    deps.getLoyaltyBalance,
    deps.redeemLoyaltyPoints,
  );
  const userProfile = new UserProfileController(
    deps.getUserProfile,
    deps.updateUserProfile,
  );
  const savedCard = new SavedCardController(
    deps.listSavedCards,
    deps.addSavedCard,
    deps.deleteSavedCard,
  );
  const cepLookup = new CepLookupController(deps.lookupCep);
  const adminCoupon = new AdminCouponController(
    deps.listCoupons,
    deps.createCoupon,
    deps.updateCoupon,
    deps.deleteCoupon,
  );

  app.get('/openapi.yml', (c) =>
    c.text(openapiSpec, 200, { 'Content-Type': 'application/yaml' }),
  );

  app.get('/docs', (c) => c.html(docsHtml));

  app.use('/carts', requireAuth);
  app.use('/carts/*', requireAuth);

  app.get('/carts/:cartId', (c) => cart.getById(c));
  app.post('/carts', (c) => cart.create(c));

  app.post('/carts/:cartId/items', (c) => cartItem.add(c));
  app.delete('/carts/:cartId/items/:itemId', (c) => cartItem.remove(c));
  app.patch('/carts/:cartId/items/:itemId', (c) => cartItem.updateQuantity(c));

  app.post('/carts/:cartId/coupons', (c) => cartCoupon.apply(c));
  app.delete('/carts/:cartId/coupons/:couponId', (c) => cartCoupon.remove(c));

  app.get('/carts/:cartId/shipping', (c) => cartShipping.calculate(c));

  app.post('/carts/:cartId/checkout', (c) => cartCheckout.handle(c));

  app.use('/orders', requireAuth);
  app.use('/orders/*', requireAuth);

  app.get('/orders', (c) => order.list(c));
  app.get('/orders/:orderId', (c) => order.getById(c));
  app.patch('/orders/:orderId/status', requireAdmin, (c) => order.updateStatus(c));
  app.post('/orders/:orderId/pay', (c) => order.pay(c));

  app.use('/wishlist', requireAuth);
  app.use('/wishlist/*', requireAuth);

  app.get('/wishlist', (c) => wishlist.list(c));
  app.post('/wishlist', (c) => wishlist.add(c));
  app.delete('/wishlist/:productId', (c) => wishlist.remove(c));

  app.use('/loyalty', requireAuth);
  app.use('/loyalty/*', requireAuth);

  app.get('/loyalty/balance', (c) => loyalty.balance(c));
  app.post('/carts/:cartId/loyalty/redeem', (c) => loyalty.redeem(c));

  app.use('/profile', requireAuth);
  app.use('/profile/*', requireAuth);

  app.get('/profile', (c) => userProfile.get(c));
  app.put('/profile', (c) => userProfile.update(c));

  app.get('/profile/cards', (c) => savedCard.list(c));
  app.post('/profile/cards', (c) => savedCard.add(c));
  app.delete('/profile/cards/:cardId', (c) => savedCard.remove(c));

  app.use('/cep', requireAuth);
  app.use('/cep/*', requireAuth);

  app.get('/cep/:cep', (c) => cepLookup.lookup(c));

  app.get('/admin/coupons', requireAdmin, (c) => adminCoupon.list(c));
  app.post('/admin/coupons', requireAdmin, (c) => adminCoupon.create(c));
  app.put('/admin/coupons/:id', requireAdmin, (c) => adminCoupon.update(c));
  app.delete('/admin/coupons/:id', requireAdmin, (c) => adminCoupon.delete(c));

  return app;
}
