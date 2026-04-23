'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  CheckCheck,
  Info,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Moon,
  X,
} from 'lucide-react';
import { notificationsApi } from '@/lib/api/notifications.api';
import { unwrapApiData, unwrapPaginatedApiData } from '@/lib/api/response';
import { NotificationDto, NotificationType } from '@Noblesse/shared';
import { formatRelativeTime } from '@/lib/utils';
import { toast } from 'sonner';

// ─── Helpers ────────────────────────────────────────────────────────────────

function getIcon(type: NotificationType) {
  switch (type) {
    case NotificationType.RESERVATION_CREATED:
    case NotificationType.RESERVATION_CANCELLED:
      return <Bell className="w-4 h-4 text-gold-500 shrink-0" />;
    case NotificationType.CHECK_IN:
    case NotificationType.CHECK_OUT:
      return <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />;
    case NotificationType.HOUSEKEEPING_ASSIGNED:
      return <Info className="w-4 h-4 text-blue-500 shrink-0" />;
    case NotificationType.MAINTENANCE_CREATED:
      return <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" />;
    case NotificationType.PAYMENT_RECEIVED:
      return <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />;
    case NotificationType.NIGHT_AUDIT_COMPLETE:
      return <Moon className="w-4 h-4 text-purple-500 shrink-0" />;
    case NotificationType.SYSTEM_ALERT:
      return <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />;
    default:
      return <Bell className="w-4 h-4 text-muted-foreground shrink-0" />;
  }
}

function getNavHref(n: NotificationDto): string {
  const data = n.data as Record<string, string> | null;
  switch (n.type) {
    case NotificationType.RESERVATION_CREATED:
    case NotificationType.RESERVATION_CANCELLED:
    case NotificationType.CHECK_IN:
    case NotificationType.CHECK_OUT:
      return data?.reservationId ? `/reservations/${data.reservationId}` : '/reservations';
    case NotificationType.HOUSEKEEPING_ASSIGNED:
      return '/housekeeping';
    case NotificationType.MAINTENANCE_CREATED:
      return '/maintenance';
    case NotificationType.PAYMENT_RECEIVED:
      return data?.reservationId ? `/reservations/${data.reservationId}/folio` : '/reservations';
    case NotificationType.NIGHT_AUDIT_COMPLETE:
      return '/night-audit';
    default:
      return '/notifications';
  }
}

// ─── Component ──────────────────────────────────────────────────────────────

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Unread count (polled every 30s)
  const { data: unreadCount } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsApi.getUnreadCount(),
    refetchInterval: 30000,
    select: (res) => unwrapApiData<{ count: number }>(res).count,
  });

  // Recent notifications (fetched when dropdown opens)
  const { data: recent, isLoading } = useQuery({
    queryKey: ['notifications', 'recent'],
    queryFn: () => notificationsApi.getAll({ limit: 8 }),
    enabled: open,
    select: (res) => unwrapPaginatedApiData<NotificationDto>(res).data,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: () => toast.error('Failed to mark as read'),
  });

  const markAllRead = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All notifications marked as read');
    },
    onError: () => toast.error('Failed to mark all as read'),
  });

  const count = unreadCount ?? 0;

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {count > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-gold-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm font-semibold text-foreground">Notifications</span>
            <div className="flex items-center gap-1">
              {count > 0 && (
                <button
                  onClick={() => markAllRead.mutate()}
                  disabled={markAllRead.isPending}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors disabled:opacity-50"
                  title="Mark all as read"
                >
                  <CheckCheck size={13} />
                  <span>All read</span>
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-border">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-4 py-3 flex gap-3 animate-pulse">
                  <div className="w-4 h-4 bg-muted rounded-full mt-0.5 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-muted rounded w-3/4" />
                    <div className="h-2.5 bg-muted rounded w-full" />
                    <div className="h-2 bg-muted rounded w-1/3" />
                  </div>
                </div>
              ))
            ) : !recent || recent.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No notifications yet
              </div>
            ) : (
              recent.map((n) => (
                <Link
                  key={n.id}
                  href={getNavHref(n)}
                  onClick={() => {
                    if (!n.isRead) markRead.mutate(n.id);
                    setOpen(false);
                  }}
                  className={`flex gap-3 px-4 py-3 hover:bg-muted/50 transition-colors ${
                    !n.isRead ? 'bg-gold-500/5' : ''
                  }`}
                >
                  <div className="mt-0.5">{getIcon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium truncate ${!n.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {n.message}
                    </p>
                    <p className="text-[10px] text-muted-foreground/70 mt-1">
                      {formatRelativeTime(n.createdAt)}
                    </p>
                  </div>
                  {!n.isRead && (
                    <div className="w-1.5 h-1.5 rounded-full bg-gold-500 mt-1.5 shrink-0" />
                  )}
                </Link>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border px-4 py-2.5">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="block text-center text-xs text-gold-600 hover:text-gold-700 font-medium transition-colors"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
