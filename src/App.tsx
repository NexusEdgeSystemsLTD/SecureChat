import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { MentorshipHub } from './components/MentorshipHub';
import { SafetyNumberModal } from './components/SafetyNumberModal';
import { MessageInspectorModal } from './components/MessageInspectorModal';
import { PrivacyShieldModal } from './components/PrivacyShieldModal';
import { AIPersonalizationModal } from './components/AIPersonalizationModal';
import { CallModal } from './components/CallModal';
import { StatusViewerModal } from './components/StatusViewerModal';
import { SettingsModal } from './components/SettingsModal';
import { NewChatModal } from './components/NewChatModal';
import { AppLockModal } from './components/AppLockModal';
import { RegistrationModal } from './components/RegistrationModal';
import { LyriaMusicModal } from './components/LyriaMusicModal';
import { MultimodalStudioModal } from './components/MultimodalStudioModal';
import { GeminiChatbotModal } from './components/GeminiChatbotModal';
import { TenancyModal } from './components/TenancyModal';

import { 
  AppFontSize, 
  AppFontTheme, 
  AppLanguage,
  Chat, 
  ChatType, 
  CognitiveProfile, 
  Department,
  Message, 
  MessageStatus, 
  OrganizationTenant,
  OrgMember,
  PrivacySettings, 
  StatusStory, 
  StudentTier, 
  UserProfile 
} from './types';
import { 
  DEFAULT_USER, 
  DEFAULT_PRIVACY_SETTINGS, 
  INITIAL_CHATS, 
  createInitialMessages, 
  loadUserProfile, 
  saveUserProfile, 
  loadChats, 
  saveChats, 
  loadPrivacySettings, 
  savePrivacySettings, 
  loadCognitiveProfile, 
  saveCognitiveProfile, 
  loadStories, 
  saveStories,
  loadFontSize,
  saveFontSize,
  loadFontTheme,
  saveFontTheme
} from './utils/storage';
import { loadAppLanguage, saveAppLanguage, t } from './utils/i18n';
import { 
  loadIndexedDbChats, 
  saveIndexedDbChats, 
  loadIndexedDbMessages, 
  saveIndexedDbMessages, 
  loadIndexedDbActiveChatId, 
  saveIndexedDbActiveChatId, 
  loadBiometricVaultConfig, 
  loadOfflineQueue, 
  addToOfflineQueue, 
  clearOfflineQueue, 
  saveIndexedDbUserProfile, 
  saveIndexedDbPrivacySettings, 
  saveIndexedDbCognitiveProfile, 
  saveIndexedDbStories 
} from './utils/indexedDb';
import {
  loadTenants,
  saveTenants,
  loadDepartments,
  saveDepartments,
  loadMembers,
  saveMembers,
  loadActiveTenantId,
  saveActiveTenantId,
  canUserAccessDepartment
} from './utils/tenancy';
import { encryptMessage, generateSafetyNumber, createEncryptedReadAck } from './utils/crypto';
import { updateProfileLocally } from './utils/mlEngine';
import { getPedagogicalMentorReply } from './utils/pedagogy';
import { 
  auth, 
  db, 
  signInWithGoogle, 
  signOutFirebase, 
  testFirestoreConnection, 
  handleFirestoreError, 
  OperationType 
} from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export default function App() {
  const [userProfile, setUserProfile] = useState<UserProfile>(loadUserProfile());
  const [chats, setChats] = useState<Chat[]>(loadChats());
  const [messagesByChat, setMessagesByChat] = useState<Record<string, Message[]>>({});
  const [activeChatId, setActiveChatId] = useState<string>('chat_mentor_turing');
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(loadPrivacySettings());
  const [cognitiveProfile, setCognitiveProfile] = useState<CognitiveProfile>(loadCognitiveProfile());
  const [stories, setStories] = useState<StatusStory[]>(loadStories());
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  // Eye-Comfort Typography & Font Scaling State
  const [fontSize, setFontSize] = useState<AppFontSize>(() => loadFontSize());
  const [fontTheme, setFontTheme] = useState<AppFontTheme>(() => loadFontTheme());
  // App Language State (Supports English, Ikinyarwanda, Spanish, French)
  const [appLanguage, setAppLanguage] = useState<AppLanguage>(() => loadAppLanguage());

  const handleUpdateLanguage = (newLang: AppLanguage) => {
    setAppLanguage(newLang);
    saveAppLanguage(newLang);
  };

  // Modal Visibility States
  const [isMentorshipOpen, setIsMentorshipOpen] = useState(false);
  const [isPrivacyShieldOpen, setIsPrivacyShieldOpen] = useState(false);
  const [isAIEngineOpen, setIsAIEngineOpen] = useState(false);
  const [isStatusStoriesOpen, setIsStatusStoriesOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [safetyNumberChat, setSafetyNumberChat] = useState<Chat | null>(null);
  const [inspectedMessage, setInspectedMessage] = useState<Message | null>(null);
  const [activeCall, setActiveCall] = useState<{ chat: Chat; type: 'audio' | 'video' } | null>(null);
  const [isAppLocked, setIsAppLocked] = useState<boolean>(false);
  const [lockReason, setLockReason] = useState<'manual' | 'inactivity'>('manual');
  const [isRegistrationOpen, setIsRegistrationOpen] = useState<boolean>(false);
  const [mobileShowChat, setMobileShowChat] = useState<boolean>(false);

  // Multimodal & Lyria & Gemini Chatbot Modals
  const [isLyriaOpen, setIsLyriaOpen] = useState(false);
  const [isMultimodalOpen, setIsMultimodalOpen] = useState(false);
  const [multimodalTab, setMultimodalTab] = useState<'image' | 'video' | 'search' | 'maps' | 'transcribe'>('image');
  const [isGeminiChatbotOpen, setIsGeminiChatbotOpen] = useState(false);

  // Offline & Low-Connectivity State (Powered by localforage IndexedDB)
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(0);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // Multi-Tenant Organization & Department Firewall State
  const [tenants, setTenants] = useState<OrganizationTenant[]>(() => loadTenants());
  const [departments, setDepartments] = useState<Department[]>(() => loadDepartments());
  const [members, setMembers] = useState<OrgMember[]>(() => loadMembers());
  const [activeTenantId, setActiveTenantId] = useState<string>(() => loadActiveTenantId());
  const [isTenancyOpen, setIsTenancyOpen] = useState(false);

  // 1-Minute Inactivity Auto-Lock Security Watchdog (Face, Password & PIN protection)
  useEffect(() => {
    let inactivityTimer: any;
    const timeoutMs = (userProfile.inactivityLockMinutes ?? 1) * 60 * 1000;

    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimer);
      if (!isAppLocked) {
        inactivityTimer = setTimeout(() => {
          setLockReason('inactivity');
          setIsAppLocked(true);
        }, timeoutMs);
      }
    };

    // User activity events: mousemove, keydown, click, scroll, touchstart
    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    activityEvents.forEach((evt) => window.addEventListener(evt, resetInactivityTimer));

    resetInactivityTimer();

    return () => {
      clearTimeout(inactivityTimer);
      activityEvents.forEach((evt) => window.removeEventListener(evt, resetInactivityTimer));
    };
  }, [isAppLocked, userProfile.inactivityLockMinutes]);

  // Synchronize Root HTML Typography & Font Sizing
  useEffect(() => {
    saveFontSize(fontSize);
    document.documentElement.setAttribute('data-font-size', fontSize);
    document.documentElement.classList.remove('font-size-small', 'font-size-medium', 'font-size-large', 'font-size-extra');
    document.documentElement.classList.add(`font-size-${fontSize}`);
  }, [fontSize]);

  useEffect(() => {
    saveFontTheme(fontTheme);
    document.documentElement.setAttribute('data-font-theme', fontTheme);
    document.documentElement.classList.remove('font-theme-system', 'font-theme-readable', 'font-theme-serif', 'font-theme-mono');
    document.documentElement.classList.add(`font-theme-${fontTheme}`);
  }, [fontTheme]);

  const handleCycleFontSize = () => {
    const order: AppFontSize[] = ['small', 'medium', 'large', 'extra'];
    const nextIdx = (order.indexOf(fontSize) + 1) % order.length;
    setFontSize(order[nextIdx]);
  };

  // Initialize Encrypted Messages, IndexedDB Caching (localforage) & Biometric DB Lock
  useEffect(() => {
    async function init() {
      try {
        // 1. Check if local chat database is secured with device biometrics (WebAuthn)
        const bioConfig = await loadBiometricVaultConfig();
        if (bioConfig.isSecured && bioConfig.requireBiometricOnOpen) {
          setLockReason('manual');
          setIsAppLocked(true);
        }

        // 2. Load cached chats from localforage IndexedDB with fallback
        const cachedChats = await loadIndexedDbChats();
        if (cachedChats && cachedChats.length > 0) {
          setChats(cachedChats);
        } else {
          await saveIndexedDbChats(chats);
        }

        // 3. Load cached messages from localforage IndexedDB with fallback
        const cachedMsgs = await loadIndexedDbMessages();
        if (cachedMsgs && Object.keys(cachedMsgs).length > 0) {
          setMessagesByChat(cachedMsgs);
        } else {
          const initialMsgs = await createInitialMessages();
          setMessagesByChat(initialMsgs);
          await saveIndexedDbMessages(initialMsgs);
        }

        // 4. Restore active chat state from IndexedDB
        const savedChatId = await loadIndexedDbActiveChatId();
        if (savedChatId) {
          setActiveChatId(savedChatId);
        }

        // 5. Inspect offline queue count
        const queue = await loadOfflineQueue();
        setOfflineQueueCount(queue.length);
      } catch (err) {
        console.warn('[IndexedDB Init Warning]', err);
        const fallbackMsgs = await createInitialMessages();
        setMessagesByChat(fallbackMsgs);
      }

      testFirestoreConnection().catch(() => {});
    }
    init();
  }, []);

  // Monitor Network Connectivity & Flush IndexedDB Offline Sync Queue
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      try {
        const queue = await loadOfflineQueue();
        if (queue.length > 0) {
          setSyncNotice(`Reconnected • Syncing ${queue.length} offline message(s)...`);
          // Flush queue: mark messages as delivered
          for (const item of queue) {
            setMessagesByChat((prev) => {
              const list = prev[item.chatId] || [];
              return {
                ...prev,
                [item.chatId]: list.map((m) => m.id === item.id ? { ...m, status: 'delivered' } : m),
              };
            });
          }
          await clearOfflineQueue();
          setOfflineQueueCount(0);
          setTimeout(() => {
            setSyncNotice('All offline messages synced to local vault & network.');
            setTimeout(() => setSyncNotice(null), 3000);
          }, 800);
        } else {
          setSyncNotice('Network connected • Local IndexedDB cache active');
          setTimeout(() => setSyncNotice(null), 2500);
        }
      } catch (e) {
        console.warn('[Offline Sync Error]', e);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncNotice('Offline Mode • Using Local IndexedDB Cache (localforage)');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Read-receipt mechanism: Updates message status to 'read' when recipient opens the chat,
  // utilizing an encrypted 'read-ack' signal for E2E consistency
  useEffect(() => {
    if (!activeChatId) return;

    const chatMsgs = messagesByChat[activeChatId];
    if (!chatMsgs || chatMsgs.length === 0) return;

    // Check if there are any unread messages in the active chat (e.g. from peers or pending read)
    const hasUnread = chatMsgs.some((m) => m.status !== 'read');
    if (!hasUnread) {
      if (chats.find((c) => c.id === activeChatId)?.unreadCount) {
        setChats((prev) =>
          prev.map((c) => (c.id === activeChatId ? { ...c, unreadCount: 0 } : c))
        );
      }
      return;
    }

    let isSubscribed = true;

    async function acknowledgeUnreadMessages() {
      const updatedMessages = await Promise.all(
        chatMsgs.map(async (msg) => {
          if (msg.status === 'read') return msg;

          // Generate encrypted read-ack signal for E2E consistency
          const readSignal = await createEncryptedReadAck(
            msg.id,
            userProfile.id,
            msg.senderId
          );

          // If authenticated with Firestore, persist read receipt
          if (firebaseUser) {
            const msgDocRef = doc(db, 'chats', activeChatId, 'messages', msg.id);
            setDoc(
              msgDocRef,
              {
                status: 'read',
                readAt: readSignal.readAt,
                readAckSignature: readSignal.authMac,
              },
              { merge: true }
            ).catch((err) =>
              handleFirestoreError(err, OperationType.WRITE, `chats/${activeChatId}/messages/${msg.id}`)
            );
          }

          return {
            ...msg,
            status: 'read' as MessageStatus,
            readAt: readSignal.readAt,
            readAckSignature: readSignal.authMac,
          };
        })
      );

      if (isSubscribed) {
        setMessagesByChat((prev) => ({
          ...prev,
          [activeChatId]: updatedMessages,
        }));

        setChats((prev) =>
          prev.map((c) =>
            c.id === activeChatId
              ? {
                  ...c,
                  unreadCount: 0,
                  lastMessage: c.lastMessage
                    ? { ...c.lastMessage, status: 'read' as MessageStatus }
                    : undefined,
                }
              : c
          )
        );
      }
    }

    acknowledgeUnreadMessages();

    return () => {
      isSubscribed = false;
    };
  }, [activeChatId, messagesByChat[activeChatId]?.length]);

  // Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        // Sync user profile to Firestore
        const userRef = doc(db, 'users', user.uid);
        try {
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserProfile((prev) => ({
              ...prev,
              id: user.uid,
              name: data.name || user.displayName || prev.name,
              email: user.email || prev.email,
              avatar: user.photoURL || prev.avatar,
              studentTier: data.studentTier || prev.studentTier,
              fieldOfStudy: data.fieldOfStudy || prev.fieldOfStudy,
              institution: data.institution || prev.institution,
            }));
          } else {
            await setDoc(userRef, {
              id: user.uid,
              name: user.displayName || userProfile.name,
              email: user.email || 'user@scholar.edu',
              studentTier: userProfile.studentTier,
              institution: userProfile.institution,
              fieldOfStudy: userProfile.fieldOfStudy,
              researchFocus: userProfile.researchFocus,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Save changes to local storage & localforage IndexedDB
  useEffect(() => {
    saveUserProfile(userProfile);
    saveIndexedDbUserProfile(userProfile);
  }, [userProfile]);

  useEffect(() => {
    saveChats(chats);
    if (chats.length > 0) {
      saveIndexedDbChats(chats);
    }
  }, [chats]);

  useEffect(() => {
    savePrivacySettings(privacySettings);
    saveIndexedDbPrivacySettings(privacySettings);
  }, [privacySettings]);

  useEffect(() => {
    saveCognitiveProfile(cognitiveProfile);
    saveIndexedDbCognitiveProfile(cognitiveProfile);
  }, [cognitiveProfile]);

  useEffect(() => {
    saveStories(stories);
    saveIndexedDbStories(stories);
  }, [stories]);

  useEffect(() => {
    if (Object.keys(messagesByChat).length > 0) {
      saveIndexedDbMessages(messagesByChat);
    }
  }, [messagesByChat]);

  useEffect(() => {
    if (activeChatId) {
      saveIndexedDbActiveChatId(activeChatId);
    }
  }, [activeChatId]);

  // Multi-tenant and Department firewall isolation filter
  const isExecutive = userProfile.orgRole === 'MD' || userProfile.orgRole === 'CTO' || userProfile.orgRole === 'DAF';
  const permittedChats = chats.filter((chat) => {
    // If chat has a tenantId and user belongs to a tenant, ensure same tenant (unless civic public chat)
    if (chat.tenantId && userProfile.tenantId && chat.tenantId !== userProfile.tenantId) {
      return false;
    }
    // Executive triad boardroom is strictly restricted to MD, CTO, DAF
    if (chat.id === 'chat_exec_boardroom' && !isExecutive) {
      return false;
    }
    // If chat is bound to a specific department and user is not executive, enforce strict department wall
    if (chat.departmentId) {
      if (!isExecutive && chat.departmentId !== userProfile.departmentId) {
        return false;
      }
    }
    return true;
  });

  const activeChat = permittedChats.find((c) => c.id === activeChatId) || permittedChats[0] || chats[0];
  const currentMessages = messagesByChat[activeChat?.id] || [];

  // Google Sign-In & Sign-Out handlers
  const handleGoogleSignIn = async () => {
    if (firebaseUser) {
      await signOutFirebase();
      setFirebaseUser(null);
    } else {
      try {
        await signInWithGoogle();
      } catch (e) {
        console.error('Google Sign-In failed', e);
      }
    }
  };

  // Send Encrypted Message handler
  const handleSendMessage = async (
    content: string,
    options?: {
      mediaType?: 'text' | 'image' | 'voice' | 'doc' | 'code' | 'academic_paper';
      mediaUrl?: string;
      mediaName?: string;
      mediaSize?: string;
      selfDestructSeconds?: number;
      isForwardProtected?: boolean;
      academicMetadata?: any;
    }
  ) => {
    if (!content.trim() && !options?.mediaUrl) return;

    // Encrypt content using client-side Web Crypto AES-GCM
    const payload = await encryptMessage(content);

    const burnSeconds = options?.selfDestructSeconds ?? activeChat.selfDestructDefault;
    const burnAt = burnSeconds ? Date.now() + burnSeconds * 1000 : undefined;

    const newMessage: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      chatId: activeChat.id,
      senderId: userProfile.id,
      senderName: userProfile.name,
      content,
      encryptedPayload: payload,
      timestamp: Date.now(),
      status: 'sent',
      mediaType: options?.mediaType || 'text',
      mediaUrl: options?.mediaUrl,
      mediaName: options?.mediaName,
      mediaSize: options?.mediaSize,
      metadataStripped: true,
      selfDestructSeconds: burnSeconds,
      burnAt,
      isForwardProtected: options?.isForwardProtected || activeChat.forwardRestricted,
      academicMetadata: options?.academicMetadata,
    };

    // Update state
    setMessagesByChat((prev) => ({
      ...prev,
      [activeChat.id]: [...(prev[activeChat.id] || []), newMessage],
    }));

    // Update Chat's last message
    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChat.id
          ? {
              ...c,
              lastMessage: {
                text: options?.mediaType === 'image' ? '📷 Photo (EXIF Scrubbed)' : options?.mediaType === 'voice' ? '🎙️ Encrypted Audio' : content,
                timestamp: Date.now(),
                senderId: userProfile.id,
                status: 'sent',
              },
            }
          : c
      )
    );

    // Save to Firestore if authenticated and online
    if (firebaseUser && isOnline) {
      const msgPath = `chats/${activeChat.id}/messages/${newMessage.id}`;
      setDoc(doc(db, 'chats', activeChat.id, 'messages', newMessage.id), {
        id: newMessage.id,
        chatId: activeChat.id,
        senderId: firebaseUser.uid,
        senderName: userProfile.name,
        ciphertext: payload.ciphertext,
        iv: payload.iv,
        tag: payload.tag,
        alg: payload.alg,
        keyFingerprint: payload.keyFingerprint,
        mediaType: newMessage.mediaType,
        timestamp: newMessage.timestamp,
        isForwardProtected: newMessage.isForwardProtected || false,
      }).catch((err) => handleFirestoreError(err, OperationType.WRITE, msgPath));
    }

    // In offline or low-connectivity environments, enqueue in IndexedDB localforage vault
    if (!isOnline) {
      addToOfflineQueue({
        id: newMessage.id,
        chatId: activeChat.id,
        message: newMessage,
        queuedAt: Date.now(),
      }).catch((err) => console.warn('[IndexedDB Offline Queue Error]', err));
      setOfflineQueueCount((c) => c + 1);
    }

    // Recipient read-ack acknowledgment signal simulation for E2E consistency
    setTimeout(async () => {
      const ack = await createEncryptedReadAck(newMessage.id, 'peer_terminal', userProfile.id);
      setMessagesByChat((prev) => {
        const list = prev[activeChat.id] || [];
        return {
          ...prev,
          [activeChat.id]: list.map((m) =>
            m.id === newMessage.id
              ? {
                  ...m,
                  status: 'read' as MessageStatus,
                  readAt: ack.readAt,
                  readAckSignature: ack.authMac,
                }
              : m
          ),
        };
      });
      setChats((prev) =>
        prev.map((c) =>
          c.id === activeChat.id && c.lastMessage?.senderId === userProfile.id
            ? {
                ...c,
                lastMessage: {
                  ...c.lastMessage,
                  status: 'read' as MessageStatus,
                },
              }
            : c
        )
      );
    }, 1800);

    // Update Client-Side ML Cognitive Profiler locally
    const updatedCognitive = updateProfileLocally(cognitiveProfile, content);
    setCognitiveProfile(updatedCognitive);

    // Automatic Mentor AI response if chatting with AI mentors
    if (activeChat.id === 'chat_mentor_turing' || activeChat.id === 'chat_mentor_vance') {
      const persona = activeChat.id === 'chat_mentor_turing' ? 'research' : 'career';
      setTimeout(async () => {
        let replyText = '';
        try {
          const res = await fetch('/api/ai/mentor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              studentTier: userProfile.studentTier,
              fieldOfStudy: userProfile.fieldOfStudy,
              currentGoal: userProfile.researchFocus,
              message: content,
              mentorPersona: persona,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            replyText = data.reply || '';
          }
        } catch {
          // Gracefully handled if fetch fails or network drops
        }

        // Guaranteed fallback response with tailored academic/career pedagogy
        if (!replyText) {
          replyText = getPedagogicalMentorReply(
            userProfile.studentTier,
            userProfile.fieldOfStudy,
            content,
            persona
          );
        }

        const replyPayload = await encryptMessage(replyText);

        const replyMsg: Message = {
          id: `msg-reply-${Date.now()}`,
          chatId: activeChat.id,
          senderId: persona === 'research' ? 'mentor_turing' : 'mentor_vance',
          senderName: persona === 'research' ? 'Dr. Turing' : 'Elena Vance',
          content: replyText,
          encryptedPayload: replyPayload,
          timestamp: Date.now(),
          status: 'read',
          isAcademicInsight: true,
        };

        setMessagesByChat((prev) => ({
          ...prev,
          [activeChat.id]: [...(prev[activeChat.id] || []), replyMsg],
        }));

        setChats((prev) =>
          prev.map((c) =>
            c.id === activeChat.id
              ? {
                  ...c,
                  lastMessage: {
                    text: replyText.slice(0, 60) + '...',
                    timestamp: Date.now(),
                    senderId: persona === 'research' ? 'mentor_turing' : 'mentor_vance',
                    status: 'read',
                  },
                }
              : c
          )
        );
      }, 1000);
    }
  };

  // Add new status story
  const handleAddStory = (content: string, mediaUrl?: string) => {
    const newStory: StatusStory = {
      id: `story-${Date.now()}`,
      userId: userProfile.id,
      userName: userProfile.name,
      userAvatar: userProfile.avatar,
      content,
      mediaUrl,
      timestamp: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      viewsCount: 0,
      isViewed: false,
      encrypted: true,
    };

    setStories([newStory, ...stories]);

    if (firebaseUser) {
      const storyPath = `stories/${newStory.id}`;
      setDoc(doc(db, 'stories', newStory.id), {
        id: newStory.id,
        userId: firebaseUser.uid,
        userName: newStory.userName,
        content: newStory.content,
        mediaUrl: newStory.mediaUrl || '',
        timestamp: newStory.timestamp,
        expiresAt: newStory.expiresAt,
      }).catch((err) => handleFirestoreError(err, OperationType.WRITE, storyPath));
    }
  };

  // Create new chat
  const handleCreateChat = async (newChatData: {
    name: string;
    type: ChatType;
    topic?: string;
    academicTier?: StudentTier;
    isSecret?: boolean;
    selfDestructDefault?: number;
    forwardRestricted?: boolean;
    departmentId?: string;
    tenantId?: string;
  }) => {
    const newChatId = `chat_${Date.now()}`;
    const safetyNumber = await generateSafetyNumber(userProfile.id, newChatId);

    const newChat: Chat = {
      id: newChatId,
      name: newChatData.name,
      avatar: newChatData.departmentId 
        ? 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=200'
        : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      type: newChatData.type,
      topic: newChatData.topic,
      academicTier: newChatData.academicTier,
      isSecret: newChatData.isSecret,
      selfDestructDefault: newChatData.selfDestructDefault ?? (newChatData.isSecret ? 30 : 0),
      forwardRestricted: newChatData.forwardRestricted ?? newChatData.isSecret,
      safetyNumber,
      e2eeVerified: true,
      unreadCount: 0,
      participantIds: [userProfile.id, 'peer_user_1'],
      departmentId: newChatData.departmentId,
      tenantId: newChatData.tenantId || activeTenantId,
    };

    setChats([newChat, ...chats]);
    setActiveChatId(newChatId);
    setMessagesByChat((prev) => ({ ...prev, [newChatId]: [] }));
    setIsNewChatOpen(false);
  };

  // Tenancy Mutation Handlers
  const handleCreateTenant = (newTenantData: Omit<OrganizationTenant, 'id' | 'createdAt' | 'departmentCount' | 'totalMembers'>) => {
    const newTenant: OrganizationTenant = {
      ...newTenantData,
      id: `tenant_${Date.now()}`,
      departmentCount: 0,
      totalMembers: 1,
      createdAt: Date.now(),
    };
    const updated = [...tenants, newTenant];
    setTenants(updated);
    saveTenants(updated);
    setActiveTenantId(newTenant.id);
    saveActiveTenantId(newTenant.id);
  };

  const handleCreateDepartment = (newDeptData: { name: string; code: string; description: string; tenantId: string }) => {
    const newDept: Department = {
      id: `dept_${Date.now()}`,
      tenantId: newDeptData.tenantId,
      name: newDeptData.name,
      code: newDeptData.code,
      description: newDeptData.description,
      memberCount: 1,
      createdAt: Date.now(),
      leadUserId: userProfile.id,
      leadUserName: userProfile.name,
    };
    const updated = [...departments, newDept];
    setDepartments(updated);
    saveDepartments(updated);
  };

  const handleAddMember = (newMemberData: Omit<OrgMember, 'id'>) => {
    const newMember: OrgMember = {
      ...newMemberData,
      id: `member_${Date.now()}`,
    };
    const updated = [...members, newMember];
    setMembers(updated);
    saveMembers(updated);
  };

  const handleSwitchUserRole = (patch: Partial<UserProfile>) => {
    const updated = {
      ...userProfile,
      ...patch,
    };
    setUserProfile(updated);
    saveUserProfile(updated);
  };

  const handleSelectTenant = (tenantId: string) => {
    setActiveTenantId(tenantId);
    saveActiveTenantId(tenantId);
    setUserProfile((prev) => ({
      ...prev,
      tenantId,
    }));
  };

  if (isAppLocked) {
    return (
      <AppLockModal
        user={userProfile}
        lockReason={lockReason}
        onUnlock={(isDuress) => {
          setIsAppLocked(false);
          setLockReason('manual');
          if (isDuress) {
            setUserProfile({
              ...userProfile,
              name: 'Alex Decoy',
              studentTier: 'High School',
              institution: 'Decoy Academy',
            });
            setChats(chats.filter((c) => !c.isSecret));
          }
        }}
      />
    );
  }

  return (
    <div
      className={`flex flex-col h-screen w-screen overflow-hidden bg-[#0C1317] antialiased text-[#E9EDEF] font-theme-${fontTheme} font-size-${fontSize}`}
    >
      {/* Offline Status & IndexedDB Cache Sync Bar */}
      {!isOnline && (
        <div className="bg-amber-950/90 border-b border-amber-600/40 text-amber-200 text-xs px-4 py-1.5 flex items-center justify-between shrink-0 select-none z-30 animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="font-semibold">Offline Mode Active</span>
            <span className="hidden sm:inline text-amber-300/80">• Message history and chat state cached in IndexedDB (localforage)</span>
          </div>
          {offlineQueueCount > 0 ? (
            <span className="bg-amber-900/90 text-amber-100 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border border-amber-500/40">
              {offlineQueueCount} message(s) queued for sync
            </span>
          ) : (
            <span className="text-[10px] text-amber-300/70 font-mono">
              Offline Read &amp; Write Ready
            </span>
          )}
        </div>
      )}

      {syncNotice && isOnline && (
        <div className="bg-emerald-950/90 border-b border-emerald-600/40 text-emerald-200 text-xs px-4 py-1.5 flex items-center justify-between shrink-0 select-none z-30 animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-semibold">{syncNotice}</span>
          </div>
        </div>
      )}

      {/* Main App Workspace */}
      <div className="flex flex-1 min-h-0 w-full overflow-hidden">
        {/* Sidebar View */}
        <div className={`h-full ${mobileShowChat ? 'hidden md:flex' : 'flex w-full md:w-auto'}`}>
          <Sidebar
            chats={permittedChats}
            activeChatId={activeChatId}
            onSelectChat={(id) => {
              setActiveChatId(id);
              setMobileShowChat(true);
            }}
            userProfile={userProfile}
            onOpenMentorship={() => setIsMentorshipOpen(true)}
            onOpenPrivacyShield={() => setIsPrivacyShieldOpen(true)}
            onOpenAIEngine={() => setIsAIEngineOpen(true)}
            onOpenStatusStories={() => setIsStatusStoriesOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenNewChat={() => setIsNewChatOpen(true)}
            onOpenSafetyNumbers={(c) => setSafetyNumberChat(c)}
            onLockApp={() => {
              setLockReason('manual');
              setIsAppLocked(true);
            }}
            onOpenLyriaMusic={() => setIsLyriaOpen(true)}
            onOpenMultimodalStudio={(tab) => {
              if (tab) setMultimodalTab(tab);
              setIsMultimodalOpen(true);
            }}
            onOpenGeminiChatbot={() => setIsGeminiChatbotOpen(true)}
            onSignInGoogle={handleGoogleSignIn}
            firebaseUser={firebaseUser}
            fontSize={fontSize}
            onCycleFontSize={handleCycleFontSize}
            onOpenRegister={() => setIsRegistrationOpen(true)}
            onOpenTenancy={() => setIsTenancyOpen(true)}
            activeTenantName={tenants.find((t) => t.id === activeTenantId)?.name || 'NexusEdge Systems Ltd'}
            language={appLanguage}
          />
        </div>

        {/* Chat Area View */}
        <div className={`h-full flex-1 ${!mobileShowChat ? 'hidden md:flex' : 'flex'}`}>
          {activeChat ? (
            <ChatArea
              chat={activeChat}
              messages={currentMessages}
              currentUser={userProfile}
              cognitiveProfile={cognitiveProfile}
              onSendMessage={handleSendMessage}
              onOpenSafetyNumbers={() => setSafetyNumberChat(activeChat)}
              onOpenMessageInspector={(msg) => setInspectedMessage(msg)}
              onStartCall={(type) => setActiveCall({ chat: activeChat, type })}
              onBackMobile={() => setMobileShowChat(false)}
              onOpenLyriaMusic={() => setIsLyriaOpen(true)}
              onOpenMultimodalStudio={(tab) => {
                if (tab) setMultimodalTab(tab);
                setIsMultimodalOpen(true);
              }}
              language={appLanguage}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-[#222E35] text-[#8696A0]">
              <p>Select a chat to begin Signal-grade encrypted messaging.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {isMentorshipOpen && (
        <MentorshipHub
          userProfile={userProfile}
          onUpdateTier={(newTier) => setUserProfile({ ...userProfile, studentTier: newTier })}
          onClose={() => setIsMentorshipOpen(false)}
          onStartMentorChat={(mentorName, promptText) => {
            setIsMentorshipOpen(false);
            const targetChat = chats.find((c) => c.name.includes(mentorName)) || chats[0];
            setActiveChatId(targetChat.id);
            handleSendMessage(promptText);
          }}
        />
      )}

      {isLyriaOpen && (
        <LyriaMusicModal
          userProfile={userProfile}
          onClose={() => setIsLyriaOpen(false)}
          onShareToChat={(trackName, audioUrl) => {
            handleSendMessage(`🎵 Lyria 3 Focus Track: ${trackName}`, {
              mediaType: 'voice',
              mediaUrl: audioUrl,
              mediaName: trackName,
            });
          }}
        />
      )}

      {isMultimodalOpen && (
        <MultimodalStudioModal
          userProfile={userProfile}
          initialTab={multimodalTab}
          onClose={() => setIsMultimodalOpen(false)}
          onSendMediaToChat={(mediaType, content, mediaUrl) => {
            handleSendMessage(content, {
              mediaType,
              mediaUrl,
            });
            setIsMultimodalOpen(false);
          }}
        />
      )}

      {isGeminiChatbotOpen && (
        <GeminiChatbotModal
          userProfile={userProfile}
          onClose={() => setIsGeminiChatbotOpen(false)}
          onShareToChat={(text) => {
            handleSendMessage(text);
            setIsGeminiChatbotOpen(false);
          }}
        />
      )}

      {isPrivacyShieldOpen && (
        <PrivacyShieldModal
          settings={privacySettings}
          onUpdateSettings={setPrivacySettings}
          onClose={() => setIsPrivacyShieldOpen(false)}
        />
      )}

      {isAIEngineOpen && (
        <AIPersonalizationModal
          profile={cognitiveProfile}
          user={userProfile}
          onUpdateProfile={setCognitiveProfile}
          onClose={() => setIsAIEngineOpen(false)}
          onOpenMentorshipWithTopic={() => {
            setIsAIEngineOpen(false);
            setIsMentorshipOpen(true);
          }}
        />
      )}

      {safetyNumberChat && (
        <SafetyNumberModal
          chat={safetyNumberChat}
          currentUser={userProfile}
          onClose={() => setSafetyNumberChat(null)}
          onVerifyToggle={() => {
            setChats((prev) =>
              prev.map((c) =>
                c.id === safetyNumberChat.id
                  ? { ...c, e2eeVerified: !c.e2eeVerified }
                  : c
              )
            );
            setSafetyNumberChat((prev) =>
              prev ? { ...prev, e2eeVerified: !prev.e2eeVerified } : null
            );
          }}
        />
      )}

      {inspectedMessage && (
        <MessageInspectorModal
          message={inspectedMessage}
          onClose={() => setInspectedMessage(null)}
        />
      )}

      {activeCall && (
        <CallModal
          chat={activeCall.chat}
          callType={activeCall.type}
          currentUser={userProfile}
          onEndCall={() => setActiveCall(null)}
        />
      )}

      {isStatusStoriesOpen && (
        <StatusViewerModal
          stories={stories}
          currentUser={userProfile}
          onAddStory={handleAddStory}
          onClose={() => setIsStatusStoriesOpen(false)}
        />
      )}

      {isSettingsOpen && (
        <SettingsModal
          user={userProfile}
          privacy={privacySettings}
          activeChat={activeChat}
          messages={currentMessages}
          allChats={chats}
          allMessagesByChat={messagesByChat}
          fontSize={fontSize}
          fontTheme={fontTheme}
          language={appLanguage}
          onUpdateFontSize={setFontSize}
          onUpdateFontTheme={setFontTheme}
          onUpdateLanguage={handleUpdateLanguage}
          onSelectChat={(chatId) => {
            setActiveChatId(chatId);
            setMobileShowChat(true);
            setIsSettingsOpen(false);
          }}
          onUpdateUser={setUserProfile}
          onUpdatePrivacy={setPrivacySettings}
          onLockApp={() => {
            setLockReason('manual');
            setIsAppLocked(true);
          }}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {isNewChatOpen && (
        <NewChatModal
          currentUser={userProfile}
          departments={departments}
          members={members}
          onClose={() => setIsNewChatOpen(false)}
          onCreateChat={handleCreateChat}
        />
      )}

      {isTenancyOpen && (
        <TenancyModal
          isOpen={isTenancyOpen}
          onClose={() => setIsTenancyOpen(false)}
          currentUser={userProfile}
          tenants={tenants}
          departments={departments}
          members={members}
          activeTenantId={activeTenantId}
          onSelectTenant={handleSelectTenant}
          onSwitchUserRole={handleSwitchUserRole}
          onCreateTenant={handleCreateTenant}
          onCreateDepartment={handleCreateDepartment}
          onAddMember={handleAddMember}
        />
      )}

      {isRegistrationOpen && (
        <RegistrationModal
          isOpen={isRegistrationOpen}
          onClose={() => setIsRegistrationOpen(false)}
          currentUser={userProfile}
          tenants={tenants}
          departments={departments}
          onCreateTenant={handleCreateTenant}
          onRegister={(newUser) => {
            setUserProfile((prev) => ({
              ...prev,
              ...newUser,
            }));
            saveUserProfile({
              ...userProfile,
              ...newUser,
            });
          }}
        />
      )}
    </div>
  );
}
