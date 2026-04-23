'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/lib/api/reports.api';
import { unwrapApiData } from '@/lib/api/response';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  BedDouble,
  CalendarDays,
  TrendingUp,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { OccupancyDataPoint } from '@Noblesse/shared';
import { useAuthStore } from '@/store/auth.store';

interface DashboardStats {
  rooms: { total: number; occupied: number; dirty: number; available: number; occupancyRate: number };
  reservations: { arrivalsToday: number; departuresToday: number; inHouse: number };
  operations: { openMaintenanceTickets: number; pendingHousekeepingTasks: number };
}
import Link from 'next/link';

// ─── Stat Card ────────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: { value: number; label: string };
  color?: 'gold' | 'blue' | 'green' | 'purple';
  href?: string;
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'gold',
  href,
}: StatCardProps) {
  const colorMap = {
    gold: 'bg-gold-50 text-gold-600',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  const card = (
    <div className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
          <Icon size={20} />
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-xs font-medium ${
              trend.value >= 0 ? 'text-green-600' : 'text-red-500'
            }`}
          >
            {trend.value >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-sm font-medium text-foreground mt-0.5">{title}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      {trend && <p className="text-xs text-muted-foreground mt-1">{trend.label}</p>}
    </div>
  );

  if (href) {
    return <Link href={href}>{card}</Link>;
  }
  return card;
}

// ─── Skeleton ─────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-card rounded-xl border border-border p-5 animate-pulse">
      <div className="w-10 h-10 rounded-lg bg-muted mb-4" />
      <div className="h-7 w-16 bg-muted rounded mb-2" />
      <div className="h-4 w-24 bg-muted rounded" />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const propertyId = user?.propertyIds?.[0] ?? '';
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats', propertyId],
    queryFn: () => reportsApi.getDashboardStats(propertyId),
    select: (res) => unwrapApiData<DashboardStats>(res),
    enabled: !!propertyId,
    refetchInterval: 60000,
  });

  const { data: occupancyData } = useQuery({
    queryKey: ['occupancy-report', propertyId, thirtyDaysAgo, today],
    queryFn: () =>
      reportsApi.getOccupancy({
        propertyId,
        startDate: thirtyDaysAgo,
        endDate: today,
      }),
    select: (res) => {
      const report = unwrapApiData<
        | OccupancyDataPoint[]
        | { endDate: string; occupancyRate: number; totalRoomNights: number }
      >(res);

      return Array.isArray(report)
        ? report
        : [
            {
              date: report.endDate ?? today,
              occupancyRate: report.occupancyRate ?? 0,
              occupiedRooms: report.totalRoomNights ?? 0,
              revenue: 0,
            },
          ];
    },
    enabled: !!propertyId,
  });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground font-display">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {formatDate(new Date())} · Overview of today&apos;s operations
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <StatCard
              title="Occupancy Rate"
              value={`${stats?.rooms?.occupancyRate?.toFixed(1) ?? 0}%`}
              subtitle={`${stats?.rooms?.occupied ?? 0} of ${stats?.rooms?.total ?? 0} rooms`}
              icon={BedDouble}
              color="gold"
              href="/rooms"
            />
            <StatCard
              title="Today's Arrivals"
              value={stats?.reservations?.arrivalsToday ?? 0}
              subtitle="Expected check-ins"
              icon={CalendarDays}
              color="blue"
              href="/reservations?status=CONFIRMED"
            />
            <StatCard
              title="Today's Departures"
              value={stats?.reservations?.departuresToday ?? 0}
              subtitle="Expected check-outs"
              icon={CheckCircle2}
              color="green"
              href="/reservations?status=CHECKED_IN"
            />
            <StatCard
              title="In-House Guests"
              value={stats?.reservations?.inHouse ?? 0}
              subtitle="Currently staying"
              icon={Users}
              color="purple"
              href="/reservations?status=CHECKED_IN"
            />
          </>
        )}
      </div>

      {/* Revenue Chart + Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Occupancy / Revenue Chart */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Occupancy & Revenue (Last 30 Days)
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Daily trend</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
              <TrendingUp size={14} />
              <span>Trend</span>
            </div>
          </div>
          {occupancyData && occupancyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart
                data={occupancyData}
                margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#C9A84C" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="occupancyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(v) =>
                    new Date(v).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })
                  }
                  interval="preserveStartEnd"
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    name === 'revenue' ? formatCurrency(value) : `${value.toFixed(1)}%`,
                    name === 'revenue' ? 'Revenue' : 'Occupancy',
                  ]}
                  labelFormatter={(label) => formatDate(label)}
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#C9A84C"
                  strokeWidth={2}
                  fill="url(#revenueGrad)"
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="occupancyRate"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#occupancyGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
              No data available for the last 30 days
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="bg-card rounded-xl border border-border p-5 space-y-4">
          <h2 className="text-base font-semibold text-foreground">Quick Stats</h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle size={14} className="text-orange-500" />
                Pending Housekeeping
              </div>
              <span className="text-sm font-semibold text-foreground">
                {statsLoading ? '—' : (stats?.operations?.pendingHousekeepingTasks ?? 0)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock size={14} className="text-blue-500" />
                Open Maintenance
              </div>
              <span className="text-sm font-semibold text-foreground">
                {statsLoading ? '—' : (stats?.operations?.openMaintenanceTickets ?? 0)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp size={14} className="text-gold-500" />
                Today&apos;s Revenue
              </div>
              <span className="text-sm font-semibold text-foreground">
                {statsLoading ? '—' : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp size={14} className="text-green-500" />
                Month Revenue
              </div>
              <span className="text-sm font-semibold text-foreground">
                {statsLoading ? '—' : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BedDouble size={14} className="text-purple-500" />
                Available Rooms
              </div>
              <span className="text-sm font-semibold text-foreground">
                {statsLoading ? '—' : (stats?.rooms?.available ?? 0)}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-border space-y-2">
            <Link
              href="/housekeeping"
              className="flex items-center justify-between text-sm text-gold-600 hover:text-gold-700 font-medium"
            >
              View Housekeeping <ArrowUpRight size={14} />
            </Link>
            <Link
              href="/maintenance"
              className="flex items-center justify-between text-sm text-gold-600 hover:text-gold-700 font-medium"
            >
              View Maintenance <ArrowUpRight size={14} />
            </Link>
            <Link
              href="/reports"
              className="flex items-center justify-between text-sm text-gold-600 hover:text-gold-700 font-medium"
            >
              Full Reports <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom row: Arrivals + Departures summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-foreground">Arrivals Today</h2>
            <Link
              href="/reservations?status=CONFIRMED"
              className="text-xs text-gold-600 hover:text-gold-700 font-medium flex items-center gap-1"
            >
              View all <ArrowUpRight size={12} />
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
              <span className="text-2xl font-bold text-blue-600">
                {statsLoading ? '—' : (stats?.reservations?.arrivalsToday ?? 0)}
              </span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Expected check-ins</p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDate(new Date())}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-foreground">Departures Today</h2>
            <Link
              href="/reservations?status=CHECKED_IN"
              className="text-xs text-gold-600 hover:text-gold-700 font-medium flex items-center gap-1"
            >
              View all <ArrowUpRight size={12} />
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
              <span className="text-2xl font-bold text-green-600">
                {statsLoading ? '—' : (stats?.reservations?.departuresToday ?? 0)}
              </span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Expected check-outs</p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDate(new Date())}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
