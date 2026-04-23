'use client';

import React, { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Plus,
  Receipt,
  Sparkles,
  Trash2,
  WalletCards,
  X,
} from 'lucide-react';
import { FolioStatus, PaymentMethod } from '@Noblesse/shared';
import type { FolioDto, ReservationDto } from '@Noblesse/shared';
import { foliosApi } from '@/lib/api/folios.api';
import { reservationsApi } from '@/lib/api/reservations.api';
import { unwrapApiData } from '@/lib/api/response';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { toast } from 'sonner';

interface FolioItemRich {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  date: string;
  category?: string;
  isVoided: boolean;
  voidReason?: string;
  createdAt?: string;
}

interface PaymentRich {
  id: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
  isRefund: boolean;
  isVoided?: boolean;
  createdAt: string;
}

interface FolioRich extends Omit<FolioDto, 'items' | 'payments'> {
  notes?: string;
  items: FolioItemRich[];
  payments: PaymentRich[];
}

type LedgerEntry = {
  id: string;
  kind: 'charge' | 'payment';
  label: string;
  description?: string;
  date: string;
  amount: number;
  balanceAfter: number;
  isVoided?: boolean;
};

const CHARGE_TYPES = [
  { value: 'ROOM_CHARGE', label: 'Room charge', tone: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'EXTRA_GUEST', label: 'Extra guest', tone: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'FOOD', label: 'Food', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'BEVERAGE', label: 'Beverage', tone: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  { value: 'MINIBAR', label: 'Minibar', tone: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200' },
  { value: 'ROOM_SERVICE', label: 'Room service', tone: 'bg-purple-50 text-purple-700 border-purple-200' },
  { value: 'STAY_EXTENSION', label: 'Stay extension', tone: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { value: 'TAX', label: 'Tax', tone: 'bg-slate-50 text-slate-700 border-slate-200' },
  { value: 'SERVICE_FEE', label: 'Service fee', tone: 'bg-orange-50 text-orange-700 border-orange-200' },
  { value: 'CUSTOM', label: 'Custom extra', tone: 'bg-rose-50 text-rose-700 border-rose-200' },
];

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  [PaymentMethod.CASH]: 'Cash',
  [PaymentMethod.CREDIT_CARD]: 'Credit Card',
  [PaymentMethod.DEBIT_CARD]: 'Debit Card',
  [PaymentMethod.BANK_TRANSFER]: 'Bank Transfer',
  [PaymentMethod.ONLINE]: 'Online',
  [PaymentMethod.VOUCHER]: 'Voucher',
  [PaymentMethod.CITY_LEDGER]: 'City Ledger',
  [PaymentMethod.COMPLIMENTARY]: 'Complimentary',
};

function getChargeType(category?: string) {
  return CHARGE_TYPES.find((type) => type.value === category) ?? CHARGE_TYPES[9];
}

function getPaymentStatus(totalCharges: number, totalPaid: number, balanceDue: number) {
  if (totalCharges <= 0) return { label: 'No charges', className: 'bg-slate-100 text-slate-700' };
  if (balanceDue <= 0) return { label: 'Paid', className: 'bg-emerald-100 text-emerald-700' };
  if (totalPaid > 0) return { label: 'Partial', className: 'bg-amber-100 text-amber-800' };
  return { label: 'Unpaid', className: 'bg-rose-100 text-rose-700' };
}

function buildLedger(folio?: FolioRich): LedgerEntry[] {
  if (!folio) return [];

  const rawEntries = [
    ...folio.items.map((item) => ({
      id: item.id,
      kind: 'charge' as const,
      label: getChargeType(item.category).label,
      description: item.description,
      date: item.createdAt ?? item.date,
      amount: Number(item.totalPrice ?? 0),
      isVoided: item.isVoided,
    })),
    ...folio.payments.map((payment) => ({
      id: payment.id,
      kind: 'payment' as const,
      label: payment.isRefund ? 'Refund' : PAYMENT_METHOD_LABELS[payment.method] ?? payment.method,
      description: payment.reference ?? payment.notes,
      date: payment.createdAt,
      amount: payment.isRefund ? Number(payment.amount ?? 0) : -Number(payment.amount ?? 0),
      isVoided: payment.isVoided,
    })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let balance = 0;
  return rawEntries.map((entry) => {
    if (!entry.isVoided) balance += entry.amount;
    return { ...entry, balanceAfter: balance };
  });
}

function AddChargeModal({
  folioId,
  currentBalance,
  addedByName,
  onClose,
  onSuccess,
}: {
  folioId: string;
  currentBalance: number;
  addedByName: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    category: 'ROOM_CHARGE',
    description: '',
    quantity: 1,
    personCount: 1,
    guestName: '',
    entryTime: new Date().toTimeString().slice(0, 5),
    unitPrice: '',
    date: new Date().toISOString().split('T')[0],
  });

  const isExtraGuest = form.category === 'EXTRA_GUEST';
  const chargeUnits = isExtraGuest ? form.personCount : form.quantity;
  const chargeAmount = (parseFloat(form.unitPrice || '0') || 0) * chargeUnits;
  const chargeType = getChargeType(form.category);
  const finalDescription = isExtraGuest
    ? [
        `Extra guest: ${form.guestName.trim() || 'Unnamed guest'}`,
        `${form.personCount} guest${form.personCount === 1 ? '' : 's'}`,
        form.entryTime ? `Entry time: ${form.entryTime}` : undefined,
        form.description.trim() || undefined,
      ]
        .filter(Boolean)
        .join(' - ')
    : form.description;

  const mutation = useMutation({
    mutationFn: () =>
      foliosApi.addItem(folioId, {
        description: finalDescription,
        quantity: chargeUnits,
        unitPrice: parseFloat(form.unitPrice),
        date: form.date,
        category: form.category,
      }),
    onSuccess: () => {
      toast.success('Charge added');
      onSuccess();
      onClose();
    },
    onError: () => toast.error('Failed to add charge'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-[2rem] border border-amber-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 bg-gradient-to-br from-slate-950 to-amber-950 p-6 text-white">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">
              Folio charge
            </p>
            <h2 className="mt-2 text-2xl font-bold">Add Extra Charge</h2>
            <p className="mt-1 text-sm text-white/65">
              Room, minibar, food, service, tax, extension, and custom charges.
            </p>
          </div>
          <button onClick={onClose} className="rounded-full bg-white/10 p-2 hover:bg-white/20">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-5 p-6 md:grid-cols-[1fr_220px]">
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                Charge type
              </label>
              <div className="flex flex-wrap gap-2">
                {CHARGE_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, category: type.value }))}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-xs font-bold transition',
                      form.category === type.value
                        ? 'border-amber-500 bg-amber-500 text-white'
                        : type.tone,
                    )}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                {isExtraGuest ? 'Description / notes' : 'Description'}
              </label>
              <input
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                placeholder={
                  isExtraGuest
                    ? 'Optional note about this extra guest'
                    : 'e.g. Champagne minibar, room extension, extra guest fee'
                }
                className="w-full rounded-2xl border border-amber-200 px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
              />
            </div>

            {isExtraGuest && (
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                  Guest name
                </label>
                <input
                  value={form.guestName}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, guestName: event.target.value }))
                  }
                  placeholder="Name of the extra guest"
                  className="w-full rounded-2xl border border-amber-200 px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
                />
              </div>
            )}

            <div
              className={cn(
                'grid grid-cols-1 gap-3',
                isExtraGuest ? 'sm:grid-cols-2' : 'sm:grid-cols-3',
              )}
            >
              {isExtraGuest ? (
                <>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                      Person count
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={form.personCount}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          personCount: parseInt(event.target.value, 10) || 1,
                        }))
                      }
                      className="w-full rounded-2xl border border-amber-200 px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                      Amount per person
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={form.unitPrice}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, unitPrice: event.target.value }))
                      }
                      className="w-full rounded-2xl border border-amber-200 px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                      Entry time
                    </label>
                    <input
                      type="time"
                      value={form.entryTime}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, entryTime: event.target.value }))
                      }
                      className="w-full rounded-2xl border border-amber-200 px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                      Date
                    </label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, date: event.target.value }))
                      }
                      className="w-full rounded-2xl border border-amber-200 px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                      Amount
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={form.unitPrice}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, unitPrice: event.target.value }))
                      }
                      className="w-full rounded-2xl border border-amber-200 px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={form.quantity}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          quantity: parseInt(event.target.value, 10) || 1,
                        }))
                      }
                      className="w-full rounded-2xl border border-amber-200 px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                      Date
                    </label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, date: event.target.value }))
                      }
                      className="w-full rounded-2xl border border-amber-200 px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50/70 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-800">
              Preview
            </p>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Type</span>
                <span className="font-bold text-slate-950">{chargeType.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Added by</span>
                <span className="font-bold text-slate-950">{addedByName}</span>
              </div>
              {isExtraGuest && (
                <>
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">Guest</span>
                    <span className="text-right font-bold text-slate-950">
                      {form.guestName || 'Not entered'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Entry</span>
                    <span className="font-bold text-slate-950">{form.entryTime || 'Now'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">People</span>
                    <span className="font-bold text-slate-950">{form.personCount}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Charge</span>
                <span className="font-bold text-slate-950">{formatCurrency(chargeAmount)}</span>
              </div>
              <div className="border-t border-amber-200 pt-3">
                <span className="block text-slate-500">Balance after operation</span>
                <span className="mt-1 block text-2xl font-bold text-amber-700">
                  {formatCurrency(currentBalance + chargeAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-amber-200 p-6">
          <button
            onClick={onClose}
            className="rounded-2xl border border-amber-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-amber-50"
          >
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={
              mutation.isPending ||
              !form.unitPrice ||
              (!isExtraGuest && !form.description) ||
              (isExtraGuest && !form.guestName.trim())
            }
            className="rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg disabled:opacity-50"
          >
            {mutation.isPending ? 'Adding...' : 'Add Charge'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddPaymentModal({
  folioId,
  currentBalance,
  addedByName,
  onClose,
  onSuccess,
}: {
  folioId: string;
  currentBalance: number;
  addedByName: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    amount: currentBalance > 0 ? currentBalance.toFixed(2) : '',
    method: PaymentMethod.CREDIT_CARD,
    reference: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    isRefund: false,
  });

  const amount = parseFloat(form.amount || '0') || 0;
  const signedAmount = form.isRefund ? amount : -amount;
  const balanceAfter = currentBalance + signedAmount;

  const mutation = useMutation({
    mutationFn: () =>
      foliosApi.addPayment(folioId, {
        amount,
        method: form.method,
        reference: form.reference || undefined,
        notes: [form.description || undefined, `Added by: ${addedByName}`]
          .filter(Boolean)
          .join('\n'),
        date: form.date,
        isRefund: form.isRefund,
      }),
    onSuccess: () => {
      toast.success(form.isRefund ? 'Refund recorded' : 'Payment recorded');
      onSuccess();
      onClose();
    },
    onError: () => toast.error('Failed to record payment'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-[2rem] border border-amber-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 bg-gradient-to-br from-slate-950 to-amber-950 p-6 text-white">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">
              Payment entry
            </p>
            <h2 className="mt-2 text-2xl font-bold">
              {form.isRefund ? 'Record Refund' : 'Record Payment'}
            </h2>
            <p className="mt-1 text-sm text-white/65">
              Supports partial payments, references, notes, and running balance preview.
            </p>
          </div>
          <button onClick={onClose} className="rounded-full bg-white/10 p-2 hover:bg-white/20">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-5 p-6 md:grid-cols-[1fr_220px]">
          <div className="space-y-4">
            <label className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={form.isRefund}
                onChange={(event) =>
                  setForm((current) => ({ ...current, isRefund: event.target.checked }))
                }
              />
              This entry is a refund
            </label>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                  Amount
                </label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.amount}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, amount: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-amber-200 px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                  Payment type
                </label>
                <select
                  value={form.method}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      method: event.target.value as PaymentMethod,
                    }))
                  }
                  className="w-full rounded-2xl border border-amber-200 px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
                >
                  {Object.values(PaymentMethod).map((method) => (
                    <option key={method} value={method}>
                      {PAYMENT_METHOD_LABELS[method] ?? method}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                  Date
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, date: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-amber-200 px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                  Reference number
                </label>
                <input
                  value={form.reference}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, reference: event.target.value }))
                  }
                  placeholder="Optional transaction ID"
                  className="w-full rounded-2xl border border-amber-200 px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                Description / notes
              </label>
              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                rows={3}
                placeholder="Optional payment note"
                className="w-full resize-none rounded-2xl border border-amber-200 px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
              />
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50/70 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-800">
              Preview
            </p>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Added by</span>
                <span className="font-bold text-slate-950">{addedByName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Entry</span>
                <span className={cn('font-bold', form.isRefund ? 'text-orange-700' : 'text-emerald-700')}>
                  {form.isRefund ? '+' : '-'}
                  {formatCurrency(amount)}
                </span>
              </div>
              <div className="border-t border-amber-200 pt-3">
                <span className="block text-slate-500">Balance after operation</span>
                <span className="mt-1 block text-2xl font-bold text-amber-700">
                  {formatCurrency(balanceAfter)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-amber-200 p-6">
          <button
            onClick={onClose}
            className="rounded-2xl border border-amber-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-amber-50"
          >
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || amount <= 0}
            className="rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg disabled:opacity-50"
          >
            {mutation.isPending ? 'Saving...' : form.isRefund ? 'Record Refund' : 'Record Payment'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FolioPage() {
  const params = useParams();
  const router = useRouter();
  const reservationId = params.id as string;
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const addedByName = user ? `${user.firstName} ${user.lastName}` : 'Current user';

  const [showAddCharge, setShowAddCharge] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [voidItemId, setVoidItemId] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState('');

  const { data: reservation } = useQuery({
    queryKey: ['reservation', reservationId],
    queryFn: () => reservationsApi.getOne(reservationId),
    select: (res) => unwrapApiData<ReservationDto>(res),
  });

  const { data: folios, isLoading } = useQuery({
    queryKey: ['folios', reservationId],
    queryFn: () => foliosApi.getByReservation(reservationId),
    select: (res) => unwrapApiData<FolioRich[]>(res),
  });

  const folio = folios?.[0];
  const activeItems = (folio?.items ?? []).filter((item) => !item.isVoided);
  const activePayments = (folio?.payments ?? []).filter((payment) => !payment.isVoided);
  const totalCharges = folio?.totalCharges ?? activeItems.reduce((sum, item) => sum + Number(item.totalPrice), 0);
  const totalPaid =
    folio?.totalPayments ??
    activePayments.reduce(
      (sum, payment) =>
        payment.isRefund ? sum - Number(payment.amount) : sum + Number(payment.amount),
      0,
    );
  const balanceDue = folio?.balance ?? totalCharges - totalPaid;
  const paymentStatus = getPaymentStatus(totalCharges, totalPaid, balanceDue);
  const ledger = useMemo(() => buildLedger(folio), [folio]);

  const invalidateFolios = () => {
    queryClient.invalidateQueries({ queryKey: ['folios', reservationId] });
    queryClient.invalidateQueries({ queryKey: ['reservation', reservationId] });
  };

  const createFolioMutation = useMutation({
    mutationFn: () => foliosApi.createForReservation(reservationId),
    onSuccess: () => {
      toast.success('Folio created');
      invalidateFolios();
    },
    onError: () => toast.error('Failed to create folio'),
  });

  const voidItemMutation = useMutation({
    mutationFn: ({ itemId, reason }: { itemId: string; reason: string }) =>
      foliosApi.voidItem(folio!.id, itemId, reason),
    onSuccess: () => {
      toast.success('Charge voided');
      setVoidItemId(null);
      setVoidReason('');
      invalidateFolios();
    },
    onError: () => toast.error('Failed to void charge'),
  });

  const voidPaymentMutation = useMutation({
    mutationFn: (paymentId: string) => foliosApi.voidPayment(folio!.id, paymentId),
    onSuccess: () => {
      toast.success('Payment voided');
      invalidateFolios();
    },
    onError: () => toast.error('Failed to void payment'),
  });

  const closeFolioMutation = useMutation({
    mutationFn: () => foliosApi.close(folio!.id),
    onSuccess: () => {
      toast.success('Folio closed');
      invalidateFolios();
    },
    onError: () => toast.error('Failed to close folio'),
  });

  if (isLoading) {
    return (
      <div className="space-y-5 p-6">
        <div className="h-32 rounded-[2rem] bg-amber-50 animate-pulse" />
        <div className="h-96 rounded-[2rem] bg-amber-50 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-gradient-to-br from-white via-amber-50/40 to-white p-4 sm:p-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-amber-200 bg-white p-6 shadow-[0_24px_80px_rgba(146,106,30,0.13)]">
        <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-amber-200/40 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="rounded-2xl border border-amber-200 bg-white/80 p-3 text-amber-700 shadow-sm transition hover:bg-amber-50"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-amber-800">
                <Receipt className="h-3.5 w-3.5" />
                Guest account
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950 font-display">
                Folio & Payments
              </h1>
              {reservation && (
                <p className="mt-1 text-sm text-slate-600">
                  Reservation{' '}
                  <Link
                    href={`/reservations/${reservationId}`}
                    className="font-mono font-semibold text-amber-700 hover:underline"
                  >
                    {reservation.confirmationNumber}
                  </Link>
                  {reservation.primaryGuest
                    ? ` - ${reservation.primaryGuest.firstName} ${reservation.primaryGuest.lastName}`
                    : ''}
                </p>
              )}
            </div>
          </div>

          {folio && (
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn('rounded-full px-3 py-1.5 text-xs font-bold', paymentStatus.className)}>
                {paymentStatus.label}
              </span>
              <span
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs font-bold',
                  folio.status === FolioStatus.OPEN
                    ? 'bg-blue-100 text-blue-700'
                    : folio.status === FolioStatus.CLOSED
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-rose-100 text-rose-700',
                )}
              >
                {folio.status}
              </span>
            </div>
          )}
        </div>
      </section>

      {!folio ? (
        <div className="rounded-[2rem] border border-dashed border-amber-300 bg-white p-12 text-center shadow-sm">
          <Receipt className="mx-auto mb-4 h-14 w-14 text-amber-500" />
          <h2 className="text-2xl font-bold text-slate-950">No folio exists yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Create a guest folio to post room charges, extras, minibar, room service, taxes,
            and partial payments.
          </p>
          <button
            onClick={() => createFolioMutation.mutate()}
            disabled={createFolioMutation.isPending}
            className="mt-6 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-600 px-6 py-3 text-sm font-bold text-white shadow-lg disabled:opacity-50"
          >
            {createFolioMutation.isPending ? 'Creating...' : 'Create Folio'}
          </button>
        </div>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {[
              { label: 'Total Charges', value: formatCurrency(totalCharges), icon: Receipt, color: 'text-blue-700' },
              { label: 'Paid', value: formatCurrency(totalPaid), icon: CheckCircle2, color: 'text-emerald-700' },
              { label: 'Remaining Balance', value: formatCurrency(balanceDue), icon: DollarSign, color: balanceDue > 0 ? 'text-rose-700' : 'text-emerald-700' },
              { label: 'Payments', value: activePayments.length, icon: WalletCards, color: 'text-amber-700' },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="rounded-[1.5rem] border border-amber-200 bg-white p-5 shadow-sm">
                  <Icon className={cn('mb-4 h-5 w-5', card.color)} />
                  <p className="text-2xl font-bold text-slate-950">{card.value}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {card.label}
                  </p>
                </div>
              );
            })}
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
            <div className="space-y-6">
              <div className="rounded-[2rem] border border-amber-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-950">Folio Line Items</h2>
                    <p className="text-sm text-slate-500">
                      Room charges, extras, food, beverage, service fees, taxes, and custom items.
                    </p>
                  </div>
                  {folio.status === FolioStatus.OPEN && (
                    <button
                      onClick={() => setShowAddCharge(true)}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-amber-700"
                    >
                      <Plus className="h-4 w-4" />
                      Add Charge
                    </button>
                  )}
                </div>

                {folio.items.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-amber-200 bg-amber-50/50 p-10 text-center">
                    <Sparkles className="mx-auto mb-3 h-10 w-10 text-amber-500" />
                    <p className="font-semibold text-slate-950">No charges posted yet</p>
                    <p className="mt-1 text-sm text-slate-500">Start with a room charge or custom extra.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                    {folio.items.map((item) => {
                      const type = getChargeType(item.category);
                      return (
                        <div
                          key={item.id}
                          className={cn(
                            'rounded-[1.5rem] border bg-white p-4 shadow-sm transition hover:border-amber-300',
                            item.isVoided ? 'border-slate-200 opacity-55' : 'border-amber-200',
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <span className={cn('inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold', type.tone)}>
                                {type.label}
                              </span>
                              <h3 className={cn('mt-3 font-bold text-slate-950', item.isVoided && 'line-through')}>
                                {item.description}
                              </h3>
                              <p className="mt-1 text-xs text-slate-500">
                                {formatDate(item.date)} - Qty {Number(item.quantity)}
                              </p>
                              {item.isVoided && item.voidReason && (
                                <p className="mt-2 text-xs text-rose-600">Voided: {item.voidReason}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-slate-950">
                                {formatCurrency(Number(item.totalPrice))}
                              </p>
                              <p className="text-xs text-slate-500">
                                {formatCurrency(Number(item.unitPrice))} each
                              </p>
                            </div>
                          </div>
                          {folio.status === FolioStatus.OPEN && !item.isVoided && (
                            <button
                              onClick={() => setVoidItemId(item.id)}
                              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Void charge
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="rounded-[2rem] border border-amber-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-950">Payment History</h2>
                    <p className="text-sm text-slate-500">
                      Partial payments, refunds, references, and payment notes.
                    </p>
                  </div>
                  {folio.status === FolioStatus.OPEN && (
                    <button
                      onClick={() => setShowAddPayment(true)}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg"
                    >
                      <CreditCard className="h-4 w-4" />
                      Record Payment
                    </button>
                  )}
                </div>

                {folio.payments.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-amber-200 bg-amber-50/50 p-10 text-center">
                    <CreditCard className="mx-auto mb-3 h-10 w-10 text-amber-500" />
                    <p className="font-semibold text-slate-950">No payments recorded</p>
                    <p className="mt-1 text-sm text-slate-500">Post a deposit or partial payment.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {folio.payments.map((payment) => (
                      <div
                        key={payment.id}
                        className={cn(
                          'flex flex-col gap-3 rounded-[1.5rem] border border-amber-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between',
                          payment.isVoided && 'opacity-55',
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'rounded-2xl p-3 text-white',
                              payment.isRefund ? 'bg-orange-500' : 'bg-emerald-600',
                            )}
                          >
                            <CreditCard className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-950">
                              {payment.isRefund ? 'Refund' : PAYMENT_METHOD_LABELS[payment.method] ?? payment.method}
                            </p>
                            <p className="text-xs text-slate-500">
                              {formatDate(payment.createdAt)}
                              {payment.reference ? ` - Ref ${payment.reference}` : ''}
                            </p>
                            {payment.notes && (
                              <p className="mt-1 whitespace-pre-line text-xs text-slate-500">
                                {payment.notes}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={cn(
                              'text-lg font-bold',
                              payment.isRefund ? 'text-orange-600' : 'text-emerald-700',
                            )}
                          >
                            {payment.isRefund ? '+' : '-'}
                            {formatCurrency(Number(payment.amount))}
                          </p>
                          {folio.status === FolioStatus.OPEN && !payment.isVoided && (
                            <button
                              onClick={() => voidPaymentMutation.mutate(payment.id)}
                              disabled={voidPaymentMutation.isPending}
                              className="mt-1 text-xs font-bold text-rose-600 hover:underline"
                            >
                              Void payment
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <aside className="space-y-6">
              <div className="rounded-[2rem] border border-amber-200 bg-slate-950 p-5 text-white shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">
                  Account balance
                </p>
                <p className="mt-4 text-4xl font-bold">{formatCurrency(balanceDue)}</p>
                <p className="mt-2 text-sm text-white/60">
                  {balanceDue > 0 ? 'Remaining guest balance' : 'Folio is settled or in credit'}
                </p>
                {folio.status === FolioStatus.OPEN && balanceDue <= 0 && (
                  <button
                    onClick={() => closeFolioMutation.mutate()}
                    disabled={closeFolioMutation.isPending}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {closeFolioMutation.isPending ? 'Closing...' : 'Close Folio'}
                  </button>
                )}
              </div>

              <div className="rounded-[2rem] border border-amber-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-bold text-slate-950">Running Ledger</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Balance after each charge or payment operation.
                </p>
                <div className="mt-5 space-y-3">
                  {ledger.length === 0 ? (
                    <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                      Ledger entries will appear after charges or payments are posted.
                    </p>
                  ) : (
                    ledger.map((entry) => (
                      <div key={`${entry.kind}-${entry.id}`} className="rounded-2xl bg-slate-50 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold text-slate-950">{entry.label}</p>
                            <p className="text-xs text-slate-500">{formatDate(entry.date)}</p>
                          </div>
                          <p
                            className={cn(
                              'font-bold',
                              entry.amount >= 0 ? 'text-slate-950' : 'text-emerald-700',
                            )}
                          >
                            {entry.amount < 0 ? '-' : '+'}
                            {formatCurrency(Math.abs(entry.amount))}
                          </p>
                        </div>
                        <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-xs">
                          <span className="text-slate-500">Balance after</span>
                          <span className="font-bold text-slate-950">
                            {formatCurrency(entry.balanceAfter)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {balanceDue > 0 && folio.status === FolioStatus.OPEN && (
                <div className="flex gap-3 rounded-[1.5rem] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-bold">Outstanding balance</p>
                    <p className="mt-1">
                      Record a payment before closing this folio. Remaining:{' '}
                      <strong>{formatCurrency(balanceDue)}</strong>
                    </p>
                  </div>
                </div>
              )}
            </aside>
          </section>
        </>
      )}

      {showAddCharge && folio && (
        <AddChargeModal
          folioId={folio.id}
          currentBalance={balanceDue}
          addedByName={addedByName}
          onClose={() => setShowAddCharge(false)}
          onSuccess={invalidateFolios}
        />
      )}

      {showAddPayment && folio && (
        <AddPaymentModal
          folioId={folio.id}
          currentBalance={balanceDue}
          addedByName={addedByName}
          onClose={() => setShowAddPayment(false)}
          onSuccess={invalidateFolios}
        />
      )}

      {voidItemId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] border border-amber-200 bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-slate-950">Void Charge</h2>
            <p className="mt-2 text-sm text-slate-500">
              Provide a reason so the folio audit trail stays clear.
            </p>
            <input
              value={voidReason}
              onChange={(event) => setVoidReason(event.target.value)}
              placeholder="Reason required"
              className="mt-5 w-full rounded-2xl border border-amber-200 px-4 py-3 text-sm outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
            />
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setVoidItemId(null);
                  setVoidReason('');
                }}
                className="rounded-2xl border border-amber-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-amber-50"
              >
                Cancel
              </button>
              <button
                onClick={() => voidItemMutation.mutate({ itemId: voidItemId, reason: voidReason })}
                disabled={voidItemMutation.isPending || !voidReason.trim()}
                className="rounded-2xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                {voidItemMutation.isPending ? 'Voiding...' : 'Void Charge'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
