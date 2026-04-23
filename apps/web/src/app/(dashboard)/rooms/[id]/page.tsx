'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useRoom, useUpdateRoom, useUpdateRoomStatus, useDeleteRoom } from '@/lib/hooks/useRooms';
import { useCreateGuest } from '@/lib/hooks/useGuests';
import { RoomStatus, RoomDto } from '@Noblesse/shared';
import {
  ArrowLeft,
  BedDouble,
  Clock,
  Edit2,
  Trash2,
  Hash,
  Layers,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  StickyNote,
  UserPlus,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<RoomStatus, { label: string; color: string; bg: string }> = {
  [RoomStatus.AVAILABLE]: { label: 'Available', color: 'text-green-700', bg: 'bg-green-100' },
  [RoomStatus.OCCUPIED]: { label: 'Occupied', color: 'text-blue-700', bg: 'bg-blue-100' },
  [RoomStatus.DIRTY]: { label: 'Dirty', color: 'text-orange-700', bg: 'bg-orange-100' },
  [RoomStatus.CLEAN]: { label: 'Clean', color: 'text-green-700', bg: 'bg-green-100' },
  [RoomStatus.INSPECTED]: { label: 'Inspected', color: 'text-purple-700', bg: 'bg-purple-100' },
  [RoomStatus.OUT_OF_ORDER]: { label: 'Out of Order', color: 'text-red-700', bg: 'bg-red-100' },
  [RoomStatus.OUT_OF_SERVICE]: { label: 'Out of Service', color: 'text-gray-600', bg: 'bg-gray-100' },
  [RoomStatus.ON_CHANGE]: { label: 'On Change', color: 'text-yellow-700', bg: 'bg-yellow-100' },
};

interface RoomFormData {
  number: string;
  floor: number;
  roomTypeId: string;
  notes: string;
  isActive: boolean;
}

interface ExtraGuestFormData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  nationality: string;
  idType: string;
  idNumber: string;
  entryTime: string;
  notes: string;
}

function RoomEditForm({
  room,
  onSubmit,
  onCancel,
  isLoading,
}: {
  room: RoomDto;
  onSubmit: (data: RoomFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [form, setForm] = useState<RoomFormData>({
    number: room.number,
    floor: room.floor,
    roomTypeId: room.roomTypeId,
    notes: room.notes ?? '',
    isActive: room.isActive,
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  }

  const inputClass =
    'w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent';
  const labelClass = 'block text-xs font-medium text-muted-foreground mb-1';

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ ...form, floor: Number(form.floor) });
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Room Number *</label>
          <input
            name="number"
            value={form.number}
            onChange={handleChange}
            required
            className={inputClass}
            placeholder="e.g. 101"
          />
        </div>
        <div>
          <label className={labelClass}>Floor *</label>
          <input
            name="floor"
            type="number"
            value={form.floor}
            onChange={handleChange}
            required
            min={0}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Notes</label>
        <textarea
          name="notes"
          value={form.notes}
          onChange={handleChange}
          rows={3}
          className={inputClass}
          placeholder="Any notes about this room..."
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isActive"
          name="isActive"
          checked={form.isActive}
          onChange={handleChange}
          className="h-4 w-4 rounded border-input"
        />
        <label htmlFor="isActive" className="text-sm font-medium">
          Room is active
        </label>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function ExtraRoomGuestPanel({ room }: { room: RoomDto }) {
  const createGuest = useCreateGuest();
  const [form, setForm] = useState<ExtraGuestFormData>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    nationality: '',
    idType: '',
    idNumber: '',
    entryTime: new Date().toTimeString().slice(0, 5),
    notes: '',
  });

  function updateField(name: keyof ExtraGuestFormData, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function resetForm() {
    setForm({
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      nationality: '',
      idType: '',
      idNumber: '',
      entryTime: new Date().toTimeString().slice(0, 5),
      notes: '',
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nationality = form.nationality.trim().toUpperCase();
    if (nationality && nationality.length !== 2) {
      toast.error('Nationality must be a 2-letter country code, like TR or US');
      return;
    }

    const roomContextNotes = [
      `Extra guest entered room ${room.number}`,
      room.roomType?.name ? `Room type: ${room.roomType.name}` : undefined,
      form.entryTime ? `Entry time: ${form.entryTime}` : undefined,
      form.notes.trim() || undefined,
    ]
      .filter(Boolean)
      .join('\n');

    await createGuest.mutateAsync(
      {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        nationality: nationality || undefined,
        idType: form.idType.trim() || undefined,
        idNumber: form.idNumber.trim() || undefined,
        notes: roomContextNotes,
      },
      {
        onSuccess: () => {
          resetForm();
        },
      },
    );
  }

  const inputClass =
    'w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100';
  const labelClass =
    'mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500';

  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-amber-200 bg-white shadow-xl shadow-amber-900/5">
      <div className="flex flex-col gap-4 border-b border-amber-100 bg-gradient-to-br from-amber-50 via-white to-white p-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700">
            Extra guest entry
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            Add walk-in guest to this room
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Use this when an extra person joins the room. The details are saved directly
            into the Guests section with room number and entry time in the guest notes.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 self-start rounded-full border border-amber-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-amber-700 shadow-sm">
          <UserPlus className="h-4 w-4" />
          Auto saves to guests
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>First name *</label>
            <input
              value={form.firstName}
              onChange={(event) => updateField('firstName', event.target.value)}
              required
              placeholder="Guest first name"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Last name *</label>
            <input
              value={form.lastName}
              onChange={(event) => updateField('lastName', event.target.value)}
              required
              placeholder="Guest last name"
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className={labelClass}>Phone</label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-amber-600" />
              <input
                value={form.phone}
                onChange={(event) => updateField('phone', event.target.value)}
                placeholder="+90..."
                className={`${inputClass} pl-11`}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-amber-600" />
              <input
                type="email"
                value={form.email}
                onChange={(event) => updateField('email', event.target.value)}
                placeholder="guest@example.com"
                className={`${inputClass} pl-11`}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Entry time</label>
            <div className="relative">
              <Clock className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-amber-600" />
              <input
                type="time"
                value={form.entryTime}
                onChange={(event) => updateField('entryTime', event.target.value)}
                className={`${inputClass} pl-11`}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className={labelClass}>Nationality code</label>
            <input
              value={form.nationality}
              onChange={(event) => updateField('nationality', event.target.value.toUpperCase())}
              maxLength={2}
              placeholder="TR"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>ID type</label>
            <input
              value={form.idType}
              onChange={(event) => updateField('idType', event.target.value)}
              placeholder="Passport, ID card..."
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>ID number</label>
            <input
              value={form.idNumber}
              onChange={(event) => updateField('idNumber', event.target.value)}
              placeholder="Document number"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Notes</label>
          <textarea
            value={form.notes}
            onChange={(event) => updateField('notes', event.target.value)}
            rows={3}
            placeholder="Extra details, reason, reception note..."
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-amber-100 bg-amber-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-950">Room {room.number}</p>
            <p className="text-xs text-slate-500">
              Saved guest notes will include this room and the selected entry time.
            </p>
          </div>
          <button
            type="submit"
            disabled={createGuest.isPending || !form.firstName.trim() || !form.lastName.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-amber-900/15 transition hover:-translate-y-0.5 hover:shadow-xl disabled:translate-y-0 disabled:opacity-50"
          >
            <UserPlus className="h-4 w-4" />
            {createGuest.isPending ? 'Saving guest...' : 'Save to Guests'}
          </button>
        </div>
      </form>
    </section>
  );
}

export default function RoomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: room, isLoading, isError } = useRoom(id);
  const updateRoom = useUpdateRoom(id);
  const updateStatus = useUpdateRoomStatus();
  const deleteRoom = useDeleteRoom();

  if (isLoading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-muted rounded animate-pulse" />
          <div className="h-6 bg-muted rounded w-32 animate-pulse" />
        </div>
        <div className="bg-card border border-border rounded-xl p-6 animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-24" />
          <div className="h-4 bg-muted rounded w-48" />
          <div className="h-4 bg-muted rounded w-32" />
        </div>
      </div>
    );
  }

  if (isError || !room) {
    return (
      <div className="p-6 max-w-3xl mx-auto text-center py-16">
        <BedDouble className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-40" />
        <h2 className="text-lg font-semibold mb-2">Room not found</h2>
        <Link href="/rooms" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to Rooms
        </Link>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[room.status as RoomStatus] ?? { label: room.status, color: 'text-gray-600', bg: 'bg-gray-100' };

  async function handleUpdate(data: RoomFormData) {
    await updateRoom.mutateAsync(data, {
      onSuccess: () => {
        toast.success('Room updated');
        setIsEditing(false);
      },
      onError: () => toast.error('Failed to update room'),
    });
  }

  async function handleDelete() {
    await deleteRoom.mutateAsync(id, {
      onSuccess: () => {
        toast.success('Room deleted');
        router.push('/rooms');
      },
      onError: () => toast.error('Failed to delete room'),
    });
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/rooms" className="p-1.5 rounded-md hover:bg-muted transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold">Room {room.number}</h1>
            <p className="text-sm text-muted-foreground">{room.roomType?.name ?? 'Unknown type'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md border border-border hover:bg-muted transition-colors"
          >
            <Edit2 className="h-4 w-4" />
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Room info card */}
      <div className="bg-card border border-border rounded-xl p-6">
        {isEditing ? (
          <RoomEditForm
            room={room}
            onSubmit={handleUpdate}
            onCancel={() => setIsEditing(false)}
            isLoading={updateRoom.isPending}
          />
        ) : (
          <div className="space-y-5">
            {/* Status + quick change */}
            <div className="flex items-center justify-between">
              <span className={cn('px-3 py-1 rounded-full text-sm font-medium', statusCfg.bg, statusCfg.color)}>
                {statusCfg.label}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Change status:</span>
                <select
                  value={room.status}
                  onChange={(e) =>
                    updateStatus.mutate({ id: room.id, status: e.target.value })
                  }
                  disabled={updateStatus.isPending}
                  className="text-xs px-2 py-1 bg-muted border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring text-foreground disabled:opacity-50"
                >
                  {Object.values(RoomStatus).map((s) => (
                    <option key={s} value={s}>
                      {STATUS_CONFIG[s]?.label ?? s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Hash className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Room Number</p>
                  <p className="text-sm font-semibold">{room.number}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Layers className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Floor</p>
                  <p className="text-sm font-semibold">{room.floor}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <BedDouble className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Room Type</p>
                  <p className="text-sm font-semibold">{room.roomType?.name ?? '—'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                {room.isActive ? (
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                )}
                <div>
                  <p className="text-xs text-muted-foreground">Active</p>
                  <p className="text-sm font-semibold">{room.isActive ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>

            {/* Room type details */}
            {room.roomType && (
              <div className="border-t border-border pt-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Room Type Details
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Max Occupancy</p>
                    <p className="font-medium">{room.roomType.maxOccupancy} guests</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Base Rate</p>
                    <p className="font-medium">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
                        room.roomType.baseRate
                      )}
                      /night
                    </p>
                  </div>
                  {(room.roomType.amenities ?? []).length > 0 && (
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground mb-1">Amenities</p>
                      <div className="flex flex-wrap gap-1">
                        {(room.roomType.amenities ?? []).map((a: string) => (
                          <span
                            key={a}
                            className="px-2 py-0.5 bg-muted rounded-full text-xs text-muted-foreground"
                          >
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            {room.notes && (
              <div className="border-t border-border pt-4">
                <div className="flex items-start gap-2">
                  <StickyNote className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm whitespace-pre-wrap">{room.notes}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <ExtraRoomGuestPanel room={room} />

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Delete Room</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to delete room <strong>{room.number}</strong>? This action
              cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium rounded-md border border-border hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteRoom.isPending}
                className="px-4 py-2 text-sm font-medium rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
              >
                {deleteRoom.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
