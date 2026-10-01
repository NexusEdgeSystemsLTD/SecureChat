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
import { Chat, CognitiveProfile, Message, PrivacySettings, StatusStory, StudentTier, UserProfile } from './types';
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
  saveStories 
} from './utils/storage';
import { encryptMessage, generateSafetyNumber } from './utils/crypto';
import { updateProfileLocally } from './utils/mlEngine';
import { getPedagogicalMentorReply } from './utils/pedagogy';

export default function App() {
  const [userProfile, setUserProfile] = useState<UserProfile>(loadUserProfile());
  const [chats, setChats] = useState<Chat[]>(loadChats());
  const [messagesByChat, setMessagesByChat] = useState<Record<string, Message[]>>({});
  const [activeChatId, setActiveChatId] = useState<string>('chat_mentor_turing');
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(loadPrivacySettings());
  const [cognitiveProfile, setCognitiveProfile] = useState<CognitiveProfile>(loadCognitiveProfile());
  const [stories, setStories] = useState<StatusStory[]>(loadStories());

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
  const [mobileShowChat, setMobileShowChat] = useState<boolean>(false);

  // Initialize Encrypted Messages
  useEffect(() => {
    async function init() {
      const initialMsgs = await createInitialMessages();
      setMessagesByChat(initialMsgs);
    }
    init();
  }, []);

  // Save changes to storage
  useEffect(() => {
    saveUserProfile(userProfile);
  }, [userProfile]);

  useEffect(() => {
    saveChats(chats);
  }, [chats]);

  useEffect(() => {
    savePrivacySettings(privacySettings);
  }, [privacySettings]);

  useEffect(() => {
    saveCognitiveProfile(cognitiveProfile);
  }, [cognitiveProfile]);

  useEffect(() => {
    saveStories(stories);
  }, [stories]);

  const activeChat = chats.find((c) => c.id === activeChatId) || chats[0];
  const activeMessages = messagesByChat[activeChatId] || [];

  // Send message with Signal AES-GCM client-side encryption
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
    if (!activeChat) return;

    // Real WebCrypto AES-GCM encryption
    const encryptedPayload = await encryptMessage(content);

    const burnSeconds = options?.selfDestructSeconds || (activeChat.isSecret ? activeChat.selfDestructDefault : undefined);
    const burnAt = burnSeconds ? Date.now() + burnSeconds * 1000 : undefined;

    const newMessage: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      chatId: activeChat.id,
      senderId: userProfile.id,
      senderName: userProfile.name,
      content,
      encryptedPayload,
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
      userName: 'My Status',
      userAvatar: userProfile.avatar,
      content,
      mediaUrl,
      timestamp: Date.now(),
      expiresAt: Date.now() + 86400000,
      viewsCount: 0,
      isViewed: true,
      encrypted: true,
    };
    setStories([newStory, ...stories]);
  };

  // Create new conversation
  const handleCreateChat = async (newChatData: any) => {
    const safetyNumber = await generateSafetyNumber(userProfile.id, newChatData.name);
    const newChat: Chat = {
      id: `chat-${Date.now()}`,
      type: newChatData.type,
      name: newChatData.name,
      avatar: newChatData.type === 'secret' 
        ? 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80'
        : newChatData.type === 'study_circle'
        ? 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=200&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
      subtitle: newChatData.topic || (newChatData.type === 'secret' ? 'Secret Chat • Burn-on-Read' : 'Direct E2EE Chat'),
      participantIds: [userProfile.id, `peer-${Date.now()}`],
      unreadCount: 0,
      isSecret: newChatData.isSecret,
      selfDestructDefault: newChatData.selfDestructDefault,
      forwardRestricted: newChatData.forwardRestricted,
      safetyNumber,
      e2eeVerified: true,
      academicTier: newChatData.academicTier,
      topic: newChatData.topic,
      isOnline: true,
    };

    setChats([newChat, ...chats]);
    setActiveChatId(newChat.id);
    setMobileShowChat(true);
  };

  // App unlock handler (normal vs duress decoy mode)
  const handleUnlock = (isDuress: boolean) => {
    if (isDuress) {
      // Coercion decoy mode: filter out secret chats and private academic notes
      setChats(chats.filter((c) => !c.isSecret));
      setUserProfile((prev) => ({
        ...prev,
        stealthModeActive: true,
      }));
    }
    setIsAppLocked(false);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0B141A] font-sans antialiased text-[#E9EDEF]">
      {/* App Lock PIN Screen */}
      {isAppLocked && (
        <AppLockModal user={userProfile} onUnlock={handleUnlock} />
      )}

      {/* Main WhatsApp-Style Split Layout */}
      <div className="flex h-full w-full overflow-hidden">
        {/* Sidebar (Conversations, Mentorship Quick Launcher, Status Stories, Settings) */}
        <div className={`h-full ${mobileShowChat ? 'hidden md:flex' : 'flex w-full md:w-auto'}`}>
          <Sidebar
            chats={chats}
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
            onLockApp={() => setIsAppLocked(true)}
          />
        </div>

        {/* Chat Area (Active Conversation, Signal E2EE Verification, Burn-on-Read Timers) */}
        <div className={`flex-1 h-full ${!mobileShowChat ? 'hidden md:flex' : 'flex'}`}>
          {activeChat ? (
            <ChatArea
              chat={activeChat}
              messages={activeMessages}
              currentUser={userProfile}
              onSendMessage={handleSendMessage}
              onOpenSafetyNumbers={() => setSafetyNumberChat(activeChat)}
              onOpenMessageInspector={(msg) => setInspectedMessage(msg)}
              onStartCall={(type) => setActiveCall({ chat: activeChat, type })}
              onBackMobile={() => setMobileShowChat(false)}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#111B21] text-center text-[#8696A0]">
              <div className="w-16 h-16 rounded-full bg-[#202C33] flex items-center justify-center mb-4 text-[#00A884]">
                🔒
              </div>
              <h3 className="text-lg font-bold text-white mb-1">SecureChat for Web & Mobile</h3>
              <p className="text-xs max-w-sm">
                End-to-end encrypted messaging with Signal cryptography, Telegram secret chats, and student mentoring.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modals & Overlays */}
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
          onOpenMentorshipWithTopic={(topic) => {
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
          onUpdateUser={setUserProfile}
          onUpdatePrivacy={setPrivacySettings}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {isNewChatOpen && (
        <NewChatModal
          onClose={() => setIsNewChatOpen(false)}
          onCreateChat={handleCreateChat}
        />
      )}
    </div>
  );
}
