import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Radio, 
  Layers, 
  MapPin, 
  Lock, 
  Cpu, 
  RefreshCw, 
  CheckCircle2, 
  EyeOff, 
  FileCheck,
  Zap,
  Globe2,
  CheckCheck,
  Search,
  Shield,
  Info,
  Check
} from 'lucide-react';
import { Chat, PrivacySettings } from '../types';

interface PrivacyShieldModalProps {
  settings: PrivacySettings;
  onUpdateSettings: (settings: PrivacySettings) => void;
  onClose: () => void;
  chats?: Chat[];
  activeChatId?: string;
  onUpdateChats?: (updatedChats: Chat[]) => void;
}

export const PrivacyShieldModal: React.FC<PrivacyShieldModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
  chats = [],
  activeChatId,
  onUpdateChats,
}) => {
  const [isRotating, setIsRotating] = useState(false);
  const [currentIp, setCurrentIp] = useState('91.219.236.44');
  const [chatSearchFilter, setChatSearchFilter] = useState('');

  const hops = [
    {
      hop: 1,
      title: 'Entry Guard Relay',
      location: 'Zurich, Switzerland',
      ip: '194.38.20.12',
      cipher: 'Curve25519-AES-256-GCM',
      latency: '18ms',
    },
    {
      hop: 2,
      title: 'Middle Oblivious Mixnet',
      location: 'Reykjavik, Iceland',
      ip: '185.112.82.9',
      cipher: 'ChaCha20-Poly1305',
      latency: '42ms',
    },
    {
      hop: 3,
      title: 'Exit Privacy Shield',
      location: 'Stockholm, Sweden',
      ip: currentIp,
      cipher: 'AES-256-GCM',
      latency: '65ms',
    },
  ];

  const handleRotateRelayCircuit = () => {
    setIsRotating(true);
    setTimeout(() => {
      const exitIps = ['91.219.236.44', '185.220.101.5', '198.98.51.189', '178.17.170.82'];
      const nextIp = exitIps[(exitIps.indexOf(currentIp) + 1) % exitIps.length];
      setCurrentIp(nextIp);
      setIsRotating(false);
    }, 900);
  };

  const toggleSetting = (key: keyof PrivacySettings) => {
    onUpdateSettings({
      ...settings,
      [key]: !settings[key],
    });
  };

  const disabledChatsSet = new Set(settings.disabledReadReceiptChatIds || []);

  const handleToggleChatReadReceipts = (chatId: string) => {
    const nextSet = new Set(disabledChatsSet);
    const willBeDisabled = !nextSet.has(chatId);
    if (willBeDisabled) {
      nextSet.add(chatId);
    } else {
      nextSet.delete(chatId);
    }
    const updatedIds = Array.from(nextSet);

    // Update global privacy settings
    onUpdateSettings({
      ...settings,
      disabledReadReceiptChatIds: updatedIds,
    });

    // Also update chat state if provided
    if (onUpdateChats && chats.length > 0) {
      const updatedChats = chats.map((c) =>
        c.id === chatId ? { ...c, disableReadReceipts: willBeDisabled } : c
      );
      onUpdateChats(updatedChats);
    }
  };

  const filteredChats = chats.filter((c) =>
    c.name.toLowerCase().includes(chatSearchFilter.toLowerCase()) ||
    (c.topic && c.topic.toLowerCase().includes(chatSearchFilter.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-[#111B21] border border-[#222E35] rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden text-[#E9EDEF]">
        {/* Header */}
        <header className="px-6 py-4 bg-[#202C33] border-b border-[#222E35] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#00A884]/20 text-[#00A884]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Tor / Oblivious Relay Network & Anti-Tracking Shield
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00A884] text-[#111B21] font-bold">
                  ACTIVE
                </span>
              </h3>
              <p className="text-xs text-[#8696A0]">
                Zero-Knowledge Onion Routing: Hiding your physical IP, metadata, and traffic timings
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#111B21] text-[#8696A0] hover:text-white flex items-center justify-center"
          >
            ✕
          </button>
        </header>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Active Circuit Diagram */}
          <div className="bg-[#202C33] p-5 rounded-2xl border border-[#2A3942]">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Globe2 className="w-4 h-4 text-[#00A884]" /> 3-Hop Onion Circuit Topology
              </span>
              <button
                onClick={handleRotateRelayCircuit}
                disabled={isRotating}
                className="text-xs text-[#00A884] hover:underline flex items-center gap-1 font-semibold disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin' : ''}`} />
                New Circuit Circuit Hop
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 relative">
              {hops.map((h, i) => (
                <div
                  key={i}
                  className="bg-[#111B21] p-3.5 rounded-xl border border-white/5 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between text-[10px] text-[#8696A0] mb-1">
                    <span className="font-bold text-[#00A884]">Hop {h.hop}</span>
                    <span className="text-emerald-400 font-mono">{h.latency}</span>
                  </div>
                  <div className="text-xs font-bold text-white truncate">{h.title}</div>
                  <div className="text-[11px] text-[#8696A0] flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3 text-[#00A884]" /> {h.location}
                  </div>
                  <div className="text-[10px] font-mono text-emerald-400 mt-2 bg-[#202C33] px-2 py-0.5 rounded truncate">
                    {h.ip}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-[#2A3942]/60 flex flex-col sm:flex-row justify-between items-center text-xs text-[#8696A0] gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00A884]" />
                <span>Masked Public IPv4: <strong className="text-white font-mono">{currentIp}</strong></span>
              </div>
              <span className="text-[11px] text-emerald-400">Total Circuit Latency: 125ms</span>
            </div>
          </div>

          {/* Granular Anti-Tracking Controls */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#8696A0] uppercase tracking-wider">
              Shield Protection Configurations
            </h4>

            {/* EXIF Scrubber */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-[#202C33] border border-[#2A3942]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Media EXIF & GPS Metadata Scrubber</div>
                  <div className="text-xs text-[#8696A0]">
                    Strips GPS coordinates, camera serial numbers, and timestamps prior to client encryption
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.metadataScrubber}
                onChange={() => toggleSetting('metadataScrubber')}
                className="w-5 h-5 accent-[#00A884] cursor-pointer"
              />
            </div>

            {/* Anti-Screenshot Alerts */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-[#202C33] border border-[#2A3942]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
                  <EyeOff className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Telegram-Grade Anti-Screenshot Protection</div>
                  <div className="text-xs text-[#8696A0]">
                    Embeds invisible user cryptographic watermarks and alerts secret chats on capture attempts
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.antiScreenshotNotice}
                onChange={() => toggleSetting('antiScreenshotNotice')}
                className="w-5 h-5 accent-[#00A884] cursor-pointer"
              />
            </div>

            {/* Packet Padding */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-[#202C33] border border-[#2A3942]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Constant-Rate Traffic Padding (Mixnet)</div>
                  <div className="text-xs text-[#8696A0]">
                    Normalizes packet sizes to thwart deep packet inspection (DPI) and message length correlation
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.torRelayEnabled}
                onChange={() => toggleSetting('torRelayEnabled')}
                className="w-5 h-5 accent-[#00A884] cursor-pointer"
              />
            </div>

            {/* Forward Protection */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-[#202C33] border border-[#2A3942]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Strict Forward & Copy Restrictions</div>
                  <div className="text-xs text-[#8696A0]">
                    Disables clipboard copying and cross-chat forwarding on sensitive messages
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.forwardProtection}
                onChange={() => toggleSetting('forwardProtection')}
                className="w-5 h-5 accent-[#00A884] cursor-pointer"
              />
            </div>
          </div>

          {/* ============================================================== */}
          {/* E2E READ RECEIPTS & CHAT-SPECIFIC SIGNALING PRIVACY */}
          {/* ============================================================== */}
          <div className="bg-[#202C33] p-5 rounded-2xl border border-[#2A3942] space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#00A884]/20 text-[#00A884]">
                  <CheckCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">E2E Cryptographic Read Receipts (Signaling Privacy)</h4>
                    <span className="text-[10px] font-mono uppercase bg-[#111B21] text-[#00A884] border border-[#00A884]/30 px-2 py-0.5 rounded-full font-semibold">
                      MAC Ack
                    </span>
                  </div>
                  <p className="text-xs text-[#8696A0] mt-0.5">
                    When enabled, opening a chat dispatches a signed <code className="text-emerald-400 font-mono text-[11px]">read-ack</code> message digest to notify the sender without compromising ciphertext confidentiality.
                  </p>
                </div>
              </div>

              {/* Global Read Receipts Switch */}
              <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                <input
                  type="checkbox"
                  checked={settings.readReceipts}
                  onChange={() => toggleSetting('readReceipts')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#111B21] border border-[#2A3942] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00A884]"></div>
              </label>
            </div>

            {/* Chat-Specific Read Receipt Exceptions */}
            <div className="pt-3 border-t border-[#2A3942]/60">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div>
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-[#00A884]" /> Per-Chat Read Receipt Overrides
                  </span>
                  <p className="text-[11px] text-[#8696A0]">
                    Selectively disable read acknowledgments for specific sensitive contacts or confidential circles.
                  </p>
                </div>

                {chats.length > 3 && (
                  <div className="relative w-full sm:w-48">
                    <Search className="w-3.5 h-3.5 text-[#8696A0] absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={chatSearchFilter}
                      onChange={(e) => setChatSearchFilter(e.target.value)}
                      placeholder="Filter chats..."
                      className="w-full bg-[#111B21] text-xs text-[#E9EDEF] placeholder-[#8696A0] pl-8 pr-2.5 py-1.5 rounded-lg border border-white/5 focus:border-[#00A884] focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {!settings.readReceipts ? (
                <div className="p-3 bg-[#111B21]/60 rounded-xl border border-dashed border-[#2A3942] text-center text-xs text-[#8696A0]">
                  Global read receipts are currently turned <strong>OFF</strong>. No read receipts or cryptographic signaling MACs are dispatched across any chats.
                </div>
              ) : chats.length === 0 ? (
                <div className="p-3 bg-[#111B21] rounded-xl text-center text-xs text-[#8696A0]">
                  No active chats loaded to configure.
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {filteredChats.map((c) => {
                    const isDisabledForChat = disabledChatsSet.has(c.id) || !!c.disableReadReceipts;
                    const isActive = c.id === activeChatId;

                    return (
                      <div
                        key={c.id}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                          isDisabledForChat
                            ? 'bg-[#182229] border-rose-500/30'
                            : 'bg-[#111B21] border-white/5 hover:border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={c.avatar}
                            alt={c.name}
                            className="w-8 h-8 rounded-full object-cover shrink-0 border border-white/10"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-white truncate">{c.name}</span>
                              {isActive && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#00A884]/20 text-[#00A884] font-medium shrink-0">
                                  Active Chat
                                </span>
                              )}
                              {c.isSecret && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-medium shrink-0">
                                  Secret
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-[#8696A0] truncate">
                              {isDisabledForChat ? (
                                <span className="text-rose-400 font-medium">
                                  ✕ Read receipts disabled • Silent recipient mode
                                </span>
                              ) : (
                                <span className="text-emerald-400">
                                  ✓ Read receipts enabled (E2E ACK active)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Toggle button per chat */}
                        <button
                          type="button"
                          onClick={() => handleToggleChatReadReceipts(c.id)}
                          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 ml-2 ${
                            isDisabledForChat
                              ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40'
                              : 'bg-[#202C33] text-[#00A884] hover:bg-[#2A3942] border border-[#00A884]/30'
                          }`}
                          title={
                            isDisabledForChat
                              ? 'Click to enable read receipts for this chat'
                              : 'Click to disable read receipts for this chat'
                          }
                        >
                          {isDisabledForChat ? 'Disabled' : 'Enabled'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-3 flex items-start gap-1.5 text-[11px] text-[#8696A0]">
                <Info className="w-3.5 h-3.5 text-[#00A884] shrink-0 mt-0.5" />
                <span>
                  Disabling read receipts stops dispatching the peer read acknowledgment digest (<code className="text-emerald-400 font-mono">readAckSignature</code>), keeping incoming messages in <span className="text-slate-300">Delivered</span> status.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
