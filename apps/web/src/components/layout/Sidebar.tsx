'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import {
  LayoutDashboard,
  CalendarDays,
  BedDouble,
  Users,
  Sparkles,
  Wrench,
  BarChart3,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Moon,
  Grid3X3,
  ConciergeBell,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Front Desk', href: '/front-desk', icon: ConciergeBell },
  { label: 'Reservations', href: '/reservations', icon: CalendarDays },
  { label: 'Room Rack', href: '/room-rack', icon: Grid3X3 },
  { label: 'Rooms', href: '/rooms', icon: BedDouble },
  { label: 'Guests', href: '/guests', icon: Users },
  { label: 'Housekeeping', href: '/housekeeping', icon: Sparkles },
  { label: 'Maintenance', href: '/maintenance', icon: Wrench },
  { label: 'Reports', href: '/reports', icon: BarChart3 },
  { label: 'Night Audit', href: '/night-audit', icon: Moon },
  { label: 'Notifications', href: '/notifications', icon: Bell },
];

const bottomItems: NavItem[] = [
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, clearAuth } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-[hsl(var(--sidebar-bg))] border-r border-[hsl(var(--sidebar-border))] transition-all duration-300 shrink-0',
        collapsed ? 'w-16' : 'w-[260px]',
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-[hsl(var(--sidebar-border))] shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-gold-500 flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm font-display">L</span>
            </div>
            <div className="min-w-0">
              <p className="text-[hsl(var(--sidebar-text))] font-semibold text-sm font-display leading-tight truncate">
                Noblesse PMS
              </p>
              <p className="text-[hsl(var(--sidebar-muted))] text-xs truncate">
                Hotel Management
              </p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-gold-500 flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-sm font-display">L</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
                active
                  ? 'bg-gold-500 text-white'
                  : 'text-[hsl(var(--sidebar-muted))] hover:bg-[hsl(var(--sidebar-hover-bg))] hover:text-[hsl(var(--sidebar-text))]',
                collapsed && 'justify-center px-2',
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                size={18}
                className={cn(
                  'shrink-0',
                  active ? 'text-white' : 'text-[hsl(var(--sidebar-muted))] group-hover:text-[hsl(var(--sidebar-text))]',
                )}
              />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {!collapsed && item.badge != null && item.badge > 0 && (
                <span className="ml-auto bg-gold-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center leading-none">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-2 pb-2 space-y-0.5 border-t border-[hsl(var(--sidebar-border))] pt-2">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
                active
                  ? 'bg-gold-500 text-white'
                  : 'text-[hsl(var(--sidebar-muted))] hover:bg-[hsl(var(--sidebar-hover-bg))] hover:text-[hsl(var(--sidebar-text))]',
                collapsed && 'justify-center px-2',
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}

        {/* User + Logout */}
        {!collapsed && user && (
          <div className="flex items-center gap-2 px-3 py-2 mt-1">
            <div className="w-7 h-7 rounded-full bg-gold-500 flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-semibold">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[hsl(var(--sidebar-text))] text-xs font-medium truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-[hsl(var(--sidebar-muted))] text-xs truncate">{user.roles[0] ?? 'Staff'}</p>
            </div>
            <button
              onClick={clearAuth}
              className="text-[hsl(var(--sidebar-muted))] hover:text-red-400 transition-colors shrink-0"
              title="Sign out"
            >
              <LogOut size={15} />
            </button>
          </div>
        )}

        {collapsed && (
          <button
            onClick={clearAuth}
            className="flex items-center justify-center w-full py-2.5 rounded-lg text-[hsl(var(--sidebar-muted))] hover:text-red-400 hover:bg-[hsl(var(--sidebar-hover-bg))] transition-all"
            title="Sign out"
          >
            <LogOut size={18} />
          </button>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute bottom-24 -right-3 w-6 h-6 rounded-full bg-[hsl(var(--sidebar-bg))] border border-[hsl(var(--sidebar-border))] flex items-center justify-center text-[hsl(var(--sidebar-muted))] hover:text-[hsl(var(--sidebar-text))] transition-colors shadow-sm"
        style={{ position: 'relative', alignSelf: 'flex-end', marginRight: '-12px', marginBottom: '8px' }}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}