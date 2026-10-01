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
  Globe2
} from 'lucide-react';
import { PrivacySettings } from '../types';

interface PrivacyShieldModalProps {
  settings: PrivacySettings;
  onUpdateSettings: (settings: PrivacySettings) => void;
  onClose: () => void;
}

export const PrivacyShieldModal: React.FC<PrivacyShieldModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  const [isRotating, setIsRotating] = useState(false);
  const [currentIp, setCurrentIp] = useState('91.219.236.44');

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
        </div>
      </div>
    </div>
  );
};
