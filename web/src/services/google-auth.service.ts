// ============================================================================
// GOOGLE AUTH SERVICE
// OAuth 2.0 flow for Google Calendar access
// ============================================================================

import { CALENDAR_CONFIG } from '../lib/config';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

export interface GoogleTokens {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date;
  scope: string;
}

export interface GoogleAuthState {
  isAuthenticated: boolean;
  tokens: GoogleTokens | null;
  userEmail: string | null;
  error: string | null;
}

// ----------------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------------

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

const STORAGE_KEY = 'chronos_google_auth';

// ----------------------------------------------------------------------------
// Auth State Management
// ----------------------------------------------------------------------------

let authState: GoogleAuthState = {
  isAuthenticated: false,
  tokens: null,
  userEmail: null,
  error: null,
};

const listeners = new Set<(state: GoogleAuthState) => void>();

function notifyListeners() {
  listeners.forEach((listener) => listener(authState));
}

export function subscribeToAuth(listener: (state: GoogleAuthState) => void): () => void {
  listeners.add(listener);
  listener(authState); // Immediate callback with current state
  return () => listeners.delete(listener);
}

export function getAuthState(): GoogleAuthState {
  return authState;
}

// ----------------------------------------------------------------------------
// Token Storage
// ----------------------------------------------------------------------------

function saveTokens(tokens: GoogleTokens, email: string | null) {
  const data = { tokens, email };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  
  authState = {
    isAuthenticated: true,
    tokens,
    userEmail: email,
    error: null,
  };
  notifyListeners();
}

function clearTokens() {
  localStorage.removeItem(STORAGE_KEY);
  
  authState = {
    isAuthenticated: false,
    tokens: null,
    userEmail: null,
    error: null,
  };
  notifyListeners();
}

export function loadStoredAuth(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return false;

    const { tokens, email } = JSON.parse(stored);
    
    // Check if token is expired
    const expiresAt = new Date(tokens.expiresAt);
    if (expiresAt <= new Date()) {
      // Token expired, clear it
      clearTokens();
      return false;
    }

    authState = {
      isAuthenticated: true,
      tokens: {
        ...tokens,
        expiresAt,
      },
      userEmail: email,
      error: null,
    };
    notifyListeners();
    return true;
  } catch {
    clearTokens();
    return false;
  }
}

// ----------------------------------------------------------------------------
// OAuth Flow
// ----------------------------------------------------------------------------

function getClientId(): string {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error('VITE_GOOGLE_CLIENT_ID not configured. See docs/CALENDAR_SETUP.md');
  }
  return clientId;
}

function getRedirectUri(): string {
  return `${window.location.origin}/oauth/callback`;
}

export function initiateGoogleAuth() {
  const clientId = getClientId();
  const redirectUri = getRedirectUri();
  const scopes = CALENDAR_CONFIG.google.scopes.join(' ');

  // Generate state for CSRF protection
  const state = crypto.randomUUID();
  sessionStorage.setItem('oauth_state', state);

  // Build auth URL
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'token', // Implicit flow for SPA
    scope: scopes,
    state,
    access_type: 'online',
    prompt: 'consent',
  });

  // Redirect to Google
  window.location.href = `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function handleOAuthCallback(): Promise<boolean> {
  // Check for token in URL hash (implicit flow)
  const hash = window.location.hash.substring(1);
  if (!hash) return false;

  const params = new URLSearchParams(hash);
  
  // Verify state
  const state = params.get('state');
  const storedState = sessionStorage.getItem('oauth_state');
  sessionStorage.removeItem('oauth_state');

  if (state !== storedState) {
    authState = { ...authState, error: 'OAuth state mismatch. Please try again.' };
    notifyListeners();
    return false;
  }

  const accessToken = params.get('access_token');
  const expiresIn = params.get('expires_in');
  const scope = params.get('scope') || '';

  if (!accessToken) {
    const error = params.get('error') || 'No access token received';
    authState = { ...authState, error };
    notifyListeners();
    return false;
  }

  // Calculate expiry
  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + parseInt(expiresIn || '3600', 10));

  // Get user email
  let email: string | null = null;
  try {
    const userInfo = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (userInfo.ok) {
      const data = await userInfo.json();
      email = data.email;
    }
  } catch {
    // Email fetch failed, continue without it
  }

  // Save tokens
  saveTokens(
    {
      accessToken,
      refreshToken: null, // Implicit flow doesn't provide refresh token
      expiresAt,
      scope,
    },
    email
  );

  // Clear the hash from URL
  window.history.replaceState(null, '', window.location.pathname);

  return true;
}

export function signOut() {
  clearTokens();
}

// ----------------------------------------------------------------------------
// Token Access
// ----------------------------------------------------------------------------

export function getAccessToken(): string | null {
  if (!authState.tokens) return null;
  
  // Check if expired
  if (authState.tokens.expiresAt <= new Date()) {
    clearTokens();
    return null;
  }

  return authState.tokens.accessToken;
}

export function isTokenExpiringSoon(): boolean {
  if (!authState.tokens) return false;
  
  const fiveMinutes = 5 * 60 * 1000;
  const expiresAt = authState.tokens.expiresAt.getTime();
  return expiresAt - Date.now() < fiveMinutes;
}
