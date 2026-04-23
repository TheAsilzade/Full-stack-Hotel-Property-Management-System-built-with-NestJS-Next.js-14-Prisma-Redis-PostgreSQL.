# Noblesse PMS — Frontend Architecture (Next.js 14)

> **Framework:** Next.js 14 (App Router)  
> **Language:** TypeScript 5  
> **Styling:** Tailwind CSS v3 + shadcn/ui  
> **State:** Zustand + TanStack Query v5  
> **Forms:** React Hook Form + Zod

---

## Folder Structure

```
apps/
└── web/
    ├── src/
    │   ├── app/                              # Next.js App Router
    │   │   ├── layout.tsx                    # Root layout
    │   │   ├── page.tsx                      # Root redirect
    │   │   ├── globals.css                   # Global styles + CSS variables
    │   │   │
    │   │   ├── (auth)/                       # Auth route group (no sidebar)
    │   │   │   ├── layout.tsx                # Auth layout (centered card)
    │   │   │   ├── login/
    │   │   │   │   └── page.tsx
    │   │   │   ├── register/
    │   │   │   │   └── page.tsx
    │   │   │   ├── forgot-password/
    │   │   │   │   └── page.tsx
    │   │   │   └── reset-password/
    │   │   │       └── page.tsx
    │   │   │
    │   │   └── (dashboard)/                  # Main app route group (with sidebar)
    │   │       ├── layout.tsx                # Dashboard layout (AppShell)
    │   │       │
    │   │       ├── dashboard/
    │   │       │   └── page.tsx              # Main KPI dashboard
    │   │       │
    │   │       ├── front-desk/
    │   │       │   └── page.tsx              # Front desk operational view
    │   │       │
    │   │       ├── reservations/
    │   │       │   ├── page.tsx              # Reservation list
    │   │       │   ├── new/
    │   │       │   │   └── page.tsx          # Create reservation
    │   │       │   └── [id]/
    │   │       │       ├── page.tsx          # Reservation detail
    │   │       │       ├── check-in/
    │   │       │       │   └── page.tsx      # Check-in flow
    │   │       │       └── check-out/
    │   │       │           └── page.tsx      # Check-out flow
    │   │       │
    │   │       ├── room-rack/
    │   │       │   └── page.tsx              # Visual room calendar
    │   │       │
    │   │       ├── guests/
    │   │       │   ├── page.tsx              # Guest list
    │   │       │   ├── new/
    │   │       │   │   └── page.tsx
    │   │       │   └── [id]/
    │   │       │       └── page.tsx          # Guest profile
    │   │       │
    │   │       ├── billing/
    │   │       │   ├── page.tsx              # Billing overview
    │   │       │   └── [folioId]/
    │   │       │       └── page.tsx          # Folio detail
    │   │       │
    │   │       ├── housekeeping/
    │   │       │   └── page.tsx              # Housekeeping board
    │   │       │
    │   │       ├── maintenance/
    │   │       │   ├── page.tsx              # Maintenance tickets list
    │   │       │   └── [id]/
    │   │       │       └── page.tsx          # Ticket detail
    │   │       │
    │   │       ├── reports/
    │   │       │   ├── page.tsx              # Reports dashboard
    │   │       │   ├── occupancy/
    │   │       │   │   └── page.tsx
    │   │       │   ├── revenue/
    │   │       │   │   └── page.tsx
    │   │       │   └── daily-manager/
    │   │       │       └── page.tsx
    │   │       │
    │   │       ├── settings/
    │   │       │   ├── page.tsx              # Settings overview
    │   │       │   ├── property/
    │   │       │   │   └── page.tsx
    │   │       │   ├── rooms/
    │   │       │   │   └── page.tsx
    │   │       │   ├── room-types/
    │   │       │   │   └── page.tsx
    │   │       │   ├── rates/
    │   │       │   │   └── page.tsx
    │   │       │   ├── taxes/
    │   │       │   │   └── page.tsx
    │   │       │   ├── users/
    │   │       │   │   └── page.tsx
    │   │       │   ├── roles/
    │   │       │   │   └── page.tsx
    │   │       │   └── audit-logs/
    │   │       │       └── page.tsx
    │   │       │
    │   │       └── notifications/
    │   │           └── page.tsx
    │   │
    │   ├── components/
    │   │   ├── layout/
    │   │   │   ├── AppShell.tsx              # Main layout wrapper
    │   │   │   ├── Sidebar.tsx               # Navigation sidebar
    │   │   │   ├── Topbar.tsx                # Top navigation bar
    │   │   │   ├── PropertySelector.tsx      # Multi-property switcher
    │   │   │   └── CommandBar.tsx            # AI command bar (Cmd+K)
    │   │   │
    │   │   ├── ui/                           # shadcn/ui components (customized)
    │   │   │   ├── button.tsx
    │   │   │   ├── input.tsx
    │   │   │   ├── select.tsx
    │   │   │   ├── dialog.tsx
    │   │   │   ├── sheet.tsx
    │   │   │   ├── badge.tsx
    │   │   │   ├── card.tsx
    │   │   │   ├── table.tsx
    │   │   │   ├── tabs.tsx
    │   │   │   ├── toast.tsx
    │   │   │   ├── tooltip.tsx
    │   │   │   ├── dropdown-menu.tsx
    │   │   │   ├── calendar.tsx
    │   │   │   ├── popover.tsx
    │   │   │   └── separator.tsx
    │   │   │
    │   │   ├── common/
    │   │   │   ├── StatCard.tsx              # KPI stat card
    │   │   │   ├── DataTable.tsx             # Reusable data table
    │   │   │   ├── EmptyState.tsx            # Empty state component
    │   │   │   ├── LoadingSpinner.tsx
    │   │   │   ├── PageHeader.tsx
    │   │   │   ├── ConfirmDialog.tsx
    │   │   │   ├── AuditTimeline.tsx
    │   │   │   ├── NotificationBell.tsx
    │   │   │   ├── DateRangePicker.tsx
    │   │   │   ├── SearchInput.tsx
    │   │   │   ├── FilterBar.tsx
    │   │   │   ├── StatusBadge.tsx
    │   │   │   ├── ReportChartCard.tsx
    │   │   │   └── ExportButton.tsx
    │   │   │
    │   │   ├── reservations/
    │   │   │   ├── ReservationStatusBadge.tsx
    │   │   │   ├── ReservationCard.tsx
    │   │   │   ├── ReservationForm.tsx
    │   │   │   ├── ReservationTimeline.tsx
    │   │   │   ├── GuestSearchSelect.tsx
    │   │   │   ├── RoomTypeSelector.tsx
    │   │   │   ├── RateSelector.tsx
    │   │   │   └── SpecialRequestsInput.tsx
    │   │   │
    │   │   ├── rooms/
    │   │   │   ├── RoomStatusBadge.tsx
    │   │   │   ├── RoomCalendar.tsx          # Room rack timeline
    │   │   │   ├── RoomCard.tsx
    │   │   │   └── RoomStatusGrid.tsx
    │   │   │
    │   │   ├── billing/
    │   │   │   ├── FolioTable.tsx
    │   │   │   ├── PaymentModal.tsx
    │   │   │   ├── AddChargeModal.tsx
    │   │   │   ├── DiscountModal.tsx
    │   │   │   └── InvoicePreview.tsx
    │   │   │
    │   │   ├── guests/
    │   │   │   ├── GuestCard.tsx
    │   │   │   ├── GuestForm.tsx
    │   │   │   ├── GuestStayHistory.tsx
    │   │   │   └── GuestPreferences.tsx
    │   │   │
    │   │   ├── housekeeping/
    │   │   │   ├── HousekeepingBoard.tsx
    │   │   │   ├── TaskCard.tsx
    │   │   │   └── ChecklistModal.tsx
    │   │   │
    │   │   └── charts/
    │   │       ├── OccupancyChart.tsx
    │   │       ├── RevenueChart.tsx
    │   │       ├── SourcePieChart.tsx
    │   │       └── ForecastChart.tsx
    │   │
    │   ├── lib/
    │   │   ├── api/
    │   │   │   ├── client.ts                 # Axios instance with interceptors
    │   │   │   ├── auth.api.ts
    │   │   │   ├── reservations.api.ts
    │   │   │   ├── guests.api.ts
    │   │   │   ├── rooms.api.ts
    │   │   │   ├── folios.api.ts
    │   │   │   ├── payments.api.ts
    │   │   │   ├── housekeeping.api.ts
    │   │   │   ├── maintenance.api.ts
    │   │   │   ├── reports.api.ts
    │   │   │   └── settings.api.ts
    │   │   │
    │   │   ├── hooks/
    │   │   │   ├── useAuth.ts
    │   │   │   ├── usePermissions.ts
    │   │   │   ├── useProperty.ts
    │   │   │   ├── useReservations.ts
    │   │   │   ├── useGuests.ts
    │   │   │   ├── useRooms.ts
    │   │   │   ├── useFolio.ts
    │   │   │   ├── useHousekeeping.ts
    │   │   │   ├── useReports.ts
    │   │   │   ├── useNotifications.ts
    │   │   │   └── useWebSocket.ts
    │   │   │
    │   │   ├── stores/
    │   │   │   ├── auth.store.ts             # Zustand auth store
    │   │   │   ├── ui.store.ts               # UI state (sidebar, modals)
    │   │   │   ├── property.store.ts         # Selected property
    │   │   │   └── notification.store.ts     # Notification state
    │   │   │
    │   │   ├── schemas/                      # Zod validation schemas
    │   │   │   ├── auth.schema.ts
    │   │   │   ├── reservation.schema.ts
    │   │   │   ├── guest.schema.ts
    │   │   │   ├── room.schema.ts
    │   │   │   ├── payment.schema.ts
    │   │   │   └── settings.schema.ts
    │   │   │
    │   │   ├── utils/
    │   │   │   ├── date.ts
    │   │   │   ├── currency.ts
    │   │   │   ├── permissions.ts
    │   │   │   └── cn.ts                     # Tailwind class merger
    │   │   │
    │   │   └── constants/
    │   │       ├── reservation-status.ts
    │   │       ├── room-status.ts
    │   │       ├── payment-methods.ts
    │   │       └── nationalities.ts
    │   │
    │   ├── types/
    │   │   ├── auth.types.ts
    │   │   ├── reservation.types.ts
    │   │   ├── guest.types.ts
    │   │   ├── room.types.ts
    │   │   ├── billing.types.ts
    │   │   ├── housekeeping.types.ts
    │   │   └── api.types.ts
    │   │
    │   └── middleware.ts                     # Next.js middleware (auth check)
    │
    ├── public/
    │   ├── logo.svg
    │   ├── logo-gold.svg
    │   └── favicon.ico
    │
    ├── tailwind.config.ts
    ├── next.config.ts
    ├── tsconfig.json
    └── package.json
```

---

## Design System & Theme

### Tailwind Configuration

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Gold accent system
        gold: {
          50:  '#fefdf0',
          100: '#fdf9d3',
          200: '#fbf0a0',
          300: '#f7e264',
          400: '#f2ce2e',
          500: '#D4AF37',  // Primary gold
          600: '#b8941e',
          700: '#9a7516',
          800: '#7d5d17',
          900: '#694d18',
        },
        // Charcoal text system
        charcoal: {
          50:  '#f7f7f7',
          100: '#e3e3e3',
          200: '#c8c8c8',
          300: '#a4a4a4',
          400: '#818181',
          500: '#666666',
          600: '#515151',
          700: '#434343',
          800: '#383838',
          900: '#1a1a1a',  // Primary text
        },
        // Status colors
        status: {
          confirmed:  '#3b82f6',  // blue
          checkedIn:  '#22c55e',  // green
          checkedOut: '#6b7280',  // gray
          cancelled:  '#ef4444',  // red
          noShow:     '#f97316',  // orange
          tentative:  '#a855f7',  // purple
        },
        // Room status colors
        room: {
          available:  '#22c55e',
          occupied:   '#3b82f6',
          dirty:      '#f59e0b',
          outOfOrder: '#ef4444',
          maintenance:'#8b5cf6',
          blocked:    '#6b7280',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -2px rgba(0,0,0,0.08)',
        'modal': '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
```

### CSS Variables (globals.css)

```css
/* src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 99%;           /* Near white */
    --foreground: 0 0% 10%;           /* Charcoal */
    --card: 0 0% 100%;                /* Pure white */
    --card-foreground: 0 0% 10%;
    --border: 0 0% 90%;               /* Light gray */
    --input: 0 0% 95%;
    --primary: 43 65% 52%;            /* Gold #D4AF37 */
    --primary-foreground: 0 0% 100%;
    --secondary: 0 0% 96%;
    --secondary-foreground: 0 0% 10%;
    --muted: 0 0% 96%;
    --muted-foreground: 0 0% 45%;
    --accent: 43 65% 52%;
    --accent-foreground: 0 0% 100%;
    --destructive: 0 84% 60%;
    --ring: 43 65% 52%;
    --radius: 0.75rem;
    --sidebar-width: 260px;
    --topbar-height: 64px;
  }
}

@layer components {
  .btn-gold {
    @apply bg-gold-500 hover:bg-gold-600 text-white font-medium px-4 py-2 rounded-xl 
           transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98];
  }
  
  .btn-ghost {
    @apply bg-transparent hover:bg-charcoal-50 text-charcoal-700 font-medium px-4 py-2 
           rounded-xl transition-all duration-200 border border-transparent 
           hover:border-charcoal-200;
  }
  
  .card-base {
    @apply bg-white rounded-2xl border border-charcoal-100 shadow-card p-6;
  }
  
  .stat-card {
    @apply bg-white rounded-2xl border border-charcoal-100 shadow-card p-5 
           hover:shadow-card-hover transition-shadow duration-200;
  }
  
  .sidebar-item {
    @apply flex items-center gap-3 px-3 py-2.5 rounded-xl text-charcoal-600 
           hover:bg-gold-50 hover:text-gold-700 transition-all duration-150 
           text-sm font-medium cursor-pointer;
  }
  
  .sidebar-item-active {
    @apply bg-gold-50 text-gold-700 font-semibold;
  }
  
  .page-title {
    @apply text-2xl font-display font-semibold text-charcoal-900;
  }
  
  .section-title {
    @apply text-lg font-semibold text-charcoal-800;
  }
}
```

---

## Core Components Implementation

### 1. AppShell

```tsx
// components/layout/AppShell.tsx
'use client';

import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { CommandBar } from './CommandBar';
import { useUIStore } from '@/lib/stores/ui.store';
import { cn } from '@/lib/utils/cn';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { sidebarCollapsed } = useUIStore();

  return (
    <div className="flex h-screen bg-[#FAFAFA] overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div
        className={cn(
          'flex flex-col flex-1 min-w-0 transition-all duration-300',
          sidebarCollapsed ? 'ml-16' : 'ml-[260px]',
        )}
      >
        {/* Topbar */}
        <Topbar />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>

      {/* Global command bar */}
      <CommandBar />
    </div>
  );
}
```

---

### 2. Sidebar

```tsx
// components/layout/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUIStore } from '@/lib/stores/ui.store';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { cn } from '@/lib/utils/cn';
import {
  LayoutDashboard, CalendarDays, Users, BedDouble, Wallet,
  Sparkles, Wrench, BarChart3, Settings, ChevronLeft,
  ClipboardList, Bell, Hotel,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: null },
  { label: 'Front Desk', href: '/front-desk', icon: Hotel, permission: null },
  { label: 'Reservations', href: '/reservations', icon: CalendarDays, permission: 'reservations.view' },
  { label: 'Room Rack', href: '/room-rack', icon: BedDouble, permission: 'reservations.view' },
  { label: 'Guests', href: '/guests', icon: Users, permission: 'guests.view' },
  { label: 'Billing', href: '/billing', icon: Wallet, permission: 'billing.view' },
  { label: 'Housekeeping', href: '/housekeeping', icon: Sparkles, permission: 'housekeeping.view' },
  { label: 'Maintenance', href: '/maintenance', icon: Wrench, permission: 'maintenance.view' },
  { label: 'Reports', href: '/reports', icon: BarChart3, permission: 'reports.view' },
  { label: 'Notifications', href: '/notifications', icon: Bell, permission: null },
  { label: 'Settings', href: '/settings', icon: Settings, permission: 'settings.view' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { hasPermission } = usePermissions();

  const visibleItems = navItems.filter(
    (item) => !item.permission || hasPermission(item.permission),
  );

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full bg-white border-r border-charcoal-100 z-40',
        'flex flex-col transition-all duration-300 shadow-sm',
        sidebarCollapsed ? 'w-16' : 'w-[260px]',
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-charcoal-100">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gold-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">L</span>
            </div>
            <span className="font-display font-semibold text-charcoal-900 text-lg">
              Noblesse
            </span>
          </div>
        )}
        {sidebarCollapsed && (
          <div className="w-8 h-8 bg-gold-500 rounded-lg flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-sm">L</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'sidebar-item',
                isActive && 'sidebar-item-active',
                sidebarCollapsed && 'justify-center px-2',
              )}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <Icon size={18} className="shrink-0" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-3 border-t border-charcoal-100">
        <button
          onClick={toggleSidebar}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2 rounded-xl',
            'text-charcoal-500 hover:bg-charcoal-50 transition-colors text-sm',
            sidebarCollapsed && 'justify-center',
          )}
        >
          <ChevronLeft
            size={16}
            className={cn('transition-transform', sidebarCollapsed && 'rotate-180')}
          />
          {!sidebarCollapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
```

---

### 3. StatCard Component

```tsx
// components/common/StatCard.tsx
import { cn } from '@/lib/utils/cn';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: number;        // percentage change
  changeLabel?: string;
  icon?: React.ReactNode;
  color?: 'gold' | 'blue' | 'green' | 'red' | 'purple';
  loading?: boolean;
}

export function StatCard({
  title, value, subtitle, change, changeLabel, icon, color = 'gold', loading,
}: StatCardProps) {
  const colorMap = {
    gold:   { bg: 'bg-gold-50',   icon: 'text-gold-600',   border: 'border-gold-100' },
    blue:   { bg: 'bg-blue-50',   icon: 'text-blue-600',   border: 'border-blue-100' },
    green:  { bg: 'bg-green-50',  icon: 'text-green-600',  border: 'border-green-100' },
    red:    { bg: 'bg-red-50',    icon: 'text-red-600',    border: 'border-red-100' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-600', border: 'border-purple-100' },
  };

  const colors = colorMap[color];

  if (loading) {
    return (
      <div className="stat-card animate-pulse">
        <div className="h-4 bg-charcoal-100 rounded w-24 mb-3" />
        <div className="h-8 bg-charcoal-100 rounded w-32 mb-2" />
        <div className="h-3 bg-charcoal-100 rounded w-20" />
      </div>
    );
  }

  return (
    <div className="stat-card group">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-medium text-charcoal-500">{title}</p>
        {icon && (
          <div className={cn('p-2 rounded-xl', colors.bg, colors.border, 'border')}>
            <span className={colors.icon}>{icon}</span>
          </div>
        )}
      </div>

      <p className="text-3xl font-bold text-charcoal-900 mb-1">{value}</p>

      {subtitle && (
        <p className="text-sm text-charcoal-500">{subtitle}</p>
      )}

      {change !== undefined && (
        <div className="flex items-center gap-1 mt-2">
          {change > 0 ? (
            <TrendingUp size={14} className="text-green-500" />
          ) : change < 0 ? (
            <TrendingDown size={14} className="text-red-500" />
          ) : (
            <Minus size={14} className="text-charcoal-400" />
          )}
          <span
            className={cn(
              'text-xs font-medium',
              change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-charcoal-500',
            )}
          >
            {change > 0 ? '+' : ''}{change}%
          </span>
          {changeLabel && (
            <span className="text-xs text-charcoal-400">{changeLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
```

---

### 4. DataTable Component

```tsx
// components/common/DataTable.tsx
'use client';

import {
  useReactTable, getCoreRowModel, getSortedRowModel,
  getFilteredRowModel, getPaginationRowModel,
  flexRender, ColumnDef, SortingState,
} from '@tanstack/react-table';
import { useState } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { EmptyState } from './EmptyState';

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  loading?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  onRowClick?: (row: T) => void;
  pageSize?: number;
}

export function DataTable<T>({
  data, columns, loading, emptyMessage, emptyIcon, onRowClick, pageSize = 20,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
    initialState: { pagination: { pageSize } },
  });

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 bg-charcoal-50 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data.length) {
    return <EmptyState message={emptyMessage} icon={emptyIcon} />;
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-charcoal-100">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-charcoal-100 bg-charcoal-50/50">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-semibold text-charcoal-500 uppercase tracking-wider"
                    onClick={header.column.getToggleSortingHandler()}
                    style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        <span className="text-charcoal-300">
                          {header.column.getIsSorted() === 'asc' ? (
                            <ChevronUp size={14} />
                          ) : header.column.getIsSorted() === 'desc' ? (
                            <ChevronDown size={14} />
                          ) : (
                            <ChevronsUpDown size={14} />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-charcoal-50">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={cn(
                  'bg-white hover:bg-gold-50/30 transition-colors',
                  onRowClick && 'cursor-pointer',
                )}
                onClick={() => onRowClick?.(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3.5 text-sm text-charcoal-700">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-charcoal-500">
          Showing {table.getState().pagination.pageIndex * pageSize + 1} to{' '}
          {Math.min((table.getState().pagination.pageIndex + 1) * pageSize, data.length)} of{' '}
          {data.length} results
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-1.5 text-sm border border-charcoal-200 rounded-lg disabled:opacity-40 hover:bg-charcoal-50"
          >
            Previous
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-3 py-1.5 text-sm border border-charcoal-200 rounded-lg disabled:opacity-40 hover:bg-charcoal-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

### 5. Reservation Status Badge

```tsx
// components/reservations/ReservationStatusBadge.tsx
import { cn } from '@/lib/utils/cn';

type ReservationStatus =
  | 'INQUIRY' | 'TENTATIVE' | 'CONFIRMED'
  | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED' | 'NO_SHOW';

const statusConfig: Record<ReservationStatus, { label: string; className: string }> = {
  INQUIRY:     { label: 'Inquiry',     className: 'bg-charcoal-100 text-charcoal-600' },
  TENTATIVE:   { label: 'Tentative',   className: 'bg-purple-100 text-purple-700' },
  CONFIRMED:   { label: 'Confirmed',   className: 'bg-blue-100 text-blue-700' },
  CHECKED_IN:  { label: 'Checked In',  className: 'bg-green-100 text-green-700' },
  CHECKED_OUT: { label: 'Checked Out', className: 'bg-charcoal-100 text-charcoal-600' },
  CANCELLED:   { label: 'Cancelled',   className: 'bg-red-100 text-red-700' },
  NO_SHOW:     { label: 'No Show',     className: 'bg-orange-100 text-orange-700' },
};

interface ReservationStatusBadgeProps {
  status: ReservationStatus;
  size?: 'sm' | 'md';
}

export function ReservationStatusBadge({ status, size = 'md' }: ReservationStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
        config.className,
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-70" />
      {config.label}
    </span>
  );
}
```

---

### 6. API Client

```typescript
// lib/api/client.ts
import axios, { AxiosInstance, AxiosError } from 'axios';
import { useAuthStore } from '@/lib/stores/auth.store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Request interceptor: inject auth token and tenant
apiClient.interceptors.request.use((config) => {
  const { accessToken, tenant } = useAuthStore.getState();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  if (tenant?.slug) {
    config.headers['X-Tenant-ID'] = tenant.slug;
  }

  return config;
});

// Response interceptor: handle token refresh
let isRefreshing = false;
let failedQueue: Array<{ resolve: Function; reject: Function }> = [];

apiClient.interceptors.response.use(
  (response) => response.data, // Unwrap envelope
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { refreshToken, setTokens, logout } = useAuthStore.getState();
        const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        const { accessToken: newToken } = response.data.data;

        setTokens(newToken, refreshToken!);
        failedQueue.forEach(({ resolve }) => resolve(newToken));
        failedQueue = [];

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch {
        failedQueue.forEach(({ reject }) => reject(error));
        failedQueue = [];
        useAuthStore.getState().logout();
        window.location.href = '/login';
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error.response?.data || error);
  },
);
```

---

### 7. Auth Store (Zustand)

```typescript
// lib/stores/auth.store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: string[];
  propertyIds: string[];
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  currency: string;
  timezone: string;
}

interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  setAuth: (user: User, tenant: Tenant, accessToken: string, refreshToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tenant: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, tenant, accessToken, refreshToken) =>
        set({ user, tenant, accessToken, refreshToken, isAuthenticated: true }),

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

      logout: () =>
        set({ user: null, tenant: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
    }),
    {
      name: 'Noblesse-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        tenant: state.tenant,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
```

---

### 8. Permissions Hook

```typescript
// lib/hooks/usePermissions.ts
import { useAuthStore } from '@/lib/stores/auth.store';

export function usePermissions() {
  const { user } = useAuthStore();

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    return user.permissions.includes(permission);
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!user) return false;
    return permissions.some((p) => user.permissions.includes(p));
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    if (!user) return false;
    return permissions.every((p) => user.permissions.includes(p));
  };

  const hasRole = (role: string): boolean => {
    if (!user) return false;
    return user.roles.includes(role);
  };

  return { hasPermission, hasAnyPermission, hasAllPermissions, hasRole };
}
```

---

### 9. Next.js Middleware (Route Protection)

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check for auth token in cookie (set during login)
  const token = request.cookies.get('Noblesse-access-token')?.value;

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
};
```

---

### 10. TanStack Query Setup

```typescript
// lib/hooks/useReservations.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reservationsApi } from '@/lib/api/reservations.api';
import { toast } from 'sonner';

export const reservationKeys = {
  all: ['reservations'] as const,
  lists: () => [...reservationKeys.all, 'list'] as const,
  list: (filters: any) => [...reservationKeys.lists(), filters] as const,
  details: () => [...reservationKeys.all, 'detail'] as const,
  detail: (id: string) => [...reservationKeys.details(), id] as const,
};

export function useReservations(filters: any = {}) {
  return useQuery({
    queryKey: reservationKeys.list(filters),
    queryFn: () => reservationsApi.list(filters),
    staleTime: 30_000, // 30 seconds
  });
}

export function useReservation(id: string) {
  return useQuery({
    queryKey: reservationKeys.detail(id),
    queryFn: () => reservationsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateReservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reservationsApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: reservationKeys.lists() });
      toast.success(`Reservation ${data.data.reservationNumber} created successfully`);
    },
    onError: (error: any) => {
      toast.error(error.error?.message || 'Failed to create reservation');
    },
  });
}

export function useCheckIn(reservationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: any) => reservationsApi.checkIn(reservationId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reservationKeys.detail(reservationId) });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Guest checked in successfully');
    },
    onError: (error: any) => {
      toast.error(error.error?.message || 'Check-in failed');
    },
  });
}
```

---

### 11. Room Calendar Component (Room Rack)

```tsx
// components/rooms/RoomCalendar.tsx
'use client';

import { useState, useRef } from 'react';
import { format, addDays, differenceInDays, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils/cn';
import { ReservationStatusBadge } from '@/components/reservations/ReservationStatusBadge';

interface RoomRackData {
  rooms: {
    id: string;
    number: string;
    floor: number;
    roomType: { name: string; code: string };
    status: string;
    reservations: {
      id: string;
      reservationNumber: string;
      checkIn: string;
      checkOut: string;
      guestName: string;
      status: string;
      color: string;
    }[];
  }[];
}

interface RoomCalendarProps {
  data: RoomRackData;
  startDate: Date;
  days?: number;
  onReservationClick?: (reservationId: string) => void;
  onCellClick?: (roomId: string, date: Date) => void;
}

const CELL_WIDTH = 48;  // pixels per day
const ROW_HEIGHT = 52;  // pixels per room

export function RoomCalendar({
  data, startDate, days = 14, onReservationClick, onCellClick,
}: RoomCalendarProps) {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const dateRange = Array.from({ length: days }, (_, i) => addDays(startDate, i));

  const getReservationStyle = (reservation: any, startDate: Date) => {
    const checkIn = startOfDay(new Date(reservation.checkIn));
    const checkOut = startOfDay(new Date(reservation.checkOut));
    const rangeStart = startOfDay(startDate);

    const offsetDays = Math.max(0, differenceInDays(checkIn, rangeStart));
    const durationDays = differenceInDays(checkOut, checkIn);
    const visibleDays = Math.min(durationDays, days - offsetDays);

    return {
      left: offsetDays * CELL_WIDTH + 2,
      width: visibleDays * CELL_WIDTH - 4,
      top: 8,
      height: ROW_HEIGHT - 16,
    };
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-charcoal-100 bg-white">
      <div className="flex">
        {/* Room labels column */}
        <div className="w-48 shrink-0 border-r border-charcoal-100">
          {/* Header */}
          <div className="h-12 border-b border-charcoal-100 bg-charcoal-50 flex items-center px-4">
            <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
              Room
            </span>
          </div>
          {/* Room rows */}
          {data.rooms.map((room) => (
            <div
              key={room.id}
              className="border-b border-charcoal-50 flex items-center px-4 gap-2"
              style={{ height: ROW_HEIGHT }}
            >
              <div>
                <p className="text-sm font-semibold text-charcoal-800">{room.number}</p>
                <p className="text-xs text-charcoal-400">{room.roomType.code} · F{room.floor}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="flex-1 overflow-x-auto" ref={scrollRef}>
          <div style={{ width: days * CELL_WIDTH }}>
            {/* Date headers */}
            <div className="flex h-12 border-b border-charcoal-100 bg-charcoal-50">
              {dateRange.map((date) => {
                const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                return (
                  <div
                    key={date.toISOString()}
                    className={cn(
                      'flex flex-col items-center justify-center border-r border-charcoal-100',
                      'text-xs shrink-0',
                      isToday && 'bg-gold-50',
                    )}
                    style={{ width: CELL_WIDTH }}
                  >
                    <span className={cn('font-semibold', isToday ? 'text-gold-600' : 'text-charcoal-600')}>
                      {format(date, 'd')}
                    </span>
                    <span className={cn('text-[10px]', isToday ? 'text-gold-500' : 'text-charcoal-400')}>
                      {format(date, 'EEE')}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Room rows */}
            {data.rooms.map((room) => (
              <div
                key={room.id}
                className="relative border-b border-charcoal-50"
                style={{ height: ROW_HEIGHT }}
              >
                {/* Day cells */}
                <div className="flex h-full">
                  {dateRange.map((date) => {
                    const cellKey = `${room.id}-${format(date, 'yyyy-MM-dd')}`;
                    const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

                    return (
                      <div
                        key={cellKey}
                        className={cn(
                          'border-r border-charcoal-50 shrink-0 cursor-pointer',
                          'hover:bg-gold-50/50 transition-colors',
                          isToday && 'bg-gold-50/30',
                          hoveredCell === cellKey && 'bg-gold-50',
                        )}
                        style={{ width: CELL_WIDTH }}
                        onMouseEnter={() => setHoveredCell(cellKey)}
                        onMouseLeave={() => setHoveredCell(null)}
                        onClick={() => onCellClick?.(room.id, date)}
                      />
                    );
                  })}
                </div>

                {/* Reservation blocks (absolutely positioned) */}
                {room.reservations.map((reservation) => {
                  const style = getReservationStyle(reservation, startDate);
                  if (style.width <= 0) return null;

                  const statusColors: Record<string, string> = {
                    CONFIRMED:   'bg-blue-500',
                    CHECKED_IN:  'bg-green-500',
                    CHECKED_OUT: 'bg-charcoal-400',
                    TENTATIVE:   'bg-purple-400',
                  };

                  return (
                    <div
                      key={reservation.id}
                      className={cn(
                        'absolute rounded-lg text-white text-xs font-medium',
                        'flex items-center px-2 cursor-pointer overflow-hidden',
                        'hover:brightness-110 transition-all shadow-sm',
                        statusColors[reservation.status] || 'bg-charcoal-400',
                      )}
                      style={style}
                      onClick={(e) => {
                        e.stopPropagation();
                        onReservationClick?.(reservation.id);
                      }}
                      title={`${reservation.guestName} · ${reservation.reservationNumber}`}
                    >
                      <span className="truncate">{reservation.guestName}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

### 12. Payment Modal

```tsx
// components/billing/PaymentModal.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils/currency';

const paymentSchema = z.object({
  method: z.enum(['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'ONLINE_PAYMENT']),
  amount: z.number().positive('Amount must be positive'),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: PaymentFormData) => Promise<void>;
  balance: number;
  currency: string;
  isLoading?: boolean;
}

export function PaymentModal({
  open, onClose, onSubmit, balance, currency, isLoading,
}: PaymentModalProps) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { method: 'CASH', amount: balance },
  });

  const method = watch('method');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Record Payment</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          {/* Outstanding balance */}
          <div className="bg-gold-50 border border-gold-200 rounded-xl p-4">
            <p className="text-sm text-charcoal-500">Outstanding Balance</p>
            <p className="text-2xl font-bold text-charcoal-900">
              {formatCurrency(balance, currency)}
            </p>
          </div>

          {/* Payment method */}
          <div>
            <label className="text-sm font-medium text-charcoal-700 mb-1.5 block">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['CASH', 'CREDIT_CARD', 'BANK_TRANSFER'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setValue('method', m as any)}
                  className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all ${
                    method === m
                      ? 'bg-gold-500 text-white border-gold-500'
                      : 'bg-white text-charcoal-600 border-charcoal-200 hover:border-gold-300'
                  }`}
                >
                  {m.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="text-sm font-medium text-charcoal-700 mb-1.5 block">
              Amount ({currency})
            </label>
            <Input
              type="number"
              step="0.01"
              {...register('amount', { valueAsNumber: true })}
              className="text-lg font-semibold"
            />
            {errors.amount && (
              <p className="text-xs text-red-500 mt-1">{errors.amount.message}</p>
            )}
            <button
              type="button"
              onClick={() => setValue('amount', balance)}
              className="text-xs text-gold-600 hover:text-gold-700 mt-1"
            >
              Pay full balance ({formatCurrency(balance, currency)})
            </button>
          </div>

          {/* Reference */}
          {method !== 'CASH' && (
            <div>
              <label className="text-sm font-medium text-charcoal-700 mb-1.5 block">
                Reference / Card Last 4
              </label>
              <Input {...register('reference')} placeholder="e.g., VISA ****4242" />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="btn-gold flex-1" disabled={isLoading}>
              {isLoading ? 'Processing...' : 'Record Payment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

---

### 13. Zod Validation Schemas

```typescript
// lib/schemas/reservation.schema.ts
import { z } from 'zod';

export const createReservationSchema = z.object({
  propertyId: z.string().uuid('Invalid property'),
  arrivalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  adults: z.number().int().min(1, 'At least 1 adult required').max(20),
  children: z.number().int().min(0).max(20).default(0),
  rooms: z.array(z.object({
    roomTypeId: z.string().uuid(),
    roomId: z.string().uuid().optional(),
    ratePerNight: z.number().positive(),
  })).min(1, 'At least one room required'),
  primaryGuestId: z.string().uuid().optional(),
  newGuest: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    nationality: z.string().length(2).optional(),
  }).optional(),
  ratePlanId: z.string().uuid().optional(),
  sourceId: z.string().uuid().optional(),
  depositAmount: z.number().min(0).default(0),
  specialRequests: z.string().max(1000).optional(),
  notes: z.string().max(2000).optional(),
}).refine(
  (data) => data.primaryGuestId || data.newGuest,
  { message: 'Either select an existing guest or create a new one', path: ['primaryGuestId'] },
).refine(
  (data) => new Date(data.departureDate) > new Date(data.arrivalDate),
  { message: 'Departure must be after arrival', path: ['departureDate'] },
);

export type CreateReservationFormData = z.infer<typeof createReservationSchema>;
```

---

### 14. WebSocket Hook

```typescript
// lib/hooks/useWebSocket.ts
'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/lib/stores/auth.store';
import { usePropertyStore } from '@/lib/stores/property.store';
import { useNotificationStore } from '@/lib/stores/notification.store';
import { useQueryClient } from '@tanstack/react-query';

export function useWebSocket() {
  const socketRef = useRef<Socket | null>(null);
  const { accessToken } = useAuthStore();
  const { selectedPropertyId } = usePropertyStore();
  const { addNotification } = useNotificationStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!accessToken) return;

    const socket = io(`${process.env.NEXT_PUBLIC_WS_URL}/ws`, {
      auth: { token: `Bearer ${accessToken}` },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      if (selectedPropertyId) {
        socket.emit('subscribe:property', { propertyId: selectedPropertyId });
        socket.emit('subscribe:room_rack', { propertyId: selectedPropertyId });
      }
    });

    // Room status changes → invalidate rooms query
    socket.on('room:status_changed', () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['housekeeping'] });
    });

    // Reservation changes → invalidate reservations
    socket.on('reservation:created', () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['room-rack'] });
    });

    socket.on('reservation:status_changed', () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['room-rack'] });
      queryClient.invalidateQueries({ queryKey: ['front-desk'] });
    });

    // New notifications
    socket.on('notification:new', (notification) => {
      addNotification(notification);
    });

    return () => {
      socket.disconnect();
    };
  }, [accessToken, selectedPropertyId]);

  return socketRef.current;
}
```

---

### 15. Confirm Dialog

```tsx
// components/common/ConfirmDialog.tsx
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
  isLoading?: boolean;
}

export function ConfirmDialog({
  open, onClose, onConfirm, title, description,
  confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  variant = 'default', isLoading,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            {variant === 'danger' && (
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
            )}
            <AlertDialogTitle className="font-display">{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-charcoal-500">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="btn-ghost">{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className={variant === 'danger' ? 'bg-red-600 hover:bg-red-700 text-white' : 'btn-gold'}
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

---

### 16. Empty State

```tsx
// components/common/EmptyState.tsx
import { cn } from '@/lib/utils/cn';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  message?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon, title = 'No results found', message, action, className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      {icon && (
        <div className="w-16 h-16 bg-charcoal-50 rounded-2xl flex items-center justify-center mb-4 text-charcoal-300">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-charcoal-700 mb-1">{title}</h3>
      {message && <p className="text-sm text-charcoal-400 max-w-sm mb-4">{message}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}