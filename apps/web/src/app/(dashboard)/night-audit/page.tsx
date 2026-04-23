'use client';

import React from 'react';


import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { unwrapPaginatedApiData } from '@/lib/api/response';
import { useAuthStore } from '@/store/auth.store';
import { Moon, Play, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate, formatDateTime } from '@/lib/utils';

interface RawNightAuditLog {
  id: string;
  auditDate: string;
  status: string;
  summary?: {
    roomChargesPosted?: number;
    noShowsProcessed?: number;
    totalRevenue?: number;
    totalRoomRevenue?: number;
  };
  completedAt?: string;
  createdAt: string;
}

interface NightAuditLog {
  id: string;
  auditDate: string;
  status: string;
  roomChargesPosted: number;
  noShowsProcessed: number;
  totalRevenue: number;
  runBy?: { firstName: string; lastName: string };
  completedAt?: string;
  createdAt: string;
}

function mapNightAuditLog(log: RawNightAuditLog): NightAuditLog {
  return {
    id: log.id,
    auditDate: log.auditDate,
    status: log.status,
    roomChargesPosted: log.summary?.roomChargesPosted ?? 0,
    noShowsProcessed: log.summary?.noShowsProcessed ?? 0,
    totalRevenue: log.summary?.totalRevenue ?? log.summary?.totalRoomRevenue ?? 0,
    completedAt: log.completedAt,
    createdAt: log.createdAt,
  };
}

export default function NightAuditPage() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const user = useAuthStore((s) => s.user);
  const propertyId = user?.propertyIds?.[0] ?? '';

  const { data: history, isLoading } = useQuery({
    queryKey: ['night-audit', 'history', propertyId],
    queryFn: () => apiClient.get('/v1/night-audit/history', { params: { propertyId } }),
    enabled: !!propertyId,
    select: (res) =>
      unwrapPaginatedApiData<RawNightAuditLog>(res).data.map(mapNightAuditLog),
  });

  const runAuditMutation = useMutation({
    mutationFn: (auditDate: string) =>
      apiClient.post('/v1/night-audit/run', { auditDate, propertyId }),
    onSuccess: () => {
      toast.success('Night audit completed successfully');
      queryClient.invalidateQueries({ queryKey: ['night-audit'] });
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to run night audit';
      toast.error(message);
    },
  });

  const todayAudit = history?.find(
    (a) => a.auditDate.split('T')[0] === selectedDate,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground font-display">Night Audit</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Run end-of-day audit to post room charges and process no-shows
        </p>
      </div>

      {/* Run Audit Panel */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gold-50 flex items-center justify-center shrink-0">
            <Moon size={24} className="text-gold-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-foreground">Run Night Audit</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Posts room charges for all in-house reservations, processes no-shows, and creates an
              audit log entry.
            </p>

            <div className="flex items-center gap-3 mt-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Audit Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 text-foreground"
                />
              </div>

              {todayAudit ? (
                <div className="flex items-center gap-2 mt-5 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
                  <CheckCircle2 size={16} />
                  Audit already run for this date
                </div>
              ) : (
                <button
                  onClick={() => runAuditMutation.mutate(selectedDate)}
                  disabled={runAuditMutation.isPending}
                  className="mt-5 flex items-center gap-2 px-4 py-2 bg-gold-500 text-white rounded-lg text-sm font-medium hover:bg-gold-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {runAuditMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play size={16} />
                      Run Audit
                    </>
                  )}
                </button>
              )}
            </div>

            {todayAudit && (
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="bg-muted/40 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-foreground">
                    {todayAudit.roomChargesPosted}
                  </p>
                  <p className="text-xs text-muted-foreground">Room Charges Posted</p>
                </div>
                <div className="bg-muted/40 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-foreground">
                    {todayAudit.noShowsProcessed}
                  </p>
                  <p className="text-xs text-muted-foreground">No-Shows Processed</p>
                </div>
                <div className="bg-muted/40 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-foreground">
                    ${todayAudit.totalRevenue?.toFixed(2) ?? '0.00'}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Revenue</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Audit History */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/40">
          <h2 className="text-sm font-semibold text-foreground">Audit History</h2>
        </div>

        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : !history || history.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <AlertCircle size={32} className="mx-auto mb-2 opacity-30" />
            <p>No audit history found</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {history.map((audit) => (
              <div
                key={audit.id}
                className="flex items-center gap-4 px-4 py-3 hover:bg-muted/20 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-gold-50 flex items-center justify-center shrink-0">
                  <Moon size={14} className="text-gold-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {formatDate(audit.auditDate)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {audit.roomChargesPosted} charges - {audit.noShowsProcessed} no-shows -
                    {audit.runBy
                      ? ` Run by ${audit.runBy.firstName} ${audit.runBy.lastName}`
                      : ' System'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-foreground">
                    ${audit.totalRevenue?.toFixed(2) ?? '0.00'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {audit.completedAt ? formatDateTime(audit.completedAt) : '-'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
