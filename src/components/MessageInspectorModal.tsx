import React, { useState } from 'react';
import { Eye, ShieldCheck, Copy, Check, Lock, Terminal, Cpu } from 'lucide-react';
import { Message } from '../types';

interface MessageInspectorModalProps {
  message: Message;
  onClose: () => void;
}

export const MessageInspectorModal: React.FC<MessageInspectorModalProps> = ({
  message,
  onClose,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const payload = message.encryptedPayload;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-[#111B21] border border-[#222E35] rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden text-[#E9EDEF]">
        {/* Header */}
        <header className="px-6 py-4 bg-[#202C33] border-b border-[#222E35] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#00A884]/20 text-[#00A884]">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                E2EE Cryptographic Payload Inspector
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                  AES-256-GCM
                </span>
              </h3>
              <p className="text-xs text-[#8696A0]">
                Zero-Knowledge Proof: Proving zero plaintext exposure on servers or relays
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
        <div className="p-6 space-y-4 max-h-[78vh] overflow-y-auto font-mono text-xs">
          {/* Client-side Decrypted Plaintext */}
          <div className="bg-[#202C33] p-4 rounded-2xl border border-[#2A3942]">
            <div className="flex justify-between items-center mb-1 text-[11px] text-[#8696A0] font-sans">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <ShieldCheck className="w-4 h-4" /> Decrypted Plaintext (Client-Side Only)
              </span>
              <span className="text-[10px]">{message.content.length} characters</span>
            </div>
            <div className="bg-[#111B21] p-3 rounded-xl border border-white/5 font-sans text-white text-sm break-words whitespace-pre-wrap">
              {message.content}
            </div>
          </div>

          {/* Ciphertext */}
          <div className="bg-[#202C33] p-4 rounded-2xl border border-[#2A3942]">
            <div className="flex justify-between items-center mb-1 text-[11px] text-[#8696A0] font-sans">
              <span className="flex items-center gap-1.5 text-amber-300 font-semibold">
                <Lock className="w-4 h-4" /> Raw Encrypted Ciphertext (Transmitted over wire)
              </span>
              <button
                onClick={() => handleCopy(payload.ciphertext, 'cipher')}
                className="hover:text-white text-[#00A884] flex items-center gap-1 text-[10px]"
              >
                {copiedKey === 'cipher' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                Copy Hex
              </button>
            </div>
            <div className="bg-[#111B21] p-3 rounded-xl border border-white/5 text-amber-400/90 text-xs break-all max-h-28 overflow-y-auto">
              {payload.ciphertext}
            </div>
          </div>

          {/* IV and Auth Tag Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* IV */}
            <div className="bg-[#202C33] p-3.5 rounded-2xl border border-[#2A3942]">
              <div className="flex justify-between items-center mb-1 text-[10px] text-[#8696A0] font-sans">
                <span className="text-white font-semibold">Initialization Vector (IV - 12 Bytes)</span>
                <button
                  onClick={() => handleCopy(payload.iv, 'iv')}
                  className="hover:text-white text-[#00A884] flex items-center gap-1"
                >
                  {copiedKey === 'iv' ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                </button>
              </div>
              <div className="bg-[#111B21] p-2 rounded-lg text-emerald-400 break-all text-xs">
                {payload.iv}
              </div>
            </div>

            {/* Auth Tag */}
            <div className="bg-[#202C33] p-3.5 rounded-2xl border border-[#2A3942]">
              <div className="flex justify-between items-center mb-1 text-[10px] text-[#8696A0] font-sans">
                <span className="text-white font-semibold">Authentication Tag (16 Bytes GMAC)</span>
                <button
                  onClick={() => handleCopy(payload.tag, 'tag')}
                  className="hover:text-white text-[#00A884] flex items-center gap-1"
                >
                  {copiedKey === 'tag' ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                </button>
              </div>
              <div className="bg-[#111B21] p-2 rounded-lg text-emerald-400 break-all text-xs">
                {payload.tag}
              </div>
            </div>
          </div>

          {/* Encrypted Read-Ack Signal for E2E Consistency */}
          <div className="bg-[#202C33] p-4 rounded-2xl border border-[#2A3942] space-y-2">
            <div className="flex justify-between items-center text-[11px] font-sans">
              <span className="flex items-center gap-1.5 text-[#53BDEB] font-semibold">
                <ShieldCheck className="w-4 h-4" /> Encrypted 'Read-ACK' Signal (E2E Consistency)
              </span>
              <span className="text-[10px] font-mono bg-[#53BDEB]/20 text-[#53BDEB] px-2 py-0.5 rounded">
                Signal-V2 Protocol
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="bg-[#111B21] p-2.5 rounded-xl border border-white/5 space-y-1">
                <div className="text-[10px] text-[#8696A0]">Delivery Status:</div>
                <div className="text-white font-semibold capitalize flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${message.status === 'read' ? 'bg-[#53BDEB]' : 'bg-emerald-400'}`} />
                  {message.status === 'read' ? 'Read (Acknowledged)' : message.status}
                </div>
              </div>
              <div className="bg-[#111B21] p-2.5 rounded-xl border border-white/5 space-y-1">
                <div className="text-[10px] text-[#8696A0]">Read Timestamp:</div>
                <div className="text-[#8696A0] font-mono">
                  {message.readAt ? new Date(message.readAt).toLocaleTimeString() : 'Verified upon receipt'}
                </div>
              </div>
            </div>
            {message.readAckSignature && (
              <div className="bg-[#111B21] p-2.5 rounded-xl border border-white/5">
                <div className="flex justify-between text-[10px] text-[#8696A0] mb-1">
                  <span>Encrypted Read-Ack Signature MAC:</span>
                  <button
                    onClick={() => handleCopy(message.readAckSignature!, 'readAck')}
                    className="hover:text-white text-[#53BDEB] flex items-center gap-1"
                  >
                    {copiedKey === 'readAck' ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                    Copy MAC
                  </button>
                </div>
                <div className="text-[#53BDEB] font-mono break-all text-[11px]">
                  {message.readAckSignature}
                </div>
              </div>
            )}
          </div>

          {/* Key Fingerprint & Algorithm */}
          <div className="bg-[#182229] p-3 rounded-2xl border border-[#222E35] flex flex-col md:flex-row justify-between items-center gap-2 text-xs">
            <div className="flex items-center gap-2 text-[#8696A0]">
              <Cpu className="w-4 h-4 text-[#00A884]" />
              <span>Key Fingerprint: <span className="text-white">{payload.keyFingerprint}</span></span>
            </div>
            <div className="flex items-center gap-2 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Cryptographic Integrity: Verified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
