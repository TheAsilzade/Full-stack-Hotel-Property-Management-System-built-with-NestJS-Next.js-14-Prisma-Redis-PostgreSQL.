'use client';

import React from 'react';


import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { unwrapPaginatedApiData } from '@/lib/api/response';
import { MaintenanceStatus, MaintenancePriority } from '@Noblesse/shared';
import type { MaintenanceTicketDto } from '@Noblesse/shared';
import { Wrench, Plus, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatDate } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  [MaintenanceStatus.OPEN]: { label: 'Open', color: 'text-red-700', bg: 'bg-red-100' },
  [MaintenanceStatus.IN_PROGRESS]: {
    label: 'In Progress',
    color: 'text-blue-700',
    bg: 'bg-blue-100',
  },
  [MaintenanceStatus.RESOLVED]: {
    label: 'Resolved',
    color: 'text-green-700',
    bg: 'bg-green-100',
  },
  [MaintenanceStatus.CLOSED]: { label: 'Closed', color: 'text-gray-600', bg: 'bg-gray-100' },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  [MaintenancePriority.LOW]: { label: 'Low', color: 'text-gray-500' },
  [MaintenancePriority.MEDIUM]: { label: 'Medium', color: 'text-yellow-600' },
  [MaintenancePriority.HIGH]: { label: 'High', color: 'text-orange-600' },
  [MaintenancePriority.URGENT]: { label: 'Urgent', color: 'text-red-600' },
};

export default function MaintenancePage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['maintenance', statusFilter],
    queryFn: () =>
      apiClient.get('/v1/maintenance', {
        params: { status: statusFilter || undefined },
      }),
    select: (res) =>
      unwrapPaginatedApiData<MaintenanceTicketDto>(res),
  });

  const startMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/v1/maintenance/${id}/start`),
    onSuccess: () => {
      toast.success('Work started');
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
    },
    onError: () => toast.error('Failed to start work'),
  });

  const resolveMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/v1/maintenance/${id}/resolve`, { resolution: 'Resolved' }),
    onSuccess: () => {
      toast.success('Ticket resolved');
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
    },
    onError: () => toast.error('Failed to resolve ticket'),
  });

  const tickets = data?.data ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">Maintenance</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {data?.meta?.total ?? tickets.length} tickets total
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-white rounded-lg text-sm font-medium hover:bg-gold-600 transition-colors">
          <Plus size={16} />
          New Ticket
        </button>
      </div>

      {/* Filter */}
      <div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 text-foreground"
        >
          <option value="">All Statuses</option>
          {Object.values(MaintenanceStatus).map((s) => (
            <option key={s} value={s}>
              {STATUS_CONFIG[s]?.label ?? s}
            </option>
          ))}
        </select>
      </div>

      {/* Ticket list */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Wrench size={32} className="mx-auto mb-2 opacity-30" />
            <p>No maintenance tickets found</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {tickets.map((ticket) => {
              const statusCfg = STATUS_CONFIG[ticket.status] ?? {
                label: ticket.status,
                color: 'text-gray-600',
                bg: 'bg-gray-100',
              };
              const priorityCfg = PRIORITY_CONFIG[ticket.priority] ?? {
                label: ticket.priority,
                color: 'text-gray-500',
              };
              return (
                <div key={ticket.id} className="p-4 hover:bg-muted/20 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {ticket.title}
                        </p>
                        <span
                          className={cn(
                            'shrink-0 px-2 py-0.5 rounded-full text-xs font-medium',
                            statusCfg.bg,
                            statusCfg.color,
                          )}
                        >
                          {statusCfg.label}
                        </span>
                        <span
                          className={cn(
                            'shrink-0 flex items-center gap-0.5 text-xs font-medium',
                            priorityCfg.color,
                          )}
                        >
                          <AlertTriangle size={11} />
                          {priorityCfg.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {ticket.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Room {ticket.room?.number ?? '—'} ·{' '}
                        {ticket.assignedTo
                          ? `${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}`
                          : 'Unassigned'}{' '}
                        · {formatDate(ticket.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {ticket.status === MaintenanceStatus.OPEN && (
                        <button
                          onClick={() => startMutation.mutate(ticket.id)}
                          disabled={startMutation.isPending}
                          className="px-2.5 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors font-medium"
                        >
                          Start
                        </button>
                      )}
                      {ticket.status === MaintenanceStatus.IN_PROGRESS && (
                        <button
                          onClick={() => resolveMutation.mutate(ticket.id)}
                          disabled={resolveMutation.isPending}
                          className="px-2.5 py-1 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors font-medium"
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
