'use client';

import React from 'react';
import { useGuestStayHistory } from '@/lib/hooks/useGuests';
import { ReservationStatus, ReservationDto, ReservationRoomDto } from '@Noblesse/shared';
import { format } from 'date-fns';
import { Calendar, BedDouble, DollarSign, Hash } from 'lucide-react';

interface GuestStayHistoryProps {
  guestId: string;
}

const statusColors: Record<ReservationStatus, string> = {
  [ReservationStatus.INQUIRY]: 'bg-purple-100 text-purple-800',
  [ReservationStatus.TENTATIVE]: 'bg-yellow-100 text-yellow-800',
  [ReservationStatus.CONFIRMED]: 'bg-blue-100 text-blue-800',
  [ReservationStatus.CHECKED_IN]: 'bg-green-100 text-green-800',
  [ReservationStatus.CHECKED_OUT]: 'bg-gray-100 text-gray-800',
  [ReservationStatus.CANCELLED]: 'bg-red-100 text-red-800',
  [ReservationStatus.NO_SHOW]: 'bg-orange-100 text-orange-800',
  [ReservationStatus.WAITLISTED]: 'bg-cyan-100 text-cyan-800',
};

const statusLabels: Record<ReservationStatus, string> = {
  [ReservationStatus.INQUIRY]: 'Inquiry',
  [ReservationStatus.TENTATIVE]: 'Tentative',
  [ReservationStatus.CONFIRMED]: 'Confirmed',
  [ReservationStatus.CHECKED_IN]: 'Checked In',
  [ReservationStatus.CHECKED_OUT]: 'Checked Out',
  [ReservationStatus.CANCELLED]: 'Cancelled',
  [ReservationStatus.NO_SHOW]: 'No Show',
  [ReservationStatus.WAITLISTED]: 'Waitlisted',
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function getRoomNumbers(rooms: ReservationRoomDto[]): string {
  if (!rooms || rooms.length === 0) return '—';
  return rooms.map((r) => r.room?.number ?? r.roomId.slice(0, 6)).join(', ');
}

export function GuestStayHistory({ guestId }: GuestStayHistoryProps) {
  const { data: reservations, isLoading, isError } = useGuestStayHistory(guestId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border border-border rounded-lg p-4 animate-pulse">
            <div className="flex items-center justify-between mb-3">
              <div className="h-4 bg-muted rounded w-32" />
              <div className="h-5 bg-muted rounded w-20" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="h-3 bg-muted rounded w-full" />
              <div className="h-3 bg-muted rounded w-full" />
              <div className="h-3 bg-muted rounded w-full" />
              <div className="h-3 bg-muted rounded w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Failed to load stay history.</p>
      </div>
    );
  }

  if (!reservations || reservations.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Calendar className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p className="font-medium">No stay history</p>
        <p className="text-sm mt-1">This guest has no reservations yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reservations.map((res: ReservationDto) => {
        const statusColor = statusColors[res.status] ?? 'bg-gray-100 text-gray-800';
        const statusLabel = statusLabels[res.status] ?? res.status;
        const roomNumbers = getRoomNumbers(res.rooms);

        return (
          <div
            key={res.id}
            className="border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Hash className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="font-mono text-sm font-medium">{res.confirmationNumber}</span>
              </div>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}`}
              >
                {statusLabel}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span>
                  {format(new Date(res.checkIn), 'MMM d, yyyy')} –{' '}
                  {format(new Date(res.checkOut), 'MMM d, yyyy')}
                </span>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <BedDouble className="h-3.5 w-3.5 shrink-0" />
                <span>
                  {res.nights} night{res.nights !== 1 ? 's' : ''} · Room {roomNumbers}
                </span>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="h-3.5 w-3.5 shrink-0" />
                <span>
                  Total:{' '}
                  <span className="text-foreground font-medium">
                    {formatCurrency(res.totalAmount)}
                  </span>
                </span>
              </div>

              {res.balanceDue > 0 && (
                <div className="flex items-center gap-2 text-orange-600">
                  <DollarSign className="h-3.5 w-3.5 shrink-0" />
                  <span>Balance due: {formatCurrency(res.balanceDue)}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}