'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  useReservation,
  useCheckIn,
  useCheckOut,
  useCancelReservation,
} from '@/lib/hooks/useReservations';
import { ReservationStatus, ReservationDto } from '@Noblesse/shared';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Calendar,
  Users,
  BedDouble,
  DollarSign,
  Hash,
  LogIn,
  LogOut,
  XCircle,
  MapPin,
  Clock,
  CreditCard,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<ReservationStatus, { label: string; color: string; bg: string }> = {
  [ReservationStatus.INQUIRY]: { label: 'Inquiry', color: 'text-purple-700', bg: 'bg-purple-100' },
  [ReservationStatus.TENTATIVE]: { label: 'Tentative', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  [ReservationStatus.CONFIRMED]: { label: 'Confirmed', color: 'text-blue-700', bg: 'bg-blue-100' },
  [ReservationStatus.CHECKED_IN]: { label: 'Checked In', color: 'text-green-700', bg: 'bg-green-100' },
  [ReservationStatus.CHECKED_OUT]: { label: 'Checked Out', color: 'text-gray-600', bg: 'bg-gray-100' },
  [ReservationStatus.CANCELLED]: { label: 'Cancelled', color: 'text-red-700', bg: 'bg-red-100' },
  [ReservationStatus.NO_SHOW]: { label: 'No Show', color: 'text-orange-700', bg: 'bg-orange-100' },
  [ReservationStatus.WAITLISTED]: { label: 'Waitlisted', color: 'text-cyan-700', bg: 'bg-cyan-100' },
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function ActionButton({
  onClick,
  disabled,
  variant = 'default',
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'success' | 'danger' | 'warning';
  children: React.ReactNode;
}) {
  const variantClass = {
    default: 'border border-border hover:bg-muted text-foreground',
    success: 'bg-green-600 text-white hover:bg-green-700',
    danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    warning: 'bg-orange-500 text-white hover:bg-orange-600',
  }[variant];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50',
        variantClass
      )}
    >
      {children}
    </button>
  );
}

export default function ReservationDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const { data: reservation, isLoading, isError } = useReservation(id);
  const checkIn = useCheckIn(id);
  const checkOut = useCheckOut(id);
  const cancel = useCancelReservation(id);

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-muted rounded animate-pulse" />
          <div className="h-6 bg-muted rounded w-48 animate-pulse" />
        </div>
        <div className="bg-card border border-border rounded-xl p-6 animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-32" />
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-4 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError || !reservation) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center py-16">
        <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-40" />
        <h2 className="text-lg font-semibold mb-2">Reservation not found</h2>
        <Link href="/reservations" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to Reservations
        </Link>
      </div>
    );
  }

  const res = reservation as ReservationDto;
  const statusCfg = STATUS_CONFIG[res.status as ReservationStatus] ?? {
    label: res.status,
    color: 'text-gray-600',
    bg: 'bg-gray-100',
  };

  const canCheckIn = res.status === ReservationStatus.CONFIRMED;
  const canCheckOut = res.status === ReservationStatus.CHECKED_IN;
  const canCancel =
    res.status !== ReservationStatus.CANCELLED &&
    res.status !== ReservationStatus.CHECKED_OUT &&
    res.status !== ReservationStatus.NO_SHOW;
  const ageCategoryCounts = res.ageCategoryCounts;

  async function handleCheckIn() {
    await checkIn.mutateAsync(undefined, {
      onError: () => toast.error('Check-in failed'),
    });
  }

  async function handleCheckOut() {
    await checkOut.mutateAsync(undefined, {
      onError: () => toast.error('Check-out failed'),
    });
  }

  async function handleCancel() {
    await cancel.mutateAsync(
      { reason: cancelReason || undefined },
      {
        onSuccess: () => {
          setShowCancelModal(false);
          setCancelReason('');
        },
        onError: () => toast.error('Cancellation failed'),
      }
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/reservations" className="p-1.5 rounded-md hover:bg-muted transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">Reservation</h1>
              <span className="font-mono text-sm text-muted-foreground">
                #{res.confirmationNumber}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Created {format(new Date(res.createdAt), 'MMM d, yyyy')}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {canCheckIn && (
            <ActionButton
              onClick={handleCheckIn}
              disabled={checkIn.isPending}
              variant="success"
            >
              <LogIn className="h-4 w-4" />
              {checkIn.isPending ? 'Checking in...' : 'Check In'}
            </ActionButton>
          )}
          {canCheckOut && (
            <ActionButton
              onClick={handleCheckOut}
              disabled={checkOut.isPending}
              variant="warning"
            >
              <LogOut className="h-4 w-4" />
              {checkOut.isPending ? 'Checking out...' : 'Check Out'}
            </ActionButton>
          )}
          {canCancel && (
            <ActionButton
              onClick={() => setShowCancelModal(true)}
              variant="danger"
            >
              <XCircle className="h-4 w-4" />
              Cancel
            </ActionButton>
          )}
        </div>
      </div>

      {/* Status banner */}
      <div className={cn('rounded-xl px-5 py-3 flex items-center gap-3', statusCfg.bg)}>
        <span className={cn('text-sm font-semibold', statusCfg.color)}>{statusCfg.label}</span>
        {res.status === ReservationStatus.CHECKED_IN && (
          <span className="text-xs text-green-600">· Guest is currently in the property</span>
        )}
        {res.status === ReservationStatus.CANCELLED && (
          <span className="text-xs text-red-600">· This reservation has been cancelled</span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Stay details */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">
            Stay Details
          </h3>
          <dl className="space-y-3">
            <div className="flex items-start gap-3">
              <Hash className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <dt className="text-xs text-muted-foreground">Confirmation</dt>
                <dd className="text-sm font-mono font-semibold">{res.confirmationNumber}</dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <dt className="text-xs text-muted-foreground">Check-in / Check-out</dt>
                <dd className="text-sm font-medium">
                  {format(new Date(res.checkIn), 'EEE, MMM d yyyy')} →{' '}
                  {format(new Date(res.checkOut), 'EEE, MMM d yyyy')}
                </dd>
                <dd className="text-xs text-muted-foreground mt-0.5">
                  {res.nights} night{res.nights !== 1 ? 's' : ''}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <dt className="text-xs text-muted-foreground">Guests</dt>
                <dd className="text-sm font-medium">
                  {res.adults} adult{res.adults !== 1 ? 's' : ''}
                  {res.children > 0 && `, ${res.children} child${res.children !== 1 ? 'ren' : ''}`}
                </dd>
                {ageCategoryCounts && (
                  <dd className="mt-2 grid grid-cols-2 gap-1.5 text-[11px] text-muted-foreground">
                    <span className="rounded-full bg-amber-50 px-2 py-1 text-amber-700">
                      +18 yaş: {ageCategoryCounts.adult18Plus}
                    </span>
                    <span className="rounded-full bg-amber-50 px-2 py-1 text-amber-700">
                      7-12 yaş: {ageCategoryCounts.child7To12}
                    </span>
                    <span className="rounded-full bg-amber-50 px-2 py-1 text-amber-700">
                      3-6 yaş: {ageCategoryCounts.child3To6}
                    </span>
                    <span className="rounded-full bg-amber-50 px-2 py-1 text-amber-700">
                      0-2 yaş: {ageCategoryCounts.infant0To2}
                    </span>
                  </dd>
                )}
              </div>
            </div>
            {res.source && (
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <dt className="text-xs text-muted-foreground">Source</dt>
                  <dd className="text-sm font-medium">{res.source}</dd>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <dt className="text-xs text-muted-foreground">Last Updated</dt>
                <dd className="text-sm font-medium">
                  {format(new Date(res.updatedAt), 'MMM d, yyyy HH:mm')}
                </dd>
              </div>
            </div>
          </dl>
        </div>

        {/* Financial summary */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">
            Financial Summary
          </h3>
          <dl className="space-y-3">
            <div className="flex items-start gap-3">
              <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="flex-1">
                <div className="flex justify-between">
                  <dt className="text-xs text-muted-foreground">Total Amount</dt>
                  <dd className="text-sm font-semibold">{formatCurrency(res.totalAmount)}</dd>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <DollarSign className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <div className="flex justify-between">
                  <dt className="text-xs text-muted-foreground">Paid</dt>
                  <dd className="text-sm font-semibold text-green-600">
                    {formatCurrency(res.paidAmount)}
                  </dd>
                </div>
              </div>
            </div>
            <div className="border-t border-border pt-3 flex items-start gap-3">
              <DollarSign
                className={cn(
                  'h-4 w-4 mt-0.5 shrink-0',
                  res.balanceDue > 0 ? 'text-orange-500' : 'text-muted-foreground'
                )}
              />
              <div className="flex-1">
                <div className="flex justify-between">
                  <dt className="text-xs text-muted-foreground">Balance Due</dt>
                  <dd
                    className={cn(
                      'text-sm font-bold',
                      res.balanceDue > 0 ? 'text-orange-600' : 'text-muted-foreground'
                    )}
                  >
                    {formatCurrency(res.balanceDue)}
                  </dd>
                </div>
              </div>
            </div>
          </dl>

          <Link
            href={`/reservations/${res.id}/folio`}
            className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-amber-600 hover:to-yellow-700"
          >
            <CreditCard className="h-4 w-4" />
            Open Folio & Payments
          </Link>
        </div>

        {/* Primary guest */}
        {res.primaryGuest && (
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">
              Primary Guest
            </h3>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-primary">
                  {res.primaryGuest.firstName[0]}{res.primaryGuest.lastName[0]}
                </span>
              </div>
              <div>
                <p className="font-medium">{res.primaryGuest.fullName}</p>
                <div className="text-xs text-muted-foreground space-y-0.5">
                  {res.primaryGuest.email && <p>{res.primaryGuest.email}</p>}
                  {res.primaryGuest.phone && <p>{res.primaryGuest.phone}</p>}
                </div>
              </div>
              <Link
                href={`/guests/${res.primaryGuest.id}`}
                className="ml-auto text-xs text-primary hover:underline"
              >
                View profile
              </Link>
            </div>
          </div>
        )}

        {/* Rooms */}
        {res.rooms && res.rooms.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">
              Rooms ({res.rooms.length})
            </h3>
            <div className="space-y-3">
              {res.rooms.map((rr) => (
                <div key={rr.id} className="flex items-center gap-3">
                  <BedDouble className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      Room {rr.room?.number ?? rr.roomId.slice(0, 8)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {rr.roomType?.name ?? '—'} · {formatCurrency(rr.ratePerNight)}/night
                    </p>
                  </div>
                  <span className="text-sm font-semibold">{formatCurrency(rr.totalRate)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {res.notes && (
          <div className="bg-card border border-border rounded-xl p-5 md:col-span-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Notes
            </h3>
            <p className="text-sm whitespace-pre-wrap">{res.notes}</p>
          </div>
        )}
      </div>

      {/* Cancel modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Cancel Reservation</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Cancel reservation <strong>#{res.confirmationNumber}</strong>? This action cannot be
              undone.
            </p>
            <div className="mb-4">
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Reason (optional)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                placeholder="Enter cancellation reason..."
                className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                }}
                className="px-4 py-2 text-sm font-medium rounded-md border border-border hover:bg-muted transition-colors"
              >
                Keep Reservation
              </button>
              <button
                onClick={handleCancel}
                disabled={cancel.isPending}
                className="px-4 py-2 text-sm font-medium rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
              >
                {cancel.isPending ? 'Cancelling...' : 'Cancel Reservation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
