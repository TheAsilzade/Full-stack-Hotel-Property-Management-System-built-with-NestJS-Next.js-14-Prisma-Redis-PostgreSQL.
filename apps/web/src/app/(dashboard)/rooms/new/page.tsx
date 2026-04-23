'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useCreateRoom } from '@/lib/hooks/useRooms';
import { unwrapApiData } from '@/lib/api/response';
import { useAuthStore } from '@/store/auth.store';
import { roomsApi } from '@/lib/api/rooms.api';
import { RoomTypeDto } from '@Noblesse/shared';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface RoomFormData {
  number: string;
  floor: string;
  roomTypeId: string;
  notes: string;
  isActive: boolean;
}

export default function NewRoomPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const propertyId = user?.propertyIds?.[0] ?? '';

  const [form, setForm] = useState<RoomFormData>({
    number: '',
    floor: '1',
    roomTypeId: '',
    notes: '',
    isActive: true,
  });

  const createRoom = useCreateRoom();

  const { data: roomTypes, isLoading: loadingTypes } = useQuery({
    queryKey: ['room-types', propertyId],
    queryFn: () => roomsApi.getRoomTypes(propertyId),
    select: (res) => unwrapApiData<RoomTypeDto[]>(res),
    enabled: !!propertyId,
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.number.trim()) {
      toast.error('Room number is required');
      return;
    }
    if (!form.roomTypeId) {
      toast.error('Please select a room type');
      return;
    }

    await createRoom.mutateAsync(
      {
        number: form.number.trim(),
        floor: Number(form.floor),
        roomTypeId: form.roomTypeId,
        propertyId,
        notes: form.notes || undefined,
        isActive: form.isActive,
      },
      {
        onSuccess: (res) => {
          const room = (res as { data: { data: { id: string; number: string } } }).data.data;
          toast.success(`Room ${room.number} created`);
          router.push(`/rooms/${room.id}`);
        },
        onError: (err: unknown) => {
          const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
          toast.error(msg ?? 'Failed to create room');
        },
      }
    );
  }

  const inputClass =
    'w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent';
  const labelClass = 'block text-xs font-medium text-muted-foreground mb-1';

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/rooms" className="p-1.5 rounded-md hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold">New Room</h1>
          <p className="text-sm text-muted-foreground">Add a new room to the property</p>
        </div>
      </div>

      {!propertyId && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-sm text-yellow-800">
          No property assigned to your account. Please contact an administrator.
        </div>
      )}

      {/* Form */}
      <div className="bg-card border border-border rounded-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Room Number *</label>
              <input
                name="number"
                value={form.number}
                onChange={handleChange}
                required
                placeholder="e.g. 101"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Floor *</label>
              <input
                name="floor"
                type="number"
                value={form.floor}
                onChange={handleChange}
                required
                min={0}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Room Type *</label>
            {loadingTypes ? (
              <div className="h-10 bg-muted rounded-lg animate-pulse" />
            ) : (
              <select
                name="roomTypeId"
                value={form.roomTypeId}
                onChange={handleChange}
                required
                disabled={!propertyId}
                className={inputClass}
              >
                <option value="">Select a room type...</option>
                {(roomTypes ?? []).map((rt) => (
                  <option key={rt.id} value={rt.id}>
                    {rt.name} ({rt.code}) — max {rt.maxOccupancy} guests · $
                    {rt.baseRate}/night
                  </option>
                ))}
              </select>
            )}
            {!loadingTypes && propertyId && (!roomTypes || roomTypes.length === 0) && (
              <p className="text-xs text-muted-foreground mt-1">
                No room types found. Create room types first in property settings.
              </p>
            )}
          </div>

          <div>
            <label className={labelClass}>Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Any notes about this room..."
              className={inputClass}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={form.isActive}
              onChange={handleChange}
              className="h-4 w-4 rounded border-input"
            />
            <label htmlFor="isActive" className="text-sm font-medium">
              Room is active
            </label>
          </div>

          <div className="flex gap-3 pt-2 border-t border-border">
            <button
              type="submit"
              disabled={createRoom.isPending || !propertyId}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {createRoom.isPending ? 'Creating...' : 'Create Room'}
            </button>
            <Link
              href="/rooms"
              className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
