'use client';

import React, { useDeferredValue, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { differenceInDays } from 'date-fns';
import {
  ArrowLeft,
  Baby,
  BedDouble,
  Calendar,
  Check,
  DollarSign,
  Filter,
  Minus,
  Plus,
  Sparkles,
  UserRound,
  Users,
} from 'lucide-react';
import type { AgeCategoryCounts, GuestDto, RoomAvailabilityDto } from '@Noblesse/shared';
import { GuestSearchSelect } from '@/components/guests/GuestSearchSelect';
import { reservationsApi } from '@/lib/api/reservations.api';
import { unwrapApiData } from '@/lib/api/response';
import { useCreateReservation } from '@/lib/hooks/useReservations';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { toast } from 'sonner';

interface SelectedRoom {
  roomId: string;
  roomTypeId: string;
  ratePerNight: number;
  totalRate: number;
  number: string;
  typeName: string;
}

type AgeCategoryKey = keyof AgeCategoryCounts;

const AGE_CATEGORIES: Array<{
  key: AgeCategoryKey;
  label: string;
  description: string;
  icon: React.ElementType;
}> = [
  { key: 'adult18Plus', label: '+18 yaş', description: 'Adult guests', icon: UserRound },
  { key: 'child7To12', label: '7-12 yaş', description: 'Junior guests', icon: Users },
  { key: 'child3To6', label: '3-6 yaş', description: 'Child guests', icon: Users },
  { key: 'infant0To2', label: '0-2 yaş', description: 'Infants', icon: Baby },
];

const ROOM_TYPE_FILTERS = ['Deluxe Room', 'Suite Room', 'Standard Room', 'Eco Room'];

const INITIAL_AGE_COUNTS: AgeCategoryCounts = {
  adult18Plus: 1,
  child7To12: 0,
  child3To6: 0,
  infant0To2: 0,
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function isValidDate(value: string): boolean {
  return value.length === 10 && !Number.isNaN(new Date(value).getTime());
}

function getRoomTypeToken(filter: string): string {
  return filter.replace(/\s*room$/i, '').toLowerCase();
}

export default function NewReservationPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const propertyId = user?.propertyIds?.[0] ?? '';

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [ageCategoryCounts, setAgeCategoryCounts] =
    useState<AgeCategoryCounts>(INITIAL_AGE_COUNTS);
  const [primaryGuest, setPrimaryGuest] = useState<GuestDto | null>(null);
  const [selectedRooms, setSelectedRooms] = useState<SelectedRoom[]>([]);
  const [selectedRoomTypes, setSelectedRoomTypes] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [source, setSource] = useState('');

  const deferredRoomTypes = useDeferredValue(selectedRoomTypes);
  const createReservation = useCreateReservation();

  const nights = useMemo(() => {
    if (!checkIn || !checkOut || !isValidDate(checkIn) || !isValidDate(checkOut)) return 0;
    const diff = differenceInDays(new Date(checkOut), new Date(checkIn));
    return diff > 0 ? diff : 0;
  }, [checkIn, checkOut]);

  const adults = ageCategoryCounts.adult18Plus;
  const children =
    ageCategoryCounts.child7To12 +
    ageCategoryCounts.child3To6 +
    ageCategoryCounts.infant0To2;
  const totalGuests = adults + children;

  const canSearchAvailability = !!(
    propertyId &&
    isValidDate(checkIn) &&
    isValidDate(checkOut) &&
    nights > 0
  );

  const { data: availableRooms, isLoading: loadingAvailability } = useQuery({
    queryKey: ['availability', propertyId, checkIn, checkOut],
    queryFn: () => reservationsApi.getAvailability({ propertyId, checkIn, checkOut }),
    select: (res) => unwrapApiData<RoomAvailabilityDto[]>(res),
    enabled: canSearchAvailability,
  });

  const filteredRooms = useMemo(() => {
    const rooms = availableRooms ?? [];
    if (deferredRoomTypes.length === 0) return rooms;

    return rooms.filter((room) => {
      const roomTypeName = room.roomType?.name?.toLowerCase() ?? '';
      const roomTypeCode = room.roomType?.code?.toLowerCase() ?? '';
      return deferredRoomTypes.some((filter) => {
        const token = getRoomTypeToken(filter);
        return roomTypeName.includes(token) || roomTypeCode.includes(token.slice(0, 3));
      });
    });
  }, [availableRooms, deferredRoomTypes]);

  const totalAmount = selectedRooms.reduce((sum, room) => sum + room.totalRate, 0);

  function updateAgeCategory(key: AgeCategoryKey, delta: number) {
    setAgeCategoryCounts((current) => ({
      ...current,
      [key]: Math.max(key === 'adult18Plus' ? 1 : 0, current[key] + delta),
    }));
  }

  function toggleRoomType(filter: string) {
    setSelectedRoomTypes((current) =>
      current.includes(filter)
        ? current.filter((item) => item !== filter)
        : [...current, filter],
    );
  }

  function resetStayDates(next: { checkIn?: string; checkOut?: string }) {
    if (next.checkIn !== undefined) setCheckIn(next.checkIn);
    if (next.checkOut !== undefined) setCheckOut(next.checkOut);
    setSelectedRooms([]);
  }

  function toggleRoom(room: RoomAvailabilityDto) {
    const exists = selectedRooms.some((selected) => selected.roomId === room.id);
    if (exists) {
      setSelectedRooms((prev) => prev.filter((selected) => selected.roomId !== room.id));
      return;
    }

    const ratePerNight = Number(room.roomType?.baseRate ?? 0);
    const totalRate = ratePerNight * nights;
    setSelectedRooms((prev) => [
      ...prev,
      {
        roomId: room.id,
        roomTypeId: room.roomTypeId ?? room.roomType?.id ?? '',
        ratePerNight,
        totalRate,
        number: room.number,
        typeName: room.roomType?.name ?? 'Room',
      },
    ]);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!checkIn || !checkOut || nights <= 0) {
      toast.error('Please select valid check-in and check-out dates');
      return;
    }
    if (selectedRooms.length === 0) {
      toast.error('Please select at least one room');
      return;
    }

    const internalNotes = source ? `Booking source: ${source}` : undefined;
    const payload = {
      propertyId,
      checkIn,
      checkOut,
      adults,
      children,
      ageCategoryCounts,
      internalNotes,
      specialRequests: notes || undefined,
      rooms: selectedRooms.map((room) => ({
        roomId: room.roomId,
        roomTypeId: room.roomTypeId,
        ratePerNight: room.ratePerNight,
        totalRate: room.totalRate,
      })),
      guests: primaryGuest ? [{ guestId: primaryGuest.id, isPrimary: true }] : [],
    };

    await createReservation.mutateAsync(payload, {
      onSuccess: (res) => {
        const created = (
          res as { data: { data: { id: string; confirmationNumber: string } } }
        ).data.data;
        toast.success(`Reservation ${created.confirmationNumber} created`);
        router.push(`/reservations/${created.id}`);
      },
      onError: (err: unknown) => {
        const data = (
          err as {
            response?: {
              data?: { message?: string | string[]; errors?: Record<string, string[]> };
            };
          }
        )?.response?.data;
        const errors = data?.errors;
        const message = data?.message;
        if (errors) {
          toast.error(`Validation failed: ${Object.values(errors).flat().join('; ')}`);
        } else {
          toast.error(
            Array.isArray(message)
              ? message.join(', ')
              : message ?? 'Failed to create reservation',
          );
        }
      },
    });
  }

  const inputClass =
    'w-full rounded-2xl border border-amber-200/80 bg-white/90 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100';
  const labelClass = 'mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-amber-800/80';

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6">
      <div className="relative overflow-hidden rounded-[2rem] border border-amber-200 bg-gradient-to-br from-white via-amber-50/70 to-white p-6 shadow-[0_24px_80px_rgba(146,106,30,0.14)]">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-amber-200/30 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/reservations"
              className="rounded-2xl border border-amber-200 bg-white/80 p-3 text-amber-700 shadow-sm transition hover:bg-amber-50"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
                <Sparkles className="h-3.5 w-3.5" />
                Luxury booking desk
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950 font-display">
                New Reservation
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Build a guest stay with category-based occupancy, filtered room selection,
                and a premium booking summary.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 rounded-3xl border border-amber-200 bg-white/80 p-3 shadow-inner">
            <div className="px-3 py-2 text-center">
              <p className="text-lg font-bold text-slate-950">{nights}</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Nights</p>
            </div>
            <div className="px-3 py-2 text-center">
              <p className="text-lg font-bold text-slate-950">{totalGuests}</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Guests</p>
            </div>
            <div className="px-3 py-2 text-center">
              <p className="text-lg font-bold text-amber-700">{selectedRooms.length}</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Rooms</p>
            </div>
          </div>
        </div>
      </div>

      {!propertyId && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          No property assigned to your account. Please contact an administrator.
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="space-y-6">
          <section className="rounded-[1.75rem] border border-amber-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-950">
                  <Calendar className="h-5 w-5 text-amber-600" />
                  Stay Details
                </h2>
                <p className="mt-1 text-sm text-slate-500">Select the booking window and party mix.</p>
              </div>
              {nights > 0 && (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                  {nights} night{nights !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}>Check-in</label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(event) => resetStayDates({ checkIn: event.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Check-out</label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(event) => resetStayDates({ checkOut: event.target.value })}
                  min={checkIn || new Date().toISOString().split('T')[0]}
                  required
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-amber-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
            <div className="mb-5 flex items-center gap-2">
              <Users className="h-5 w-5 text-amber-600" />
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Age Categories</h2>
                <p className="text-sm text-slate-500">
                  Counts are stored with the reservation so pricing rules can use them later.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              {AGE_CATEGORIES.map((category) => {
                const Icon = category.icon;
                const value = ageCategoryCounts[category.key];
                return (
                  <div
                    key={category.key}
                    className="rounded-3xl border border-amber-200 bg-gradient-to-br from-white to-amber-50/60 p-4 shadow-sm"
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-amber-100 p-2 text-amber-700">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-950">{category.label}</p>
                          <p className="text-xs text-slate-500">{category.description}</p>
                        </div>
                      </div>
                      <span className="text-2xl font-bold text-slate-950">{value}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateAgeCategory(category.key, -1)}
                        className="flex h-9 flex-1 items-center justify-center rounded-2xl border border-amber-200 bg-white text-amber-700 transition hover:bg-amber-50 disabled:opacity-40"
                        disabled={category.key === 'adult18Plus' ? value <= 1 : value <= 0}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => updateAgeCategory(category.key, 1)}
                        className="flex h-9 flex-1 items-center justify-center rounded-2xl bg-slate-950 text-white transition hover:bg-amber-700"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-amber-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
            <div className="mb-5 flex items-center gap-2">
              <Users className="h-5 w-5 text-amber-600" />
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Primary Guest</h2>
                <p className="text-sm text-slate-500">Attach the lead guest profile to this stay.</p>
              </div>
            </div>
            <GuestSearchSelect
              value={primaryGuest}
              onChange={setPrimaryGuest}
              placeholder="Search by guest name, email, or phone..."
            />
          </section>

          <section className="rounded-[1.75rem] border border-amber-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-2">
                <BedDouble className="h-5 w-5 text-amber-600" />
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Room Selection</h2>
                  <p className="text-sm text-slate-500">
                    Filter by room type and select one or more available rooms.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <Filter className="h-3.5 w-3.5" />
                  Filters
                </span>
                {ROOM_TYPE_FILTERS.map((filter) => {
                  const active = selectedRoomTypes.includes(filter);
                  return (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => toggleRoomType(filter)}
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                        active
                          ? 'border-amber-500 bg-amber-500 text-white shadow-[0_8px_20px_rgba(217,119,6,0.25)]'
                          : 'border-amber-200 bg-white text-slate-600 hover:bg-amber-50',
                      )}
                    >
                      {filter}
                    </button>
                  );
                })}
                {selectedRoomTypes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedRoomTypes([])}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {!canSearchAvailability ? (
              <div className="rounded-3xl border border-dashed border-amber-300 bg-amber-50/60 px-6 py-10 text-center">
                <BedDouble className="mx-auto mb-3 h-10 w-10 text-amber-500" />
                <p className="font-semibold text-slate-900">Choose stay dates first</p>
                <p className="mt-1 text-sm text-slate-500">
                  Available rooms and rate totals will appear after valid dates are selected.
                </p>
              </div>
            ) : loadingAvailability ? (
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-40 rounded-3xl bg-amber-50 animate-pulse" />
                ))}
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-amber-300 bg-white px-6 py-10 text-center">
                <Sparkles className="mx-auto mb-3 h-10 w-10 text-amber-500" />
                <p className="font-semibold text-slate-900">No rooms match the selected filters</p>
                <p className="mt-1 text-sm text-slate-500">
                  Clear a filter or adjust the stay dates to continue.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {filteredRooms.map((room) => {
                  const isSelected = selectedRooms.some((selected) => selected.roomId === room.id);
                  const isAvailable = room.isAvailable;
                  const rate = Number(room.roomType?.baseRate ?? 0);
                  const maxOccupancy = room.roomType?.maxOccupancy ?? 0;
                  return (
                    <button
                      key={room.id}
                      type="button"
                      onClick={() => isAvailable && toggleRoom(room)}
                      disabled={!isAvailable}
                      className={cn(
                        'group relative overflow-hidden rounded-[1.5rem] border p-4 text-left transition duration-200',
                        isSelected
                          ? 'border-amber-500 bg-gradient-to-br from-amber-50 to-white shadow-[0_18px_45px_rgba(217,119,6,0.18)]'
                          : 'border-amber-200 bg-white shadow-sm hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)]',
                        !isAvailable && 'cursor-not-allowed opacity-55 grayscale',
                      )}
                    >
                      <div className="absolute right-4 top-4 rounded-full border border-amber-200 bg-white/90 px-2.5 py-1 text-xs font-bold text-amber-700">
                        {isAvailable ? 'Available' : 'Unavailable'}
                      </div>

                      <div className="mb-5 flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-950 text-white shadow-lg transition group-hover:bg-amber-600">
                          <BedDouble className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold tracking-tight text-slate-950">
                            Room {room.number}
                          </p>
                          <p className="text-sm text-slate-500">
                            {room.roomType?.name ?? 'Room'} - Floor {room.floor}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-50 p-2">
                        <div className="rounded-xl bg-white px-3 py-2">
                          <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Rate</p>
                          <p className="text-sm font-bold text-slate-950">{formatCurrency(rate)}</p>
                        </div>
                        <div className="rounded-xl bg-white px-3 py-2">
                          <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Total</p>
                          <p className="text-sm font-bold text-slate-950">
                            {formatCurrency(rate * nights)}
                          </p>
                        </div>
                        <div className="rounded-xl bg-white px-3 py-2">
                          <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Guests</p>
                          <p className="text-sm font-bold text-slate-950">
                            {maxOccupancy ? `Max ${maxOccupancy}` : 'Flexible'}
                          </p>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="absolute bottom-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-white shadow-lg">
                          <Check className="h-4 w-4" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-[1.75rem] border border-amber-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
            <h2 className="mb-5 text-lg font-semibold text-slate-950">Stay Notes</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}>Source / Channel</label>
                <select
                  value={source}
                  onChange={(event) => setSource(event.target.value)}
                  className={inputClass}
                >
                  <option value="">Select source...</option>
                  <option value="Direct">Direct</option>
                  <option value="Phone">Phone</option>
                  <option value="Email">Email</option>
                  <option value="Walk-in">Walk-in</option>
                  <option value="OTA">OTA</option>
                  <option value="Corporate">Corporate</option>
                  <option value="Travel Agent">Travel Agent</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Special Requests</label>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                  placeholder="Late arrival, amenities, VIP preferences..."
                  className={cn(inputClass, 'min-h-[92px] resize-none')}
                />
              </div>
            </div>
          </section>
        </div>

        <aside className="xl:sticky xl:top-6 xl:self-start">
          <div className="overflow-hidden rounded-[2rem] border border-amber-200 bg-white shadow-[0_24px_80px_rgba(146,106,30,0.16)]">
            <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 p-6 text-white">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">
                    Booking Summary
                  </p>
                  <h2 className="mt-2 text-2xl font-bold">{formatCurrency(totalAmount)}</h2>
                </div>
                <div className="rounded-2xl bg-white/10 p-3 text-amber-200">
                  <DollarSign className="h-6 w-6" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-2xl bg-white/10 p-3">
                  <p className="text-lg font-bold">{nights}</p>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-white/60">Nights</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-3">
                  <p className="text-lg font-bold">{totalGuests}</p>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-white/60">Guests</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-3">
                  <p className="text-lg font-bold">{selectedRooms.length}</p>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-white/60">Rooms</p>
                </div>
              </div>
            </div>

            <div className="space-y-5 p-6">
              <div className="space-y-3 rounded-3xl bg-amber-50/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">
                  Guest mix
                </p>
                {AGE_CATEGORIES.map((category) => (
                  <div key={category.key} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{category.label}</span>
                    <span className="font-bold text-slate-950">
                      {ageCategoryCounts[category.key]}
                    </span>
                  </div>
                ))}
              </div>

              {primaryGuest && (
                <div className="rounded-3xl border border-amber-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Lead guest
                  </p>
                  <p className="mt-2 font-semibold text-slate-950">{primaryGuest.fullName}</p>
                  <p className="text-sm text-slate-500">{primaryGuest.email ?? primaryGuest.phone}</p>
                </div>
              )}

              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Selected rooms
                </p>
                {selectedRooms.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-amber-200 p-5 text-center text-sm text-slate-500">
                    No rooms selected yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedRooms.map((room) => (
                      <div
                        key={room.roomId}
                        className="flex items-center justify-between gap-3 rounded-3xl border border-amber-200 bg-white p-4 shadow-sm"
                      >
                        <div>
                          <p className="font-semibold text-slate-950">Room {room.number}</p>
                          <p className="text-xs text-slate-500">{room.typeName}</p>
                        </div>
                        <p className="font-bold text-amber-700">{formatCurrency(room.totalRate)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-3xl bg-slate-50 p-4">
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>Room subtotal</span>
                  <span>{formatCurrency(totalAmount)}</span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
                  <span className="font-semibold text-slate-950">Estimated total</span>
                  <span className="text-xl font-bold text-slate-950">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={
                  createReservation.isPending ||
                  !propertyId ||
                  selectedRooms.length === 0 ||
                  nights <= 0
                }
                className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-600 px-5 py-3 text-sm font-bold text-white shadow-[0_16px_35px_rgba(217,119,6,0.28)] transition hover:from-amber-600 hover:to-yellow-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {createReservation.isPending ? 'Creating reservation...' : 'Create Reservation'}
              </button>
              <Link
                href="/reservations"
                className="block w-full rounded-2xl border border-amber-200 px-5 py-3 text-center text-sm font-semibold text-slate-600 transition hover:bg-amber-50"
              >
                Cancel
              </Link>
            </div>
          </div>
        </aside>
      </form>
    </div>
  );
}
