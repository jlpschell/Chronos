// ============================================================================
// GoalsPanel Component
// Blended model: Habits (cyclical), Projects (linear), Events (point-in-time)
// ============================================================================

import { useCallback, useMemo, useState } from 'react';
import { nanoid } from 'nanoid';

import type { Goal, GoalType, GoalStatus, HabitFrequency, Milestone } from '../../types';
import { useUserStore } from '../../stores/user.store';

// ----------------------------------------------------------------------------
// Helper Functions
// ----------------------------------------------------------------------------

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

function isCompletedToday(completedDates: string[]): boolean {
  return completedDates.includes(getTodayString());
}

function calculateStreak(completedDates: string[], frequency: HabitFrequency): number {
  if (completedDates.length === 0) return 0;
  
  const sorted = [...completedDates].sort().reverse();
  const today = getTodayString();
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  
  // Must have completed today or yesterday to have a streak
  if (!sorted.includes(today) && !sorted.includes(yesterday)) return 0;
  
  let streak = 0;
  let checkDate = new Date();
  
  for (let i = 0; i < 365; i++) {
    const dateStr = checkDate.toISOString().split('T')[0];
    if (sorted.includes(dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (i > 0) {
      // Allow one missed day for yesterday
      break;
    } else {
      checkDate.setDate(checkDate.getDate() - 1);
    }
  }
  
  return streak;
}

function getDaysUntil(date: Date | null): number | null {
  if (!date) return null;
  return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function getWeekDates(): string[] {
  const dates: string[] = [];
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

// ----------------------------------------------------------------------------
// Type Configuration
// ----------------------------------------------------------------------------

const TYPE_CONFIG: Record<GoalType, { label: string; icon: string; color: string }> = {
  habit: { label: 'Habit', icon: '🔥', color: 'text-orange-600' },
  project: { label: 'Project', icon: '📊', color: 'text-blue-600' },
  event: { label: 'Event', icon: '📅', color: 'text-purple-600' },
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

function ProgressRing({ progress, size = 48 }: { progress: number; size?: number }) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(progress, 100) / 100) * circumference;

  const color = progress >= 80 ? 'stroke-green-500' : progress >= 50 ? 'stroke-blue-500' : 'stroke-amber-500';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle className="stroke-ink/10" fill="none" strokeWidth={strokeWidth} r={radius} cx={size / 2} cy={size / 2} />
        <circle
          className={`transition-all duration-500 ${color}`}
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
// Streak Display Component
// ----------------------------------------------------------------------------

function StreakDisplay({ streak, longestStreak }: { streak: number; longestStreak: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-center">
        <div className="text-2xl font-bold text-orange-500">{streak}</div>
        <div className="text-[10px] text-ink/50">current</div>
      </div>
      <div className="text-center text-ink/40">
        <div className="text-sm font-medium">{longestStreak}</div>
        <div className="text-[10px]">best</div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Week Grid Component (for habits)
// ----------------------------------------------------------------------------

function WeekGrid({ completedDates }: { completedDates: string[] }) {
  const weekDates = getWeekDates();
  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const today = getTodayString();

  return (
    <div className="flex gap-1">
      {weekDates.map((date, i) => {
        const completed = completedDates.includes(date);
        const isToday = date === today;
        const isPast = date < today;
        
        return (
          <div key={date} className="text-center">
            <div className="text-[9px] text-ink/40 mb-0.5">{dayLabels[i]}</div>
            <div
              className={`w-5 h-5 rounded-sm flex items-center justify-center text-[10px]
                ${completed ? 'bg-green-500 text-white' : isPast ? 'bg-red-100 text-red-400' : 'bg-ink/5'}
                ${isToday ? 'ring-2 ring-accent ring-offset-1' : ''}
              `}
            >
              {completed ? '✓' : isPast ? '✗' : '·'}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Countdown Display Component (for events)
// ----------------------------------------------------------------------------

function CountdownDisplay({ daysUntil }: { daysUntil: number }) {
  const isUrgent = daysUntil <= 7;
  const isPast = daysUntil < 0;

  return (
    <div className={`text-center px-3 py-2 rounded-lg ${isPast ? 'bg-gray-100' : isUrgent ? 'bg-red-100' : 'bg-purple-100'}`}>
      <div className={`text-2xl font-bold ${isPast ? 'text-gray-500' : isUrgent ? 'text-red-600' : 'text-purple-600'}`}>
        {isPast ? 'Past' : daysUntil}
      </div>
      <div className="text-[10px] text-ink/50">
        {isPast ? '' : daysUntil === 0 ? 'TODAY!' : daysUntil === 1 ? 'day left' : 'days left'}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Habit Card
// ----------------------------------------------------------------------------

interface HabitCardProps {
  goal: Goal;
  onToggleToday: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function HabitCard({ goal, onToggleToday, onEdit, onDelete }: HabitCardProps) {
  const completedToday = isCompletedToday(goal.completedDates);
  const statusConfig = STATUS_CONFIG[goal.status];

  return (
    <div className="p-4 rounded-lg border border-border bg-surface hover:border-orange-300 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔥</span>
            <h3 className="font-medium text-sm">{goal.text}</h3>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusConfig.bg} ${statusConfig.color}`}>
              {goal.frequency || 'daily'}
            </span>
          </div>
          
          <div className="mt-3 flex items-center gap-4">
            <StreakDisplay streak={goal.currentStreak} longestStreak={goal.longestStreak} />
            <WeekGrid completedDates={goal.completedDates} />
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleToday}
          className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all
            ${completedToday 
              ? 'bg-green-500 text-white shadow-lg' 
              : 'bg-ink/5 hover:bg-green-100 text-ink/30 hover:text-green-500'
            }
          `}
        >
          {completedToday ? '✓' : '○'}
        </button>
      </div>

      <div className="flex gap-2 mt-3 pt-3 border-t border-border">
        <button type="button" className="text-xs text-ink/50 hover:text-accent" onClick={onEdit}>Edit</button>
        <button type="button" className="text-xs text-ink/50 hover:text-red-500" onClick={onDelete}>Delete</button>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Project Card
// ----------------------------------------------------------------------------

interface ProjectCardProps {
  goal: Goal;
  onUpdateProgress: (value: number) => void;
  onToggleMilestone: (milestoneId: string) => void;
  onComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function ProjectCard({ goal, onUpdateProgress, onToggleMilestone, onComplete, onEdit, onDelete }: ProjectCardProps) {
  const progress = goal.targetValue ? (goal.currentValue / goal.targetValue) * 100 : 0;
  const daysUntil = getDaysUntil(goal.deadline);
  const statusConfig = STATUS_CONFIG[goal.status];
  const completedMilestones = goal.milestones.filter(m => m.completed).length;

  return (
    <div className="p-4 rounded-lg border border-border bg-surface hover:border-blue-300 transition-colors">
      <div className="flex gap-4">
        {goal.targetValue && (
          <div className="flex-shrink-0">
            <ProgressRing progress={progress} />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg">📊</span>
                <h3 className="font-medium text-sm">{goal.text}</h3>
              </div>
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

          {/* Milestones */}
          {goal.milestones.length > 0 && (
            <div className="mt-3 space-y-1">
              <div className="text-[10px] text-ink/50 mb-1">
                Milestones: {completedMilestones}/{goal.milestones.length}
              </div>
              {goal.milestones.slice(0, 3).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`flex items-center gap-2 text-xs w-full text-left p-1 rounded hover:bg-ink/5
                    ${m.completed ? 'text-ink/40 line-through' : 'text-ink/70'}
                  `}
                  onClick={() => onToggleMilestone(m.id)}
                >
                  <span>{m.completed ? '☑' : '☐'}</span>
                  <span>{m.text}</span>
                </button>
              ))}
              {goal.milestones.length > 3 && (
                <div className="text-[10px] text-ink/40">+{goal.milestones.length - 3} more</div>
              )}
            </div>
          )}

          {/* Deadline */}
          {daysUntil !== null && (
            <p className={`text-xs mt-2 ${daysUntil <= 7 ? 'text-red-500 font-medium' : 'text-ink/50'}`}>
              {daysUntil > 0 ? `${daysUntil} days left` : daysUntil === 0 ? '⚠️ Due today' : `⚠️ ${Math.abs(daysUntil)} days overdue`}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border">
            {goal.targetValue && goal.status === 'active' && (
              <button
                type="button"
                className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                onClick={() => onUpdateProgress(Math.min(goal.currentValue + 1, goal.targetValue!))}
              >
                +1 Progress
              </button>
            )}
            {goal.status === 'active' && (
              <button
                type="button"
                className="px-2 py-1 text-xs rounded bg-green-100 text-green-700 hover:bg-green-200"
                onClick={onComplete}
              >
                ✓ Complete
              </button>
            )}
            <button type="button" className="text-xs text-ink/50 hover:text-accent" onClick={onEdit}>Edit</button>
            <button type="button" className="text-xs text-ink/50 hover:text-red-500" onClick={onDelete}>Delete</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Event Card
// ----------------------------------------------------------------------------

interface EventCardProps {
  goal: Goal;
  onComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function EventCard({ goal, onComplete, onEdit, onDelete }: EventCardProps) {
  const daysUntil = getDaysUntil(goal.eventDate);
  const statusConfig = STATUS_CONFIG[goal.status];
  const eventDateStr = goal.eventDate ? new Date(goal.eventDate).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }) : 'No date set';

  return (
    <div className="p-4 rounded-lg border border-border bg-surface hover:border-purple-300 transition-colors">
      <div className="flex gap-4 items-center">
        {daysUntil !== null && (
          <CountdownDisplay daysUntil={daysUntil} />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg">📅</span>
                <h3 className="font-medium text-sm">{goal.text}</h3>
              </div>
              <p className="text-xs text-ink/60 mt-1">{eventDateStr}</p>
              {goal.eventLocation && (
                <p className="text-xs text-ink/50 mt-0.5">📍 {goal.eventLocation}</p>
              )}
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusConfig.bg} ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border">
            {goal.status === 'active' && daysUntil !== null && daysUntil <= 0 && (
              <button
                type="button"
                className="px-2 py-1 text-xs rounded bg-green-100 text-green-700 hover:bg-green-200"
                onClick={onComplete}
              >
                ✓ Mark as done
              </button>
            )}
            <button type="button" className="text-xs text-ink/50 hover:text-accent" onClick={onEdit}>Edit</button>
            <button type="button" className="text-xs text-ink/50 hover:text-red-500" onClick={onDelete}>Delete</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Goal Form Modal
// ----------------------------------------------------------------------------

interface GoalFormData {
  goalType: GoalType;
  text: string;
  // Project fields
  targetValue: string;
  unit: string;
  deadline: string;
  milestones: string; // Comma-separated
  // Habit fields
  frequency: HabitFrequency;
  // Event fields
  eventDate: string;
  eventLocation: string;
}

const EMPTY_FORM: GoalFormData = {
  goalType: 'project',
  text: '',
  targetValue: '',
  unit: '',
  deadline: '',
  milestones: '',
  frequency: 'daily',
  eventDate: '',
  eventLocation: '',
};

interface GoalFormProps {
  goal?: Goal;
  onSave: (data: Partial<Goal>) => void;
  onCancel: () => void;
}

function GoalForm({ goal, onSave, onCancel }: GoalFormProps) {
  const [form, setForm] = useState<GoalFormData>(() => ({
    goalType: goal?.goalType ?? 'project',
    text: goal?.text ?? '',
    targetValue: goal?.targetValue?.toString() ?? '',
    unit: goal?.unit ?? '',
    deadline: goal?.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : '',
    milestones: goal?.milestones?.map(m => m.text).join(', ') ?? '',
    frequency: goal?.frequency ?? 'daily',
    eventDate: goal?.eventDate ? new Date(goal.eventDate).toISOString().split('T')[0] : '',
    eventLocation: goal?.eventLocation ?? '',
  }));

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!form.text.trim()) return;

      const milestones: Milestone[] = form.milestones
        .split(',')
        .map(t => t.trim())
        .filter(Boolean)
        .map((text, i) => ({
          id: nanoid(),
          text,
          completed: false,
          completedAt: null,
          order: i,
        }));

      onSave({
        goalType: form.goalType,
        text: form.text.trim(),
        // Project fields
        targetValue: form.targetValue ? parseInt(form.targetValue, 10) : null,
        unit: form.unit.trim() || null,
        deadline: form.deadline ? new Date(form.deadline) : null,
        milestones: form.goalType === 'project' ? milestones : [],
        // Habit fields
        frequency: form.goalType === 'habit' ? form.frequency : null,
        completedDates: goal?.completedDates ?? [],
        currentStreak: goal?.currentStreak ?? 0,
        longestStreak: goal?.longestStreak ?? 0,
        // Event fields
        eventDate: form.goalType === 'event' && form.eventDate ? new Date(form.eventDate) : null,
        eventLocation: form.goalType === 'event' ? form.eventLocation.trim() || null : null,
        reminderDays: form.goalType === 'event' ? [30, 7, 1] : [],
        // Common
        currentValue: goal?.currentValue ?? 0,
        status: goal?.status ?? 'active',
      });
    },
    [form, goal, onSave]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-surface border border-border shadow-xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <h3 className="text-lg font-semibold">{goal ? 'Edit' : 'New'} Goal</h3>

          {/* Type Selector */}
          {!goal && (
            <div className="flex gap-2">
              {(['habit', 'project', 'event'] as GoalType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`flex-1 p-3 rounded-lg border-2 transition-colors text-center
                    ${form.goalType === type ? 'border-accent bg-accent/10' : 'border-border hover:border-accent/50'}
                  `}
                  onClick={() => setForm({ ...form, goalType: type })}
                >
                  <div className="text-xl">{TYPE_CONFIG[type].icon}</div>
                  <div className="text-xs font-medium mt-1">{TYPE_CONFIG[type].label}</div>
                </button>
              ))}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="text-sm font-medium text-ink/70">
              {form.goalType === 'habit' ? 'What habit do you want to build?' 
                : form.goalType === 'event' ? "What's the event?" 
                : 'What do you want to achieve?'}
            </label>
            <input
              type="text"
              className="w-full mt-1 px-3 py-2 rounded border border-border bg-canvas text-sm"
              placeholder={
                form.goalType === 'habit' ? 'e.g., Exercise for 30 minutes'
                : form.goalType === 'event' ? 'e.g., Hawaii vacation'
                : 'e.g., Launch new product'
              }
              value={form.text}
              onChange={(e) => setForm({ ...form, text: e.target.value })}
              autoFocus
            />
          </div>

          {/* Habit-specific fields */}
          {form.goalType === 'habit' && (
            <div>
              <label className="text-sm font-medium text-ink/70">How often?</label>
              <select
                className="w-full mt-1 px-3 py-2 rounded border border-border bg-canvas text-sm"
                value={form.frequency}
                onChange={(e) => setForm({ ...form, frequency: e.target.value as HabitFrequency })}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          )}

          {/* Project-specific fields */}
          {form.goalType === 'project' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-ink/70">Target (optional)</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full mt-1 px-3 py-2 rounded border border-border bg-canvas text-sm"
                    placeholder="e.g., 100"
                    value={form.targetValue}
                    onChange={(e) => setForm({ ...form, targetValue: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-ink/70">Unit (optional)</label>
                  <input
                    type="text"
                    className="w-full mt-1 px-3 py-2 rounded border border-border bg-canvas text-sm"
                    placeholder="e.g., %"
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
              <div>
                <label className="text-sm font-medium text-ink/70">Milestones (comma-separated, optional)</label>
                <input
                  type="text"
                  className="w-full mt-1 px-3 py-2 rounded border border-border bg-canvas text-sm"
                  placeholder="e.g., Research, Draft, Review, Launch"
                  value={form.milestones}
                  onChange={(e) => setForm({ ...form, milestones: e.target.value })}
                />
              </div>
            </>
          )}

          {/* Event-specific fields */}
          {form.goalType === 'event' && (
            <>
              <div>
                <label className="text-sm font-medium text-ink/70">When is it?</label>
                <input
                  type="date"
                  className="w-full mt-1 px-3 py-2 rounded border border-border bg-canvas text-sm"
                  value={form.eventDate}
                  onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-ink/70">Where? (optional)</label>
                <input
                  type="text"
                  className="w-full mt-1 px-3 py-2 rounded border border-border bg-canvas text-sm"
                  placeholder="e.g., Maui, Hawaii"
                  value={form.eventLocation}
                  onChange={(e) => setForm({ ...form, eventLocation: e.target.value })}
                />
              </div>
            </>
          )}

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
              {goal ? 'Save Changes' : 'Create'}
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
  const [typeFilter, setTypeFilter] = useState<GoalType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'active' | 'completed' | 'all'>('active');

  // Filter goals
  const filteredGoals = useMemo(() => {
    return goals.filter((g) => {
      if (typeFilter !== 'all' && g.goalType !== typeFilter) return false;
      if (statusFilter === 'active' && g.status !== 'active' && g.status !== 'drifting') return false;
      if (statusFilter === 'completed' && g.status !== 'completed') return false;
      return true;
    });
  }, [goals, typeFilter, statusFilter]);

  // Group by type
  const habits = filteredGoals.filter(g => g.goalType === 'habit');
  const projects = filteredGoals.filter(g => g.goalType === 'project');
  const events = filteredGoals.filter(g => g.goalType === 'event');

  // Counts
  const counts = {
    habit: goals.filter(g => g.goalType === 'habit' && g.status === 'active').length,
    project: goals.filter(g => g.goalType === 'project' && g.status === 'active').length,
    event: goals.filter(g => g.goalType === 'event' && g.status === 'active').length,
  };

  // Handlers
  const handleSave = useCallback(
    (data: Partial<Goal>) => {
      if (editingGoal) {
        updateGoal(editingGoal.id, { ...data, lastActivity: new Date() });
      } else {
        const newGoal: Goal = {
          id: nanoid(),
          text: data.text ?? '',
          goalType: data.goalType ?? 'project',
          status: 'active',
          createdAt: new Date(),
          lastActivity: new Date(),
          linkedEventIds: [],
          nudgesSent: 0,
          // Project
          targetValue: data.targetValue ?? null,
          currentValue: data.currentValue ?? 0,
          unit: data.unit ?? null,
          deadline: data.deadline ?? null,
          milestones: data.milestones ?? [],
          // Habit
          frequency: data.frequency ?? null,
          completedDates: data.completedDates ?? [],
          currentStreak: 0,
          longestStreak: 0,
          // Event
          eventDate: data.eventDate ?? null,
          eventLocation: data.eventLocation ?? null,
          reminderDays: data.reminderDays ?? [],
        };
        addGoal(newGoal);
      }
      setShowForm(false);
      setEditingGoal(null);
    },
    [editingGoal, addGoal, updateGoal]
  );

  const handleToggleHabit = useCallback(
    (goal: Goal) => {
      const today = getTodayString();
      const alreadyCompleted = goal.completedDates.includes(today);
      
      let newDates: string[];
      if (alreadyCompleted) {
        newDates = goal.completedDates.filter(d => d !== today);
      } else {
        newDates = [...goal.completedDates, today];
      }
      
      const newStreak = calculateStreak(newDates, goal.frequency || 'daily');
      const newLongest = Math.max(goal.longestStreak, newStreak);
      
      updateGoal(goal.id, {
        completedDates: newDates,
        currentStreak: newStreak,
        longestStreak: newLongest,
        lastActivity: new Date(),
      });
    },
    [updateGoal]
  );

  const handleToggleMilestone = useCallback(
    (goalId: string, milestoneId: string) => {
      const goal = goals.find(g => g.id === goalId);
      if (!goal) return;
      
      const newMilestones = goal.milestones.map(m => 
        m.id === milestoneId 
          ? { ...m, completed: !m.completed, completedAt: !m.completed ? new Date() : null }
          : m
      );
      
      updateGoal(goalId, { milestones: newMilestones, lastActivity: new Date() });
    },
    [goals, updateGoal]
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
            🔥 {counts.habit} habits · 📊 {counts.project} projects · 📅 {counts.event} events
          </p>
        </div>
        <button
          type="button"
          className="px-3 py-1.5 text-sm rounded bg-accent text-white hover:bg-accent/90"
          onClick={() => { setEditingGoal(null); setShowForm(true); }}
        >
          + New
        </button>
      </div>

      {/* Type Filter */}
      <div className="flex gap-1 flex-wrap">
        {(['all', 'habit', 'project', 'event'] as const).map((type) => (
          <button
            key={type}
            type="button"
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              typeFilter === type ? 'bg-accent text-white' : 'bg-ink/5 hover:bg-ink/10'
            }`}
            onClick={() => setTypeFilter(type)}
          >
            {type === 'all' ? 'All' : TYPE_CONFIG[type].icon + ' ' + TYPE_CONFIG[type].label}
          </button>
        ))}
        <div className="w-px bg-border mx-1" />
        {(['active', 'completed', 'all'] as const).map((status) => (
          <button
            key={status}
            type="button"
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              statusFilter === status ? 'bg-ink/20' : 'bg-ink/5 hover:bg-ink/10'
            }`}
            onClick={() => setStatusFilter(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Empty State */}
      {filteredGoals.length === 0 && (
        <div className="text-center py-8 text-ink/40">
          <div className="text-3xl mb-2">🎯</div>
          <p className="text-sm">No goals yet</p>
          <button
            type="button"
            className="mt-3 text-sm text-accent hover:underline"
            onClick={() => { setEditingGoal(null); setShowForm(true); }}
          >
            Create your first goal →
          </button>
        </div>
      )}

      {/* Goal Lists by Type */}
      {habits.length > 0 && (typeFilter === 'all' || typeFilter === 'habit') && (
        <div className="space-y-2">
          {typeFilter === 'all' && <h4 className="text-xs font-semibold text-orange-600 uppercase tracking-wide">🔥 Habits</h4>}
          {habits.map((goal) => (
            <HabitCard
              key={goal.id}
              goal={goal}
              onToggleToday={() => handleToggleHabit(goal)}
              onEdit={() => { setEditingGoal(goal); setShowForm(true); }}
              onDelete={() => handleDelete(goal.id)}
            />
          ))}
        </div>
      )}

      {projects.length > 0 && (typeFilter === 'all' || typeFilter === 'project') && (
        <div className="space-y-2">
          {typeFilter === 'all' && <h4 className="text-xs font-semibold text-blue-600 uppercase tracking-wide mt-4">📊 Projects</h4>}
          {projects.map((goal) => (
            <ProjectCard
              key={goal.id}
              goal={goal}
              onUpdateProgress={(value) => updateGoal(goal.id, { currentValue: value, lastActivity: new Date() })}
              onToggleMilestone={(mId) => handleToggleMilestone(goal.id, mId)}
              onComplete={() => updateGoal(goal.id, { status: 'completed', lastActivity: new Date() })}
              onEdit={() => { setEditingGoal(goal); setShowForm(true); }}
              onDelete={() => handleDelete(goal.id)}
            />
          ))}
        </div>
      )}

      {events.length > 0 && (typeFilter === 'all' || typeFilter === 'event') && (
        <div className="space-y-2">
          {typeFilter === 'all' && <h4 className="text-xs font-semibold text-purple-600 uppercase tracking-wide mt-4">📅 Events</h4>}
          {events.map((goal) => (
            <EventCard
              key={goal.id}
              goal={goal}
              onComplete={() => updateGoal(goal.id, { status: 'completed', lastActivity: new Date() })}
              onEdit={() => { setEditingGoal(goal); setShowForm(true); }}
              onDelete={() => handleDelete(goal.id)}
            />
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <GoalForm
          goal={editingGoal ?? undefined}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingGoal(null); }}
        />
      )}
    </div>
  );
}
