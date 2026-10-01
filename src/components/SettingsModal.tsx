import React, { useState } from 'react';
import { 
  User, 
  Shield, 
  Lock, 
  GraduationCap, 
  Key, 
  Check, 
  Copy, 
  Smartphone, 
  RefreshCw,
  Eye,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import { PrivacySettings, StudentTier, UserProfile } from '../types';
import { computeFingerprint } from '../utils/crypto';

interface SettingsModalProps {
  user: UserProfile;
  privacy: PrivacySettings;
  onUpdateUser: (user: UserProfile) => void;
  onUpdatePrivacy: (privacy: PrivacySettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  user,
  privacy,
  onUpdateUser,
  onUpdatePrivacy,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'education' | 'security'>('education');
  const [name, setName] = useState(user.name);
  const [institution, setInstitution] = useState(user.institution);
  const [fieldOfStudy, setFieldOfStudy] = useState(user.fieldOfStudy);
  const [researchFocus, setResearchFocus] = useState(user.researchFocus);
  const [studentTier, setStudentTier] = useState<StudentTier>(user.studentTier);
  const [pinCode, setPinCode] = useState(user.pinCode);
  const [duressCode, setDuressCode] = useState(user.duressCode);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    onUpdateUser({
      ...user,
      name,
      institution,
      fieldOfStudy,
      researchFocus,
      studentTier,
      pinCode,
      duressCode,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const tiers: StudentTier[] = ['High School', 'Bachelor', 'Masters', 'PhD', 'Post-PhD'];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-[#111B21] border border-[#222E35] rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden text-[#E9EDEF]">
        {/* Header */}
        <header className="px-6 py-4 bg-[#202C33] border-b border-[#222E35] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#00A884]/20 text-[#00A884]">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">SecureChat Settings & Encryption</h3>
              <p className="text-xs text-[#8696A0]">Academic Identity, Tor Relays & E2EE Cryptography</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#111B21] text-[#8696A0] hover:text-white flex items-center justify-center"
          >
            ✕
          </button>
        </header>

        {/* Tab switcher */}
        <div className="flex border-b border-[#222E35] bg-[#182229] text-xs">
          <button
            onClick={() => setActiveTab('education')}
            className={`flex-1 py-3 font-semibold transition-colors flex items-center justify-center gap-1.5 border-b-2 ${
              activeTab === 'education'
                ? 'border-[#00A884] text-[#00A884]'
                : 'border-transparent text-[#8696A0] hover:text-white'
            }`}
          >
            <GraduationCap className="w-4 h-4" /> Academic & Career
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex-1 py-3 font-semibold transition-colors flex items-center justify-center gap-1.5 border-b-2 ${
              activeTab === 'security'
                ? 'border-[#00A884] text-[#00A884]'
                : 'border-transparent text-[#8696A0] hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4" /> Privacy & Keys
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-3 font-semibold transition-colors flex items-center justify-center gap-1.5 border-b-2 ${
              activeTab === 'profile'
                ? 'border-[#00A884] text-[#00A884]'
                : 'border-transparent text-[#8696A0] hover:text-white'
            }`}
          >
            <User className="w-4 h-4" /> User Profile
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {activeTab === 'education' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#8696A0] mb-1.5 block">
                  Current Student Tier / Level:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {tiers.map((t) => (
                    <button
                      key={t}
                      onClick={() => setStudentTier(t)}
                      className={`p-2.5 rounded-xl text-xs font-semibold border text-left transition-all ${
                        studentTier === t
                          ? 'bg-[#00A884]/20 border-[#00A884] text-[#00A884]'
                          : 'bg-[#202C33] border-[#2A3942] text-[#8696A0] hover:text-white'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#8696A0] mb-1 block">
                  Institution / School / University:
                </label>
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  className="w-full bg-[#202C33] border border-[#2A3942] rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-[#00A884]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#8696A0] mb-1 block">
                  Major / Discipline of Study:
                </label>
                <input
                  type="text"
                  value={fieldOfStudy}
                  onChange={(e) => setFieldOfStudy(e.target.value)}
                  className="w-full bg-[#202C33] border border-[#2A3942] rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-[#00A884]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#8696A0] mb-1 block">
                  Research Focus / Career Objective:
                </label>
                <textarea
                  value={researchFocus}
                  onChange={(e) => setResearchFocus(e.target.value)}
                  rows={2}
                  className="w-full bg-[#202C33] border border-[#2A3942] rounded-xl px-4 py-2 text-sm text-white outline-none resize-none focus:border-[#00A884]"
                />
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="bg-[#202C33] p-4 rounded-2xl border border-[#2A3942]">
                <div className="text-xs font-bold text-white mb-1 flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-[#00A884]" /> Public Key Fingerprint
                </div>
                <div className="font-mono text-xs text-emerald-400 bg-[#111B21] p-2.5 rounded-lg border border-white/5 break-all">
                  {user.publicKeyFingerprint}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#8696A0] mb-1 block">
                    Master App PIN (4 Digits):
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    className="w-full bg-[#202C33] border border-[#2A3942] rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-[#00A884] font-mono text-center"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-rose-400 mb-1 block">
                    Stealth Duress Code (Decoy PIN):
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={duressCode}
                    onChange={(e) => setDuressCode(e.target.value)}
                    className="w-full bg-[#202C33] border border-rose-500/30 rounded-xl px-4 py-2 text-sm text-rose-300 outline-none focus:border-rose-500 font-mono text-center"
                  />
                </div>
              </div>

              <div className="bg-[#182229] p-3.5 rounded-2xl border border-[#222E35] text-xs text-[#8696A0] space-y-1">
                <div>🔒 <strong>Signal-Grade Double Ratchet:</strong> Keys regenerate periodically.</div>
                <div>🛡️ <strong>Zero Plaintext Storage:</strong> IndexedDB data is encrypted at rest.</div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#8696A0] mb-1 block">Full Name:</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#202C33] border border-[#2A3942] rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-[#00A884]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#8696A0] mb-1 block">Phone (Encrypted Identifier):</label>
                <input
                  type="text"
                  disabled
                  value={user.phone}
                  className="w-full bg-[#182229] border border-[#222E35] rounded-xl px-4 py-2 text-sm text-[#8696A0] outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="px-6 py-4 bg-[#202C33] border-t border-[#222E35] flex items-center justify-between">
          <span className="text-xs text-[#8696A0]">
            {isSaved && <span className="text-[#00A884] font-bold">✓ Settings saved securely!</span>}
          </span>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-[#00A884] text-[#111B21] font-bold text-sm hover:scale-102 active:scale-98 transition-all shadow-md"
          >
            Save Changes
          </button>
        </footer>
      </div>
    </div>
  );
};
