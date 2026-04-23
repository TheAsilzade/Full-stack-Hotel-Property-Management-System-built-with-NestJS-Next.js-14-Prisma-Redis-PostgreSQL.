'use client';

import React from 'react';


import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, CheckCheck, Trash2, Info, AlertTriangle, AlertCircle, CheckCircle, Moon } from 'lucide-react';
import { notificationsApi } from '@/lib/api/notifications.api';
import { unwrapPaginatedApiData } from '@/lib/api/response';
import { NotificationDto, NotificationType } from '@Noblesse/shared';
import { formatRelativeTime } from '@/lib/utils';
import { toast } from 'sonner';

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case NotificationType.RESERVATION_CREATED:
    case NotificationType.RESERVATION_CANCELLED:
      return <Bell className="w-5 h-5 text-gold-500" />;
    case NotificationType.CHECK_IN:
    case NotificationType.CHECK_OUT:
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case NotificationType.HOUSEKEEPING_ASSIGNED:
      return <Info className="w-5 h-5 text-blue-500" />;
    case NotificationType.MAINTENANCE_CREATED:
      return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    case NotificationType.PAYMENT_RECEIVED:
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case NotificationType.NIGHT_AUDIT_COMPLETE:
      return <Moon className="w-5 h-5 text-purple-500" />;
    case NotificationType.SYSTEM_ALERT:
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    default:
      return <Bell className="w-5 h-5 text-charcoal-400" />;
  }
}

function getNotificationTypeLabel(type: NotificationType): string {
  switch (type) {
    case NotificationType.RESERVATION_CREATED: return 'New Reservation';
    case NotificationType.RESERVATION_CANCELLED: return 'Reservation Cancelled';
    case NotificationType.CHECK_IN: return 'Check-In';
    case NotificationType.CHECK_OUT: return 'Check-Out';
    case NotificationType.HOUSEKEEPING_ASSIGNED: return 'Housekeeping Assigned';
    case NotificationType.MAINTENANCE_CREATED: return 'Maintenance Request';
    case NotificationType.PAYMENT_RECEIVED: return 'Payment Received';
    case NotificationType.NIGHT_AUDIT_COMPLETE: return 'Night Audit Complete';
    case NotificationType.SYSTEM_ALERT: return 'System Alert';
    default: return 'Notification';
  }
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', filter],
    queryFn: () => notificationsApi.getAll({ unreadOnly: filter === 'unread', limit: 50 }),
    select: (res) => unwrapPaginatedApiData<NotificationDto>(res),
  });

  const notifications: NotificationDto[] = data?.data ?? [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      toast.success('All notifications marked as read');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      toast.success('Notification deleted');
    },
  });

  const handleMarkAsRead = (notification: NotificationDto) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-900">Notifications</h1>
          <p className="text-charcoal-500 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gold-700 bg-gold-50 border border-gold-200 rounded-lg hover:bg-gold-100 transition-colors disabled:opacity-50"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all as read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 mb-6 bg-charcoal-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            filter === 'all'
              ? 'bg-white text-charcoal-900 shadow-sm'
              : 'text-charcoal-600 hover:text-charcoal-900'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            filter === 'unread'
              ? 'bg-white text-charcoal-900 shadow-sm'
              : 'text-charcoal-600 hover:text-charcoal-900'
          }`}
        >
          Unread
          {unreadCount > 0 && (
            <span className="ml-2 px-1.5 py-0.5 text-xs bg-gold-500 text-white rounded-full">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-charcoal-200 p-4 animate-pulse">
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-charcoal-200 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-charcoal-200 rounded w-1/3" />
                  <div className="h-3 bg-charcoal-200 rounded w-2/3" />
                  <div className="h-3 bg-charcoal-200 rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16">
          <Bell className="w-12 h-12 text-charcoal-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-charcoal-700 mb-2">
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </h3>
          <p className="text-charcoal-500">
            {filter === 'unread'
              ? "You're all caught up! Switch to \"All\" to see past notifications."
              : 'Notifications about reservations, housekeeping, and more will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white rounded-xl border transition-all ${
                notification.isRead
                  ? 'border-charcoal-200'
                  : 'border-gold-200 bg-gold-50/30'
              }`}
            >
              <div className="flex items-start gap-4 p-4">
                {/* Icon */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  notification.isRead ? 'bg-charcoal-100' : 'bg-white border border-gold-200'
                }`}>
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-medium text-charcoal-500 uppercase tracking-wide">
                          {getNotificationTypeLabel(notification.type)}
                        </span>
                        {!notification.isRead && (
                          <span className="w-2 h-2 bg-gold-500 rounded-full flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm font-semibold text-charcoal-900">{notification.title}</p>
                      <p className="text-sm text-charcoal-600 mt-0.5">{notification.message}</p>
                    </div>
                    <span className="text-xs text-charcoal-400 whitespace-nowrap flex-shrink-0">
                      {formatRelativeTime(notification.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {!notification.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(notification)}
                      disabled={markAsReadMutation.isPending}
                      title="Mark as read"
                      className="p-1.5 text-charcoal-400 hover:text-gold-600 hover:bg-gold-50 rounded-lg transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteMutation.mutate(notification.id)}
                    disabled={deleteMutation.isPending}
                    title="Delete notification"
                    className="p-1.5 text-charcoal-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
