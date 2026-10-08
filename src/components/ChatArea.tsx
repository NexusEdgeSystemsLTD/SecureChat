import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, 
  Video, 
  Search, 
  MoreVertical, 
  ShieldCheck, 
  Lock, 
  Flame, 
  Paperclip, 
  Smile, 
  Mic, 
  Send, 
  CheckCheck, 
  Check, 
  Clock, 
  Copy, 
  Eye, 
  FileText, 
  Image as ImageIcon, 
  Code2, 
  Play, 
  Pause, 
  Sparkles, 
  GraduationCap, 
  ShieldAlert, 
  Download,
  AlertTriangle,
  Music,
  CornerDownLeft,
  X,
  ChevronUp,
  ChevronDown,
  FolderLock,
  Building2
} from 'lucide-react';
import { Chat, CognitiveProfile, EncryptedPayload, Message, UserProfile } from '../types';
import { stripExifFromImage } from '../utils/crypto';

interface ChatAreaProps {
  chat: Chat;
  messages: Message[];
  currentUser: UserProfile;
  cognitiveProfile?: CognitiveProfile;
  onSendMessage: (content: string, options?: {
    mediaType?: 'text' | 'image' | 'voice' | 'doc' | 'code' | 'academic_paper';
    mediaUrl?: string;
    mediaName?: string;
    mediaSize?: string;
    selfDestructSeconds?: number;
    isForwardProtected?: boolean;
    academicMetadata?: any;
  }) => void;
  onOpenSafetyNumbers: () => void;
  onOpenMessageInspector: (msg: Message) => void;
  onStartCall: (type: 'audio' | 'video') => void;
  onBackMobile?: () => void;
  onOpenLyriaMusic?: () => void;
  onOpenMultimodalStudio?: (tab?: 'image' | 'video' | 'search' | 'maps' | 'transcribe') => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  chat,
  messages,
  currentUser,
  cognitiveProfile,
  onSendMessage,
  onOpenSafetyNumbers,
  onOpenMessageInspector,
  onStartCall,
  onBackMobile,
  onOpenLyriaMusic,
  onOpenMultimodalStudio,
}) => {
  const [inputText, setInputText] = useState('');
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [selfDestructTimer, setSelfDestructTimer] = useState<number>(chat.selfDestructDefault || 0);
  const [forwardLock, setForwardLock] = useState<boolean>(chat.forwardRestricted || false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [screenshotDetected, setScreenshotDetected] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [smartReplies, setSmartReplies] = useState<string[]>([]);

  // Local Search Functionality (filters decrypted local state of messages by keyword)
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHighlightIndex, setSearchHighlightIndex] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Smart Reply generation based on last message & cognitive profile
  useEffect(() => {
    if (!messages || messages.length === 0) {
      setSmartReplies([]);
      return;
    }
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || !lastMsg.content || lastMsg.isBurned) {
      setSmartReplies([]);
      return;
    }

    const tendencies = cognitiveProfile?.cognitiveTendencies || [
      'Axiomatic First-Principles Reasoner',
      'Empirical Benchmark Driven',
    ];
    const tendenciesStr = tendencies.join(', ');

    // 1. Instant local cognitive generation
    const localReplies = generateLocalSmartReplies(
      lastMsg.content,
      tendenciesStr,
      currentUser.studentTier || 'Scholar'
    );
    setSmartReplies(localReplies);

    // 2. Async AI refinement from backend
    let active = true;
    fetch('/api/ai/smart-replies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lastMessage: lastMsg.content,
        cognitiveTendencies: tendencies,
        interests: cognitiveProfile?.interests?.map((i) => i.name) || [],
        studentTier: currentUser.studentTier,
        fieldOfStudy: currentUser.fieldOfStudy,
        chatName: chat.name,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (active && data.success && Array.isArray(data.suggestions) && data.suggestions.length === 3) {
          setSmartReplies(data.suggestions);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [messages, chat.id, cognitiveProfile, currentUser.studentTier]);

  // Update timer every second for self-destruct countdowns
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Anti-Screenshot / Screen Capture listener simulation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // PrintScreen or Cmd+Shift+3/4
      if (e.key === 'PrintScreen' || (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4'))) {
        setScreenshotDetected(true);
        setTimeout(() => setScreenshotDetected(false), 5000);
      }
    };

    window.addEventListener('keyup', handleKeyDown);
    return () => window.removeEventListener('keyup', handleKeyDown);
  }, []);

  const handleSend = () => {
    if (!inputText.trim() && !isRecordingVoice) return;

    onSendMessage(inputText.trim(), {
      mediaType: 'text',
      selfDestructSeconds: selfDestructTimer > 0 ? selfDestructTimer : undefined,
      isForwardProtected: forwardLock,
    });

    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Voice note simulation
  const handleToggleVoiceRecord = () => {
    if (!isRecordingVoice) {
      setIsRecordingVoice(true);
      setRecordingSeconds(0);
    } else {
      setIsRecordingVoice(false);
      // Send simulated encrypted voice note
      onSendMessage('🎙️ Encrypted Voice Note', {
        mediaType: 'voice',
        mediaUrl: 'waveform_simulated_data',
        mediaSize: `0:${recordingSeconds < 10 ? '0' : ''}${recordingSeconds} • 320 KB`,
        selfDestructSeconds: selfDestructTimer > 0 ? selfDestructTimer : undefined,
        isForwardProtected: forwardLock,
      });
      setRecordingSeconds(0);
    }
  };

  useEffect(() => {
    let timer: any;
    if (isRecordingVoice) {
      timer = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRecordingVoice]);

  // Image upload with EXIF Scrubber
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const stripped = await stripExifFromImage(file);
      onSendMessage(`📷 ${file.name} (EXIF scrubbed)`, {
        mediaType: 'image',
        mediaUrl: stripped.dataUrl,
        mediaName: file.name,
        mediaSize: stripped.size,
        selfDestructSeconds: selfDestructTimer > 0 ? selfDestructTimer : undefined,
        isForwardProtected: forwardLock,
      });
      setShowAttachMenu(false);
    } catch (err) {
      console.error('Failed to scrub EXIF', err);
    }
  };

  // Quick academic LaTeX snippet send
  const handleSendLatexSnippet = () => {
    onSendMessage('Verified Quantum Key Agreement Theorem:\n$$\\text{Pr}[\\mathcal{A} \\text{ breaks AES-GCM}] \\le \\frac{q}{2^{128}} + \\text{negl}(\\lambda)$$', {
      mediaType: 'text',
      academicMetadata: {
        topic: 'Cryptographic Security Bounds',
        tier: currentUser.studentTier,
        latexFormula: '\\text{Pr}[\\mathcal{A} \\text{ breaks AES-GCM}] \\le \\frac{q}{2^{128}} + \\text{negl}(\\lambda)',
      },
      selfDestructSeconds: selfDestructTimer > 0 ? selfDestructTimer : undefined,
    });
    setShowAttachMenu(false);
  };

  // Quick code snippet send
  const handleSendCodeSnippet = () => {
    const code = `// Signal-grade Double Ratchet Step
async function ratchetStep(state, remoteEphemeralKey) {
  const dhSecret = await computeDH(state.dhPrivate, remoteEphemeralKey);
  const [rootKey, chainKey] = await kdfRK(state.rootKey, dhSecret);
  return { rootKey, chainKey };
}`;
    onSendMessage(code, {
      mediaType: 'code',
      academicMetadata: {
        codeLanguage: 'typescript',
      },
      selfDestructSeconds: selfDestructTimer > 0 ? selfDestructTimer : undefined,
    });
    setShowAttachMenu(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0B141A] text-[#E9EDEF] relative overflow-hidden select-none">
      {/* Background WhatsApp Doodle Wallpaper */}
      <div 
        className="absolute inset-0 opacity-[0.04] pointer-events-none bg-repeat"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23FFFFFF' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Subtle Anti-Screenshot Overlay Watermark */}
      <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center opacity-[0.015] rotate-[-25deg] text-2xl font-bold tracking-widest uppercase">
        {currentUser.handle} • SECURECHAT E2EE • {currentUser.id}
      </div>

      {/* Telegram-style Anti-Screenshot Notice Banner */}
      {screenshotDetected && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-50 bg-rose-900/90 text-white text-xs px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 border border-rose-500 animate-bounce">
          <ShieldAlert className="w-4 h-4 text-rose-300" />
          <span>Screenshot capture attempted. Secret Chat metadata & watermarks recorded.</span>
        </div>
      )}

      {/* WhatsApp Header */}
      <header className="h-16 px-4 bg-[#202C33] flex items-center justify-between z-20 shadow-sm border-b border-[#222E35]">
        <div className="flex items-center gap-3 min-w-0">
          {onBackMobile && (
            <button onClick={onBackMobile} className="md:hidden text-[#8696A0] hover:text-white p-1">
              ←
            </button>
          )}

          <div 
            onClick={onOpenSafetyNumbers}
            className="relative cursor-pointer hover:opacity-90 transition-opacity"
            title="View Signal Safety Numbers & Verification"
          >
            <img
              src={chat.avatar}
              alt={chat.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            {chat.isSecret && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 rounded-full flex items-center justify-center border border-[#202C33]">
                <Lock className="w-2.5 h-2.5 text-white" />
              </span>
            )}
          </div>

          <div 
            onClick={onOpenSafetyNumbers}
            className="flex flex-col cursor-pointer min-w-0"
            title="Click to verify end-to-end encryption safety number"
          >
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-sm font-semibold text-[#E9EDEF] truncate">
                {chat.name}
              </span>
              <ShieldCheck className="w-4 h-4 text-[#00A884] flex-shrink-0" />
              {chat.departmentId && (
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-semibold px-1.5 py-0.2 rounded border border-amber-500/30 flex items-center gap-1">
                  <FolderLock className="w-2.5 h-2.5" />
                  AIR-GAPPED
                </span>
              )}
              {chat.id === 'chat_exec_boardroom' && (
                <span className="text-[10px] bg-amber-500/30 text-amber-200 font-bold px-1.5 py-0.2 rounded border border-amber-400 flex items-center gap-1">
                  MD • CTO • DAF TRIAD
                </span>
              )}
            </div>
            <span className="text-xs text-[#8696A0] truncate flex items-center gap-1">
              {chat.isSecret ? (
                <span className="text-rose-400 flex items-center gap-1 font-medium">
                  <Flame className="w-3 h-3" />
                  Secret Chat (Self-destruct: {chat.selfDestructDefault || selfDestructTimer || 'Off'}s)
                </span>
              ) : chat.isOnline ? (
                <span className="text-[#00A884]">online</span>
              ) : (
                <span>{chat.lastSeen || 'Signal E2EE Verified'}</span>
              )}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 text-[#AEBAC1]">
          {/* Local Decrypted Message Search Button */}
          <button
            onClick={() => {
              setIsSearchOpen((prev) => !prev);
              if (isSearchOpen) setSearchQuery('');
            }}
            className={`p-2.5 rounded-full transition-colors ${
              isSearchOpen ? 'bg-[#374248] text-[#00A884]' : 'hover:bg-[#374248] hover:text-[#00A884]'
            }`}
            title="Local In-Memory Message Search (Decrypted Local State)"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Encrypted Audio Call */}
          <button
            onClick={() => onStartCall('audio')}
            className="p-2.5 rounded-full hover:bg-[#374248] hover:text-[#00A884] transition-colors"
            title="Encrypted Voice Call (WebRTC + Tor Relay)"
          >
            <Phone className="w-5 h-5" />
          </button>

          {/* Encrypted Video Call */}
          <button
            onClick={() => onStartCall('video')}
            className="p-2.5 rounded-full hover:bg-[#374248] hover:text-[#00A884] transition-colors"
            title="Encrypted Video Call (P2P Mesh)"
          >
            <Video className="w-5 h-5" />
          </button>

          {/* Safety Number Inspection Button */}
          <button
            onClick={onOpenSafetyNumbers}
            className="p-2.5 rounded-full hover:bg-[#374248] hover:text-[#00A884] transition-colors"
            title="Verify 60-Digit Safety Number"
          >
            <ShieldCheck className="w-5 h-5 text-[#00A884]" />
          </button>

          {/* Menu Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowChatMenu(!showChatMenu)}
              className="p-2.5 rounded-full hover:bg-[#374248] hover:text-[#E9EDEF] transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {showChatMenu && (
              <div 
                className="absolute right-0 top-12 w-60 bg-[#233138] rounded-lg shadow-2xl py-2 z-50 border border-[#374248] text-sm animate-in fade-in"
                onClick={() => setShowChatMenu(false)}
              >
                <button
                  onClick={onOpenSafetyNumbers}
                  className="w-full text-left px-4 py-2 hover:bg-[#182229] flex items-center gap-2.5"
                >
                  <ShieldCheck className="w-4 h-4 text-[#00A884]" />
                  <span>Verify Safety Number</span>
                </button>

                <button
                  onClick={() => {
                    const next = selfDestructTimer === 0 ? 10 : selfDestructTimer === 10 ? 30 : 0;
                    setSelfDestructTimer(next);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-[#182229] flex items-center gap-2.5 text-rose-300"
                >
                  <Flame className="w-4 h-4" />
                  <span>Self-Destruct: {selfDestructTimer === 0 ? 'Off' : `${selfDestructTimer}s`}</span>
                </button>

                <button
                  onClick={() => setForwardLock(!forwardLock)}
                  className="w-full text-left px-4 py-2 hover:bg-[#182229] flex items-center gap-2.5 text-amber-300"
                >
                  <Lock className="w-4 h-4" />
                  <span>Forward Protection: {forwardLock ? 'ON' : 'OFF'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Signal/WhatsApp E2EE Notice Banner */}
      <div className="bg-[#182229]/90 border-b border-[#222E35] px-4 py-2 text-center text-xs text-[#8696A0] flex items-center justify-center gap-2 z-10">
        <Lock className="w-3.5 h-3.5 text-[#00A884] flex-shrink-0" />
        <span>
          Messages and calls are end-to-end encrypted (AES-256-GCM). Zero-knowledge relay active.{' '}
          <button 
            onClick={onOpenSafetyNumbers} 
            className="text-[#00A884] hover:underline font-medium"
          >
            Verify safety number
          </button>
        </span>
      </div>

      {/* Local Decrypted In-Memory Message Search Bar */}
      {isSearchOpen && (
        <div className="bg-[#202C33] border-b border-[#2A3942] px-4 py-2.5 z-20 flex items-center gap-3 animate-in slide-in-from-top-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8696A0] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search local decrypted messages in this chat..."
              className="w-full bg-[#111B21] text-[#E9EDEF] placeholder-[#8696A0] text-sm pl-9 pr-8 py-2 rounded-xl border border-transparent focus:border-[#00A884] focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8696A0] hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {searchQuery && (
            <div className="text-xs text-[#8696A0] shrink-0 font-mono">
              {messages.filter((m) => !m.isBurned && m.content.toLowerCase().includes(searchQuery.toLowerCase())).length}{' '}
              found
            </div>
          )}
          <button
            onClick={() => {
              setIsSearchOpen(false);
              setSearchQuery('');
            }}
            className="p-1.5 rounded-lg text-[#8696A0] hover:text-[#E9EDEF] hover:bg-[#111B21] transition-colors"
            title="Close local search"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto px-4 lg:px-12 py-4 space-y-3 z-10">
        {(() => {
          const trimmedQuery = searchQuery.trim().toLowerCase();
          const filteredMessages = trimmedQuery
            ? messages.filter((m) => m.content.toLowerCase().includes(trimmedQuery))
            : messages;

          if (trimmedQuery && filteredMessages.length === 0) {
            return (
              <div className="flex flex-col items-center justify-center py-16 text-[#8696A0]">
                <Search className="w-10 h-10 text-[#2A3942] mb-3" />
                <p className="text-sm font-medium text-[#E9EDEF]">No matching messages found</p>
                <p className="text-xs text-[#8696A0] mt-1 max-w-xs text-center">
                  Search is executed strictly client-side against the locally decrypted message state for '{searchQuery}'.
                </p>
              </div>
            );
          }

          return filteredMessages.map((msg) => {
          const isMe = msg.senderId === currentUser.id;

          // Handle self-destruct countdown
          let isBurned = msg.isBurned;
          let remainingSeconds = 0;
          if (msg.burnAt) {
            const diff = Math.ceil((msg.burnAt - now) / 1000);
            if (diff <= 0) {
              isBurned = true;
            } else {
              remainingSeconds = diff;
            }
          }

          if (isBurned) {
            return (
              <div key={msg.id} className="flex justify-center my-2">
                <div className="bg-[#202C33]/80 border border-rose-500/20 text-rose-400/80 text-[11px] px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                  <Flame className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                  <span>🔥 This secret message has burned and self-destructed</span>
                </div>
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group relative`}
            >
              {/* Message Bubble */}
              <div
                className={`max-w-[85%] md:max-w-[70%] lg:max-w-[60%] rounded-2xl px-4 py-2.5 shadow-md relative text-sm select-text transition-all ${
                  isMe
                    ? 'bg-[#005C4B] text-[#E9EDEF] rounded-tr-none'
                    : 'bg-[#202C33] text-[#E9EDEF] rounded-tl-none border border-[#2A3942]/60'
                }`}
              >
                {/* Sender Name in group/circle chats */}
                {!isMe && (
                  <div className="text-xs font-semibold text-[#00A884] mb-1 flex items-center gap-1.5">
                    <span>{msg.senderName}</span>
                    {msg.isAcademicInsight && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#00A884]/20 text-[#00A884] font-normal border border-[#00A884]/30 flex items-center gap-1">
                        <GraduationCap className="w-2.5 h-2.5" /> Mentor
                      </span>
                    )}
                  </div>
                )}

                {/* Self-Destruct Countdown Badge */}
                {msg.burnAt && remainingSeconds > 0 && (
                  <div className="mb-1.5 flex items-center gap-1 text-[11px] text-rose-300 font-semibold bg-rose-950/40 px-2 py-0.5 rounded-full w-fit border border-rose-500/30">
                    <Flame className="w-3 h-3 text-rose-400 animate-pulse" />
                    <span>Self-destructs in {remainingSeconds}s</span>
                  </div>
                )}

                {/* Forward Protection Badge */}
                {msg.isForwardProtected && (
                  <div className="mb-1 flex items-center gap-1 text-[10px] text-amber-300/80">
                    <Lock className="w-2.5 h-2.5" />
                    <span>Forward & Copy Restricted</span>
                  </div>
                )}

                {/* Image Media with Metadata Stripped Badge */}
                {msg.mediaType === 'image' && msg.mediaUrl && (
                  <div className="mb-2 rounded-xl overflow-hidden relative group/img">
                    <img
                      src={msg.mediaUrl}
                      alt={msg.mediaName || 'Encrypted Attachment'}
                      className="max-h-72 w-full object-cover rounded-xl"
                    />
                    <div className="absolute bottom-2 left-2 bg-[#111B21]/90 backdrop-blur text-[10px] text-[#00A884] px-2 py-0.5 rounded flex items-center gap-1 border border-[#00A884]/30">
                      <ShieldCheck className="w-3 h-3" />
                      <span>EXIF / GPS Scrubbed</span>
                    </div>
                  </div>
                )}

                {/* Simulated Audio Note Waveform */}
                {msg.mediaType === 'voice' && (
                  <div className="flex items-center gap-3 my-1 bg-[#111B21]/40 p-2.5 rounded-xl border border-white/5">
                    <button
                      onClick={() => setPlayingAudioId(playingAudioId === msg.id ? null : msg.id)}
                      className="w-10 h-10 rounded-full bg-[#00A884] text-[#111B21] flex items-center justify-center hover:scale-105 transition-transform flex-shrink-0"
                    >
                      {playingAudioId === msg.id ? (
                        <Pause className="w-5 h-5 fill-current" />
                      ) : (
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      )}
                    </button>
                    <div className="flex-1">
                      {/* Audio Waveform Bars */}
                      <div className="flex items-center gap-0.5 h-6">
                        {[4, 8, 14, 20, 12, 18, 24, 16, 8, 14, 22, 18, 10, 6, 14, 20, 16, 8, 12, 18, 10, 6].map((h, i) => (
                          <div
                            key={i}
                            style={{ height: `${h}px` }}
                            className={`w-1 rounded-full transition-all ${
                              playingAudioId === msg.id ? 'bg-[#00A884] animate-pulse' : 'bg-[#8696A0]'
                            }`}
                          />
                        ))}
                      </div>
                      <div className="flex justify-between text-[10px] text-[#8696A0] mt-1">
                        <span>{playingAudioId === msg.id ? 'Playing (E2EE)' : 'Voice Message'}</span>
                        <span>{msg.mediaSize || '0:28'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Code Snippet Card */}
                {msg.mediaType === 'code' && (
                  <div className="my-1.5 bg-[#111B21] p-3 rounded-xl border border-[#374248] font-mono text-xs overflow-x-auto text-emerald-300">
                    <div className="flex justify-between items-center pb-1 mb-1 border-b border-[#222E35] text-[10px] text-[#8696A0]">
                      <span>{msg.academicMetadata?.codeLanguage || 'typescript'}</span>
                      <button
                        onClick={() => navigator.clipboard.writeText(msg.content)}
                        className="hover:text-white flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" /> Copy
                      </button>
                    </div>
                    <pre className="whitespace-pre-wrap">{msg.content}</pre>
                  </div>
                )}

                {/* LaTeX Equation Box if Present */}
                {msg.academicMetadata?.latexFormula && (
                  <div className="my-1.5 p-3 rounded-xl bg-[#111B21]/60 border border-[#00A884]/30 text-center font-mono text-xs text-[#00A884]">
                    <div className="text-[10px] text-[#8696A0] mb-1 font-sans">
                      LaTeX Mathematical Formulation:
                    </div>
                    <div className="bg-[#111B21] px-3 py-2 rounded border border-white/5 overflow-x-auto">
                      {msg.academicMetadata.latexFormula}
                    </div>
                  </div>
                )}

                {/* Normal Text Content */}
                {msg.mediaType !== 'code' && (
                  <p
                    className="whitespace-pre-wrap break-words leading-relaxed"
                    style={{ fontSize: 'var(--bubble-text-size)', lineHeight: 'var(--bubble-line-height, 1.55)' }}
                  >
                    {searchQuery.trim() ? (
                      (() => {
                        const q = searchQuery.trim();
                        const parts = msg.content.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
                        return parts.map((part, idx) =>
                          part.toLowerCase() === q.toLowerCase() ? (
                            <mark
                              key={idx}
                              className="bg-amber-400 text-black px-0.5 rounded font-semibold"
                            >
                              {part}
                            </mark>
                          ) : (
                            part
                          )
                        );
                      })()
                    ) : (
                      msg.content
                    )}
                  </p>
                )}

                {/* Bottom Meta Bar (Timestamp + Status Ticks + Inspector Button) */}
                <div className="flex items-center justify-end gap-1.5 mt-1 text-[11px] text-[#8696A0] float-right ml-3">
                  {/* Ciphertext Inspector Trigger */}
                  <button
                    onClick={() => onOpenMessageInspector(msg)}
                    className="hover:text-[#00A884] opacity-70 hover:opacity-100 transition-opacity p-0.5"
                    title={
                      msg.readAckSignature
                        ? `Inspect E2EE Payload • Read-Ack MAC: ${msg.readAckSignature}`
                        : 'Inspect AES-GCM Encrypted Payload (IV, Tag, Ciphertext)'
                    }
                  >
                    <Eye className="w-3 h-3" />
                  </button>

                  <span>
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>

                  {isMe ? (
                    <span
                      title={
                        msg.status === 'read'
                          ? `Read & Acknowledged via E2E signal MAC: ${msg.readAckSignature || 'Verified'} (${msg.readAt ? new Date(msg.readAt).toLocaleTimeString() : 'Verified'})`
                          : msg.status === 'delivered'
                            ? 'Delivered to terminal'
                            : 'Sent'
                      }
                    >
                      {msg.status === 'read' ? (
                        <CheckCheck className="w-4 h-4 text-[#53BDEB]" />
                      ) : msg.status === 'delivered' ? (
                        <CheckCheck className="w-4 h-4 text-[#8696A0]" />
                      ) : (
                        <Check className="w-4 h-4 text-[#8696A0]" />
                      )}
                    </span>
                  ) : msg.readAckSignature ? (
                    <span title={`E2E Read-Ack Signal Verified: ${msg.readAckSignature}`}>
                      <CheckCheck className="w-3.5 h-3.5 text-[#53BDEB]/60" />
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Message Reactions */}
              {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                <div className={`flex items-center gap-1 -mt-2 z-10 ${isMe ? 'mr-3' : 'ml-3'}`}>
                  {Object.entries(msg.reactions).map(([emoji, users]) => (
                    <span
                      key={emoji}
                      className="bg-[#202C33] border border-[#2A3942] rounded-full px-2 py-0.5 text-xs shadow-sm flex items-center gap-1"
                      title={users.join(', ')}
                    >
                      <span>{emoji}</span>
                      <span className="text-[10px] text-[#8696A0]">{users.length}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        });
      })()}
        <div ref={messagesEndRef} />
      </div>

      {/* Hidden File Input for EXIF Scrubber */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* Attachment Popover Menu */}
      {showAttachMenu && (
        <div className="absolute bottom-20 left-4 z-40 bg-[#233138] border border-[#374248] rounded-2xl p-3 shadow-2xl flex flex-col gap-2 w-64 animate-in fade-in slide-in-from-bottom-4">
          <div className="text-xs font-semibold text-[#8696A0] px-2 pb-1 border-b border-[#374248]">
            Encrypted Attachments (Zero-Leakage)
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#182229] text-left text-sm text-[#E9EDEF]"
          >
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="font-medium">Photo & Media</div>
              <div className="text-[10px] text-[#8696A0]">Auto-scrub EXIF & GPS</div>
            </div>
          </button>

          <button
            onClick={handleSendLatexSnippet}
            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#182229] text-left text-sm text-[#E9EDEF]"
          >
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="font-medium">LaTeX Formula</div>
              <div className="text-[10px] text-[#8696A0]">Academic proof snippet</div>
            </div>
          </button>

          <button
            onClick={handleSendCodeSnippet}
            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#182229] text-left text-sm text-[#E9EDEF]"
          >
            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <div className="font-medium">Code Algorithm</div>
              <div className="text-[10px] text-[#8696A0]">Syntax highlighted</div>
            </div>
          </button>

          {onOpenMultimodalStudio && (
            <button
              onClick={() => {
                setShowAttachMenu(false);
                onOpenMultimodalStudio('image');
              }}
              className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#182229] text-left text-sm text-[#E9EDEF]"
            >
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="font-medium">AI Multimodal Studio</div>
                <div className="text-[10px] text-[#8696A0]">Veo Video &amp; Gemini Image</div>
              </div>
            </button>
          )}

          {onOpenLyriaMusic && (
            <button
              onClick={() => {
                setShowAttachMenu(false);
                onOpenLyriaMusic();
              }}
              className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#182229] text-left text-sm text-[#E9EDEF]"
            >
              <div className="p-2 rounded-lg bg-pink-500/20 text-pink-400">
                <Music className="w-4 h-4" />
              </div>
              <div>
                <div className="font-medium">Lyria 3 Study Beats</div>
                <div className="text-[10px] text-[#8696A0]">Focus concentration audio</div>
              </div>
            </button>
          )}
        </div>
      )}

      {/* Smart Reply Suggestions Bar (Tailored by Cognitive Profile) */}
      {smartReplies.length > 0 && !isRecordingVoice && (
        <div className="bg-[#182229]/95 border-t border-[#2A3942] px-3 md:px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar z-20 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-1.5 text-[11px] text-[#00A884] font-medium shrink-0 pr-2 border-r border-[#2A3942]">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="hidden sm:inline font-semibold">Smart Reply</span>
            <span
              className="text-[10px] text-[#8696A0] bg-[#111B21] px-1.5 py-0.5 rounded border border-white/5 truncate max-w-[120px]"
              title={cognitiveProfile?.cognitiveTendencies?.[0] || 'Axiomatic Reasoner'}
            >
              {cognitiveProfile?.cognitiveTendencies?.[0]?.split(' ')[0] || 'Scholar'} Tone
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-1">
            {smartReplies.map((replyText, idx) => (
              <div
                key={idx}
                className="flex items-center rounded-xl bg-[#202C33] hover:bg-[#2A3942] border border-[#2A3942] hover:border-[#00A884]/60 transition-all text-xs text-[#E9EDEF] overflow-hidden group shadow-sm shrink-0"
              >
                <button
                  onClick={() => {
                    setInputText(replyText);
                    textareaRef.current?.focus();
                  }}
                  className="px-3 py-1.5 flex items-center gap-1.5 text-left whitespace-nowrap active:scale-98"
                  title={`Click to fill into input: "${replyText}"`}
                >
                  <span className="line-clamp-1">{replyText}</span>
                  <CornerDownLeft className="w-3 h-3 text-[#8696A0] group-hover:text-[#00A884] opacity-70 group-hover:opacity-100 transition-opacity shrink-0" />
                </button>
                <button
                  onClick={() => {
                    onSendMessage(replyText, {
                      mediaType: 'text',
                      selfDestructSeconds: selfDestructTimer > 0 ? selfDestructTimer : undefined,
                      isForwardProtected: forwardLock,
                    });
                  }}
                  className="px-2 py-1.5 hover:bg-[#00A884] hover:text-[#111B21] text-[#00A884] border-l border-[#2A3942] transition-colors"
                  title="Send smart reply immediately"
                >
                  <Send className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WhatsApp Message Input Bar */}
      <footer className="min-h-16 px-4 py-2.5 bg-[#202C33] flex items-end gap-2 z-20 border-t border-[#222E35]">
        {/* Attachment & Emoji Controls */}
        <div className="flex items-center gap-1 pb-1 text-[#8696A0]">
          <button
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            className={`p-2 rounded-full hover:bg-[#374248] transition-colors ${
              showAttachMenu ? 'text-[#00A884] bg-[#374248]' : 'hover:text-[#E9EDEF]'
            }`}
            title="Attach Media or Academic Artifacts"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Burn Timer Fast Toggle */}
          <button
            onClick={() => {
              const options = [0, 5, 10, 30, 60];
              const next = options[(options.indexOf(selfDestructTimer) + 1) % options.length];
              setSelfDestructTimer(next);
            }}
            className={`p-2 rounded-full transition-colors flex items-center gap-1 ${
              selfDestructTimer > 0
                ? 'text-rose-400 bg-rose-950/40 border border-rose-500/30'
                : 'hover:bg-[#374248] hover:text-[#E9EDEF]'
            }`}
            title="Telegram-style Burn-on-Read Self Destruct Timer"
          >
            <Flame className="w-4 h-4" />
            {selfDestructTimer > 0 && (
              <span className="text-[10px] font-bold">{selfDestructTimer}s</span>
            )}
          </button>

          {/* Forward Protection Fast Toggle */}
          <button
            onClick={() => setForwardLock(!forwardLock)}
            className={`p-2 rounded-full transition-colors ${
              forwardLock
                ? 'text-amber-400 bg-amber-950/40 border border-amber-500/30'
                : 'hover:bg-[#374248] hover:text-[#E9EDEF]'
            }`}
            title="Toggle Forwarding & Copy Protection"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>

        {/* Text Input Area */}
        <div className="flex-1 bg-[#2A3942] rounded-2xl px-4 py-2 flex items-center min-h-[42px] max-h-32 focus-within:ring-1 focus-within:ring-[#00A884]">
          {isRecordingVoice ? (
            <div className="flex-1 flex items-center justify-between text-rose-400 animate-pulse text-sm">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-rose-500 rounded-full" />
                Recording encrypted audio... 0:{recordingSeconds < 10 ? '0' : ''}{recordingSeconds}
              </span>
              <span className="text-xs text-[#8696A0]">Tap mic to finish</span>
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type an encrypted message (AES-256-GCM)..."
              rows={1}
              style={{ fontSize: 'var(--input-text-size)' }}
              className="w-full bg-transparent text-sm text-[#E9EDEF] placeholder-[#8696A0] resize-none outline-none max-h-28"
            />
          )}
        </div>

        {/* Send / Voice Record Button */}
        <div className="pb-1">
          {inputText.trim() ? (
            <button
              onClick={handleSend}
              className="w-10 h-10 rounded-full bg-[#00A884] text-[#111B21] flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md"
              title="Send Encrypted Message"
            >
              <Send className="w-5 h-5 ml-0.5 fill-current" />
            </button>
          ) : (
            <button
              onClick={handleToggleVoiceRecord}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                isRecordingVoice
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-[#00A884] text-[#111B21] hover:scale-105'
              }`}
              title={isRecordingVoice ? 'Send Voice Note' : 'Hold or Tap to Record Encrypted Voice Note'}
            >
              <Mic className="w-5 h-5" />
            </button>
          )}
        </div>
      </footer>
    </div>
  );
};

/**
 * Deterministic cognitive tone engine for generating context-aware smart replies
 * based on last message semantics and tailored to student's cognitive tendencies & academic tier.
 */
function generateLocalSmartReplies(
  msgText: string,
  tendenciesStr: string,
  tier: string
): string[] {
  const m = (msgText || '').toLowerCase();
  const isFirstPrinciples = tendenciesStr.toLowerCase().includes('first-principles');
  const isEmpirical = tendenciesStr.toLowerCase().includes('empirical') || tendenciesStr.toLowerCase().includes('benchmark');

  if (m.includes('proof') || m.includes('math') || m.includes('theorem') || m.includes('lemma') || m.includes('equation') || m.includes('formula')) {
    return [
      "Let's formalize the reduction proof and check boundary constraints.",
      "Could we verify this empirically against baseline polynomial commitments?",
      "I will review Lemma 4.2 and draft the inductive verification steps."
    ];
  }
  if (m.includes('code') || m.includes('algorithm') || m.includes('benchmark') || m.includes('latency') || m.includes('run') || m.includes('prototype')) {
    return [
      "I'll isolate the benchmark environment and measure p99 tail latency.",
      "Should we profile the memory overhead under distributed Byzantine faults?",
      "The minimal prototype is ready; let's execute seeded test vectors."
    ];
  }
  if (m.includes('paper') || m.includes('thesis') || m.includes('abstract') || m.includes('conference') || m.includes('deadline')) {
    return [
      "I'm structuring the 250-word abstract highlighting our empirical delta.",
      "Let's synchronize on the related work contrast matrix tomorrow.",
      "Understood. I will prepare the reproducible artifact appendix this week."
    ];
  }
  if (m.includes('call') || m.includes('voice') || m.includes('meet') || m.includes('discuss') || m.includes('sync')) {
    return [
      "I'm ready for the encrypted DTLS-SRTP voice session now.",
      "Can we sync right after I document the experimental ablation results?",
      "Sounds great, let's connect through our shielded onion relay."
    ];
  }
  if (m.includes('question') || m.includes('how') || m.includes('what') || m.includes('why')) {
    return [
      `From first principles, the core invariant depends on our ${tier} bounds.`,
      "Let's examine the baseline assumptions before drawing conclusions.",
      "I can formulate a mathematical derivation to verify that directly."
    ];
  }
  if (isFirstPrinciples) {
    return [
      `Understood from first principles; I'll formulate the ${tier} hypothesis.`,
      "Could you clarify the underlying assumptions for these empirical metrics?",
      "That aligns with our research roadmap—I will begin implementation."
    ];
  }
  if (isEmpirical) {
    return [
      "I'll benchmark these metrics under controlled experimental conditions.",
      "Could you share the baseline datasets for reproducibility validation?",
      "Let's compare the empirical performance against current state-of-the-art."
    ];
  }
  return [
    `Thank you for the guidance; I'll review and apply this to my ${tier} work.`,
    "Could you provide a minimal working example for clarification?",
    "Understood! I'll update my research notes and proceed to the next milestone."
  ];
}

