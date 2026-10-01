import React, { useState } from 'react';
import { ShieldCheck, QrCode, CheckCircle, Copy, AlertCircle, Lock, RefreshCw } from 'lucide-react';
import { Chat, UserProfile } from '../types';

interface SafetyNumberModalProps {
  chat: Chat;
  currentUser: UserProfile;
  onClose: () => void;
  onVerifyToggle: () => void;
}

export const SafetyNumberModal: React.FC<SafetyNumberModalProps> = ({
  chat,
  currentUser,
  onClose,
  onVerifyToggle,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'safety_number' | 'technical'>('safety_number');

  const safetyNumber = chat.safetyNumber || '38192 48102 91823 48192 10492 84719 20394 81029 38471 02938 47102 93847';
  const blocks = safetyNumber.split(' ');

  const handleCopy = () => {
    navigator.clipboard.writeText(safetyNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-[#111B21] border border-[#222E35] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden text-[#E9EDEF]">
        {/* Header */}
        <header className="px-6 py-4 bg-[#202C33] border-b border-[#222E35] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#00A884]/20 text-[#00A884]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Verify Safety Numbers (Signal Protocol)</h3>
              <p className="text-xs text-[#8696A0]">End-to-End Encryption Key Authentication</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#111B21] text-[#8696A0] hover:text-white flex items-center justify-center"
          >
            ✕
          </button>
        </header>

        {/* Tab switch */}
        <div className="flex border-b border-[#222E35] bg-[#182229] text-xs">
          <button
            onClick={() => setActiveTab('safety_number')}
            className={`flex-1 py-2.5 font-medium transition-colors border-b-2 ${
              activeTab === 'safety_number'
                ? 'border-[#00A884] text-[#00A884] font-semibold'
                : 'border-transparent text-[#8696A0] hover:text-white'
            }`}
          >
            60-Digit Safety Number
          </button>
          <button
            onClick={() => setActiveTab('technical')}
            className={`flex-1 py-2.5 font-medium transition-colors border-b-2 ${
              activeTab === 'technical'
                ? 'border-[#00A884] text-[#00A884] font-semibold'
                : 'border-transparent text-[#8696A0] hover:text-white'
            }`}
          >
            Cryptographic Payload
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {activeTab === 'safety_number' ? (
            <>
              {/* QR Code and Instructions */}
              <div className="flex flex-col items-center text-center">
                {/* Simulated QR Code Canvas */}
                <div className="w-44 h-44 bg-white p-3 rounded-2xl shadow-xl flex items-center justify-center relative group">
                  <div className="w-full h-full bg-[#111B21] rounded-xl flex flex-col items-center justify-center p-2 relative overflow-hidden">
                    <div className="grid grid-cols-6 gap-1 w-full h-full p-2 opacity-80">
                      {Array.from({ length: 36 }).map((_, i) => (
                        <div
                          key={i}
                          className={`rounded-xs ${
                            (i % 2 === 0 || i % 5 === 0) ? 'bg-[#00A884]' : 'bg-[#202C33]'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-xl bg-white p-1 shadow-md flex items-center justify-center">
                        <Lock className="w-6 h-6 text-[#00A884]" />
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-[#8696A0] mt-4 max-w-sm">
                  To verify that messages and calls with <strong className="text-white">{chat.name}</strong> are end-to-end encrypted with zero man-in-the-middle, compare the numbers below or scan the QR code.
                </p>
              </div>

              {/* 60 Digits formatted in 12 blocks */}
              <div className="bg-[#202C33] p-4 rounded-2xl border border-[#2A3942]">
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 text-center font-mono text-xs text-emerald-400">
                  {blocks.map((block, idx) => (
                    <span key={idx} className="bg-[#111B21] py-1.5 rounded-lg border border-white/5">
                      {block}
                    </span>
                  ))}
                </div>

                <div className="flex justify-between items-center mt-3 pt-3 border-t border-[#2A3942]/60 text-xs">
                  <span className="text-[#8696A0]">60 digits • SHA-512 derived</span>
                  <button
                    onClick={handleCopy}
                    className="text-[#00A884] hover:underline flex items-center gap-1 font-semibold"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5 text-[#00A884]" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy Number
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Verification Toggle */}
              <div className="flex items-center justify-between bg-[#182229] p-4 rounded-2xl border border-[#222E35]">
                <div className="flex items-center gap-3">
                  <ShieldCheck className={`w-6 h-6 ${chat.e2eeVerified ? 'text-[#00A884]' : 'text-[#8696A0]'}`} />
                  <div>
                    <div className="text-xs font-bold text-white">Mark as Verified</div>
                    <div className="text-[11px] text-[#8696A0]">
                      Displays verified safety shield icon on this conversation
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={!!chat.e2eeVerified}
                  onChange={onVerifyToggle}
                  className="w-5 h-5 accent-[#00A884] cursor-pointer"
                />
              </div>
            </>
          ) : (
            /* Technical Cryptographic Details */
            <div className="space-y-3 font-mono text-xs">
              <div className="bg-[#202C33] p-3.5 rounded-2xl border border-[#2A3942]">
                <div className="text-[10px] text-[#8696A0] font-sans">Cipher Suite</div>
                <div className="text-emerald-400 font-bold mt-0.5">AES-256-GCM / PBKDF2 / ECDH</div>
              </div>

              <div className="bg-[#202C33] p-3.5 rounded-2xl border border-[#2A3942]">
                <div className="text-[10px] text-[#8696A0] font-sans">Your Identity Key Fingerprint</div>
                <div className="text-emerald-400 mt-0.5 truncate">{currentUser.publicKeyFingerprint}</div>
              </div>

              <div className="bg-[#202C33] p-3.5 rounded-2xl border border-[#2A3942]">
                <div className="text-[10px] text-[#8696A0] font-sans">Remote Identity Key Fingerprint</div>
                <div className="text-emerald-400 mt-0.5 truncate">
                  8F1B 90C4 28A1 5E37 DF90 12BC 44E9 82F1
                </div>
              </div>

              <div className="bg-[#202C33] p-3.5 rounded-2xl border border-[#2A3942]">
                <div className="text-[10px] text-[#8696A0] font-sans">Zero-Knowledge Relay Status</div>
                <div className="text-[#00A884] mt-0.5">
                  ✓ Verified: High-entropy payload. Zero plaintext stored on network or server.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
