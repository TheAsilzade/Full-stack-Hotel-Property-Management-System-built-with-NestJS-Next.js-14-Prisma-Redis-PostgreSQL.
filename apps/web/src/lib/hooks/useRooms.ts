import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roomsApi } from '@/lib/api/rooms.api';
import { unwrapApiData } from '@/lib/api/response';
import type { RoomAvailabilityDto, RoomDto, RoomTypeDto } from '@Noblesse/shared';
import { toast } from 'sonner';

export function useRooms(propertyId: string, params?: {
  status?: string;
  roomTypeId?: string;
  floor?: number;
}) {
  return useQuery({
    queryKey: ['rooms', propertyId, params],
    queryFn: () => roomsApi.getAll(propertyId, params),
    enabled: !!propertyId,
    select: (res) => unwrapApiData<RoomDto[]>(res),
  });
}

export function useRoom(id: string) {
  return useQuery({
    queryKey: ['rooms', id],
    queryFn: () => roomsApi.getOne(id),
    select: (res) => unwrapApiData<RoomDto>(res),
    enabled: !!id,
  });
}

export function useRoomTypes(propertyId: string) {
  return useQuery({
    queryKey: ['room-types', propertyId],
    queryFn: () => roomsApi.getRoomTypes(propertyId),
    select: (res) => unwrapApiData<RoomTypeDto[]>(res),
    enabled: !!propertyId,
  });
}

export function useCreateRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: roomsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Room created successfully');
    },
    onError: () => {
      toast.error('Failed to create room');
    },
  });
}

export function useUpdateRoom(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof roomsApi.update>[1]) => roomsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['rooms', id] });
      toast.success('Room updated successfully');
    },
    onError: () => {
      toast.error('Failed to update room');
    },
  });
}

export function useUpdateRoomStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      roomsApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Room status updated');
    },
    onError: () => {
      toast.error('Failed to update room status');
    },
  });
}

export function useDeleteRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: roomsApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Room deleted');
    },
    onError: () => {
      toast.error('Failed to delete room');
    },
  });
}

export function useRoomAvailability(params: {
  propertyId: string;
  checkIn: string;
  checkOut: string;
}) {
  return useQuery({
    queryKey: ['rooms', 'availability', params],
    queryFn: () => roomsApi.getAvailability(params.propertyId, { checkIn: params.checkIn, checkOut: params.checkOut }),
    select: (res) => unwrapApiData<RoomAvailabilityDto[]>(res),
    enabled: !!(params.propertyId && params.checkIn && params.checkOut),
  });
}
