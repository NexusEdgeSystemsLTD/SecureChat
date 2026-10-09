import localforage from 'localforage';
import { Chat, CognitiveProfile, Message, PrivacySettings, StatusStory, UserProfile } from '../types';
import { encryptMessage, decryptMessage, computeFingerprint } from './crypto';

/**
 * Configure localforage IndexedDB instance for SecureChat.
 * Uses the client's native IndexedDB driver with fallback to WebSQL or LocalStorage.
 * Ensures high storage quota for cached message history, media assets, and offline state.
 */
export const secureChatVault = localforage.createInstance({
  name: 'SecureChatSovereignVault',
  storeName: 'encrypted_chat_records',
  description: 'IndexedDB persistent cache for end-to-end encrypted chat history and state',
  driver: [localforage.INDEXEDDB, localforage.WEBSQL, localforage.LOCALSTORAGE],
});

const VAULT_KEYS = {
  CHATS: 'vault_e2ee_chats',
  MESSAGES: 'vault_e2ee_messages',
  USER_PROFILE: 'vault_user_profile',
  PRIVACY: 'vault_privacy_settings',
  COGNITIVE: 'vault_cognitive_profile',
  STORIES: 'vault_ephemeral_stories',
  BIOMETRIC_LOCK: 'vault_biometric_security_config',
  OFFLINE_QUEUE: 'vault_offline_sync_queue',
  LAST_SYNC: 'vault_last_synced_timestamp',
};

export interface BiometricVaultConfig {
  isSecured: boolean;
  credentialId: string | null;
  enrolledAt: number;
  deviceLabel: string;
  requireBiometricOnOpen: boolean;
}

export const DEFAULT_BIOMETRIC_CONFIG: BiometricVaultConfig = {
  isSecured: false,
  credentialId: null,
  enrolledAt: 0,
  deviceLabel: 'Device Hardware Authenticator',
  requireBiometricOnOpen: false,
};

// ==================== CHAT CACHE ====================

export async function loadIndexedDbChats(): Promise<Chat[] | null> {
  try {
    const cached = await secureChatVault.getItem<Chat[]>(VAULT_KEYS.CHATS);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      return cached;
    }
  } catch (err) {
    console.warn('[IndexedDB localforage] Failed to read cached chats:', err);
  }
  return null;
}

export async function saveIndexedDbChats(chats: Chat[]): Promise<void> {
  try {
    await secureChatVault.setItem(VAULT_KEYS.CHATS, chats);
    await secureChatVault.setItem(VAULT_KEYS.LAST_SYNC, Date.now());
  } catch (err) {
    console.error('[IndexedDB localforage] Failed to save chats:', err);
  }
}

// ==================== MESSAGE HISTORY CACHE ====================

export async function loadIndexedDbMessages(): Promise<Record<string, Message[]> | null> {
  try {
    const cached = await secureChatVault.getItem<Record<string, Message[]>>(VAULT_KEYS.MESSAGES);
    if (cached && typeof cached === 'object' && Object.keys(cached).length > 0) {
      return cached;
    }
  } catch (err) {
    console.warn('[IndexedDB localforage] Failed to read cached messages:', err);
  }
  return null;
}

export async function saveIndexedDbMessages(messagesByChat: Record<string, Message[]>): Promise<void> {
  try {
    await secureChatVault.setItem(VAULT_KEYS.MESSAGES, messagesByChat);
    await secureChatVault.setItem(VAULT_KEYS.LAST_SYNC, Date.now());
  } catch (err) {
    console.error('[IndexedDB localforage] Failed to save messages:', err);
  }
}

// ==================== USER PROFILE CACHE ====================

export async function loadIndexedDbUserProfile(): Promise<UserProfile | null> {
  try {
    return await secureChatVault.getItem<UserProfile>(VAULT_KEYS.USER_PROFILE);
  } catch (err) {
    console.warn('[IndexedDB localforage] Failed to read user profile:', err);
    return null;
  }
}

export async function saveIndexedDbUserProfile(profile: UserProfile): Promise<void> {
  try {
    await secureChatVault.setItem(VAULT_KEYS.USER_PROFILE, profile);
  } catch (err) {
    console.error('[IndexedDB localforage] Failed to save user profile:', err);
  }
}

// ==================== PRIVACY SETTINGS CACHE ====================

export async function loadIndexedDbPrivacySettings(): Promise<PrivacySettings | null> {
  try {
    return await secureChatVault.getItem<PrivacySettings>(VAULT_KEYS.PRIVACY);
  } catch (err) {
    console.warn('[IndexedDB localforage] Failed to read privacy settings:', err);
    return null;
  }
}

export async function saveIndexedDbPrivacySettings(settings: PrivacySettings): Promise<void> {
  try {
    await secureChatVault.setItem(VAULT_KEYS.PRIVACY, settings);
  } catch (err) {
    console.error('[IndexedDB localforage] Failed to save privacy settings:', err);
  }
}

// ==================== COGNITIVE PROFILE CACHE ====================

export async function loadIndexedDbCognitiveProfile(): Promise<CognitiveProfile | null> {
  try {
    return await secureChatVault.getItem<CognitiveProfile>(VAULT_KEYS.COGNITIVE);
  } catch (err) {
    console.warn('[IndexedDB localforage] Failed to read cognitive profile:', err);
    return null;
  }
}

export async function saveIndexedDbCognitiveProfile(profile: CognitiveProfile): Promise<void> {
  try {
    await secureChatVault.setItem(VAULT_KEYS.COGNITIVE, profile);
  } catch (err) {
    console.error('[IndexedDB localforage] Failed to save cognitive profile:', err);
  }
}

// ==================== STORIES CACHE ====================

export async function loadIndexedDbStories(): Promise<StatusStory[] | null> {
  try {
    return await secureChatVault.getItem<StatusStory[]>(VAULT_KEYS.STORIES);
  } catch (err) {
    console.warn('[IndexedDB localforage] Failed to read stories:', err);
    return null;
  }
}

export async function saveIndexedDbStories(stories: StatusStory[]): Promise<void> {
  try {
    await secureChatVault.setItem(VAULT_KEYS.STORIES, stories);
  } catch (err) {
    console.error('[IndexedDB localforage] Failed to save stories:', err);
  }
}

// ==================== BIOMETRIC DATABASE LOCK (WEBAUTHN) ====================

export async function loadBiometricVaultConfig(): Promise<BiometricVaultConfig> {
  try {
    const config = await secureChatVault.getItem<BiometricVaultConfig>(VAULT_KEYS.BIOMETRIC_LOCK);
    if (config) return config;

    // Fallback to localStorage check if present
    const legacyCred = localStorage.getItem('securechat_webauthn_credential_id');
    const legacyEnabled = localStorage.getItem('securechat_biometric_db_lock_enabled') === 'true';
    if (legacyCred) {
      return {
        isSecured: legacyEnabled,
        credentialId: legacyCred,
        enrolledAt: Date.now(),
        deviceLabel: 'Device Biometric Authenticator',
        requireBiometricOnOpen: legacyEnabled,
      };
    }
  } catch (err) {
    console.warn('[IndexedDB localforage] Failed to read biometric config:', err);
  }
  return DEFAULT_BIOMETRIC_CONFIG;
}

export async function saveBiometricVaultConfig(config: BiometricVaultConfig): Promise<void> {
  try {
    await secureChatVault.setItem(VAULT_KEYS.BIOMETRIC_LOCK, config);
    localStorage.setItem('securechat_biometric_db_lock_enabled', config.isSecured ? 'true' : 'false');
    if (config.credentialId) {
      localStorage.setItem('securechat_webauthn_credential_id', config.credentialId);
    }
  } catch (err) {
    console.error('[IndexedDB localforage] Failed to save biometric config:', err);
  }
}

// ==================== ACTIVE CHAT & OFFLINE QUEUE CACHE ====================

export interface OfflineQueuedMessage {
  id: string;
  chatId: string;
  message: Message;
  queuedAt: number;
}

export async function loadOfflineQueue(): Promise<OfflineQueuedMessage[]> {
  try {
    const queue = await secureChatVault.getItem<OfflineQueuedMessage[]>(VAULT_KEYS.OFFLINE_QUEUE);
    return Array.isArray(queue) ? queue : [];
  } catch (err) {
    console.warn('[IndexedDB localforage] Failed to read offline queue:', err);
    return [];
  }
}

export async function addToOfflineQueue(item: OfflineQueuedMessage): Promise<void> {
  try {
    const queue = await loadOfflineQueue();
    queue.push(item);
    await secureChatVault.setItem(VAULT_KEYS.OFFLINE_QUEUE, queue);
  } catch (err) {
    console.error('[IndexedDB localforage] Failed to add to offline queue:', err);
  }
}

export async function removeFromOfflineQueue(messageId: string): Promise<void> {
  try {
    const queue = await loadOfflineQueue();
    const filtered = queue.filter((item) => item.id !== messageId);
    await secureChatVault.setItem(VAULT_KEYS.OFFLINE_QUEUE, filtered);
  } catch (err) {
    console.error('[IndexedDB localforage] Failed to remove from offline queue:', err);
  }
}

export async function clearOfflineQueue(): Promise<void> {
  try {
    await secureChatVault.setItem(VAULT_KEYS.OFFLINE_QUEUE, []);
  } catch (err) {
    console.error('[IndexedDB localforage] Failed to clear offline queue:', err);
  }
}

export async function saveIndexedDbActiveChatId(chatId: string): Promise<void> {
  try {
    await secureChatVault.setItem('vault_active_chat_id', chatId);
  } catch (err) {
    console.warn('[IndexedDB localforage] Failed to save active chat ID:', err);
  }
}

export async function loadIndexedDbActiveChatId(): Promise<string | null> {
  try {
    return await secureChatVault.getItem<string>('vault_active_chat_id');
  } catch {
    return null;
  }
}

// ==================== VAULT DIAGNOSTICS & STATS ====================

export interface IndexedDbVaultStats {
  driver: string;
  totalChatsCached: number;
  totalMessagesCached: number;
  lastSyncedTimestamp: number;
  isBiometricSecured: boolean;
  keysCount: number;
  isOfflineCapable: boolean;
}

export async function getIndexedDbVaultStats(): Promise<IndexedDbVaultStats> {
  try {
    const chats = (await secureChatVault.getItem<Chat[]>(VAULT_KEYS.CHATS)) || [];
    const messages = (await secureChatVault.getItem<Record<string, Message[]>>(VAULT_KEYS.MESSAGES)) || {};
    const bioConfig = await loadBiometricVaultConfig();
    const lastSync = (await secureChatVault.getItem<number>(VAULT_KEYS.LAST_SYNC)) || Date.now();
    const length = await secureChatVault.length();

    let totalMsgs = 0;
    Object.values(messages).forEach((arr) => {
      if (Array.isArray(arr)) totalMsgs += arr.length;
    });

    return {
      driver: secureChatVault.driver() || 'asyncStorage (IndexedDB)',
      totalChatsCached: chats.length,
      totalMessagesCached: totalMsgs,
      lastSyncedTimestamp: lastSync,
      isBiometricSecured: bioConfig.isSecured,
      keysCount: length,
      isOfflineCapable: true,
    };
  } catch (err) {
    console.warn('[IndexedDB localforage] Stats error:', err);
    return {
      driver: 'IndexedDB (Fallback)',
      totalChatsCached: 0,
      totalMessagesCached: 0,
      lastSyncedTimestamp: Date.now(),
      isBiometricSecured: false,
      keysCount: 0,
      isOfflineCapable: true,
    };
  }
}

/**
 * Irrevocably clears the local IndexedDB database and all cryptographic vaults
 */
export async function clearIndexedDbVault(): Promise<void> {
  try {
    await secureChatVault.clear();
  } catch (err) {
    console.error('[IndexedDB localforage] Failed to clear vault:', err);
  }
}

// ==================== ENCRYPTED VAULT BACKUP & OFFLINE MIGRATION ====================

export interface VaultExportResult {
  filename: string;
  totalChats: number;
  totalMessages: number;
  fileSizeBytes: number;
  timestamp: string;
  checksum: string;
}

export interface VaultImportResult {
  success: boolean;
  restoredChatsCount: number;
  restoredMessagesCount: number;
  restoredAt: number;
  chats: Chat[];
  messages: Record<string, Message[]>;
  error?: string;
}

/**
 * Securely bundles and exports the complete locally cached IndexedDB message vault
 * into an AES-256-GCM encrypted JSON backup file for manual offline migration and disaster recovery.
 */
export async function exportEncryptedIndexedDbVault(
  sharedSecret = 'SECURECHAT_SOVEREIGN_OFFLINE_VAULT_BACKUP_KEY_2026'
): Promise<VaultExportResult> {
  // Read all records currently cached in localforage IndexedDB
  const chats = (await secureChatVault.getItem<Chat[]>(VAULT_KEYS.CHATS)) || [];
  const messages = (await secureChatVault.getItem<Record<string, Message[]>>(VAULT_KEYS.MESSAGES)) || {};
  const userProfile = await secureChatVault.getItem<UserProfile>(VAULT_KEYS.USER_PROFILE);
  const privacySettings = await secureChatVault.getItem<PrivacySettings>(VAULT_KEYS.PRIVACY);
  const cognitiveProfile = await secureChatVault.getItem<CognitiveProfile>(VAULT_KEYS.COGNITIVE);
  const stories = (await secureChatVault.getItem<StatusStory[]>(VAULT_KEYS.STORIES)) || [];
  const offlineQueue = await loadOfflineQueue();
  const bioConfig = await loadBiometricVaultConfig();

  let totalMsgs = 0;
  Object.values(messages).forEach((arr) => {
    if (Array.isArray(arr)) totalMsgs += arr.length;
  });

  const rawVaultData = {
    schema: 'SECURECHAT_INDEXEDDB_VAULT_BACKUP',
    version: '2.0-E2EE-SOVEREIGN',
    exportedAt: Date.now(),
    isoTimestamp: new Date().toISOString(),
    metadata: {
      totalChats: chats.length,
      totalMessages: totalMsgs,
      storageDriver: secureChatVault.driver(),
      isBiometricSecured: bioConfig.isSecured,
    },
    data: {
      chats,
      messages,
      userProfile,
      privacySettings,
      cognitiveProfile,
      stories,
      offlineQueue,
      bioConfig,
    },
  };

  const serializedPlain = JSON.stringify(rawVaultData);
  const encryptedPayload = await encryptMessage(serializedPlain, sharedSecret);
  const checksum = await computeFingerprint(serializedPlain);

  const exportEnvelope = {
    vaultBackupVersion: '2.0-IndexedDB-E2EE',
    encryptionAlgorithm: 'AES-256-GCM+PBKDF2-SHA256',
    keyDerivationIterations: 100000,
    exportedAt: new Date().toISOString(),
    totalConversations: chats.length,
    totalMessages: totalMsgs,
    integrityChecksum: checksum,
    vaultPayload: encryptedPayload,
  };

  const envelopeJson = JSON.stringify(exportEnvelope, null, 2);
  const blob = new Blob([envelopeJson], { type: 'application/json' });
  const filename = `securechat-vault-backup-${Date.now()}.encrypted.json`;

  // Trigger client-side file download
  if (typeof window !== 'undefined') {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return {
    filename,
    totalChats: chats.length,
    totalMessages: totalMsgs,
    fileSizeBytes: blob.size,
    timestamp: new Date().toISOString(),
    checksum,
  };
}

/**
 * Decrypts and restores an encrypted IndexedDB JSON vault backup file,
 * restoring all conversations and message history into the local IndexedDB database.
 */
export async function importEncryptedIndexedDbVault(
  jsonFileContent: string,
  sharedSecret = 'SECURECHAT_SOVEREIGN_OFFLINE_VAULT_BACKUP_KEY_2026'
): Promise<VaultImportResult> {
  try {
    const envelope = JSON.parse(jsonFileContent);
    if (!envelope.vaultPayload || !envelope.vaultPayload.ciphertext) {
      throw new Error('Invalid vault backup format: missing cryptographic vaultPayload envelope.');
    }

    const decryptedPlain = await decryptMessage(envelope.vaultPayload, sharedSecret);
    const parsedData = JSON.parse(decryptedPlain);

    if (!parsedData.data || !Array.isArray(parsedData.data.chats)) {
      throw new Error('Malformed vault payload: expected valid chats array.');
    }

    const restoredChats: Chat[] = parsedData.data.chats || [];
    const restoredMessages: Record<string, Message[]> = parsedData.data.messages || {};

    // Persist restored records directly to localforage IndexedDB
    await saveIndexedDbChats(restoredChats);
    await saveIndexedDbMessages(restoredMessages);

    if (parsedData.data.userProfile) {
      await saveIndexedDbUserProfile(parsedData.data.userProfile);
    }
    if (parsedData.data.privacySettings) {
      await saveIndexedDbPrivacySettings(parsedData.data.privacySettings);
    }
    if (parsedData.data.stories) {
      await saveIndexedDbStories(parsedData.data.stories);
    }

    let msgCount = 0;
    Object.values(restoredMessages).forEach((arr) => {
      if (Array.isArray(arr)) msgCount += arr.length;
    });

    return {
      success: true,
      restoredChatsCount: restoredChats.length,
      restoredMessagesCount: msgCount,
      restoredAt: Date.now(),
      chats: restoredChats,
      messages: restoredMessages,
    };
  } catch (err: any) {
    console.error('[Import IndexedDB Vault Error]', err);
    return {
      success: false,
      restoredChatsCount: 0,
      restoredMessagesCount: 0,
      restoredAt: Date.now(),
      chats: [],
      messages: {},
      error: err.message || 'Failed to decrypt or restore vault backup.',
    };
  }
}
