'use client';

import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  BedDouble,
  Building2,
  CalendarCheck,
  CalendarDays,
  CalendarX,
  ChevronLeft,
  ChevronRight,
  Crown,
  DoorOpen,
  Plus,
  Sparkles,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import { addDays, differenceInDays, format, isSameDay, isToday, startOfDay } from 'date-fns';
import { ReservationStatus, RoomStatus } from '@Noblesse/shared';
import type { ReservationDto, RoomDto } from '@Noblesse/shared';
import { reservationsApi } from '@/lib/api/reservations.api';
import { roomsApi } from '@/lib/api/rooms.api';
import { unwrapApiData, unwrapPaginatedApiData } from '@/lib/api/response';
import { cn, formatCurrency } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';

const ZOOM_DAYS = {
  week: 7,
  '2weeks': 14,
  month: 30,
} as const;

type ZoomKey = keyof typeof ZOOM_DAYS;

const LABEL_WIDTH = 230;
const ROW_HEIGHT = 92;

const RESERVATION_STYLES: Record<
  string,
  { label: string; block: string; chip: string; dot: string }
> = {
  [ReservationStatus.INQUIRY]: {
    label: 'Inquiry',
    block: 'from-slate-400 to-slate-600 text-white border-slate-300',
    chip: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-500',
  },
  [ReservationStatus.TENTATIVE]: {
    label: 'Tentative',
    block: 'from-amber-300 to-orange-500 text-slate-950 border-amber-300',
    chip: 'bg-amber-100 text-amber-800 border-amber-200',
    dot: 'bg-amber-500',
  },
  [ReservationStatus.CONFIRMED]: {
    label: 'Reserved',
    block: 'from-blue-500 to-indigo-600 text-white border-blue-300',
    chip: 'bg-blue-100 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
  },
  [ReservationStatus.CHECKED_IN]: {
    label: 'Occupied',
    block: 'from-emerald-500 to-teal-700 text-white border-emerald-300',
    chip: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  [ReservationStatus.CHECKED_OUT]: {
    label: 'Checked Out',
    block: 'from-slate-300 to-slate-500 text-white border-slate-300',
    chip: 'bg-slate-100 text-slate-600 border-slate-200',
    dot: 'bg-slate-400',
  },
  [ReservationStatus.CANCELLED]: {
    label: 'Cancelled',
    block: 'from-rose-400 to-red-600 text-white border-rose-300',
    chip: 'bg-rose-100 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
  },
  [ReservationStatus.NO_SHOW]: {
    label: 'No Show',
    block: 'from-orange-400 to-red-500 text-white border-orange-300',
    chip: 'bg-orange-100 text-orange-700 border-orange-200',
    dot: 'bg-orange-500',
  },
  [ReservationStatus.WAITLISTED]: {
    label: 'Waitlisted',
    block: 'from-cyan-400 to-sky-600 text-white border-cyan-300',
    chip: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    dot: 'bg-cyan-500',
  },
};

const ROOM_STATUS_STYLES: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  [RoomStatus.AVAILABLE]: {
    label: 'Available',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    icon: Sparkles,
  },
  [RoomStatus.OCCUPIED]: {
    label: 'Occupied',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    icon: Users,
  },
  [RoomStatus.DIRTY]: {
    label: 'Dirty',
    className: 'border-orange-200 bg-orange-50 text-orange-700',
    icon: Wrench,
  },
  [RoomStatus.CLEAN]: {
    label: 'Clean',
    className: 'border-blue-200 bg-blue-50 text-blue-700',
    icon: Sparkles,
  },
  [RoomStatus.INSPECTED]: {
    label: 'Inspected',
    className: 'border-amber-200 bg-amber-50 text-amber-700',
    icon: Crown,
  },
  [RoomStatus.OUT_OF_ORDER]: {
    label: 'Maintenance',
    className: 'border-red-200 bg-red-50 text-red-700',
    icon: Wrench,
  },
  [RoomStatus.OUT_OF_SERVICE]: {
    label: 'Blocked',
    className: 'border-slate-200 bg-slate-100 text-slate-700',
    icon: CalendarX,
  },
  [RoomStatus.ON_CHANGE]: {
    label: 'On Change',
    className: 'border-purple-200 bg-purple-50 text-purple-700',
    icon: DoorOpen,
  },
};

interface ReservationBlockProps {
  reservation: ReservationDto;
  startOffset: number;
  spanDays: number;
  cellWidth: number;
  onClick: (reservation: ReservationDto) => void;
}

function getGuestName(reservation: ReservationDto) {
  return reservation.primaryGuest
    ? `${reservation.primaryGuest.firstName} ${reservation.primaryGuest.lastName}`
    : reservation.confirmationNumber;
}

function ReservationBlock({
  reservation,
  startOffset,
  spanDays,
  cellWidth,
  onClick,
}: ReservationBlockProps) {
  const visual = RESERVATION_STYLES[reservation.status] ?? RESERVATION_STYLES[ReservationStatus.INQUIRY];
  const guestName = getGuestName(reservation);
  const left = startOffset * cellWidth + 8;
  const width = Math.max(spanDays * cellWidth - 16, 72);
  const checkInToday = isToday(new Date(reservation.checkIn));
  const checkOutToday = isToday(new Date(reservation.checkOut));

  return (
    <button
      type="button"
      className={cn(
        'group absolute top-4 overflow-visible rounded-2xl border bg-gradient-to-r px-4 py-3 text-left shadow-lg transition duration-200 hover:-translate-y-0.5 hover:shadow-2xl',
        visual.block,
      )}
      style={{ left, width, height: ROW_HEIGHT - 28 }}
      onClick={() => onClick(reservation)}
    >
      <span className="flex min-w-0 items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 text-[11px] font-bold">
          {guestName
            .split(' ')
            .map((part) => part[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold">{guestName}</span>
          <span className="block truncate text-[11px] opacity-85">
            {reservation.confirmationNumber} - {visual.label}
          </span>
        </span>
      </span>

      {(checkInToday || checkOutToday) && (
        <span className="absolute -top-2 right-3 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-900 shadow">
          {checkInToday ? 'Arrives today' : 'Departs today'}
        </span>
      )}

      <span className="pointer-events-none absolute left-4 top-full z-30 mt-3 hidden w-72 rounded-2xl border border-amber-200 bg-white p-4 text-slate-900 shadow-2xl group-hover:block">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
          Quick Preview
        </span>
        <span className="block text-sm font-bold">{guestName}</span>
        <span className="mt-1 block text-xs text-slate-500">
          {format(new Date(reservation.checkIn), 'MMM d')} -{' '}
          {format(new Date(reservation.checkOut), 'MMM d')} - {reservation.nights} nights
        </span>
        <span className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <span className="rounded-xl bg-slate-50 p-2">
            <span className="block text-slate-400">Guests</span>
            <span className="font-bold text-slate-900">
              {reservation.adults + reservation.children}
            </span>
          </span>
          <span className="rounded-xl bg-slate-50 p-2">
            <span className="block text-slate-400">Balance</span>
            <span className="font-bold text-slate-900">
              {formatCurrency(reservation.balanceDue)}
            </span>
          </span>
        </span>
      </span>
    </button>
  );
}

interface DetailPanelProps {
  reservation: ReservationDto;
  onClose: () => void;
}

function DetailPanel({ reservation, onClose }: DetailPanelProps) {
  const visual = RESERVATION_STYLES[reservation.status] ?? RESERVATION_STYLES[ReservationStatus.INQUIRY];
  const guestName = getGuestName(reservation);
  const age = reservation.ageCategoryCounts;

  return (
    <aside className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l border-amber-200 bg-white shadow-[0_0_80px_rgba(15,23,42,0.25)]">
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 p-6 text-white">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">
              Reservation Preview
            </p>
            <h3 className="mt-3 text-2xl font-bold">{guestName}</h3>
            <p className="mt-1 font-mono text-sm text-white/70">{reservation.confirmationNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-6">
        <span className={cn('inline-flex rounded-full border px-3 py-1 text-xs font-bold', visual.chip)}>
          {visual.label}
        </span>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-3xl border border-amber-200 bg-amber-50/60 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-amber-700">Arrival</p>
            <p className="mt-2 font-bold text-slate-950">
              {format(new Date(reservation.checkIn), 'MMM d, yyyy')}
            </p>
          </div>
          <div className="rounded-3xl border border-amber-200 bg-amber-50/60 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-amber-700">Departure</p>
            <p className="mt-2 font-bold text-slate-950">
              {format(new Date(reservation.checkOut), 'MMM d, yyyy')}
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Rooms
          </p>
          <div className="space-y-3">
            {reservation.rooms.map((room) => (
              <div key={room.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="rounded-2xl bg-slate-950 p-2 text-white">
                    <BedDouble className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-semibold text-slate-950">
                      Room {room.room?.number ?? room.roomId.slice(0, 8)}
                    </p>
                    <p className="text-xs text-slate-500">{room.roomType?.name ?? 'Room'}</p>
                  </div>
                </div>
                <p className="font-bold text-amber-700">{formatCurrency(room.totalRate)}</p>
              </div>
            ))}
          </div>
        </div>

        {age && (
          <div className="rounded-3xl border border-slate-200 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Age Categories
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="rounded-2xl bg-slate-50 p-3">+18 yaş: {age.adult18Plus}</span>
              <span className="rounded-2xl bg-slate-50 p-3">7-12 yaş: {age.child7To12}</span>
              <span className="rounded-2xl bg-slate-50 p-3">3-6 yaş: {age.child3To6}</span>
              <span className="rounded-2xl bg-slate-50 p-3">0-2 yaş: {age.infant0To2}</span>
            </div>
          </div>
        )}

        <div className="rounded-3xl bg-slate-950 p-5 text-white">
          <div className="flex items-center justify-between text-sm text-white/65">
            <span>Total</span>
            <span>{formatCurrency(reservation.totalAmount)}</span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
            <span className="font-semibold">Balance Due</span>
            <span className="text-xl font-bold text-amber-200">
              {formatCurrency(reservation.balanceDue)}
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-amber-200 p-6">
        <Link
          href={`/reservations/${reservation.id}`}
          className="block rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-600 px-4 py-3 text-center text-sm font-bold text-white shadow-lg transition hover:from-amber-600 hover:to-yellow-700"
        >
          View Full Detail
        </Link>
      </div>
    </aside>
  );
}

export default function RoomRackPage() {
  const user = useAuthStore((s) => s.user);
  const propertyId = user?.propertyIds?.[0] ?? '';

  const [viewStart, setViewStart] = useState<Date>(() => startOfDay(new Date()));
  const [zoom, setZoom] = useState<ZoomKey>('week');
  const [selectedReservation, setSelectedReservation] = useState<ReservationDto | null>(null);

  const numDays = ZOOM_DAYS[zoom];
  const cellWidth = zoom === 'month' ? 58 : zoom === '2weeks' ? 66 : 88;
  const viewEnd = addDays(viewStart, numDays - 1);
  const startStr = format(viewStart, 'yyyy-MM-dd');
  const overlapEndStr = format(addDays(viewEnd, 1), 'yyyy-MM-dd');
  const totalWidth = numDays * cellWidth;

  const { data: roomsData, isLoading: roomsLoading } = useQuery({
    queryKey: ['rooms', propertyId],
    queryFn: () => roomsApi.getAll(propertyId),
    select: (res) => unwrapApiData<RoomDto[]>(res),
    enabled: !!propertyId,
  });

  const { data: reservationsData, isLoading: reservationsLoading } = useQuery({
    queryKey: ['reservations', 'rack', propertyId, startStr, overlapEndStr],
    queryFn: () =>
      reservationsApi.getAll({
        propertyId,
        overlapStart: startStr,
        overlapEnd: overlapEndStr,
        limit: 500,
      }),
    select: (res) => unwrapPaginatedApiData<ReservationDto>(res),
    enabled: !!propertyId,
    refetchInterval: 60000,
  });

  const rooms = useMemo(
    () =>
      (roomsData ?? []).sort((a, b) => {
        const floorDiff = (a.floor ?? 0) - (b.floor ?? 0);
        if (floorDiff !== 0) return floorDiff;
        return a.number.localeCompare(b.number, undefined, { numeric: true });
      }),
    [roomsData],
  );

  const reservations = useMemo(
    () =>
      (reservationsData?.data ?? []).filter((reservation) => {
        const checkIn = startOfDay(new Date(reservation.checkIn));
        const checkOut = startOfDay(new Date(reservation.checkOut));
        return checkIn < addDays(viewEnd, 1) && checkOut > viewStart;
      }),
    [reservationsData?.data, viewEnd, viewStart],
  );

  const reservationsByRoom = useMemo(() => {
    const map = new Map<string, ReservationDto[]>();
    for (const reservation of reservations) {
      if (
        reservation.status === ReservationStatus.CANCELLED ||
        reservation.status === ReservationStatus.NO_SHOW
      ) {
        continue;
      }
      for (const room of reservation.rooms) {
        const list = map.get(room.roomId) ?? [];
        list.push(reservation);
        map.set(room.roomId, list);
      }
    }
    return map;
  }, [reservations]);

  const roomsByFloor = useMemo(() => {
    const map = new Map<number, RoomDto[]>();
    for (const room of rooms) {
      const floor = room.floor ?? 0;
      map.set(floor, [...(map.get(floor) ?? []), room]);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a - b);
  }, [rooms]);

  const days = useMemo(
    () => Array.from({ length: numDays }, (_, index) => addDays(viewStart, index)),
    [numDays, viewStart],
  );

  const today = startOfDay(new Date());
  const stats = useMemo(() => {
    const arrivals = reservations.filter((reservation) =>
      isSameDay(new Date(reservation.checkIn), today),
    ).length;
    const departures = reservations.filter((reservation) =>
      isSameDay(new Date(reservation.checkOut), today),
    ).length;
    const occupied = rooms.filter((room) => room.status === RoomStatus.OCCUPIED).length;
    const dirty = rooms.filter((room) => room.status === RoomStatus.DIRTY).length;
    const blocked = rooms.filter(
      (room) =>
        room.status === RoomStatus.OUT_OF_ORDER || room.status === RoomStatus.OUT_OF_SERVICE,
    ).length;

    return { arrivals, departures, occupied, dirty, blocked };
  }, [reservations, rooms, today]);

  function navigate(direction: -1 | 1) {
    setViewStart((current) => addDays(current, direction * numDays));
  }

  const isLoading = roomsLoading || reservationsLoading;

  return (
    <div className="min-h-[calc(100vh-5rem)] space-y-6 bg-gradient-to-br from-white via-amber-50/40 to-white p-4 sm:p-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-amber-200 bg-white p-6 shadow-[0_24px_80px_rgba(146,106,30,0.13)]">
        <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-amber-200/40 blur-3xl" />
        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-amber-800">
              <Crown className="h-3.5 w-3.5" />
              Luxury room command
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 font-display">
              Room Rack
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {format(viewStart, 'MMM d')} - {format(viewEnd, 'MMM d, yyyy')} live occupancy,
              arrivals, departures, and room-readiness view.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {[
              { label: 'Rooms', value: rooms.length, icon: Building2, color: 'text-slate-900' },
              { label: 'Occupied', value: stats.occupied, icon: Users, color: 'text-emerald-700' },
              { label: 'Arrivals', value: stats.arrivals, icon: CalendarCheck, color: 'text-blue-700' },
              { label: 'Departures', value: stats.departures, icon: CalendarX, color: 'text-orange-700' },
              { label: 'Attention', value: stats.dirty + stats.blocked, icon: Wrench, color: 'text-red-700' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="rounded-3xl border border-amber-200 bg-white/80 p-4 shadow-sm"
                >
                  <Icon className={cn('mb-3 h-5 w-5', item.color)} />
                  <p className="text-2xl font-bold text-slate-950">{item.value}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {item.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-amber-200 bg-white/90 p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-2xl border border-amber-200 bg-amber-50 p-1">
              {(['week', '2weeks', 'month'] as const).map((item) => (
                <button
                  key={item}
                  onClick={() => setZoom(item)}
                  className={cn(
                    'rounded-xl px-4 py-2 text-xs font-bold transition',
                    zoom === item
                      ? 'bg-slate-950 text-white shadow'
                      : 'text-slate-600 hover:bg-white',
                  )}
                >
                  {item === 'week' ? '1 Week' : item === '2weeks' ? '2 Weeks' : 'Month'}
                </button>
              ))}
            </div>

            <button
              onClick={() => navigate(-1)}
              className="rounded-2xl border border-amber-200 bg-white p-2.5 text-slate-700 transition hover:bg-amber-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewStart(today)}
              className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-amber-50"
            >
              <CalendarDays className="h-4 w-4 text-amber-600" />
              Today
            </button>
            <button
              onClick={() => navigate(1)}
              className="rounded-2xl border border-amber-200 bg-white p-2.5 text-slate-700 transition hover:bg-amber-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <Link
            href="/reservations/new"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-600 px-5 py-3 text-sm font-bold text-white shadow-[0_14px_30px_rgba(217,119,6,0.24)] transition hover:from-amber-600 hover:to-yellow-700"
          >
            <Plus className="h-4 w-4" />
            New Reservation
          </Link>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { label: 'Occupied', className: RESERVATION_STYLES[ReservationStatus.CHECKED_IN].chip },
            { label: 'Reserved', className: RESERVATION_STYLES[ReservationStatus.CONFIRMED].chip },
            { label: 'Check-in today', className: 'border-blue-200 bg-blue-50 text-blue-700' },
            { label: 'Check-out today', className: 'border-orange-200 bg-orange-50 text-orange-700' },
            { label: 'Dirty', className: ROOM_STATUS_STYLES[RoomStatus.DIRTY].className },
            { label: 'Clean', className: ROOM_STATUS_STYLES[RoomStatus.CLEAN].className },
            { label: 'Maintenance', className: ROOM_STATUS_STYLES[RoomStatus.OUT_OF_ORDER].className },
            { label: 'Blocked', className: ROOM_STATUS_STYLES[RoomStatus.OUT_OF_SERVICE].className },
          ].map((item) => (
            <span
              key={item.label}
              className={cn(
                'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold',
                item.className,
              )}
            >
              <span className="h-2 w-2 rounded-full bg-current" />
              {item.label}
            </span>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-amber-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        {isLoading ? (
          <div className="flex min-h-[520px] items-center justify-center text-sm text-slate-500">
            <div className="text-center">
              <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
              Preparing the room rack...
            </div>
          </div>
        ) : rooms.length === 0 ? (
          <div className="flex min-h-[520px] items-center justify-center p-8 text-center">
            <div>
              <BedDouble className="mx-auto mb-4 h-12 w-12 text-amber-500" />
              <p className="text-lg font-bold text-slate-950">No rooms found</p>
              <p className="mt-1 text-sm text-slate-500">
                Add rooms to this property before using the premium rack view.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-auto">
            <div className="min-w-full p-4" style={{ width: LABEL_WIDTH + totalWidth + 48 }}>
              <div
                className="sticky top-0 z-20 mb-3 grid rounded-3xl border border-amber-200 bg-amber-50/95 p-2 shadow-sm backdrop-blur"
                style={{ gridTemplateColumns: `${LABEL_WIDTH}px ${totalWidth}px` }}
              >
                <div className="flex items-center px-4 text-xs font-bold uppercase tracking-[0.2em] text-amber-800">
                  Rooms
                </div>
                <div className="flex">
                  {days.map((day) => (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        'mx-1 flex flex-col items-center justify-center rounded-2xl px-2 py-3 text-center',
                        isToday(day) ? 'bg-slate-950 text-white shadow-lg' : 'bg-white text-slate-700',
                      )}
                      style={{ width: cellWidth - 8 }}
                    >
                      <span className="text-lg font-bold leading-none">{format(day, 'd')}</span>
                      <span className={cn('mt-1 text-[10px] uppercase tracking-[0.16em]', isToday(day) ? 'text-amber-200' : 'text-slate-400')}>
                        {format(day, 'EEE')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                {roomsByFloor.map(([floor, floorRooms]) => (
                  <div key={floor} className="space-y-3">
                    <div className="flex items-center gap-3 px-2">
                      <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-bold text-white">
                        Floor {floor}
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        {floorRooms.length} room{floorRooms.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {floorRooms.map((room) => {
                      const roomReservations = reservationsByRoom.get(room.id) ?? [];
                      const roomStatus =
                        ROOM_STATUS_STYLES[room.status] ?? ROOM_STATUS_STYLES[RoomStatus.AVAILABLE];
                      const RoomIcon = roomStatus.icon;

                      return (
                        <div
                          key={room.id}
                          className="grid rounded-[1.75rem] border border-amber-100 bg-gradient-to-r from-white to-amber-50/30 p-2 shadow-sm transition hover:border-amber-300 hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)]"
                          style={{ gridTemplateColumns: `${LABEL_WIDTH}px ${totalWidth}px` }}
                        >
                          <div className="flex items-center gap-4 rounded-[1.35rem] border border-amber-100 bg-white p-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-950 text-white">
                              <BedDouble className="h-6 w-6" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-2xl font-bold text-slate-950">
                                {room.number}
                              </p>
                              <p className="truncate text-xs text-slate-500">
                                {room.roomType?.name ?? 'Room'} - Floor {room.floor}
                              </p>
                              <span
                                className={cn(
                                  'mt-2 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold',
                                  roomStatus.className,
                                )}
                              >
                                <RoomIcon className="h-3 w-3" />
                                {roomStatus.label}
                              </span>
                            </div>
                          </div>

                          <div className="relative overflow-hidden rounded-[1.35rem] border border-amber-100 bg-white">
                            <div className="absolute inset-0 flex">
                              {days.map((day) => (
                                <div
                                  key={day.toISOString()}
                                  className={cn(
                                    'h-full shrink-0 border-r border-amber-100/80',
                                    isToday(day) ? 'bg-amber-50' : 'bg-white',
                                  )}
                                  style={{ width: cellWidth }}
                                />
                              ))}
                            </div>

                            <div className="relative" style={{ height: ROW_HEIGHT }}>
                              {roomReservations.map((reservation) => {
                                const checkIn = startOfDay(new Date(reservation.checkIn));
                                const checkOut = startOfDay(new Date(reservation.checkOut));
                                const blockStart = checkIn < viewStart ? viewStart : checkIn;
                                const blockEnd =
                                  checkOut > addDays(viewEnd, 1) ? addDays(viewEnd, 1) : checkOut;
                                const startOffset = differenceInDays(blockStart, viewStart);
                                const spanDays = differenceInDays(blockEnd, blockStart);

                                if (spanDays <= 0) return null;

                                return (
                                  <ReservationBlock
                                    key={`${reservation.id}-${room.id}`}
                                    reservation={reservation}
                                    startOffset={startOffset}
                                    spanDays={spanDays}
                                    cellWidth={cellWidth}
                                    onClick={setSelectedReservation}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {selectedReservation && (
        <>
          <button
            aria-label="Close reservation preview"
            className="fixed inset-0 z-30 bg-slate-950/30 backdrop-blur-[2px]"
            onClick={() => setSelectedReservation(null)}
          />
          <DetailPanel
            reservation={selectedReservation}
            onClose={() => setSelectedReservation(null)}
          />
        </>
      )}
    </div>
  );
}
