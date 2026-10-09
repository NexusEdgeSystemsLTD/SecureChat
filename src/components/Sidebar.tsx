import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  MessageSquarePlus, 
  MoreVertical, 
  Search, 
  GraduationCap, 
  Sparkles, 
  Radio, 
  Users, 
  Flame, 
  CheckCheck, 
  Check, 
  Clock, 
  Filter, 
  Settings,
  CircleDot,
  Fingerprint,
  Music,
  Film,
  Bot,
  LogIn,
  CloudCheck,
  Type,
  Eye,
  IdCard,
  UserCheck,
  Building2,
  FolderLock,
  Crown
} from 'lucide-react';
import { AppFontSize, AppLanguage, Chat, ChatType, StudentTier, UserProfile } from '../types';
import { canUserAccessDepartment } from '../utils/tenancy';
import { t } from '../utils/i18n';

interface SidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  userProfile: UserProfile;
  onOpenMentorship: () => void;
  onOpenPrivacyShield: () => void;
  onOpenAIEngine: () => void;
  onOpenStatusStories: () => void;
  onOpenSettings: () => void;
  onOpenNewChat: () => void;
  onOpenSafetyNumbers: (chat: Chat) => void;
  onLockApp: () => void;
  onOpenLyriaMusic?: () => void;
  onOpenMultimodalStudio?: (tab?: 'image' | 'video' | 'search' | 'maps' | 'transcribe') => void;
  onOpenGeminiChatbot?: () => void;
  onSignInGoogle?: () => void;
  firebaseUser?: any;
  fontSize?: AppFontSize;
  onCycleFontSize?: () => void;
  onOpenRegister?: () => void;
  onOpenTenancy?: () => void;
  activeTenantName?: string;
  language?: AppLanguage;
}

export const Sidebar: React.FC<SidebarProps> = ({
  chats,
  activeChatId,
  onSelectChat,
  userProfile,
  onOpenMentorship,
  onOpenPrivacyShield,
  onOpenAIEngine,
  onOpenStatusStories,
  onOpenSettings,
  onOpenNewChat,
  onLockApp,
  onOpenLyriaMusic,
  onOpenMultimodalStudio,
  onOpenGeminiChatbot,
  onSignInGoogle,
  firebaseUser,
  fontSize = 'medium',
  onCycleFontSize,
  onOpenRegister,
  onOpenTenancy,
  activeTenantName = 'NexusEdge Systems Ltd',
  language = 'en',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'departments' | 'mentorship' | 'group' | 'secret'>('all');
  const [showMenu, setShowMenu] = useState(false);

  // Department Airgap Filtering:
  // MD, CTO, and DAF can see all chats across all departments.
  // Normal staff only see chats from their own department or general public chats.
  const isExecutive = userProfile.orgRole === 'MD' || userProfile.orgRole === 'CTO' || userProfile.orgRole === 'DAF';

  const visibleChats = chats.filter((chat) => {
    // If chat has a departmentId and user is not executive, enforce strict department wall
    if (chat.departmentId) {
      if (!isExecutive && chat.departmentId !== userProfile.departmentId) {
        return false; // Air-gapped! User from other department cannot see this chat.
      }
    }
    return true;
  });

  const filteredChats = visibleChats.filter((chat) => {
    const matchesSearch = chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (chat.subtitle && chat.subtitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (chat.lastMessage && chat.lastMessage.text.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterType === 'unread') return chat.unreadCount > 0;
    if (filterType === 'departments') return !!chat.departmentId || chat.id === 'chat_exec_boardroom';
    if (filterType === 'mentorship') return chat.type === 'study_circle' || !!chat.academicTier;
    if (filterType === 'group') return chat.type === 'group';
    if (filterType === 'secret') return chat.type === 'secret' || chat.isSecret;

    return true;
  });

  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <aside className="w-full md:w-[380px] lg:w-[420px] flex-shrink-0 flex flex-col h-full bg-[#111B21] border-r border-[#222E35] select-none text-[#E9EDEF]">
      {/* WhatsApp Signature Top Bar */}
      <header className="h-16 px-4 bg-[#202C33] flex items-center justify-between z-20 shadow-sm border-b border-[#222E35]">
        {/* User Profile Avatar with Student Tier Badge & Org Role */}
        <div 
          onClick={onOpenSettings}
          className="flex items-center gap-3 cursor-pointer group hover:opacity-90 transition-opacity"
          title="Click to view your Secure Profile & Academic Level"
        >
          <div className="relative">
            <img
              src={userProfile.avatar}
              alt={userProfile.name}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-[#00A884]/40 group-hover:ring-[#00A884] transition-all"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#00A884] border-2 border-[#202C33] rounded-full" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-sm font-semibold text-[#E9EDEF] flex items-center gap-1.5 leading-tight">
              {userProfile.name}
              {userProfile.orgRole && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${
                  userProfile.orgRole === 'MD' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                  userProfile.orgRole === 'CTO' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' :
                  userProfile.orgRole === 'DAF' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                  userProfile.orgRole === 'DEPT_HEAD' ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' :
                  'bg-blue-500/20 text-blue-300 border-blue-500/40'
                }`}>
                  {userProfile.orgRole}
                </span>
              )}
            </span>
            <span className="text-xs text-[#8696A0] truncate max-w-[140px]">
              {userProfile.orgTitle || userProfile.institution || 'Secure Scholar'}
            </span>
          </div>
        </div>

        {/* Action Icons */}
        <div className="flex items-center gap-0.5 text-[#AEBAC1]">
          {/* Multi-Tenant Organization & Department Firewall Button */}
          {onOpenTenancy && (
            <button
              onClick={onOpenTenancy}
              className="p-2 rounded-full hover:bg-[#374248] text-amber-300 hover:text-amber-200 transition-colors relative"
              title="Organization Tenants & Department Air-Gap Manager (MD / CTO / DAF)"
            >
              <Building2 className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-amber-400 rounded-full" />
            </button>
          )}

          {/* Student Mentorship Hub Button */}
          <button
            onClick={onOpenMentorship}
            className="p-2 rounded-full hover:bg-[#374248] hover:text-[#00A884] transition-colors relative"
            title="Student Mentorship & Career Development Hub"
          >
            <GraduationCap className="w-5 h-5 text-[#00A884]" />
          </button>

          {/* AI Cognitive & Interests Engine */}
          <button
            onClick={onOpenAIEngine}
            className="p-2 rounded-full hover:bg-[#374248] hover:text-[#25D366] transition-colors"
            title="AI Adaptive Cognitive Profile & Recommendations"
          >
            <Sparkles className="w-5 h-5 text-amber-400" />
          </button>

          {/* Status / Stories */}
          <button
            onClick={onOpenStatusStories}
            className="p-2 rounded-full hover:bg-[#374248] hover:text-[#E9EDEF] transition-colors"
            title="Encrypted Status Stories (24h Ephemeral)"
          >
            <CircleDot className="w-5 h-5 text-emerald-400" />
          </button>

          {/* Quick Lock App Button */}
          <button
            onClick={onLockApp}
            className="p-2 rounded-full hover:bg-[#374248] hover:text-rose-400 text-[#AEBAC1] transition-colors"
            title="Lock App (Test Biometrics / WebAuthn / Face ID / PIN)"
          >
            <Lock className="w-5 h-5" />
          </button>

          {/* New Chat */}
          <button
            onClick={onOpenNewChat}
            className="p-2 rounded-full hover:bg-[#374248] hover:text-[#E9EDEF] transition-colors"
            title="Start New Encrypted or Secret Chat"
          >
            <MessageSquarePlus className="w-5 h-5" />
          </button>

          {/* More Menu Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-full hover:bg-[#374248] hover:text-[#E9EDEF] transition-colors"
              title="Menu & Security"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {showMenu && (
              <div 
                className="absolute right-0 top-12 w-64 bg-[#233138] rounded-lg shadow-2xl py-2 z-50 border border-[#374248] text-sm animate-in fade-in zoom-in-95 duration-100"
                onClick={() => setShowMenu(false)}
              >
                {onOpenTenancy && (
                  <button
                    onClick={onOpenTenancy}
                    className="w-full text-left px-4 py-2.5 hover:bg-[#182229] flex items-center gap-2.5 text-amber-300 font-semibold"
                  >
                    <Building2 className="w-4 h-4 text-amber-400" />
                    <div>
                      <div>Tenants & Departments</div>
                      <div className="text-[10px] text-[#8696A0] font-normal">MD / CTO / DAF Airgap Control</div>
                    </div>
                  </button>
                )}

                <button
                  onClick={onOpenMentorship}
                  className="w-full text-left px-4 py-2.5 hover:bg-[#182229] flex items-center gap-2.5 text-[#E9EDEF]"
                >
                  <GraduationCap className="w-4 h-4 text-[#00A884]" />
                  <span>Academic Mentorship Hub</span>
                </button>

                {onOpenLyriaMusic && (
                  <button
                    onClick={onOpenLyriaMusic}
                    className="w-full text-left px-4 py-2.5 hover:bg-[#182229] flex items-center gap-2.5 text-[#E9EDEF]"
                  >
                    <Music className="w-4 h-4 text-[#9C27B0]" />
                    <span>Lyria 3 Music &amp; Study Beats</span>
                  </button>
                )}

                {onOpenMultimodalStudio && (
                  <button
                    onClick={() => onOpenMultimodalStudio('image')}
                    className="w-full text-left px-4 py-2.5 hover:bg-[#182229] flex items-center gap-2.5 text-[#E9EDEF]"
                  >
                    <Film className="w-4 h-4 text-[#53BDEB]" />
                    <span>AI Multimodal Studio (Veo/Images)</span>
                  </button>
                )}

                {onOpenGeminiChatbot && (
                  <button
                    onClick={onOpenGeminiChatbot}
                    className="w-full text-left px-4 py-2.5 hover:bg-[#182229] flex items-center gap-2.5 text-[#E9EDEF]"
                  >
                    <Bot className="w-4 h-4 text-[#00A884]" />
                    <span>Gemini Multi-Turn Chatbot</span>
                  </button>
                )}

                <button
                  onClick={onOpenPrivacyShield}
                  className="w-full text-left px-4 py-2.5 hover:bg-[#182229] flex items-center gap-2.5 text-[#E9EDEF]"
                >
                  <ShieldCheck className="w-4 h-4 text-[#25D366]" />
                  <span>Tor Relay &amp; Privacy Shield</span>
                </button>

                <button
                  onClick={onOpenAIEngine}
                  className="w-full text-left px-4 py-2.5 hover:bg-[#182229] flex items-center gap-2.5 text-[#E9EDEF]"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>AI Learning & Career Insights</span>
                </button>

                <button
                  onClick={onOpenSettings}
                  className="w-full text-left px-4 py-2.5 hover:bg-[#182229] flex items-center gap-2.5 text-[#E9EDEF]"
                >
                  <Eye className="w-4 h-4 text-[#00A884]" />
                  <div className="flex-1 flex items-center justify-between">
                    <span>Eye Comfort &amp; Fonts</span>
                    <span className="text-[10px] uppercase font-mono text-[#00A884] bg-[#00A884]/20 px-1.5 py-0.5 rounded">
                      {fontSize}
                    </span>
                  </div>
                </button>

                {onOpenRegister && (
                  <button
                    onClick={onOpenRegister}
                    className="w-full text-left px-4 py-2.5 hover:bg-[#182229] flex items-center gap-2.5 text-[#E9EDEF]"
                  >
                    <IdCard className="w-4 h-4 text-[#00A884]" />
                    <div className="flex-1">
                      <div>Anti-Ban Registration</div>
                      <div className="text-[10px] text-[#8696A0]">Email + Phone + National ID</div>
                    </div>
                  </button>
                )}

                <button
                  onClick={onOpenSettings}
                  className="w-full text-left px-4 py-2.5 hover:bg-[#182229] flex items-center gap-2.5 text-[#E9EDEF]"
                >
                  <Settings className="w-4 h-4 text-[#8696A0]" />
                  <span>Settings & Encryption Keys</span>
                </button>

                <div className="my-1.5 border-t border-[#374248]" />

                <button
                  onClick={onLockApp}
                  className="w-full text-left px-4 py-2.5 hover:bg-rose-950/40 text-rose-400 flex items-center gap-2.5"
                >
                  <Lock className="w-4 h-4" />
                  <span>Lock App (Face ID / PIN / Password)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Tenant Context Pill Bar */}
      {onOpenTenancy && (
        <div 
          onClick={onOpenTenancy}
          className="px-4 py-2 bg-[#182229] border-b border-[#222E35] flex items-center justify-between text-xs cursor-pointer hover:bg-[#202C33] transition-colors"
          title="Click to view departments & access control"
        >
          <div className="flex items-center gap-2 truncate">
            <Building2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span className="text-white font-medium truncate">{activeTenantName}</span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {isExecutive ? (
              <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.5 rounded border border-amber-500/40">
                TRIAD OVERSIGHT
              </span>
            ) : (
              <span className="text-[10px] bg-purple-500/20 text-purple-300 font-medium px-1.5 py-0.5 rounded border border-purple-500/30">
                AIR-GAPPED
              </span>
            )}
          </div>
        </div>
      )}

      {/* Search Input Bar */}
      <div className="p-3 bg-[#111B21]">
        <div className="relative flex items-center bg-[#202C33] rounded-lg px-3 py-1.5 focus-within:ring-1 focus-within:ring-[#00A884]">
          <Search className="w-4 h-4 text-[#8696A0] mr-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder', language)}
            className="w-full bg-transparent text-sm text-[#E9EDEF] placeholder-[#8696A0] outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-[#8696A0] hover:text-[#E9EDEF] px-1"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto no-scrollbar pb-0.5 text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 rounded-full whitespace-nowrap transition-all font-medium ${
              filterType === 'all'
                ? 'bg-[#00A884]/20 text-[#00A884] border border-[#00A884]/40 font-semibold'
                : 'bg-[#202C33] text-[#8696A0] hover:bg-[#2A3942]'
            }`}
          >
            {t('allChats', language)}
          </button>
          <button
            onClick={() => setFilterType('departments')}
            className={`px-3 py-1 rounded-full whitespace-nowrap transition-all flex items-center gap-1 ${
              filterType === 'departments'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                : 'bg-[#202C33] text-[#8696A0] hover:bg-[#2A3942]'
            }`}
          >
            <FolderLock className="w-3.5 h-3.5" />
            {t('departments', language)}
          </button>
          <button
            onClick={() => setFilterType('unread')}
            className={`px-3 py-1 rounded-full whitespace-nowrap transition-all ${
              filterType === 'unread'
                ? 'bg-[#00A884]/20 text-[#00A884] border border-[#00A884]/40 font-semibold'
                : 'bg-[#202C33] text-[#8696A0] hover:bg-[#2A3942]'
            }`}
          >
            {t('unread', language)}
          </button>
          <button
            onClick={() => setFilterType('mentorship')}
            className={`px-3 py-1 rounded-full whitespace-nowrap transition-all flex items-center gap-1 ${
              filterType === 'mentorship'
                ? 'bg-[#00A884] text-[#111B21] font-semibold'
                : 'bg-[#202C33] text-[#8696A0] hover:bg-[#2A3942]'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            {t('mentorship', language)}
          </button>
          <button
            onClick={() => setFilterType('secret')}
            className={`px-3 py-1 rounded-full whitespace-nowrap transition-all flex items-center gap-1 ${
              filterType === 'secret'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-semibold'
                : 'bg-[#202C33] text-[#8696A0] hover:bg-[#2A3942]'
            }`}
          >
            <Lock className="w-3 h-3 text-rose-400" />
            {t('secret', language)}
          </button>
          <button
            onClick={() => setFilterType('group')}
            className={`px-3 py-1 rounded-full whitespace-nowrap transition-all ${
              filterType === 'group'
                ? 'bg-[#00A884]/20 text-[#00A884] border border-[#00A884]/40 font-semibold'
                : 'bg-[#202C33] text-[#8696A0] hover:bg-[#2A3942]'
            }`}
          >
            {t('groups', language)}
          </button>
        </div>

        {/* Multimodal Quick Access Toolbar */}
        <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto no-scrollbar pb-0.5 text-[11px]">
          {onOpenLyriaMusic && (
            <button
              onClick={onOpenLyriaMusic}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#9C27B0]/15 text-[#E1BEE7] border border-[#9C27B0]/30 hover:bg-[#9C27B0]/25 transition-all whitespace-nowrap"
              title="Lyria-3 Focus Music & Beats"
            >
              <Music className="w-3 h-3 text-[#9C27B0]" />
              <span>Lyria Beats</span>
            </button>
          )}

          {onOpenMultimodalStudio && (
            <button
              onClick={() => onOpenMultimodalStudio('image')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#53BDEB]/15 text-[#B3E5FC] border border-[#53BDEB]/30 hover:bg-[#53BDEB]/25 transition-all whitespace-nowrap"
              title="AI Multimodal Studio: Veo 3.1 & Gemini Image Creation"
            >
              <Film className="w-3 h-3 text-[#53BDEB]" />
              <span>Veo &amp; Studio</span>
            </button>
          )}

          {onOpenGeminiChatbot && (
            <button
              onClick={onOpenGeminiChatbot}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#00A884]/15 text-[#A7F3D0] border border-[#00A884]/30 hover:bg-[#00A884]/25 transition-all whitespace-nowrap"
              title="Gemini Multi-Turn AI Chatbot"
            >
              <Bot className="w-3 h-3 text-[#00A884]" />
              <span>Gemini Bot</span>
            </button>
          )}

          {onCycleFontSize && (
            <button
              onClick={onCycleFontSize}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#2A3942] hover:bg-[#374248] text-[#E9EDEF] border border-[#374248] transition-all whitespace-nowrap"
              title={`Quick Font Comfort: ${fontSize.toUpperCase()} (Click to cycle Small → Medium → Large → Extra)`}
            >
              <Type className="w-3 h-3 text-[#00A884]" />
              <span className="capitalize">{fontSize}</span>
            </button>
          )}

          {onSignInGoogle && (
            <button
              onClick={onSignInGoogle}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-all whitespace-nowrap ml-auto ${
                firebaseUser
                  ? 'bg-emerald-950/30 text-emerald-400 border-emerald-800/40'
                  : 'bg-[#4285F4]/15 text-[#93C5FD] border-[#4285F4]/30 hover:bg-[#4285F4]/25'
              }`}
              title={firebaseUser ? `Connected as ${firebaseUser.email}` : 'Sign in with Google (Firebase Auth)'}
            >
              <LogIn className="w-3 h-3 text-[#4285F4]" />
              <span>{firebaseUser ? 'Synced' : 'Google Sync'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#202C33]/60">
        {filteredChats.length === 0 ? (
          <div className="p-8 text-center text-[#8696A0] flex flex-col items-center">
            <Search className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm">No conversations found</p>
            <p className="text-xs text-[#8696A0]/70 mt-1">
              {!isExecutive && filterType === 'departments' 
                ? 'Department isolation active: conversations from other departments are hidden'
                : 'Try another filter or start a new chat'}
            </p>
          </div>
        ) : (
          filteredChats.map((chat) => {
            const isSelected = chat.id === activeChatId;

            return (
              <div
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`flex items-center gap-3.5 px-4 py-3 cursor-pointer transition-colors relative ${
                  isSelected ? 'bg-[#2A3942]' : 'hover:bg-[#202C33]/80'
                }`}
              >
                {/* Avatar with Badges */}
                <div className="relative flex-shrink-0">
                  <img
                    src={chat.avatar}
                    alt={chat.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  {chat.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#00A884] border-2 border-[#111B21] rounded-full" />
                  )}
                  {chat.isSecret && (
                    <span 
                      className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 rounded-full flex items-center justify-center border-2 border-[#111B21]" 
                      title="Telegram-Style Secret Chat (Burn-on-Read active)"
                    >
                      <Lock className="w-2.5 h-2.5 text-white" />
                    </span>
                  )}
                  {chat.departmentId && (
                    <span 
                      className="absolute -top-1 -right-1 w-5 h-5 bg-amber-600 rounded-full flex items-center justify-center border-2 border-[#111B21]" 
                      title="Departmental Segregated Channel"
                    >
                      <FolderLock className="w-2.5 h-2.5 text-white" />
                    </span>
                  )}
                  {chat.id === 'chat_exec_boardroom' && (
                    <span 
                      className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center border-2 border-[#111B21]" 
                      title="Executive Boardroom (MD / CTO / DAF)"
                    >
                      <Crown className="w-2.5 h-2.5 text-black" />
                    </span>
                  )}
                  {chat.type === 'study_circle' && !chat.departmentId && (
                    <span 
                      className="absolute -top-1 -right-1 w-5 h-5 bg-[#00A884] rounded-full flex items-center justify-center border-2 border-[#111B21]" 
                      title="Academic Mentorship Channel"
                    >
                      <GraduationCap className="w-3 h-3 text-white" />
                    </span>
                  )}
                </div>

                {/* Chat Details */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-[#E9EDEF] truncate flex items-center gap-1.5">
                      {chat.name}
                      {chat.e2eeVerified && (
                        <span title="Signal E2EE Verified">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#00A884] flex-shrink-0" />
                        </span>
                      )}
                    </span>
                    <span className="text-[11px] text-[#8696A0] whitespace-nowrap ml-2">
                      {formatTimestamp(chat.lastMessage?.timestamp)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#8696A0]">
                    <div className="flex items-center gap-1.5 truncate">
                      {chat.lastMessage?.senderId === userProfile.id && (
                        <CheckCheck className="w-4 h-4 text-[#53BDEB] flex-shrink-0" />
                      )}
                      {chat.isSecret && (
                        <Flame className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                      )}
                      <span className="truncate">
                        {chat.lastMessage?.text || 'No messages yet'}
                      </span>
                    </div>

                    {/* Unread Counter Badge */}
                    {chat.unreadCount > 0 && (
                      <span className="ml-2 bg-[#00A884] text-[#111B21] text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>

                  {/* Academic Topic Tag or Department Tag if present */}
                  {chat.topic && (
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-[#00A884] truncate">
                      <span className={`truncate px-1.5 py-0.5 rounded border ${
                        chat.departmentId 
                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' 
                          : 'bg-[#00A884]/10 text-[#00A884] border-[#00A884]/20'
                      }`}>
                        {chat.departmentId ? `[DEPT AIRGAP] ` : chat.academicTier ? `[${chat.academicTier}] ` : ''}{chat.topic}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Network Privacy & Anti-Tracking Status Bar */}
      <footer 
        onClick={onOpenPrivacyShield}
        className="h-11 px-3 bg-[#182229] border-t border-[#222E35] flex items-center justify-between text-[11px] text-[#8696A0] cursor-pointer hover:bg-[#202C33] transition-colors"
        title="Tor Onion Relays Active • Click for Zero-Knowledge Telemetry"
      >
        <div className="flex items-center gap-2 truncate">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00A884] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00A884]"></span>
          </span>
          <span className="text-[#00A884] font-medium flex items-center gap-1 truncate">
            <ShieldCheck className="w-3.5 h-3.5" />
            Tor Relay: 3-Hop Shield (91.219.236.44)
          </span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-[#222E35] text-[#8696A0] border border-[#374248]">
          AES-256
        </span>
      </footer>
    </aside>
  );
};
