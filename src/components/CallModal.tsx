import React, { useState, useEffect, useRef } from 'react';
import { 
  PhoneOff, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  ShieldCheck, 
  Share2, 
  Volume2, 
  Lock,
  Globe2,
  Sparkles,
  Radio
} from 'lucide-react';
import { Chat, UserProfile } from '../types';

interface CallModalProps {
  chat: Chat;
  callType: 'audio' | 'video';
  currentUser: UserProfile;
  onEndCall: () => void;
}

export const CallModal: React.FC<CallModalProps> = ({
  chat,
  callType,
  currentUser,
  onEndCall,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType === 'audio');
  const [callDuration, setCallDuration] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected'>('connecting');
  const [isLiveApiActive, setIsLiveApiActive] = useState(chat.id.startsWith('chat_mentor_'));

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const connectTimer = setTimeout(() => {
      setConnectionStatus('connected');
    }, 1200);

    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    // Setup Gemini 3.8 Live WebSocket if AI Mentor
    if (chat.id.startsWith('chat_mentor_')) {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/live`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setIsLiveApiActive(true);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.audio) {
              playPcmAudio(data.audio);
            }
          } catch (e) {
            console.error('Live audio parse err:', e);
          }
        };

        ws.onerror = (e) => {
          console.warn('Live WS notice:', e);
        };
      } catch (err) {
        console.warn('WebSocket init err:', err);
      }
    }

    return () => {
      clearTimeout(connectTimer);
      clearInterval(interval);
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [chat.id]);

  const playPcmAudio = (base64Audio: string) => {
    try {
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioCtx({ sampleRate: 24000 });
      }
      const ctx = audioContextRef.current;
      const binaryString = atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Int16Array(len / 2);
      for (let i = 0; i < len; i += 2) {
        bytes[i / 2] = (binaryString.charCodeAt(i + 1) << 8) | binaryString.charCodeAt(i);
      }
      const float32Data = new Float32Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) {
        float32Data[i] = bytes[i] / 32768.0;
      }
      const audioBuffer = ctx.createBuffer(1, float32Data.length, 24000);
      audioBuffer.copyToChannel(float32Data, 0);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.start();
    } catch (e) {
      console.warn('PCM playback notice:', e);
    }
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0B141A]/95 backdrop-blur-md flex flex-col items-center justify-between p-6 select-none animate-in fade-in">
      {/* Top Encryption & Live API Banner */}
      <div className="w-full max-w-xl bg-[#202C33]/90 border border-[#2A3942] rounded-2xl px-4 py-2.5 flex items-center justify-between text-xs text-[#E9EDEF] shadow-lg">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#00A884]" />
          <span className="font-semibold">E2EE Verified Call (DTLS-SRTP / AES-256)</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-[#00A884]">
          {isLiveApiActive ? (
            <span className="flex items-center gap-1 bg-[#00A884]/20 border border-[#00A884]/30 px-2 py-0.5 rounded-full text-[#00A884] font-mono text-[10px]">
              <Sparkles className="w-3 h-3 animate-spin" />
              gemini-3.8-live (Live API)
            </span>
          ) : (
            <>
              <Globe2 className="w-3.5 h-3.5" />
              <span>Relayed via Zurich Onion Node</span>
            </>
          )}
        </div>
      </div>

      {/* Middle Caller Display */}
      <div className="flex flex-col items-center my-auto text-center">
        <div className="relative mb-6">
          <img
            src={chat.avatar}
            alt={chat.name}
            className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover ring-4 ring-[#00A884]/40 shadow-2xl"
          />
          {connectionStatus === 'connected' && (
            <span className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-[#00A884] border-4 border-[#0B141A] flex items-center justify-center">
              <Lock className="w-3 h-3 text-white" />
            </span>
          )}
        </div>

        <h2 className="text-xl md:text-2xl font-bold text-white mb-1">{chat.name}</h2>
        <div className="text-sm text-[#00A884] font-medium mb-3">
          {connectionStatus === 'connecting'
            ? 'Establishing peer-to-peer zero-knowledge relay...'
            : formatDuration(callDuration)}
        </div>

        {/* Safety Number Display */}
        <div className="bg-[#202C33] px-3.5 py-1.5 rounded-full border border-[#2A3942] text-[11px] font-mono text-[#8696A0]">
          Safety Number: {chat.safetyNumber.slice(0, 23)}...
        </div>

        {/* Animated Audio Waveform during call */}
        {connectionStatus === 'connected' && (
          <div className="flex items-center gap-1 mt-6 h-8">
            {[8, 14, 24, 32, 18, 28, 12, 22, 30, 16, 26, 12, 18, 28, 14, 8].map((h, i) => (
              <div
                key={i}
                style={{ height: `${h}px` }}
                className={`w-1.5 rounded-full transition-all duration-300 ${
                  isLiveApiActive ? 'bg-gradient-to-t from-[#00A884] to-[#53BDEB] animate-bounce' : 'bg-[#00A884] animate-pulse'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom Controls Bar */}
      <div className="w-full max-w-md bg-[#202C33] border border-[#2A3942] rounded-3xl p-4 flex items-center justify-around shadow-2xl mb-4">
        {/* Mute button */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            isMuted ? 'bg-rose-600 text-white' : 'bg-[#111B21] text-white hover:bg-[#2A3942]'
          }`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Video button */}
        <button
          onClick={() => setIsVideoOff(!isVideoOff)}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            isVideoOff ? 'bg-[#111B21] text-[#8696A0]' : 'bg-[#00A884] text-[#111B21]'
          }`}
          title={isVideoOff ? 'Turn on Camera' : 'Turn off Camera'}
        >
          {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </button>

        {/* Screen Share simulation */}
        <button
          className="w-12 h-12 rounded-full bg-[#111B21] text-white hover:bg-[#2A3942] flex items-center justify-center transition-all"
          title="Share Screen (Encrypted)"
        >
          <Share2 className="w-5 h-5" />
        </button>

        {/* End Call button */}
        <button
          onClick={onEndCall}
          className="w-14 h-14 rounded-full bg-rose-600 text-white hover:bg-rose-700 flex items-center justify-center transition-all shadow-lg hover:scale-105 active:scale-95"
          title="End Encrypted Call"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

