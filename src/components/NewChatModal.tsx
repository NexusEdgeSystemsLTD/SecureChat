import React, { useState } from 'react';
import { 
  MessageSquare, 
  Lock, 
  Users, 
  Radio, 
  GraduationCap, 
  Flame, 
  Search, 
  Plus, 
  ShieldCheck,
  Building2,
  FolderLock
} from 'lucide-react';
import { Chat, ChatType, Department, OrgMember, StudentTier, UserProfile } from '../types';
import { canUserSeeMember } from '../utils/tenancy';

interface NewChatModalProps {
  onClose: () => void;
  currentUser?: UserProfile;
  departments?: Department[];
  members?: OrgMember[];
  onCreateChat: (newChat: {
    name: string;
    type: ChatType;
    topic?: string;
    academicTier?: StudentTier;
    isSecret?: boolean;
    selfDestructDefault?: number;
    forwardRestricted?: boolean;
    departmentId?: string;
    tenantId?: string;
    participantIds?: string[];
  }) => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({ 
  onClose, 
  onCreateChat,
  currentUser,
  departments = [],
  members = [],
}) => {
  const [chatType, setChatType] = useState<ChatType | 'department'>('direct');
  const [chatName, setChatName] = useState('');
  const [topic, setTopic] = useState('');
  const [academicTier, setAcademicTier] = useState<StudentTier>('Bachelor');
  const [burnTimer, setBurnTimer] = useState<number>(30);
  const [forwardRestricted, setForwardRestricted] = useState(true);
  const [memberFilterQuery, setMemberFilterQuery] = useState('');

  const isExecutive = currentUser?.orgRole === 'MD' || currentUser?.orgRole === 'CTO' || currentUser?.orgRole === 'DAF';
  
  // Department choices available to user
  const availableDepts = isExecutive
    ? departments
    : departments.filter((d) => d.id === currentUser?.departmentId);

  const [selectedDeptId, setSelectedDeptId] = useState<string>(
    currentUser?.departmentId || availableDepts[0]?.id || ''
  );

  // Filter members strictly based on ABAC / Department Airgap
  const permittedMembers = members.filter((m) => {
    if (!currentUser) return true;
    if (m.userId === currentUser.id) return false; // Exclude self
    return canUserSeeMember(currentUser, m);
  }).filter((m) => {
    if (!memberFilterQuery) return true;
    return m.name.toLowerCase().includes(memberFilterQuery.toLowerCase()) ||
      m.role.toLowerCase().includes(memberFilterQuery.toLowerCase()) ||
      (m.title && m.title.toLowerCase().includes(memberFilterQuery.toLowerCase()));
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatName.trim()) return;

    const actualChatType: ChatType = chatType === 'department' ? 'group' : chatType;

    onCreateChat({
      name: chatName.trim(),
      type: actualChatType,
      topic: topic.trim() || undefined,
      academicTier: chatType === 'study_circle' ? academicTier : undefined,
      isSecret: chatType === 'secret',
      selfDestructDefault: chatType === 'secret' ? burnTimer : 0,
      forwardRestricted: chatType === 'secret' ? forwardRestricted : false,
      departmentId: chatType === 'department' ? selectedDeptId : (currentUser?.departmentId),
      tenantId: currentUser?.tenantId,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-[#111B21] border border-[#222E35] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden text-[#E9EDEF]">
        {/* Header */}
        <header className="px-6 py-4 bg-[#202C33] border-b border-[#222E35] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#00A884]/20 text-[#00A884]">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Start New Conversation</h3>
              <p className="text-xs text-[#8696A0]">End-to-End Encrypted (AES-256-GCM)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#111B21] text-[#8696A0] hover:text-white flex items-center justify-center"
          >
            ✕
          </button>
        </header>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Chat Type Selection */}
          <div className="grid grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setChatType('direct')}
              className={`p-2.5 rounded-2xl border text-left flex flex-col items-center text-center transition-all ${
                chatType === 'direct'
                  ? 'bg-[#00A884]/20 border-[#00A884] text-[#00A884]'
                  : 'bg-[#202C33] border-[#2A3942] text-[#8696A0] hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4 mb-1" />
              <span className="text-[11px] font-bold">Direct E2EE</span>
            </button>

            <button
              type="button"
              onClick={() => setChatType('department')}
              className={`p-2.5 rounded-2xl border text-left flex flex-col items-center text-center transition-all ${
                chatType === 'department'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-[#202C33] border-[#2A3942] text-[#8696A0] hover:text-white'
              }`}
            >
              <FolderLock className="w-4 h-4 mb-1" />
              <span className="text-[11px] font-bold">Dept Airgap</span>
            </button>

            <button
              type="button"
              onClick={() => setChatType('secret')}
              className={`p-2.5 rounded-2xl border text-left flex flex-col items-center text-center transition-all ${
                chatType === 'secret'
                  ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                  : 'bg-[#202C33] border-[#2A3942] text-[#8696A0] hover:text-white'
              }`}
            >
              <Lock className="w-4 h-4 mb-1" />
              <span className="text-[11px] font-bold">Secret</span>
            </button>

            <button
              type="button"
              onClick={() => setChatType('study_circle')}
              className={`p-2.5 rounded-2xl border text-left flex flex-col items-center text-center transition-all ${
                chatType === 'study_circle'
                  ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                  : 'bg-[#202C33] border-[#2A3942] text-[#8696A0] hover:text-white'
              }`}
            >
              <GraduationCap className="w-4 h-4 mb-1" />
              <span className="text-[11px] font-bold">Study Circle</span>
            </button>
          </div>

          {/* Department Selection if chatType === 'department' */}
          {chatType === 'department' && (
            <div className="bg-[#182229] p-3.5 rounded-2xl border border-amber-500/30 space-y-2.5 text-xs">
              <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                <FolderLock className="w-4 h-4" />
                <span>Isolated Department Firewall Target:</span>
              </div>
              <select
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
                className="w-full bg-[#202C33] border border-[#2A3942] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
              >
                {availableDepts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-[#8696A0]">
                {isExecutive 
                  ? '✓ Executive authority: You have permissions to target any department channel.' 
                  : '🔒 Strict Airgap: Only members within your department can see or read this conversation.'}
              </p>
            </div>
          )}

          {/* Peer Directory Selection if chatType === 'direct' */}
          {chatType === 'direct' && (
            <div className="bg-[#182229] p-3 rounded-2xl border border-[#222E35] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#00A884]" />
                  <span>Authorized Personnel ({permittedMembers.length}):</span>
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${
                  isExecutive ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                }`}>
                  {isExecutive ? 'TRIAD: ALL DEPTS' : 'AIR-GAPPED: OWN DEPT ONLY'}
                </span>
              </div>

              {/* Quick Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#8696A0] absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={memberFilterQuery}
                  onChange={(e) => setMemberFilterQuery(e.target.value)}
                  placeholder="Search authorized personnel..."
                  className="w-full bg-[#202C33] border border-[#2A3942] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#8696A0] outline-none focus:border-[#00A884]"
                />
              </div>

              {/* Members List */}
              <div className="max-h-32 overflow-y-auto space-y-1 pr-1 divide-y divide-white/5">
                {permittedMembers.length === 0 ? (
                  <div className="text-[11px] text-[#8696A0] py-2 text-center">
                    No colleagues match or other departments are airgapped.
                  </div>
                ) : (
                  permittedMembers.map((m) => {
                    const dept = departments.find((d) => d.id === m.departmentId);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setChatName(m.name)}
                        className={`w-full text-left p-1.5 rounded-lg flex items-center justify-between hover:bg-[#202C33] transition-all text-xs ${
                          chatName === m.name ? 'bg-[#00A884]/20 border border-[#00A884]/40' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <img src={m.avatar} alt={m.name} className="w-5 h-5 rounded-full object-cover shrink-0" />
                          <div className="truncate">
                            <span className="font-medium text-white truncate">{m.name}</span>
                            <span className="text-[10px] text-[#8696A0] ml-1.5 truncate">
                              {dept ? `[${dept.code}]` : `[${m.role}]`}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono px-1 rounded bg-[#202C33] text-[#8696A0] shrink-0">
                          {m.role}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Name Input */}
          <div>
            <label className="text-xs font-semibold text-[#8696A0] mb-1 block">
              {chatType === 'direct' ? 'Contact or Peer Name' : 'Circle / Secret Chat Title'}:
            </label>
            <input
              type="text"
              required
              value={chatName}
              onChange={(e) => setChatName(e.target.value)}
              placeholder="e.g. Dr. Maya Lin, Quantum Computing Group, etc."
              className="w-full bg-[#202C33] border border-[#2A3942] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#8696A0] outline-none focus:border-[#00A884]"
            />
          </div>

          {/* Secret Chat Options */}
          {chatType === 'secret' && (
            <div className="bg-[#182229] p-4 rounded-2xl border border-rose-500/30 space-y-3">
              <div className="flex items-center gap-1.5 text-xs text-rose-400 font-bold">
                <Flame className="w-4 h-4" />
                <span>Burn-on-Read Self Destruct Timer:</span>
              </div>
              <div className="flex gap-2">
                {[5, 10, 30, 60, 300].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setBurnTimer(sec)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border ${
                      burnTimer === sec
                        ? 'bg-rose-500/30 border-rose-500 text-white'
                        : 'bg-[#202C33] border-[#2A3942] text-[#8696A0]'
                    }`}
                  >
                    {sec < 60 ? `${sec}s` : `${sec / 60}m`}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#222E35] text-xs">
                <span className="text-[#8696A0]">Restrict Forwarding & Copying:</span>
                <input
                  type="checkbox"
                  checked={forwardRestricted}
                  onChange={(e) => setForwardRestricted(e.target.checked)}
                  className="w-4 h-4 accent-rose-500"
                />
              </div>
            </div>
          )}

          {/* Study Circle Options */}
          {chatType === 'study_circle' && (
            <div className="bg-[#182229] p-4 rounded-2xl border border-blue-500/30 space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#8696A0] mb-1 block">
                  Target Academic Tier:
                </label>
                <select
                  value={academicTier}
                  onChange={(e) => setAcademicTier(e.target.value as StudentTier)}
                  className="w-full bg-[#202C33] border border-[#2A3942] rounded-xl px-3 py-2 text-xs text-white outline-none"
                >
                  <option value="High School">High School (AP/IB/Olympiad)</option>
                  <option value="Bachelor">Bachelor (Undergraduate)</option>
                  <option value="Masters">Masters (Graduate)</option>
                  <option value="PhD">PhD (Doctoral)</option>
                  <option value="Post-PhD">Post-PhD (Principal/Fellow)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#8696A0] mb-1 block">
                  Research Topic or Course Focus:
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Machine Learning Theory, Organic Chemistry, etc."
                  className="w-full bg-[#202C33] border border-[#2A3942] rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-[#00A884] text-[#111B21] font-bold text-sm hover:scale-101 active:scale-99 transition-all shadow-md mt-2"
          >
            Create Encrypted Chat
          </button>
        </form>
      </div>
    </div>
  );
};
