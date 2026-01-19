// ============================================================================
// Settings Page
// User preferences and app settings
// ============================================================================

import { useUserStore } from '../stores/user.store';
import {
  BouncerPanel,
  BouncerPreferences,
  ThemeSelector,
  GoalsPanel,
  DataManagement,
  EncryptionSetup,
  EncryptionStatus,
} from '../components/features';

export function SettingsPage() {
  const {
    velocity,
    geometry,
    constellation,
    chronotype,
    bufferPreference,
    stressResponse,
    motivationStyle,
    persona,
    bouncerMode,
    stats,
    preferences,
    updatePreferences,
    setPersona,
    resetIntake,
  } = useUserStore();

  // Label mappings
  const labels = {
    velocity: velocity === 'high_efficiency' ? '⚡ Efficiency-focused' : '🛡️ Sustainable pace',
    geometry: geometry === 'linear_horizon' ? '→ Linear (goals)' : '◐ Cyclical (rhythms)',
    constellation: constellation === 'solo_pilot' ? '🚀 Solo' : constellation === 'co_pilot' ? '👥 Partner' : '🌐 Team',
    chronotype: chronotype === 'early_bird' ? '🌅 Early bird' : chronotype === 'night_owl' ? '🦉 Night owl' : '🔄 Flexible',
    buffer: bufferPreference === 'packed' ? '📦 Minimal' : bufferPreference === 'breathing_room' ? '🌿 Moderate' : '🏔️ Generous',
    stress: stressResponse === 'more_structure' ? '📋 More structure' : '💨 More space',
    motivation: motivationStyle === 'streaks' ? '🔥 Streaks' : motivationStyle === 'milestones' ? '🏆 Milestones' : '⭐ Both',
  };

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Profile Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Your Profile</h2>
        <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
          {/* Calibration Summary */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-ink/60">Pace</span>
              <span className="font-medium">{labels.velocity || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink/60">Time view</span>
              <span className="font-medium">{labels.geometry || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink/60">Calendar</span>
              <span className="font-medium">{labels.constellation || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink/60">Energy</span>
              <span className="font-medium">{labels.chronotype || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink/60">Buffer</span>
              <span className="font-medium">{labels.buffer || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink/60">Under stress</span>
              <span className="font-medium">{labels.stress || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink/60">Motivation</span>
              <span className="font-medium">{labels.motivation || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink/60">Bouncer</span>
              <span className="font-medium capitalize">{bouncerMode || '—'}</span>
            </div>
          </div>
          
          <div className="border-t border-border my-3" />
          
          {/* AI Persona Toggle */}
          <div className="flex justify-between items-center text-sm">
            <div>
              <span className="text-ink/60">AI Persona</span>
              <p className="text-xs text-ink/40 mt-0.5">How the AI talks to you</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPersona('supportive_peer')}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                  persona === 'supportive_peer'
                    ? 'bg-accent text-white'
                    : 'bg-ink/5 hover:bg-ink/10'
                }`}
              >
                🤝 Supportive
              </button>
              <button
                type="button"
                onClick={() => setPersona('shop_foreman')}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                  persona === 'shop_foreman'
                    ? 'bg-accent text-white'
                    : 'bg-ink/5 hover:bg-ink/10'
                }`}
              >
                👷 Foreman
              </button>
            </div>
          </div>
          
          <button
            type="button"
            className="mt-4 text-xs text-ink/50 hover:text-accent transition-colors"
            onClick={resetIntake}
          >
            Recalibrate (redo all 7 questions) →
          </button>
        </div>
      </section>

      {/* Theme Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Appearance</h2>
        <ThemeSelector />
      </section>

      {/* Stats Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Activity</h2>
        <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-ink/60">Days active</span>
            <span className="font-medium">{stats.daysActive}</span>
          </div>
          {stats.lastActiveDate && (
            <div className="flex justify-between text-sm">
              <span className="text-ink/60">Last active</span>
              <span className="font-medium">
                {new Date(stats.lastActiveDate).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Preferences Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Preferences</h2>
        <div className="rounded-lg border border-border bg-surface p-4 space-y-4">
          <label className="flex items-center justify-between">
            <span className="text-sm">Voice enabled</span>
            <input
              type="checkbox"
              checked={preferences.voiceEnabled}
              onChange={(e) => updatePreferences({ voiceEnabled: e.target.checked })}
              className="w-4 h-4 accent-accent"
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-sm">Notifications</span>
            <input
              type="checkbox"
              checked={preferences.notificationsEnabled}
              onChange={(e) => updatePreferences({ notificationsEnabled: e.target.checked })}
              className="w-4 h-4 accent-accent"
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-sm">Transparency mode</span>
            <select
              value={preferences.transparencyMode}
              onChange={(e) =>
                updatePreferences({
                  transparencyMode: e.target.value as 'verbose' | 'quiet',
                })
              }
              className="text-sm bg-canvas border border-border rounded px-2 py-1"
            >
              <option value="verbose">Verbose</option>
              <option value="quiet">Quiet</option>
            </select>
          </label>
          <div className="border-t border-border my-3" />
          <label className="flex items-center justify-between">
            <span className="text-sm">Buffer between meetings</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={60}
                step={5}
                value={preferences.preferredBuffer}
                onChange={(e) =>
                  updatePreferences({ preferredBuffer: parseInt(e.target.value, 10) })
                }
                className="w-16 text-sm bg-canvas border border-border rounded px-2 py-1 text-right"
              />
              <span className="text-xs text-ink/60">min</span>
            </div>
          </label>
        </div>
      </section>

      {/* Goals Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Goals</h2>
        <GoalsPanel />
      </section>

      {/* Data Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Data</h2>
        <DataManagement />
      </section>

      {/* Security Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Security</h2>
          <EncryptionStatus />
        </div>
        <EncryptionSetup />
      </section>

      {/* Bouncer Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Bouncer</h2>
        <p className="text-sm text-ink/60">
          Manage how notifications are filtered and queued.
        </p>
        <BouncerPreferences />
        <BouncerPanel />
      </section>
    </div>
  );
}
