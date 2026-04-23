'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCreateGuest } from '@/lib/hooks/useGuests';
import { GuestForm, GuestFormData } from '@/components/guests/GuestForm';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function NewGuestPage() {
  const router = useRouter();
  const createGuest = useCreateGuest();

  async function handleSubmit(data: GuestFormData) {
    await createGuest.mutateAsync(data, {
      onSuccess: (res) => {
        const guest = res.data.data;
        toast.success(`Guest ${guest.fullName} created successfully`);
        router.push(`/guests/${guest.id}`);
      },
      onError: () => {
        toast.error('Failed to create guest');
      },
    });
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/guests"
          className="p-1.5 rounded-md hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold">New Guest</h1>
          <p className="text-sm text-muted-foreground">Add a new guest to the system</p>
        </div>
      </div>

      {/* Form card */}
      <div className="bg-card border border-border rounded-xl p-6">
        <GuestForm
          onSubmit={handleSubmit}
          isLoading={createGuest.isPending}
          submitLabel="Create Guest"
        />
        <div className="mt-4 pt-4 border-t border-border">
          <Link
            href="/guests"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md border border-border hover:bg-muted transition-colors"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}