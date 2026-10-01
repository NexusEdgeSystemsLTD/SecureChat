import React, { useState } from 'react';
import { 
  GraduationCap, 
  Sparkles, 
  Send, 
  BookOpen, 
  Compass, 
  Award, 
  Layers, 
  CheckCircle2, 
  ArrowRight, 
  UserCheck, 
  MessageSquare, 
  Code2, 
  FileText, 
  HelpCircle,
  Clock,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { StudentTier, UserProfile } from '../types';
import { getCurriculumRoadmap } from '../utils/mlEngine';
import { getPedagogicalMentorReply } from '../utils/pedagogy';

interface MentorshipHubProps {
  userProfile: UserProfile;
  onUpdateTier: (tier: StudentTier) => void;
  onClose: () => void;
  onStartMentorChat: (mentorName: string, promptText: string) => void;
}

export const MentorshipHub: React.FC<MentorshipHubProps> = ({
  userProfile,
  onUpdateTier,
  onClose,
  onStartMentorChat,
}) => {
  const [selectedTier, setSelectedTier] = useState<StudentTier>(userProfile.studentTier || 'Masters');
  const [activeTab, setActiveTab] = useState<'advisor' | 'roadmap' | 'research' | 'fellowships'>('advisor');
  const [advisorPersona, setAdvisorPersona] = useState<'research' | 'career' | 'stem'>('research');
  const [userQuery, setUserQuery] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const [advisorHistory, setAdvisorHistory] = useState<Array<{ role: 'user' | 'model'; text: string }>>([
    {
      role: 'model',
      text: `Hello ${userProfile.name}! I am your dedicated AI Academic & Career Advisor for **${selectedTier}** level in **${userProfile.fieldOfStudy || 'Computational Sciences'}**.\n\nHow can I help you outperform your goals today? You can ask about research thesis topics, syllabus roadmaps, competitive internships, grant applications, or technical interview strategies.`,
    },
  ]);

  const roadmap = getCurriculumRoadmap(selectedTier);

  // Quick prompt starters per tier
  const quickPromptsByTier: Record<StudentTier, string[]> = {
    'High School': [
      'What are the best competitive math & USACO strategies for top university admissions?',
      'How do I conduct independent science fair research at ISEF standard?',
      'Create a 6-month study schedule for AP Calculus BC and Physics C.',
    ],
    Bachelor: [
      'How to land a Tier-1 Software Engineering or Systems Research Internship as a sophomore?',
      'What core distributed systems concepts are tested in senior design interviews?',
      'How do I transition from undergraduate coursework into a top faculty research lab?',
    ],
    Masters: [
      'How do I isolate a novel empirical contribution for my M.S. thesis in machine learning?',
      'Compare industry AI Research Labs (FAIR, Google DeepMind) vs. pursuing a PhD.',
      'How to structure an IEEE/ACM conference submission to maximize acceptance?',
    ],
    PhD: [
      'How to write a winning rebuttal for NeurIPS / ICML reviewers with divergent scores?',
      'Formulate my dissertation outline to establish clear doctoral independence.',
      'Post-doctoral fellowship vs. tenure-track faculty application strategies.',
    ],
    'Post-PhD': [
      'Framework for writing a successful $1M+ NSF CAREER or ERC Starting Grant proposal.',
      'How to manage a multi-disciplinary laboratory and spin off a deep-tech company?',
      'Strategies for keynote oratory and serving as program committee chair.',
    ],
  };

  const handleSendAdvisorQuery = async (queryText?: string) => {
    const textToSend = queryText || userQuery;
    if (!textToSend.trim() || isQuerying) return;

    const newHistory = [...advisorHistory, { role: 'user' as const, text: textToSend }];
    setAdvisorHistory(newHistory);
    setUserQuery('');
    setIsQuerying(true);

    try {
      const res = await fetch('/api/ai/mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentTier: selectedTier,
          fieldOfStudy: userProfile.fieldOfStudy,
          currentGoal: userProfile.researchFocus,
          message: textToSend,
          mentorPersona: advisorPersona,
          history: newHistory.slice(-6).map((h) => ({ role: h.role, content: h.text })),
        }),
      });

      const data = await res.json();
      if (data.reply) {
        setAdvisorHistory((prev) => [...prev, { role: 'model', text: data.reply }]);
      } else {
        const fallback = getPedagogicalMentorReply(selectedTier, userProfile.fieldOfStudy, textToSend, advisorPersona);
        setAdvisorHistory((prev) => [
          ...prev,
          { role: 'model', text: fallback },
        ]);
      }
    } catch {
      const fallback = getPedagogicalMentorReply(selectedTier, userProfile.fieldOfStudy, textToSend, advisorPersona);
      setAdvisorHistory((prev) => [
        ...prev,
        {
          role: 'model',
          text: fallback,
        },
      ]);
    } finally {
      setIsQuerying(false);
    }
  };

  const tierOptions: StudentTier[] = ['High School', 'Bachelor', 'Masters', 'PhD', 'Post-PhD'];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 md:p-6 animate-in fade-in">
      <div className="bg-[#111B21] border border-[#222E35] rounded-3xl w-full max-w-5xl h-[92vh] flex flex-col shadow-2xl overflow-hidden text-[#E9EDEF]">
        {/* Modal Header */}
        <header className="px-6 py-4 bg-[#202C33] border-b border-[#222E35] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00A884]/20 border border-[#00A884]/40 flex items-center justify-center text-[#00A884]">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold flex items-center gap-2">
                SecureChat Academic & Career Mentorship Hub
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#00A884] text-[#111B21] font-semibold">
                  AI Powered
                </span>
              </h2>
              <p className="text-xs text-[#8696A0]">
                Tailored education pathways and career outperformance for high school to post-doctoral scholars
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#111B21] text-[#8696A0] hover:text-white flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </header>

        {/* Tier Selector Bar */}
        <div className="px-6 py-3 bg-[#182229] border-b border-[#222E35] flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto no-scrollbar pb-1 md:pb-0">
            <span className="text-xs text-[#8696A0] mr-2 font-medium">Select Student Level:</span>
            {tierOptions.map((tier) => (
              <button
                key={tier}
                onClick={() => {
                  setSelectedTier(tier);
                  onUpdateTier(tier);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  selectedTier === tier
                    ? 'bg-[#00A884] text-[#111B21] shadow-md shadow-[#00A884]/20'
                    : 'bg-[#202C33] text-[#8696A0] hover:text-[#E9EDEF] hover:bg-[#2A3942]'
                }`}
              >
                <span>{tier}</span>
                {selectedTier === tier && <CheckCircle2 className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center gap-1 bg-[#111B21] p-1 rounded-xl border border-[#222E35] text-xs">
            <button
              onClick={() => setActiveTab('advisor')}
              className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'advisor' ? 'bg-[#00A884] text-[#111B21] font-semibold' : 'text-[#8696A0]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> AI Advisor
            </button>
            <button
              onClick={() => setActiveTab('roadmap')}
              className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'roadmap' ? 'bg-[#00A884] text-[#111B21] font-semibold' : 'text-[#8696A0]'
              }`}
            >
              <Compass className="w-3.5 h-3.5" /> Syllabus Roadmap
            </button>
            <button
              onClick={() => setActiveTab('fellowships')}
              className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'fellowships' ? 'bg-[#00A884] text-[#111B21] font-semibold' : 'text-[#8696A0]'
              }`}
            >
              <Award className="w-3.5 h-3.5" /> Grants & Radar
            </button>
          </div>
        </div>

        {/* Tab 1: AI Advisor Chat & Brainstorming */}
        {activeTab === 'advisor' && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Left Advisor Persona Panel */}
            <div className="w-full md:w-64 bg-[#111B21] border-r border-[#222E35] p-4 flex flex-col gap-3 flex-shrink-0">
              <span className="text-xs font-semibold text-[#8696A0] uppercase tracking-wider">
                Select Mentor Persona
              </span>

              <div
                onClick={() => setAdvisorPersona('research')}
                className={`p-3 rounded-2xl cursor-pointer transition-all border ${
                  advisorPersona === 'research'
                    ? 'bg-[#202C33] border-[#00A884]'
                    : 'bg-[#182229] border-transparent hover:border-[#374248]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                    DT
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Dr. Turing</div>
                    <div className="text-[10px] text-[#8696A0]">PhD & Research Chair</div>
                  </div>
                </div>
                <p className="text-[11px] text-[#8696A0] mt-2">
                  Specializes in literature framing, thesis novelties, mathematical proof rigor, and PhD defense.
                </p>
              </div>

              <div
                onClick={() => setAdvisorPersona('career')}
                className={`p-3 rounded-2xl cursor-pointer transition-all border ${
                  advisorPersona === 'career'
                    ? 'bg-[#202C33] border-[#00A884]'
                    : 'bg-[#182229] border-transparent hover:border-[#374248]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                    EV
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Elena Vance</div>
                    <div className="text-[10px] text-[#8696A0]">VP Engineering & Career</div>
                  </div>
                </div>
                <p className="text-[11px] text-[#8696A0] mt-2">
                  Systems design interviews, high-signal portfolios, leadership career milestones.
                </p>
              </div>

              <div
                onClick={() => setAdvisorPersona('stem')}
                className={`p-3 rounded-2xl cursor-pointer transition-all border ${
                  advisorPersona === 'stem'
                    ? 'bg-[#202C33] border-[#00A884]'
                    : 'bg-[#182229] border-transparent hover:border-[#374248]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs">
                    PR
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Prof. Rosalind</div>
                    <div className="text-[10px] text-[#8696A0]">Deep Learning & Math Chair</div>
                  </div>
                </div>
                <p className="text-[11px] text-[#8696A0] mt-2">
                  Algorithms, neural networks, Olympiad mathematics, and theoretical derivations.
                </p>
              </div>
            </div>

            {/* Right Chat Stream */}
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0B141A]">
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                {advisorHistory.map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${
                      item.role === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                        item.role === 'user'
                          ? 'bg-[#005C4B] text-white rounded-tr-none'
                          : 'bg-[#202C33] text-[#E9EDEF] rounded-tl-none border border-[#2A3942]'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{item.text}</div>
                    </div>
                  </div>
                ))}

                {isQuerying && (
                  <div className="flex items-center gap-2 text-xs text-[#00A884] bg-[#202C33] p-3 rounded-2xl w-fit">
                    <span className="w-2 h-2 rounded-full bg-[#00A884] animate-ping" />
                    <span>Synthesizing tailored pedagogical insights for {selectedTier}...</span>
                  </div>
                )}
              </div>

              {/* Quick Prompt Starters */}
              <div className="px-4 py-2 bg-[#182229] border-t border-[#222E35] flex items-center gap-2 overflow-x-auto no-scrollbar">
                <span className="text-[11px] text-[#8696A0] whitespace-nowrap">Suggested:</span>
                {quickPromptsByTier[selectedTier]?.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendAdvisorQuery(prompt)}
                    className="text-xs px-3 py-1 bg-[#202C33] hover:bg-[#2A3942] text-[#00A884] rounded-full whitespace-nowrap border border-[#00A884]/20 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Query Input */}
              <div className="p-4 bg-[#202C33] border-t border-[#222E35] flex items-center gap-2">
                <input
                  type="text"
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendAdvisorQuery()}
                  placeholder={`Ask ${advisorPersona === 'research' ? 'Dr. Turing' : advisorPersona === 'career' ? 'Elena Vance' : 'Prof. Rosalind'} anything for your ${selectedTier} pathway...`}
                  className="flex-1 bg-[#2A3942] rounded-xl px-4 py-2.5 text-sm text-[#E9EDEF] placeholder-[#8696A0] outline-none focus:ring-1 focus:ring-[#00A884]"
                />
                <button
                  onClick={() => handleSendAdvisorQuery()}
                  disabled={!userQuery.trim() || isQuerying}
                  className="w-10 h-10 rounded-xl bg-[#00A884] text-[#111B21] flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-40 transition-all font-bold"
                >
                  <Send className="w-4 h-4 fill-current ml-0.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Syllabus & Career Roadmaps */}
        {activeTab === 'roadmap' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#E9EDEF] flex items-center gap-2">
                  <Compass className="w-5 h-5 text-[#00A884]" />
                  Curriculum & Outperformance Blueprint: {selectedTier}
                </h3>
                <p className="text-xs text-[#8696A0]">
                  Architected to elevate your rank from median to top 1% in both academic research and industry execution.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {roadmap.map((stage, idx) => (
                <div
                  key={idx}
                  className="bg-[#202C33] border border-[#2A3942] rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden"
                >
                  {stage.status === 'completed' && (
                    <div className="absolute top-3 right-3 text-[#00A884] text-xs font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Completed
                    </div>
                  )}
                  {stage.status === 'in_progress' && (
                    <div className="absolute top-3 right-3 text-amber-400 text-xs font-semibold flex items-center gap-1 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                      <Clock className="w-3.5 h-3.5" /> In Progress
                    </div>
                  )}

                  <div>
                    <span className="text-[11px] font-bold text-[#00A884] uppercase tracking-wider">
                      Stage {idx + 1}
                    </span>
                    <h4 className="text-sm font-bold text-white mt-1 mb-2">{stage.stage}</h4>
                    <p className="text-xs text-[#8696A0] mb-3">{stage.focus}</p>

                    <div className="space-y-1.5 mb-4">
                      <div className="text-[11px] font-semibold text-[#8696A0]">Core Competencies:</div>
                      <div className="flex flex-wrap gap-1">
                        {stage.skills.map((skill, sIdx) => (
                          <span
                            key={sIdx}
                            className="text-[10px] px-2 py-0.5 rounded bg-[#111B21] text-[#E9EDEF] border border-[#374248]"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#2A3942]">
                    <div className="text-[10px] text-[#8696A0]">Signature Deliverable:</div>
                    <div className="text-xs font-semibold text-[#00A884] mt-0.5">
                      {stage.recommendedOutput}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Advice Callout */}
            <div className="bg-[#182229] border border-[#00A884]/30 rounded-2xl p-4 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-[#00A884] flex-shrink-0 mt-0.5" />
              <div className="text-xs text-[#E9EDEF]">
                <strong className="text-[#00A884]">The SecureChat Edge:</strong> In your level ({selectedTier}), raw credentials matter far less than **verifiable artifacts**. Whether it's a reproducible benchmark paper with Docker scripts or an open-source distributed system, building end-to-end solutions establishes unmatched credibility.
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Grants & Fellowships Radar */}
        {activeTab === 'fellowships' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-[#E9EDEF] flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                Active Fellowships, Research Grants & Admissions Radar
              </h3>
              <p className="text-xs text-[#8696A0]">
                Curated funding and fellowship opportunities aligned with your profile in {userProfile.fieldOfStudy || 'Applied Sciences'}.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  name: 'NSF Graduate Research Fellowship Program (GRFP)',
                  target: 'Undergraduate Seniors & 1st Year Graduate',
                  funding: '$37,000 / year + $12,000 tuition allowance',
                  deadline: 'Late October Annual Cycle',
                  focus: 'Broader impacts and transformative intellectual merit in STEM disciplines.',
                },
                {
                  name: 'Fulbright Foreign Student & Scholar Program',
                  target: 'Masters, PhD & Post-Doctoral Fellows',
                  funding: 'Full tuition, living stipend, travel & health insurance',
                  deadline: 'September - October',
                  focus: 'International academic exchange and cross-border research synergy.',
                },
                {
                  name: 'Marie Skłodowska-Curie Actions (MSCA) Postdoctoral Fellowship',
                  target: 'Post-PhD & Principal Investigators',
                  funding: '€100,000+ research budget + living allowance',
                  deadline: 'Annual September Deadline',
                  focus: 'Interdisciplinary frontier research within European and global host institutions.',
                },
                {
                  name: 'Regeneron Science Talent Search & ISEF Grand Awards',
                  target: 'High School Seniors & Juniors',
                  funding: '$25,000 to $250,000 awards',
                  deadline: 'Mid November',
                  focus: 'Original scientific inquiry demonstrating high-level research independence.',
                },
              ].map((grant, idx) => (
                <div
                  key={idx}
                  className="bg-[#202C33] border border-[#2A3942] rounded-2xl p-5 flex flex-col justify-between hover:border-[#00A884]/40 transition-colors"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-sm font-bold text-white max-w-[70%]">{grant.name}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-400/10 text-amber-300 font-semibold border border-amber-400/20">
                        {grant.target}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-[#00A884] mb-2">{grant.funding}</div>
                    <p className="text-xs text-[#8696A0] mb-3">{grant.focus}</p>
                  </div>

                  <div className="pt-3 border-t border-[#2A3942] flex items-center justify-between text-xs">
                    <span className="text-[#8696A0]">Deadline: {grant.deadline}</span>
                    <button
                      onClick={() => {
                        setActiveTab('advisor');
                        handleSendAdvisorQuery(`Can you provide a step-by-step proposal template for ${grant.name}?`);
                      }}
                      className="text-[#00A884] hover:underline font-semibold flex items-center gap-1"
                    >
                      Draft Proposal <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
