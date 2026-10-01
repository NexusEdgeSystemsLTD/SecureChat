export type StudentTier = 'High School' | 'Bachelor' | 'Masters' | 'PhD' | 'Post-PhD';

export type ChatType = 'direct' | 'group' | 'channel' | 'study_circle' | 'secret';

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  tag: string;
  alg: string;
  keyFingerprint: string;
  authMac?: string;
  plainLength?: number;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  content: string; // Decrypted client-side or plain
  encryptedPayload: EncryptedPayload;
  timestamp: number;
  status: MessageStatus;
  mediaType?: 'text' | 'image' | 'voice' | 'doc' | 'code' | 'academic_paper';
  mediaUrl?: string;
  mediaName?: string;
  mediaSize?: string;
  metadataStripped?: boolean;
  selfDestructSeconds?: number;
  burnAt?: number;
  isBurned?: boolean;
  isForwardProtected?: boolean;
  isAcademicInsight?: boolean;
  academicMetadata?: {
    topic?: string;
    tier?: StudentTier;
    latexFormula?: string;
    codeLanguage?: string;
  };
  reactions?: Record<string, string[]>; // emoji -> array of user names
  replyTo?: {
    id: string;
    senderName: string;
    preview: string;
  };
}

export interface Chat {
  id: string;
  type: ChatType;
  name: string;
  avatar: string;
  subtitle?: string;
  participantIds: string[];
  unreadCount: number;
  lastMessage?: {
    text: string;
    timestamp: number;
    senderId: string;
    status: MessageStatus;
    isBurned?: boolean;
  };
  isPinned?: boolean;
  isArchived?: boolean;
  isMuted?: boolean;
  isSecret?: boolean;
  isOnline?: boolean;
  lastSeen?: string;
  selfDestructDefault?: number; // 0 = off, else seconds
  forwardRestricted?: boolean;
  safetyNumber: string;
  e2eeVerified?: boolean;
  academicTier?: StudentTier;
  topic?: string;
}

export interface StatusStory {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  mediaUrl?: string;
  timestamp: number;
  expiresAt: number;
  viewsCount: number;
  isViewed: boolean;
  encrypted: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  handle: string;
  phone: string;
  avatar: string;
  bio: string;
  studentTier: StudentTier;
  institution: string;
  fieldOfStudy: string;
  researchFocus: string;
  safetyNumber: string;
  publicKeyFingerprint: string;
  isAppLocked: boolean;
  pinCode: string;
  duressCode: string; // Stealth code that opens decoy clean state
  stealthModeActive: boolean;
}

export interface SecurityRelayHop {
  hop: number;
  type: string;
  location: string;
  ip: string;
  latency: string;
  cipher: string;
}

export interface PrivacySettings {
  torRelayEnabled: boolean;
  antiScreenshotNotice: boolean;
  defaultBurnTimer: number; // 0 = off
  metadataScrubber: boolean; // strips EXIF & GPS
  forwardProtection: boolean;
  callRelayAlways: boolean;
  readReceipts: boolean;
  lastSeenVisibility: 'everyone' | 'contacts' | 'nobody';
  profilePhotoVisibility: 'everyone' | 'contacts' | 'nobody';
  onlineIndicator: boolean;
  antiFingerprinting: boolean;
}

export interface TopicAffinity {
  name: string;
  category: string;
  score: number; // 0.0 to 1.0
  interactedCount: number;
}

export interface ContentSuggestion {
  id: string;
  title: string;
  tier: string;
  category: string;
  description: string;
  actionUrl: string;
  matchScore: number;
}

export interface CognitiveProfile {
  interests: TopicAffinity[];
  cognitiveTendencies: string[];
  personalizedSuggestions: ContentSuggestion[];
  careerRoadmapMilestone: {
    phase: string;
    milestone: string;
    recommendedAction: string;
  };
  lastUpdated: number;
}

export interface MentorshipSession {
  mentorPersona: 'research' | 'career' | 'stem' | 'general';
  mentorName: string;
  mentorTitle: string;
  mentorAvatar: string;
  messages: Array<{
    id: string;
    role: 'user' | 'mentor';
    content: string;
    timestamp: number;
    tier?: StudentTier;
  }>;
}

export interface CallSession {
  id: string;
  type: 'audio' | 'video';
  status: 'connecting' | 'connected' | 'ended';
  peerName: string;
  peerAvatar: string;
  peerTier?: StudentTier;
  durationSeconds: number;
  isMuted: boolean;
  isVideoOff: boolean;
  isRelayed: boolean;
  safetyNumber: string;
  encryptionCipher: string;
}
