// ============================================================================
// EncryptionSetup Component
// UI for setting up and managing encryption password
// ============================================================================

import { useCallback, useState } from 'react';

import { Encryption } from '../../lib/encryption';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

interface EncryptionSetupProps {
  onComplete?: () => void;
}

type SetupMode = 'create' | 'unlock' | 'success';

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

export function EncryptionSetup({ onComplete }: EncryptionSetupProps) {
  const hasExisting = Encryption.hasSetup();
  const [mode, setMode] = useState<SetupMode>(hasExisting ? 'unlock' : 'create');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = useCallback(async () => {
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const success = await Encryption.initialize(password);
      if (success) {
        setMode('success');
        setTimeout(() => onComplete?.(), 1500);
      } else {
        setError('Failed to set up encryption');
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setIsLoading(false);
    }
  }, [password, confirmPassword, onComplete]);

  const handleUnlock = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      const success = await Encryption.initialize(password);
      if (success) {
        setMode('success');
        setTimeout(() => onComplete?.(), 1500);
      } else {
        setError('Incorrect password');
      }
    } catch (err) {
      setError('Failed to unlock: ' + String(err));
    } finally {
      setIsLoading(false);
    }
  }, [password, onComplete]);

  const handleReset = useCallback(() => {
    if (confirm('This will clear your encryption key. Any encrypted data will become unreadable. Continue?')) {
      Encryption.clear();
      setMode('create');
      setPassword('');
      setConfirmPassword('');
      setError(null);
    }
  }, []);

  if (mode === 'success') {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
        <div className="text-4xl mb-3">🔐</div>
        <h3 className="text-lg font-semibold text-green-800">Encryption Active</h3>
        <p className="text-sm text-green-600 mt-1">Your sensitive data is now protected</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-6 space-y-4">
      <div className="text-center">
        <div className="text-4xl mb-2">🔒</div>
        <h3 className="text-lg font-semibold">
          {mode === 'create' ? 'Set Up Encryption' : 'Unlock Encryption'}
        </h3>
        <p className="text-sm text-ink/60 mt-1">
          {mode === 'create'
            ? 'Create a password to encrypt sensitive data like calendar tokens and contacts'
            : 'Enter your password to decrypt your data'}
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-ink/70">Password</label>
          <input
            type="password"
            className="w-full mt-1 px-3 py-2 rounded border border-border bg-canvas text-sm"
            placeholder={mode === 'create' ? 'Create a strong password' : 'Enter your password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && mode === 'unlock') {
                handleUnlock();
              }
            }}
            autoFocus
          />
        </div>

        {mode === 'create' && (
          <div>
            <label className="text-sm font-medium text-ink/70">Confirm Password</label>
            <input
              type="password"
              className="w-full mt-1 px-3 py-2 rounded border border-border bg-canvas text-sm"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreate();
                }
              }}
            />
          </div>
        )}

        {error && (
          <div className="text-sm text-red-500 bg-red-50 p-2 rounded">{error}</div>
        )}

        <button
          type="button"
          className="w-full px-4 py-2 text-sm rounded bg-accent text-white hover:bg-accent/90 disabled:opacity-50"
          onClick={mode === 'create' ? handleCreate : handleUnlock}
          disabled={isLoading || !password}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">⏳</span>
              {mode === 'create' ? 'Setting up...' : 'Unlocking...'}
            </span>
          ) : mode === 'create' ? (
            'Enable Encryption'
          ) : (
            'Unlock'
          )}
        </button>

        {mode === 'unlock' && (
          <button
            type="button"
            className="w-full text-xs text-ink/50 hover:text-red-500 transition-colors"
            onClick={handleReset}
          >
            Forgot password? Reset encryption
          </button>
        )}
      </div>

      <div className="text-xs text-ink/40 border-t border-border pt-3">
        <p className="font-medium mb-1">What gets encrypted:</p>
        <ul className="space-y-0.5">
          <li>• Calendar access tokens</li>
          <li>• Emergency & VIP contacts</li>
          <li>• Email addresses</li>
        </ul>
        <p className="mt-2 text-ink/30">
          Your password never leaves your device. If you forget it, encrypted data cannot be recovered.
        </p>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Inline Status Component
// ----------------------------------------------------------------------------

export function EncryptionStatus() {
  const isActive = Encryption.isInitialized();
  const hasSetup = Encryption.hasSetup();

  if (!hasSetup) {
    return (
      <div className="flex items-center gap-2 text-xs text-amber-600">
        <span className="w-2 h-2 rounded-full bg-amber-500" />
        <span>Encryption not set up</span>
      </div>
    );
  }

  if (!isActive) {
    return (
      <div className="flex items-center gap-2 text-xs text-amber-600">
        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        <span>Encryption locked</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs text-green-600">
      <span className="w-2 h-2 rounded-full bg-green-500" />
      <span>Encryption active</span>
    </div>
  );
}
