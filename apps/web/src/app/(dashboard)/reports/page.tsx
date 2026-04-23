'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/lib/api/reports.api';
import { unwrapApiData } from '@/lib/api/response';
import { formatCurrency, formatDate } from '@/lib/utils';
import { BarChart3, TrendingUp, BedDouble, CalendarDays, DollarSign, Download } from 'lucide-react';
import {
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Line,
} from 'recharts';
import type { OccupancyDataPoint } from '@Noblesse/shared';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';

type DateRangePreset = '7d' | '30d' | '90d' | 'custom';

interface ReservationStats {
  totalReservations: number;
  confirmedReservations: number;
  cancelledReservations: number;
  noShows: number;
  averageStayLength: number;
  averageDailyRate: number;
  revPAR: number;
}

interface RevenueDataPoint {
  date: string;
  revenue: number;
  roomRevenue: number;
}

export default function ReportsPage() {
  const user = useAuthStore((s) => s.user);
  const propertyId = user?.propertyIds?.[0] ?? '';

  const [preset, setPreset] = useState<DateRangePreset>('30d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const today = new Date().toISOString().split('T')[0];

  const { startDate, endDate } = (() => {
    if (preset === 'custom' && customStart && customEnd) {
      return { startDate: customStart, endDate: customEnd };
    }
    const days = preset === '7d' ? 7 : preset === '30d' ? 30 : 90;
    return {
      startDate: new Date(Date.now() - days * 86400000).toISOString().split('T')[0],
      endDate: today,
    };
  })();

  const { data: occupancyData, isLoading: occLoading } = useQuery({
    queryKey: ['occupancy', propertyId, startDate, endDate],
    queryFn: () => reportsApi.getOccupancy({ propertyId, startDate, endDate }),
    select: (res) => {
      const report = unwrapApiData<
        | OccupancyDataPoint[]
        | { endDate: string; occupancyRate: number; occupiedRoomNights: number }
      >(res);
      return Array.isArray(report)
        ? report
        : [
            {
              date: report.endDate,
              occupancyRate: report.occupancyRate ?? 0,
              occupiedRooms: report.occupiedRoomNights ?? 0,
              revenue: 0,
            },
          ];
    },
    enabled: !!propertyId && !!startDate && !!endDate,
  });

  const { data: revenueData, isLoading: revLoading } = useQuery({
    queryKey: ['revenue', propertyId, startDate, endDate],
    queryFn: () =>
      reportsApi.getRevenue({
        propertyId,
        startDate,
        endDate,
        groupBy: preset === '7d' ? 'day' : preset === '30d' ? 'day' : 'week',
      }),
    select: (res) => {
      const report = unwrapApiData<
        | RevenueDataPoint[]
        | { endDate: string; netRevenue: number; totalCharges: number }
      >(res);
      return Array.isArray(report)
        ? report
        : [
            {
              date: report.endDate,
              revenue: report.netRevenue ?? 0,
              roomRevenue: report.totalCharges ?? 0,
            },
          ];
    },
    enabled: !!propertyId && !!startDate && !!endDate,
  });

  const { data: reservationStats, isLoading: statsLoading } = useQuery({
    queryKey: ['reservation-stats', propertyId, startDate, endDate],
    queryFn: () => reportsApi.getReservationStats({ propertyId, startDate, endDate }),
    select: (res) => unwrapApiData<ReservationStats>(res),
    enabled: !!propertyId && !!startDate && !!endDate,
  });

  const totalRevenue = revenueData?.reduce((sum, d) => sum + d.revenue, 0) ?? 0;
  const totalRoomRevenue = revenueData?.reduce((sum, d) => sum + (d.roomRevenue ?? 0), 0) ?? 0;
  const avgOccupancy =
    occupancyData && occupancyData.length > 0
      ? occupancyData.reduce((sum, d) => sum + d.occupancyRate, 0) / occupancyData.length
      : 0;

  const cancellationRate =
    reservationStats && reservationStats.totalReservations > 0
      ? ((reservationStats.cancelledReservations / reservationStats.totalReservations) * 100).toFixed(1)
      : null;

  const tooltipStyle = {
    background: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
    fontSize: '12px',
  };

  const tickStyle = { fontSize: 11, fill: 'hsl(var(--muted-foreground))' };

  const inputClass =
    'px-3 py-1.5 text-xs bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">Reports</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {startDate && endDate ? `${formatDate(startDate)} – ${formatDate(endDate)}` : 'Select a date range'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          {/* Preset tabs */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            {(['7d', '30d', '90d', 'custom'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setPreset(r)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                  preset === r
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {r === '7d' ? '7d' : r === '30d' ? '30d' : r === '90d' ? '90d' : 'Custom'}
              </button>
            ))}
          </div>

          {/* Custom date inputs */}
          {preset === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStart}
                max={customEnd || today}
                onChange={(e) => setCustomStart(e.target.value)}
                className={inputClass}
              />
              <span className="text-xs text-muted-foreground">to</span>
              <input
                type="date"
                value={customEnd}
                min={customStart}
                max={today}
                onChange={(e) => setCustomEnd(e.target.value)}
                className={inputClass}
              />
            </div>
          )}

          {/* Export placeholder */}
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground border border-border rounded-lg hover:text-foreground hover:bg-muted transition-colors"
            title="Export (coming soon)"
          >
            <Download size={13} />
            Export
          </button>
        </div>
      </div>

      {/* KPI summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Revenue',
            value: formatCurrency(totalRevenue),
            sub: `Room: ${formatCurrency(totalRoomRevenue)}`,
            icon: TrendingUp,
            color: 'text-yellow-600',
            bg: 'bg-yellow-50',
            loading: revLoading,
          },
          {
            label: 'Avg Occupancy',
            value: `${avgOccupancy.toFixed(1)}%`,
            sub: null,
            icon: BedDouble,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            loading: occLoading,
          },
          {
            label: 'Total Reservations',
            value: statsLoading ? '…' : (reservationStats?.totalReservations ?? '—'),
            sub: cancellationRate ? `${cancellationRate}% cancelled` : null,
            icon: CalendarDays,
            color: 'text-green-600',
            bg: 'bg-green-50',
            loading: statsLoading,
          },
          {
            label: 'RevPAR',
            value: statsLoading
              ? '…'
              : reservationStats?.revPAR
              ? formatCurrency(reservationStats.revPAR)
              : '—',
            sub: reservationStats?.averageDailyRate
              ? `ADR: ${formatCurrency(reservationStats.averageDailyRate)}`
              : null,
            icon: DollarSign,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
            loading: statsLoading,
          },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-card rounded-xl border border-border p-5">
              <div className={`w-9 h-9 rounded-lg ${kpi.bg} flex items-center justify-center mb-3`}>
                <Icon size={18} className={kpi.color} />
              </div>
              {kpi.loading ? (
                <div className="h-7 w-24 bg-muted rounded animate-pulse mb-1" />
              ) : (
                <p className="text-xl font-bold text-foreground">{kpi.value}</p>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">{kpi.label}</p>
              {kpi.sub && (
                <p className="text-xs text-muted-foreground/70 mt-0.5">{kpi.sub}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Revenue Chart — combined area + line */}
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground">Revenue Trend</h2>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-yellow-500 inline-block rounded" />
              Total Revenue
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-blue-500 inline-block rounded" />
              Room Revenue
            </span>
          </div>
        </div>
        {revLoading ? (
          <div className="h-64 bg-muted rounded-lg animate-pulse" />
        ) : revenueData && revenueData.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={revenueData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EAB308" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#EAB308" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                tick={tickStyle}
                tickFormatter={(v) =>
                  new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                }
                interval="preserveStartEnd"
              />
              <YAxis
                tick={tickStyle}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  formatCurrency(value),
                  name === 'revenue' ? 'Total Revenue' : 'Room Revenue',
                ]}
                labelFormatter={(label) => formatDate(label)}
                contentStyle={tooltipStyle}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#EAB308"
                strokeWidth={2}
                fill="url(#revGrad)"
              />
              <Line
                type="monotone"
                dataKey="roomRevenue"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
            No revenue data available
          </div>
        )}
      </div>

      {/* Occupancy Chart */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h2 className="text-base font-semibold text-foreground mb-4">Occupancy Rate</h2>
        {occLoading ? (
          <div className="h-64 bg-muted rounded-lg animate-pulse" />
        ) : occupancyData && occupancyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={occupancyData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                tick={tickStyle}
                tickFormatter={(v) =>
                  new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                }
                interval="preserveStartEnd"
              />
              <YAxis
                tick={tickStyle}
                tickFormatter={(v) => `${v}%`}
                domain={[0, 100]}
              />
              <Tooltip
                formatter={(value: number) => [`${value.toFixed(1)}%`, 'Occupancy']}
                labelFormatter={(label) => formatDate(label)}
                contentStyle={tooltipStyle}
              />
              <Bar dataKey="occupancyRate" name="Occupancy %" fill="#3b82f6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
            No occupancy data available
          </div>
        )}
      </div>

      {/* Reservation breakdown */}
      {statsLoading ? (
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="h-5 w-48 bg-muted rounded animate-pulse mb-4" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      ) : reservationStats ? (
        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="text-base font-semibold text-foreground mb-4">Reservation Breakdown</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Total', value: reservationStats.totalReservations, color: 'text-foreground' },
              { label: 'Confirmed', value: reservationStats.confirmedReservations, color: 'text-green-600' },
              { label: 'Cancelled', value: reservationStats.cancelledReservations, color: 'text-red-600' },
              { label: 'No Shows', value: reservationStats.noShows, color: 'text-orange-600' },
              {
                label: 'Avg Stay',
                value: `${reservationStats.averageStayLength?.toFixed(1) ?? 0}n`,
                color: 'text-blue-600',
              },
              {
                label: 'Cancel Rate',
                value: cancellationRate ? `${cancellationRate}%` : '—',
                color: 'text-muted-foreground',
              },
            ].map((item) => (
              <div key={item.label} className="text-center p-3 bg-muted/40 rounded-lg">
                <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* ADR & RevPAR summary */}
      {reservationStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 size={16} className="text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Average Daily Rate (ADR)</h3>
            </div>
            <p className="text-3xl font-bold text-foreground mt-2">
              {formatCurrency(reservationStats.averageDailyRate)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Average revenue per occupied room per night
            </p>
          </div>
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={16} className="text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Revenue Per Available Room (RevPAR)</h3>
            </div>
            <p className="text-3xl font-bold text-foreground mt-2">
              {formatCurrency(reservationStats.revPAR)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Total room revenue divided by total available rooms
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
