'use client';

import React from 'react';
import Link from 'next/link';
import { GuestDto } from '@Noblesse/shared';
import { Star, Phone, Mail, MapPin, Calendar } from 'lucide-react';
import { getInitials, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface GuestCardProps {
  guest: GuestDto;
  className?: string;
}

export function GuestCard({ guest, className }: GuestCardProps) {
  const isVip = guest.totalStays >= 5;

  return (
    <Link
      href={`/guests/${guest.id}`}
      className={cn(
        'block bg-white rounded-xl border border-charcoal-200 p-5 hover:border-gold-300 hover:shadow-sm transition-all',
        className
      )}
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-gold-100 flex items-center justify-center flex-shrink-0">
          <span className="text-gold-700 font-semibold text-sm">
            {getInitials(guest.firstName, guest.lastName)}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-charcoal-900 truncate">
              {guest.fullName}
            </h3>
            {isVip && (
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-gold-100 text-gold-700 text-xs font-medium rounded-full flex-shrink-0">
                <Star className="w-3 h-3 fill-current" />
                VIP
              </span>
            )}
          </div>

          <div className="space-y-1">
            {guest.email && (
              <div className="flex items-center gap-1.5 text-xs text-charcoal-500">
                <Mail className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{guest.email}</span>
              </div>
            )}
            {guest.phone && (
              <div className="flex items-center gap-1.5 text-xs text-charcoal-500">
                <Phone className="w-3 h-3 flex-shrink-0" />
                <span>{guest.phone}</span>
              </div>
            )}
            {guest.nationality && (
              <div className="flex items-center gap-1.5 text-xs text-charcoal-500">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span>{guest.nationality}</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="text-right flex-shrink-0">
          <div className="flex items-center gap-1 text-xs text-charcoal-500 justify-end mb-1">
            <Calendar className="w-3 h-3" />
            <span>{guest.totalStays} stay{guest.totalStays !== 1 ? 's' : ''}</span>
          </div>
          <p className="text-xs text-charcoal-400">
            Since {formatDate(guest.createdAt)}
          </p>
        </div>
      </div>
    </Link>
  );
}