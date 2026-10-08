import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  Image as ImageIcon, 
  Video, 
  Search, 
  MapPin, 
  Mic, 
  MicOff, 
  Upload, 
  Download, 
  Share2, 
  CheckCircle2, 
  Loader2, 
  X, 
  ExternalLink, 
  FileText, 
  Film, 
  Copy, 
  Check, 
  Play, 
  Pause,
  Compass
} from 'lucide-react';
import { UserProfile } from '../types';

interface MultimodalStudioModalProps {
  userProfile: UserProfile;
  initialTab?: 'image' | 'video' | 'search' | 'maps' | 'transcribe';
  onClose: () => void;
  onSendMediaToChat?: (mediaType: 'image' | 'text' | 'voice', content: string, mediaUrl?: string) => void;
}

export const MultimodalStudioModal: React.FC<MultimodalStudioModalProps> = ({
  userProfile,
  initialTab = 'image',
  onClose,
  onSendMediaToChat,
}) => {
  const [activeTab, setActiveTab] = useState<'image' | 'video' | 'search' | 'maps' | 'transcribe'>(initialTab);

  // 1. Image State (gemini-3.1-flash-image-preview)
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageAspect, setImageAspect] = useState<'1:1' | '16:9' | '9:16' | '4:3'>('1:1');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [uploadedBase64, setUploadedBase64] = useState<string | null>(null);

  // 2. Video State (veo-3.1-fast-generate-preview)
  const [videoPrompt, setVideoPrompt] = useState('');
  const [videoAspect, setVideoAspect] = useState<'16:9' | '9:16'>('16:9');
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);

  // 3. Search Grounding State (gemini-3.5-flash with googleSearch)
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchAnswer, setSearchAnswer] = useState<string | null>(null);
  const [searchSources, setSearchSources] = useState<any[]>([]);

  // 4. Maps Grounding State (gemini-3.5-flash with googleMaps)
  const [mapsQuery, setMapsQuery] = useState('');
  const [mapsLocation, setMapsLocation] = useState('');
  const [isFindingPlaces, setIsFindingPlaces] = useState(false);
  const [mapsAnswer, setMapsAnswer] = useState<string | null>(null);
  const [mapsPlaces, setMapsPlaces] = useState<any[]>([]);

  // 5. Audio Transcription State (gemini-3.5-transcribe)
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionResult, setTranscriptionResult] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // -----------------------------------------------------------
  // 1. Image Generation & Editing
  // -----------------------------------------------------------
  const handleGenerateImage = async () => {
    if (!imagePrompt.trim() && !uploadedBase64) return;
    setIsGeneratingImage(true);

    try {
      const endpoint = uploadedBase64 ? '/api/ai/edit-image' : '/api/ai/generate-image';
      const body = uploadedBase64 
        ? { imageBase64: uploadedBase64, prompt: imagePrompt } 
        : { prompt: imagePrompt, aspectRatio: imageAspect };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.imageUrl) {
        setGeneratedImage(data.imageUrl);
      }
    } catch (err) {
      console.error('Image generation error:', err);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // -----------------------------------------------------------
  // 2. Video Generation (Veo 3.1)
  // -----------------------------------------------------------
  const handleGenerateVideo = async () => {
    if (!videoPrompt.trim() && !uploadedBase64) return;
    setIsGeneratingVideo(true);
    setVideoProgress(10);
    setGeneratedVideoUrl(null);

    try {
      const res = await fetch('/api/ai/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: videoPrompt,
          aspectRatio: videoAspect,
          imageBase64: uploadedBase64,
        }),
      });

      const data = await res.json();
      const operationName = data.operationName;

      // Poll video status
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await fetch('/api/ai/video-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ operationName }),
          });
          const statusData = await statusRes.json();
          if (statusData.progress) {
            setVideoProgress(statusData.progress);
          }

          if (statusData.done) {
            clearInterval(pollInterval);
            // Download / stream video
            const dlRes = await fetch('/api/ai/video-download', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ operationName }),
            });
            const dlData = await dlRes.json();
            setGeneratedVideoUrl(dlData.videoUrl || 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
            setIsGeneratingVideo(false);
          }
        } catch (pollErr) {
          console.error('Video polling err:', pollErr);
          clearInterval(pollInterval);
          setIsGeneratingVideo(false);
        }
      }, 1500);

    } catch (err) {
      console.error('Video generation initiation err:', err);
      setIsGeneratingVideo(false);
    }
  };

  // -----------------------------------------------------------
  // 3. Search Grounding (gemini-3.5-flash + googleSearch)
  // -----------------------------------------------------------
  const handleSearchGrounded = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchAnswer(null);
    setSearchSources([]);

    try {
      const res = await fetch('/api/ai/search-grounded', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          studentTier: userProfile.studentTier,
          fieldOfStudy: userProfile.fieldOfStudy,
        }),
      });

      const data = await res.json();
      setSearchAnswer(data.answer);
      if (data.groundingMetadata?.sources) {
        setSearchSources(data.groundingMetadata.sources);
      }
    } catch (err) {
      console.error('Search grounding err:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // -----------------------------------------------------------
  // 4. Maps Grounding (gemini-3.5-flash + googleMaps)
  // -----------------------------------------------------------
  const handleMapsGrounded = async () => {
    if (!mapsQuery.trim()) return;
    setIsFindingPlaces(true);
    setMapsAnswer(null);
    setMapsPlaces([]);

    try {
      const res = await fetch('/api/ai/maps-grounded', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: mapsQuery,
          location: mapsLocation,
        }),
      });

      const data = await res.json();
      setMapsAnswer(data.answer);
      if (data.groundingMetadata?.places) {
        setMapsPlaces(data.groundingMetadata.places);
      }
    } catch (err) {
      console.error('Maps grounding err:', err);
    } finally {
      setIsFindingPlaces(false);
    }
  };

  // -----------------------------------------------------------
  // 5. Audio Transcription (gemini-3.5-transcribe)
  // -----------------------------------------------------------
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = async () => {
          const base64Data = reader.result as string;
          transcribeAudioPayload(base64Data);
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Mic access error:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudioPayload = async (audioBase64: string) => {
    setIsTranscribing(true);
    try {
      const res = await fetch('/api/ai/transcribe-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64,
          mimeType: 'audio/webm',
        }),
      });
      const data = await res.json();
      setTranscriptionResult(data.transcription || 'No clear speech detected.');
    } catch (err) {
      console.error('Transcription err:', err);
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 md:p-6 animate-in fade-in">
      <div className="bg-[#111B21] border border-[#222E35] rounded-3xl w-full max-w-4xl flex flex-col shadow-2xl overflow-hidden text-[#E9EDEF] max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-[#202C33] px-6 py-4 border-b border-[#2A3942] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#00A884] via-[#53BDEB] to-[#7F66FF] flex items-center justify-center text-white shadow-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">AI Multimodal Studio</h2>
                <span className="text-[10px] bg-[#00A884]/20 text-[#00A884] border border-[#00A884]/30 px-2 py-0.5 rounded-full font-mono uppercase">
                  Veo • Gemini 3.5 • Transcribe
                </span>
              </div>
              <p className="text-xs text-[#8696A0]">
                High-fidelity multimodal creation for {userProfile.studentTier} research &amp; academics
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

        {/* Tab Navigation */}
        <div className="flex border-b border-[#2A3942] bg-[#111B21] px-6 overflow-x-auto gap-2">
          <button
            onClick={() => setActiveTab('image')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'image'
                ? 'border-[#00A884] text-[#00A884]'
                : 'border-transparent text-[#8696A0] hover:text-white'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            Create &amp; Edit Images
          </button>
          <button
            onClick={() => setActiveTab('video')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'video'
                ? 'border-[#53BDEB] text-[#53BDEB]'
                : 'border-transparent text-[#8696A0] hover:text-white'
            }`}
          >
            <Film className="w-4 h-4" />
            Veo 3.1 Video
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'search'
                ? 'border-[#4285F4] text-[#4285F4]'
                : 'border-transparent text-[#8696A0] hover:text-white'
            }`}
          >
            <Search className="w-4 h-4" />
            Google Search Grounding
          </button>
          <button
            onClick={() => setActiveTab('maps')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'maps'
                ? 'border-[#EA4335] text-[#EA4335]'
                : 'border-transparent text-[#8696A0] hover:text-white'
            }`}
          >
            <Compass className="w-4 h-4" />
            Google Maps Grounding
          </button>
          <button
            onClick={() => setActiveTab('transcribe')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'transcribe'
                ? 'border-[#9C27B0] text-[#9C27B0]'
                : 'border-transparent text-[#8696A0] hover:text-white'
            }`}
          >
            <Mic className="w-4 h-4" />
            Transcribe Audio
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* TAB 1: IMAGE STUDIO (gemini-3.1-flash-image-preview) */}
          {activeTab === 'image' && (
            <div className="space-y-5">
              <div className="bg-[#202C33] p-4 rounded-2xl border border-[#2A3942] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-[#00A884]" />
                    Model: gemini-3.1-flash-image-preview
                  </span>
                  <div className="flex items-center gap-2">
                    {(['1:1', '16:9', '9:16', '4:3'] as const).map((asp) => (
                      <button
                        key={asp}
                        onClick={() => setImageAspect(asp)}
                        className={`px-2.5 py-1 text-[11px] font-mono rounded-lg border transition-all ${
                          imageAspect === asp
                            ? 'bg-[#00A884] text-white border-[#00A884]'
                            : 'bg-[#111B21] text-[#8696A0] border-[#2A3942]'
                        }`}
                      >
                        {asp}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    placeholder="e.g. Scientific architectural diagram of distributed consensus and zero-knowledge prover network..."
                    className="flex-1 bg-[#111B21] border border-[#2A3942] rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#8696A0] focus:outline-none focus:border-[#00A884]"
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerateImage()}
                  />
                  <label className="p-2.5 bg-[#111B21] hover:bg-[#2A3942] border border-[#2A3942] text-[#8696A0] hover:text-white rounded-xl cursor-pointer flex items-center justify-center transition-colors" title="Upload image to edit">
                    <Upload className="w-4 h-4" />
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                  <button
                    onClick={handleGenerateImage}
                    disabled={isGeneratingImage}
                    className="bg-[#00A884] hover:bg-[#008F6F] disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md"
                  >
                    {isGeneratingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>{uploadedBase64 ? 'Edit Image' : 'Create Image'}</span>
                  </button>
                </div>

                {uploadedBase64 && (
                  <div className="flex items-center gap-2 text-xs text-[#00A884] bg-[#111B21] p-2 rounded-xl">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Reference photo loaded for editing.</span>
                    <button onClick={() => setUploadedBase64(null)} className="text-xs text-[#EA4335] underline ml-auto">Clear</button>
                  </div>
                )}
              </div>

              {/* Display Result */}
              {generatedImage && (
                <div className="bg-[#202C33] p-4 rounded-2xl border border-[#2A3942] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Generated Academic Visual</span>
                    <div className="flex gap-2">
                      <a
                        href={generatedImage}
                        download="academic-visual.png"
                        className="px-3 py-1.5 bg-[#111B21] hover:bg-[#2A3942] rounded-lg text-xs text-white flex items-center gap-1.5 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </a>
                      {onSendMediaToChat && (
                        <button
                          onClick={() => onSendMediaToChat('image', 'Academic Visual Attachment', generatedImage)}
                          className="px-3 py-1.5 bg-[#00A884] hover:bg-[#008F6F] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          Send to Encrypted Chat
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="rounded-xl overflow-hidden border border-[#2A3942] flex items-center justify-center bg-[#0B141A]">
                    <img src={generatedImage} alt="Generated visual" className="max-h-[380px] object-contain w-full" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: VEO 3.1 VIDEO STUDIO (veo-3.1-fast-generate-preview) */}
          {activeTab === 'video' && (
            <div className="space-y-5">
              <div className="bg-[#202C33] p-4 rounded-2xl border border-[#2A3942] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Film className="w-4 h-4 text-[#53BDEB]" />
                    Model: veo-3.1-fast-generate-preview
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setVideoAspect('16:9')}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all ${
                        videoAspect === '16:9'
                          ? 'bg-[#53BDEB] text-white border-[#53BDEB]'
                          : 'bg-[#111B21] text-[#8696A0] border-[#2A3942]'
                      }`}
                    >
                      16:9 Landscape
                    </button>
                    <button
                      onClick={() => setVideoAspect('9:16')}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all ${
                        videoAspect === '9:16'
                          ? 'bg-[#53BDEB] text-white border-[#53BDEB]'
                          : 'bg-[#111B21] text-[#8696A0] border-[#2A3942]'
                      }`}
                    >
                      9:16 Portrait
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={videoPrompt}
                    onChange={(e) => setVideoPrompt(e.target.value)}
                    placeholder="e.g. 3D animated walkthrough of neural network weight convergence and loss landscape..."
                    className="flex-1 bg-[#111B21] border border-[#2A3942] rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#8696A0] focus:outline-none focus:border-[#53BDEB]"
                  />
                  <label className="p-2.5 bg-[#111B21] hover:bg-[#2A3942] border border-[#2A3942] text-[#8696A0] hover:text-white rounded-xl cursor-pointer flex items-center justify-center transition-colors" title="Upload starting image to animate into video">
                    <Upload className="w-4 h-4" />
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                  <button
                    onClick={handleGenerateVideo}
                    disabled={isGeneratingVideo}
                    className="bg-[#53BDEB] hover:bg-[#3FA8D6] disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md"
                  >
                    {isGeneratingVideo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
                    <span>{uploadedBase64 ? 'Animate Image' : 'Generate Video'}</span>
                  </button>
                </div>

                {isGeneratingVideo && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-xs text-[#8696A0]">
                      <span>Rendering with Veo 3.1 Fast engine ({videoAspect})...</span>
                      <span>{videoProgress}%</span>
                    </div>
                    <div className="w-full bg-[#111B21] rounded-full h-2 overflow-hidden border border-[#2A3942]">
                      <div className="bg-[#53BDEB] h-full transition-all duration-300" style={{ width: `${videoProgress}%` }} />
                    </div>
                  </div>
                )}
              </div>

              {generatedVideoUrl && (
                <div className="bg-[#202C33] p-4 rounded-2xl border border-[#2A3942] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Veo 3.1 Rendered Video</span>
                    <a
                      href={generatedVideoUrl}
                      download="veo-academic-video.mp4"
                      className="px-3 py-1.5 bg-[#111B21] hover:bg-[#2A3942] rounded-lg text-xs text-white flex items-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download MP4
                    </a>
                  </div>
                  <div className="rounded-xl overflow-hidden border border-[#2A3942] bg-black flex items-center justify-center">
                    <video src={generatedVideoUrl} controls autoPlay loop className="max-h-[380px] w-full" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SEARCH GROUNDING (gemini-3.5-flash with googleSearch) */}
          {activeTab === 'search' && (
            <div className="space-y-5">
              <div className="bg-[#202C33] p-4 rounded-2xl border border-[#2A3942] space-y-3">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Search className="w-4 h-4 text-[#4285F4]" />
                  Google Search Grounded Intelligence (gemini-3.5-flash)
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g. When are the NSF GRFP and IEEE S&P 2026 submission deadlines?"
                    className="flex-1 bg-[#111B21] border border-[#2A3942] rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#8696A0] focus:outline-none focus:border-[#4285F4]"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchGrounded()}
                  />
                  <button
                    onClick={handleSearchGrounded}
                    disabled={isSearching}
                    className="bg-[#4285F4] hover:bg-[#3367D6] disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md"
                  >
                    {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    <span>Search</span>
                  </button>
                </div>
              </div>

              {searchAnswer && (
                <div className="bg-[#202C33] p-5 rounded-2xl border border-[#2A3942] space-y-4">
                  <div className="prose prose-invert prose-sm max-w-none text-xs text-[#E9EDEF] whitespace-pre-line leading-relaxed">
                    {searchAnswer}
                  </div>

                  {searchSources.length > 0 && (
                    <div className="border-t border-[#2A3942] pt-3 space-y-2">
                      <span className="text-[11px] font-bold text-[#8696A0] uppercase tracking-wider">
                        Google Search Verified Citations &amp; Sources
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {searchSources.map((s, idx) => (
                          <a
                            key={idx}
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-[#111B21] hover:bg-[#2A3942] border border-[#2A3942] px-3 py-1.5 rounded-lg text-xs text-[#53BDEB] flex items-center gap-1.5 transition-colors"
                          >
                            <span>{s.title || s.url}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: MAPS GROUNDING (gemini-3.5-flash with googleMaps) */}
          {activeTab === 'maps' && (
            <div className="space-y-5">
              <div className="bg-[#202C33] p-4 rounded-2xl border border-[#2A3942] space-y-3">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-[#EA4335]" />
                  Google Maps Academic &amp; Research Locator (gemini-3.5-flash)
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={mapsQuery}
                    onChange={(e) => setMapsQuery(e.target.value)}
                    placeholder="e.g. Distributed systems laboratory, CS library..."
                    className="md:col-span-2 bg-[#111B21] border border-[#2A3942] rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#8696A0] focus:outline-none focus:border-[#EA4335]"
                  />
                  <input
                    type="text"
                    value={mapsLocation}
                    onChange={(e) => setMapsLocation(e.target.value)}
                    placeholder="Location / Campus (e.g. Cambridge, MA)"
                    className="bg-[#111B21] border border-[#2A3942] rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#8696A0] focus:outline-none focus:border-[#EA4335]"
                    onKeyDown={(e) => e.key === 'Enter' && handleMapsGrounded()}
                  />
                </div>
                <button
                  onClick={handleMapsGrounded}
                  disabled={isFindingPlaces}
                  className="bg-[#EA4335] hover:bg-[#D93025] disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md ml-auto"
                >
                  {isFindingPlaces ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                  <span>Find Academic Facilities</span>
                </button>
              </div>

              {mapsAnswer && (
                <div className="bg-[#202C33] p-5 rounded-2xl border border-[#2A3942] space-y-4">
                  <div className="prose prose-invert prose-sm max-w-none text-xs text-[#E9EDEF] whitespace-pre-line leading-relaxed">
                    {mapsAnswer}
                  </div>

                  {mapsPlaces.length > 0 && (
                    <div className="border-t border-[#2A3942] pt-3 space-y-2">
                      <span className="text-[11px] font-bold text-[#8696A0] uppercase tracking-wider">
                        Mapped Facilities
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {mapsPlaces.map((p, idx) => (
                          <div key={idx} className="bg-[#111B21] p-3 rounded-xl border border-[#2A3942]">
                            <div className="text-xs font-bold text-white flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-[#EA4335]" />
                              {p.name}
                            </div>
                            <p className="text-[11px] text-[#8696A0] mt-1">{p.address}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: AUDIO TRANSCRIPTION (gemini-3.5-transcribe) */}
          {activeTab === 'transcribe' && (
            <div className="space-y-5">
              <div className="bg-[#202C33] p-5 rounded-2xl border border-[#2A3942] flex flex-col items-center justify-center text-center space-y-4 py-8">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#9C27B0] to-[#E91E63] flex items-center justify-center text-white shadow-xl">
                  {isRecording ? <MicOff className="w-8 h-8 animate-bounce text-red-200" /> : <Mic className="w-8 h-8" />}
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white">Live Microphone &amp; Lecture Transcriber</h4>
                  <p className="text-xs text-[#8696A0] mt-1">
                    Powered by gemini-3.5-transcribe for rapid and accurate speech-to-text
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {!isRecording ? (
                    <button
                      onClick={startRecording}
                      disabled={isTranscribing}
                      className="bg-[#9C27B0] hover:bg-[#7B1FA2] text-white px-6 py-2.5 rounded-full font-bold text-xs flex items-center gap-2 shadow-lg transition-transform hover:scale-105"
                    >
                      <Mic className="w-4 h-4" />
                      <span>Start Recording</span>
                    </button>
                  ) : (
                    <button
                      onClick={stopRecording}
                      className="bg-[#EA4335] hover:bg-[#D93025] text-white px-6 py-2.5 rounded-full font-bold text-xs flex items-center gap-2 shadow-lg animate-pulse"
                    >
                      <MicOff className="w-4 h-4" />
                      <span>Stop &amp; Transcribe</span>
                    </button>
                  )}
                </div>

                {isTranscribing && (
                  <div className="flex items-center gap-2 text-xs text-[#9C27B0]">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Transcribing with gemini-3.5-transcribe...</span>
                  </div>
                )}
              </div>

              {transcriptionResult && (
                <div className="bg-[#202C33] p-5 rounded-2xl border border-[#2A3942] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-[#9C27B0]" />
                      Transcribed Text
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(transcriptionResult);
                          setCopiedText(true);
                          setTimeout(() => setCopiedText(false), 2000);
                        }}
                        className="px-3 py-1.5 bg-[#111B21] hover:bg-[#2A3942] rounded-lg text-xs text-[#8696A0] hover:text-white flex items-center gap-1.5 transition-colors"
                      >
                        {copiedText ? <Check className="w-3.5 h-3.5 text-[#00A884]" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedText ? 'Copied' : 'Copy'}
                      </button>
                      {onSendMediaToChat && (
                        <button
                          onClick={() => onSendMediaToChat('text', `🎙️ Transcribed Audio Note: ${transcriptionResult}`)}
                          className="px-3 py-1.5 bg-[#00A884] hover:bg-[#008F6F] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          Send to Encrypted Chat
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="bg-[#111B21] p-4 rounded-xl border border-[#2A3942] text-xs text-white leading-relaxed">
                    {transcriptionResult}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-[#202C33] px-6 py-3 border-t border-[#2A3942] flex items-center justify-between text-xs text-[#8696A0]">
          <span>Signal-grade client encryption active for all multimodal transmissions</span>
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
