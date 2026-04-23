'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reservationsApi } from '@/lib/api/reservations.api';
import { unwrapPaginatedApiData } from '@/lib/api/response';
import { formatDate } from '@/lib/utils';
import { ReservationStatus } from '@Noblesse/shared';
import type { ReservationDto } from '@Noblesse/shared';
import {
  CalendarDays,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  LogIn,
  LogOut,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// ─── Status Badge ─────────────────────────────────────────────
const STATUS_CONFIG: Record<
  string,
  { label: string; className: string; icon: React.ElementType }
> = {
  [ReservationStatus.CONFIRMED]: {
    label: 'Confirmed',
    className: 'bg-blue-100 text-blue-700',
    icon: CheckCircle2,
  },
  [ReservationStatus.CHECKED_IN]: {
    label: 'Checked In',
    className: 'bg-green-100 text-green-700',
    icon: LogIn,
  },
  [ReservationStatus.CHECKED_OUT]: {
    label: 'Checked Out',
    className: 'bg-gray-100 text-gray-600',
    icon: LogOut,
  },
  [ReservationStatus.CANCELLED]: {
    label: 'Cancelled',
    className: 'bg-red-100 text-red-600',
    icon: XCircle,
  },
  [ReservationStatus.NO_SHOW]: {
    label: 'No Show',
    className: 'bg-orange-100 text-orange-600',
    icon: XCircle,
  },
  [ReservationStatus.TENTATIVE]: {
    label: 'Tentative',
    className: 'bg-yellow-100 text-yellow-700',
    icon: Clock,
  },
  [ReservationStatus.INQUIRY]: {
    label: 'Inquiry',
    className: 'bg-purple-100 text-purple-700',
    icon: Clock,
  },
};

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    className: 'bg-gray-100 text-gray-600',
    icon: Clock,
  };
  const Icon = config.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
        config.className,
      )}
    >
      <Icon size={11} />
      {config.label}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function ReservationsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['reservations', page, search, statusFilter],
    queryFn: () =>
      reservationsApi.getAll({
        page,
        limit,
        search: search || undefined,
        status: statusFilter || undefined,
      }),
    select: (res) => unwrapPaginatedApiData<ReservationDto>(res),
  });

  const checkInMutation = useMutation({
    mutationFn: (id: string) => reservationsApi.checkIn(id),
    onSuccess: () => {
      toast.success('Guest checked in successfully');
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    },
    onError: () => toast.error('Failed to check in'),
  });

  const checkOutMutation = useMutation({
    mutationFn: (id: string) => reservationsApi.checkOut(id),
    onSuccess: () => {
      toast.success('Guest checked out successfully');
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    },
    onError: () => toast.error('Failed to check out'),
  });

  const reservations = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">Reservations</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage all hotel reservations
          </p>
        </div>
        <Link
          href="/reservations/new"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={16} />
          New Reservation
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
            placeholder="Search by guest, confirmation #…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 text-foreground"
        >
          <option value="">All Statuses</option>
          {Object.values(ReservationStatus).map((s) => (
            <option key={s} value={s}>
              {STATUS_CONFIG[s]?.label ?? s}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Confirmation</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Guest</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Check-In</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Check-Out</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Rooms</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-border animate-pulse">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-muted rounded w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : reservations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    <CalendarDays size={32} className="mx-auto mb-2 opacity-30" />
                    <p>No reservations found</p>
                  </td>
                </tr>
              ) : (
                reservations.map((res) => (
                  <tr
                    key={res.id}
                    className="border-b border-border hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/reservations/${res.id}`}
                        className="font-mono text-xs text-gold-600 hover:text-gold-700 font-medium"
                      >
                        {res.confirmationNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">
                        {res.primaryGuest
                          ? `${res.primaryGuest.firstName} ${res.primaryGuest.lastName}`
                          : '—'}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(res.checkIn)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(res.checkOut)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {res.rooms?.length ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={res.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {res.status === ReservationStatus.CONFIRMED && (
                          <button
                            onClick={() => checkInMutation.mutate(res.id)}
                            disabled={checkInMutation.isPending}
                            className="px-2.5 py-1 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors font-medium"
                          >
                            Check In
                          </button>
                        )}
                        {res.status === ReservationStatus.CHECKED_IN && (
                          <button
                            onClick={() => checkOutMutation.mutate(res.id)}
                            disabled={checkOutMutation.isPending}
                            className="px-2.5 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors font-medium"
                          >
                            Check Out
                          </button>
                        )}
                        <Link
                          href={`/reservations/${res.id}`}
                          className="px-2.5 py-1 text-xs bg-muted text-muted-foreground rounded-md hover:bg-muted/80 transition-colors font-medium"
                        >
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, meta.total)} of{' '}
              {meta.total} reservations
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs text-muted-foreground px-2">
                {page} / {meta.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={page === meta.totalPages}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
