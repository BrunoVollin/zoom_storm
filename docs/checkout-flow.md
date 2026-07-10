# Flow: Checkout

## Business goal

Finalize the cart: compute the final total (subtotal − discount + shipping),
emit the checkout event, record an order, and empty the cart. This is the
store's conversion flow.

## Route

| Method | Route | Use case |
|--------|-------|----------|
| POST | `/carts/:cartId/checkout` | `CheckoutUseCase` |

Controller: [`CartCheckoutController`](../apps/cart-service/src/infrastructure/http/controllers/CartCheckoutController.ts).
Requires `requireAuth`.

## Diagram

```mermaid
sequenceDiagram
    participant WEB as apps/web (useCart.checkout)
    participant CS as cart-service
    participant PG as Postgres write model
    participant RELAY as OutboxRelay
    participant K as Kafka cart-events / checkout-events
    participant CPROJ as cart-projection
    participant MCART as Mongo zoom-cart.cart
    participant MORDERS as Mongo zoom-cart.orders

    WEB->>CS: POST /carts/:id/checkout { shipping }
    CS->>PG: findById(cart) + ownership
    CS->>CS: calcSubtotal/discount/total; finalTotal = total + shipping
    CS->>CS: cart.clear()
    CS->>PG: save(cart, [checked_out event, updated event]) [tx + outbox]
    CS-->>WEB: 200 { status, cart, subtotal, discount, shipping, total }
    RELAY->>PG: poll unpublished OutboxEvent
    RELAY->>K: publish cart.checked_out (checkout-events) + cart.updated (cart-events)
    K->>CPROJ: checkout-events -> record order
    CPROJ->>MORDERS: save order
    K->>CPROJ: cart-events (cart.updated) -> replaceOne
    CPROJ->>MCART: upsert empty cart into read model
```

## Step by step

[`CheckoutUseCase.execute`](../apps/cart-service/src/application/usecases/CheckoutUseCase.ts):
1. `cartRepository.findById(cartId)`; missing / belonging to another user → `Cart not found`.
2. `items.length === 0` → `ERROR "Cart is empty"`.
3. Computes `subtotal = cart.calcSubtotal()`, `discount = cart.calcTotalDiscount(subtotal)`,
   `total = cart.calcTotal()`, `shipping = input.shipping`, `finalTotal = total + shipping`.
4. Builds the `DomainEvent(CART_CHECKED_OUT, { ...CartMapper.toPrimitives(cart), shipping, total: finalTotal }, now)`
   snapshot **before** clearing the cart.
5. `cart.clear()` (empties items and coupons).
6. Builds a second `DomainEvent(CART_UPDATED, CartMapper.toPrimitives(cart), now)`
   with the now-empty cart.
7. `cartRepository.save(cart, [checkedOutEvent, clearedCartEvent])` — persists
   the emptied cart and writes **both** outbox rows in the same transaction.
8. Returns `{ status, cart, subtotal, discount, shipping, total: finalTotal }`.

Persisting the cleared cart happens before either event is delivered (the
outbox rows are written in the same transaction as the domain state change),
so there is no window where a checkout is announced but the cart write model
still shows it as full.

## Event delivery and downstream consumers

- The [`OutboxRelay`](../apps/cart-service/src/infrastructure/messaging/OutboxRelay.ts)
  delivers `cart.checked_out` to **`checkout-events`** and `cart.updated` to
  **`cart-events`**.
- [`cart-projection`](../apps/cart-projection/index.ts) now subscribes to
  **both** topics (`CART_PROJECTION_KAFKA_TOPICS=cart-events,checkout-events`):
  - `cart-events` (`cart.updated`) → upserts the emptied cart into Mongo
    `zoom-cart`.`cart`, so a `GET /carts/:id` right after checkout reflects
    the empty cart once the projection has caught up.
  - `checkout-events` (`cart.checked_out`) → handled specially in
    [`CartSavedHandler`](../apps/cart-projection/src/handlers/cart-saved.handler.ts):
    the payload is written as an order record via
    [`OrderRepository`](../apps/cart-projection/src/repository/order.repository.ts)
    into the `orders` collection in Mongo `zoom-cart`, keyed by `cartId` +
    `occurredAt`.

## Payloads

**Request:**
```jsonc
{ "shipping": 4260 }
```

**Event (`checkout-events`, `cart.checked_out`):**
```jsonc
{
  "name": "cart.checked_out",
  "occurredAt": "2026-07-09T...Z",
  "payload": {
    "id": "cartId", "userId": "userId",
    "items": [ /* items before clearing */ ],
    "coupons": [ ... ],
    "subtotal": 399.8, "totalDiscount": 40.0,
    "shipping": 4260, "total": 4359.8
  }
}
```

**Order record (Mongo `zoom-cart`.`orders`):** the same payload plus
`cartId` and `occurredAt`.

**Response:** `200 { "status": "SUCCESS", "cart": <empty cart>, "subtotal", "discount", "shipping", "total" }`.

## Error handling and edge cases

- Empty / missing / another user's cart → 422.
- **Shipping is added without re-validation**: `shipping` comes from the
  client and is only added to the total; there is no re-check against
  `CalculateShippingUseCase`. Since shipping is expressed in cents end to end
  (see [shipping-flow.md](./shipping-flow.md)), the arithmetic stays
  consistent, but nothing stops the client from sending an arbitrary value.
- **No explicit optimistic lock message for the clear**: `save(cart, events)`
  still goes through the `updateMany where { version }` path; a concurrent
  write can throw `ConcurrencyConflictError`, which is now mapped to HTTP 409
  (see [manage-cart-items-flow.md](./manage-cart-items-flow.md)).

## Frontend

- [`useCart.checkout`](../apps/web/src/hooks/use-cart.ts#L110) calls
  `cartService.checkout(cartId, shipping)`; on `"Cart not found"` it clears
  `localStorage`. `onSuccess` calls `setCart` with the (now empty) cart
  returned in the response.

## External dependencies

- Postgres `zoom` (write model + outbox), Kafka `checkout-events` and
  `cart-events`, Mongo `zoom-cart` (`cart` and `orders` collections, both
  updated by `cart-projection`).
