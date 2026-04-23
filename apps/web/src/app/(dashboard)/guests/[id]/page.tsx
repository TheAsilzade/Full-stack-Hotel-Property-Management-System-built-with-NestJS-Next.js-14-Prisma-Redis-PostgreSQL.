'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useGuest, useUpdateGuest, useDeleteGuest } from '@/lib/hooks/useGuests';
import { GuestForm, GuestFormData } from '@/components/guests/GuestForm';
import { GuestStayHistory } from '@/components/guests/GuestStayHistory';
import { GenderType } from '@Noblesse/shared';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Globe,
  CreditCard,
  Calendar,
  Star,
  DollarSign,
  BedDouble,
  User,
} from 'lucide-react';
import { toast } from 'sonner';

const genderLabels: Record<GenderType, string> = {
  [GenderType.MALE]: 'Male',
  [GenderType.FEMALE]: 'Female',
  [GenderType.OTHER]: 'Other',
  [GenderType.PREFER_NOT_TO_SAY]: 'Prefer not to say',
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export default function GuestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: guest, isLoading, isError } = useGuest(id);
  const updateGuest = useUpdateGuest(id);
  const deleteGuest = useDeleteGuest();

  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-8 w-8 bg-muted rounded animate-pulse" />
          <div className="h-6 bg-muted rounded w-40 animate-pulse" />
        </div>
        <div className="bg-card border border-border rounded-xl p-6 animate-pulse">
          <div className="flex items-start gap-5">
            <div className="h-16 w-16 rounded-full bg-muted" />
            <div className="flex-1 space-y-3">
              <div className="h-6 bg-muted rounded w-48" />
              <div className="h-4 bg-muted rounded w-64" />
              <div className="h-4 bg-muted rounded w-32" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !guest) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="text-center py-16">
          <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-40" />
          <h2 className="text-lg font-semibold mb-2">Guest not found</h2>
          <p className="text-muted-foreground mb-4">
            The guest you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Link
            href="/guests"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Guests
          </Link>
        </div>
      </div>
    );
  }

  const isVip = guest.totalStays >= 5;
  const initials = `${guest.firstName[0]}${guest.lastName[0]}`.toUpperCase();

  async function handleUpdate(data: GuestFormData) {
    await updateGuest.mutateAsync(data, {
      onSuccess: () => {
        toast.success('Guest updated successfully');
        setIsEditing(false);
      },
      onError: () => {
        toast.error('Failed to update guest');
      },
    });
  }

  async function handleDelete() {
    await deleteGuest.mutateAsync(id, {
      onSuccess: () => {
        toast.success('Guest deleted');
        router.push('/guests');
      },
      onError: () => {
        toast.error('Failed to delete guest');
      },
    });
  }

  if (isEditing) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setIsEditing(false)}
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-semibold">Edit Guest</h1>
            <p className="text-sm text-muted-foreground">{guest.fullName}</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <GuestForm
            defaultValues={guest}
            onSubmit={handleUpdate}
            isLoading={updateGuest.isPending}
            submitLabel="Save Changes"
          />
          <div className="mt-4 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-sm font-medium rounded-md border border-border hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/guests"
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold">Guest Profile</h1>
            <p className="text-sm text-muted-foreground">
              Member since {format(new Date(guest.createdAt), 'MMMM yyyy')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md border border-border hover:bg-muted transition-colors"
          >
            <Edit2 className="h-4 w-4" />
            Edit
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

      {/* Profile card */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xl font-bold text-primary">{initials}</span>
            </div>
            {isVip && (
              <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-amber-400 flex items-center justify-center">
                <Star className="h-3 w-3 text-white fill-white" />
              </div>
            )}
          </div>

          {/* Name & badges */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl font-bold">{guest.fullName}</h2>
              {isVip && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
                  <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                  VIP
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
              {guest.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  {guest.email}
                </span>
              )}
              {guest.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  {guest.phone}
                </span>
              )}
              {guest.nationality && (
                <span className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" />
                  {guest.nationality}
                </span>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="hidden sm:flex items-center gap-6 shrink-0">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-2xl font-bold">
                <BedDouble className="h-5 w-5 text-muted-foreground" />
                {guest.totalStays}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Total Stays</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-2xl font-bold">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                {formatCurrency(guest.totalSpend).replace('$', '')}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Total Spend</p>
            </div>
          </div>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
            Personal Information
          </h3>
          <dl className="space-y-3">
            {guest.dateOfBirth && (
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <dt className="text-xs text-muted-foreground">Date of Birth</dt>
                  <dd className="text-sm font-medium">
                    {format(new Date(guest.dateOfBirth), 'MMMM d, yyyy')}
                  </dd>
                </div>
              </div>
            )}
            {guest.gender && (
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <dt className="text-xs text-muted-foreground">Gender</dt>
                  <dd className="text-sm font-medium">
                    {genderLabels[guest.gender as GenderType] ?? guest.gender}
                  </dd>
                </div>
              </div>
            )}
            {guest.nationality && (
              <div className="flex items-start gap-3">
                <Globe className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <dt className="text-xs text-muted-foreground">Nationality</dt>
                  <dd className="text-sm font-medium">{guest.nationality}</dd>
                </div>
              </div>
            )}
          </dl>
        </div>

        {/* Identity & Address */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
            Identity &amp; Address
          </h3>
          <dl className="space-y-3">
            {guest.idType && guest.idNumber && (
              <div className="flex items-start gap-3">
                <CreditCard className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <dt className="text-xs text-muted-foreground">{guest.idType}</dt>
                  <dd className="text-sm font-medium font-mono">{guest.idNumber}</dd>
                </div>
              </div>
            )}
            {(guest.address || guest.city || guest.country) && (
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <dt className="text-xs text-muted-foreground">Address</dt>
                  <dd className="text-sm font-medium">
                    {[guest.address, guest.city, guest.country].filter(Boolean).join(', ')}
                  </dd>
                </div>
              </div>
            )}
          </dl>
        </div>

        {/* Notes */}
        {guest.notes && (
          <div className="bg-card border border-border rounded-xl p-5 md:col-span-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Notes
            </h3>
            <p className="text-sm text-foreground whitespace-pre-wrap">{guest.notes}</p>
          </div>
        )}
      </div>

      {/* Stay History */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
          Stay History
        </h3>
        <GuestStayHistory guestId={id} />
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Delete Guest</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to delete <strong>{guest.fullName}</strong>? This action cannot
              be undone.
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
                disabled={deleteGuest.isPending}
                className="px-4 py-2 text-sm font-medium rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
              >
                {deleteGuest.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}