'use client';

import React, { useDeferredValue, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Menu, Search, User } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { getInitials } from '@/lib/utils';
import { NotificationBell } from '@/components/common/NotificationBell';
import { guestsApi } from '@/lib/api/guests.api';
import { reservationsApi } from '@/lib/api/reservations.api';
import { unwrapPaginatedApiData } from '@/lib/api/response';
import type { GuestDto, ReservationDto } from '@Noblesse/shared';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const deferredSearch = useDeferredValue(search.trim());
  const containerRef = useRef<HTMLDivElement>(null);
  const canSearch = deferredSearch.length >= 2;

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const { data: reservationResults = [], isFetching: loadingReservations } = useQuery({
    queryKey: ['global-search', 'reservations', deferredSearch],
    queryFn: () => reservationsApi.getAll({ search: deferredSearch, limit: 5 }),
    select: (res) => unwrapPaginatedApiData<ReservationDto>(res).data,
    enabled: open && canSearch,
  });

  const { data: guestResults = [], isFetching: loadingGuests } = useQuery({
    queryKey: ['global-search', 'guests', deferredSearch],
    queryFn: () => guestsApi.getAll({ search: deferredSearch, limit: 5 }),
    select: (res) => unwrapPaginatedApiData<GuestDto>(res).data,
    enabled: open && canSearch,
  });

  const isSearching = loadingReservations || loadingGuests;
  const hasResults = reservationResults.length > 0 || guestResults.length > 0;

  function closeSearch() {
    setOpen(false);
    setSearch('');
  }

  return (
    <header className="h-16 bg-card border-b border-border flex items-center px-4 gap-4 shrink-0">
      {onMenuClick && (
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Menu size={20} />
        </button>
      )}

      <div ref={containerRef} className="flex-1 max-w-md relative">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Search reservations, guests..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-muted rounded-lg border border-transparent focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-all placeholder:text-muted-foreground"
          />
        </div>

        {open && search.trim().length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
            {!canSearch ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                Type at least 2 characters to search.
              </div>
            ) : isSearching ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                Searching...
              </div>
            ) : !hasResults ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                No guests or reservations found for &quot;{deferredSearch}&quot;.
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto py-2">
                {reservationResults.length > 0 && (
                  <div>
                    <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Reservations
                    </p>
                    {reservationResults.map((reservation) => (
                      <Link
                        key={reservation.id}
                        href={`/reservations/${reservation.id}`}
                        onClick={closeSearch}
                        className="flex items-start gap-3 px-3 py-2.5 hover:bg-muted/60 transition-colors"
                      >
                        <CalendarDays className="mt-0.5 h-4 w-4 text-gold-600 shrink-0" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium text-foreground truncate">
                            {reservation.confirmationNumber}
                          </span>
                          <span className="block text-xs text-muted-foreground truncate">
                            {reservation.primaryGuest
                              ? `${reservation.primaryGuest.firstName} ${reservation.primaryGuest.lastName}`
                              : 'No primary guest'}{' '}
                            | {reservation.status}
                          </span>
                        </span>
                      </Link>
                    ))}
                  </div>
                )}

                {guestResults.length > 0 && (
                  <div>
                    <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Guests
                    </p>
                    {guestResults.map((guest) => (
                      <Link
                        key={guest.id}
                        href={`/guests/${guest.id}`}
                        onClick={closeSearch}
                        className="flex items-start gap-3 px-3 py-2.5 hover:bg-muted/60 transition-colors"
                      >
                        <User className="mt-0.5 h-4 w-4 text-gold-600 shrink-0" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium text-foreground truncate">
                            {guest.fullName ?? `${guest.firstName} ${guest.lastName}`}
                          </span>
                          <span className="block text-xs text-muted-foreground truncate">
                            {[guest.email, guest.phone].filter(Boolean).join(' | ') ||
                              'Guest profile'}
                          </span>
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <NotificationBell />

        {user && (
          <div className="flex items-center gap-2 pl-2 border-l border-border">
            <div className="w-8 h-8 rounded-full bg-gold-500 flex items-center justify-center">
              <span className="text-white text-xs font-semibold">
                {getInitials(user.firstName, user.lastName)}
              </span>
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-foreground leading-tight">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-muted-foreground leading-tight">
                {user.roles[0] ?? 'Staff'}
              </p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
