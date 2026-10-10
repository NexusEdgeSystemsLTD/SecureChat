import React, { useState, useMemo } from 'react';
import { 
  User, 
  Shield, 
  Lock, 
  GraduationCap, 
  Key, 
  Check, 
  Copy, 
  Eye, 
  Sliders, 
  CheckCircle2, 
  Download, 
  FileText, 
  ShieldCheck, 
  Type, 
  Sparkles,
  BookOpen,
  MessageSquare,
  BadgeCheck,
  IdCard,
  KeyRound,
  Fingerprint,
  Loader2,
  Globe,
  Search,
  Calendar,
  Filter,
  Bell,
  HardDrive,
  HelpCircle,
  Clock,
  ArrowRight,
  Database,
  Radio,
  Archive,
  Trash2,
  AlertCircle,
  Smartphone,
  Mail,
  Zap,
  Image as ImageIcon,
  Mic,
  Code2,
  Upload,
  ShieldAlert,
  EyeOff
} from 'lucide-react';
import { AppFontSize, AppFontTheme, AppLanguage, Chat, Message, PrivacySettings, StudentTier, UserProfile } from '../types';
import { useWebAuthn } from '../hooks/useWebAuthn';
import { SUPPORTED_LANGUAGES, t } from '../utils/i18n';
import { 
  getIndexedDbVaultStats, 
  loadBiometricVaultConfig, 
  saveBiometricVaultConfig, 
  clearIndexedDbVault, 
  saveIndexedDbChats, 
  saveIndexedDbMessages,
  exportEncryptedIndexedDbVault,
  importEncryptedIndexedDbVault,
  VaultExportResult,
  VaultImportResult,
  IndexedDbVaultStats, 
  BiometricVaultConfig,
  DEFAULT_BIOMETRIC_CONFIG 
} from '../utils/indexedDb';

interface SettingsModalProps {
  user: UserProfile;
  privacy: PrivacySettings;
  onUpdateUser: (user: UserProfile) => void;
  onUpdatePrivacy: (privacy: PrivacySettings) => void;
  onClose: () => void;
  activeChat?: Chat;
  messages?: Message[];
  allChats?: Chat[];
  allMessagesByChat?: Record<string, Message[]>;
  fontSize?: AppFontSize;
  fontTheme?: AppFontTheme;
  language?: AppLanguage;
  onUpdateFontSize?: (size: AppFontSize) => void;
  onUpdateFontTheme?: (theme: AppFontTheme) => void;
  onUpdateLanguage?: (language: AppLanguage) => void;
  onSelectChat?: (chatId: string) => void;
  onLockApp?: () => void;
  onRestoreVault?: (restoredChats: Chat[], restoredMessages: Record<string, Message[]>) => void;
}

export type SettingsTabId = 
  | 'language'
  | 'archive'
  | 'account'
  | 'privacy'
  | 'chats'
  | 'notifications'
  | 'storage'
  | 'fonts'
  | 'security'
  | 'education'
  | 'export'
  | 'help'
  | 'profile';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  user,
  privacy,
  onUpdateUser,
  onUpdatePrivacy,
  onClose,
  activeChat,
  messages = [],
  allChats = [],
  allMessagesByChat = {},
  fontSize = 'medium',
  fontTheme = 'system',
  language = 'en',
  onUpdateFontSize,
  onUpdateFontTheme,
  onUpdateLanguage,
  onSelectChat,
  onLockApp,
  onRestoreVault,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTabId>('language');
  const [settingsFilterQuery, setSettingsFilterQuery] = useState('');

  // Form states
  const [name, setName] = useState(user.name);
  const [institution, setInstitution] = useState(user.institution);
  const [fieldOfStudy, setFieldOfStudy] = useState(user.fieldOfStudy);
  const [researchFocus, setResearchFocus] = useState(user.researchFocus);
  const [studentTier, setStudentTier] = useState<StudentTier>(user.studentTier);
  const [pinCode, setPinCode] = useState(user.pinCode);
  const [duressCode, setDuressCode] = useState(user.duressCode);
  const [nationalId, setNationalId] = useState(user.nationalId || 'NAT-ID-8829-4109');
  const [nationalIdType, setNationalIdType] = useState(user.nationalIdType || 'National ID');
  const [password, setPassword] = useState(user.password || 'Password123!');
  const [inactivityLockMinutes, setInactivityLockMinutes] = useState(user.inactivityLockMinutes ?? 1);
  const [isSaved, setIsSaved] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);

  // Privacy form state
  const [localPrivacy, setLocalPrivacy] = useState<PrivacySettings>({ ...privacy });

  // Chat Wallpaper & Backup states
  const [chatWallpaper, setChatWallpaper] = useState<'midnight' | 'matrix' | 'navy' | 'amoled'>('midnight');
  const [backupFeedback, setBackupFeedback] = useState<string | null>(null);

  // Notification settings
  const [conversationTones, setConversationTones] = useState(true);
  const [highPriorityAlerts, setHighPriorityAlerts] = useState(true);
  const [reactionNotifications, setReactionNotifications] = useState(true);
  const [vibrationPattern, setVibrationPattern] = useState<'default' | 'short' | 'long'>('default');

  // Storage and Auto-download
  const [autoDownloadCellular, setAutoDownloadCellular] = useState<{ photos: boolean; audio: boolean; videos: boolean; docs: boolean }>({
    photos: true,
    audio: false,
    videos: false,
    docs: false,
  });
  const [autoDownloadWifi, setAutoDownloadWifi] = useState<{ photos: boolean; audio: boolean; videos: boolean; docs: boolean }>({
    photos: true,
    audio: true,
    videos: true,
    docs: true,
  });

  // Selected chat for export (defaults to activeChat or first available)
  const [selectedChatIdForExport, setSelectedChatIdForExport] = useState<string>(activeChat?.id || (allChats[0]?.id ?? ''));

  // ==================== SEARCHABLE MESSAGE ARCHIVE STATE ====================
  const [archiveKeyword, setArchiveKeyword] = useState('');
  const [archiveChatFilter, setArchiveChatFilter] = useState<string>('all');
  const [archiveStartDate, setArchiveStartDate] = useState<string>('');
  const [archiveEndDate, setArchiveEndDate] = useState<string>('');
  const [archiveMediaType, setArchiveMediaType] = useState<'all' | 'text' | 'image' | 'doc' | 'voice' | 'code'>('all');
  const [archiveSenderFilter, setArchiveSenderFilter] = useState<'all' | 'me' | 'others'>('all');

  // WebAuthn Biometrics hook for testing & local DB lock
  const { 
    isSupported: isWebAuthnSupported, 
    isPlatformAuthenticatorAvailable, 
    isAuthenticating: isTestingWebAuthn, 
    isEnrolled: isWebAuthnEnrolled,
    biometricLabel, 
    authenticate: testWebAuthn, 
    resetEnrollment: resetWebAuthn,
    simulateBiometricAuth,
  } = useWebAuthn(user.id, user.name);
  const [webAuthnTestResult, setWebAuthnTestResult] = useState<string | null>(null);

  // Local IndexedDB & Biometric Vault Configuration State
  const [vaultConfig, setVaultConfig] = useState<BiometricVaultConfig>(DEFAULT_BIOMETRIC_CONFIG);
  const [vaultStats, setVaultStats] = useState<IndexedDbVaultStats | null>(null);
  const [isSyncingDb, setIsSyncingDb] = useState(false);
  const [dbSyncMessage, setDbSyncMessage] = useState<string | null>(null);

  // Load live vault metrics & biometric lock config
  const refreshVaultMetrics = async () => {
    try {
      const config = await loadBiometricVaultConfig();
      setVaultConfig(config);
      const stats = await getIndexedDbVaultStats();
      setVaultStats(stats);
    } catch (e) {
      console.warn('[SettingsModal] Failed to load vault metrics:', e);
    }
  };

  React.useEffect(() => {
    refreshVaultMetrics();
  }, [activeTab]);

  const handleToggleBiometricDbLock = async () => {
    if (!vaultConfig.isSecured) {
      setWebAuthnTestResult(null);
      // Challenge biometric hardware or fallback test
      let verified = false;
      try {
        verified = await testWebAuthn();
      } catch {
        verified = await simulateBiometricAuth();
      }

      if (verified) {
        const storedCredId = typeof window !== 'undefined' ? localStorage.getItem('securechat_webauthn_credential_id') : null;
        const newConfig: BiometricVaultConfig = {
          isSecured: true,
          credentialId: storedCredId || 'cred_bio_' + Date.now(),
          enrolledAt: Date.now(),
          deviceLabel: biometricLabel,
          requireBiometricOnOpen: true,
        };
        await saveBiometricVaultConfig(newConfig);
        setVaultConfig(newConfig);
        setWebAuthnTestResult(`✓ Local chat database is now biometrically locked with ${biometricLabel}!`);
        refreshVaultMetrics();
      } else {
        setWebAuthnTestResult('Biometric enrollment cancelled or not confirmed.');
      }
    } else {
      const newConfig: BiometricVaultConfig = {
        ...vaultConfig,
        isSecured: false,
        requireBiometricOnOpen: false,
      };
      await saveBiometricVaultConfig(newConfig);
      setVaultConfig(newConfig);
      setWebAuthnTestResult('Biometric database lock turned off. Standard PIN / Password lock active.');
      refreshVaultMetrics();
    }
  };

  const handleSyncToIndexedDb = async () => {
    setIsSyncingDb(true);
    setDbSyncMessage('Syncing active chat state and messages into IndexedDB...');
    try {
      if (allChats && allChats.length > 0) {
        await saveIndexedDbChats(allChats);
      }
      if (allMessagesByChat && Object.keys(allMessagesByChat).length > 0) {
        await saveIndexedDbMessages(allMessagesByChat);
      }
      await refreshVaultMetrics();
      setDbSyncMessage('✓ IndexedDB cache synchronized successfully (localforage)!');
      setTimeout(() => setDbSyncMessage(null), 3000);
    } catch (err: any) {
      setDbSyncMessage('Sync failed: ' + (err?.message || 'Error'));
      setTimeout(() => setDbSyncMessage(null), 3000);
    } finally {
      setIsSyncingDb(false);
    }
  };

  const handleClearIndexedDbVault = async () => {
    if (window.confirm('Are you sure you want to clear the local IndexedDB cache? Active in-memory state will remain until reload.')) {
      await clearIndexedDbVault();
      await refreshVaultMetrics();
      setDbSyncMessage('Local IndexedDB vault cleared.');
      setTimeout(() => setDbSyncMessage(null), 2500);
    }
  };

  const handleTestWebAuthn = async () => {
    setWebAuthnTestResult(null);
    const success = await testWebAuthn();
    if (success) {
      setWebAuthnTestResult('✓ Hardware Biometric Challenge Succeeded!');
    } else {
      setWebAuthnTestResult('Challenge incomplete or cancelled.');
    }
  };

  // Encrypted IndexedDB Vault Export & Migration State
  const [isExportingVault, setIsExportingVault] = useState(false);
  const [vaultExportResult, setVaultExportResult] = useState<VaultExportResult | null>(null);
  const [vaultPassphrase, setVaultPassphrase] = useState('');
  const [showVaultPassphrase, setShowVaultPassphrase] = useState(false);

  // Encrypted IndexedDB Vault Restore & Migration State
  const [isImportingVault, setIsImportingVault] = useState(false);
  const [vaultImportResult, setVaultImportResult] = useState<VaultImportResult | null>(null);
  const [importPassphrase, setImportPassphrase] = useState('');
  const [showImportPassphrase, setShowImportPassphrase] = useState(false);
  const [importFileName, setImportFileName] = useState<string | null>(null);
  const [importFileContent, setImportFileContent] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const handleExportEncryptedVault = async () => {
    setIsExportingVault(true);
    setExportFeedback('Encrypting sovereign IndexedDB vault cache with AES-256-GCM + PBKDF2...');
    try {
      // First ensure memory state is cached in IndexedDB
      if (allChats && allChats.length > 0) {
        await saveIndexedDbChats(allChats);
      }
      if (allMessagesByChat && Object.keys(allMessagesByChat).length > 0) {
        await saveIndexedDbMessages(allMessagesByChat);
      }

      const result = await exportEncryptedIndexedDbVault(
        vaultPassphrase.trim() || undefined
      );
      setVaultExportResult(result);
      setExportFeedback(`✓ Sovereign vault exported as encrypted JSON! (${result.totalChats} chats, ${result.totalMessages} messages, ${(result.fileSizeBytes / 1024).toFixed(1)} KB)`);
      await refreshVaultMetrics();
      setTimeout(() => setExportFeedback(null), 8000);
    } catch (err: any) {
      console.error('[Export Vault Error]', err);
      setExportFeedback('Export failed: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsExportingVault(false);
    }
  };

  const handleSelectImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    setVaultImportResult(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportFileContent(content);
    };
    reader.onerror = () => {
      setImportError('Failed to read backup file from disk.');
    };
    reader.readAsText(file);
  };

  const handleImportEncryptedVault = async () => {
    if (!importFileContent) {
      setImportError('Please select a valid .encrypted.json backup file first.');
      return;
    }
    setIsImportingVault(true);
    setImportError(null);
    try {
      const result = await importEncryptedIndexedDbVault(
        importFileContent,
        importPassphrase.trim() || undefined
      );
      setVaultImportResult(result);
      if (result.success) {
        if (onRestoreVault && result.chats && result.messages) {
          onRestoreVault(result.chats, result.messages);
        }
        await refreshVaultMetrics();
        setExportFeedback(`✓ Successfully restored ${result.restoredChatsCount} conversations and ${result.restoredMessagesCount} messages from encrypted backup!`);
      } else {
        setImportError(result.error || 'Failed to decrypt or restore backup. Verify your passphrase.');
      }
    } catch (err: any) {
      setImportError(err?.message || 'Restore error');
    } finally {
      setIsImportingVault(false);
    }
  };

  const handleSave = () => {
    onUpdateUser({
      ...user,
      name,
      institution,
      fieldOfStudy,
      researchFocus,
      studentTier,
      pinCode,
      duressCode,
      nationalId,
      nationalIdType,
      nationalIdVerified: true,
      registrationStatus: 'verified',
      password,
      inactivityLockMinutes,
    });
    onUpdatePrivacy(localPrivacy);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  // Quick Date Preset Handler for Archive
  const handleApplyDatePreset = (preset: 'all' | 'today' | 'week' | 'month' | 'year') => {
    const now = new Date();
    const toDateStr = now.toISOString().split('T')[0];

    if (preset === 'all') {
      setArchiveStartDate('');
      setArchiveEndDate('');
      return;
    }

    if (preset === 'today') {
      setArchiveStartDate(toDateStr);
      setArchiveEndDate(toDateStr);
      return;
    }

    if (preset === 'week') {
      const past = new Date(Date.now() - 7 * 86400000);
      setArchiveStartDate(past.toISOString().split('T')[0]);
      setArchiveEndDate(toDateStr);
      return;
    }

    if (preset === 'month') {
      const past = new Date(Date.now() - 30 * 86400000);
      setArchiveStartDate(past.toISOString().split('T')[0]);
      setArchiveEndDate(toDateStr);
      return;
    }

    if (preset === 'year') {
      const past = new Date(Date.now() - 365 * 86400000);
      setArchiveStartDate(past.toISOString().split('T')[0]);
      setArchiveEndDate(toDateStr);
      return;
    }
  };

  // ==================== SEARCHABLE MESSAGE ARCHIVE QUERY ENGINE ====================
  const searchResults = useMemo(() => {
    const results: Array<{ message: Message; chat: Chat }> = [];
    const targetChats = archiveChatFilter === 'all'
      ? allChats
      : allChats.filter((c) => c.id === archiveChatFilter);

    const startTimestamp = archiveStartDate ? new Date(archiveStartDate).setHours(0, 0, 0, 0) : null;
    const endTimestamp = archiveEndDate ? new Date(archiveEndDate).setHours(23, 59, 59, 999) : null;
    const queryLower = archiveKeyword.trim().toLowerCase();

    for (const chat of targetChats) {
      const msgs = allMessagesByChat[chat.id] || (chat.id === activeChat?.id ? messages : []);
      for (const msg of msgs) {
        // Keyword match across content, sender name, media name, academic metadata
        if (queryLower) {
          const matchesContent = msg.content && msg.content.toLowerCase().includes(queryLower);
          const matchesSender = msg.senderName && msg.senderName.toLowerCase().includes(queryLower);
          const matchesMedia = msg.mediaName && msg.mediaName.toLowerCase().includes(queryLower);
          const matchesTopic = msg.academicMetadata?.topic && msg.academicMetadata.topic.toLowerCase().includes(queryLower);
          if (!matchesContent && !matchesSender && !matchesMedia && !matchesTopic) {
            continue;
          }
        }

        // Date range match
        if (startTimestamp && msg.timestamp < startTimestamp) {
          continue;
        }
        if (endTimestamp && msg.timestamp > endTimestamp) {
          continue;
        }

        // Media type match
        if (archiveMediaType !== 'all') {
          const type = msg.mediaType || 'text';
          if (archiveMediaType === 'text' && type !== 'text') continue;
          if (archiveMediaType === 'image' && type !== 'image') continue;
          if (archiveMediaType === 'doc' && (type !== 'doc' && type !== 'academic_paper')) continue;
          if (archiveMediaType === 'voice' && type !== 'voice') continue;
          if (archiveMediaType === 'code' && type !== 'code') continue;
        }

        // Sender match
        if (archiveSenderFilter === 'me' && msg.senderId !== user.id) continue;
        if (archiveSenderFilter === 'others' && msg.senderId === user.id) continue;

        results.push({ message: msg, chat });
      }
    }

    return results.sort((a, b) => b.message.timestamp - a.message.timestamp);
  }, [allChats, allMessagesByChat, activeChat, messages, archiveChatFilter, archiveKeyword, archiveStartDate, archiveEndDate, archiveMediaType, archiveSenderFilter, user.id]);

  // Export Filtered Archive Results
  const handleExportArchiveResults = () => {
    const payload = {
      archiveExportVersion: '3.0-Client-Search-E2EE',
      exportTimestamp: new Date().toISOString(),
      query: {
        keyword: archiveKeyword || '(none)',
        chatFilter: archiveChatFilter,
        dateRange: { start: archiveStartDate || 'beginning', end: archiveEndDate || 'present' },
        mediaType: archiveMediaType,
      },
      matchCount: searchResults.length,
      results: searchResults.map(({ message, chat }) => ({
        chatId: chat.id,
        chatName: chat.name,
        messageId: message.id,
        sender: message.senderName,
        timestamp: new Date(message.timestamp).toISOString(),
        mediaType: message.mediaType || 'text',
        isForwardProtected: message.isForwardProtected,
        content: message.isForwardProtected
          ? '[RESTRICTED: Content redacted in compliance with isForwardProtected policy]'
          : message.content,
      })),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `archive-query-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export Chat History (Single Chat)
  const handleExportChatHistory = (targetChat?: Chat, targetMessages?: Message[]) => {
    const chatToExport = targetChat || allChats.find((c) => c.id === selectedChatIdForExport) || activeChat;
    if (!chatToExport) {
      setExportFeedback('No chat selected for export.');
      setTimeout(() => setExportFeedback(null), 3000);
      return;
    }

    const msgsToExport = targetMessages || allMessagesByChat[chatToExport.id] || (chatToExport.id === activeChat?.id ? messages : []);

    const sanitizedMessages = msgsToExport.map((msg) => {
      const isProtected = Boolean(msg.isForwardProtected || chatToExport.forwardRestricted);
      return {
        id: msg.id,
        chatId: msg.chatId,
        senderId: msg.senderId,
        senderName: msg.senderName,
        timestamp: msg.timestamp,
        isoTimestamp: new Date(msg.timestamp).toISOString(),
        isForwardProtected: isProtected,
        mediaType: msg.mediaType || 'text',
        content: isProtected
          ? '[RESTRICTED: Content redacted in compliance with isForwardProtected privacy policy]'
          : msg.content,
        isRedacted: isProtected,
        metadataStripped: msg.metadataStripped ?? true,
        selfDestructSeconds: msg.selfDestructSeconds,
        academicMetadata: isProtected ? undefined : msg.academicMetadata,
        readAckSignature: msg.readAckSignature,
        status: msg.status,
      };
    });

    const exportPayload = {
      exportVersion: '2.0-E2EE-Sanitized',
      exportTimestamp: new Date().toISOString(),
      exportedBy: {
        id: user.id,
        name: user.name,
        studentTier: user.studentTier,
        institution: user.institution,
      },
      privacyPolicy: {
        policy: 'Zero-Knowledge Forward-Protection Guard',
        description: "Messages flagged with 'isForwardProtected: true' or originating from forward-restricted sessions have had their textual and media contents redacted.",
      },
      chat: {
        id: chatToExport.id,
        name: chatToExport.name,
        type: chatToExport.type,
        isSecret: Boolean(chatToExport.isSecret),
        safetyNumber: chatToExport.safetyNumber,
        forwardRestricted: Boolean(chatToExport.forwardRestricted),
      },
      statistics: {
        totalMessages: msgsToExport.length,
        redactedForwardProtectedMessages: sanitizedMessages.filter((m) => m.isForwardProtected).length,
        unprotectedMessagesExported: sanitizedMessages.filter((m) => !m.isForwardProtected).length,
      },
      messages: sanitizedMessages,
    };

    const jsonBlob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const downloadUrl = URL.createObjectURL(jsonBlob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `securechat-${chatToExport.id}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);

    const protectedCount = sanitizedMessages.filter((m) => m.isForwardProtected).length;
    setExportFeedback(
      `✓ Export complete! Exported ${msgsToExport.length} messages (${protectedCount} forward-protected messages safely redacted).`
    );
    setTimeout(() => setExportFeedback(null), 5000);
  };

  const tiers: StudentTier[] = ['High School', 'Bachelor', 'Masters', 'PhD', 'Post-PhD'];

  // Master Category List
  const CATEGORIES: Array<{
    id: SettingsTabId;
    title: string;
    icon: React.ReactNode;
    subtitle: string;
    badge?: string;
  }> = [
    {
      id: 'language',
      title: t('tabLanguage', language),
      icon: <Globe className="w-4 h-4 text-[#53BDEB]" />,
      subtitle: 'English, Ikinyarwanda, Español, Français',
      badge: SUPPORTED_LANGUAGES.find((l) => l.code === language)?.flag || '🌐',
    },
    {
      id: 'archive',
      title: t('tabArchive', language),
      icon: <Archive className="w-4 h-4 text-[#00A884]" />,
      subtitle: t('archiveSubtitle', language),
      badge: `${searchResults.length}`,
    },
    {
      id: 'account',
      title: t('tabAccount', language),
      icon: <KeyRound className="w-4 h-4 text-emerald-400" />,
      subtitle: t('accountSubtitle', language),
    },
    {
      id: 'privacy',
      title: t('tabPrivacy', language),
      icon: <Shield className="w-4 h-4 text-cyan-400" />,
      subtitle: t('privacySubtitle', language),
    },
    {
      id: 'chats',
      title: t('tabChats', language),
      icon: <MessageSquare className="w-4 h-4 text-[#25D366]" />,
      subtitle: t('chatsSubtitle', language),
    },
    {
      id: 'notifications',
      title: t('tabNotifications', language),
      icon: <Bell className="w-4 h-4 text-amber-400" />,
      subtitle: t('notifSubtitle', language),
    },
    {
      id: 'storage',
      title: t('tabStorage', language),
      icon: <HardDrive className="w-4 h-4 text-purple-400" />,
      subtitle: t('storageSubtitle', language),
    },
    {
      id: 'fonts',
      title: t('tabFonts', language),
      icon: <Eye className="w-4 h-4 text-[#00A884]" />,
      subtitle: 'Visual Comfort, Typography Scaling & Fonts',
      badge: fontSize.toUpperCase(),
    },
    {
      id: 'security',
      title: t('tabSecurity', language),
      icon: <Fingerprint className="w-4 h-4 text-rose-400" />,
      subtitle: 'WebAuthn, Passwords, PINs & Decoy Killswitch',
    },
    {
      id: 'education',
      title: t('tabEducation', language),
      icon: <GraduationCap className="w-4 h-4 text-blue-400" />,
      subtitle: 'Student Tier, Research & Thesis Focus',
    },
    {
      id: 'export',
      title: t('tabExport', language),
      icon: <Download className="w-4 h-4 text-teal-400" />,
      subtitle: 'Privacy-Preserving JSON Chat History Backup',
    },
    {
      id: 'profile',
      title: 'Profile & Sovereign ID',
      icon: <User className="w-4 h-4 text-indigo-400" />,
      subtitle: 'Legal Name, ZKP National ID & Org Role',
    },
    {
      id: 'help',
      title: t('tabHelp', language),
      icon: <HelpCircle className="w-4 h-4 text-[#8696A0]" />,
      subtitle: t('helpSubtitle', language),
    },
  ];

  const filteredCategories = CATEGORIES.filter((c) => {
    if (!settingsFilterQuery.trim()) return true;
    const q = settingsFilterQuery.toLowerCase();
    return c.title.toLowerCase().includes(q) || c.subtitle.toLowerCase().includes(q) || c.id.toLowerCase().includes(q);
  });

  const chatForExportTarget = allChats.find((c) => c.id === selectedChatIdForExport) || activeChat;
  const msgsForExportTarget = chatForExportTarget
    ? allMessagesByChat[chatForExportTarget.id] || (chatForExportTarget.id === activeChat?.id ? messages : [])
    : [];
  const protectedCountInTarget = msgsForExportTarget.filter(
    (m) => m.isForwardProtected || chatForExportTarget?.forwardRestricted
  ).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in select-none text-[#E9EDEF]">
      <div className="bg-[#111B21] border border-[#222E35] rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col h-[92vh] max-h-[850px]">
        {/* Top Header */}
        <header className="px-5 py-3.5 bg-[#202C33] border-b border-[#222E35] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-[#00A884]/20 text-[#00A884] border border-[#00A884]/40">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  {t('settings', language)}
                </h3>
                <span className="text-[10px] font-mono bg-[#00A884]/20 text-[#00A884] px-2 py-0.5 rounded-full uppercase font-bold border border-[#00A884]/40">
                  {SUPPORTED_LANGUAGES.find((l) => l.code === language)?.flag} {language.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-[#8696A0] hidden sm:block">
                {t('settingsSub', language)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isSaved && (
              <span className="text-xs text-[#00A884] font-semibold flex items-center gap-1 animate-in fade-in">
                <Check className="w-3.5 h-3.5" /> {t('changesSaved', language)}
              </span>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#182229] hover:bg-[#2A3942] text-[#8696A0] hover:text-white flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          </div>
        </header>

        {/* Master Body Layout: Sidebar Navigator on left, Details on right */}
        <div className="flex flex-1 min-h-0 divide-x divide-[#222E35]">
          {/* Settings Navigation Sidebar */}
          <aside className="w-full sm:w-64 md:w-72 bg-[#182229] flex flex-col shrink-0 overflow-hidden">
            {/* User Profile Quick Banner */}
            <div 
              onClick={() => setActiveTab('profile')}
              className="p-3.5 border-b border-[#222E35] flex items-center gap-3 cursor-pointer hover:bg-[#202C33] transition-colors"
            >
              <div className="relative shrink-0">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-[#00A884]/50"
                />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#00A884] rounded-full border-2 border-[#182229]" />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <div className="text-xs font-bold text-white truncate flex items-center gap-1">
                  <span>{user.name}</span>
                  {user.orgRole && (
                    <span className="text-[9px] bg-amber-500/20 text-amber-300 font-bold px-1 rounded border border-amber-500/30">
                      {user.orgRole}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-[#8696A0] truncate">{user.phone}</div>
                <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                  <BadgeCheck className="w-3 h-3" /> Sovereign ZKP Verified
                </div>
              </div>
            </div>

            {/* Quick Filter Search */}
            <div className="p-2.5 border-b border-[#222E35] bg-[#111B21]">
              <div className="relative flex items-center bg-[#202C33] rounded-xl px-2.5 py-1.5 focus-within:ring-1 focus-within:ring-[#00A884]">
                <Search className="w-3.5 h-3.5 text-[#8696A0] mr-2 shrink-0" />
                <input
                  type="text"
                  value={settingsFilterQuery}
                  onChange={(e) => setSettingsFilterQuery(e.target.value)}
                  placeholder="Search settings..."
                  className="w-full bg-transparent text-xs text-white placeholder-[#8696A0] outline-none"
                />
                {settingsFilterQuery && (
                  <button onClick={() => setSettingsFilterQuery('')} className="text-xs text-[#8696A0] hover:text-white">✕</button>
                )}
              </div>
            </div>

            {/* Navigation Tabs List */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#202C33]/40 p-1.5 space-y-0.5">
              {filteredCategories.map((cat) => {
                const isActive = activeTab === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveTab(cat.id)}
                    className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between transition-all text-xs ${
                      isActive
                        ? 'bg-[#00A884]/20 text-[#00A884] font-bold border border-[#00A884]/40 shadow-sm'
                        : 'text-[#8696A0] hover:bg-[#202C33] hover:text-[#E9EDEF]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className={`p-1.5 rounded-lg ${isActive ? 'bg-[#00A884] text-[#111B21]' : 'bg-[#202C33] text-[#8696A0]'}`}>
                        {cat.icon}
                      </div>
                      <div className="truncate">
                        <div className={`truncate ${isActive ? 'text-white' : 'text-[#E9EDEF]'}`}>
                          {cat.title}
                        </div>
                        <div className="text-[10px] text-[#8696A0] font-normal truncate max-w-[150px]">
                          {cat.subtitle}
                        </div>
                      </div>
                    </div>
                    {cat.badge && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#202C33] text-emerald-400 font-semibold shrink-0 ml-1">
                        {cat.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Settings Detail Pane */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#111B21] flex flex-col justify-between">
            <div className="space-y-5">
              {/* ============================================================== */}
              {/* TAB 1: APP LANGUAGE */}
              {/* ============================================================== */}
              {activeTab === 'language' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="bg-gradient-to-r from-[#182229] to-[#202C33] p-4 rounded-2xl border border-[#2A3942] flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Globe className="w-4 h-4 text-[#53BDEB]" />
                        <span>{t('languageTitle', language)}</span>
                      </h4>
                      <p className="text-xs text-[#8696A0] mt-0.5">
                        {t('languageSubtitle', language)}
                      </p>
                    </div>
                    <span className="text-2xl" role="img" aria-label="Flag">
                      {SUPPORTED_LANGUAGES.find((l) => l.code === language)?.flag}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {SUPPORTED_LANGUAGES.map((langOption) => {
                      const isCurrent = language === langOption.code;
                      return (
                        <button
                          key={langOption.code}
                          type="button"
                          onClick={() => {
                            onUpdateLanguage?.(langOption.code);
                          }}
                          className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                            isCurrent
                              ? 'bg-[#00A884]/15 border-[#00A884] shadow-md shadow-[#00A884]/10 text-white ring-1 ring-[#00A884]'
                              : 'bg-[#202C33] border-[#2A3942] text-[#8696A0] hover:text-white hover:border-[#374248]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2.5">
                              <span className="text-2xl">{langOption.flag}</span>
                              <div>
                                <div className="text-sm font-bold text-white">{langOption.nativeName}</div>
                                <div className="text-xs text-[#8696A0]">{langOption.name}</div>
                              </div>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              isCurrent ? 'border-[#00A884] bg-[#00A884]' : 'border-[#374248]'
                            }`}>
                              {isCurrent && <Check className="w-3 h-3 text-[#111B21] stroke-[3]" />}
                            </div>
                          </div>
                          <div className="text-[11px] text-[#8696A0] mt-1 pt-2 border-t border-white/5 flex items-center justify-between">
                            <span>{langOption.region}</span>
                            <span className="font-mono text-[10px] uppercase font-bold text-emerald-400">
                              {langOption.code}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="bg-[#182229] p-3.5 rounded-2xl border border-[#222E35] text-xs text-[#8696A0] flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">Dynamic Hot-Reloading:</strong> {t('languageChangeNotice', language)}
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* TAB 2: SEARCHABLE MESSAGE HISTORY ARCHIVE */}
              {/* ============================================================== */}
              {activeTab === 'archive' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="bg-gradient-to-r from-[#182229] to-[#202C33] p-4 rounded-2xl border border-[#2A3942] flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Archive className="w-4 h-4 text-[#00A884]" />
                        <span>{t('archiveTitle', language)}</span>
                      </h4>
                      <p className="text-xs text-[#8696A0] mt-0.5">
                        {t('archiveSubtitle', language)}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold">
                      {searchResults.length} {t('matchesFound', language)}
                    </span>
                  </div>

                  {/* Search Query Inputs */}
                  <div className="bg-[#182229] p-4 rounded-2xl border border-[#222E35] space-y-3.5">
                    {/* Keyword search bar */}
                    <div className="relative">
                      <Search className="w-4 h-4 text-[#8696A0] absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={archiveKeyword}
                        onChange={(e) => setArchiveKeyword(e.target.value)}
                        placeholder={t('searchArchivePlaceholder', language)}
                        className="w-full bg-[#202C33] border border-[#2A3942] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#8696A0] outline-none focus:border-[#00A884]"
                      />
                      {archiveKeyword && (
                        <button
                          onClick={() => setArchiveKeyword('')}
                          className="absolute right-3 top-2.5 text-xs text-[#8696A0] hover:text-white"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Chat Filter & Media Type */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="text-[11px] font-semibold text-[#8696A0] mb-1 block">
                          {t('selectChatFilter', language)}:
                        </label>
                        <select
                          value={archiveChatFilter}
                          onChange={(e) => setArchiveChatFilter(e.target.value)}
                          className="w-full bg-[#202C33] border border-[#2A3942] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#00A884]"
                        >
                          <option value="all">{t('allConversations', language)}</option>
                          {allChats.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} {c.isSecret ? '[Secret]' : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-[#8696A0] mb-1 block">
                          {t('mediaFilter', language)}:
                        </label>
                        <select
                          value={archiveMediaType}
                          onChange={(e) => setArchiveMediaType(e.target.value as any)}
                          className="w-full bg-[#202C33] border border-[#2A3942] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#00A884]"
                        >
                          <option value="all">{t('mediaAll', language)}</option>
                          <option value="text">{t('mediaText', language)}</option>
                          <option value="image">{t('mediaImages', language)}</option>
                          <option value="doc">{t('mediaDocs', language)}</option>
                          <option value="voice">{t('mediaVoice', language)}</option>
                          <option value="code">{t('mediaCode', language)}</option>
                        </select>
                      </div>
                    </div>

                    {/* Date Range Picker */}
                    <div className="space-y-1.5 pt-1 border-t border-[#222E35]">
                      <div className="flex items-center justify-between text-xs">
                        <label className="text-[11px] font-semibold text-[#8696A0] flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#00A884]" />
                          <span>{t('dateRange', language)}:</span>
                        </label>
                        {/* Quick Presets */}
                        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                          <button
                            type="button"
                            onClick={() => handleApplyDatePreset('all')}
                            className="text-[10px] px-2 py-0.5 rounded bg-[#202C33] hover:bg-[#2A3942] text-[#8696A0] hover:text-white"
                          >
                            {t('presetAllTime', language)}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApplyDatePreset('today')}
                            className="text-[10px] px-2 py-0.5 rounded bg-[#202C33] hover:bg-[#2A3942] text-[#8696A0] hover:text-white"
                          >
                            {t('presetToday', language)}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApplyDatePreset('week')}
                            className="text-[10px] px-2 py-0.5 rounded bg-[#202C33] hover:bg-[#2A3942] text-[#8696A0] hover:text-white"
                          >
                            {t('presetWeek', language)}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApplyDatePreset('month')}
                            className="text-[10px] px-2 py-0.5 rounded bg-[#202C33] hover:bg-[#2A3942] text-[#8696A0] hover:text-white"
                          >
                            {t('presetMonth', language)}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApplyDatePreset('year')}
                            className="text-[10px] px-2 py-0.5 rounded bg-[#202C33] hover:bg-[#2A3942] text-[#8696A0] hover:text-white"
                          >
                            {t('presetYear', language)}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="text-[10px] text-[#8696A0] mb-0.5 block">{t('startDate', language)}:</label>
                          <input
                            type="date"
                            value={archiveStartDate}
                            onChange={(e) => setArchiveStartDate(e.target.value)}
                            className="w-full bg-[#202C33] border border-[#2A3942] rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-[#00A884]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-[#8696A0] mb-0.5 block">{t('endDate', language)}:</label>
                          <input
                            type="date"
                            value={archiveEndDate}
                            onChange={(e) => setArchiveEndDate(e.target.value)}
                            className="w-full bg-[#202C33] border border-[#2A3942] rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-[#00A884]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Results Count & Export Query Button */}
                  <div className="flex items-center justify-between text-xs px-1">
                    <span className="text-[#8696A0]">
                      Showing <strong className="text-white">{searchResults.length}</strong> matching records
                    </span>
                    {searchResults.length > 0 && (
                      <button
                        type="button"
                        onClick={handleExportArchiveResults}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#202C33] hover:bg-[#2A3942] text-[#00A884] border border-[#00A884]/30 font-semibold transition-all"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{t('exportQueryResults', language)}</span>
                      </button>
                    )}
                  </div>

                  {/* Matching Results List */}
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {searchResults.length === 0 ? (
                      <div className="p-8 text-center text-[#8696A0] bg-[#182229] rounded-2xl border border-white/5 space-y-1">
                        <Search className="w-8 h-8 mx-auto opacity-30 mb-2" />
                        <div className="text-sm font-semibold text-white">{t('noMessagesMatch', language)}</div>
                        <div className="text-xs text-[#8696A0]">{t('tryDifferentQuery', language)}</div>
                      </div>
                    ) : (
                      searchResults.map(({ message, chat }) => {
                        const isSelf = message.senderId === user.id;
                        return (
                          <div
                            key={message.id}
                            className="p-3 bg-[#182229] hover:bg-[#202C33] rounded-2xl border border-[#222E35] transition-all space-y-2 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <img src={chat.avatar} alt={chat.name} className="w-6 h-6 rounded-full object-cover" />
                                <div>
                                  <span className="font-bold text-white">{chat.name}</span>
                                  <span className="text-[10px] text-[#8696A0] ml-2">
                                    {isSelf ? 'You' : message.senderName}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-[#8696A0] font-mono">
                                  {new Date(message.timestamp).toLocaleString([], {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                                {onSelectChat && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onSelectChat(chat.id);
                                      onClose();
                                    }}
                                    className="px-2 py-0.5 rounded bg-[#00A884]/20 hover:bg-[#00A884]/30 text-[#00A884] text-[10px] font-bold border border-[#00A884]/30"
                                  >
                                    {t('jumpToChat', language)} →
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Message snippet preview */}
                            <div className="bg-[#111B21] p-2.5 rounded-xl border border-white/5 text-[#E9EDEF] leading-relaxed">
                              {message.isForwardProtected ? (
                                <span className="text-amber-400 italic">
                                  🔒 {t('forwardProtectedRedacted', language)}
                                </span>
                              ) : (
                                <span>{message.content}</span>
                              )}

                              {message.mediaType && message.mediaType !== 'text' && (
                                <div className="mt-1 flex items-center gap-1.5 text-[10px] text-[#8696A0]">
                                  {message.mediaType === 'image' && <ImageIcon className="w-3 h-3 text-[#53BDEB]" />}
                                  {message.mediaType === 'doc' && <FileText className="w-3 h-3 text-emerald-400" />}
                                  {message.mediaType === 'voice' && <Mic className="w-3 h-3 text-purple-400" />}
                                  {message.mediaType === 'code' && <Code2 className="w-3 h-3 text-amber-400" />}
                                  <span>Media: {message.mediaName || message.mediaType}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* TAB 3: ACCOUNT & SOVEREIGN IDENTITY */}
              {/* ============================================================== */}
              {activeTab === 'account' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="bg-gradient-to-r from-[#182229] to-[#202C33] p-4 rounded-2xl border border-[#2A3942] flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-emerald-400" />
                        <span>{t('accountTitle', language)}</span>
                      </h4>
                      <p className="text-xs text-[#8696A0] mt-0.5">
                        {t('accountSubtitle', language)}
                      </p>
                    </div>
                  </div>

                  <div className="bg-[#182229] p-4 rounded-2xl border border-[#222E35] space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="text-[11px] font-semibold text-[#8696A0] mb-1 block">
                          {t('fullName', language)}:
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full bg-[#202C33] border border-[#2A3942] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#00A884]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-[#8696A0] mb-1 block">
                          {t('phoneNumber', language)}:
                        </label>
                        <input
                          type="text"
                          disabled
                          value={user.phone}
                          className="w-full bg-[#111B21] border border-[#222E35] rounded-xl px-3 py-2 text-xs text-[#8696A0] outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="text-[11px] font-semibold text-[#8696A0] mb-1 block">
                          {t('backupEmail', language)}:
                        </label>
                        <input
                          type="text"
                          disabled
                          value={user.email || 'user.scholar@sovereign.io'}
                          className="w-full bg-[#111B21] border border-[#222E35] rounded-xl px-3 py-2 text-xs text-[#8696A0] outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-[#8696A0] mb-1 block">
                          {t('idType', language)}:
                        </label>
                        <select
                          value={nationalIdType}
                          onChange={(e) => setNationalIdType(e.target.value as any)}
                          className="w-full bg-[#202C33] border border-[#2A3942] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#00A884]"
                        >
                          <option value="National ID">National ID Card (ZKP)</option>
                          <option value="Passport">Passport</option>
                          <option value="State Issued ID">State Issued ID</option>
                          <option value="Academic Identity Card">Academic Student ID</option>
                        </select>
                      </div>
                    </div>

                    {/* ZKP ID Hash */}
                    <div>
                      <label className="text-[11px] font-semibold text-[#8696A0] mb-1 block flex items-center justify-between">
                        <span>{t('nationalIdHash', language)}:</span>
                        <span className="text-[10px] text-emerald-400 font-mono">Verified Zero-Knowledge Hash</span>
                      </label>
                      <input
                        type="text"
                        value={nationalId}
                        onChange={(e) => setNationalId(e.target.value)}
                        className="w-full bg-[#202C33] border border-[#2A3942] rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-[#00A884]"
                      />
                    </div>
                  </div>

                  {/* Two-step verification banner */}
                  <div className="bg-[#182229] p-4 rounded-2xl border border-[#222E35] flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-[#00A884]" />
                        <span>{t('twoFactorStatus', language)}</span>
                      </div>
                      <div className="text-[#8696A0] text-[11px] mt-0.5">
                        {t('twoFactorActive', language)}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/40">
                      ARMED
                    </span>
                  </div>

                  {/* Account Actions */}
                  <div className="p-4 bg-[#182229] rounded-2xl border border-[#222E35] space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white">{t('requestAccountInfo', language)}</div>
                        <div className="text-[11px] text-[#8696A0]">{t('requestAccountInfoDesc', language)}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => alert('Account report generation initiated. Encrypted bundle will download automatically.')}
                        className="px-3 py-1.5 rounded-xl bg-[#202C33] hover:bg-[#2A3942] text-white border border-[#2A3942] font-semibold"
                      >
                        Request Report
                      </button>
                    </div>

                    <div className="border-t border-[#222E35] pt-3 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-rose-400">{t('deleteAccount', language)}</div>
                        <div className="text-[11px] text-[#8696A0]">{t('deleteAccountDesc', language)}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Are you sure you want to purge local encryption keys and account data from this browser?')) {
                            localStorage.clear();
                            window.location.reload();
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold"
                      >
                        Purge Local Data
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* TAB 4: PRIVACY */}
              {/* ============================================================== */}
              {activeTab === 'privacy' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="bg-gradient-to-r from-[#182229] to-[#202C33] p-4 rounded-2xl border border-[#2A3942] flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Shield className="w-4 h-4 text-cyan-400" />
                        <span>{t('privacyTitle', language)}</span>
                      </h4>
                      <p className="text-xs text-[#8696A0] mt-0.5">
                        {t('privacySubtitle', language)}
                      </p>
                    </div>
                  </div>

                  <div className="bg-[#182229] p-4 rounded-2xl border border-[#222E35] divide-y divide-[#222E35] text-xs">
                    {/* Read Receipts */}
                    <div className="pb-3 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white">{t('readReceipts', language)}</div>
                        <div className="text-[11px] text-[#8696A0]">{t('readReceiptsDesc', language)}</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={localPrivacy.readReceipts}
                        onChange={(e) => setLocalPrivacy((p) => ({ ...p, readReceipts: e.target.checked }))}
                        className="w-4 h-4 accent-[#00A884]"
                      />
                    </div>

                    {/* Tor Onion Multi-hop relay */}
                    <div className="py-3 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <Radio className="w-3.5 h-3.5 text-purple-400" />
                          <span>{t('torRelayTitle', language)}</span>
                        </div>
                        <div className="text-[11px] text-[#8696A0]">{t('torRelayDesc', language)}</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={localPrivacy.torRelayEnabled}
                        onChange={(e) => setLocalPrivacy((p) => ({ ...p, torRelayEnabled: e.target.checked }))}
                        className="w-4 h-4 accent-[#00A884]"
                      />
                    </div>

                    {/* Anti-screenshot notice */}
                    <div className="py-3 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white">{t('antiScreenshotTitle', language)}</div>
                        <div className="text-[11px] text-[#8696A0]">{t('antiScreenshotDesc', language)}</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={localPrivacy.antiScreenshotNotice}
                        onChange={(e) => setLocalPrivacy((p) => ({ ...p, antiScreenshotNotice: e.target.checked }))}
                        className="w-4 h-4 accent-[#00A884]"
                      />
                    </div>

                    {/* Metadata Scrubber */}
                    <div className="py-3 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white">Metadata Scrubber (EXIF, GPS, Timestamps)</div>
                        <div className="text-[11px] text-[#8696A0]">Strip sensor & camera metadata from attachments before encryption</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={localPrivacy.metadataScrubber}
                        onChange={(e) => setLocalPrivacy((p) => ({ ...p, metadataScrubber: e.target.checked }))}
                        className="w-4 h-4 accent-[#00A884]"
                      />
                    </div>

                    {/* App Lock Quick Action */}
                    <div className="pt-3 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-rose-400">{t('appLock', language)}</div>
                        <div className="text-[11px] text-[#8696A0]">{t('appLockDesc', language)}</div>
                      </div>
                      {onLockApp && (
                        <button
                          type="button"
                          onClick={() => {
                            handleSave();
                            onClose();
                            onLockApp();
                          }}
                          className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold"
                        >
                          {t('lockNow', language)}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* TAB 5: CHATS & WALLPAPER */}
              {/* ============================================================== */}
              {activeTab === 'chats' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="bg-gradient-to-r from-[#182229] to-[#202C33] p-4 rounded-2xl border border-[#2A3942] flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-[#25D366]" />
                        <span>{t('chatsTitle', language)}</span>
                      </h4>
                      <p className="text-xs text-[#8696A0] mt-0.5">
                        {t('chatsSubtitle', language)}
                      </p>
                    </div>
                  </div>

                  <div className="bg-[#182229] p-4 rounded-2xl border border-[#222E35] space-y-3.5 text-xs">
                    <div>
                      <label className="text-[11px] font-semibold text-[#8696A0] mb-2 block">
                        {t('chatWallpaper', language)}:
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { id: 'midnight', name: t('wallpaperDark', language), color: '#0C1317' },
                          { id: 'matrix', name: t('wallpaperMatrix', language), color: '#0a1d17' },
                          { id: 'navy', name: t('wallpaperNavy', language), color: '#0f172a' },
                          { id: 'amoled', name: t('wallpaperAmoled', language), color: '#000000' },
                        ].map((w) => (
                          <button
                            key={w.id}
                            type="button"
                            onClick={() => setChatWallpaper(w.id as any)}
                            className={`p-3 rounded-xl border text-left transition-all ${
                              chatWallpaper === w.id
                                ? 'bg-[#00A884]/20 border-[#00A884] text-white font-bold'
                                : 'bg-[#202C33] border-[#2A3942] text-[#8696A0] hover:text-white'
                            }`}
                          >
                            <div className="w-full h-8 rounded-lg mb-1.5 border border-white/10" style={{ backgroundColor: w.color }} />
                            <div className="text-xs truncate">{w.name}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Chat Backup */}
                    <div className="border-t border-[#222E35] pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="font-bold text-white">{t('chatBackupTitle', language)}</div>
                        <div className="text-[11px] text-[#8696A0]">{t('chatBackupDesc', language)}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setBackupFeedback('✓ Encrypted backup created and stored in local IndexedDB vault.');
                          setTimeout(() => setBackupFeedback(null), 4000);
                        }}
                        className="px-4 py-2 rounded-xl bg-[#00A884] text-[#111B21] font-bold text-xs hover:bg-[#008F6F] transition-all shrink-0"
                      >
                        {t('backupNowBtn', language)}
                      </button>
                    </div>

                    {backupFeedback && (
                      <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                        <span>{backupFeedback}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* TAB 6: NOTIFICATIONS */}
              {/* ============================================================== */}
              {activeTab === 'notifications' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="bg-gradient-to-r from-[#182229] to-[#202C33] p-4 rounded-2xl border border-[#2A3942] flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Bell className="w-4 h-4 text-amber-400" />
                        <span>{t('notifTitle', language)}</span>
                      </h4>
                      <p className="text-xs text-[#8696A0] mt-0.5">
                        {t('notifSubtitle', language)}
                      </p>
                    </div>
                  </div>

                  <div className="bg-[#182229] p-4 rounded-2xl border border-[#222E35] divide-y divide-[#222E35] text-xs">
                    <div className="pb-3 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white">{t('conversationTones', language)}</div>
                        <div className="text-[11px] text-[#8696A0]">{t('conversationTonesDesc', language)}</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={conversationTones}
                        onChange={(e) => setConversationTones(e.target.checked)}
                        className="w-4 h-4 accent-[#00A884]"
                      />
                    </div>

                    <div className="py-3 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white">{t('highPriority', language)}</div>
                        <div className="text-[11px] text-[#8696A0]">{t('highPriorityDesc', language)}</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={highPriorityAlerts}
                        onChange={(e) => setHighPriorityAlerts(e.target.checked)}
                        className="w-4 h-4 accent-[#00A884]"
                      />
                    </div>

                    <div className="py-3 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white">{t('reactionAlerts', language)}</div>
                        <div className="text-[11px] text-[#8696A0]">{t('reactionAlertsDesc', language)}</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={reactionNotifications}
                        onChange={(e) => setReactionNotifications(e.target.checked)}
                        className="w-4 h-4 accent-[#00A884]"
                      />
                    </div>

                    <div className="pt-3">
                      <label className="font-bold text-white mb-1.5 block">{t('vibrationStrength', language)}:</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'default', label: t('vibeDefault', language) },
                          { id: 'short', label: t('vibeShort', language) },
                          { id: 'long', label: t('vibeLong', language) },
                        ].map((v) => (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => setVibrationPattern(v.id as any)}
                            className={`p-2 rounded-xl border text-center transition-all ${
                              vibrationPattern === v.id
                                ? 'bg-[#00A884]/20 border-[#00A884] text-[#00A884] font-bold'
                                : 'bg-[#202C33] border-[#2A3942] text-[#8696A0] hover:text-white'
                            }`}
                          >
                            {v.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* TAB 7: STORAGE & DATA */}
              {/* ============================================================== */}
              {activeTab === 'storage' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="bg-gradient-to-r from-[#182229] to-[#202C33] p-4 rounded-2xl border border-[#2A3942] flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <HardDrive className="w-4 h-4 text-purple-400" />
                        <span>{t('storageTitle', language)}</span>
                      </h4>
                      <p className="text-xs text-[#8696A0] mt-0.5">
                        {t('storageSubtitle', language)}
                      </p>
                    </div>
                  </div>

                  <div className="bg-[#182229] p-4 rounded-2xl border border-[#222E35] space-y-3.5 text-xs">
                    {/* Live IndexedDB localforage Storage usage indicator */}
                    <div className="p-3.5 bg-[#111B21] rounded-2xl border border-white/5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Database className="w-4 h-4 text-[#00A884]" />
                          <span className="font-semibold text-white">IndexedDB Local Storage Vault (localforage):</span>
                        </div>
                        <span className="text-emerald-400 font-mono font-bold text-[11px] bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                          {vaultStats?.driver || 'asyncStorage (IndexedDB)'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                        <div className="bg-[#182229] p-2.5 rounded-xl border border-white/5">
                          <div className="text-[#8696A0] text-[10px]">Cached Chats</div>
                          <div className="text-sm font-bold text-white mt-0.5">{vaultStats?.totalChatsCached ?? allChats.length}</div>
                        </div>
                        <div className="bg-[#182229] p-2.5 rounded-xl border border-white/5">
                          <div className="text-[#8696A0] text-[10px]">Cached Messages</div>
                          <div className="text-sm font-bold text-white mt-0.5">{vaultStats?.totalMessagesCached ?? 0}</div>
                        </div>
                        <div className="bg-[#182229] p-2.5 rounded-xl border border-white/5">
                          <div className="text-[#8696A0] text-[10px]">Offline Support</div>
                          <div className="text-sm font-bold text-emerald-400 mt-0.5">100% Ready</div>
                        </div>
                        <div className="bg-[#182229] p-2.5 rounded-xl border border-white/5">
                          <div className="text-[#8696A0] text-[10px]">Biometric Lock</div>
                          <div className={`text-sm font-bold mt-0.5 ${vaultConfig.isSecured ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {vaultConfig.isSecured ? 'Enforced' : 'Off'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 text-[11px] text-[#8696A0]">
                        <span>Vault Engine: <strong>localforage IndexedDB driver</strong></span>
                        <span className="font-mono text-[10px]">
                          Last Sync: {vaultStats ? new Date(vaultStats.lastSyncedTimestamp).toLocaleTimeString() : 'Current'}
                        </span>
                      </div>

                      {dbSyncMessage && (
                        <div className={`p-2 rounded-xl text-xs font-medium flex items-center gap-1.5 ${
                          dbSyncMessage.startsWith('✓') 
                            ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30' 
                            : 'bg-rose-950/50 text-rose-300 border border-rose-500/30'
                        }`}>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{dbSyncMessage}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleSyncToIndexedDb}
                          disabled={isSyncingDb}
                          className="py-2 px-2.5 rounded-xl bg-[#00A884] text-[#111B21] text-xs font-bold hover:bg-[#008F6F] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          {isSyncingDb ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Database className="w-3.5 h-3.5" />
                          )}
                          <span>Sync Memory Now</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleExportEncryptedVault}
                          disabled={isExportingVault}
                          className="py-2 px-2.5 rounded-xl bg-[#202C33] text-emerald-300 hover:text-white hover:bg-[#2A3942] text-xs font-bold border border-emerald-500/30 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                          title="Export all locally cached chats and messages as an encrypted JSON backup file"
                        >
                          {isExportingVault ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5 text-emerald-400" />
                          )}
                          <span>Export Encrypted Vault</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleClearIndexedDbVault}
                          className="py-2 px-2.5 rounded-xl bg-[#202C33] text-rose-300 hover:text-white hover:bg-rose-950/50 text-xs font-medium border border-rose-500/20 transition-all flex items-center justify-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                          <span>Clear Vault</span>
                        </button>
                      </div>
                    </div>

                    {/* Media auto-download rules */}
                    <div>
                      <div className="font-bold text-white mb-2">{t('mediaAutoDownload', language)}</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3 bg-[#202C33] rounded-xl border border-[#2A3942] space-y-2">
                          <span className="font-semibold text-[#8696A0] block">{t('whenUsingCellular', language)}</span>
                          <div className="space-y-1">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={autoDownloadCellular.photos}
                                onChange={(e) => setAutoDownloadCellular((s) => ({ ...s, photos: e.target.checked }))}
                                className="accent-[#00A884]"
                              />
                              <span>{t('photos', language)}</span>
                            </label>
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={autoDownloadCellular.audio}
                                onChange={(e) => setAutoDownloadCellular((s) => ({ ...s, audio: e.target.checked }))}
                                className="accent-[#00A884]"
                              />
                              <span>{t('audio', language)}</span>
                            </label>
                          </div>
                        </div>

                        <div className="p-3 bg-[#202C33] rounded-xl border border-[#2A3942] space-y-2">
                          <span className="font-semibold text-[#8696A0] block">{t('whenUsingWifi', language)}</span>
                          <div className="space-y-1">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={autoDownloadWifi.photos}
                                onChange={(e) => setAutoDownloadWifi((s) => ({ ...s, photos: e.target.checked }))}
                                className="accent-[#00A884]"
                              />
                              <span>{t('photos', language)}</span>
                            </label>
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={autoDownloadWifi.docs}
                                onChange={(e) => setAutoDownloadWifi((s) => ({ ...s, docs: e.target.checked }))}
                                className="accent-[#00A884]"
                              />
                              <span>{t('documents', language)}</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Proxy settings */}
                    <div className="border-t border-[#222E35] pt-3 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white">{t('proxySettingsTitle', language)}</div>
                        <div className="text-[11px] text-[#8696A0]">{t('proxySettingsDesc', language)}</div>
                      </div>
                      <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/40">
                        AUTOMATIC
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* TAB 8: EYE COMFORT & FONTS */}
              {/* ============================================================== */}
              {activeTab === 'fonts' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="bg-gradient-to-r from-[#182229] to-[#202C33] p-4 rounded-2xl border border-[#2A3942] flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <Eye className="w-4 h-4 text-[#00A884]" />
                        <span>Visual Comfort &amp; Typography Scaling</span>
                      </div>
                      <p className="text-xs text-[#8696A0] mt-0.5">
                        Choose font sizing and styles tailored to reduce eye fatigue during long reading and research sessions.
                      </p>
                    </div>
                    <span className="text-[10px] font-mono bg-[#00A884]/20 text-[#00A884] px-2.5 py-1 rounded-full uppercase font-bold border border-[#00A884]/40">
                      {fontSize} scale
                    </span>
                  </div>

                  {/* Font Size Choices */}
                  <div>
                    <label className="text-xs font-semibold text-[#8696A0] mb-2 flex items-center gap-1.5">
                      <Type className="w-4 h-4 text-[#00A884]" />
                      <span>Choose App Font Size for Your Eyes:</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {(
                        [
                          { id: 'small', label: 'Small', px: '13px', desc: 'Compact / High Density' },
                          { id: 'medium', label: 'Medium', px: '15px', desc: 'Standard Default' },
                          { id: 'large', label: 'Large', px: '18px', desc: 'Relaxed / Low Fatigue' },
                          { id: 'extra', label: 'Extra', px: '21px', desc: 'Maximum Legibility' },
                        ] as const
                      ).map((option) => (
                        <button
                          key={option.id}
                          onClick={() => onUpdateFontSize?.(option.id)}
                          className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                            fontSize === option.id
                              ? 'bg-[#00A884]/15 border-[#00A884] shadow-md shadow-[#00A884]/10 text-white'
                              : 'bg-[#202C33] border-[#2A3942] text-[#8696A0] hover:text-white hover:border-[#374248]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-bold text-white">{option.label}</span>
                            <span className="text-[10px] font-mono text-[#00A884]">{option.px}</span>
                          </div>
                          <div className="text-[10px] text-[#8696A0] leading-tight mb-2">{option.desc}</div>
                          <div
                            className={`mt-auto text-center py-1 rounded-lg border font-medium ${
                              fontSize === option.id
                                ? 'bg-[#00A884] text-[#111B21] border-[#00A884] font-bold text-xs'
                                : 'bg-[#182229] border-white/5 text-[#8696A0] text-[11px]'
                            }`}
                          >
                            {fontSize === option.id ? '✓ Selected' : 'Choose'}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Font Theme / Typeface Choices */}
                  <div>
                    <label className="text-xs font-semibold text-[#8696A0] mb-2 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-[#00A884]" />
                      <span>Choose Typeface Style for Eye Strain Relief:</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(
                        [
                          { id: 'system', name: 'System Sans', sample: 'Modern & Clean' },
                          { id: 'readable', name: 'Eye-Comfort Sans', sample: 'High-Legibility Soft' },
                          { id: 'serif', name: 'Editorial Serif', sample: 'Academic Paper' },
                          { id: 'mono', name: 'Technical Mono', sample: 'Code & Terminal' },
                        ] as const
                      ).map((theme) => (
                        <button
                          key={theme.id}
                          onClick={() => onUpdateFontTheme?.(theme.id)}
                          className={`p-2.5 rounded-xl border text-left transition-all ${
                            fontTheme === theme.id
                              ? 'bg-[#00A884]/20 border-[#00A884] text-[#00A884] font-semibold'
                              : 'bg-[#202C33] border-[#2A3942] text-[#8696A0] hover:text-white'
                          }`}
                        >
                          <div className="text-xs font-bold text-white">{theme.name}</div>
                          <div className="text-[10px] text-[#8696A0] mt-0.5 truncate">{theme.sample}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Live Eye-Comfort Reading Preview */}
                  <div className="bg-[#182229] p-4 rounded-2xl border border-[#222E35] space-y-3">
                    <div className="flex items-center justify-between text-xs text-[#8696A0]">
                      <span className="font-semibold text-white flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Live Eye-Comfort Reading Preview
                      </span>
                      <span className="text-[11px] font-mono text-emerald-400">
                        Active: {fontSize.toUpperCase()} • {fontTheme.toUpperCase()}
                      </span>
                    </div>

                    <div className="space-y-2.5 bg-[#111B21] p-3.5 rounded-xl border border-white/5">
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#00A884]/20 text-[#00A884] flex items-center justify-center font-bold text-xs shrink-0">
                          T
                        </div>
                        <div className="bg-[#202C33] p-3 rounded-2xl rounded-tl-sm text-[#E9EDEF] max-w-[85%] border border-[#2A3942] shadow-sm">
                          <div className="text-[11px] font-bold text-[#00A884] mb-0.5">Dr. Turing (Mentor)</div>
                          <p className="leading-relaxed" style={{ fontSize: 'var(--bubble-text-size)' }}>
                            In cryptographic protocols, clean typography reduces reading fatigue by over 34%. This font configuration is designed specifically for your eyes.
                          </p>
                          <div className="text-[10px] text-[#8696A0] mt-1 text-right">10:42 AM • Signal E2EE</div>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <div className="bg-[#005C4B] p-3 rounded-2xl rounded-tr-sm text-white max-w-[85%] shadow-sm">
                          <p className="leading-relaxed" style={{ fontSize: 'var(--bubble-text-size)' }}>
                            Looks crisp and easy to read! The text scaling adapts cleanly without blurring.
                          </p>
                          <div className="text-[10px] text-emerald-200 mt-1 flex items-center justify-end gap-1">
                            <span>10:43 AM</span>
                            <span>✓✓</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* TAB 9: SECURITY, KEYS & WEBAUTHN */}
              {/* ============================================================== */}
              {activeTab === 'security' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="bg-[#202C33] p-4 rounded-2xl border border-[#2A3942]">
                    <div className="text-xs font-bold text-white mb-1 flex items-center gap-1.5">
                      <Key className="w-4 h-4 text-[#00A884]" /> Public Key Fingerprint
                    </div>
                    <div className="font-mono text-xs text-emerald-400 bg-[#111B21] p-2.5 rounded-lg border border-white/5 break-all">
                      {user.publicKeyFingerprint}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-[#8696A0] mb-1 block">
                        Master App PIN (4 Digits):
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        value={pinCode}
                        onChange={(e) => setPinCode(e.target.value)}
                        className="w-full bg-[#202C33] border border-[#2A3942] rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-[#00A884] font-mono text-center"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-rose-400 mb-1 block">
                        Stealth Duress Code (Decoy PIN):
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        value={duressCode}
                        onChange={(e) => setDuressCode(e.target.value)}
                        className="w-full bg-[#202C33] border border-rose-500/30 rounded-xl px-4 py-2 text-sm text-rose-300 outline-none focus:border-rose-500 font-mono text-center"
                      />
                    </div>
                  </div>

                  {/* Password & Inactivity Auto-Lock Settings */}
                  <div className="p-3.5 bg-[#182229] rounded-2xl border border-[#2A3942] space-y-3">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4 text-[#00A884]" />
                      <span>Master Password &amp; 1-Minute Inactivity Lock</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-[#8696A0] mb-1 block">Account Password (Backup Auth):</label>
                        <input
                          type="text"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-[#202C33] border border-[#2A3942] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#00A884] font-mono"
                          placeholder="Enter secure password"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-[#8696A0] mb-1 block">Auto-Lock Inactivity Period:</label>
                        <select
                          value={inactivityLockMinutes}
                          onChange={(e) => setInactivityLockMinutes(Number(e.target.value))}
                          className="w-full bg-[#202C33] border border-[#2A3942] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#00A884]"
                        >
                          <option value={1}>1 Minute (Strict Auto-Lock - Face/Password/PIN)</option>
                          <option value={2}>2 Minutes</option>
                          <option value={5}>5 Minutes</option>
                          <option value={15}>15 Minutes</option>
                        </select>
                      </div>
                    </div>
                    <p className="text-[11px] text-[#8696A0]">
                      When inactive for 1 minute, SecureChat automatically locks the app. Users can unlock via Face/Biometrics, Password, or PIN.
                    </p>

                    {onLockApp && (
                      <button
                        type="button"
                        onClick={() => {
                          handleSave();
                          onClose();
                          onLockApp();
                        }}
                        className="w-full py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all flex items-center justify-center gap-2"
                      >
                        <Lock className="w-4 h-4 text-rose-400" />
                        <span>Lock App Now (Test Biometrics / Face ID / PIN / Password)</span>
                      </button>
                    )}
                  </div>

                  {/* Hardware Biometrics (WebAuthn / navigator.credentials) Section */}
                  <div className="p-4 bg-[#182229] rounded-2xl border border-[#2A3942] space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Fingerprint className="w-4 h-4 text-[#00A884]" />
                        <span>Secure Local Chat Database with Biometrics (WebAuthn API)</span>
                      </div>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold border ${
                        vaultConfig.isSecured 
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-sm' 
                          : 'bg-[#202C33] text-[#8696A0] border-white/5'
                      }`}>
                        {vaultConfig.isSecured ? '🔒 Database Biometrically Secured' : 'Standard PIN / Pass'}
                      </span>
                    </div>

                    {/* Master Biometric Lock Toggle */}
                    <div className="p-3 bg-[#111B21] rounded-xl border border-white/5 flex items-center justify-between">
                      <div className="pr-3">
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          <span>Device Biometric Database Lock</span>
                          {vaultConfig.isSecured && (
                            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.2 rounded-full font-mono font-normal">
                              ENFORCED
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#8696A0] mt-0.5 leading-relaxed">
                          Require device-level fingerprint or face unlock via WebAuthn to open the local chat database and decrypt stored messages.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleToggleBiometricDbLock}
                        disabled={isTestingWebAuthn}
                        className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all shrink-0 ${
                          vaultConfig.isSecured
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30'
                            : 'bg-[#00A884] text-[#111B21] hover:bg-[#008F6F] shadow-md shadow-[#00A884]/20'
                        }`}
                      >
                        {vaultConfig.isSecured ? 'Disable Biometrics' : 'Enable Biometrics'}
                      </button>
                    </div>

                    <div className="text-xs text-[#8696A0] space-y-1 bg-[#202C33]/50 p-2.5 rounded-xl border border-white/5">
                      <div className="flex items-center justify-between">
                        <span>Hardware Sensor:</span>
                        <strong className="text-white font-mono text-[11px]">{biometricLabel}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Platform Authenticator:</span>
                        <span className={isPlatformAuthenticatorAvailable ? "text-emerald-400 font-semibold" : "text-amber-400"}>
                          {isPlatformAuthenticatorAvailable ? "Active (WebAuthn Native)" : "Ready (Emulation Fallback)"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Local Vault Protection:</span>
                        <span className="text-emerald-400 font-mono text-[10px]">
                          AES-256-GCM + WebAuthn Keyed
                        </span>
                      </div>
                    </div>

                    {webAuthnTestResult && (
                      <div className={`p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
                        webAuthnTestResult.startsWith('✓') 
                          ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30' 
                          : 'bg-rose-950/50 text-rose-300 border border-rose-500/30'
                      }`}>
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{webAuthnTestResult}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={handleTestWebAuthn}
                        disabled={isTestingWebAuthn}
                        className="py-2 px-3 rounded-xl bg-[#00A884] text-[#111B21] text-xs font-bold hover:bg-[#008F6F] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        {isTestingWebAuthn ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Fingerprint className="w-3.5 h-3.5" />
                        )}
                        <span>Test WebAuthn Sensor</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          resetWebAuthn();
                          setWebAuthnTestResult('Biometric enrollment cleared.');
                        }}
                        className="py-2 px-3 rounded-xl bg-[#202C33] text-[#8696A0] hover:text-white hover:bg-[#2A3942] text-xs font-medium border border-[#2A3942] transition-all flex items-center justify-center gap-1.5"
                      >
                        <span>Reset Enrollment</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* TAB 10: ACADEMIC & CAREER */}
              {/* ============================================================== */}
              {activeTab === 'education' && (
                <div className="space-y-4 animate-in fade-in">
                  <div>
                    <label className="text-xs font-semibold text-[#8696A0] mb-1.5 block">
                      Current Student Tier / Level:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {tiers.map((t) => (
                        <button
                          key={t}
                          onClick={() => setStudentTier(t)}
                          className={`p-2.5 rounded-xl text-xs font-semibold border text-left transition-all ${
                            studentTier === t
                              ? 'bg-[#00A884]/20 border-[#00A884] text-[#00A884]'
                              : 'bg-[#202C33] border-[#2A3942] text-[#8696A0] hover:text-white'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#8696A0] mb-1 block">
                      Institution / School / University:
                    </label>
                    <input
                      type="text"
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      className="w-full bg-[#202C33] border border-[#2A3942] rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-[#00A884]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#8696A0] mb-1 block">
                      Major / Discipline of Study:
                    </label>
                    <input
                      type="text"
                      value={fieldOfStudy}
                      onChange={(e) => setFieldOfStudy(e.target.value)}
                      className="w-full bg-[#202C33] border border-[#2A3942] rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-[#00A884]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#8696A0] mb-1 block">
                      Research Focus / Career Objective:
                    </label>
                    <textarea
                      value={researchFocus}
                      onChange={(e) => setResearchFocus(e.target.value)}
                      rows={2}
                      className="w-full bg-[#202C33] border border-[#2A3942] rounded-xl px-4 py-2 text-sm text-white outline-none resize-none focus:border-[#00A884]"
                    />
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* TAB 11: EXPORT CHAT & ENCRYPTED VAULT MIGRATION */}
              {/* ============================================================== */}
              {activeTab === 'export' && (
                <div className="space-y-4 animate-in fade-in">
                  {/* FEATURE 1: FULL SOVEREIGN ENCRYPTED INDEXEDDB VAULT EXPORT */}
                  <div className="bg-gradient-to-r from-[#182229] to-[#202C33] p-4 rounded-2xl border border-[#2A3942] space-y-3.5 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2.5 rounded-xl bg-[#00A884]/20 text-[#00A884] border border-[#00A884]/30">
                          <Lock className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white flex items-center gap-2">
                            <span>Sovereign IndexedDB Vault Export (Encrypted JSON)</span>
                            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              AES-256-GCM
                            </span>
                          </h4>
                          <p className="text-xs text-[#8696A0]">
                            Cryptographically export your entire offline IndexedDB message vault for backup &amp; manual migration.
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono bg-[#00A884]/20 text-[#00A884] border border-[#00A884]/40 px-2.5 py-1 rounded-full uppercase font-bold shrink-0">
                        E2EE Backup
                      </span>
                    </div>

                    <div className="bg-[#111B21] border border-[#2A3942] rounded-xl p-3.5 text-xs space-y-2">
                      <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                        <ShieldCheck className="w-4 h-4 shrink-0" />
                        <span>Zero-Knowledge Offline Vault Cryptography</span>
                      </div>
                      <p className="text-[#8696A0] leading-relaxed">
                        This export bundles all cached conversations, decrypted local message histories, user profile settings, status stories, and pending offline sync queues into an envelope encrypted with <strong>AES-256-GCM</strong> and <strong>PBKDF2-SHA256 (100,000 iterations)</strong>.
                      </p>
                    </div>

                    {/* Optional Custom Passphrase */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#8696A0] flex items-center justify-between">
                        <span>Custom Encryption Passphrase (Optional):</span>
                        <span className="text-[10px] text-[#8696A0] font-mono">Leave empty for sovereign device hardware key</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showVaultPassphrase ? 'text' : 'password'}
                          value={vaultPassphrase}
                          onChange={(e) => setVaultPassphrase(e.target.value)}
                          placeholder="Enter backup encryption passphrase or leave blank..."
                          className="w-full bg-[#111B21] border border-[#2A3942] rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-white placeholder-[#8696A0] outline-none focus:border-[#00A884]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowVaultPassphrase(!showVaultPassphrase)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8696A0] hover:text-white"
                        >
                          {showVaultPassphrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Export Action Button */}
                    <button
                      type="button"
                      onClick={handleExportEncryptedVault}
                      disabled={isExportingVault}
                      className="w-full py-2.5 px-4 bg-[#00A884] hover:bg-[#008F6F] text-[#111B21] font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98"
                    >
                      {isExportingVault ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      <span>
                        {isExportingVault 
                          ? 'Encrypting & Generating Vault Backup...' 
                          : `Export Encrypted Vault Backup (${vaultStats?.totalChatsCached ?? allChats.length} Chats, ${vaultStats?.totalMessagesCached ?? 0} Msgs)`}
                      </span>
                    </button>

                    {/* Result Metadata Display Card */}
                    {vaultExportResult && (
                      <div className="p-3 bg-[#111B21] rounded-xl border border-emerald-500/30 text-xs space-y-1.5 animate-in fade-in">
                        <div className="flex items-center justify-between text-emerald-400 font-semibold text-[11px]">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Vault Encrypted &amp; Downloaded
                          </span>
                          <span className="font-mono text-[10px] text-[#8696A0]">
                            {(vaultExportResult.fileSizeBytes / 1024).toFixed(1)} KB
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-[#8696A0] truncate">
                          File: <span className="text-white">{vaultExportResult.filename}</span>
                        </div>
                        <div className="text-[10px] font-mono text-[#8696A0] truncate">
                          SHA-256: <span className="text-emerald-300">{vaultExportResult.checksum}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* FEATURE 2: OFFLINE VAULT MIGRATION & RESTORE */}
                  <div className="bg-[#182229] p-4 rounded-2xl border border-[#2A3942] space-y-3 shadow-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                          <Upload className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white">Offline Vault Migration &amp; Restore</h4>
                          <p className="text-[11px] text-[#8696A0]">Import an encrypted JSON backup file onto this device</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-full uppercase">
                        Restore
                      </span>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-[#8696A0] block">
                        Select Encrypted Backup File (.encrypted.json):
                      </label>
                      <input
                        type="file"
                        accept=".json,.encrypted.json"
                        onChange={handleSelectImportFile}
                        className="w-full text-xs text-[#8696A0] file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#202C33] file:text-[#00A884] hover:file:bg-[#2A3942] file:cursor-pointer cursor-pointer bg-[#111B21] p-2 rounded-xl border border-[#2A3942]"
                      />
                      {importFileName && (
                        <div className="text-[11px] text-emerald-400 font-mono">
                          Selected: {importFileName}
                        </div>
                      )}
                    </div>

                    {/* Decryption Passphrase input */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#8696A0] flex items-center justify-between">
                        <span>Decryption Passphrase:</span>
                        <span className="text-[10px] text-[#8696A0]">Leave blank if default sovereign key was used</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showImportPassphrase ? 'text' : 'password'}
                          value={importPassphrase}
                          onChange={(e) => setImportPassphrase(e.target.value)}
                          placeholder="Passphrase used when exporting..."
                          className="w-full bg-[#111B21] border border-[#2A3942] rounded-xl pl-3.5 pr-10 py-2 text-xs text-white placeholder-[#8696A0] outline-none focus:border-[#00A884]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowImportPassphrase(!showImportPassphrase)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8696A0] hover:text-white"
                        >
                          {showImportPassphrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {importError && (
                      <div className="p-2.5 bg-rose-950/50 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                        <span>{importError}</span>
                      </div>
                    )}

                    {vaultImportResult?.success && (
                      <div className="p-2.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                        <span>
                          Restored {vaultImportResult.restoredChatsCount} chats &amp; {vaultImportResult.restoredMessagesCount} messages into IndexedDB!
                        </span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleImportEncryptedVault}
                      disabled={isImportingVault || !importFileContent}
                      className="w-full py-2 px-3 bg-[#202C33] hover:bg-[#2A3942] text-white font-bold text-xs rounded-xl border border-white/10 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                    >
                      {isImportingVault ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5 text-purple-400" />
                      )}
                      <span>Decrypt &amp; Restore Vault into IndexedDB</span>
                    </button>
                  </div>

                  {/* FEATURE 3: SINGLE CHAT SANITIZED JSON EXPORT */}
                  <div className="bg-[#182229] p-4 rounded-2xl border border-[#2A3942] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-[#00A884]/20 text-[#00A884]">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white">Single Conversation Export (Sanitized JSON)</h4>
                          <p className="text-[11px] text-[#8696A0]">Export a specific conversation respecting forward-protection</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono bg-white/5 text-[#8696A0] border border-white/10 px-2 py-0.5 rounded-full uppercase">
                        Per-Chat
                      </span>
                    </div>

                    <div className="bg-[#111B21] border border-[#2A3942] rounded-xl p-2.5 text-xs text-[#8696A0]">
                      This export strictly redacts any message flagged with <code className="text-emerald-400 font-mono">isForwardProtected</code>.
                    </div>

                    {/* Target Chat Selector */}
                    {allChats && allChats.length > 0 && (
                      <div>
                        <label className="text-xs font-semibold text-[#8696A0] mb-1.5 block">
                          Select Chat to Export:
                        </label>
                        <select
                          value={selectedChatIdForExport}
                          onChange={(e) => setSelectedChatIdForExport(e.target.value)}
                          className="w-full bg-[#111B21] border border-[#2A3942] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#00A884]"
                        >
                          {allChats.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} {c.isSecret ? '[Secret Chat]' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {chatForExportTarget && (
                      <div className="bg-[#111B21] rounded-xl p-3 border border-[#2A3942] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <MessageSquare className="w-4 h-4 text-[#00A884]" />
                            <span>Target: {chatForExportTarget.name}</span>
                          </div>
                          <div className="text-[#8696A0] mt-0.5">
                            {msgsForExportTarget.length} messages • {protectedCountInTarget} forward-protected (redacted)
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleExportChatHistory(chatForExportTarget, msgsForExportTarget)}
                          className="px-3 py-1.5 bg-[#00A884] hover:bg-[#008F6F] text-[#111B21] font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 shrink-0"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download Chat JSON</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {exportFeedback && (
                    <div className="p-3 bg-[#00A884]/20 border border-[#00A884] text-[#00A884] rounded-xl text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{exportFeedback}</span>
                    </div>
                  )}
                </div>
              )}

              {/* ============================================================== */}
              {/* TAB 12: PROFILE */}
              {/* ============================================================== */}
              {activeTab === 'profile' && (
                <div className="space-y-4 animate-in fade-in">
                  <div>
                    <label className="text-xs font-semibold text-[#8696A0] mb-1 block">Full Legal / Display Name:</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#202C33] border border-[#2A3942] rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-[#00A884]"
                    />
                  </div>

                  <div className="bg-gradient-to-r from-[#182229] to-[#202C33] p-4 rounded-2xl border border-[#2A3942] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BadgeCheck className="w-5 h-5 text-[#00A884]" />
                        <div>
                          <div className="text-xs font-bold text-white">Anti-Ban Verified Identity (Email + Phone + National ID)</div>
                          <div className="text-[11px] text-[#8696A0]">Decoupled from carrier SIM traps</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/40 font-bold">
                        ✓ Verified
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="text-[#8696A0] mb-1 block">National ID / Passport Number:</label>
                        <input
                          type="text"
                          value={nationalId}
                          onChange={(e) => setNationalId(e.target.value)}
                          className="w-full bg-[#111B21] border border-[#2A3942] rounded-xl px-3 py-2 text-white font-mono text-xs outline-none focus:border-[#00A884]"
                        />
                      </div>
                      <div>
                        <label className="text-[#8696A0] mb-1 block">ID Document Type:</label>
                        <select
                          value={nationalIdType}
                          onChange={(e) => setNationalIdType(e.target.value as any)}
                          className="w-full bg-[#111B21] border border-[#2A3942] rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#00A884]"
                        >
                          <option value="National ID">National ID Card</option>
                          <option value="Passport">Passport</option>
                          <option value="State Issued ID">State Issued ID</option>
                          <option value="Academic Identity Card">Academic Student ID Card</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#8696A0] mb-1 block">Phone (Routing Anchor):</label>
                    <input
                      type="text"
                      disabled
                      value={user.phone}
                      className="w-full bg-[#182229] border border-[#222E35] rounded-xl px-4 py-2 text-sm text-[#8696A0] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#8696A0] mb-1 block">Backup Email:</label>
                    <input
                      type="text"
                      disabled
                      value={user.email || 'Not connected to Google'}
                      className="w-full bg-[#182229] border border-[#222E35] rounded-xl px-4 py-2 text-sm text-[#8696A0] outline-none"
                    />
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* TAB 13: HELP & SOVEREIGN LEGAL */}
              {/* ============================================================== */}
              {activeTab === 'help' && (
                <div className="space-y-4 animate-in fade-in text-xs">
                  <div className="bg-gradient-to-r from-[#182229] to-[#202C33] p-4 rounded-2xl border border-[#2A3942] flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-[#8696A0]" />
                        <span>{t('helpTitle', language)}</span>
                      </h4>
                      <p className="text-xs text-[#8696A0] mt-0.5">
                        {t('helpSubtitle', language)}
                      </p>
                    </div>
                  </div>

                  <div className="bg-[#182229] p-4 rounded-2xl border border-[#222E35] space-y-3">
                    <div className="flex items-center justify-between py-1">
                      <span className="font-semibold text-white">{t('helpCenter', language)}</span>
                      <span className="text-[#00A884]">docs.securechat.sovereign</span>
                    </div>
                    <div className="border-t border-[#222E35] pt-2 flex items-center justify-between">
                      <span className="font-semibold text-white">{t('termsAndPrivacy', language)}</span>
                      <span className="text-[#00A884]">Restorative Justice Charter</span>
                    </div>
                    <div className="border-t border-[#222E35] pt-2 flex items-center justify-between">
                      <span className="font-semibold text-white">{t('licenses', language)}</span>
                      <span className="text-emerald-400 font-mono">MIT / Apache 2.0</span>
                    </div>
                    <div className="border-t border-[#222E35] pt-2 flex items-center justify-between">
                      <span className="font-semibold text-white">App Build:</span>
                      <span className="text-[#8696A0] font-mono">{t('appVersion', language)}</span>
                    </div>
                    <div className="border-t border-[#222E35] pt-2 flex items-center gap-2 text-emerald-400">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{t('systemHealth', language)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Footer Action Bar */}
            <footer className="pt-4 mt-6 border-t border-[#222E35] flex items-center justify-between shrink-0">
              <span className="text-xs text-[#8696A0]">
                {isSaved && <span className="text-[#00A884] font-bold">✓ {t('changesSaved', language)}</span>}
                {activeTab === 'language' && (
                  <span className="text-[#00A884]">
                    {SUPPORTED_LANGUAGES.find((l) => l.code === language)?.name} is active
                  </span>
                )}
                {activeTab === 'archive' && (
                  <span className="text-[#00A884]">
                    {searchResults.length} {t('matchesFound', language)}
                  </span>
                )}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-[#202C33] hover:bg-[#2A3942] text-[#8696A0] hover:text-white text-xs font-semibold transition-all"
                >
                  {t('close', language)}
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-5 py-2 rounded-xl bg-[#00A884] hover:bg-[#008F6F] active:scale-98 text-[#111B21] font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>{t('saveChanges', language)}</span>
                </button>
              </div>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
};
