// ============================================================================
// OAuth Callback Page
// Handles OAuth redirect from Google
// ============================================================================

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleOAuthCallback } from '../services/google-auth.service';

export function OAuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    handleOAuthCallback().then((success) => {
      if (success) {
        // Redirect to calendar page on success
        navigate('/calendar', { replace: true });
      } else {
        setError('Authentication failed. Please try again.');
      }
    });
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="text-4xl">❌</div>
          <h1 className="text-xl font-semibold text-ink">Authentication Failed</h1>
          <p className="text-ink/60">{error}</p>
          <button
            type="button"
            className="px-4 py-2 rounded bg-accent text-white hover:bg-accent/90"
            onClick={() => navigate('/calendar')}
          >
            Back to Calendar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
      <div className="text-center space-y-4">
        <div className="text-4xl animate-pulse">🔄</div>
        <h1 className="text-xl font-semibold text-ink">Connecting...</h1>
        <p className="text-ink/60">Please wait while we complete the connection.</p>
      </div>
    </div>
  );
}
