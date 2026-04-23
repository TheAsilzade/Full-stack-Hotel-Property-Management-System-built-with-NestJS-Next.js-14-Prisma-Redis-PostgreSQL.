'use client';

import React from 'react';


import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roomsApi } from '@/lib/api/rooms.api';
import { unwrapApiData } from '@/lib/api/response';
import { useAuthStore } from '@/store/auth.store';
import { RoomStatus } from '@Noblesse/shared';
import type { RoomDto } from '@Noblesse/shared';
import { BedDouble, Search, Plus } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  [RoomStatus.AVAILABLE]: { label: 'Available', color: 'text-green-700', bg: 'bg-green-100' },
  [RoomStatus.OCCUPIED]: { label: 'Occupied', color: 'text-blue-700', bg: 'bg-blue-100' },
  [RoomStatus.DIRTY]: { label: 'Dirty', color: 'text-orange-700', bg: 'bg-orange-100' },
  [RoomStatus.CLEAN]: { label: 'Clean', color: 'text-green-700', bg: 'bg-green-100' },
  [RoomStatus.INSPECTED]: { label: 'Inspected', color: 'text-purple-700', bg: 'bg-purple-100' },
  [RoomStatus.OUT_OF_ORDER]: { label: 'Out of Order', color: 'text-red-700', bg: 'bg-red-100' },
  [RoomStatus.OUT_OF_SERVICE]: {
    label: 'Out of Service',
    color: 'text-gray-600',
    bg: 'bg-gray-100',
  },
  [RoomStatus.ON_CHANGE]: { label: 'On Change', color: 'text-yellow-700', bg: 'bg-yellow-100' },
};

function RoomStatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    color: 'text-gray-600',
    bg: 'bg-gray-100',
  };
  return (
    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', cfg.bg, cfg.color)}>
      {cfg.label}
    </span>
  );
}

export default function RoomsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const user = useAuthStore((s) => s.user);
  const propertyId = user?.propertyIds?.[0] ?? '';

  const { data, isLoading } = useQuery({
    queryKey: ['rooms', propertyId, statusFilter],
    queryFn: () => roomsApi.getAll(propertyId, { status: statusFilter || undefined }),
    enabled: !!propertyId,
    select: (res) => unwrapApiData<RoomDto[]>(res),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      roomsApi.updateStatus(id, status),
    onSuccess: () => {
      toast.success('Room status updated');
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
    onError: () => toast.error('Failed to update room status'),
  });

  const rooms = (data ?? []).filter((r) =>
    search
      ? r.number.toLowerCase().includes(search.toLowerCase()) ||
        r.roomType?.name?.toLowerCase().includes(search.toLowerCase())
      : true,
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">Rooms</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {data?.length ?? 0} rooms total
          </p>
        </div>
        <Link
          href="/rooms/new"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={16} />
          Add Room
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Search by room number or type…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 text-foreground"
        >
          <option value="">All Statuses</option>
          {Object.values(RoomStatus).map((s) => (
            <option key={s} value={s}>
              {STATUS_CONFIG[s]?.label ?? s}
            </option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-4 animate-pulse">
              <div className="h-5 w-12 bg-muted rounded mb-2" />
              <div className="h-4 w-20 bg-muted rounded mb-3" />
              <div className="h-5 w-16 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center text-muted-foreground">
          <BedDouble size={32} className="mx-auto mb-2 opacity-30" />
          <p>No rooms found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="bg-card rounded-xl border border-border p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-lg font-bold text-foreground">{room.number}</p>
                  <p className="text-xs text-muted-foreground">{room.roomType?.name ?? '—'}</p>
                </div>
                <BedDouble size={16} className="text-muted-foreground mt-0.5" />
              </div>
              <div className="mb-3">
                <RoomStatusBadge status={room.status} />
              </div>
              <p className="text-xs text-muted-foreground mb-2">Floor {room.floor}</p>
              <select
                value={room.status}
                onChange={(e) =>
                  updateStatusMutation.mutate({ id: room.id, status: e.target.value })
                }
                className="w-full text-xs px-2 py-1 bg-muted border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring text-foreground mb-2"
              >
                {Object.values(RoomStatus).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_CONFIG[s]?.label ?? s}
                  </option>
                ))}
              </select>
              <Link
                href={`/rooms/${room.id}`}
                className="block text-center text-xs text-primary hover:underline"
              >
                View details
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
