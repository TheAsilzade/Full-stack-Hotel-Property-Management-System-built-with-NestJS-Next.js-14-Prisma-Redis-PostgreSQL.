'use client';

import React, { useState } from 'react';
import { Shield, ChevronRight, Check, Info } from 'lucide-react';
import { UserRole } from '@Noblesse/shared';
import Link from 'next/link';

// ─── Role definitions ────────────────────────────────────────────────────────

const ROLE_DESCRIPTIONS: Record<UserRole, { label: string; description: string; color: string }> = {
  [UserRole.SUPER_ADMIN]: {
    label: 'Super Admin',
    description: 'Full system access across all tenants. Reserved for platform administrators.',
    color: 'text-red-600 bg-red-50 border-red-200',
  },
  [UserRole.TENANT_ADMIN]: {
    label: 'Tenant Admin',
    description: 'Full access to all properties and settings within the tenant account.',
    color: 'text-purple-600 bg-purple-50 border-purple-200',
  },
  [UserRole.PROPERTY_MANAGER]: {
    label: 'Property Manager',
    description: 'Manages a single property: rooms, staff, rates, and reports.',
    color: 'text-blue-600 bg-blue-50 border-blue-200',
  },
  [UserRole.FRONT_DESK_MANAGER]: {
    label: 'Front Desk Manager',
    description: 'Oversees front desk operations, check-ins, check-outs, and reservations.',
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
  },
  [UserRole.RECEPTIONIST]: {
    label: 'Receptionist',
    description: 'Handles guest check-in/check-out, reservations, and folio management.',
    color: 'text-cyan-600 bg-cyan-50 border-cyan-200',
  },
  [UserRole.HOUSEKEEPING_MANAGER]: {
    label: 'Housekeeping Manager',
    description: 'Assigns and monitors housekeeping tasks across all rooms.',
    color: 'text-green-600 bg-green-50 border-green-200',
  },
  [UserRole.HOUSEKEEPER]: {
    label: 'Housekeeper',
    description: 'Views and updates assigned room cleaning tasks.',
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  },
  [UserRole.MAINTENANCE_STAFF]: {
    label: 'Maintenance Staff',
    description: 'Views and resolves maintenance tickets assigned to them.',
    color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  },
  [UserRole.ACCOUNTANT]: {
    label: 'Accountant',
    description: 'Access to folios, payments, invoices, and financial reports.',
    color: 'text-orange-600 bg-orange-50 border-orange-200',
  },
  [UserRole.REVENUE_MANAGER]: {
    label: 'Revenue Manager',
    description: 'Manages rate plans, availability, and revenue analytics.',
    color: 'text-pink-600 bg-pink-50 border-pink-200',
  },
  [UserRole.READONLY]: {
    label: 'Read Only',
    description: 'View-only access to dashboards and reports. Cannot make changes.',
    color: 'text-gray-600 bg-gray-50 border-gray-200',
  },
};

// Permission matrix per role
const PERMISSIONS: { label: string; key: string; roles: UserRole[] }[] = [
  {
    label: 'View Reservations',
    key: 'reservations:read',
    roles: Object.values(UserRole),
  },
  {
    label: 'Create / Edit Reservations',
    key: 'reservations:write',
    roles: [
      UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.PROPERTY_MANAGER,
      UserRole.FRONT_DESK_MANAGER, UserRole.RECEPTIONIST,
    ],
  },
  {
    label: 'Check-In / Check-Out',
    key: 'checkin:write',
    roles: [
      UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.PROPERTY_MANAGER,
      UserRole.FRONT_DESK_MANAGER, UserRole.RECEPTIONIST,
    ],
  },
  {
    label: 'Manage Folios & Payments',
    key: 'folios:write',
    roles: [
      UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.PROPERTY_MANAGER,
      UserRole.FRONT_DESK_MANAGER, UserRole.RECEPTIONIST, UserRole.ACCOUNTANT,
    ],
  },
  {
    label: 'View Reports',
    key: 'reports:read',
    roles: [
      UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.PROPERTY_MANAGER,
      UserRole.FRONT_DESK_MANAGER, UserRole.ACCOUNTANT, UserRole.REVENUE_MANAGER,
      UserRole.READONLY,
    ],
  },
  {
    label: 'Manage Housekeeping',
    key: 'housekeeping:write',
    roles: [
      UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.PROPERTY_MANAGER,
      UserRole.HOUSEKEEPING_MANAGER, UserRole.HOUSEKEEPER,
    ],
  },
  {
    label: 'Manage Maintenance',
    key: 'maintenance:write',
    roles: [
      UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.PROPERTY_MANAGER,
      UserRole.MAINTENANCE_STAFF,
    ],
  },
  {
    label: 'Manage Users',
    key: 'users:write',
    roles: [UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.PROPERTY_MANAGER],
  },
  {
    label: 'Manage Property Settings',
    key: 'property:write',
    roles: [UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.PROPERTY_MANAGER],
  },
  {
    label: 'Run Night Audit',
    key: 'nightaudit:write',
    roles: [
      UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.PROPERTY_MANAGER,
      UserRole.FRONT_DESK_MANAGER, UserRole.ACCOUNTANT,
    ],
  },
  {
    label: 'Manage Rate Plans',
    key: 'rates:write',
    roles: [
      UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.PROPERTY_MANAGER,
      UserRole.REVENUE_MANAGER,
    ],
  },
];

const DISPLAY_ROLES = [
  UserRole.RECEPTIONIST,
  UserRole.FRONT_DESK_MANAGER,
  UserRole.HOUSEKEEPING_MANAGER,
  UserRole.HOUSEKEEPER,
  UserRole.MAINTENANCE_STAFF,
  UserRole.ACCOUNTANT,
  UserRole.REVENUE_MANAGER,
  UserRole.PROPERTY_MANAGER,
  UserRole.TENANT_ADMIN,
];

export default function RolesPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/settings" className="hover:text-foreground transition-colors">Settings</Link>
        <ChevronRight size={12} />
        <span className="text-foreground font-medium">Roles & Permissions</span>
      </nav>

      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center">
          <Shield className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-foreground">Roles & Permissions</h1>
          <p className="text-xs text-muted-foreground">System-defined roles and their access levels</p>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
        <Info size={16} className="shrink-0 mt-0.5" />
        <p>
          Roles are system-defined and cannot be modified. Assign roles to users from the{' '}
          <Link href="/settings" className="underline font-medium">Users & Access</Link> tab.
        </p>
      </div>

      {/* Role cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Object.values(UserRole).map((role) => {
          const def = ROLE_DESCRIPTIONS[role];
          return (
            <button
              key={role}
              onClick={() => setSelectedRole(selectedRole === role ? null : role)}
              className={`text-left p-4 rounded-xl border transition-all ${
                selectedRole === role
                  ? 'border-gold-500 ring-1 ring-gold-500/30 bg-gold-500/5'
                  : 'border-border bg-card hover:border-gold-300'
              }`}
            >
              <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border mb-2 ${def.color}`}>
                <Shield size={10} />
                {def.label}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{def.description}</p>
            </button>
          );
        })}
      </div>

      {/* Permission matrix */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Permission Matrix</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Which roles can perform each action
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground w-48">Permission</th>
                {DISPLAY_ROLES.map((r) => (
                  <th key={r} className="px-2 py-3 font-medium text-muted-foreground text-center min-w-[80px]">
                    <span className="block truncate max-w-[72px] mx-auto" title={ROLE_DESCRIPTIONS[r].label}>
                      {ROLE_DESCRIPTIONS[r].label.replace(' Manager', ' Mgr').replace('Housekeeping', 'HK')}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSIONS.map((perm, i) => (
                <tr key={perm.key} className={`border-b border-border ${i % 2 === 0 ? '' : 'bg-muted/10'}`}>
                  <td className="px-4 py-2.5 text-foreground font-medium">{perm.label}</td>
                  {DISPLAY_ROLES.map((r) => (
                    <td key={r} className="px-2 py-2.5 text-center">
                      {perm.roles.includes(r) ? (
                        <Check size={14} className="text-green-500 mx-auto" />
                      ) : (
                        <span className="text-muted-foreground/30 text-base leading-none">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}