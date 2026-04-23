'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, propertiesApi } from '@/lib/api/users.api';
import { roomsApi } from '@/lib/api/rooms.api';
import { unwrapApiData, unwrapPaginatedApiData } from '@/lib/api/response';
import { useAuthStore } from '@/store/auth.store';
import { UserRole } from '@Noblesse/shared';
import type { UserDto, PropertyDto, RoomTypeDto } from '@Noblesse/shared';
import {
  Building2,
  User,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Shield,
  Eye,
  EyeOff,
  Search,
  Tag,
  Percent,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatDate } from '@/lib/utils';

// ─── Helpers ───────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  [UserRole.SUPER_ADMIN]: 'Super Admin',
  [UserRole.TENANT_ADMIN]: 'Tenant Admin',
  [UserRole.PROPERTY_MANAGER]: 'Property Manager',
  [UserRole.FRONT_DESK_MANAGER]: 'Front Desk Manager',
  [UserRole.RECEPTIONIST]: 'Receptionist',
  [UserRole.HOUSEKEEPING_MANAGER]: 'Housekeeping Manager',
  [UserRole.HOUSEKEEPER]: 'Housekeeper',
  [UserRole.MAINTENANCE_STAFF]: 'Maintenance Staff',
  [UserRole.ACCOUNTANT]: 'Accountant',
  [UserRole.REVENUE_MANAGER]: 'Revenue Manager',
  [UserRole.READONLY]: 'Read Only',
};

const ROLE_COLORS: Record<string, string> = {
  [UserRole.SUPER_ADMIN]: 'bg-red-100 text-red-700',
  [UserRole.TENANT_ADMIN]: 'bg-purple-100 text-purple-700',
  [UserRole.PROPERTY_MANAGER]: 'bg-blue-100 text-blue-700',
  [UserRole.FRONT_DESK_MANAGER]: 'bg-indigo-100 text-indigo-700',
  [UserRole.RECEPTIONIST]: 'bg-cyan-100 text-cyan-700',
  [UserRole.HOUSEKEEPING_MANAGER]: 'bg-green-100 text-green-700',
  [UserRole.HOUSEKEEPER]: 'bg-emerald-100 text-emerald-700',
  [UserRole.MAINTENANCE_STAFF]: 'bg-orange-100 text-orange-700',
  [UserRole.ACCOUNTANT]: 'bg-yellow-100 text-yellow-700',
  [UserRole.REVENUE_MANAGER]: 'bg-pink-100 text-pink-700',
  [UserRole.READONLY]: 'bg-gray-100 text-gray-600',
};

const inputClass =
  'w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring';

// ─── Invite User Modal ─────────────────────────────────────────────────────

interface InviteUserModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function InviteUserModal({ onClose, onSuccess }: InviteUserModalProps) {
  const [form, setForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    roleIds: [] as string[],
    phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const { data: availableRoles } = useQuery({
    queryKey: ['roles'],
    queryFn: () => usersApi.getRoles(),
    select: (res) => unwrapApiData<{ id: string; name: string }[]>(res),
  });

  const mutation = useMutation({
    mutationFn: () =>
      usersApi.create({
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        password: form.password,
        roleIds: form.roleIds,
        phone: form.phone || undefined,
      }),
    onSuccess: () => {
      toast.success('User created successfully');
      onSuccess();
      onClose();
    },
    onError: () => toast.error('Failed to create user'),
  });

  const toggleRole = (id: string) => {
    setForm((f) => ({
      ...f,
      roleIds: f.roleIds.includes(id) ? f.roleIds.filter((r) => r !== id) : [...f.roleIds, id],
    }));
  };

  const isValid = form.email && form.firstName && form.lastName && form.password && form.roleIds.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card rounded-xl border border-border w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-card">
          <h2 className="text-base font-semibold text-foreground">Invite New User</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                First Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                className={inputClass}
                placeholder="John"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Last Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                className={inputClass}
                placeholder="Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Email <span className="text-destructive">*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className={inputClass}
              placeholder="john@hotel.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Phone
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className={inputClass}
              placeholder="+1 555 000 0000"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Password <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className={cn(inputClass, 'pr-10')}
                placeholder="Min. 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">
              Roles <span className="text-destructive">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {(availableRoles ?? []).map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => toggleRole(role.id)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                    form.roleIds.includes(role.id)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-muted-foreground border-border hover:border-primary/50',
                  )}
                >
                  {role.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !isValid}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {mutation.isPending ? 'Creating…' : 'Create User'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit User Modal ───────────────────────────────────────────────────────

interface EditUserModalProps {
  user: UserDto;
  onClose: () => void;
  onSuccess: () => void;
}

function EditUserModal({ user, onClose, onSuccess }: EditUserModalProps) {
  const { data: availableRoles } = useQuery({
    queryKey: ['roles'],
    queryFn: () => usersApi.getRoles(),
    select: (res) => unwrapApiData<{ id: string; name: string }[]>(res),
  });

  // user.roles now contains role name strings; map them to IDs once roles are loaded
  const initialRoleIds = (availableRoles ?? [])
    .filter((r) => (user.roles as string[]).includes(r.name))
    .map((r) => r.id);

  const [form, setForm] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone ?? '',
    roleIds: initialRoleIds,
    isActive: user.isActive,
  });

  const mutation = useMutation({
    mutationFn: () =>
      usersApi.update(user.id, {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone || undefined,
        roleIds: form.roleIds,
        isActive: form.isActive,
      }),
    onSuccess: () => {
      toast.success('User updated');
      onSuccess();
      onClose();
    },
    onError: () => toast.error('Failed to update user'),
  });

  const toggleRole = (id: string) => {
    setForm((f) => ({
      ...f,
      roleIds: f.roleIds.includes(id) ? f.roleIds.filter((r) => r !== id) : [...f.roleIds, id],
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card rounded-xl border border-border w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-card">
          <h2 className="text-base font-semibold text-foreground">Edit User</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                First Name
              </label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Last Name
              </label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">Roles</label>
            <div className="flex flex-wrap gap-2">
              {(availableRoles ?? []).map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => toggleRole(role.id)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                    form.roleIds.includes(role.id)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-muted-foreground border-border hover:border-primary/50',
                  )}
                >
                  {role.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm text-muted-foreground">Account active</span>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {mutation.isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Users Tab ─────────────────────────────────────────────────────────────

function UsersTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [editUser, setEditUser] = useState<UserDto | null>(null);

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users', search],
    queryFn: () => usersApi.getAll({ search: search || undefined, limit: 100 }),
    select: (res) => unwrapPaginatedApiData<UserDto>(res).data,
  });

  const users = usersData ?? [];

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => usersApi.update(id, { isActive: false }),
    onSuccess: () => {
      toast.success('User deactivated');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: () => toast.error('Failed to deactivate user'),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['users'] });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search users…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={15} /> Invite User
        </button>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  User
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  Roles
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  Joined
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border animate-pulse">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-muted rounded w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground text-sm">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((u: UserDto) => (
                  <tr key={u.id} className="border-b border-border hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold shrink-0">
                          {u.firstName[0]}{u.lastName[0]}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{u.fullName}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {u.roles.slice(0, 2).map((role) => (
                          <span
                            key={role}
                            className="px-1.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                          >
                            {role}
                          </span>
                        ))}
                        {u.roles.length > 2 && (
                          <span className="px-1.5 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
                            +{u.roles.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium',
                          u.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700',
                        )}
                      >
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {formatDate(new Date(u.createdAt))}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setEditUser(u)}
                          className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                          title="Edit user"
                        >
                          <Pencil size={14} />
                        </button>
                        {u.isActive && (
                          <button
                            onClick={() => {
                              if (confirm(`Deactivate ${u.fullName}?`)) {
                                deactivateMutation.mutate(u.id);
                              }
                            }}
                            className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                            title="Deactivate user"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showInvite && (
        <InviteUserModal onClose={() => setShowInvite(false)} onSuccess={invalidate} />
      )}
      {editUser && (
        <EditUserModal user={editUser} onClose={() => setEditUser(null)} onSuccess={invalidate} />
      )}
    </div>
  );
}

// ─── Property Tab ──────────────────────────────────────────────────────────

function PropertyTab() {
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = user?.roles?.includes('Super Admin') ?? false;
  const queryClient = useQueryClient();

  // Fetch all properties for this tenant — works regardless of cached user.propertyIds
  const { data: properties = [], isLoading: propertiesLoading } = useQuery({
    queryKey: ['properties-all'],
    queryFn: () => propertiesApi.getAll(),
    select: (res) => unwrapApiData<PropertyDto[]>(res),
  });

  // Allow selecting which property to view/edit when there are multiple
  const [selectedPropertyId, setSelectedPropertyId] = React.useState<string | null>(null);
  const property = React.useMemo(() => {
    if (selectedPropertyId) return properties.find((p) => p.id === selectedPropertyId) ?? properties[0] ?? null;
    return properties[0] ?? null;
  }, [properties, selectedPropertyId]);
  const propertyId = property?.id ?? null;

  // Room types state
  const { data: roomTypes = [], isLoading: roomTypesLoading } = useQuery({
    queryKey: ['room-types', propertyId],
    queryFn: () => roomsApi.getRoomTypes(propertyId!),
    enabled: !!propertyId,
    select: (res) => unwrapApiData<RoomTypeDto[]>(res),
  });

  const [showRoomTypeForm, setShowRoomTypeForm] = useState(false);
  const [roomTypeForm, setRoomTypeForm] = useState({
    name: '',
    code: '',
    description: '',
    baseRate: '',
    maxOccupancy: '2',
    amenities: '',
  });

  const createRoomTypeMutation = useMutation({
    mutationFn: () =>
      roomsApi.createRoomType(propertyId!, {
        name: roomTypeForm.name,
        code: roomTypeForm.code.toUpperCase(),
        description: roomTypeForm.description,
        baseRate: parseFloat(roomTypeForm.baseRate),
        maxOccupancy: parseInt(roomTypeForm.maxOccupancy),
        amenities: roomTypeForm.amenities
          ? roomTypeForm.amenities.split(',').map((a) => a.trim()).filter(Boolean)
          : [],
        isActive: true,
      }),
    onSuccess: () => {
      toast.success('Room type created');
      queryClient.invalidateQueries({ queryKey: ['room-types', propertyId] });
      setShowRoomTypeForm(false);
      setRoomTypeForm({ name: '', code: '', description: '', baseRate: '', maxOccupancy: '2', amenities: '' });
    },
    onError: () => toast.error('Failed to create room type'),
  });

  const [form, setForm] = useState<{
    name: string;
    address: string;
    city: string;
    country: string;
    phone: string;
    email: string;
    timezone: string;
    currencyCode: string;
  } | null>(null);

  const [editing, setEditing] = useState(false);

  React.useEffect(() => {
    if (property && !form) {
      setForm({
        name: property.name ?? '',
        address: property.address ?? '',
        city: property.city ?? '',
        country: property.country ?? '',
        phone: property.phone ?? '',
        email: property.email ?? '',
        timezone: property.timezone ?? 'UTC',
        currencyCode: property.currencyCode ?? 'USD',
      });
    }
  }, [property, form]);

  const mutation = useMutation({
    mutationFn: () => propertiesApi.update(propertyId!, form!),
    onSuccess: () => {
      toast.success('Property settings saved');
      queryClient.invalidateQueries({ queryKey: ['properties-all'] });
      setEditing(false);
    },
    onError: () => toast.error('Failed to save property settings'),
  });

  if (propertiesLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground text-sm">No property found for your account.</p>
        <p className="text-muted-foreground text-xs mt-1">Contact your administrator to set up a property.</p>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  const Field = ({
    label,
    field,
    type = 'text',
    placeholder,
  }: {
    label: string;
    field: keyof typeof form;
    type?: string;
    placeholder?: string;
  }) => (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</label>
      {editing ? (
        <input
          type={type}
          value={form[field]}
          onChange={(e) => setForm((f) => f ? { ...f, [field]: e.target.value } : f)}
          placeholder={placeholder}
          className={inputClass}
        />
      ) : (
        <p className="text-sm text-foreground py-2 px-3 bg-muted/30 rounded-lg">
          {form[field] || <span className="text-muted-foreground italic">Not set</span>}
        </p>
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Property selector — shown when tenant has multiple properties */}
      {properties.length > 1 && (
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
          <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">Active Property</label>
          <select
            value={propertyId ?? ''}
            onChange={(e) => { setSelectedPropertyId(e.target.value); setForm(null); setEditing(false); }}
            className="flex-1 text-sm bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
            ))}
          </select>
        </div>
      )}

      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-foreground">Property Information</h3>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Pencil size={12} /> Edit
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditing(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={12} /> Cancel
              </button>
              <button
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Check size={12} /> {mutation.isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Property Name" field="name" placeholder="Grand Hotel" />
          <Field label="Phone" field="phone" type="tel" placeholder="+1 555 000 0000" />
          <Field label="Email" field="email" type="email" placeholder="info@hotel.com" />
          <div className="sm:col-span-2">
            <Field label="Address" field="address" placeholder="123 Main Street" />
          </div>
          <Field label="City" field="city" placeholder="New York" />
          <Field label="Country" field="country" placeholder="United States" />
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-foreground mb-5">Operational Settings</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Timezone
            </label>
            {editing ? (
              <select
                value={form.timezone}
                onChange={(e) => setForm((f) => f ? { ...f, timezone: e.target.value } : f)}
                className={inputClass}
              >
                {[
                  'UTC',
                  'America/New_York',
                  'America/Chicago',
                  'America/Denver',
                  'America/Los_Angeles',
                  'Europe/London',
                  'Europe/Paris',
                  'Europe/Istanbul',
                  'Asia/Dubai',
                  'Asia/Singapore',
                  'Asia/Tokyo',
                  'Australia/Sydney',
                ].map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-foreground py-2 px-3 bg-muted/30 rounded-lg">
                {form.timezone}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Currency
            </label>
            {editing ? (
              <select
                value={form.currencyCode}
                onChange={(e) => setForm((f) => f ? { ...f, currencyCode: e.target.value } : f)}
                className={inputClass}
              >
                {['USD', 'EUR', 'GBP', 'TRY', 'AED', 'SGD', 'JPY', 'AUD', 'CAD'].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-foreground py-2 px-3 bg-muted/30 rounded-lg">
                {form.currencyCode}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Room Types Section (Super Admin only) ── */}
      {isSuperAdmin && (
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Room Types</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Define the room categories for this property</p>
            </div>
            <button
              onClick={() => setShowRoomTypeForm((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus size={12} /> {showRoomTypeForm ? 'Cancel' : 'Add Room Type'}
            </button>
          </div>

          {/* Create form */}
          {showRoomTypeForm && (
            <div className="mb-5 p-4 bg-muted/30 rounded-lg border border-border space-y-3">
              <p className="text-xs font-medium text-foreground">New Room Type</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Name *</label>
                  <input
                    value={roomTypeForm.name}
                    onChange={(e) => setRoomTypeForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Deluxe Suite"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Code * (e.g. DLX-STE)</label>
                  <input
                    value={roomTypeForm.code}
                    onChange={(e) => setRoomTypeForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                    placeholder="DLX-STE"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Base Rate (per night) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={roomTypeForm.baseRate}
                    onChange={(e) => setRoomTypeForm((f) => ({ ...f, baseRate: e.target.value }))}
                    placeholder="150.00"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Max Occupancy *</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={roomTypeForm.maxOccupancy}
                    onChange={(e) => setRoomTypeForm((f) => ({ ...f, maxOccupancy: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-muted-foreground mb-1">Description</label>
                  <input
                    value={roomTypeForm.description}
                    onChange={(e) => setRoomTypeForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Spacious room with ocean view"
                    className={inputClass}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-muted-foreground mb-1">Amenities (comma-separated)</label>
                  <input
                    value={roomTypeForm.amenities}
                    onChange={(e) => setRoomTypeForm((f) => ({ ...f, amenities: e.target.value }))}
                    placeholder="WiFi, TV, Air Conditioning, Mini Bar"
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => { setShowRoomTypeForm(false); setRoomTypeForm({ name: '', code: '', description: '', baseRate: '', maxOccupancy: '2', amenities: '' }); }}
                  className="px-3 py-1.5 text-xs border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => createRoomTypeMutation.mutate()}
                  disabled={createRoomTypeMutation.isPending || !roomTypeForm.name || !roomTypeForm.code || !roomTypeForm.baseRate}
                  className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {createRoomTypeMutation.isPending ? 'Creating…' : 'Create Room Type'}
                </button>
              </div>
            </div>
          )}

          {/* Room types list */}
          {roomTypesLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />)}
            </div>
          ) : roomTypes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No room types yet. Add one above.</p>
          ) : (
            <div className="space-y-2">
              {roomTypes.map((rt: RoomTypeDto) => (
                <div key={rt.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-border">
                  <div>
                    <p className="text-sm font-medium text-foreground">{rt.name}</p>
                    <p className="text-xs text-muted-foreground">{rt.code} · Max {rt.maxOccupancy} guests · ${rt.baseRate}/night</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">
                    Active
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Profile Tab ───────────────────────────────────────────────────────────

function ProfileTab() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    phone: user?.phone ?? '',
  });
  const [pwForm, setPwForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPw, setShowPw] = useState(false);

  const updateMutation = useMutation({
    mutationFn: () => usersApi.update(user!.id, form),
    onSuccess: () => {
      toast.success('Profile updated');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditing(false);
    },
    onError: () => toast.error('Failed to update profile'),
  });

  const pwMutation = useMutation({
    mutationFn: () =>
      usersApi.changePassword(user!.id, {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      }),
    onSuccess: () => {
      toast.success('Password changed');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: () => toast.error('Failed to change password'),
  });

  if (!user) return null;

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Profile info */}
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-foreground">Personal Information</h3>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Pencil size={12} /> Edit
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditing(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={12} /> Cancel
              </button>
              <button
                onClick={() => updateMutation.mutate()}
                disabled={updateMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Check size={12} /> {updateMutation.isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
            {user.firstName[0]}{user.lastName[0]}
          </div>
          <div>
            <p className="font-semibold text-foreground">{user.fullName}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {user.roles.map((role) => (
                <span
                  key={role}
                  className={cn(
                    'px-1.5 py-0.5 rounded-full text-xs font-medium',
                    ROLE_COLORS[role] ?? 'bg-gray-100 text-gray-600',
                  )}
                >
                  {ROLE_LABELS[role] ?? role}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              First Name
            </label>
            {editing ? (
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                className={inputClass}
              />
            ) : (
              <p className="text-sm text-foreground py-2 px-3 bg-muted/30 rounded-lg">
                {user.firstName}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Last Name
            </label>
            {editing ? (
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                className={inputClass}
              />
            ) : (
              <p className="text-sm text-foreground py-2 px-3 bg-muted/30 rounded-lg">
                {user.lastName}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email</label>
            <p className="text-sm text-foreground py-2 px-3 bg-muted/30 rounded-lg text-muted-foreground">
              {user.email}
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Phone</label>
            {editing ? (
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className={inputClass}
              />
            ) : (
              <p className="text-sm text-foreground py-2 px-3 bg-muted/30 rounded-lg">
                {user.phone || <span className="text-muted-foreground italic">Not set</span>}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Change password */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-foreground mb-5">Change Password</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={pwForm.currentPassword}
                onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))}
                className={cn(inputClass, 'pr-10')}
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              New Password
            </label>
            <input
              type={showPw ? 'text' : 'password'}
              value={pwForm.newPassword}
              onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))}
              className={inputClass}
              placeholder="Min. 8 characters"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Confirm New Password
            </label>
            <input
              type={showPw ? 'text' : 'password'}
              value={pwForm.confirmPassword}
              onChange={(e) => setPwForm((f) => ({ ...f, confirmPassword: e.target.value }))}
              className={cn(
                inputClass,
                pwForm.confirmPassword &&
                  pwForm.confirmPassword !== pwForm.newPassword &&
                  'border-destructive',
              )}
              placeholder="Repeat new password"
            />
            {pwForm.confirmPassword && pwForm.confirmPassword !== pwForm.newPassword && (
              <p className="text-xs text-destructive mt-1">Passwords do not match</p>
            )}
          </div>
          <button
            onClick={() => pwMutation.mutate()}
            disabled={
              pwMutation.isPending ||
              !pwForm.currentPassword ||
              !pwForm.newPassword ||
              pwForm.newPassword !== pwForm.confirmPassword ||
              pwForm.newPassword.length < 8
            }
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {pwMutation.isPending ? 'Changing…' : 'Change Password'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Settings Page ────────────────────────────────────────────────────

type Tab = 'profile' | 'users' | 'property';

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'profile', label: 'My Profile', icon: User },
  { id: 'users', label: 'Users & Access', icon: Shield },
  { id: 'property', label: 'Property', icon: Building2 },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground font-display">Settings</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Manage your account, team, and property configuration.
        </p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar nav */}
        <div className="w-48 shrink-0">
          <nav className="space-y-0.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left',
                    activeTab === tab.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                  )}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}

            {/* Sub-page links */}
            <div className="pt-3 mt-3 border-t border-border">
              <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                Advanced
              </p>
              {[
                { href: '/settings/roles', label: 'Roles & Permissions', icon: Shield },
                { href: '/settings/rates', label: 'Rate Plans', icon: Tag },
                { href: '/settings/taxes', label: 'Taxes & Fees', icon: Percent },
                { href: '/settings/audit-logs', label: 'Audit Logs', icon: FileText },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon size={16} />
                      {item.label}
                    </span>
                    <ChevronRight size={12} className="opacity-50" />
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeTab === 'profile' && <ProfileTab />}
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'property' && <PropertyTab />}
        </div>
      </div>
    </div>
  );
}
