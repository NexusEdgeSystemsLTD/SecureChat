import { Chat, CognitiveProfile, Message, PrivacySettings, StatusStory, UserProfile } from '../types';
import { encryptMessage, generateSafetyNumber } from './crypto';
import { INITIAL_COGNITIVE_PROFILE } from './mlEngine';

const STORAGE_KEYS = {
  USER_PROFILE: 'securechat_user_profile',
  CHATS: 'securechat_chats',
  MESSAGES: 'securechat_messages',
  PRIVACY: 'securechat_privacy_settings',
  COGNITIVE: 'securechat_cognitive_profile',
  STORIES: 'securechat_stories',
  ACTIVE_CHAT_ID: 'securechat_active_chat_id',
  DURESS_DECOY: 'securechat_duress_active',
};

export const DEFAULT_USER: UserProfile = {
  id: 'user_master_001',
  name: 'Alex Thorne',
  handle: '@alex_thorne_phd',
  phone: '+1 (555) 019-2834',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  bio: 'Advancing resilient decentralized protocols & AI safety. MSc → PhD candidate in Computer Science.',
  studentTier: 'Masters',
  institution: 'Institute of Advanced Computational Sciences',
  fieldOfStudy: 'Distributed Systems & Applied Cryptography',
  researchFocus: 'Zero-Knowledge Proofs, Lattice Cryptography & Private ML',
  safetyNumber: '38192 48102 91823 48192 10492 84719 20394 81029 38471 02938 47102 93847',
  publicKeyFingerprint: 'A8B2 4F19 82E0 D37C 90FA 12BC 88E1 4A6F',
  isAppLocked: false,
  pinCode: '1337',
  duressCode: '0000',
  stealthModeActive: false,
};

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  torRelayEnabled: true,
  antiScreenshotNotice: true,
  defaultBurnTimer: 0, // off by default unless in Secret Chats
  metadataScrubber: true,
  forwardProtection: true,
  callRelayAlways: true,
  readReceipts: true,
  lastSeenVisibility: 'everyone',
  profilePhotoVisibility: 'everyone',
  onlineIndicator: true,
  antiFingerprinting: true,
};

export const DEFAULT_STORIES: StatusStory[] = [
  {
    id: 'story-1',
    userId: 'mentor_turing',
    userName: 'Dr. Turing',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    content: '📑 Just published new guidance on defining PhD novel contributions for IEEE S&P 2026. Check the mentorship portal for the full checklist!',
    mediaUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
    timestamp: Date.now() - 3600000 * 2,
    expiresAt: Date.now() + 3600000 * 22,
    viewsCount: 38,
    isViewed: false,
    encrypted: true,
  },
  {
    id: 'story-2',
    userId: 'mentor_vance',
    userName: 'Elena Vance',
    userAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    content: '🚀 Three of our undergraduate mentees secured L4 Systems Engineering return offers today. Consistent architectural problem solving pays off!',
    mediaUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80',
    timestamp: Date.now() - 3600000 * 5,
    expiresAt: Date.now() + 3600000 * 19,
    viewsCount: 64,
    isViewed: false,
    encrypted: true,
  },
  {
    id: 'story-3',
    userId: 'user_master_001',
    userName: 'My Status',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    content: '🔒 SecureChat E2EE verified. All media scrubbed of GPS/EXIF data. Building privacy-first tools for scholars.',
    timestamp: Date.now() - 3600000 * 8,
    expiresAt: Date.now() + 3600000 * 16,
    viewsCount: 19,
    isViewed: true,
    encrypted: true,
  },
];

export const INITIAL_CHATS: Chat[] = [
  {
    id: 'chat_mentor_turing',
    type: 'study_circle',
    name: 'Dr. Turing 🔬 [Academic & Thesis Advisor]',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    subtitle: 'Principal AI Fellow & Doctoral Mentor',
    participantIds: ['user_master_001', 'mentor_turing'],
    unreadCount: 1,
    isPinned: true,
    isOnline: true,
    lastSeen: 'online',
    safetyNumber: '83921 47102 91823 48102 49102 83719 20194 81029 38471 02938 47102 93847',
    e2eeVerified: true,
    academicTier: 'PhD',
    topic: 'Doctoral Defense & Research Methodology',
    lastMessage: {
      text: 'I reviewed your LaTeX theorem formulation on zero-knowledge verifiable relays. The reduction proof holds firmly.',
      timestamp: Date.now() - 1000 * 60 * 12,
      senderId: 'mentor_turing',
      status: 'read',
    },
  },
  {
    id: 'chat_mentor_vance',
    type: 'study_circle',
    name: 'Elena Vance 🚀 [Career & Systems Coach]',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    subtitle: 'VP of Engineering & Career Strategist',
    participantIds: ['user_master_001', 'mentor_vance'],
    unreadCount: 0,
    isPinned: true,
    isOnline: true,
    lastSeen: 'online',
    safetyNumber: '19283 48102 91823 48102 49102 83719 20194 81029 38471 02938 47102 93847',
    e2eeVerified: true,
    academicTier: 'Bachelor',
    topic: 'Tech Career & Systems Design Architecture',
    lastMessage: {
      text: 'Remember: In senior systems design interviews, explicitly calculate your read/write IOPS and cache eviction strategy before drawing topologies.',
      timestamp: Date.now() - 1000 * 60 * 45,
      senderId: 'mentor_vance',
      status: 'read',
    },
  },
  {
    id: 'chat_secret_marcus',
    type: 'secret',
    name: 'Dr. Marcus Wei (Secret Chat) 🔒',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    subtitle: 'Burn-on-Read: 30s | Forward Protected',
    participantIds: ['user_master_001', 'user_marcus'],
    unreadCount: 0,
    isSecret: true,
    isPinned: false,
    isOnline: true,
    selfDestructDefault: 30,
    forwardRestricted: true,
    safetyNumber: '47182 91823 48102 49102 83719 20194 81029 38471 02938 47102 93847 18293',
    e2eeVerified: true,
    lastMessage: {
      text: 'This secret message will self-destruct 30 seconds after you view it. Tor relay hops active.',
      timestamp: Date.now() - 1000 * 60 * 3,
      senderId: 'user_marcus',
      status: 'read',
    },
  },
  {
    id: 'chat_circle_crypto',
    type: 'group',
    name: 'Quantum & Post-Quantum Cryptography Circle ⚛️',
    avatar: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=200&auto=format&fit=crop&q=80',
    subtitle: '48 Researchers & Graduate Fellows',
    participantIds: ['user_master_001', 'mentor_turing', 'user_marcus', 'user_sarah'],
    unreadCount: 3,
    isPinned: false,
    safetyNumber: '92817 48102 91823 48102 49102 83719 20194 81029 38471 02938 47102 93847',
    e2eeVerified: true,
    academicTier: 'Masters',
    topic: 'Lattice-Based Encryption & Kyber/Dilithium',
    lastMessage: {
      text: 'Has anyone benchmarked the polynomial multiplication cycle counts on ARM Cortex-M4 with AVX-512?',
      timestamp: Date.now() - 1000 * 60 * 8,
      senderId: 'user_sarah',
      status: 'read',
    },
  },
  {
    id: 'chat_sarah_signal',
    type: 'direct',
    name: 'Sarah Connor (Signal E2EE Verified)',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
    subtitle: 'Safety Number Verified 🛡️',
    participantIds: ['user_master_001', 'user_sarah'],
    unreadCount: 0,
    isOnline: false,
    lastSeen: 'Today at 6:42 AM',
    safetyNumber: '61928 48102 91823 48102 49102 83719 20194 81029 38471 02938 47102 93847',
    e2eeVerified: true,
    academicTier: 'Bachelor',
    lastMessage: {
      text: 'Thanks for sharing the clean EXIF image parser. The safety number match gave me complete peace of mind!',
      timestamp: Date.now() - 1000 * 60 * 95,
      senderId: 'user_sarah',
      status: 'read',
    },
  },
  {
    id: 'chat_relay_channel',
    type: 'channel',
    name: 'SecureChat Privacy & Tor Relay Broadcast 📡',
    avatar: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=200&auto=format&fit=crop&q=80',
    subtitle: 'Zero-Knowledge Network Telemetry',
    participantIds: ['user_master_001'],
    unreadCount: 0,
    safetyNumber: '77182 91823 48102 49102 83719 20194 81029 38471 02938 47102 93847 48192',
    e2eeVerified: true,
    lastMessage: {
      text: '🛡️ Network Shield Operational: 3-hop oblivious onion routing enabled. Traffic padding active with 0 byte metadata leakage.',
      timestamp: Date.now() - 1000 * 3600 * 4,
      senderId: 'system_network',
      status: 'read',
    },
  },
  {
    id: 'chat_highschool_admissions',
    type: 'study_circle',
    name: 'Olympiad & Ivy Admissions Fellowship 🏛️',
    avatar: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=200&auto=format&fit=crop&q=80',
    subtitle: 'High School & Pre-University Scholars',
    participantIds: ['user_master_001', 'user_hs_student'],
    unreadCount: 0,
    safetyNumber: '55182 91823 48102 49102 83719 20194 81029 38471 02938 47102 93847 99182',
    e2eeVerified: true,
    academicTier: 'High School',
    topic: 'AMC 12, ISEF Research Fair & Common App',
    lastMessage: {
      text: 'Today\'s focus: Framing your scientific curiosity essay around independent research rather than standard club roles.',
      timestamp: Date.now() - 1000 * 3600 * 14,
      senderId: 'mentor_turing',
      status: 'read',
    },
  },
];

export async function createInitialMessages(): Promise<Record<string, Message[]>> {
  const enc = async (text: string) => {
    return await encryptMessage(text);
  };

  const messagesByChat: Record<string, Message[]> = {
    chat_mentor_turing: [
      {
        id: 'msg-turing-1',
        chatId: 'chat_mentor_turing',
        senderId: 'mentor_turing',
        senderName: 'Dr. Turing',
        content: 'Welcome to your PhD & Academic Mentorship channel, Alex. Here we dissect novel research hypotheses, grant proposals, and conference publications with peer-review rigor.',
        encryptedPayload: await enc('Welcome to your PhD & Academic Mentorship channel, Alex.'),
        timestamp: Date.now() - 1000 * 60 * 60 * 3,
        status: 'read',
        isAcademicInsight: true,
      },
      {
        id: 'msg-turing-2',
        chatId: 'chat_mentor_turing',
        senderId: 'user_master_001',
        senderName: 'Alex Thorne',
        content: 'Thank you Dr. Turing! I am currently formalizing our zero-knowledge proof verification pipeline. Here is the formal relation:\n\n$$R = \\{ (x, w) \\mid x = \\text{Hash}(w) \\land \\text{VerifySig}(w, pk) = 1 \\}$$',
        encryptedPayload: await enc('Formalizing zero-knowledge verification relation.'),
        timestamp: Date.now() - 1000 * 60 * 60 * 2,
        status: 'read',
        academicMetadata: {
          topic: 'Zero-Knowledge Proofs',
          tier: 'PhD',
          latexFormula: 'R = \\{ (x, w) \\mid x = \\text{Hash}(w) \\land \\text{VerifySig}(w, pk) = 1 \\}',
        },
      },
      {
        id: 'msg-turing-3',
        chatId: 'chat_mentor_turing',
        senderId: 'mentor_turing',
        senderName: 'Dr. Turing',
        content: 'I reviewed your LaTeX theorem formulation on zero-knowledge verifiable relays. The reduction proof holds firmly. Make sure to clearly state your random oracle assumption in Section 3.2.',
        encryptedPayload: await enc('I reviewed your LaTeX theorem formulation...'),
        timestamp: Date.now() - 1000 * 60 * 12,
        status: 'read',
        isAcademicInsight: true,
        reactions: { '💡': ['Alex Thorne'] },
      },
    ],
    chat_mentor_vance: [
      {
        id: 'msg-vance-1',
        chatId: 'chat_mentor_vance',
        senderId: 'mentor_vance',
        senderName: 'Elena Vance',
        content: 'Alex, technical leadership in engineering requires two pillars: absolute execution reliability and the ability to articulate architectural trade-offs to both junior devs and executive VPs.',
        encryptedPayload: await enc('Technical leadership pillars...'),
        timestamp: Date.now() - 1000 * 60 * 120,
        status: 'read',
      },
      {
        id: 'msg-vance-2',
        chatId: 'chat_mentor_vance',
        senderId: 'mentor_vance',
        senderName: 'Elena Vance',
        content: 'Remember: In senior systems design interviews, explicitly calculate your read/write IOPS and cache eviction strategy before drawing topologies.',
        encryptedPayload: await enc('Remember: In senior systems design interviews...'),
        timestamp: Date.now() - 1000 * 60 * 45,
        status: 'read',
      },
    ],
    chat_secret_marcus: [
      {
        id: 'msg-secret-1',
        chatId: 'chat_secret_marcus',
        senderId: 'user_marcus',
        senderName: 'Dr. Marcus Wei',
        content: 'This secret chat uses Telegram-style burn-on-read timers and forward protection. Even if someone tries to copy or screenshot, the cryptographic protection and anti-screenshot shield engage instantly.',
        encryptedPayload: await enc('Secret chat demonstration with burn timers.'),
        timestamp: Date.now() - 1000 * 60 * 15,
        status: 'read',
        selfDestructSeconds: 60,
        burnAt: Date.now() + 1000 * 45,
        isForwardProtected: true,
      },
      {
        id: 'msg-secret-2',
        chatId: 'chat_secret_marcus',
        senderId: 'user_marcus',
        senderName: 'Dr. Marcus Wei',
        content: 'This secret message will self-destruct 30 seconds after you view it. Tor relay hops active.',
        encryptedPayload: await enc('This secret message will self-destruct...'),
        timestamp: Date.now() - 1000 * 60 * 3,
        status: 'read',
        selfDestructSeconds: 30,
        burnAt: Date.now() + 1000 * 25,
        isForwardProtected: true,
      },
    ],
    chat_circle_crypto: [
      {
        id: 'msg-circle-1',
        chatId: 'chat_circle_crypto',
        senderId: 'user_master_001',
        senderName: 'Alex Thorne',
        content: 'Welcome everyone! In this circle we share peer-reviewed preprint notes and reproducible benchmarks.',
        encryptedPayload: await enc('Welcome everyone!'),
        timestamp: Date.now() - 1000 * 60 * 180,
        status: 'read',
      },
      {
        id: 'msg-circle-2',
        chatId: 'chat_circle_crypto',
        senderId: 'user_sarah',
        senderName: 'Sarah Connor',
        content: 'Has anyone benchmarked the polynomial multiplication cycle counts on ARM Cortex-M4 with AVX-512?',
        encryptedPayload: await enc('Has anyone benchmarked...'),
        timestamp: Date.now() - 1000 * 60 * 8,
        status: 'read',
      },
    ],
    chat_sarah_signal: [
      {
        id: 'msg-sarah-1',
        chatId: 'chat_sarah_signal',
        senderId: 'user_master_001',
        senderName: 'Alex Thorne',
        content: 'Hey Sarah, here is the voice note summarizing the E2EE key exchange architecture we discussed.',
        encryptedPayload: await enc('Voice note on E2EE key exchange.'),
        timestamp: Date.now() - 1000 * 60 * 140,
        status: 'read',
        mediaType: 'voice',
        mediaUrl: 'audio_simulated_waveform',
        mediaSize: '0:34 • 480 KB',
      },
      {
        id: 'msg-sarah-2',
        chatId: 'chat_sarah_signal',
        senderId: 'user_sarah',
        senderName: 'Sarah Connor',
        content: 'Thanks for sharing the clean EXIF image parser. The safety number match gave me complete peace of mind!',
        encryptedPayload: await enc('Thanks for sharing...'),
        timestamp: Date.now() - 1000 * 60 * 95,
        status: 'read',
        metadataStripped: true,
      },
    ],
    chat_relay_channel: [
      {
        id: 'msg-relay-1',
        chatId: 'chat_relay_channel',
        senderId: 'system_network',
        senderName: 'SecureChat Relay Daemon',
        content: '🛡️ Network Shield Operational: 3-hop oblivious onion routing enabled. Traffic padding active with 0 byte metadata leakage.',
        encryptedPayload: await enc('Network Shield Operational: 3-hop onion routing.'),
        timestamp: Date.now() - 1000 * 3600 * 4,
        status: 'read',
      },
    ],
    chat_highschool_admissions: [
      {
        id: 'msg-hs-1',
        chatId: 'chat_highschool_admissions',
        senderId: 'mentor_turing',
        senderName: 'Dr. Turing',
        content: 'Today\'s focus: Framing your scientific curiosity essay around independent research rather than standard club roles.',
        encryptedPayload: await enc('Today\'s focus: Framing scientific curiosity...'),
        timestamp: Date.now() - 1000 * 3600 * 14,
        status: 'read',
      },
    ],
  };

  return messagesByChat;
}

// Storage helpers
export function loadUserProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse user profile', e);
  }
  return DEFAULT_USER;
}

export function saveUserProfile(profile: UserProfile): void {
  localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
}

export function loadChats(): Chat[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CHATS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load chats', e);
  }
  return INITIAL_CHATS;
}

export function saveChats(chats: Chat[]): void {
  localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chats));
}

export function loadPrivacySettings(): PrivacySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRIVACY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load privacy settings', e);
  }
  return DEFAULT_PRIVACY_SETTINGS;
}

export function savePrivacySettings(settings: PrivacySettings): void {
  localStorage.setItem(STORAGE_KEYS.PRIVACY, JSON.stringify(settings));
}

export function loadCognitiveProfile(): CognitiveProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COGNITIVE);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load cognitive profile', e);
  }
  return INITIAL_COGNITIVE_PROFILE;
}

export function saveCognitiveProfile(profile: CognitiveProfile): void {
  localStorage.setItem(STORAGE_KEYS.COGNITIVE, JSON.stringify(profile));
}

export function loadStories(): StatusStory[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STORIES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load stories', e);
  }
  return DEFAULT_STORIES;
}

export function saveStories(stories: StatusStory[]): void {
  localStorage.setItem(STORAGE_KEYS.STORIES, JSON.stringify(stories));
}
