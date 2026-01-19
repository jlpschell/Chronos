// ============================================================================
// ENCRYPTION SERVICE
// Client-side encryption for sensitive data at rest
// Uses Web Crypto API with AES-GCM
// ============================================================================

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

export interface EncryptedData {
  iv: string;        // Base64 encoded initialization vector
  data: string;      // Base64 encoded encrypted data
  version: number;   // Encryption version for future migrations
}

export interface EncryptionConfig {
  enabled: boolean;
  keyDerivationIterations: number;
}

const DEFAULT_CONFIG: EncryptionConfig = {
  enabled: true,
  keyDerivationIterations: 100000,
};

// Storage key for the salt
const SALT_KEY = 'chronos-encryption-salt';
const KEY_CHECK_KEY = 'chronos-encryption-check';

// ----------------------------------------------------------------------------
// Key Management
// ----------------------------------------------------------------------------

let derivedKey: CryptoKey | null = null;
let isInitialized = false;

/**
 * Get or create a salt for key derivation
 */
async function getOrCreateSalt(): Promise<Uint8Array> {
  const stored = localStorage.getItem(SALT_KEY);
  if (stored) {
    return Uint8Array.from(atob(stored), (c) => c.charCodeAt(0));
  }

  const salt = crypto.getRandomValues(new Uint8Array(16));
  localStorage.setItem(SALT_KEY, btoa(String.fromCharCode(...salt)));
  return salt;
}

/**
 * Derive an encryption key from a password
 */
async function deriveKey(
  password: string,
  salt: Uint8Array,
  iterations: number = DEFAULT_CONFIG.keyDerivationIterations
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Initialize encryption with a password
 * Returns true if successful, false if password is wrong (for existing data)
 */
export async function initializeEncryption(password: string): Promise<boolean> {
  try {
    const salt = await getOrCreateSalt();
    derivedKey = await deriveKey(password, salt);

    // Check if we have existing encrypted data
    const checkValue = localStorage.getItem(KEY_CHECK_KEY);
    if (checkValue) {
      // Verify the password by trying to decrypt the check value
      try {
        const decrypted = await decrypt(JSON.parse(checkValue));
        if (decrypted !== 'chronos-key-check') {
          derivedKey = null;
          return false;
        }
      } catch {
        derivedKey = null;
        return false;
      }
    } else {
      // First time setup - store a check value
      const encrypted = await encrypt('chronos-key-check');
      localStorage.setItem(KEY_CHECK_KEY, JSON.stringify(encrypted));
    }

    isInitialized = true;
    return true;
  } catch (error) {
    console.error('Encryption initialization failed:', error);
    derivedKey = null;
    return false;
  }
}

/**
 * Check if encryption is initialized
 */
export function isEncryptionInitialized(): boolean {
  return isInitialized && derivedKey !== null;
}

/**
 * Check if encryption has been set up (password exists)
 */
export function hasEncryptionSetup(): boolean {
  return localStorage.getItem(KEY_CHECK_KEY) !== null;
}

/**
 * Clear encryption (for password reset)
 */
export function clearEncryption(): void {
  localStorage.removeItem(SALT_KEY);
  localStorage.removeItem(KEY_CHECK_KEY);
  derivedKey = null;
  isInitialized = false;
}

// ----------------------------------------------------------------------------
// Encryption / Decryption
// ----------------------------------------------------------------------------

/**
 * Encrypt a string value
 */
export async function encrypt(plaintext: string): Promise<EncryptedData> {
  if (!derivedKey) {
    throw new Error('Encryption not initialized. Call initializeEncryption first.');
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    derivedKey,
    data
  );

  return {
    iv: btoa(String.fromCharCode(...iv)),
    data: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    version: 1,
  };
}

/**
 * Decrypt an encrypted value
 */
export async function decrypt(encrypted: EncryptedData): Promise<string> {
  if (!derivedKey) {
    throw new Error('Encryption not initialized. Call initializeEncryption first.');
  }

  const iv = Uint8Array.from(atob(encrypted.iv), (c) => c.charCodeAt(0));
  const data = Uint8Array.from(atob(encrypted.data), (c) => c.charCodeAt(0));

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    derivedKey,
    data
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * Encrypt an object (serializes to JSON first)
 */
export async function encryptObject<T>(obj: T): Promise<EncryptedData> {
  return encrypt(JSON.stringify(obj));
}

/**
 * Decrypt to an object
 */
export async function decryptObject<T>(encrypted: EncryptedData): Promise<T> {
  const json = await decrypt(encrypted);
  return JSON.parse(json);
}

// ----------------------------------------------------------------------------
// Field-Level Encryption Helpers
// ----------------------------------------------------------------------------

/**
 * Fields that should be encrypted at rest
 */
export const SENSITIVE_FIELDS = [
  'accessToken',
  'refreshToken',
  'email',
  'phone',
  'emergencyContacts',
  'vipContacts',
] as const;

export type SensitiveField = typeof SENSITIVE_FIELDS[number];

/**
 * Check if a field should be encrypted
 */
export function isSensitiveField(field: string): boolean {
  return SENSITIVE_FIELDS.includes(field as SensitiveField);
}

/**
 * Encrypt sensitive fields in an object
 */
export async function encryptSensitiveFields<T extends Record<string, unknown>>(
  obj: T
): Promise<T> {
  if (!isEncryptionInitialized()) {
    return obj; // Return as-is if encryption not set up
  }

  const result = { ...obj };

  for (const field of SENSITIVE_FIELDS) {
    if (field in result && result[field] !== null && result[field] !== undefined) {
      const value = result[field];
      const encrypted = await encryptObject(value);
      (result as Record<string, unknown>)[`_encrypted_${field}`] = encrypted;
      delete (result as Record<string, unknown>)[field];
    }
  }

  return result;
}

/**
 * Decrypt sensitive fields in an object
 */
export async function decryptSensitiveFields<T extends Record<string, unknown>>(
  obj: T
): Promise<T> {
  if (!isEncryptionInitialized()) {
    return obj; // Return as-is if encryption not set up
  }

  const result = { ...obj };

  for (const field of SENSITIVE_FIELDS) {
    const encryptedKey = `_encrypted_${field}`;
    if (encryptedKey in result && result[encryptedKey]) {
      try {
        const decrypted = await decryptObject(result[encryptedKey] as EncryptedData);
        (result as Record<string, unknown>)[field] = decrypted;
        delete (result as Record<string, unknown>)[encryptedKey];
      } catch (error) {
        console.error(`Failed to decrypt field ${field}:`, error);
      }
    }
  }

  return result;
}

// ----------------------------------------------------------------------------
// Exports
// ----------------------------------------------------------------------------

export const Encryption = {
  initialize: initializeEncryption,
  isInitialized: isEncryptionInitialized,
  hasSetup: hasEncryptionSetup,
  clear: clearEncryption,
  encrypt,
  decrypt,
  encryptObject,
  decryptObject,
  encryptSensitiveFields,
  decryptSensitiveFields,
  isSensitiveField,
  SENSITIVE_FIELDS,
};
