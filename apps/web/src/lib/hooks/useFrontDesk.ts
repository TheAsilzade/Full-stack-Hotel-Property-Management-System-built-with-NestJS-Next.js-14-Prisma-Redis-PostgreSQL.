import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reservationsApi } from '@/lib/api/reservations.api';
import { unwrapPaginatedApiData } from '@/lib/api/response';
import { ReservationStatus } from '@Noblesse/shared';
import type { ReservationDto } from '@Noblesse/shared';
import { useAuthStore } from '@/store/auth.store';
import { format } from 'date-fns';
import { toast } from 'sonner';

const today = () => format(new Date(), 'yyyy-MM-dd');

export function useTodayArrivals() {
  const user = useAuthStore((s) => s.user);
  const propertyId = user?.propertyIds?.[0];

  return useQuery({
    queryKey: ['front-desk', 'arrivals', propertyId],
    queryFn: () =>
      reservationsApi.getAll({
        propertyId,
        status: ReservationStatus.CONFIRMED,
        checkInFrom: today(),
        checkInTo: today(),
        limit: 100,
      }),
    select: (res) => unwrapPaginatedApiData<ReservationDto>(res).data,
    enabled: !!propertyId,
    refetchInterval: 60_000,
  });
}

export function useTodayDepartures() {
  const user = useAuthStore((s) => s.user);
  const propertyId = user?.propertyIds?.[0];

  return useQuery({
    queryKey: ['front-desk', 'departures', propertyId],
    queryFn: () =>
      reservationsApi.getAll({
        propertyId,
        status: ReservationStatus.CHECKED_IN,
        limit: 100,
      }),
    select: (res) => unwrapPaginatedApiData<ReservationDto>(res).data,
    enabled: !!propertyId,
    refetchInterval: 60_000,
  });
}

export function useInHouseGuests(search?: string) {
  const user = useAuthStore((s) => s.user);
  const propertyId = user?.propertyIds?.[0];

  return useQuery({
    queryKey: ['front-desk', 'in-house', propertyId, search],
    queryFn: () =>
      reservationsApi.getAll({
        propertyId,
        status: ReservationStatus.CHECKED_IN,
        search,
        limit: 200,
      }),
    select: (res) => unwrapPaginatedApiData<ReservationDto>(res).data,
    enabled: !!propertyId,
    refetchInterval: 120_000,
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reservationsApi.checkIn(id),
    onSuccess: () => {
      toast.success('Guest checked in');
      queryClient.invalidateQueries({ queryKey: ['front-desk'] });
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    },
    onError: () => toast.error('Check-in failed'),
  });
}

export function useCheckOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reservationsApi.checkOut(id),
    onSuccess: () => {
      toast.success('Guest checked out');
      queryClient.invalidateQueries({ queryKey: ['front-desk'] });
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    },
    onError: () => toast.error('Check-out failed'),
  });
}
