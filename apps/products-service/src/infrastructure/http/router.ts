import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ProductController } from './controllers/ProductController';
import { ListProductsQuery } from '../../application/queries/ListProductsQuery';
import { CreateProductUseCase } from '../../application/usecases/CreateProductUseCase';
import { UpdateProductUseCase } from '../../application/usecases/UpdateProductUseCase';
import { DeleteProductUseCase } from '../../application/usecases/DeleteProductUseCase';
import { requireAdmin } from './middlewares/requireAdminMiddleware';

interface Dependencies {
  listProducts: ListProductsQuery;
  createProduct: CreateProductUseCase;
  updateProduct: UpdateProductUseCase;
  deleteProduct: DeleteProductUseCase;
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
    deps.createProduct,
    deps.updateProduct,
    deps.deleteProduct,
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
  app.get('/products', (c) => product.list(c));
  app.post('/products', requireAdmin, (c) => product.create(c));
  app.put('/products/:id', requireAdmin, (c) => product.update(c));
  app.delete('/products/:id', requireAdmin, (c) => product.delete(c));

  return app;
}
