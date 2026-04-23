'use client';

import React from 'react';


import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { guestsApi } from '@/lib/api/guests.api';
import { unwrapPaginatedApiData } from '@/lib/api/response';
import type { GuestDto } from '@Noblesse/shared';
import { Users, Search, Plus, Star } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

export default function GuestsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['guests', page, search],
    queryFn: () => guestsApi.getAll({ page, limit, search: search || undefined }),
    select: (res) => unwrapPaginatedApiData<GuestDto>(res),
  });

  const guests = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">Guests</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {meta?.total ?? 0} guests in database
          </p>
        </div>
        <Link
          href="/guests/new"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={16} />
          Add Guest
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by name, email, phone…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
        />
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Phone</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nationality</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Stays</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Since</th>
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
              ) : guests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    <Users size={32} className="mx-auto mb-2 opacity-30" />
                    <p>No guests found</p>
                  </td>
                </tr>
              ) : (
                guests.map((guest) => (
                  <tr
                    key={guest.id}
                    className="border-b border-border hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gold-100 flex items-center justify-center shrink-0">
                          <span className="text-gold-700 text-xs font-semibold">
                            {guest.firstName?.[0]}{guest.lastName?.[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {guest.firstName} {guest.lastName}
                          </p>
                          {guest.totalStays > 5 && (
                            <span className="inline-flex items-center gap-0.5 text-xs text-gold-600">
                              <Star size={10} fill="currentColor" /> VIP
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{guest.email ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{guest.phone ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{guest.nationality ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{guest.totalStays}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(guest.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/guests/${guest.id}`}
                        className="px-2.5 py-1 text-xs bg-muted text-muted-foreground rounded-md hover:bg-muted/80 transition-colors font-medium"
                      >
                        View
                      </Link>
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
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, meta.total)} of {meta.total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-xs bg-muted rounded-md disabled:opacity-40 hover:bg-muted/80 transition-colors"
              >
                Previous
              </button>
              <span className="text-xs text-muted-foreground">
                {page} / {meta.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={page === meta.totalPages}
                className="px-3 py-1 text-xs bg-muted rounded-md disabled:opacity-40 hover:bg-muted/80 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
