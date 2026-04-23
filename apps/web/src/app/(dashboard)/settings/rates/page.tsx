'use client';

import React, { useState } from 'react';
import { ChevronRight, Plus, Pencil, Trash2, X, Check, Tag, Calendar } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

// ─── Types ───────────────────────────────────────────────────────────────────

interface RatePlan {
  id: string;
  name: string;
  code: string;
  description: string;
  baseMultiplier: number; // e.g. 1.0 = standard, 0.85 = 15% discount
  minStay: number;
  isActive: boolean;
  mealPlan: 'RO' | 'BB' | 'HB' | 'FB' | 'AI';
  cancellationPolicy: string;
}

const MEAL_PLAN_LABELS: Record<string, string> = {
  RO: 'Room Only',
  BB: 'Bed & Breakfast',
  HB: 'Half Board',
  FB: 'Full Board',
  AI: 'All Inclusive',
};

const DEFAULT_PLANS: RatePlan[] = [
  {
    id: '1',
    name: 'Best Available Rate',
    code: 'BAR',
    description: 'Standard flexible rate with free cancellation up to 24h before arrival.',
    baseMultiplier: 1.0,
    minStay: 1,
    isActive: true,
    mealPlan: 'RO',
    cancellationPolicy: 'Free cancellation up to 24 hours before check-in.',
  },
  {
    id: '2',
    name: 'Non-Refundable',
    code: 'NRF',
    description: 'Discounted rate with no cancellation or modification allowed.',
    baseMultiplier: 0.85,
    minStay: 1,
    isActive: true,
    mealPlan: 'RO',
    cancellationPolicy: 'Non-refundable. No cancellation or modification.',
  },
  {
    id: '3',
    name: 'Bed & Breakfast',
    code: 'BB',
    description: 'Includes daily breakfast for all guests.',
    baseMultiplier: 1.15,
    minStay: 1,
    isActive: true,
    mealPlan: 'BB',
    cancellationPolicy: 'Free cancellation up to 48 hours before check-in.',
  },
  {
    id: '4',
    name: 'Weekly Stay',
    code: 'WKL',
    description: 'Discounted rate for stays of 7 nights or more.',
    baseMultiplier: 0.9,
    minStay: 7,
    isActive: true,
    mealPlan: 'RO',
    cancellationPolicy: 'Free cancellation up to 72 hours before check-in.',
  },
];

const EMPTY_PLAN: Omit<RatePlan, 'id'> = {
  name: '',
  code: '',
  description: '',
  baseMultiplier: 1.0,
  minStay: 1,
  isActive: true,
  mealPlan: 'RO',
  cancellationPolicy: 'Free cancellation up to 24 hours before check-in.',
};

const inputClass =
  'w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 transition-all';

// ─── Modal ───────────────────────────────────────────────────────────────────

function RatePlanModal({
  plan,
  onClose,
  onSave,
}: {
  plan: Partial<RatePlan> | null;
  onClose: () => void;
  onSave: (p: Omit<RatePlan, 'id'>) => void;
}) {
  const [form, setForm] = useState<Omit<RatePlan, 'id'>>(
    plan ? { ...EMPTY_PLAN, ...plan } : { ...EMPTY_PLAN }
  );

  const set = (k: keyof typeof form, v: unknown) =>
    setForm((f) => ({ ...f, [k]: v }));

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
            {plan?.id ? 'Edit Rate Plan' : 'New Rate Plan'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Plan Name *</label>
              <input
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Best Available Rate"
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Code *</label>
              <input
                value={form.code}
                onChange={(e) => set('code', e.target.value.toUpperCase())}
                placeholder="BAR"
                maxLength={10}
                className={inputClass}
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={2}
              className={inputClass}
              placeholder="Brief description of this rate plan…"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Rate Multiplier
              </label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                max="5"
                value={form.baseMultiplier}
                onChange={(e) => set('baseMultiplier', parseFloat(e.target.value))}
                className={inputClass}
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                {form.baseMultiplier === 1 ? 'Standard rate' : form.baseMultiplier < 1
                  ? `${Math.round((1 - form.baseMultiplier) * 100)}% discount`
                  : `${Math.round((form.baseMultiplier - 1) * 100)}% premium`}
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Min Stay (nights)</label>
              <input
                type="number"
                min="1"
                value={form.minStay}
                onChange={(e) => set('minStay', parseInt(e.target.value))}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Meal Plan</label>
              <select
                value={form.mealPlan}
                onChange={(e) => set('mealPlan', e.target.value)}
                className={inputClass}
              >
                {Object.entries(MEAL_PLAN_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{k} – {v}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Cancellation Policy</label>
            <textarea
              value={form.cancellationPolicy}
              onChange={(e) => set('cancellationPolicy', e.target.value)}
              rows={2}
              className={inputClass}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={form.isActive}
              onChange={(e) => set('isActive', e.target.checked)}
              className="w-4 h-4 rounded border-border accent-gold-500"
            />
            <label htmlFor="isActive" className="text-sm text-foreground cursor-pointer">
              Active (available for booking)
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
              Save Rate Plan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function RatesPage() {
  const [plans, setPlans] = useState<RatePlan[]>(DEFAULT_PLANS);
  const [modal, setModal] = useState<{ open: boolean; plan: Partial<RatePlan> | null }>({
    open: false,
    plan: null,
  });

  const openNew = () => setModal({ open: true, plan: null });
  const openEdit = (p: RatePlan) => setModal({ open: true, plan: p });
  const closeModal = () => setModal({ open: false, plan: null });

  const handleSave = (form: Omit<RatePlan, 'id'>) => {
    if (modal.plan?.id) {
      setPlans((prev) =>
        prev.map((p) => (p.id === modal.plan!.id ? { ...form, id: modal.plan!.id! } : p))
      );
      toast.success('Rate plan updated');
    } else {
      setPlans((prev) => [...prev, { ...form, id: Date.now().toString() }]);
      toast.success('Rate plan created');
    }
    closeModal();
  };

  const handleDelete = (id: string) => {
    setPlans((prev) => prev.filter((p) => p.id !== id));
    toast.success('Rate plan deleted');
  };

  const toggleActive = (id: string) => {
    setPlans((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p))
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/settings" className="hover:text-foreground transition-colors">Settings</Link>
        <ChevronRight size={12} />
        <span className="text-foreground font-medium">Rate Plans</span>
      </nav>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gold-100 flex items-center justify-center">
            <Tag className="w-5 h-5 text-gold-600" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Rate Plans</h1>
            <p className="text-xs text-muted-foreground">{plans.length} plans configured</p>
          </div>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-1.5 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={15} /> New Plan
        </button>
      </div>

      <div className="space-y-3">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`bg-card rounded-xl border p-4 transition-colors ${
              plan.isActive ? 'border-border' : 'border-border/50 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-foreground">{plan.name}</span>
                  <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-muted rounded text-muted-foreground">
                    {plan.code}
                  </span>
                  <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${
                    plan.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {plan.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Tag size={11} />
                    {plan.baseMultiplier === 1
                      ? 'Standard rate'
                      : plan.baseMultiplier < 1
                      ? `${Math.round((1 - plan.baseMultiplier) * 100)}% discount`
                      : `${Math.round((plan.baseMultiplier - 1) * 100)}% premium`}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={11} />
                    Min {plan.minStay} night{plan.minStay !== 1 ? 's' : ''}
                  </span>
                  <span>{MEAL_PLAN_LABELS[plan.mealPlan]}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => toggleActive(plan.id)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  title={plan.isActive ? 'Deactivate' : 'Activate'}
                >
                  <Check size={14} className={plan.isActive ? 'text-green-500' : ''} />
                </button>
                <button
                  onClick={() => openEdit(plan)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(plan.id)}
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
        <RatePlanModal plan={modal.plan} onClose={closeModal} onSave={handleSave} />
      )}
    </div>
  );
}