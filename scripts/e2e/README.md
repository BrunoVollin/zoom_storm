# Integrated E2E environment

The integrated Cypress suite runs against an isolated infrastructure stack:

- PostgreSQL databases: `cart_e2e`, `products_e2e`, and `notifications_e2e`;
- MongoDB read models: `cart_e2e` and `products_e2e`;
- dedicated Redis, Kafka, and Keycloak containers;
- host application processes on ports `13000`-`13100`, without watch mode;
- Keycloak realm `zoom-storm-e2e`, client `bff-e2e`, and deterministic users.

Run the complete lifecycle with:

```bash
yarn e2e:real
```

The command starts infrastructure, recreates only `_e2e` data, applies all
migrations, seeds products, starts the services, waits for HTTP and consumer
readiness, runs the real Cypress suite, saves logs under `.e2e/artifacts`, and
always removes the Compose stack and its volumes.

For investigation, each step can be run independently:

```bash
yarn e2e:infra:up
yarn e2e:data:prepare
yarn e2e:host:start
yarn e2e:ready
yarn e2e:logs
yarn e2e:down
```

`reset-data.sh` and `down.sh` reject destructive work unless
`ZOOM_STORM_E2E_MARKER=zoom-storm-e2e` is present. The package commands set
that marker where necessary. There is intentionally no HTTP reset endpoint.

Deterministic accounts imported into Keycloak:

| Role | Username | Password |
| --- | --- | --- |
| User | `test_e2e` | `test-e2e-123` |
| Admin | `admin_e2e` | `admin-e2e-123` |
