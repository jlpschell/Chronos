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
    persona,
    bouncerMode,
    stats,
    preferences,
    updatePreferences,
    setPersona,
    resetIntake,
  } = useUserStore();

  const velocityLabel = velocity === 'high_efficiency' ? 'Efficiency-focused' : 'Sustainable pace';
  const geometryLabel = geometry === 'linear_horizon' ? 'Linear (path forward)' : 'Cyclical (rhythm)';
  const constellationLabel =
    constellation === 'solo_pilot'
      ? 'Solo'
      : constellation === 'co_pilot'
      ? 'With partner'
      : 'Team/family';
  const personaLabel = persona === 'shop_foreman' ? 'Shop Foreman' : 'Supportive Peer';

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Profile Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Your Profile</h2>
        <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-ink/60">Pace</span>
            <span className="font-medium">{velocityLabel}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-ink/60">Time view</span>
            <span className="font-medium">{geometryLabel}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-ink/60">Calendar style</span>
            <span className="font-medium">{constellationLabel}</span>
          </div>
          <div className="border-t border-border my-3" />
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
          <div className="flex justify-between text-sm">
            <span className="text-ink/60">Bouncer mode</span>
            <span className="font-medium capitalize">{bouncerMode}</span>
          </div>
          <button
            type="button"
            className="mt-4 text-xs text-ink/50 hover:text-accent transition-colors"
            onClick={resetIntake}
          >
            Recalibrate (redo intake) →
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
