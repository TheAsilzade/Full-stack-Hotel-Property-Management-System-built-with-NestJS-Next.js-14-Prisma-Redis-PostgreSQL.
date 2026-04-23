'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { GuestDto, GenderType } from '@Noblesse/shared';
import { Loader2 } from 'lucide-react';

const COUNTRIES: { code: string; name: string }[] = [
  { code: 'AF', name: 'Afghanistan' }, { code: 'AL', name: 'Albania' }, { code: 'DZ', name: 'Algeria' },
  { code: 'AR', name: 'Argentina' }, { code: 'AU', name: 'Australia' }, { code: 'AT', name: 'Austria' },
  { code: 'AZ', name: 'Azerbaijan' }, { code: 'BH', name: 'Bahrain' }, { code: 'BD', name: 'Bangladesh' },
  { code: 'BE', name: 'Belgium' }, { code: 'BR', name: 'Brazil' }, { code: 'BG', name: 'Bulgaria' },
  { code: 'CA', name: 'Canada' }, { code: 'CL', name: 'Chile' }, { code: 'CN', name: 'China' },
  { code: 'CO', name: 'Colombia' }, { code: 'HR', name: 'Croatia' }, { code: 'CZ', name: 'Czech Republic' },
  { code: 'DK', name: 'Denmark' }, { code: 'EG', name: 'Egypt' }, { code: 'EE', name: 'Estonia' },
  { code: 'ET', name: 'Ethiopia' }, { code: 'FI', name: 'Finland' }, { code: 'FR', name: 'France' },
  { code: 'GE', name: 'Georgia' }, { code: 'DE', name: 'Germany' }, { code: 'GH', name: 'Ghana' },
  { code: 'GR', name: 'Greece' }, { code: 'HU', name: 'Hungary' }, { code: 'IN', name: 'India' },
  { code: 'ID', name: 'Indonesia' }, { code: 'IR', name: 'Iran' }, { code: 'IQ', name: 'Iraq' },
  { code: 'IE', name: 'Ireland' }, { code: 'IL', name: 'Israel' }, { code: 'IT', name: 'Italy' },
  { code: 'JP', name: 'Japan' }, { code: 'JO', name: 'Jordan' }, { code: 'KZ', name: 'Kazakhstan' },
  { code: 'KE', name: 'Kenya' }, { code: 'KW', name: 'Kuwait' }, { code: 'LV', name: 'Latvia' },
  { code: 'LB', name: 'Lebanon' }, { code: 'LT', name: 'Lithuania' }, { code: 'MY', name: 'Malaysia' },
  { code: 'MX', name: 'Mexico' }, { code: 'MA', name: 'Morocco' }, { code: 'NL', name: 'Netherlands' },
  { code: 'NZ', name: 'New Zealand' }, { code: 'NG', name: 'Nigeria' }, { code: 'NO', name: 'Norway' },
  { code: 'OM', name: 'Oman' }, { code: 'PK', name: 'Pakistan' }, { code: 'PH', name: 'Philippines' },
  { code: 'PL', name: 'Poland' }, { code: 'PT', name: 'Portugal' }, { code: 'QA', name: 'Qatar' },
  { code: 'RO', name: 'Romania' }, { code: 'RU', name: 'Russia' }, { code: 'SA', name: 'Saudi Arabia' },
  { code: 'RS', name: 'Serbia' }, { code: 'SG', name: 'Singapore' }, { code: 'SK', name: 'Slovakia' },
  { code: 'SI', name: 'Slovenia' }, { code: 'ZA', name: 'South Africa' }, { code: 'KR', name: 'South Korea' },
  { code: 'ES', name: 'Spain' }, { code: 'SE', name: 'Sweden' }, { code: 'CH', name: 'Switzerland' },
  { code: 'SY', name: 'Syria' }, { code: 'TW', name: 'Taiwan' }, { code: 'TH', name: 'Thailand' },
  { code: 'TN', name: 'Tunisia' }, { code: 'TR', name: 'Turkey' }, { code: 'UA', name: 'Ukraine' },
  { code: 'AE', name: 'United Arab Emirates' }, { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' }, { code: 'UZ', name: 'Uzbekistan' },
  { code: 'VE', name: 'Venezuela' }, { code: 'VN', name: 'Vietnam' },
  { code: 'YE', name: 'Yemen' }, { code: 'ZW', name: 'Zimbabwe' },
];

const guestSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  nationality: z.string().optional(),
  gender: z.nativeEnum(GenderType).optional(),
  dateOfBirth: z.string().optional(),
  idType: z.string().optional(),
  idNumber: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  notes: z.string().optional(),
});

export type GuestFormData = z.infer<typeof guestSchema>;

interface GuestFormProps {
  defaultValues?: Partial<GuestDto>;
  onSubmit: (data: GuestFormData) => void;
  isLoading?: boolean;
  submitLabel?: string;
}

export function GuestForm({ defaultValues, onSubmit, isLoading, submitLabel = 'Save Guest' }: GuestFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GuestFormData>({
    resolver: zodResolver(guestSchema),
    defaultValues: {
      firstName: defaultValues?.firstName ?? '',
      lastName: defaultValues?.lastName ?? '',
      email: defaultValues?.email ?? '',
      phone: defaultValues?.phone ?? '',
      nationality: defaultValues?.nationality ?? '',
      gender: defaultValues?.gender as GenderType | undefined,
      dateOfBirth: defaultValues?.dateOfBirth ?? '',
      idType: defaultValues?.idType ?? '',
      idNumber: defaultValues?.idNumber ?? '',
      address: defaultValues?.address ?? '',
      city: defaultValues?.city ?? '',
      country: defaultValues?.country ?? '',
      notes: defaultValues?.notes ?? '',
    },
  });

  const inputClass = 'w-full px-3 py-2 text-sm border border-charcoal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent bg-white';
  const labelClass = 'block text-xs font-medium text-charcoal-700 mb-1';
  const errorClass = 'text-xs text-red-600 mt-1';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Personal Information */}
      <div>
        <h3 className="text-sm font-semibold text-charcoal-900 mb-4 pb-2 border-b border-charcoal-200">
          Personal Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>First Name *</label>
            <input {...register('firstName')} className={inputClass} placeholder="John" />
            {errors.firstName && <p className={errorClass}>{errors.firstName.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Last Name *</label>
            <input {...register('lastName')} className={inputClass} placeholder="Doe" />
            {errors.lastName && <p className={errorClass}>{errors.lastName.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input {...register('email')} type="email" className={inputClass} placeholder="john@example.com" />
            {errors.email && <p className={errorClass}>{errors.email.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input {...register('phone')} className={inputClass} placeholder="+1 234 567 8900" />
          </div>
          <div>
            <label className={labelClass}>Gender</label>
            <select {...register('gender')} className={inputClass}>
              <option value="">Select gender</option>
              <option value={GenderType.MALE}>Male</option>
              <option value={GenderType.FEMALE}>Female</option>
              <option value={GenderType.OTHER}>Other</option>
              <option value={GenderType.PREFER_NOT_TO_SAY}>Prefer not to say</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Date of Birth</label>
            <input {...register('dateOfBirth')} type="date" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Nationality</label>
            <select {...register('nationality')} className={inputClass}>
              <option value="">Select nationality</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Identity */}
      <div>
        <h3 className="text-sm font-semibold text-charcoal-900 mb-4 pb-2 border-b border-charcoal-200">
          Identity Document
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>ID Type</label>
            <select {...register('idType')} className={inputClass}>
              <option value="">Select type</option>
              <option value="PASSPORT">Passport</option>
              <option value="NATIONAL_ID">National ID</option>
              <option value="DRIVERS_LICENSE">Driver's License</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>ID Number</label>
            <input {...register('idNumber')} className={inputClass} placeholder="AB123456" />
          </div>
        </div>
      </div>

      {/* Address */}
      <div>
        <h3 className="text-sm font-semibold text-charcoal-900 mb-4 pb-2 border-b border-charcoal-200">
          Address
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelClass}>Street Address</label>
            <input {...register('address')} className={inputClass} placeholder="123 Main Street" />
          </div>
          <div>
            <label className={labelClass}>City</label>
            <input {...register('city')} className={inputClass} placeholder="New York" />
          </div>
          <div>
            <label className={labelClass}>Country</label>
            <select {...register('country')} className={inputClass}>
              <option value="">Select country</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <h3 className="text-sm font-semibold text-charcoal-900 mb-4 pb-2 border-b border-charcoal-200">
          Notes
        </h3>
        <textarea
          {...register('notes')}
          rows={3}
          className={inputClass}
          placeholder="Special requests, preferences, or other notes..."
        />
      </div>

      {/* Submit */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-2.5 bg-gold-500 hover:bg-gold-600 text-white font-medium text-sm rounded-lg transition-colors disabled:opacity-50"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}