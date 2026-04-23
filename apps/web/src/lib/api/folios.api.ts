import { apiClient } from './client';

export const foliosApi = {
  // Get folios for a reservation
  getByReservation: (reservationId: string) =>
    apiClient.get(`/v1/reservations/${reservationId}/folios`),

  // Create a folio for a reservation
  createForReservation: (reservationId: string, guestId?: string) =>
    apiClient.post(`/v1/reservations/${reservationId}/folios`, { guestId }),

  // Get a single folio with items and payments
  getOne: (id: string) => apiClient.get(`/v1/folios/${id}`),

  // Add a charge item
  addItem: (
    id: string,
    data: {
      description: string;
      quantity?: number;
      unitPrice: number;
      date: string;
      category?: string;
    },
  ) => apiClient.post(`/v1/folios/${id}/items`, data),

  // Void an item
  voidItem: (id: string, itemId: string, reason: string) =>
    apiClient.post(`/v1/folios/${id}/items/${itemId}/void`, { reason }),

  // Add a payment
  addPayment: (
    id: string,
    data: {
      amount: number;
      method: string;
      reference?: string;
      notes?: string;
      date?: string;
      isRefund?: boolean;
    },
  ) => apiClient.post(`/v1/folios/${id}/payments`, data),

  // Void a payment
  voidPayment: (id: string, paymentId: string) =>
    apiClient.post(`/v1/folios/${id}/payments/${paymentId}/void`),

  // Close a folio
  close: (id: string, notes?: string) =>
    apiClient.post(`/v1/folios/${id}/close`, { notes }),

  // Void a folio
  void: (id: string) => apiClient.post(`/v1/folios/${id}/void`),
};
