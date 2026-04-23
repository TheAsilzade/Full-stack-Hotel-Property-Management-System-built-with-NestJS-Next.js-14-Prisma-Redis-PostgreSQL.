import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { guestsApi } from '@/lib/api/guests.api';
import { unwrapApiData, unwrapPaginatedApiData } from '@/lib/api/response';
import type { GuestDto, ReservationDto, ReservationRoomDto } from '@Noblesse/shared';
import { toast } from 'sonner';

interface RawGuestStay {
  reservation: Partial<ReservationDto> & {
    id: string;
    confirmationNumber: string;
    checkIn: string;
    checkOut: string;
    status: ReservationDto['status'];
    totalAmount?: number | string;
    paidAmount?: number | string;
    rooms?: Array<Partial<ReservationRoomDto>>;
  };
}

function toNumber(value: number | string | undefined): number {
  const numberValue = Number(value ?? 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function getNights(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn).getTime();
  const end = new Date(checkOut).getTime();
  const diff = Math.round((end - start) / 86_400_000);
  return Number.isFinite(diff) && diff > 0 ? diff : 0;
}

function mapStayReservation(reservation: RawGuestStay['reservation']): ReservationDto {
  const totalAmount = toNumber(reservation.totalAmount);
  const paidAmount = toNumber(reservation.paidAmount);

  return {
    ...reservation,
    tenantId: reservation.tenantId ?? '',
    propertyId: reservation.propertyId ?? reservation.property?.id ?? '',
    nights: reservation.nights ?? getNights(reservation.checkIn, reservation.checkOut),
    adults: reservation.adults ?? 0,
    children: reservation.children ?? 0,
    rooms: (reservation.rooms ?? []).map((room, index) => ({
      id: room.id ?? `${reservation.id}-${index}`,
      reservationId: room.reservationId ?? reservation.id,
      roomId: room.roomId ?? room.room?.id ?? '',
      roomTypeId: room.roomTypeId ?? room.roomType?.id ?? '',
      room: room.room,
      roomType: room.roomType,
      ratePerNight: toNumber(room.ratePerNight),
      totalRate: toNumber(room.totalRate),
    })),
    totalAmount,
    paidAmount,
    balanceDue: reservation.balanceDue ?? Math.max(totalAmount - paidAmount, 0),
    createdAt: reservation.createdAt ?? reservation.checkIn,
    updatedAt: reservation.updatedAt ?? reservation.checkOut,
  };
}

export function useGuests(params?: { search?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['guests', params],
    queryFn: () => guestsApi.getAll(params),
    select: (res) => unwrapPaginatedApiData<GuestDto>(res),
  });
}

export function useGuest(id: string) {
  return useQuery({
    queryKey: ['guests', id],
    queryFn: () => guestsApi.getOne(id),
    select: (res) => unwrapApiData<GuestDto>(res),
    enabled: !!id,
  });
}

export function useGuestStayHistory(id: string) {
  return useQuery({
    queryKey: ['guests', id, 'stays'],
    queryFn: () => guestsApi.getStayHistory(id),
    select: (res) =>
      unwrapApiData<RawGuestStay[]>(res).map((stay) =>
        mapStayReservation(stay.reservation),
      ),
    enabled: !!id,
  });
}

export function useCreateGuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: guestsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      toast.success('Guest created successfully');
    },
    onError: () => {
      toast.error('Failed to create guest');
    },
  });
}

export function useUpdateGuest(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof guestsApi.update>[1]) => guestsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      queryClient.invalidateQueries({ queryKey: ['guests', id] });
      toast.success('Guest updated successfully');
    },
    onError: () => {
      toast.error('Failed to update guest');
    },
  });
}

export function useDeleteGuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: guestsApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      toast.success('Guest deleted');
    },
    onError: () => {
      toast.error('Failed to delete guest');
    },
  });
}
