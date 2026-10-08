import React, { useState, useRef } from 'react';
import { 
  Music, 
  Sparkles, 
  Play, 
  Pause, 
  Volume2, 
  Download, 
  Share2, 
  Loader2, 
  X, 
  Disc, 
  Sliders, 
  Radio, 
  CheckCircle2, 
  Headphones
} from 'lucide-react';
import { UserProfile } from '../types';

interface LyriaMusicModalProps {
  userProfile: UserProfile;
  onClose: () => void;
  onShareToChat?: (trackName: string, audioDataUrl: string) => void;
}

export const LyriaMusicModal: React.FC<LyriaMusicModalProps> = ({
  userProfile,
  onClose,
  onShareToChat,
}) => {
  const [modelType, setModelType] = useState<'clip' | 'pro'>('clip');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [trackTitle, setTrackTitle] = useState<string | null>(null);
  const [trackLyrics, setTrackLyrics] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sharedToast, setSharedToast] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const presets = [
    {
      title: 'Doctoral Deep Flow (432Hz Drone)',
      prompt: 'Ambient 432Hz binaural study beat with deep analog drone, gentle Rhodes keyboard, and atmospheric noise for uninterrupted doctoral thesis writing.',
      type: 'clip' as const,
    },
    {
      title: 'LaTeX Math Proofing (Baroque Ambient)',
      prompt: 'Neoclassical ambient violin and soft acoustic piano chamber music with steady rhythmic tempo for rigorous mathematical derivations.',
      type: 'clip' as const,
    },
    {
      title: 'Algorithms & Coding Sprint (Cyberpunk Lo-Fi)',
      prompt: 'Lo-fi chillhop with crisp vinyl crackle, 85 BPM syncopated drum breaks, and warm sub-bass for software systems engineering.',
      type: 'pro' as const,
    },
    {
      title: 'Olympiad Exam Focus (Alpha Waves)',
      prompt: 'Hypnotic repetitive ambient soundscape with subtle marimba textures and 10Hz binaural beats for intense high school competition focus.',
      type: 'clip' as const,
    },
  ];

  const handleGenerate = async (customPrompt?: string, chosenType?: 'clip' | 'pro') => {
    const textToGen = customPrompt || prompt || 'Ambient binaural concentration soundscape for academic research';
    const typeToUse = chosenType || modelType;

    setIsGenerating(true);
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }

    try {
      const res = await fetch('/api/ai/generate-music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToGen,
          type: typeToUse,
          studentTier: userProfile.studentTier,
        }),
      });

      const data = await res.json();
      if (data.audioBase64) {
        const audioSrc = `data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`;
        setAudioUrl(audioSrc);
        setTrackTitle(data.title || `Lyria Track: ${textToGen.slice(0, 35)}`);
        setTrackLyrics(data.lyrics || 'Generated with Lyria 3');
      }
    } catch (err) {
      console.error('Music generation failed', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const handleShare = () => {
    if (audioUrl && trackTitle && onShareToChat) {
      onShareToChat(trackTitle, audioUrl);
      setSharedToast(true);
      setTimeout(() => setSharedToast(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 md:p-6 animate-in fade-in">
      <div className="bg-[#111B21] border border-[#222E35] rounded-3xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden text-[#E9EDEF]">
        
        {/* Header */}
        <div className="bg-[#202C33] px-6 py-4 border-b border-[#2A3942] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#9C27B0] to-[#E91E63] flex items-center justify-center text-white shadow-lg">
              <Music className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Lyria 3 Music &amp; Study Beats Studio</h2>
                <span className="text-[10px] bg-[#9C27B0]/20 text-[#E1BEE7] border border-[#9C27B0]/30 px-2 py-0.5 rounded-full font-mono uppercase">
                  Lyria-3
                </span>
              </div>
              <p className="text-xs text-[#8696A0]">
                AI-synthesized concentration audio for {userProfile.studentTier} research flow
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-[#8696A0] hover:text-white rounded-full hover:bg-[#374248] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          
          {/* Model Type Selector */}
          <div className="flex items-center gap-3 bg-[#0B141A] p-1.5 rounded-2xl border border-[#222E35]">
            <button
              onClick={() => setModelType('clip')}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                modelType === 'clip' 
                  ? 'bg-[#00A884] text-white shadow-md' 
                  : 'text-[#8696A0] hover:text-[#E9EDEF]'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              Lyria-3-Clip (Short Clip, up to 30s)
            </button>
            <button
              onClick={() => setModelType('pro')}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                modelType === 'pro' 
                  ? 'bg-gradient-to-r from-[#9C27B0] to-[#E91E63] text-white shadow-md' 
                  : 'text-[#8696A0] hover:text-[#E9EDEF]'
              }`}
            >
              <Disc className="w-3.5 h-3.5" />
              Lyria-3-Pro (Full-Length Track)
            </button>
          </div>

          {/* Quick Presets */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#8696A0] flex items-center gap-1.5">
              <Headphones className="w-3.5 h-3.5 text-[#00A884]" />
              Academic Flow Soundscape Presets
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPrompt(p.prompt);
                    setModelType(p.type);
                    handleGenerate(p.prompt, p.type);
                  }}
                  disabled={isGenerating}
                  className="text-left bg-[#1F2C34]/60 hover:bg-[#1F2C34] border border-[#2A3942] hover:border-[#00A884]/40 p-3 rounded-2xl transition-all group"
                >
                  <div className="text-xs font-bold text-white group-hover:text-[#00A884] flex items-center justify-between">
                    <span>{p.title}</span>
                    <span className="text-[10px] text-[#8696A0] font-mono">
                      {p.type === 'clip' ? '30s' : 'Full'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8696A0] mt-1 line-clamp-2">
                    {p.prompt}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Prompt Box */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#8696A0] flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-[#53BDEB]" />
              Custom Soundscape Prompt
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. 40Hz gamma waves with subtle acoustic cello for quantum mechanics study..."
                className="flex-1 bg-[#0B141A] border border-[#2A3942] rounded-2xl px-4 py-2.5 text-xs text-white placeholder-[#8696A0] focus:outline-none focus:border-[#00A884]"
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              />
              <button
                onClick={() => handleGenerate()}
                disabled={isGenerating}
                className="bg-[#00A884] hover:bg-[#008F6F] disabled:opacity-50 text-white px-5 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg transition-all"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Generated Audio Player Card */}
          {audioUrl && (
            <div className="bg-gradient-to-b from-[#1F2C34] to-[#111B21] border border-[#2A3942] rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={togglePlay}
                    className="w-12 h-12 rounded-full bg-[#00A884] hover:bg-[#008F6F] flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105"
                  >
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                  </button>
                  <div>
                    <h4 className="text-sm font-bold text-white">{trackTitle}</h4>
                    <p className="text-xs text-[#00A884] flex items-center gap-1.5 mt-0.5">
                      <Disc className="w-3.5 h-3.5 animate-spin" />
                      {modelType === 'clip' ? 'Lyria-3 Clip (30s)' : 'Lyria-3 Pro Track'} • Active Study Audio
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={audioUrl}
                    download="securechat-study-focus.wav"
                    className="p-2.5 bg-[#202C33] hover:bg-[#2A3942] rounded-xl text-[#8696A0] hover:text-white transition-colors"
                    title="Download WAV"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  {onShareToChat && (
                    <button
                      onClick={handleShare}
                      className="px-3 py-2 bg-[#00A884]/20 hover:bg-[#00A884]/30 text-[#00A884] border border-[#00A884]/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      Send to Chat
                    </button>
                  )}
                </div>
              </div>

              {/* Waveform graphic visualization */}
              <div className="bg-[#0B141A] rounded-xl p-3 flex items-center justify-center gap-1 h-14 overflow-hidden border border-[#222E35]">
                {Array.from({ length: 36 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-1 rounded-full transition-all duration-300 ${
                      isPlaying ? 'bg-[#00A884]' : 'bg-[#374248]'
                    }`}
                    style={{
                      height: isPlaying ? `${Math.sin(i * 0.4 + Date.now() * 0.005) * 18 + 24}px` : '8px',
                    }}
                  />
                ))}
              </div>

              {trackLyrics && (
                <div className="text-[11px] text-[#8696A0] italic bg-[#0B141A]/50 p-2.5 rounded-xl border border-[#222E35]">
                  &ldquo;{trackLyrics}&rdquo;
                </div>
              )}

              {/* Hidden audio element */}
              <audio
                ref={audioRef}
                src={audioUrl}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />
            </div>
          )}

          {sharedToast && (
            <div className="bg-[#00A884]/20 border border-[#00A884] text-[#00A884] rounded-xl p-2.5 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Study focus audio track encrypted and shared to active conversation!</span>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-[#202C33] px-6 py-3 border-t border-[#2A3942] flex items-center justify-between text-xs text-[#8696A0]">
          <span className="flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-[#00A884]" />
            Continuous study audio loop supported
          </span>
          <button
            onClick={onClose}
            className="text-xs font-bold text-white hover:text-[#00A884] transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
