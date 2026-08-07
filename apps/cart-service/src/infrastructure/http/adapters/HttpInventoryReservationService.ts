import {
  InventoryReservationErrorCode,
  InventoryReservationResult,
  InventoryReservationService,
} from '../../../domain/repositories/InventoryReservationService';

interface InventoryApiResponse {
  status?: string;
  code?: string;
  message?: string;
  reservation?: {
    id: string;
    orderId: string;
    status: 'ACTIVE' | 'CONFIRMED' | 'RELEASED' | 'EXPIRED';
    lines: Array<{
      variantId: string;
      quantity: number;
      expectedUnitPrice: number;
    }>;
    createdAt: string;
    expiresAt: string;
    updatedAt: string;
  };
}

export class HttpInventoryReservationService
  implements InventoryReservationService
{
  constructor(
    private readonly productsServiceUrl: string,
    private readonly internalServiceToken: string,
  ) {
    if (!productsServiceUrl.trim()) {
      throw new Error('PRODUCTS_SERVICE_URL is required');
    }
    if (!internalServiceToken.trim()) {
      throw new Error('INTERNAL_SERVICE_TOKEN is required');
    }
  }

  reserve(
    input: Parameters<InventoryReservationService['reserve']>[0],
  ): Promise<InventoryReservationResult> {
    return this.request('/internal/inventory/reservations', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  confirm(orderId: string): Promise<InventoryReservationResult> {
    return this.request(
      `/internal/inventory/reservations/${encodeURIComponent(orderId)}/confirm`,
      { method: 'POST' },
    );
  }

  release(orderId: string): Promise<InventoryReservationResult> {
    return this.request(
      `/internal/inventory/reservations/${encodeURIComponent(orderId)}/release`,
      { method: 'POST' },
    );
  }

  private async request(
    path: string,
    init: RequestInit,
  ): Promise<InventoryReservationResult> {
    const response = await fetch(
      `${this.productsServiceUrl.replace(/\/$/, '')}${path}`,
      {
        ...init,
        headers: {
          'content-type': 'application/json',
          'x-internal-service-token': this.internalServiceToken,
          ...init.headers,
        },
      },
    );
    const body = (await response.json()) as InventoryApiResponse;

    if (response.ok && body.status === 'SUCCESS' && body.reservation) {
      return {
        ok: true,
        reservation: {
          ...body.reservation,
          createdAt: new Date(body.reservation.createdAt),
          expiresAt: new Date(body.reservation.expiresAt),
          updatedAt: new Date(body.reservation.updatedAt),
        },
      };
    }

    return {
      ok: false,
      code: (body.code ?? 'INVENTORY_CONFLICT') as InventoryReservationErrorCode,
      message: body.message ?? 'Inventory service rejected the request',
    };
  }
}
