'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { guestsApi } from '@/lib/api/guests.api';
import { unwrapPaginatedApiData } from '@/lib/api/response';
import { GuestDto } from '@Noblesse/shared';
import { Search, X, User } from 'lucide-react';

interface GuestSearchSelectProps {
  value?: GuestDto | null;
  onChange: (guest: GuestDto | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function GuestSearchSelect({
  value,
  onChange,
  placeholder = 'Search guests...',
  disabled = false,
  className = '',
}: GuestSearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['guests', 'search', search],
    queryFn: () => guestsApi.getAll({ search, limit: 10 }),
    enabled: open && search.length >= 1,
    select: (res) => unwrapPaginatedApiData<GuestDto>(res).data,
  });

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelect(guest: GuestDto) {
    onChange(guest);
    setOpen(false);
    setSearch('');
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange(null);
    setSearch('');
  }

  function handleInputFocus() {
    setOpen(true);
  }

  const guests: GuestDto[] = data ?? [];

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Selected value display / search input */}
      {value && !open ? (
        <div
          className={`flex items-center gap-2 h-10 px-3 rounded-md border border-input bg-background text-sm cursor-pointer hover:border-ring transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => {
            if (!disabled) {
              setOpen(true);
              setTimeout(() => inputRef.current?.focus(), 0);
            }
          }}
        >
          <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary shrink-0">
            <span className="text-xs font-semibold">
              {value.firstName[0]}{value.lastName[0]}
            </span>
          </div>
          <span className="flex-1 truncate">
            {value.firstName} {value.lastName}
            {value.email && (
              <span className="text-muted-foreground ml-1">· {value.email}</span>
            )}
          </span>
          {!disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={handleInputFocus}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full h-10 pl-9 pr-3 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      )}

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg overflow-hidden">
          {/* Search input inside dropdown when value is selected */}
          {value && (
            <div className="p-2 border-b border-border">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <input
                  ref={inputRef}
                  autoFocus
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, email, or phone..."
                  className="w-full h-8 pl-8 pr-3 rounded border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>
          )}

          <div className="max-h-60 overflow-y-auto">
            {isLoading ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                Searching...
              </div>
            ) : isError ? (
              <div className="px-3 py-6 text-center text-sm text-red-500">
                Error loading guests — check permissions
              </div>
            ) : search.length < 1 ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                Type to search guests
              </div>
            ) : guests.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                No guests found for &quot;{search}&quot;
              </div>
            ) : (
              guests.map((guest) => (
                <button
                  key={guest.id}
                  type="button"
                  onClick={() => handleSelect(guest)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-accent transition-colors"
                >
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary shrink-0">
                    <span className="text-xs font-semibold">
                      {guest.firstName[0]}{guest.lastName[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {guest.firstName} {guest.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {[guest.email, guest.phone].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  {guest.nationality && (
                    <span className="text-xs text-muted-foreground shrink-0">
                      {guest.nationality}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Create new guest link */}
          <div className="border-t border-border p-2">
            <a
              href="/guests/new"
              className="flex items-center gap-2 px-2 py-1.5 text-sm text-primary hover:underline"
            >
              <User className="h-3.5 w-3.5" />
              Create new guest
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
