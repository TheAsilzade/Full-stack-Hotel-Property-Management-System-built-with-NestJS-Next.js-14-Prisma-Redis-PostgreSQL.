'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { format, isPast, parseISO } from 'date-fns';
import {
  useTodayArrivals,
  useTodayDepartures,
  useInHouseGuests,
  useCheckIn,
  useCheckOut,
} from '@/lib/hooks/useFrontDesk';
import type { ReservationDto } from '@Noblesse/shared';
import {
  LogIn,
  LogOut,
  Star,
  Search,
  Plus,
  Clock,
  Users,
  CalendarCheck,
  CalendarX,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';

// ─── Helpers ───────────────────────────────────────────────────────────────

function isVip(res: ReservationDto): boolean {
  return (res.primaryGuest?.totalStays ?? 0) >= 5;
}

function isOverdue(res: ReservationDto): boolean {
  // A departure is overdue if checkout date is today or past and still checked in
  return isPast(parseISO(res.checkOut));
}

function guestName(res: ReservationDto): string {
  if (res.primaryGuest) {
    return `${res.primaryGuest.firstName} ${res.primaryGuest.lastName}`;
  }
  return 'Unknown Guest';
}

function roomNumbers(res: ReservationDto): string {
  return res.rooms.map((r) => r.room?.number ?? '—').join(', ') || '—';
}

// ─── Stat Card ─────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
      <div className={cn('p-2.5 rounded-lg', color)}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

// ─── Arrival Row ───────────────────────────────────────────────────────────

function ArrivalRow({
  res,
  onCheckIn,
  isPending,
}: {
  res: ReservationDto;
  onCheckIn: (id: string) => void;
  isPending: boolean;
}) {
  const vip = isVip(res);
  return (
    <tr className="border-b border-border hover:bg-muted/10 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {vip && <Star size={13} className="text-yellow-500 fill-yellow-500 shrink-0" />}
          <div>
            <p className="font-medium text-sm text-foreground">{guestName(res)}</p>
            {vip && <p className="text-xs text-yellow-600 font-medium">VIP Guest</p>}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground font-mono">
        {res.confirmationNumber}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {roomNumbers(res)}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {res.nights}n · {res.adults}A{res.children > 0 ? ` ${res.children}C` : ''}
      </td>
      <td className="px-4 py-3 text-sm text-right">
        {res.balanceDue > 0 && (
          <span className="text-xs text-red-600 font-medium">
            {formatCurrency(res.balanceDue)} due
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          <Link
            href={`/reservations/${res.id}`}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            title="View reservation"
          >
            <ExternalLink size={14} />
          </Link>
          <button
            onClick={() => onCheckIn(res.id)}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <LogIn size={12} /> Check In
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Departure Row ─────────────────────────────────────────────────────────

function DepartureRow({
  res,
  onCheckOut,
  isPending,
}: {
  res: ReservationDto;
  onCheckOut: (id: string) => void;
  isPending: boolean;
}) {
  const vip = isVip(res);
  const overdue = isOverdue(res);

  return (
    <tr
      className={cn(
        'border-b border-border transition-colors',
        overdue ? 'bg-red-50/50 hover:bg-red-50' : 'hover:bg-muted/10',
      )}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {vip && <Star size={13} className="text-yellow-500 fill-yellow-500 shrink-0" />}
          {overdue && <AlertTriangle size={13} className="text-red-500 shrink-0" />}
          <div>
            <p className="font-medium text-sm text-foreground">{guestName(res)}</p>
            {overdue && <p className="text-xs text-red-600 font-medium">Overdue checkout</p>}
            {vip && !overdue && <p className="text-xs text-yellow-600 font-medium">VIP Guest</p>}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground font-mono">
        {res.confirmationNumber}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {roomNumbers(res)}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {format(parseISO(res.checkOut), 'MMM d')}
      </td>
      <td className="px-4 py-3 text-sm text-right">
        {res.balanceDue > 0 && (
          <span className="text-xs text-red-600 font-medium">
            {formatCurrency(res.balanceDue)} due
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          <Link
            href={`/reservations/${res.id}`}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            title="View reservation"
          >
            <ExternalLink size={14} />
          </Link>
          <button
            onClick={() => onCheckOut(res.id)}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            <LogOut size={12} /> Check Out
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Skeleton rows ─────────────────────────────────────────────────────────

function SkeletonRows({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <tr key={i} className="border-b border-border animate-pulse">
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 bg-muted rounded w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function FrontDeskPage() {
  const [inHouseSearch, setInHouseSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'arrivals' | 'departures' | 'in-house'>('arrivals');

  const queryClient = useQueryClient();

  const { data: arrivals = [], isLoading: arrivalsLoading } = useTodayArrivals();
  const { data: departures = [], isLoading: departuresLoading } = useTodayDepartures();
  const { data: inHouse = [], isLoading: inHouseLoading } = useInHouseGuests(
    inHouseSearch || undefined,
  );

  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();

  const overdueCount = departures.filter(isOverdue).length;
  const vipArrivals = arrivals.filter(isVip).length;

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['front-desk'] });
  };

  const tabs = [
    { id: 'arrivals' as const, label: 'Arrivals', count: arrivals.length },
    { id: 'departures' as const, label: 'Departures', count: departures.length },
    { id: 'in-house' as const, label: 'In-House', count: inHouse.length },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">Front Desk</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="p-2 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground"
            title="Refresh"
          >
            <RefreshCw size={15} />
          </button>
          <Link
            href="/reservations/new"
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus size={15} /> New Reservation
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={CalendarCheck}
          label="Today's Arrivals"
          value={arrivals.length}
          color="bg-blue-500"
        />
        <StatCard
          icon={CalendarX}
          label="Today's Departures"
          value={departures.length}
          color="bg-orange-500"
        />
        <StatCard
          icon={Users}
          label="In-House Guests"
          value={inHouse.length}
          color="bg-green-500"
        />
        <StatCard
          icon={overdueCount > 0 ? AlertTriangle : Clock}
          label="Overdue Checkouts"
          value={overdueCount}
          color={overdueCount > 0 ? 'bg-red-500' : 'bg-muted-foreground/50'}
        />
      </div>

      {/* VIP alert */}
      {vipArrivals > 0 && (
        <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
          <Star size={16} className="text-yellow-500 fill-yellow-500 shrink-0" />
          <span>
            <strong>{vipArrivals} VIP guest{vipArrivals > 1 ? 's' : ''}</strong> arriving today.
            Ensure rooms are prepared and amenities are in place.
          </span>
        </div>
      )}

      {/* Overdue alert */}
      {overdueCount > 0 && (
        <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertTriangle size={16} className="shrink-0" />
          <span>
            <strong>{overdueCount} guest{overdueCount > 1 ? 's' : ''}</strong> overdue for
            checkout. Please follow up immediately.
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="flex border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px',
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
              <span
                className={cn(
                  'px-1.5 py-0.5 rounded-full text-xs font-semibold',
                  activeTab === tab.id
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Arrivals tab */}
        {activeTab === 'arrivals' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                    Guest
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                    Confirmation
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                    Room(s)
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                    Stay
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
                    Balance
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {arrivalsLoading ? (
                  <SkeletonRows cols={6} />
                ) : arrivals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground text-sm">
                      No arrivals scheduled for today.
                    </td>
                  </tr>
                ) : (
                  // VIP guests first, then alphabetical
                  [...arrivals]
                    .sort((a, b) => {
                      const aVip = isVip(a) ? 0 : 1;
                      const bVip = isVip(b) ? 0 : 1;
                      if (aVip !== bVip) return aVip - bVip;
                      return guestName(a).localeCompare(guestName(b));
                    })
                    .map((res) => (
                      <ArrivalRow
                        key={res.id}
                        res={res}
                        onCheckIn={(id) => checkInMutation.mutate(id)}
                        isPending={checkInMutation.isPending}
                      />
                    ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Departures tab */}
        {activeTab === 'departures' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                    Guest
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                    Confirmation
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                    Room(s)
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                    Checkout
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
                    Balance
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {departuresLoading ? (
                  <SkeletonRows cols={6} />
                ) : departures.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground text-sm">
                      No departures today.
                    </td>
                  </tr>
                ) : (
                  // Overdue first, then VIP, then by checkout date
                  [...departures]
                    .sort((a, b) => {
                      const aOver = isOverdue(a) ? 0 : 1;
                      const bOver = isOverdue(b) ? 0 : 1;
                      if (aOver !== bOver) return aOver - bOver;
                      const aVip = isVip(a) ? 0 : 1;
                      const bVip = isVip(b) ? 0 : 1;
                      if (aVip !== bVip) return aVip - bVip;
                      return a.checkOut.localeCompare(b.checkOut);
                    })
                    .map((res) => (
                      <DepartureRow
                        key={res.id}
                        res={res}
                        onCheckOut={(id) => checkOutMutation.mutate(id)}
                        isPending={checkOutMutation.isPending}
                      />
                    ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* In-House tab */}
        {activeTab === 'in-house' && (
          <div>
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  type="text"
                  placeholder="Search guests, confirmation, room…"
                  value={inHouseSearch}
                  onChange={(e) => setInHouseSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                      Guest
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                      Confirmation
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                      Room(s)
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                      Check-In
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                      Check-Out
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
                      Balance
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {inHouseLoading ? (
                    <SkeletonRows cols={7} />
                  ) : inHouse.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-12 text-center text-muted-foreground text-sm"
                      >
                        {inHouseSearch ? 'No guests match your search.' : 'No guests currently in-house.'}
                      </td>
                    </tr>
                  ) : (
                    [...inHouse]
                      .sort((a, b) => {
                        const aVip = isVip(a) ? 0 : 1;
                        const bVip = isVip(b) ? 0 : 1;
                        if (aVip !== bVip) return aVip - bVip;
                        return guestName(a).localeCompare(guestName(b));
                      })
                      .map((res) => {
                        const vip = isVip(res);
                        return (
                          <tr
                            key={res.id}
                            className="border-b border-border hover:bg-muted/10 transition-colors"
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {vip && (
                                  <Star
                                    size={13}
                                    className="text-yellow-500 fill-yellow-500 shrink-0"
                                  />
                                )}
                                <div>
                                  <p className="font-medium text-foreground">{guestName(res)}</p>
                                  {vip && (
                                    <p className="text-xs text-yellow-600 font-medium">VIP</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                              {res.confirmationNumber}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {roomNumbers(res)}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground text-xs">
                              {format(parseISO(res.checkIn), 'MMM d')}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground text-xs">
                              {format(parseISO(res.checkOut), 'MMM d')}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {res.balanceDue > 0 ? (
                                <span className="text-xs text-red-600 font-medium">
                                  {formatCurrency(res.balanceDue)}
                                </span>
                              ) : (
                                <span className="text-xs text-green-600">Settled</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Link
                                  href={`/reservations/${res.id}`}
                                  className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                                  title="View reservation"
                                >
                                  <ExternalLink size={13} />
                                </Link>
                                <Link
                                  href={`/reservations/${res.id}/folio`}
                                  className="px-2.5 py-1 text-xs border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                >
                                  Folio
                                </Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}