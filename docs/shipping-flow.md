# Flow: Shipping Calculation

## Business goal

Estimate a cart's shipping cost from a supplied distance and the items'
total volume and weight. This is a **read-only** operation (it does not
change the cart, persist anything, or publish an event).

## Route

| Method | Route | Use case |
|--------|-------|----------|
| GET | `/carts/:cartId/shipping?distance=<km>` | `CalculateShippingUseCase` |

Controller: [`CartShippingController`](../apps/cart-service/src/infrastructure/http/controllers/CartShippingController.ts).
Requires `requireAuth`.

## Diagram

```mermaid
flowchart LR
    WEB[apps/web] -->|GET .../shipping?distance| CS[cart-service]
    CS -->|findById cart| PG[(Postgres write model)]
    CS -->|sums item volume+weight| DOM[Domain]
    CS -->|Shipment| CALC[FreightRoadCalculator]
    CALC -->|cost in cents| CS
    CS-->>WEB: 200 { status, shipping }
```

## Step by step

1. [`CartShippingController.calculate`](../apps/cart-service/src/infrastructure/http/controllers/CartShippingController.ts#L10):
   reads `distance` from the query string; `NaN` or `<= 0` → 400 `Invalid distance query param`.
2. [`CalculateShippingUseCase.execute`](../apps/cart-service/src/application/usecases/CalculateShippingUseCase.ts#L14):
   - `cartRepository.findById` + ownership → `Cart not found`.
   - Empty cart (`items.length === 0`) → `ERROR "Cart is empty"`.
   - `totalVolume = Σ item.getVolume()`, `totalWeight = Σ item.getWeight()`.
   - `new Shipment(distance, totalVolume, totalWeight)` →
     `freightCalculator.calculate(shipment)`.
3. [`FreightRoadCalculator.calculate`](../apps/cart-service/src/domain/entities/freight/FreightCalculator.ts):
   ```
   cost = round((BASE_TAX + weight*2 + volume*150 + distance*0.05) * 100)
   ```
   - `BASE_TAX = 12`, `WEIGHT_RATE_PER_KG = 2`, `VOLUME_RATE_PER_M3 = 150`,
     `DISTANCE_RATE_PER_KM = 0.05`, `CENTS_PER_UNIT = 100`.
   - The result is returned **in cents** (multiplied by 100 and rounded).

## Payloads

**Request:** `GET /carts/:cartId/shipping?distance=120`

**Backend response:**
```jsonc
{ "status": "SUCCESS", "shipping": 4260 }   // 4260 cents = $42.60
```

## Edge cases and integration

- Invalid distance → 400; empty cart → 422 `Cart is empty`; another user's
  cart → 422 `Cart not found`.
- The frontend ([`cartService.estimateShipping`](../apps/web/src/services/cart-service.ts#L49))
  and the [`ShippingResponse`](../apps/web/src/types/cart.ts#L29) type both
  read the `shipping` field, matching the backend response — the value stays
  in cents end to end and is rendered through `PriceTag`/`formatPrice`.
- The `shipping` value calculated here is later passed as input to checkout
  (`POST /carts/:cartId/checkout { shipping }`), which only **adds** it to the
  total — it does not recalculate or re-validate it. See
  [checkout-flow.md](./checkout-flow.md).

## External dependencies

- Postgres `zoom` (reads the cart write model). No Kafka/Mongo in this flow.
