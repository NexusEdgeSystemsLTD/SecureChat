import React, { useState } from 'react';
import { Sparkles, Brain, Compass, BookOpen, RefreshCw, Trash2, ArrowUpRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { CognitiveProfile, StudentTier, UserProfile } from '../types';

interface AIPersonalizationModalProps {
  profile: CognitiveProfile;
  user: UserProfile;
  onUpdateProfile: (updated: CognitiveProfile) => void;
  onClose: () => void;
  onOpenMentorshipWithTopic: (topic: string) => void;
}

export const AIPersonalizationModal: React.FC<AIPersonalizationModalProps> = ({
  profile,
  user,
  onUpdateProfile,
  onClose,
  onOpenMentorshipWithTopic,
}) => {
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  const handleResynthesizeWithAI = async () => {
    setIsSynthesizing(true);
    try {
      const res = await fetch('/api/ai/analyze-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recentConversations: [
            { topic: 'AES-GCM zero-knowledge verification proof', tier: user.studentTier },
            { topic: 'Doctoral thesis and novel benchmark reductions', tier: user.studentTier },
            { topic: 'Competitive algorithms and systems architecture', tier: user.studentTier },
          ],
        }),
      });

      const data = await res.json();
      if (data.analysis) {
        onUpdateProfile({
          ...profile,
          interests: data.analysis.interests?.map((i: any, idx: number) => ({
            name: i.name || i,
            category: 'Academic Specialization',
            score: typeof i.score === 'number' ? i.score : 0.85 - idx * 0.05,
            interactedCount: 20 - idx * 2,
          })) || profile.interests,
          cognitiveTendencies: data.analysis.cognitiveTendencies || profile.cognitiveTendencies,
          personalizedSuggestions: data.analysis.personalizedSuggestions || profile.personalizedSuggestions,
          careerRoadmapMilestone: data.analysis.careerRoadmapMilestone || profile.careerRoadmapMilestone,
          lastUpdated: Date.now(),
        });
      }
    } catch (e) {
      console.error('Failed to run AI profile synthesis', e);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleResetWeights = () => {
    onUpdateProfile({
      ...profile,
      interests: [
        { name: 'End-to-End Cryptography & Security', category: 'Computer Science', score: 0.7, interactedCount: 5 },
        { name: 'Deep Learning & Neural Architectures', category: 'AI & Data Science', score: 0.65, interactedCount: 4 },
      ],
      lastUpdated: Date.now(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-[#111B21] border border-[#222E35] rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden text-[#E9EDEF]">
        {/* Header */}
        <header className="px-6 py-4 bg-[#202C33] border-b border-[#222E35] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-400/20 text-amber-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Adaptive AI/ML Learning Engine & Cognitive Profiler
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400 text-[#111B21] font-bold">
                  Zero-Telemetry ML
                </span>
              </h3>
              <p className="text-xs text-[#8696A0]">
                Continuous on-device modeling of your scholarly interests, learning style, and career milestones
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
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-[#182229] p-4 rounded-2xl border border-[#222E35]">
            <div>
              <div className="text-xs text-[#8696A0]">Student Profile & Tier:</div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>{user.name}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-[#00A884]/20 text-[#00A884] border border-[#00A884]/30">
                  {user.studentTier}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleResynthesizeWithAI}
                disabled={isSynthesizing}
                className="px-3 py-1.5 rounded-xl bg-[#00A884] text-[#111B21] text-xs font-bold hover:scale-105 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSynthesizing ? 'animate-spin' : ''}`} />
                {isSynthesizing ? 'Synthesizing...' : 'Resynthesize Profile'}
              </button>
              <button
                onClick={handleResetWeights}
                className="p-2 rounded-xl bg-[#202C33] text-[#8696A0] hover:text-rose-400 text-xs transition-colors"
                title="Reset Learned Affinity Weights"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Cognitive Tendencies */}
          <div>
            <h4 className="text-xs font-bold text-[#8696A0] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Brain className="w-4 h-4 text-emerald-400" />
              Learned Cognitive & Pedagogical Tendencies
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {profile.cognitiveTendencies.map((tendency, i) => (
                <div
                  key={i}
                  className="bg-[#202C33] p-3 rounded-xl border border-[#2A3942] text-xs text-white font-medium flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-[#00A884]" />
                  <span>{tendency}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Topic Affinities Bar Chart */}
          <div>
            <h4 className="text-xs font-bold text-[#8696A0] uppercase tracking-wider mb-2">
              Academic Topic Affinity Radar
            </h4>
            <div className="space-y-2.5 bg-[#202C33] p-4 rounded-2xl border border-[#2A3942]">
              {profile.interests.map((interest, i) => {
                const percent = Math.round(interest.score * 100);
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-white">{interest.name}</span>
                      <span className="text-[#00A884] font-mono font-bold">{percent}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#111B21] overflow-hidden">
                      <div
                        style={{ width: `${percent}%` }}
                        className="h-full bg-gradient-to-r from-[#00A884] to-emerald-400 rounded-full transition-all duration-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Personalized Suggestions Feed */}
          <div>
            <h4 className="text-xs font-bold text-[#8696A0] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-amber-400" />
              Personalized Content & Research Suggestions
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {profile.personalizedSuggestions.map((sug) => (
                <div
                  key={sug.id}
                  className="bg-[#202C33] p-4 rounded-2xl border border-[#2A3942] hover:border-[#00A884]/40 transition-colors flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#00A884]/20 text-[#00A884] font-semibold border border-[#00A884]/30">
                        {sug.category}
                      </span>
                      <span className="text-[11px] text-amber-300 font-mono">
                        {sug.matchScore}% Match
                      </span>
                    </div>
                    <h5 className="text-xs font-bold text-white mb-1.5">{sug.title}</h5>
                    <p className="text-[11px] text-[#8696A0] leading-relaxed mb-3">
                      {sug.description}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      onOpenMentorshipWithTopic(sug.title);
                      onClose();
                    }}
                    className="pt-2 border-t border-[#2A3942] text-xs font-bold text-[#00A884] hover:underline flex items-center justify-between"
                  >
                    <span>Launch in Mentorship Hub</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
