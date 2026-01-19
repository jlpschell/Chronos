// ============================================================================
// Loading & Empty State Components
// Consistent UI states across the app
// ============================================================================

import { type ReactNode } from 'react';

// ----------------------------------------------------------------------------
// Loading Spinner
// ----------------------------------------------------------------------------

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div
      className={`${sizeClasses[size]} border-ink/20 border-t-accent rounded-full animate-spin ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

// ----------------------------------------------------------------------------
// Loading Overlay
// ----------------------------------------------------------------------------

interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message = 'Loading...' }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/80 backdrop-blur-sm">
      <div className="text-center">
        <Spinner size="lg" />
        <p className="mt-4 text-sm text-ink/60">{message}</p>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Inline Loading
// ----------------------------------------------------------------------------

interface LoadingInlineProps {
  message?: string;
  className?: string;
}

export function LoadingInline({ message = 'Loading...', className = '' }: LoadingInlineProps) {
  return (
    <div className={`flex items-center justify-center gap-3 py-8 ${className}`}>
      <Spinner size="sm" />
      <span className="text-sm text-ink/60">{message}</span>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Skeleton Loaders
// ----------------------------------------------------------------------------

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-ink/10 rounded ${className}`} />
  );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
        />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Empty States
// ----------------------------------------------------------------------------

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon = '📭',
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-lg font-medium text-ink/80">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-ink/50 max-w-sm mx-auto">{description}</p>
      )}
      {action && (
        <button
          type="button"
          className="mt-4 px-4 py-2 text-sm rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors"
          onClick={action.onClick}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

// Preset empty states for common scenarios
export function EmptyEvents({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      icon="📅"
      title="No events yet"
      description="Your timeline is empty. Add an event to get started."
      action={onAdd ? { label: 'Add Event', onClick: onAdd } : undefined}
    />
  );
}

export function EmptyGoals({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      icon="🎯"
      title="No goals yet"
      description="Set a goal to track your progress and get coaching support."
      action={onAdd ? { label: 'Create Goal', onClick: onAdd } : undefined}
    />
  );
}

export function EmptyNotifications() {
  return (
    <EmptyState
      icon="🔔"
      title="All caught up"
      description="No notifications right now. Enjoy the quiet!"
    />
  );
}

export function EmptyPatterns() {
  return (
    <EmptyState
      icon="🧠"
      title="Still learning"
      description="Ralph hasn't learned any patterns yet. Keep using Chronos and patterns will emerge."
    />
  );
}

export function EmptySearch({ query }: { query: string }) {
  return (
    <EmptyState
      icon="🔍"
      title="No results"
      description={`Nothing found for "${query}". Try a different search.`}
    />
  );
}

export function EmptyCalendars({ onConnect }: { onConnect?: () => void }) {
  return (
    <EmptyState
      icon="🔗"
      title="No calendars connected"
      description="Connect your calendar to sync events and see your schedule."
      action={onConnect ? { label: 'Connect Calendar', onClick: onConnect } : undefined}
    />
  );
}

// ----------------------------------------------------------------------------
// Error State
// ----------------------------------------------------------------------------

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  className = '',
}: ErrorStateProps) {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="text-5xl mb-4">😕</div>
      <h3 className="text-lg font-medium text-red-600">{title}</h3>
      <p className="mt-2 text-sm text-ink/50 max-w-sm mx-auto">{message}</p>
      {onRetry && (
        <button
          type="button"
          className="mt-4 px-4 py-2 text-sm rounded-lg border border-border hover:bg-ink/5 transition-colors"
          onClick={onRetry}
        >
          Try Again
        </button>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Conditional Wrapper
// ----------------------------------------------------------------------------

interface ConditionalStateProps {
  isLoading?: boolean;
  isEmpty?: boolean;
  isError?: boolean;
  error?: string;
  loadingMessage?: string;
  emptyState?: ReactNode;
  onRetry?: () => void;
  children: ReactNode;
}

export function ConditionalState({
  isLoading,
  isEmpty,
  isError,
  error,
  loadingMessage,
  emptyState,
  onRetry,
  children,
}: ConditionalStateProps) {
  if (isLoading) {
    return <LoadingInline message={loadingMessage} />;
  }

  if (isError) {
    return <ErrorState message={error ?? 'An error occurred'} onRetry={onRetry} />;
  }

  if (isEmpty) {
    return <>{emptyState ?? <EmptyState title="Nothing here" />}</>;
  }

  return <>{children}</>;
}
