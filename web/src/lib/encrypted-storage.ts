// ============================================================================
// ENCRYPTED STORAGE
// Wires encryption into actual data persistence
// ============================================================================

import { Encryption, type EncryptedData } from './encryption';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

interface EncryptedStorageItem {
  _encrypted: true;
  data: EncryptedData;
}

function isEncryptedItem(value: unknown): value is EncryptedStorageItem {
  return (
    typeof value === 'object' &&
    value !== null &&
    '_encrypted' in value &&
    (value as EncryptedStorageItem)._encrypted === true
  );
}

// ----------------------------------------------------------------------------
// Encrypted LocalStorage Wrapper
// ----------------------------------------------------------------------------

export const EncryptedStorage = {
  /**
   * Store a value with encryption (if encryption is initialized)
   */
  async setItem(key: string, value: unknown): Promise<void> {
    if (Encryption.isInitialized()) {
      const encrypted = await Encryption.encryptObject(value);
      const item: EncryptedStorageItem = { _encrypted: true, data: encrypted };
      localStorage.setItem(key, JSON.stringify(item));
    } else {
      // Fallback to plain storage
      localStorage.setItem(key, JSON.stringify(value));
    }
  },

  /**
   * Retrieve and decrypt a value
   */
  async getItem<T>(key: string): Promise<T | null> {
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    try {
      const parsed = JSON.parse(stored);

      if (isEncryptedItem(parsed)) {
        if (!Encryption.isInitialized()) {
          console.warn(`Cannot decrypt ${key}: encryption not initialized`);
          return null;
        }
        return await Encryption.decryptObject<T>(parsed.data);
      }

      // Plain value (not encrypted)
      return parsed as T;
    } catch (error) {
      console.error(`Failed to retrieve ${key}:`, error);
      return null;
    }
  },

  /**
   * Remove an item
   */
  removeItem(key: string): void {
    localStorage.removeItem(key);
  },

  /**
   * Check if a key exists and is encrypted
   */
  isEncrypted(key: string): boolean {
    const stored = localStorage.getItem(key);
    if (!stored) return false;
    try {
      const parsed = JSON.parse(stored);
      return isEncryptedItem(parsed);
    } catch {
      return false;
    }
  },

  /**
   * Migrate a plain value to encrypted
   */
  async migrate(key: string): Promise<boolean> {
    if (!Encryption.isInitialized()) return false;

    const stored = localStorage.getItem(key);
    if (!stored) return false;

    try {
      const parsed = JSON.parse(stored);
      if (isEncryptedItem(parsed)) return true; // Already encrypted

      // Encrypt and re-store
      await this.setItem(key, parsed);
      return true;
    } catch {
      return false;
    }
  },
};

// ----------------------------------------------------------------------------
// Sensitive Data Keys
// ----------------------------------------------------------------------------

export const SENSITIVE_KEYS = [
  'chronos_google_auth',
  'chronos-user', // Contains contacts
] as const;

/**
 * Migrate all sensitive data to encrypted storage
 */
export async function migrateSensitiveData(): Promise<void> {
  if (!Encryption.isInitialized()) {
    console.log('Encryption not initialized, skipping migration');
    return;
  }

  for (const key of SENSITIVE_KEYS) {
    const migrated = await EncryptedStorage.migrate(key);
    if (migrated) {
      console.log(`Migrated ${key} to encrypted storage`);
    }
  }
}

// ----------------------------------------------------------------------------
// Secure Token Storage (for OAuth)
// ----------------------------------------------------------------------------

export interface SecureTokens {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date;
  scope: string;
  email: string | null;
}

const TOKEN_KEY = 'chronos_secure_tokens';

export const SecureTokenStorage = {
  async save(tokens: SecureTokens): Promise<void> {
    await EncryptedStorage.setItem(TOKEN_KEY, tokens);
  },

  async load(): Promise<SecureTokens | null> {
    const tokens = await EncryptedStorage.getItem<SecureTokens>(TOKEN_KEY);
    if (!tokens) return null;

    // Restore Date object
    return {
      ...tokens,
      expiresAt: new Date(tokens.expiresAt),
    };
  },

  clear(): void {
    EncryptedStorage.removeItem(TOKEN_KEY);
  },

  isEncrypted(): boolean {
    return EncryptedStorage.isEncrypted(TOKEN_KEY);
  },
};

// ----------------------------------------------------------------------------
// Secure Contacts Storage
// ----------------------------------------------------------------------------

export interface SecureContacts {
  emergency: Array<{ id: string; name: string; email?: string; phone?: string }>;
  vip: Array<{ id: string; name: string; email?: string; phone?: string }>;
}

const CONTACTS_KEY = 'chronos_secure_contacts';

export const SecureContactsStorage = {
  async save(contacts: SecureContacts): Promise<void> {
    await EncryptedStorage.setItem(CONTACTS_KEY, contacts);
  },

  async load(): Promise<SecureContacts | null> {
    return EncryptedStorage.getItem<SecureContacts>(CONTACTS_KEY);
  },

  clear(): void {
    EncryptedStorage.removeItem(CONTACTS_KEY);
  },

  isEncrypted(): boolean {
    return EncryptedStorage.isEncrypted(CONTACTS_KEY);
  },
};
