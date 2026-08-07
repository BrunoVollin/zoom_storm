import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ProductController } from './controllers/ProductController';
import { FlashOfferController } from './controllers/FlashOfferController';
import { InventoryReservationController } from './controllers/InventoryReservationController';
import { ListProductsQuery } from '../../application/queries/ListProductsQuery';
import { GetProductByIdQuery } from '../../application/queries/GetProductByIdQuery';
import { ListCategoriesQuery } from '../../application/queries/ListCategoriesQuery';
import { ListActiveFlashOffersQuery } from '../../application/queries/ListActiveFlashOffersQuery';
import { ListFlashOffersQuery } from '../../application/queries/ListFlashOffersQuery';
import { CreateProductUseCase } from '../../application/usecases/CreateProductUseCase';
import { UpdateProductUseCase } from '../../application/usecases/UpdateProductUseCase';
import { DeleteProductUseCase } from '../../application/usecases/DeleteProductUseCase';
import { CreateProductVariantUseCase } from '../../application/usecases/CreateProductVariantUseCase';
import { UpdateProductVariantUseCase } from '../../application/usecases/UpdateProductVariantUseCase';
import { DeleteProductVariantUseCase } from '../../application/usecases/DeleteProductVariantUseCase';
import { CreateReviewUseCase } from '../../application/usecases/CreateReviewUseCase';
import { CreateFlashOfferUseCase } from '../../application/usecases/CreateFlashOfferUseCase';
import { UpdateFlashOfferUseCase } from '../../application/usecases/UpdateFlashOfferUseCase';
import { DeleteFlashOfferUseCase } from '../../application/usecases/DeleteFlashOfferUseCase';
import { requireAdmin } from './middlewares/requireAdminMiddleware';
import { requireAuth } from './middlewares/requireAuthMiddleware';
import { requireInternalService } from './middlewares/requireInternalServiceMiddleware';
import { ReserveInventoryUseCase } from '../../application/usecases/ReserveInventoryUseCase';
import { ConfirmInventoryReservationUseCase } from '../../application/usecases/ConfirmInventoryReservationUseCase';
import { ReleaseInventoryReservationUseCase } from '../../application/usecases/ReleaseInventoryReservationUseCase';
import { GetInventoryReservationUseCase } from '../../application/usecases/GetInventoryReservationUseCase';

interface Dependencies {
  listProducts: ListProductsQuery;
  getProductById: GetProductByIdQuery;
  listCategories: ListCategoriesQuery;
  createProduct: CreateProductUseCase;
  updateProduct: UpdateProductUseCase;
  deleteProduct: DeleteProductUseCase;
  createProductVariant: CreateProductVariantUseCase;
  updateProductVariant: UpdateProductVariantUseCase;
  deleteProductVariant: DeleteProductVariantUseCase;
  createReview: CreateReviewUseCase;
  listActiveFlashOffers: ListActiveFlashOffersQuery;
  listFlashOffers: ListFlashOffersQuery;
  createFlashOffer: CreateFlashOfferUseCase;
  updateFlashOffer: UpdateFlashOfferUseCase;
  deleteFlashOffer: DeleteFlashOfferUseCase;
  reserveInventory: ReserveInventoryUseCase;
  confirmInventory: ConfirmInventoryReservationUseCase;
  releaseInventory: ReleaseInventoryReservationUseCase;
  getInventoryReservation: GetInventoryReservationUseCase;
}

const openapiSpec = readFileSync(
  join(__dirname, '../../../openapi.yml'),
  'utf-8',
);

export function buildRouter(deps: Dependencies): Hono {
  const app = new Hono();

  app.use('*', cors());

  const product = new ProductController(
    deps.listProducts,
    deps.getProductById,
    deps.listCategories,
    deps.createProduct,
    deps.updateProduct,
    deps.deleteProduct,
    deps.createProductVariant,
    deps.updateProductVariant,
    deps.deleteProductVariant,
    deps.createReview,
  );

  const flashOffer = new FlashOfferController(
    deps.listActiveFlashOffers,
    deps.listFlashOffers,
    deps.createFlashOffer,
    deps.updateFlashOffer,
    deps.deleteFlashOffer,
  );

  const inventory = new InventoryReservationController(
    deps.reserveInventory,
    deps.confirmInventory,
    deps.releaseInventory,
    deps.getInventoryReservation,
  );

  app.get('/openapi.yml', (c) =>
    c.text(openapiSpec, 200, { 'Content-Type': 'application/yaml' }),
  );

  app.get('/docs', (c) =>
    c.html(`<!DOCTYPE html>
<html>
  <head>
    <title>Products Service API</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
    <script>
      SwaggerUIBundle({ url: 'openapi.yml', dom_id: '#swagger-ui' });
    </script>
  </body>
</html>`),
  );

  app.get('/hello', (c) => product.hello(c));
  app.get('/products/categories', (c) => product.listCategories(c));
  app.get('/products', (c) => product.list(c));
  app.get('/products/:id', (c) => product.getById(c));
  app.post('/products', requireAdmin, (c) => product.create(c));
  app.put('/products/:id', requireAdmin, (c) => product.update(c));
  app.delete('/products/:id', requireAdmin, (c) => product.delete(c));
  app.post('/products/:id/variants', requireAdmin, (c) => product.createVariant(c));
  app.put('/products/:id/variants/:variantId', requireAdmin, (c) => product.updateVariant(c));
  app.delete('/products/:id/variants/:variantId', requireAdmin, (c) => product.deleteVariant(c));
  app.post('/products/:id/reviews', requireAuth, (c) => product.createReview(c));

  app.get('/flash-offers/active', (c) => flashOffer.listActive(c));
  app.get('/flash-offers', requireAdmin, (c) => flashOffer.list(c));
  app.post('/flash-offers', requireAdmin, (c) => flashOffer.create(c));
  app.put('/flash-offers/:id', requireAdmin, (c) => flashOffer.update(c));
  app.delete('/flash-offers/:id', requireAdmin, (c) => flashOffer.delete(c));

  app.post('/internal/inventory/reservations', requireInternalService, (c) =>
    inventory.reserve(c),
  );
  app.get(
    '/internal/inventory/reservations/:orderId',
    requireInternalService,
    (c) => inventory.get(c),
  );
  app.post(
    '/internal/inventory/reservations/:orderId/confirm',
    requireInternalService,
    (c) => inventory.confirm(c),
  );
  app.post(
    '/internal/inventory/reservations/:orderId/release',
    requireInternalService,
    (c) => inventory.release(c),
  );

  return app;
}
