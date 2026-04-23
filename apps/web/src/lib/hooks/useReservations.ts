import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reservationsApi } from '@/lib/api/reservations.api';
import { unwrapApiData, unwrapPaginatedApiData } from '@/lib/api/response';
import type { ReservationDto } from '@Noblesse/shared';
import { toast } from 'sonner';

export function useReservations(params?: {
  page?: number;
  limit?: number;
  status?: string;
  propertyId?: string;
  guestId?: string;
  checkInFrom?: string;
  checkInTo?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ['reservations', params],
    queryFn: () => reservationsApi.getAll(params),
    select: (res) => unwrapPaginatedApiData<ReservationDto>(res),
  });
}

export function useReservation(id: string) {
  return useQuery({
    queryKey: ['reservations', id],
    queryFn: () => reservationsApi.getOne(id),
    select: (res) => unwrapApiData<ReservationDto>(res),
    enabled: !!id,
  });
}

export function useCreateReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reservationsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      toast.success('Reservation created successfully');
    },
    onError: () => {
      toast.error('Failed to create reservation');
    },
  });
}

export function useUpdateReservation(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof reservationsApi.update>[1]) =>
      reservationsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['reservations', id] });
      toast.success('Reservation updated');
    },
    onError: () => {
      toast.error('Failed to update reservation');
    },
  });
}

export function useCheckIn(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => reservationsApi.checkIn(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['reservations', id] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Guest checked in successfully');
    },
    onError: () => {
      toast.error('Failed to check in guest');
    },
  });
}

export function useCheckOut(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => reservationsApi.checkOut(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['reservations', id] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Guest checked out successfully');
    },
    onError: () => {
      toast.error('Failed to check out guest');
    },
  });
}

export function useCancelReservation(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { reason?: string }) => reservationsApi.cancel(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['reservations', id] });
      toast.success('Reservation cancelled');
    },
    onError: () => {
      toast.error('Failed to cancel reservation');
    },
  });
}
