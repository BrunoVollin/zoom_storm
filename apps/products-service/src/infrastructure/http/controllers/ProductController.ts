import type { Context } from 'hono';

export class ProductController {
  async hello(c: Context) {
    return c.json({ message: 'hello' }, 200);
  }
}
