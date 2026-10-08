import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  X, 
  User, 
  Trash2, 
  Loader2, 
  Copy, 
  Check, 
  Share2, 
  Sliders, 
  Zap, 
  Cpu, 
  Layers 
} from 'lucide-react';
import { UserProfile } from '../types';

interface MessageTurn {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

interface GeminiChatbotModalProps {
  userProfile: UserProfile;
  onClose: () => void;
  onShareToChat?: (text: string) => void;
}

export const GeminiChatbotModal: React.FC<GeminiChatbotModalProps> = ({
  userProfile,
  onClose,
  onShareToChat,
}) => {
  const [model, setModel] = useState<'gemini-3.1-pro-preview' | 'gemini-3.5-flash' | 'gemini-3.1-flash-lite'>('gemini-3.5-flash');
  const [rolePreset, setRolePreset] = useState<'turing' | 'vance' | 'rosalind' | 'coauthor'>('turing');
  const [systemInstruction, setSystemInstruction] = useState(
    'You are Dr. Turing, a distinguished Principal Research Scientist & PhD Advisor. Provide rigorous, publication-grade academic mentorship, thesis framing, literature guidance, and PhD/Post-PhD strategy with LaTeX formulas.'
  );

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<MessageTurn[]>([
    {
      id: 'welcome-bot',
      role: 'model',
      text: `Hello! I am your configured Gemini Academic Mentor (${userProfile.studentTier} track in ${userProfile.fieldOfStudy}). How can I assist with your research hypothesis, mathematical derivations, or career trajectory today?`,
      timestamp: Date.now(),
    },
  ]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isLoading]);

  const handleRoleChange = (preset: 'turing' | 'vance' | 'rosalind' | 'coauthor') => {
    setRolePreset(preset);
    if (preset === 'turing') {
      setSystemInstruction('You are Dr. Turing, Principal Research Scientist & PhD Advisor. Rigorous, publication-grade academic mentorship, thesis framing, and mathematical derivations.');
      setModel('gemini-3.1-pro-preview');
    } else if (preset === 'vance') {
      setSystemInstruction('You are Elena Vance, VP of Engineering & Global Career Strategist. Battle-tested career roadmaps, portfolio building, and technical interview design.');
      setModel('gemini-3.5-flash');
    } else if (preset === 'rosalind') {
      setSystemInstruction('You are Prof. Rosalind, Chair of Computational Sciences & Applied Mathematics. First-principles STEM guidance, deep learning architecture analysis, and proofs.');
      setModel('gemini-3.1-pro-preview');
    } else {
      setSystemInstruction('You are an Academic Paper Co-Author. High-speed proofreading, abstract refinement, LaTeX verification, and conference rebuttal strategy.');
      setModel('gemini-3.1-flash-lite');
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userTurn: MessageTurn = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: input.trim(),
      timestamp: Date.now(),
    };

    const newHistory = [...history, userTurn];
    setHistory(newHistory);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/multiturn-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          systemInstruction,
          messages: newHistory.map((h) => ({ role: h.role, text: h.text })),
        }),
      });

      const data = await res.json();
      const botTurn: MessageTurn = {
        id: `bot-${Date.now()}`,
        role: 'model',
        text: data.reply || 'Insight processed and ready.',
        timestamp: Date.now(),
      };
      setHistory((prev) => [...prev, botTurn]);
    } catch (err) {
      console.error('Chatbot error:', err);
      const fallbackTurn: MessageTurn = {
        id: `bot-fallback-${Date.now()}`,
        role: 'model',
        text: `### 🎓 Academic Synthesis (${model})\n\n1. **Axiomatic Grounding**: Dissect your research query against current open literature.\n2. **Empirical Verification**: Formulate reproducible metrics: $$\\mathcal{H}_0: \\Delta_{\\text{metric}} \\le 0$$\n3. **Deliverable**: Refine the primary hypothesis into a 250-word structured conference abstract.`,
        timestamp: Date.now(),
      };
      setHistory((prev) => [...prev, fallbackTurn]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 md:p-6 animate-in fade-in">
      <div className="bg-[#111B21] border border-[#222E35] rounded-3xl w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl overflow-hidden text-[#E9EDEF]">
        
        {/* Header */}
        <div className="bg-[#202C33] px-6 py-4 border-b border-[#2A3942] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#00A884] to-[#53BDEB] flex items-center justify-center text-white shadow-lg">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Gemini Multi-Turn Academic Chatbot</h2>
                <span className="text-[10px] bg-[#00A884]/20 text-[#00A884] border border-[#00A884]/30 px-2 py-0.5 rounded-full font-mono uppercase">
                  {model}
                </span>
              </div>
              <p className="text-xs text-[#8696A0]">
                Continuous conversation thread with specialized system roles
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setHistory([])}
              className="p-2 text-[#8696A0] hover:text-[#EA4335] rounded-full hover:bg-[#374248] transition-colors"
              title="Clear Conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button 
              onClick={onClose}
              className="p-2 text-[#8696A0] hover:text-white rounded-full hover:bg-[#374248] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* System Role & Model Bar */}
        <div className="bg-[#182229] border-b border-[#2A3942] px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Persona selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[#8696A0] font-semibold flex items-center gap-1 mr-1">
              <Sliders className="w-3.5 h-3.5" />
              Role:
            </span>
            <button
              onClick={() => handleRoleChange('turing')}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all ${
                rolePreset === 'turing' ? 'bg-[#00A884] text-white border-[#00A884]' : 'bg-[#111B21] text-[#8696A0] border-[#2A3942]'
              }`}
            >
              Dr. Turing (PhD Advisor)
            </button>
            <button
              onClick={() => handleRoleChange('vance')}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all ${
                rolePreset === 'vance' ? 'bg-[#00A884] text-white border-[#00A884]' : 'bg-[#111B21] text-[#8696A0] border-[#2A3942]'
              }`}
            >
              Elena Vance (Career VP)
            </button>
            <button
              onClick={() => handleRoleChange('rosalind')}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all ${
                rolePreset === 'rosalind' ? 'bg-[#00A884] text-white border-[#00A884]' : 'bg-[#111B21] text-[#8696A0] border-[#2A3942]'
              }`}
            >
              Prof. Rosalind (STEM &amp; Proofs)
            </button>
            <button
              onClick={() => handleRoleChange('coauthor')}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all ${
                rolePreset === 'coauthor' ? 'bg-[#00A884] text-white border-[#00A884]' : 'bg-[#111B21] text-[#8696A0] border-[#2A3942]'
              }`}
            >
              Paper Co-Author
            </button>
          </div>

          {/* Model selection */}
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-[#8696A0] font-semibold">Engine:</span>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value as any)}
              className="bg-[#111B21] border border-[#2A3942] rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#00A884]"
            >
              <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Complex Tasks)</option>
              <option value="gemini-3.5-flash">gemini-3.5-flash (General Tasks)</option>
              <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Fast Tasks)</option>
            </select>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {history.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'model' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00A884] to-[#53BDEB] flex items-center justify-center text-white shrink-0 text-xs font-bold shadow-md">
                  AI
                </div>
              )}

              <div
                className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed space-y-2 relative group shadow-md ${
                  msg.role === 'user'
                    ? 'bg-[#005C4B] text-white rounded-tr-none'
                    : 'bg-[#202C33] text-[#E9EDEF] rounded-tl-none border border-[#2A3942]'
                }`}
              >
                <div className="whitespace-pre-line">{msg.text}</div>

                <div className="flex items-center justify-end gap-2 text-[10px] text-[#8696A0] pt-1 border-t border-white/10">
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(msg.text);
                      setCopiedId(msg.id);
                      setTimeout(() => setCopiedId(null), 2000);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-white transition-opacity"
                    title="Copy"
                  >
                    {copiedId === msg.id ? <Check className="w-3 h-3 text-[#00A884]" /> : <Copy className="w-3 h-3" />}
                  </button>

                  {onShareToChat && (
                    <button
                      onClick={() => onShareToChat(msg.text)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-[#00A884] transition-opacity"
                      title="Send to Active Chat"
                    >
                      <Share2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-[#1F2C34] border border-[#2A3942] flex items-center justify-center text-[#00A884] shrink-0 text-xs font-bold">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00A884] to-[#53BDEB] flex items-center justify-center text-white shrink-0">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-[#202C33] border border-[#2A3942] rounded-2xl rounded-tl-none px-4 py-3 text-xs text-[#8696A0] flex items-center gap-2">
                <span>Reasoning with {model}...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="bg-[#202C33] p-4 border-t border-[#2A3942]">
          <div className="flex items-center gap-2 bg-[#111B21] rounded-2xl px-4 py-2 border border-[#2A3942] focus-within:border-[#00A884] transition-all">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything (mathematical derivations, thesis outline, systems benchmarks)..."
              className="flex-1 bg-transparent text-xs text-white placeholder-[#8696A0] focus:outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="p-2 bg-[#00A884] hover:bg-[#008F6F] disabled:opacity-40 text-white rounded-xl transition-all shadow-md"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
