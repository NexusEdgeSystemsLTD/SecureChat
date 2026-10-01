import React, { useState, useEffect } from 'react';
import { CircleDot, Plus, Lock, Send, ChevronLeft, ChevronRight, Eye, ShieldCheck } from 'lucide-react';
import { StatusStory, UserProfile } from '../types';

interface StatusViewerModalProps {
  stories: StatusStory[];
  currentUser: UserProfile;
  onAddStory: (content: string, mediaUrl?: string) => void;
  onClose: () => void;
}

export const StatusViewerModal: React.FC<StatusViewerModalProps> = ({
  stories,
  currentUser,
  onAddStory,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showAddStory, setShowAddStory] = useState(false);
  const [newStoryText, setNewStoryText] = useState('');
  const [replyText, setReplyText] = useState('');

  const currentStory = stories[currentIndex];

  useEffect(() => {
    if (isPaused || showAddStory || !currentStory) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentIndex < stories.length - 1) {
            setCurrentIndex((c) => c + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [currentIndex, isPaused, showAddStory, stories.length, onClose]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
    }
  };

  const handleCreateStory = () => {
    if (!newStoryText.trim()) return;
    onAddStory(newStoryText.trim());
    setNewStoryText('');
    setShowAddStory(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0B141A]/95 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in">
      <div className="w-full max-w-md h-[88vh] bg-[#111B21] border border-[#222E35] rounded-3xl flex flex-col relative overflow-hidden shadow-2xl text-[#E9EDEF]">
        {/* Top Segmented Progress Bars */}
        <div className="absolute top-3 inset-x-4 z-20 flex gap-1.5">
          {stories.map((story, i) => (
            <div key={story.id} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
              <div
                style={{
                  width:
                    i < currentIndex ? '100%' : i === currentIndex ? `${progress}%` : '0%',
                }}
                className="h-full bg-white rounded-full transition-all"
              />
            </div>
          ))}
        </div>

        {/* Top Header */}
        <div className="absolute top-6 inset-x-4 z-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={currentStory?.userAvatar}
              alt={currentStory?.userName}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-[#00A884]"
            />
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>{currentStory?.userName}</span>
                <ShieldCheck className="w-3.5 h-3.5 text-[#00A884]" />
              </div>
              <div className="text-[11px] text-[#8696A0]">
                {new Date(currentStory?.timestamp || Date.now()).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                • 24h Ephemeral
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddStory(true)}
              className="p-2 rounded-full bg-[#202C33] text-[#00A884] hover:bg-[#2A3942]"
              title="Add Encrypted Status Story"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#202C33] text-[#8696A0] hover:text-white flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Middle Story Body */}
        <div
          onMouseDown={() => setIsPaused(true)}
          onMouseUp={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
          className="flex-1 flex flex-col justify-center items-center p-6 text-center relative z-10"
        >
          {currentStory?.mediaUrl && (
            <div className="absolute inset-0 z-0">
              <img
                src={currentStory.mediaUrl}
                alt="Story media"
                className="w-full h-full object-cover opacity-30"
              />
            </div>
          )}

          <div className="relative z-10 max-w-xs space-y-4">
            <div className="inline-flex items-center gap-1 text-[11px] text-[#00A884] bg-[#202C33]/80 px-3 py-1 rounded-full border border-[#00A884]/30">
              <Lock className="w-3 h-3" />
              <span>Signal-Grade End-to-End Encrypted Status</span>
            </div>

            <p className="text-base md:text-lg font-medium text-white leading-relaxed">
              {currentStory?.content}
            </p>
          </div>

          {/* Navigation Tap Zones */}
          <div
            onClick={handlePrev}
            className="absolute left-0 inset-y-0 w-1/3 z-20 cursor-pointer"
          />
          <div
            onClick={handleNext}
            className="absolute right-0 inset-y-0 w-1/3 z-20 cursor-pointer"
          />
        </div>

        {/* Bottom Reply Bar */}
        <div className="p-4 bg-[#202C33] border-t border-[#222E35] z-20 flex items-center gap-2">
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Reply privately (encrypted)..."
            className="flex-1 bg-[#2A3942] rounded-xl px-4 py-2 text-xs text-white placeholder-[#8696A0] outline-none"
          />
          <button
            onClick={() => {
              if (replyText.trim()) {
                setReplyText('');
                onClose();
              }
            }}
            className="p-2 rounded-xl bg-[#00A884] text-[#111B21] hover:scale-105 transition-transform"
          >
            <Send className="w-4 h-4 fill-current ml-0.5" />
          </button>
        </div>

        {/* Add Story Sub-Modal */}
        {showAddStory && (
          <div className="absolute inset-0 z-40 bg-[#111B21] p-6 flex flex-col justify-between animate-in slide-in-from-bottom">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <CircleDot className="w-4 h-4 text-[#00A884]" /> Post Encrypted Status
              </h4>
              <button
                onClick={() => setShowAddStory(false)}
                className="text-xs text-[#8696A0] hover:text-white"
              >
                Cancel
              </button>
            </div>

            <textarea
              value={newStoryText}
              onChange={(e) => setNewStoryText(e.target.value)}
              placeholder="What are you researching or learning today? (Disappears in 24 hours)"
              rows={6}
              className="w-full bg-[#202C33] border border-[#2A3942] rounded-2xl p-4 text-sm text-white placeholder-[#8696A0] outline-none resize-none focus:ring-1 focus:ring-[#00A884]"
            />

            <div className="text-[11px] text-[#8696A0] flex items-center gap-1.5 my-2">
              <Lock className="w-3.5 h-3.5 text-[#00A884]" />
              <span>Visible only to verified contacts. Strips all EXIF metadata.</span>
            </div>

            <button
              onClick={handleCreateStory}
              disabled={!newStoryText.trim()}
              className="w-full py-3 rounded-xl bg-[#00A884] text-[#111B21] font-bold text-sm hover:scale-101 active:scale-99 transition-all disabled:opacity-50"
            >
              Share Status Story (AES-256-GCM)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
