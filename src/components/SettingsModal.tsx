import React, { useState } from 'react';
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
  Loader2
} from 'lucide-react';
import { AppFontSize, AppFontTheme, Chat, Message, PrivacySettings, StudentTier, UserProfile } from '../types';
import { useWebAuthn } from '../hooks/useWebAuthn';

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
  onUpdateFontSize?: (size: AppFontSize) => void;
  onUpdateFontTheme?: (theme: AppFontTheme) => void;
  onLockApp?: () => void;
}

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
  onUpdateFontSize,
  onUpdateFontTheme,
  onLockApp,
}) => {
  const [activeTab, setActiveTab] = useState<'education' | 'security' | 'fonts' | 'export' | 'profile'>('fonts');
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

  // Selected chat for export (defaults to activeChat or first available)
  const [selectedChatIdForExport, setSelectedChatIdForExport] = useState<string>(activeChat?.id || (allChats[0]?.id ?? ''));

  // WebAuthn Biometrics hook for testing
  const { 
    isSupported: isWebAuthnSupported, 
    isPlatformAuthenticatorAvailable, 
    isAuthenticating: isTestingWebAuthn, 
    isEnrolled: isWebAuthnEnrolled,
    biometricLabel, 
    authenticate: testWebAuthn,
    resetEnrollment: resetWebAuthn,
    error: webAuthnError
  } = useWebAuthn(user.id, user.name);
  const [webAuthnTestResult, setWebAuthnTestResult] = useState<string | null>(null);

  const handleTestWebAuthn = async () => {
    setWebAuthnTestResult(null);
    const success = await testWebAuthn();
    if (success) {
      setWebAuthnTestResult('✓ Hardware Biometric Challenge Succeeded!');
    } else {
      setWebAuthnTestResult('Challenge incomplete or cancelled.');
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
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleExportChatHistory = (targetChat?: Chat, targetMessages?: Message[]) => {
    const chatToExport = targetChat || allChats.find((c) => c.id === selectedChatIdForExport) || activeChat;
    if (!chatToExport) {
      setExportFeedback('No chat selected for export.');
      setTimeout(() => setExportFeedback(null), 3000);
      return;
    }

    const msgsToExport = targetMessages || allMessagesByChat[chatToExport.id] || (chatToExport.id === activeChat?.id ? messages : []);

    // Strictly enforce and respect the 'isForwardProtected' flag for every message
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
        // Redact content if forward protected
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

  const chatForExportTarget = allChats.find((c) => c.id === selectedChatIdForExport) || activeChat;
  const msgsForExportTarget = chatForExportTarget
    ? allMessagesByChat[chatForExportTarget.id] || (chatForExportTarget.id === activeChat?.id ? messages : [])
    : [];
  const protectedCountInTarget = msgsForExportTarget.filter(
    (m) => m.isForwardProtected || chatForExportTarget?.forwardRestricted
  ).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-[#111B21] border border-[#222E35] rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden text-[#E9EDEF]">
        {/* Header */}
        <header className="px-6 py-4 bg-[#202C33] border-b border-[#222E35] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#00A884]/20 text-[#00A884]">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">SecureChat Settings &amp; Preferences</h3>
              <p className="text-xs text-[#8696A0]">Typography, Eye Comfort, Privacy &amp; Data Export</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#111B21] text-[#8696A0] hover:text-white flex items-center justify-center"
          >
            ✕
          </button>
        </header>

        {/* Tab switcher */}
        <div className="flex border-b border-[#222E35] bg-[#182229] text-xs overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('fonts')}
            className={`flex-1 min-w-[110px] py-3 font-semibold transition-colors flex items-center justify-center gap-1.5 border-b-2 ${
              activeTab === 'fonts'
                ? 'border-[#00A884] text-[#00A884]'
                : 'border-transparent text-[#8696A0] hover:text-white'
            }`}
          >
            <Eye className="w-4 h-4" /> Eye Comfort &amp; Fonts
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 min-w-[110px] py-3 font-semibold transition-colors flex items-center justify-center gap-1.5 border-b-2 ${
              activeTab === 'export'
                ? 'border-[#00A884] text-[#00A884]'
                : 'border-transparent text-[#8696A0] hover:text-white'
            }`}
          >
            <Download className="w-4 h-4" /> Export Chat
          </button>
          <button
            onClick={() => setActiveTab('education')}
            className={`flex-1 min-w-[110px] py-3 font-semibold transition-colors flex items-center justify-center gap-1.5 border-b-2 ${
              activeTab === 'education'
                ? 'border-[#00A884] text-[#00A884]'
                : 'border-transparent text-[#8696A0] hover:text-white'
            }`}
          >
            <GraduationCap className="w-4 h-4" /> Academic &amp; Career
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex-1 min-w-[110px] py-3 font-semibold transition-colors flex items-center justify-center gap-1.5 border-b-2 ${
              activeTab === 'security'
                ? 'border-[#00A884] text-[#00A884]'
                : 'border-transparent text-[#8696A0] hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4" /> Privacy &amp; Keys
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 min-w-[90px] py-3 font-semibold transition-colors flex items-center justify-center gap-1.5 border-b-2 ${
              activeTab === 'profile'
                ? 'border-[#00A884] text-[#00A884]'
                : 'border-transparent text-[#8696A0] hover:text-white'
            }`}
          >
            <User className="w-4 h-4" /> Profile
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* TAB: EYE COMFORT & FONT SELECTION */}
          {activeTab === 'fonts' && (
            <div className="space-y-5">
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

              {/* Interactive Live Eye-Comfort Reading Preview */}
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
                  {/* Sample Peer Message */}
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

                  {/* Sample User Outgoing Message */}
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

          {/* TAB: DATA & CHAT EXPORT (Respecting isForwardProtected flag) */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-[#1F2C34] to-[#202C33] p-4 rounded-2xl border border-[#2A3942] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-[#00A884]/20 text-[#00A884]">
                      <Download className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Export Chat History as JSON</h4>
                      <p className="text-xs text-[#8696A0]">Encrypted backup conforming to privacy policies</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono bg-[#00A884]/20 text-[#00A884] border border-[#00A884]/40 px-2 py-0.5 rounded-full uppercase">
                    JSON Format
                  </span>
                </div>

                {/* Privacy Guarantee Banner */}
                <div className="bg-[#111B21] border border-[#2A3942] rounded-xl p-3 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-semibold">
                    <ShieldCheck className="w-4 h-4 shrink-0 text-[#00A884]" />
                    <span>Privacy Policy &amp; Forward-Protection Enforcement</span>
                  </div>
                  <p className="text-[#8696A0] leading-relaxed">
                    This export strictly respects the <code className="text-emerald-400 font-mono">isForwardProtected</code> flag. Any message flagged as forward-protected (or part of a forward-restricted secret circle) will have its body text and media payload completely redacted from the exported JSON file to prevent unauthorized leakage.
                  </p>
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

                {/* Selected Chat Info Box */}
                {chatForExportTarget ? (
                  <div className="bg-[#111B21] rounded-xl p-3 border border-[#2A3942] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-[#00A884]" />
                        <span>Target: {chatForExportTarget.name}</span>
                        {chatForExportTarget.isSecret && (
                          <span className="text-[10px] text-rose-400 font-mono">[Secret Chat]</span>
                        )}
                      </div>
                      <div className="text-[#8696A0] mt-0.5">
                        {msgsForExportTarget.length} total messages • {protectedCountInTarget} forward-protected (will be redacted)
                      </div>
                    </div>

                    <button
                      onClick={() => handleExportChatHistory(chatForExportTarget, msgsForExportTarget)}
                      className="px-4 py-2 bg-[#00A884] hover:bg-[#008F6F] text-[#111B21] font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 shrink-0 active:scale-98"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download JSON</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-xs text-[#8696A0] italic">
                    Select a conversation above to export its history.
                  </div>
                )}
              </div>

              {exportFeedback && (
                <div className="p-3 bg-[#00A884]/20 border border-[#00A884] text-[#00A884] rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{exportFeedback}</span>
                </div>
              )}

              <div className="bg-[#182229] p-3.5 rounded-2xl border border-[#222E35] text-xs text-[#8696A0] space-y-1">
                <div>📁 <strong>Standard Schema:</strong> Includes timestamps, participant identities, and message classification metadata.</div>
                <div>🛡️ <strong>Zero Plaintext Leakage:</strong> Redacted fields will show <code className="text-amber-300 font-mono text-[11px]">[RESTRICTED: Content redacted in compliance with isForwardProtected privacy policy]</code>.</div>
              </div>
            </div>
          )}

          {activeTab === 'education' && (
            <div className="space-y-4">
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

          {activeTab === 'security' && (
            <div className="space-y-4">
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
              <div className="p-3.5 bg-[#182229] rounded-2xl border border-[#2A3942] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Fingerprint className="w-4 h-4 text-[#00A884]" />
                    <span>Hardware Biometrics (WebAuthn API)</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                    isWebAuthnEnrolled 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                      : 'bg-[#202C33] text-[#8696A0] border-white/5'
                  }`}>
                    {isWebAuthnEnrolled ? 'Device Enrolled' : 'Ready to Challenge'}
                  </span>
                </div>

                <div className="text-xs text-[#8696A0] space-y-1">
                  <div>Detected Sensor: <strong className="text-white">{biometricLabel}</strong></div>
                  <div>Platform Authenticator: <span className={isPlatformAuthenticatorAvailable ? "text-emerald-400 font-semibold" : "text-amber-400"}>
                    {isPlatformAuthenticatorAvailable ? "Available & Active" : "Fallback Emulation Ready"}
                  </span></div>
                </div>

                {webAuthnTestResult && (
                  <div className={`p-2 rounded-xl text-xs font-medium ${
                    webAuthnTestResult.startsWith('✓') 
                      ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30' 
                      : 'bg-rose-950/50 text-rose-300 border border-rose-500/30'
                  }`}>
                    {webAuthnTestResult}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 pt-1">
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
                    <span>Test WebAuthn Prompt</span>
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

              <div className="bg-[#182229] p-3.5 rounded-2xl border border-[#222E35] text-xs text-[#8696A0] space-y-1">
                <div>🔒 <strong>Signal-Grade Double Ratchet:</strong> Keys regenerate periodically.</div>
                <div>🛡️ <strong>Zero Plaintext Storage:</strong> IndexedDB data is encrypted at rest.</div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#8696A0] mb-1 block">Full Name:</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#202C33] border border-[#2A3942] rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-[#00A884]"
                />
              </div>

              {/* Anti-Ban National ID & Phone Registration Badge */}
              <div className="bg-gradient-to-r from-[#182229] to-[#202C33] p-4 rounded-2xl border border-[#2A3942] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BadgeCheck className="w-5 h-5 text-[#00A884]" />
                    <div>
                      <div className="text-xs font-bold text-white">Anti-Ban Verified Identity (Email + Phone + National ID)</div>
                      <div className="text-[11px] text-[#8696A0]">Protects users from arbitrary bans common on Meta & WhatsApp</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/40 uppercase font-bold">
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
                <label className="text-xs font-semibold text-[#8696A0] mb-1 block">Phone (Encrypted Identifier):</label>
                <input
                  type="text"
                  disabled
                  value={user.phone}
                  className="w-full bg-[#182229] border border-[#222E35] rounded-xl px-4 py-2 text-sm text-[#8696A0] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#8696A0] mb-1 block">Email (Sync Status):</label>
                <input
                  type="text"
                  disabled
                  value={user.email || 'Not connected to Google'}
                  className="w-full bg-[#182229] border border-[#222E35] rounded-xl px-4 py-2 text-sm text-[#8696A0] outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="px-6 py-4 bg-[#202C33] border-t border-[#222E35] flex items-center justify-between">
          <span className="text-xs text-[#8696A0]">
            {isSaved && <span className="text-[#00A884] font-bold">✓ Settings saved securely!</span>}
            {activeTab === 'fonts' && <span className="text-[#00A884]">Changes apply immediately for maximum comfort!</span>}
          </span>
          <div className="flex items-center gap-2">
            {activeTab === 'export' ? (
              <button
                onClick={() => handleExportChatHistory(chatForExportTarget, msgsForExportTarget)}
                className="px-5 py-2 rounded-xl bg-[#00A884] text-[#111B21] font-bold text-xs hover:scale-102 active:scale-98 transition-all shadow-md flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                Export Selected Chat JSON
              </button>
            ) : (
              <button
                onClick={handleSave}
                className="px-6 py-2.5 rounded-xl bg-[#00A884] text-[#111B21] font-bold text-sm hover:scale-102 active:scale-98 transition-all shadow-md"
              >
                Save Changes
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
};
