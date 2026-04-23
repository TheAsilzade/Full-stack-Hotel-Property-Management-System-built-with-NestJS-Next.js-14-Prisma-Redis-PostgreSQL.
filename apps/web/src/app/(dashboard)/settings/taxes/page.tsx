'use client';

import React, { useState } from 'react';
import { ChevronRight, Plus, Pencil, Trash2, X, Percent, Info } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

// ─── Types ───────────────────────────────────────────────────────────────────

type TaxType = 'PERCENTAGE' | 'FIXED';
type AppliesTo = 'ALL' | 'ROOM' | 'FOOD_BEVERAGE' | 'SPA' | 'LAUNDRY' | 'TRANSPORT' | 'MISC';

interface TaxConfig {
  id: string;
  name: string;
  code: string;
  type: TaxType;
  rate: number; // percentage or fixed amount
  appliesTo: AppliesTo[];
  isInclusive: boolean; // included in price vs added on top
  isActive: boolean;
  description: string;
}

const APPLIES_TO_LABELS: Record<AppliesTo, string> = {
  ALL: 'All Charges',
  ROOM: 'Room',
  FOOD_BEVERAGE: 'Food & Beverage',
  SPA: 'Spa',
  LAUNDRY: 'Laundry',
  TRANSPORT: 'Transport',
  MISC: 'Miscellaneous',
};

const DEFAULT_TAXES: TaxConfig[] = [
  {
    id: '1',
    name: 'Value Added Tax',
    code: 'VAT',
    type: 'PERCENTAGE',
    rate: 18,
    appliesTo: ['ALL'],
    isInclusive: false,
    isActive: true,
    description: 'Standard VAT applied to all charges.',
  },
  {
    id: '2',
    name: 'City Tax',
    code: 'CITY',
    type: 'FIXED',
    rate: 5,
    appliesTo: ['ROOM'],
    isInclusive: false,
    isActive: true,
    description: 'Per-night city tax applied to room charges.',
  },
  {
    id: '3',
    name: 'Service Charge',
    code: 'SVC',
    type: 'PERCENTAGE',
    rate: 10,
    appliesTo: ['FOOD_BEVERAGE', 'SPA'],
    isInclusive: true,
    isActive: true,
    description: 'Service charge included in F&B and Spa prices.',
  },
];

const EMPTY_TAX: Omit<TaxConfig, 'id'> = {
  name: '',
  code: '',
  type: 'PERCENTAGE',
  rate: 0,
  appliesTo: ['ALL'],
  isInclusive: false,
  isActive: true,
  description: '',
};

const inputClass =
  'w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 transition-all';

// ─── Modal ───────────────────────────────────────────────────────────────────

function TaxModal({
  tax,
  onClose,
  onSave,
}: {
  tax: Partial<TaxConfig> | null;
  onClose: () => void;
  onSave: (t: Omit<TaxConfig, 'id'>) => void;
}) {
  const [form, setForm] = useState<Omit<TaxConfig, 'id'>>(
    tax ? { ...EMPTY_TAX, ...tax } : { ...EMPTY_TAX }
  );

  const set = (k: keyof typeof form, v: unknown) =>
    setForm((f) => ({ ...f, [k]: v }));

  const toggleAppliesTo = (cat: AppliesTo) => {
    if (cat === 'ALL') {
      set('appliesTo', ['ALL']);
      return;
    }
    setForm((f) => {
      const current = f.appliesTo.filter((c) => c !== 'ALL');
      if (current.includes(cat)) {
        const next = current.filter((c) => c !== cat);
        return { ...f, appliesTo: next.length === 0 ? ['ALL'] : next };
      }
      return { ...f, appliesTo: [...current, cat] };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim()) {
      toast.error('Name and code are required');
      return;
    }
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">
            {tax?.id ? 'Edit Tax / Fee' : 'New Tax / Fee'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Name *</label>
              <input
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Value Added Tax"
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Code *</label>
              <input
                value={form.code}
                onChange={(e) => set('code', e.target.value.toUpperCase())}
                placeholder="VAT"
                maxLength={10}
                className={inputClass}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Type</label>
              <select
                value={form.type}
                onChange={(e) => set('type', e.target.value)}
                className={inputClass}
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Rate {form.type === 'PERCENTAGE' ? '(%)' : '(amount)'}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.rate}
                onChange={(e) => set('rate', parseFloat(e.target.value))}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2">Applies To</label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(APPLIES_TO_LABELS) as AppliesTo[]).map((cat) => {
                const selected =
                  form.appliesTo.includes('ALL') ? cat === 'ALL' : form.appliesTo.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleAppliesTo(cat)}
                    className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                      selected
                        ? 'bg-gold-500 text-white border-gold-500'
                        : 'border-border text-muted-foreground hover:border-gold-300'
                    }`}
                  >
                    {APPLIES_TO_LABELS[cat]}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Description</label>
            <input
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Brief description…"
              className={inputClass}
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isInclusive}
                onChange={(e) => set('isInclusive', e.target.checked)}
                className="w-4 h-4 rounded border-border accent-gold-500"
              />
              <span className="text-sm text-foreground">Tax-inclusive (included in price)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => set('isActive', e.target.checked)}
                className="w-4 h-4 rounded border-border accent-gold-500"
              />
              <span className="text-sm text-foreground">Active</span>
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Save Tax
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function TaxesPage() {
  const [taxes, setTaxes] = useState<TaxConfig[]>(DEFAULT_TAXES);
  const [modal, setModal] = useState<{ open: boolean; tax: Partial<TaxConfig> | null }>({
    open: false,
    tax: null,
  });

  const openNew = () => setModal({ open: true, tax: null });
  const openEdit = (t: TaxConfig) => setModal({ open: true, tax: t });
  const closeModal = () => setModal({ open: false, tax: null });

  const handleSave = (form: Omit<TaxConfig, 'id'>) => {
    if (modal.tax?.id) {
      setTaxes((prev) =>
        prev.map((t) => (t.id === modal.tax!.id ? { ...form, id: modal.tax!.id! } : t))
      );
      toast.success('Tax updated');
    } else {
      setTaxes((prev) => [...prev, { ...form, id: Date.now().toString() }]);
      toast.success('Tax created');
    }
    closeModal();
  };

  const handleDelete = (id: string) => {
    setTaxes((prev) => prev.filter((t) => t.id !== id));
    toast.success('Tax deleted');
  };

  const totalEffective = taxes
    .filter((t) => t.isActive && !t.isInclusive && t.type === 'PERCENTAGE' && t.appliesTo.includes('ALL'))
    .reduce((sum, t) => sum + t.rate, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/settings" className="hover:text-foreground transition-colors">Settings</Link>
        <ChevronRight size={12} />
        <span className="text-foreground font-medium">Taxes & Fees</span>
      </nav>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center">
            <Percent className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Taxes & Fees</h1>
            <p className="text-xs text-muted-foreground">{taxes.filter((t) => t.isActive).length} active taxes</p>
          </div>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-1.5 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={15} /> New Tax
        </button>
      </div>

      {totalEffective > 0 && (
        <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          <Info size={16} className="shrink-0 mt-0.5" />
          <p>
            Total effective tax on all charges: <strong>{totalEffective}%</strong> (exclusive taxes only).
          </p>
        </div>
      )}

      <div className="space-y-3">
        {taxes.map((tax) => (
          <div
            key={tax.id}
            className={`bg-card rounded-xl border p-4 transition-colors ${
              tax.isActive ? 'border-border' : 'border-border/50 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-foreground">{tax.name}</span>
                  <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-muted rounded text-muted-foreground">
                    {tax.code}
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-orange-100 text-orange-700">
                    {tax.type === 'PERCENTAGE' ? `${tax.rate}%` : `${tax.rate} (fixed)`}
                  </span>
                  {tax.isInclusive && (
                    <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-blue-100 text-blue-700">
                      Inclusive
                    </span>
                  )}
                  <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${
                    tax.isActive ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'
                  }`}>
                    {tax.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {tax.description && (
                  <p className="text-xs text-muted-foreground mt-1">{tax.description}</p>
                )}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {tax.appliesTo.map((cat) => (
                    <span
                      key={cat}
                      className="px-2 py-0.5 text-[10px] bg-muted rounded-full text-muted-foreground"
                    >
                      {APPLIES_TO_LABELS[cat]}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => openEdit(tax)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(tax.id)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modal.open && (
        <TaxModal tax={modal.tax} onClose={closeModal} onSave={handleSave} />
      )}
    </div>
  );
}