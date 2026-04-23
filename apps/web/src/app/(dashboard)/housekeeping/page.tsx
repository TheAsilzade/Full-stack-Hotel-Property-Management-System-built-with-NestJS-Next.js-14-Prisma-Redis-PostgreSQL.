'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { housekeepingApi } from '@/lib/api/housekeeping.api';
import { unwrapApiData } from '@/lib/api/response';
import { HousekeepingStatus } from '@Noblesse/shared';
import type { HousekeepingTaskDto, RoomDto } from '@Noblesse/shared';
import { Sparkles, Play, CheckCircle2, ShieldCheck, Plus, X, SkipForward, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatDate } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { useRooms } from '@/lib/hooks/useRooms';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  [HousekeepingStatus.PENDING]: { label: 'Pending', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  [HousekeepingStatus.IN_PROGRESS]: {
    label: 'In Progress',
    color: 'text-blue-700',
    bg: 'bg-blue-100',
  },
  [HousekeepingStatus.COMPLETED]: {
    label: 'Completed',
    color: 'text-green-700',
    bg: 'bg-green-100',
  },
  [HousekeepingStatus.VERIFIED]: {
    label: 'Verified',
    color: 'text-purple-700',
    bg: 'bg-purple-100',
  },
  [HousekeepingStatus.SKIPPED]: { label: 'Skipped', color: 'text-gray-600', bg: 'bg-gray-100' },
};

const TASK_TYPES = ['FULL_CLEAN', 'TURNDOWN', 'TOUCH_UP', 'DEEP_CLEAN', 'INSPECTION', 'LINEN_CHANGE'];

interface CreateTaskForm {
  roomId: string;
  taskType: string;
  scheduledDate: string;
  notes: string;
}

export default function HousekeepingPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const propertyId = user?.propertyIds?.[0] ?? '';

  const [statusFilter, setStatusFilter] = useState<HousekeepingStatus | 'ALL'>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [skipTaskId, setSkipTaskId] = useState<string | null>(null);
  const [skipReason, setSkipReason] = useState('');
  const [createForm, setCreateForm] = useState<CreateTaskForm>({
    roomId: '',
    taskType: 'FULL_CLEAN',
    scheduledDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // Fetch today's tasks
  const { data, isLoading } = useQuery({
    queryKey: ['housekeeping', 'today', propertyId],
    queryFn: () => housekeepingApi.getToday(propertyId),
    select: (res) => unwrapApiData<HousekeepingTaskDto[]>(res),
    enabled: !!propertyId,
    refetchInterval: 30000,
  });

  // Fetch rooms for create form
  const { data: roomsData } = useRooms(propertyId);
  const rooms = roomsData ?? [];

  const startMutation = useMutation({
    mutationFn: (id: string) => housekeepingApi.start(id),
    onSuccess: () => {
      toast.success('Task started');
      queryClient.invalidateQueries({ queryKey: ['housekeeping'] });
    },
    onError: () => toast.error('Failed to start task'),
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => housekeepingApi.complete(id),
    onSuccess: () => {
      toast.success('Task completed');
      queryClient.invalidateQueries({ queryKey: ['housekeeping'] });
    },
    onError: () => toast.error('Failed to complete task'),
  });

  const verifyMutation = useMutation({
    mutationFn: (id: string) => housekeepingApi.verify(id),
    onSuccess: () => {
      toast.success('Task verified');
      queryClient.invalidateQueries({ queryKey: ['housekeeping'] });
    },
    onError: () => toast.error('Failed to verify task'),
  });

  const skipMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      housekeepingApi.skip(id, { reason }),
    onSuccess: () => {
      toast.success('Task skipped');
      queryClient.invalidateQueries({ queryKey: ['housekeeping'] });
      setSkipTaskId(null);
      setSkipReason('');
    },
    onError: () => toast.error('Failed to skip task'),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateTaskForm & { propertyId: string }) =>
      housekeepingApi.create(data),
    onSuccess: () => {
      toast.success('Task created');
      queryClient.invalidateQueries({ queryKey: ['housekeeping'] });
      setShowCreateModal(false);
      setCreateForm({
        roomId: '',
        taskType: 'FULL_CLEAN',
        scheduledDate: new Date().toISOString().split('T')[0],
        notes: '',
      });
    },
    onError: () => toast.error('Failed to create task'),
  });

  const allTasks = data ?? [];
  const pending = allTasks.filter((t) => t.status === HousekeepingStatus.PENDING);
  const inProgress = allTasks.filter((t) => t.status === HousekeepingStatus.IN_PROGRESS);
  const completed = allTasks.filter((t) => t.status === HousekeepingStatus.COMPLETED);
  const verified = allTasks.filter((t) => t.status === HousekeepingStatus.VERIFIED);

  const tasks =
    statusFilter === 'ALL' ? allTasks : allTasks.filter((t) => t.status === statusFilter);

  const handleCreate = () => {
    if (!createForm.roomId) {
      toast.error('Please select a room');
      return;
    }
    createMutation.mutate({ ...createForm, propertyId });
  };

  const filterTabs: { label: string; value: HousekeepingStatus | 'ALL'; count: number }[] = [
    { label: 'All', value: 'ALL', count: allTasks.length },
    { label: 'Pending', value: HousekeepingStatus.PENDING, count: pending.length },
    { label: 'In Progress', value: HousekeepingStatus.IN_PROGRESS, count: inProgress.length },
    { label: 'Completed', value: HousekeepingStatus.COMPLETED, count: completed.length },
    { label: 'Verified', value: HousekeepingStatus.VERIFIED, count: verified.length },
  ];

  const inputClass =
    'w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">Housekeeping</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Today&apos;s tasks · {formatDate(new Date())}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={16} />
          New Task
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Pending', count: pending.length, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'In Progress', count: inProgress.length, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Completed', count: completed.length, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Verified', count: verified.length, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((s) => (
          <div key={s.label} className={cn('rounded-xl p-4 border border-border', s.bg)}>
            <p className={cn('text-2xl font-bold', s.color)}>{s.count}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Task list */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {/* Filter tabs */}
        <div className="flex items-center gap-1 px-4 py-3 border-b border-border bg-muted/40 overflow-x-auto">
          <Filter size={14} className="text-muted-foreground shrink-0 mr-1" />
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
                statusFilter === tab.value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted',
              )}
            >
              {tab.label}
              <span
                className={cn(
                  'px-1.5 py-0.5 rounded-full text-xs',
                  statusFilter === tab.value
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Sparkles size={32} className="mx-auto mb-2 opacity-30" />
            <p>
              {statusFilter === 'ALL'
                ? 'No housekeeping tasks for today'
                : `No ${STATUS_CONFIG[statusFilter]?.label ?? statusFilter} tasks`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {tasks.map((task) => {
              const cfg = STATUS_CONFIG[task.status] ?? {
                label: task.status,
                color: 'text-gray-600',
                bg: 'bg-gray-100',
              };
              return (
                <div
                  key={task.id}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-muted/20 transition-colors"
                >
                  {/* Room & status */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="text-sm font-semibold text-foreground">
                        Room {task.room?.number ?? task.roomId.slice(0, 8)}
                      </p>
                      {task.room?.floor && (
                        <span className="text-xs text-muted-foreground">
                          Floor {task.room.floor}
                        </span>
                      )}
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium',
                          cfg.bg,
                          cfg.color,
                        )}
                      >
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium">{task.taskType.replace(/_/g, ' ')}</span>
                      {' · '}
                      {task.assignedTo
                        ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}`
                        : 'Unassigned'}
                      {task.completedAt && (
                        <span className="ml-2 text-green-600">
                          · Done {formatDate(new Date(task.completedAt))}
                        </span>
                      )}
                    </p>
                    {task.notes && (
                      <p className="text-xs text-muted-foreground mt-0.5 italic truncate max-w-xs">
                        {task.notes}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {task.status === HousekeepingStatus.PENDING && (
                      <>
                        <button
                          onClick={() => startMutation.mutate(task.id)}
                          disabled={startMutation.isPending}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors font-medium"
                        >
                          <Play size={11} /> Start
                        </button>
                        <button
                          onClick={() => setSkipTaskId(task.id)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors font-medium"
                        >
                          <SkipForward size={11} /> Skip
                        </button>
                      </>
                    )}
                    {task.status === HousekeepingStatus.IN_PROGRESS && (
                      <button
                        onClick={() => completeMutation.mutate(task.id)}
                        disabled={completeMutation.isPending}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors font-medium"
                      >
                        <CheckCircle2 size={11} /> Complete
                      </button>
                    )}
                    {task.status === HousekeepingStatus.COMPLETED && (
                      <button
                        onClick={() => verifyMutation.mutate(task.id)}
                        disabled={verifyMutation.isPending}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors font-medium"
                      >
                        <ShieldCheck size={11} /> Verify
                      </button>
                    )}
                    {task.status === HousekeepingStatus.VERIFIED && (
                      <span className="flex items-center gap-1 px-2.5 py-1 text-xs text-purple-600">
                        <ShieldCheck size={11} /> Done
                      </span>
                    )}
                    {task.status === HousekeepingStatus.SKIPPED && (
                      <span className="flex items-center gap-1 px-2.5 py-1 text-xs text-gray-500">
                        <SkipForward size={11} /> Skipped
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card rounded-xl border border-border w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-base font-semibold text-foreground">New Housekeeping Task</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Room */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Room <span className="text-destructive">*</span>
                </label>
                <select
                  value={createForm.roomId}
                  onChange={(e) => setCreateForm((f) => ({ ...f, roomId: e.target.value }))}
                  className={inputClass}
                >
                  <option value="">Select a room…</option>
                  {rooms.map((r: RoomDto) => (
                    <option key={r.id} value={r.id}>
                      Room {r.number}{r.floor ? ` · Floor ${r.floor}` : ''} ({r.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Task type */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Task Type
                </label>
                <select
                  value={createForm.taskType}
                  onChange={(e) => setCreateForm((f) => ({ ...f, taskType: e.target.value }))}
                  className={inputClass}
                >
                  {TASK_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Scheduled date */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Scheduled Date
                </label>
                <input
                  type="date"
                  value={createForm.scheduledDate}
                  onChange={(e) => setCreateForm((f) => ({ ...f, scheduledDate: e.target.value }))}
                  className={inputClass}
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Notes
                </label>
                <textarea
                  value={createForm.notes}
                  onChange={(e) => setCreateForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  placeholder="Optional instructions for the housekeeper…"
                  className={cn(inputClass, 'resize-none')}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-border">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={createMutation.isPending || !createForm.roomId}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {createMutation.isPending ? 'Creating…' : 'Create Task'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Skip Confirmation Modal */}
      {skipTaskId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card rounded-xl border border-border w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-base font-semibold text-foreground">Skip Task</h2>
              <button
                onClick={() => { setSkipTaskId(null); setSkipReason(''); }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5">
              <p className="text-sm text-muted-foreground mb-3">
                Optionally provide a reason for skipping this task.
              </p>
              <textarea
                value={skipReason}
                onChange={(e) => setSkipReason(e.target.value)}
                rows={3}
                placeholder="Reason (optional)…"
                className={cn(inputClass, 'resize-none')}
              />
            </div>

            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-border">
              <button
                onClick={() => { setSkipTaskId(null); setSkipReason(''); }}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => skipMutation.mutate({ id: skipTaskId, reason: skipReason || undefined })}
                disabled={skipMutation.isPending}
                className="px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded-lg font-medium hover:bg-destructive/90 transition-colors disabled:opacity-50"
              >
                {skipMutation.isPending ? 'Skipping…' : 'Skip Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
