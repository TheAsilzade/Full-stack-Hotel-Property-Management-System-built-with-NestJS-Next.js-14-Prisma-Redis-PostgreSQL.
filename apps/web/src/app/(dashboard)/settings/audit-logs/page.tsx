'use client';

import React, { useState, useMemo } from 'react';
import {
  ChevronRight,
  Search,
  Filter,
  User,
  Key,
  Building2,
  Calendar,
  DoorOpen,
  DoorClosed,
  Wrench,
  FileText,
  Bell,
  Moon,
  Settings,
  RefreshCw,
  Download,
} from 'lucide-react';
import Link from 'next/link';
import { formatRelativeTime } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

type AuditAction =
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DEACTIVATED'
  | 'RESERVATION_CREATED'
  | 'RESERVATION_UPDATED'
  | 'RESERVATION_CANCELLED'
  | 'CHECK_IN'
  | 'CHECK_OUT'
  | 'FOLIO_CHARGE_ADDED'
  | 'FOLIO_PAYMENT_ADDED'
  | 'FOLIO_CLOSED'
  | 'ROOM_STATUS_CHANGED'
  | 'HOUSEKEEPING_TASK_COMPLETED'
  | 'MAINTENANCE_TICKET_CREATED'
  | 'MAINTENANCE_TICKET_RESOLVED'
  | 'NIGHT_AUDIT_RUN'
  | 'PROPERTY_SETTINGS_UPDATED'
  | 'NOTIFICATION_SENT';

interface AuditEntry {
  id: string;
  action: AuditAction;
  actor: string;
  actorRole: string;
  target?: string;
  details: string;
  ip?: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'critical';
}

// ─── Mock data ───────────────────────────────────────────────────────────────

function makeDate(minutesAgo: number): string {
  return new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();
}

const MOCK_LOGS: AuditEntry[] = [
  {
    id: '1',
    action: 'CHECK_IN',
    actor: 'Sarah Johnson',
    actorRole: 'Receptionist',
    target: 'Reservation #RES-2024-0891',
    details: 'Guest John Smith checked into Room 301',
    ip: '192.168.1.10',
    timestamp: makeDate(5),
    severity: 'info',
  },
  {
    id: '2',
    action: 'FOLIO_PAYMENT_ADDED',
    actor: 'Sarah Johnson',
    actorRole: 'Receptionist',
    target: 'Folio #FOL-0891',
    details: 'Payment of $450.00 received via Credit Card',
    ip: '192.168.1.10',
    timestamp: makeDate(12),
    severity: 'info',
  },
  {
    id: '3',
    action: 'RESERVATION_CANCELLED',
    actor: 'Mike Chen',
    actorRole: 'Front Desk Manager',
    target: 'Reservation #RES-2024-0887',
    details: 'Reservation cancelled — guest request. Reason: Change of plans',
    ip: '192.168.1.15',
    timestamp: makeDate(28),
    severity: 'warning',
  },
  {
    id: '4',
    action: 'NIGHT_AUDIT_RUN',
    actor: 'System',
    actorRole: 'Automated',
    details: 'Night audit completed for 2024-01-15. 42 rooms processed, $18,450 posted.',
    timestamp: makeDate(60),
    severity: 'info',
  },
  {
    id: '5',
    action: 'USER_CREATED',
    actor: 'Admin User',
    actorRole: 'Tenant Admin',
    target: 'alice@hotel.com',
    details: 'New user created with role Receptionist',
    ip: '192.168.1.1',
    timestamp: makeDate(90),
    severity: 'info',
  },
  {
    id: '6',
    action: 'PROPERTY_SETTINGS_UPDATED',
    actor: 'Admin User',
    actorRole: 'Tenant Admin',
    target: 'Grand Hotel',
    details: 'Property timezone changed from UTC to Europe/Istanbul',
    ip: '192.168.1.1',
    timestamp: makeDate(120),
    severity: 'warning',
  },
  {
    id: '7',
    action: 'CHECK_OUT',
    actor: 'Sarah Johnson',
    actorRole: 'Receptionist',
    target: 'Reservation #RES-2024-0880',
    details: 'Guest Emily Davis checked out from Room 205',
    ip: '192.168.1.10',
    timestamp: makeDate(150),
    severity: 'info',
  },
  {
    id: '8',
    action: 'MAINTENANCE_TICKET_CREATED',
    actor: 'Tom Wilson',
    actorRole: 'Housekeeper',
    target: 'Room 412',
    details: 'Maintenance ticket created: Broken AC unit. Priority: HIGH',
    ip: '192.168.1.22',
    timestamp: makeDate(180),
    severity: 'warning',
  },
  {
    id: '9',
    action: 'USER_LOGIN',
    actor: 'revenue@hotel.com',
    actorRole: 'Revenue Manager',
    details: 'Successful login from Chrome/Windows',
    ip: '203.0.113.45',
    timestamp: makeDate(200),
    severity: 'info',
  },
  {
    id: '10',
    action: 'FOLIO_CHARGE_ADDED',
    actor: 'Sarah Johnson',
    actorRole: 'Receptionist',
    target: 'Folio #FOL-0891',
    details: 'Room charge posted: $220.00 for 2024-01-15',
    ip: '192.168.1.10',
    timestamp: makeDate(240),
    severity: 'info',
  },
  {
    id: '11',
    action: 'USER_DEACTIVATED',
    actor: 'Admin User',
    actorRole: 'Tenant Admin',
    target: 'old.staff@hotel.com',
    details: 'User account deactivated',
    ip: '192.168.1.1',
    timestamp: makeDate(300),
    severity: 'critical',
  },
  {
    id: '12',
    action: 'RESERVATION_CREATED',
    actor: 'Online Booking',
    actorRole: 'System',
    target: 'Reservation #RES-2024-0892',
    details: 'New reservation created for guest Maria Garcia. Check-in: 2024-01-20',
    timestamp: makeDate(360),
    severity: 'info',
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ACTION_META: Record<AuditAction, { label: string; icon: React.ReactNode }> = {
  USER_LOGIN: { label: 'User Login', icon: <Key size={13} /> },
  USER_LOGOUT: { label: 'User Logout', icon: <Key size={13} /> },
  USER_CREATED: { label: 'User Created', icon: <User size={13} /> },
  USER_UPDATED: { label: 'User Updated', icon: <User size={13} /> },
  USER_DEACTIVATED: { label: 'User Deactivated', icon: <User size={13} /> },
  RESERVATION_CREATED: { label: 'Reservation Created', icon: <Calendar size={13} /> },
  RESERVATION_UPDATED: { label: 'Reservation Updated', icon: <Calendar size={13} /> },
  RESERVATION_CANCELLED: { label: 'Reservation Cancelled', icon: <Calendar size={13} /> },
  CHECK_IN: { label: 'Check-In', icon: <DoorOpen size={13} /> },
  CHECK_OUT: { label: 'Check-Out', icon: <DoorClosed size={13} /> },
  FOLIO_CHARGE_ADDED: { label: 'Charge Added', icon: <FileText size={13} /> },
  FOLIO_PAYMENT_ADDED: { label: 'Payment Added', icon: <FileText size={13} /> },
  FOLIO_CLOSED: { label: 'Folio Closed', icon: <FileText size={13} /> },
  ROOM_STATUS_CHANGED: { label: 'Room Status Changed', icon: <Building2 size={13} /> },
  HOUSEKEEPING_TASK_COMPLETED: { label: 'HK Task Completed', icon: <RefreshCw size={13} /> },
  MAINTENANCE_TICKET_CREATED: { label: 'Maintenance Created', icon: <Wrench size={13} /> },
  MAINTENANCE_TICKET_RESOLVED: { label: 'Maintenance Resolved', icon: <Wrench size={13} /> },
  NIGHT_AUDIT_RUN: { label: 'Night Audit Run', icon: <Moon size={13} /> },
  PROPERTY_SETTINGS_UPDATED: { label: 'Settings Updated', icon: <Settings size={13} /> },
  NOTIFICATION_SENT: { label: 'Notification Sent', icon: <Bell size={13} /> },
};

const SEVERITY_STYLES: Record<string, string> = {
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  warning: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  critical: 'bg-red-50 text-red-700 border-red-200',
};

const ACTION_CATEGORIES = [
  { label: 'All', value: '' },
  { label: 'Auth', value: 'USER_LOGIN,USER_LOGOUT' },
  { label: 'Users', value: 'USER_CREATED,USER_UPDATED,USER_DEACTIVATED' },
  { label: 'Reservations', value: 'RESERVATION_CREATED,RESERVATION_UPDATED,RESERVATION_CANCELLED,CHECK_IN,CHECK_OUT' },
  { label: 'Billing', value: 'FOLIO_CHARGE_ADDED,FOLIO_PAYMENT_ADDED,FOLIO_CLOSED' },
  { label: 'Operations', value: 'ROOM_STATUS_CHANGED,HOUSEKEEPING_TASK_COMPLETED,MAINTENANCE_TICKET_CREATED,MAINTENANCE_TICKET_RESOLVED,NIGHT_AUDIT_RUN' },
  { label: 'Settings', value: 'PROPERTY_SETTINGS_UPDATED' },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AuditLogsPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [severity, setSeverity] = useState('');

  const filtered = useMemo(() => {
    return MOCK_LOGS.filter((entry) => {
      const matchSearch =
        !search ||
        entry.actor.toLowerCase().includes(search.toLowerCase()) ||
        entry.details.toLowerCase().includes(search.toLowerCase()) ||
        (entry.target ?? '').toLowerCase().includes(search.toLowerCase());

      const matchCategory =
        !category || category.split(',').includes(entry.action);

      const matchSeverity = !severity || entry.severity === severity;

      return matchSearch && matchCategory && matchSeverity;
    });
  }, [search, category, severity]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/settings" className="hover:text-foreground transition-colors">Settings</Link>
        <ChevronRight size={12} />
        <span className="text-foreground font-medium">Audit Logs</span>
      </nav>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
            <FileText className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Audit Logs</h1>
            <p className="text-xs text-muted-foreground">
              {filtered.length} of {MOCK_LOGS.length} entries
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            const csv = [
              'Timestamp,Actor,Role,Action,Target,Details,Severity,IP',
              ...filtered.map((e) =>
                [
                  e.timestamp,
                  e.actor,
                  e.actorRole,
                  e.action,
                  e.target ?? '',
                  `"${e.details}"`,
                  e.severity,
                  e.ip ?? '',
                ].join(',')
              ),
            ].join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="flex items-center gap-1.5 px-3 py-2 text-sm border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by actor, target, or details…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-muted rounded-lg border border-transparent focus:outline-none focus:ring-2 focus:ring-gold-500 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-muted-foreground shrink-0" />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="text-sm bg-muted border border-transparent rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold-500 transition-all"
          >
            {ACTION_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className="text-sm bg-muted border border-transparent rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold-500 transition-all"
          >
            <option value="">All Severity</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Log entries */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            No audit log entries match your filters.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((entry) => {
              const meta = ACTION_META[entry.action];
              return (
                <div key={entry.id} className="px-4 py-3 hover:bg-muted/20 transition-colors">
                  <div className="flex items-start gap-3">
                    {/* Severity dot */}
                    <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                      entry.severity === 'critical' ? 'bg-red-500' :
                      entry.severity === 'warning' ? 'bg-yellow-500' : 'bg-blue-400'
                    }`} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Action badge */}
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full border ${SEVERITY_STYLES[entry.severity]}`}>
                          {meta?.icon}
                          {meta?.label ?? entry.action}
                        </span>
                        {/* Actor */}
                        <span className="text-xs font-medium text-foreground">{entry.actor}</span>
                        <span className="text-[10px] text-muted-foreground">({entry.actorRole})</span>
                        {entry.target && (
                          <>
                            <span className="text-[10px] text-muted-foreground">→</span>
                            <span className="text-xs text-muted-foreground font-mono">{entry.target}</span>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{entry.details}</p>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground/70">
                        <span>{formatRelativeTime(entry.timestamp)}</span>
                        {entry.ip && <span>IP: {entry.ip}</span>}
                      </div>
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