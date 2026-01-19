// ============================================================================
// GoalsPanel Component
// CRUD UI for goals with progress visualization
// ============================================================================

import { useCallback, useState } from 'react';
import { nanoid } from 'nanoid';

import type { Goal, GoalStatus } from '../../types';
import { useUserStore } from '../../stores/user.store';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

interface GoalFormData {
  text: string;
  targetValue: string;
  unit: string;
  deadline: string;
}

const EMPTY_FORM: GoalFormData = {
  text: '',
  targetValue: '',
  unit: '',
  deadline: '',
};

const STATUS_CONFIG: Record<GoalStatus, { label: string; color: string; bg: string }> = {
  active: { label: 'Active', color: 'text-green-600', bg: 'bg-green-100' },
  drifting: { label: 'Drifting', color: 'text-amber-600', bg: 'bg-amber-100' },
  completed: { label: 'Completed', color: 'text-blue-600', bg: 'bg-blue-100' },
  archived: { label: 'Archived', color: 'text-gray-500', bg: 'bg-gray-100' },
};

// ----------------------------------------------------------------------------
// Progress Ring Component
// ----------------------------------------------------------------------------

interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
}

function ProgressRing({ progress, size = 48, strokeWidth = 4 }: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  const getColor = () => {
    if (progress >= 80) return 'stroke-green-500';
    if (progress >= 50) return 'stroke-blue-500';
    if (progress >= 25) return 'stroke-amber-500';
    return 'stroke-red-500';
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="stroke-ink/10"
          fill="none"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={`transition-all duration-500 ${getColor()}`}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-semibold">{Math.round(progress)}%</span>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Goal Card Component
// ----------------------------------------------------------------------------

interface GoalCardProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onUpdateProgress: (id: string, value: number) => void;
  onUpdateStatus: (id: string, status: GoalStatus) => void;
  onDelete: (id: string) => void;
}

function GoalCard({ goal, onEdit, onUpdateProgress, onUpdateStatus, onDelete }: GoalCardProps) {
  const statusConfig = STATUS_CONFIG[goal.status];
  const progress = goal.targetValue ? (goal.currentValue / goal.targetValue) * 100 : 0;
  const daysUntilDeadline = goal.deadline
    ? Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const handleQuickProgress = useCallback(() => {
    if (!goal.targetValue) return;
    const newValue = Math.min(goal.currentValue + 1, goal.targetValue);
    onUpdateProgress(goal.id, newValue);
  }, [goal, onUpdateProgress]);

  return (
    <div className="p-4 rounded-lg border border-border bg-surface hover:border-accent/30 transition-colors">
      <div className="flex gap-4">
        {/* Progress Ring */}
        {goal.targetValue && (
          <div className="flex-shrink-0">
            <ProgressRing progress={progress} />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-medium text-sm leading-tight">{goal.text}</h3>
              {goal.targetValue && goal.unit && (
                <p className="text-xs text-ink/60 mt-1">
                  {goal.currentValue} / {goal.targetValue} {goal.unit}
                </p>
              )}
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusConfig.bg} ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
          </div>

          {/* Deadline */}
          {daysUntilDeadline !== null && (
            <p className={`text-xs mt-2 ${daysUntilDeadline <= 7 ? 'text-red-500 font-medium' : 'text-ink/50'}`}>
              {daysUntilDeadline > 0
                ? `${daysUntilDeadline} day${daysUntilDeadline === 1 ? '' : 's'} left`
                : daysUntilDeadline === 0
                ? 'Due today'
                : `${Math.abs(daysUntilDeadline)} day${Math.abs(daysUntilDeadline) === 1 ? '' : 's'} overdue`}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 mt-3">
            {goal.targetValue && goal.status === 'active' && (
              <button
                type="button"
                className="px-2 py-1 text-xs rounded bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                onClick={handleQuickProgress}
              >
                +1 Progress
              </button>
            )}
            {goal.status === 'active' && (
              <button
                type="button"
                className="px-2 py-1 text-xs rounded bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                onClick={() => onUpdateStatus(goal.id, 'completed')}
              >
                ✓ Complete
              </button>
            )}
            <button
              type="button"
              className="px-2 py-1 text-xs rounded hover:bg-ink/5 text-ink/50"
              onClick={() => onEdit(goal)}
            >
              Edit
            </button>
            <button
              type="button"
              className="px-2 py-1 text-xs rounded hover:bg-red-50 text-red-500/70 hover:text-red-500"
              onClick={() => onDelete(goal.id)}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Goal Form Modal
// ----------------------------------------------------------------------------

interface GoalFormProps {
  goal?: Goal;
  onSave: (data: Partial<Goal>) => void;
  onCancel: () => void;
}

function GoalForm({ goal, onSave, onCancel }: GoalFormProps) {
  const [form, setForm] = useState<GoalFormData>(() => ({
    text: goal?.text ?? '',
    targetValue: goal?.targetValue?.toString() ?? '',
    unit: goal?.unit ?? '',
    deadline: goal?.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : '',
  }));

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!form.text.trim()) return;

      onSave({
        text: form.text.trim(),
        targetValue: form.targetValue ? parseInt(form.targetValue, 10) : null,
        unit: form.unit.trim() || null,
        deadline: form.deadline ? new Date(form.deadline) : null,
        currentValue: goal?.currentValue ?? 0,
        status: goal?.status ?? 'active',
      });
    },
    [form, goal, onSave]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-surface border border-border shadow-xl">
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <h3 className="text-lg font-semibold">{goal ? 'Edit Goal' : 'New Goal'}</h3>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-ink/70">What do you want to achieve?</label>
              <input
                type="text"
                className="w-full mt-1 px-3 py-2 rounded border border-border bg-canvas text-sm"
                placeholder="e.g., Land 3 new clients"
                value={form.text}
                onChange={(e) => setForm({ ...form, text: e.target.value })}
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-ink/70">Target (optional)</label>
                <input
                  type="number"
                  min="1"
                  className="w-full mt-1 px-3 py-2 rounded border border-border bg-canvas text-sm"
                  placeholder="e.g., 3"
                  value={form.targetValue}
                  onChange={(e) => setForm({ ...form, targetValue: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-ink/70">Unit (optional)</label>
                <input
                  type="text"
                  className="w-full mt-1 px-3 py-2 rounded border border-border bg-canvas text-sm"
                  placeholder="e.g., clients"
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-ink/70">Deadline (optional)</label>
              <input
                type="date"
                className="w-full mt-1 px-3 py-2 rounded border border-border bg-canvas text-sm"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="px-4 py-2 text-sm rounded border border-border hover:bg-ink/5"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm rounded bg-accent text-white hover:bg-accent/90 disabled:opacity-50"
              disabled={!form.text.trim()}
            >
              {goal ? 'Save Changes' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Main GoalsPanel Component
// ----------------------------------------------------------------------------

export function GoalsPanel() {
  const { goals, addGoal, updateGoal, removeGoal } = useUserStore();

  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');

  const filteredGoals = goals.filter((g) => {
    if (filter === 'all') return true;
    if (filter === 'active') return g.status === 'active' || g.status === 'drifting';
    if (filter === 'completed') return g.status === 'completed';
    return true;
  });

  const activeCount = goals.filter((g) => g.status === 'active' || g.status === 'drifting').length;
  const completedCount = goals.filter((g) => g.status === 'completed').length;

  const handleSave = useCallback(
    (data: Partial<Goal>) => {
      if (editingGoal) {
        updateGoal(editingGoal.id, {
          ...data,
          lastActivity: new Date(),
        });
      } else {
        const newGoal: Goal = {
          id: nanoid(),
          text: data.text ?? '',
          targetValue: data.targetValue ?? null,
          currentValue: data.currentValue ?? 0,
          unit: data.unit ?? null,
          deadline: data.deadline ?? null,
          createdAt: new Date(),
          lastActivity: new Date(),
          linkedEventIds: [],
          status: 'active',
          nudgesSent: 0,
        };
        addGoal(newGoal);
      }

      setShowForm(false);
      setEditingGoal(null);
    },
    [editingGoal, addGoal, updateGoal]
  );

  const handleEdit = useCallback((goal: Goal) => {
    setEditingGoal(goal);
    setShowForm(true);
  }, []);

  const handleUpdateProgress = useCallback(
    (id: string, value: number) => {
      const goal = goals.find((g) => g.id === id);
      if (!goal) return;

      const isComplete = goal.targetValue && value >= goal.targetValue;
      updateGoal(id, {
        currentValue: value,
        lastActivity: new Date(),
        status: isComplete ? 'completed' : goal.status,
      });
    },
    [goals, updateGoal]
  );

  const handleUpdateStatus = useCallback(
    (id: string, status: GoalStatus) => {
      updateGoal(id, { status, lastActivity: new Date() });
    },
    [updateGoal]
  );

  const handleDelete = useCallback(
    (id: string) => {
      if (confirm('Delete this goal?')) {
        removeGoal(id);
      }
    },
    [removeGoal]
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Goals</h3>
          <p className="text-xs text-ink/60">
            {activeCount} active · {completedCount} completed
          </p>
        </div>
        <button
          type="button"
          className="px-3 py-1.5 text-sm rounded bg-accent text-white hover:bg-accent/90"
          onClick={() => {
            setEditingGoal(null);
            setShowForm(true);
          }}
        >
          + New Goal
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-1">
        {(['active', 'completed', 'all'] as const).map((f) => (
          <button
            key={f}
            type="button"
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              filter === f ? 'bg-accent text-white' : 'bg-ink/5 hover:bg-ink/10'
            }`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Goal List */}
      {filteredGoals.length === 0 ? (
        <div className="text-center py-8 text-ink/40">
          <div className="text-3xl mb-2">🎯</div>
          <p className="text-sm">
            {filter === 'active' ? 'No active goals' : filter === 'completed' ? 'No completed goals' : 'No goals yet'}
          </p>
          <button
            type="button"
            className="mt-3 text-sm text-accent hover:underline"
            onClick={() => {
              setEditingGoal(null);
              setShowForm(true);
            }}
          >
            Create your first goal →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={handleEdit}
              onUpdateProgress={handleUpdateProgress}
              onUpdateStatus={handleUpdateStatus}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <GoalForm
          goal={editingGoal ?? undefined}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingGoal(null);
          }}
        />
      )}
    </div>
  );
}
