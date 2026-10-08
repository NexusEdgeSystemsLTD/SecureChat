import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Smartphone, 
  Mail, 
  Lock, 
  Key, 
  IdCard, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  ShieldAlert, 
  FileText, 
  Check, 
  Sparkles,
  ArrowRight,
  BookOpen,
  Mic,
  Users,
  Compass,
  AlertTriangle,
  Globe2,
  PhoneCall,
  Clock,
  Layers,
  Database,
  Cpu,
  Wifi,
  Coins,
  Brain,
  Shield,
  FileCode2,
  Zap,
  Building2,
  FolderLock,
  Crown
} from 'lucide-react';
import { Department, OrganizationTenant, OrgRole, StudentTier, UserProfile } from '../types';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: (newUser: Partial<UserProfile>) => void;
  currentUser?: UserProfile;
  tenants?: OrganizationTenant[];
  departments?: Department[];
  onCreateTenant?: (newTenant: Omit<OrganizationTenant, 'id' | 'createdAt' | 'departmentCount' | 'totalMembers'>) => void;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  isOpen,
  onClose,
  onRegister,
  currentUser,
  tenants = [],
  departments = [],
  onCreateTenant,
}) => {
  const [activeTab, setActiveTab] = useState<'register' | 'blueprint' | 'trafficLight' | 'pillars' | 'schemas'>('register');
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '+1 (555) 019-2834');
  const [email, setEmail] = useState(currentUser?.email || 'scholar.user@university.edu');
  const [nationalId, setNationalId] = useState(currentUser?.nationalId || 'NAT-ID-8829-4109');
  const [nationalIdType, setNationalIdType] = useState<any>(currentUser?.nationalIdType || 'National ID');
  const [password, setPassword] = useState(currentUser?.password || 'Password123!');
  const [pinCode, setPinCode] = useState(currentUser?.pinCode || '1337');
  const [studentTier, setStudentTier] = useState<StudentTier>(currentUser?.studentTier || 'Masters');
  const [institution, setInstitution] = useState(currentUser?.institution || 'NexusEdge Systems Ltd');
  const [fieldOfStudy, setFieldOfStudy] = useState(currentUser?.fieldOfStudy || 'Applied Cryptography & AI');
  const [successMsg, setSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Tenancy & Citizen Affiliation State
  const [accountType, setAccountType] = useState<'enterprise_join' | 'enterprise_create' | 'citizen'>('enterprise_join');
  const [selectedTenantId, setSelectedTenantId] = useState<string>(currentUser?.tenantId || 'tenant_nexusedge');
  const [selectedDeptId, setSelectedDeptId] = useState<string>(currentUser?.departmentId || 'dept_eng');
  const [selectedRole, setSelectedRole] = useState<OrgRole>(currentUser?.orgRole || 'MD');

  // New Organization Fields
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgType, setNewOrgType] = useState<'enterprise' | 'government' | 'ngo' | 'public_civic'>('enterprise');
  const [newOrgRole, setNewOrgRole] = useState<'MD' | 'CTO' | 'DAF'>('MD');

  // Interactive Traffic Light demo state
  const [simulatedTier, setSimulatedTier] = useState<'yellow' | 'orange' | 'red'>('yellow');
  const [voiceAppealRecorded, setVoiceAppealRecorded] = useState(false);

  // Pillar 4 & 5 Interactive State
  const [selectedFintech, setSelectedFintech] = useState<'mpesa' | 'pix' | 'upi'>('mpesa');
  const [federatedSyncStep, setFederatedSyncStep] = useState<number>(1);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !email.trim() || !nationalId.trim()) {
      setErrorMsg('Please provide your Name, Phone Number, Email, and National ID.');
      return;
    }

    setSuccessMsg(true);
    setTimeout(() => {
      let finalTenantId = selectedTenantId;
      let finalDeptId: string | undefined = selectedDeptId;
      let finalRole: OrgRole = selectedRole;
      let finalOrgTitle = '';

      if (accountType === 'citizen') {
        finalTenantId = 'tenant_civic';
        finalDeptId = undefined;
        finalRole = 'CITIZEN';
        finalOrgTitle = 'Verified Sovereign Citizen';
      } else if (accountType === 'enterprise_create') {
        const orgSlug = newOrgName.toLowerCase().replace(/\s+/g, '-');
        if (onCreateTenant) {
          onCreateTenant({
            name: newOrgName.trim() || 'Custom Enterprise Corp',
            slug: orgSlug,
            type: newOrgType,
            description: `${newOrgType.toUpperCase()} tenant with strict department isolation.`,
            logo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=120&auto=format&fit=crop&q=80',
            enforceDepartmentIsolation: true,
            executiveUsers: {
              mdId: currentUser?.id,
            },
          });
        }
        finalRole = newOrgRole;
        finalDeptId = undefined; // Executive triad controls all departments
        finalOrgTitle = `${newOrgRole} (Chief Executive - Triad Department Oversight)`;
      } else {
        // enterprise_join
        if (selectedRole === 'MD' || selectedRole === 'CTO' || selectedRole === 'DAF') {
          finalDeptId = undefined; // Executive oversight over all departments
          finalOrgTitle = selectedRole === 'MD' ? 'Managing Director & CEO' : selectedRole === 'CTO' ? 'Chief Technology Officer' : 'Director of Admin & Finance (DAF)';
        } else {
          const dept = departments.find((d) => d.id === selectedDeptId);
          finalOrgTitle = `${dept ? dept.name : 'Department'} Staff`;
        }
      }

      onRegister({
        name,
        phone,
        email,
        nationalId,
        nationalIdType,
        nationalIdVerified: true,
        registrationStatus: 'verified',
        password,
        pinCode,
        studentTier,
        institution: accountType === 'enterprise_create' ? (newOrgName || institution) : institution,
        fieldOfStudy,
        inactivityLockMinutes: 1,
        tenantId: finalTenantId,
        departmentId: finalDeptId,
        orgRole: finalRole,
        orgTitle: finalOrgTitle,
      });
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in select-none">
      <div className="bg-[#111B21] border border-[#222E35] rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden text-[#E9EDEF] flex flex-col max-h-[92vh]">
        {/* Header */}
        <header className="px-5 py-4 bg-[#202C33] border-b border-[#222E35] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00A884]/20 border border-[#00A884]/40 text-[#00A884] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-white truncate">
                  SecureChat Master Blueprint
                </h3>
                <span className="text-[10px] font-mono bg-[#00A884]/20 text-[#00A884] px-2 py-0.5 rounded uppercase font-bold border border-[#00A884]/40">
                  Global South Ecosystems
                </span>
              </div>
              <p className="text-xs text-[#8696A0] truncate">
                Restorative Justice, Extreme Accessibility &amp; Localized Digital Sovereignty
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#182229] text-[#8696A0] hover:text-white flex items-center justify-center transition-colors shrink-0 ml-2"
          >
            ✕
          </button>
        </header>

        {/* 5-Tab Master Blueprint Navigation */}
        <div className="flex border-b border-[#222E35] bg-[#182229] shrink-0 px-3 pt-2 gap-1.5 text-xs overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('register')}
            className={`px-3 py-2 rounded-t-xl font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'register'
                ? 'bg-[#111B21] text-[#00A884] border-t-2 border-[#00A884] font-bold'
                : 'text-[#8696A0] hover:text-white'
            }`}
          >
            <IdCard className="w-3.5 h-3.5" />
            <span>Anti-Ban Registration</span>
          </button>
          <button
            onClick={() => setActiveTab('pillars')}
            className={`px-3 py-2 rounded-t-xl font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'pillars'
                ? 'bg-[#111B21] text-[#00A884] border-t-2 border-[#00A884] font-bold'
                : 'text-[#8696A0] hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>5-Pillar Architecture</span>
          </button>
          <button
            onClick={() => setActiveTab('trafficLight')}
            className={`px-3 py-2 rounded-t-xl font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'trafficLight'
                ? 'bg-[#111B21] text-[#00A884] border-t-2 border-[#00A884] font-bold'
                : 'text-[#8696A0] hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Traffic Light Model</span>
          </button>
          <button
            onClick={() => setActiveTab('blueprint')}
            className={`px-3 py-2 rounded-t-xl font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'blueprint'
                ? 'bg-[#111B21] text-[#00A884] border-t-2 border-[#00A884] font-bold'
                : 'text-[#8696A0] hover:text-white'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5 text-[#53BDEB]" />
            <span>Generational Matrix</span>
          </button>
          <button
            onClick={() => setActiveTab('schemas')}
            className={`px-3 py-2 rounded-t-xl font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'schemas'
                ? 'bg-[#111B21] text-[#00A884] border-t-2 border-[#00A884] font-bold'
                : 'text-[#8696A0] hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-purple-400" />
            <span>Schemas &amp; Tech Spec</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'register' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Anti-Ban Explanation Notice */}
              <div className="bg-[#182229] p-4 rounded-2xl border border-[#222E35] text-xs">
                <div className="flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-semibold text-white">
                      Pillar 1: Multi-Factor Identity Decoupled from the SIM Trap
                    </div>
                    <p className="text-[#8696A0] leading-relaxed text-[11px]">
                      Mainstream platforms like WhatsApp tie identity strictly to a single SIM card. Recycled phone numbers, carrier hijacking, and automated AI bans leave millions in digital exile. SecureChat immunizes users with a <strong>Triple-Anchor Identity: Phone + Verified Email + Zero-Knowledge National ID Hash</strong>.
                    </p>
                  </div>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Triple-Anchor Identity verified &amp; registered! Cryptographic ratchets armed.</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Full Name */}
                <div>
                  <label className="text-xs font-semibold text-[#8696A0] mb-1 block">Full Legal Name:</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Thorne"
                    className="w-full bg-[#202C33] border border-[#2A3942] rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-[#00A884]"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="text-xs font-semibold text-[#8696A0] mb-1 block flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-[#00A884]" />
                    <span>Public Phone (Routine Social Routing):</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+250 788 000 000"
                    className="w-full bg-[#202C33] border border-[#2A3942] rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-[#00A884]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Verified Email */}
                <div>
                  <label className="text-xs font-semibold text-[#8696A0] mb-1 block flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#00A884]" />
                    <span>Verified Backup Email (Out-of-Band Anchor):</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex.thorne@scholar.edu"
                    className="w-full bg-[#202C33] border border-[#2A3942] rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-[#00A884]"
                  />
                </div>

                {/* National ID Type */}
                <div>
                  <label className="text-xs font-semibold text-[#8696A0] mb-1 block flex items-center gap-1.5">
                    <IdCard className="w-3.5 h-3.5 text-[#00A884]" />
                    <span>ZKP ID Document Type:</span>
                  </label>
                  <select
                    value={nationalIdType}
                    onChange={(e) => setNationalIdType(e.target.value)}
                    className="w-full bg-[#202C33] border border-[#2A3942] rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-[#00A884]"
                  >
                    <option value="National ID">National ID Card (Gov Issued)</option>
                    <option value="Passport">Passport</option>
                    <option value="State Issued ID">Voter ID / State Card</option>
                    <option value="Academic Identity Card">University / Academic ID</option>
                  </select>
                </div>
              </div>

              {/* National ID Number */}
              <div className="bg-[#182229] p-3.5 rounded-2xl border border-[#2A3942] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <IdCard className="w-4 h-4 text-[#00A884]" />
                    <span>Zero-Knowledge Proof National ID Hash:</span>
                  </label>
                  <span className="text-[10px] text-emerald-400 font-mono">H(National_ID || Salt)</span>
                </div>
                <input
                  type="text"
                  required
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  placeholder="e.g. NAT-ID-9842-1084"
                  className="w-full bg-[#111B21] border border-[#2A3942] rounded-xl px-3.5 py-2 text-xs text-white font-mono outline-none focus:border-[#00A884]"
                />
                <p className="text-[11px] text-[#8696A0]">
                  Generated strictly client-side to prevent upstream identity leaks. Verifies the user is a unique legitimate human to prevent botnet flags without exposing government records to remote servers.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Account Password */}
                <div>
                  <label className="text-xs font-semibold text-[#8696A0] mb-1 block flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#00A884]" />
                    <span>Argon2id Master Password:</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Strong Password"
                    className="w-full bg-[#202C33] border border-[#2A3942] rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-[#00A884] font-mono"
                  />
                </div>

                {/* Quick 4-digit PIN */}
                <div>
                  <label className="text-xs font-semibold text-[#8696A0] mb-1 block flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-[#00A884]" />
                    <span>Quick 4-Digit PIN (Shared Device Lock):</span>
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    placeholder="1337"
                    className="w-full bg-[#202C33] border border-[#2A3942] rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-[#00A884] font-mono text-center"
                  />
                </div>
              </div>

              {/* Academic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-semibold text-[#8696A0] mb-1 block">Institution / Organization:</label>
                  <input
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    className="w-full bg-[#202C33] border border-[#2A3942] rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-[#00A884]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#8696A0] mb-1 block">Field / Sector:</label>
                  <input
                    type="text"
                    value={fieldOfStudy}
                    onChange={(e) => setFieldOfStudy(e.target.value)}
                    className="w-full bg-[#202C33] border border-[#2A3942] rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-[#00A884]"
                  />
                </div>
              </div>

              {/* Multi-Tenant Organization & Sovereign Citizen Affiliation */}
              <div className="bg-[#182229] p-4 rounded-2xl border border-[#222E35] space-y-3.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-400" />
                    <span>Multi-Tenant Organization &amp; Citizen Sovereignty:</span>
                  </label>
                  <span className="text-[10px] text-amber-400 font-mono font-bold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                    AIRGAP ISOLATION
                  </span>
                </div>

                {/* Account Type Selector */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setAccountType('enterprise_join')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      accountType === 'enterprise_join'
                        ? 'bg-amber-500/20 border-amber-500 text-white font-bold'
                        : 'bg-[#202C33] border-[#2A3942] text-[#8696A0] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 text-amber-400">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Join Org</span>
                    </div>
                    <div className="text-[10px] text-[#8696A0] font-normal">Existing enterprise tenant</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAccountType('enterprise_create')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      accountType === 'enterprise_create'
                        ? 'bg-[#00A884]/20 border-[#00A884] text-white font-bold'
                        : 'bg-[#202C33] border-[#2A3942] text-[#8696A0] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 text-[#00A884]">
                      <Crown className="w-3.5 h-3.5" />
                      <span>Create Org</span>
                    </div>
                    <div className="text-[10px] text-[#8696A0] font-normal">New company with subs</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAccountType('citizen')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      accountType === 'citizen'
                        ? 'bg-blue-500/20 border-blue-500 text-white font-bold'
                        : 'bg-[#202C33] border-[#2A3942] text-[#8696A0] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 text-blue-400">
                      <Users className="w-3.5 h-3.5" />
                      <span>Citizen</span>
                    </div>
                    <div className="text-[10px] text-[#8696A0] font-normal">Public civic sovereign</div>
                  </button>
                </div>

                {/* If Joining Existing Organization */}
                {accountType === 'enterprise_join' && (
                  <div className="space-y-3 pt-1 border-t border-[#222E35]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-[#8696A0] mb-1 block">Select Organization Tenant:</label>
                        <select
                          value={selectedTenantId}
                          onChange={(e) => setSelectedTenantId(e.target.value)}
                          className="w-full bg-[#202C33] border border-[#2A3942] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                        >
                          {tenants.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name} ({t.type.toUpperCase()})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-[#8696A0] mb-1 block">Assigned Role:</label>
                        <select
                          value={selectedRole}
                          onChange={(e) => setSelectedRole(e.target.value as OrgRole)}
                          className="w-full bg-[#202C33] border border-[#2A3942] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                        >
                          <option value="MD">Managing Director (MD) - Triad Oversight</option>
                          <option value="CTO">Chief Technology Officer (CTO) - Triad</option>
                          <option value="DAF">Director of Admin &amp; Finance (DAF) - Triad</option>
                          <option value="DEPT_HEAD">Department Head (Strict Airgap)</option>
                          <option value="MEMBER">Department Member (Strict Airgap)</option>
                        </select>
                      </div>
                    </div>

                    {/* Department selection only if not MD, CTO, or DAF */}
                    {selectedRole !== 'MD' && selectedRole !== 'CTO' && selectedRole !== 'DAF' && (
                      <div>
                        <label className="text-[11px] font-semibold text-[#8696A0] mb-1 block flex items-center gap-1.5">
                          <FolderLock className="w-3 h-3 text-amber-400" />
                          <span>Assigned Sub-Department (Air-Gapped):</span>
                        </label>
                        <select
                          value={selectedDeptId}
                          onChange={(e) => setSelectedDeptId(e.target.value)}
                          className="w-full bg-[#202C33] border border-[#2A3942] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                        >
                          {departments
                            .filter((d) => d.tenantId === selectedTenantId)
                            .map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.name} ({d.code})
                              </option>
                            ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {/* If Creating New Organization */}
                {accountType === 'enterprise_create' && (
                  <div className="space-y-3 pt-1 border-t border-[#222E35]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-[#8696A0] mb-1 block">New Organization Name:</label>
                        <input
                          type="text"
                          required
                          value={newOrgName}
                          onChange={(e) => setNewOrgName(e.target.value)}
                          placeholder="e.g. Apex Biotech Ltd or Global Bank"
                          className="w-full bg-[#202C33] border border-[#2A3942] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#00A884]"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-[#8696A0] mb-1 block">Organization Type:</label>
                        <select
                          value={newOrgType}
                          onChange={(e) => setNewOrgType(e.target.value as any)}
                          className="w-full bg-[#202C33] border border-[#2A3942] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#00A884]"
                        >
                          <option value="enterprise">Commercial Enterprise</option>
                          <option value="government">Government / Public Agency</option>
                          <option value="ngo">NGO / Humanitarian Agency</option>
                          <option value="public_civic">Civic Sovereignty Guild</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-[#8696A0] mb-1 block">Your Executive Role:</label>
                      <select
                        value={newOrgRole}
                        onChange={(e) => setNewOrgRole(e.target.value as any)}
                        className="w-full bg-[#202C33] border border-[#2A3942] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#00A884]"
                      >
                        <option value="MD">Managing Director (MD) - Full Department Control</option>
                        <option value="CTO">Chief Technology Officer (CTO) - Full Tech Control</option>
                        <option value="DAF">Director of Admin &amp; Finance (DAF) - Full Financial Control</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* If Sovereign Citizen */}
                {accountType === 'citizen' && (
                  <div className="p-3 bg-[#111B21] rounded-xl border border-blue-500/20 text-xs text-[#8696A0] space-y-1">
                    <div className="text-blue-300 font-semibold flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Zero Corporate Telemetry Guarantee</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      Sovereign citizen accounts operate under the National Civic public infrastructure, protected against cross-organizational data harvesting, workplace surveillance, and inter-departmental visibility.
                    </p>
                  </div>
                )}

                <div className="text-[11px] text-[#8696A0] bg-[#111B21] p-2.5 rounded-xl border border-white/5 leading-relaxed">
                  🛡️ <strong>Airgap Rule Enforcement:</strong> Members of any sub-department (e.g. Engineering) can never view or search profiles and chats belonging to other departments (e.g. Finance, HR). The Executive Triad (<strong>MD</strong>, <strong>CTO</strong>, <strong>DAF</strong>) controls and oversees all departments simultaneously.
                </div>
              </div>

              <div className="p-3 bg-[#182229] rounded-xl border border-white/5 text-[11px] text-[#8696A0]">
                ⏱️ <strong>Physical &amp; Shared-Device Defense:</strong> Active 1-minute inactivity watchdog locks the client automatically. Unlock with Face ID/Touch ID biometrics, master password, or PIN. Emergency Duress PIN (`0000`) launches a decoy state.
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={successMsg}
                  className="w-full py-3 rounded-xl bg-[#00A884] hover:bg-[#008F6F] active:scale-98 transition-all text-[#111B21] font-bold text-sm shadow-lg flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Complete Sovereign Registration</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'pillars' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-[#182229] rounded-2xl border border-[#222E35]">
                <h4 className="font-bold text-white text-sm mb-1 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#00A884]" />
                  <span>The 5-Pillar Architectural Engine</span>
                </h4>
                <p className="text-[#8696A0] leading-relaxed">
                  Engineered specifically for the Global South (Africa, Latin America, Asia) to replace corporate deplatforming and metadata surveillance with localized sovereignty.
                </p>
              </div>

              {/* Pillar 1 */}
              <div className="p-4 bg-[#111B21] rounded-2xl border border-[#222E35] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-white flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-[#00A884]/20 text-[#00A884] text-xs flex items-center justify-center font-bold">1</span>
                    <span>Multi-Factor Identity &amp; Anti-Ban Safeguard</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/40 px-2 py-0.5 rounded">ZKP Anchor</span>
                </div>
                <p className="text-[#8696A0] leading-relaxed text-[11px]">
                  Decouples identity from carrier SIM cards using three layers: (1) Public Phone Number for routine routing, (2) Verified Email as out-of-band recovery channel, (3) Client-side Zero-Knowledge Proof (ZKP) ID Hash proving unique personhood against automated botnet flags.
                </p>
              </div>

              {/* Pillar 2 */}
              <div className="p-4 bg-[#111B21] rounded-2xl border border-[#222E35] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-white flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-400 text-xs flex items-center justify-center font-bold">2</span>
                    <span>Restorative Justice &amp; Traffic Light Warning System</span>
                  </div>
                  <span className="text-[10px] text-amber-400 font-mono bg-amber-950/40 px-2 py-0.5 rounded">Progressive Mitigation</span>
                </div>
                <p className="text-[#8696A0] leading-relaxed text-[11px]">
                  Replaces instantaneous bans with a digital stoplight: <strong>Yellow</strong> (10-min cooldown with visual explanation), <strong>Orange</strong> (24-hour lock with local-dialect audio tutorial), and <strong>Red</strong> (suspension where chat logs &amp; contacts are NEVER deleted, accompanied by native voice appeals &amp; community stewards).
                </p>
              </div>

              {/* Pillar 3 */}
              <div className="p-4 bg-[#111B21] rounded-2xl border border-[#222E35] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-white flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-[#53BDEB]/20 text-[#53BDEB] text-xs flex items-center justify-center font-bold">3</span>
                    <span>Physical &amp; Shared-Device Defenses (Zero-Leak Client)</span>
                  </div>
                  <span className="text-[10px] text-[#53BDEB] font-mono bg-sky-950/40 px-2 py-0.5 rounded">Zero-Leak</span>
                </div>
                <p className="text-[#8696A0] leading-relaxed text-[11px]">
                  Engineered for households sharing one phone: 1-minute inactivity watchdog, WebAuthn biometrics (Touch/Face ID), local decrypted search (zero query leakage), clean JSON chat export, and a <strong>Duress Decoy PIN</strong> (entering `0000` silently boots a safe decoy layout with sensitive chats hidden).
                </p>
              </div>

              {/* Pillar 4 */}
              <div className="p-4 bg-[#111B21] rounded-2xl border border-[#222E35] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-white flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-emerald-400/20 text-emerald-400 text-xs flex items-center justify-center font-bold">4</span>
                    <span>Local FinTech &amp; Offline-First Architecture</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/40 px-2 py-0.5 rounded">M-Pesa • Pix • UPI</span>
                </div>
                <p className="text-[#8696A0] leading-relaxed text-[11px]">
                  Deep integration with prevailing payment layers without requiring credit cards. Offline-first local SQLite/IndexedDB queuing that syncs automatically when passing community mesh networks or off-peak hours. Zero-rated public endpoints for essential civic registries and health.
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setSelectedFintech('mpesa')}
                    className={`px-3 py-1.5 rounded-xl border text-[11px] ${selectedFintech === 'mpesa' ? 'bg-[#00A884]/20 border-[#00A884] text-[#00A884] font-bold' : 'bg-[#182229] border-[#222E35] text-[#8696A0]'}`}
                  >
                    M-Pesa (Africa)
                  </button>
                  <button
                    onClick={() => setSelectedFintech('pix')}
                    className={`px-3 py-1.5 rounded-xl border text-[11px] ${selectedFintech === 'pix' ? 'bg-[#53BDEB]/20 border-[#53BDEB] text-[#53BDEB] font-bold' : 'bg-[#182229] border-[#222E35] text-[#8696A0]'}`}
                  >
                    Pix (Latin America)
                  </button>
                  <button
                    onClick={() => setSelectedFintech('upi')}
                    className={`px-3 py-1.5 rounded-xl border text-[11px] ${selectedFintech === 'upi' ? 'bg-amber-400/20 border-amber-400 text-amber-300 font-bold' : 'bg-[#182229] border-[#222E35] text-[#8696A0]'}`}
                  >
                    UPI (Asia)
                  </button>
                </div>
              </div>

              {/* Pillar 5 */}
              <div className="p-4 bg-[#111B21] rounded-2xl border border-[#222E35] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-white flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-purple-400/20 text-purple-400 text-xs flex items-center justify-center font-bold">5</span>
                    <span>Collaborative Language Engine (Federated NLP)</span>
                  </div>
                  <span className="text-[10px] text-purple-400 font-mono bg-purple-950/40 px-2 py-0.5 rounded">E2EE Safe • FedAvg</span>
                </div>
                <p className="text-[#8696A0] leading-relaxed text-[11px]">
                  Bridges the divide for undocumented dialects (Swahili, Quechua, Yoruba, Urdu, regional slang). Because chats are Signal E2EE, central servers cannot read them. The engine tokenizes and learns speech corrections <strong>purely on the handset</strong>, applies Differential Privacy noise, and aggregates anonymous mathematical weights (FedAvg) over-the-air during charging.
                </p>
                <div className="p-3 bg-black/40 rounded-xl space-y-1.5 text-[11px]">
                  <div className="text-white font-semibold flex items-center justify-between">
                    <span>Federated Sync Step: {federatedSyncStep}/6</span>
                    <button 
                      onClick={() => setFederatedSyncStep((p) => (p % 6) + 1)}
                      className="text-[#00A884] hover:underline"
                    >
                      Next Step →
                    </button>
                  </div>
                  {federatedSyncStep === 1 && <p className="text-[#8696A0]">1. Local Tokenization: Unrecognized slang/dialect captured on decrypted client.</p>}
                  {federatedSyncStep === 2 && <p className="text-[#8696A0]">2. Gradient Embedding: Local model calculates loss gradient vector (ΔWi).</p>}
                  {federatedSyncStep === 3 && <p className="text-[#8696A0]">3. Differential Privacy: Noise perturbation ensures phrasing cannot leak.</p>}
                  {federatedSyncStep === 4 && <p className="text-[#8696A0]">4. Uplink Queue: Triggers only when device is idle, on Wi-Fi, and AC charging.</p>}
                  {federatedSyncStep === 5 && <p className="text-[#8696A0]">5. Master FedAvg: Master model aggregates weights without ever seeing text.</p>}
                  {federatedSyncStep === 6 && <p className="text-emerald-400">6. OTA Language Pack: Regional cluster receives updated ASR dialect pack!</p>}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'trafficLight' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-[#182229] rounded-2xl border border-[#222E35]">
                <h4 className="font-bold text-white text-sm mb-1 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>The "Traffic Light" Warning System vs. Meta's Instant Ban</span>
                </h4>
                <p className="text-[#8696A0] leading-relaxed">
                  Instead of automated immediate bans that destroy livelihood and relationships without recourse, the Restorative Digital Inclusion Framework (RDIF) implements a tiered digital stoplight:
                </p>
              </div>

              {/* 3 Tiers selector */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setSimulatedTier('yellow')}
                  className={`p-3 rounded-xl text-left border transition-all ${
                    simulatedTier === 'yellow'
                      ? 'bg-amber-950/40 border-amber-500/60 text-amber-200'
                      : 'bg-[#182229] border-[#222E35] text-[#8696A0]'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5 text-xs text-amber-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                    <span>Yellow Light</span>
                  </div>
                  <div className="text-[10px] mt-1 text-[#8696A0]">Education Prompt (10-min pause)</div>
                </button>

                <button
                  onClick={() => setSimulatedTier('orange')}
                  className={`p-3 rounded-xl text-left border transition-all ${
                    simulatedTier === 'orange'
                      ? 'bg-orange-950/40 border-orange-500/60 text-orange-200'
                      : 'bg-[#182229] border-[#222E35] text-[#8696A0]'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5 text-xs text-orange-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span>
                    <span>Orange Light</span>
                  </div>
                  <div className="text-[10px] mt-1 text-[#8696A0]">Interactive Tutorial / Audio prompt</div>
                </button>

                <button
                  onClick={() => setSimulatedTier('red')}
                  className={`p-3 rounded-xl text-left border transition-all ${
                    simulatedTier === 'red'
                      ? 'bg-rose-950/40 border-rose-500/60 text-rose-200'
                      : 'bg-[#182229] border-[#222E35] text-[#8696A0]'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5 text-xs text-rose-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
                    <span>Red Light</span>
                  </div>
                  <div className="text-[10px] mt-1 text-[#8696A0]">Suspension + Data Portability</div>
                </button>
              </div>

              {/* Simulated Tier Display */}
              {simulatedTier === 'yellow' && (
                <div className="p-4 bg-amber-950/30 border border-amber-500/40 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-amber-300 font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Yellow Light: Education Prompt (Preventing Ban)</span>
                  </div>
                  <p className="text-amber-100/80 leading-relaxed text-[11px]">
                    "Sending this message to 20 people at once resembles automated spam. We paused sending for 10 minutes so you can review platform safety guidelines. Your account remains in good standing."
                  </p>
                  <div className="p-3 bg-black/40 rounded-xl text-[11px] text-[#8696A0] flex items-center justify-between">
                    <span>⏱️ Remaining educational cool-down: <strong>08:42</strong></span>
                    <span className="text-amber-400 font-semibold">Account Safe</span>
                  </div>
                </div>
              )}

              {simulatedTier === 'orange' && (
                <div className="p-4 bg-orange-950/30 border border-orange-500/40 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-orange-300 font-bold">
                    <Clock className="w-4 h-4 text-orange-400" />
                    <span>Orange Light: Temporary Restriction &amp; Audio Guide</span>
                  </div>
                  <p className="text-orange-100/80 leading-relaxed text-[11px]">
                    For a repeated trigger, messaging is paused for 24 hours. The user is provided a 1-minute visual tutorial or native language voice prompt explaining broadcast etiquette.
                  </p>
                  <div className="p-3 bg-black/40 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2 text-orange-300">
                      <Mic className="w-4 h-4 text-orange-400" />
                      <span>Listen to Audio Guide in your local language (Swahili, Hindi, Spanish)</span>
                    </div>
                    <button className="px-2.5 py-1 bg-orange-500 text-black font-bold rounded-lg text-[10px]">
                      Play Audio
                    </button>
                  </div>
                </div>
              )}

              {simulatedTier === 'red' && (
                <div className="p-4 bg-rose-950/30 border border-rose-500/40 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-rose-300 font-bold">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    <span>Red Light: Suspension, Not Deletion (Data Safe + Right to Appeal)</span>
                  </div>
                  <p className="text-rose-100/80 leading-relaxed text-[11px]">
                    Severe flags freeze network broadcasting, but personal data is NEVER deleted. Users have guaranteed data portability rights and simplified audio/video appeals.
                  </p>
                  <div className="p-3 bg-black/40 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-semibold">Native Language Voice Note Appeal:</span>
                      <button
                        onClick={() => setVoiceAppealRecorded(!voiceAppealRecorded)}
                        className={`px-3 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                          voiceAppealRecorded
                            ? 'bg-emerald-500 text-black'
                            : 'bg-rose-500 text-white'
                        }`}
                      >
                        <Mic className="w-3.5 h-3.5" />
                        <span>{voiceAppealRecorded ? 'Voice Appeal Sent ✓' : 'Record 30s Appeal'}</span>
                      </button>
                    </div>
                    <p className="text-[10px] text-[#8696A0]">
                      No English legal forms required: "I am a market vendor, I was just sending my weekly produce price list to my regular buyers."
                    </p>
                  </div>
                </div>
              )}

              {/* Local Stewards & Data Portability */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 bg-[#182229] rounded-2xl border border-[#222E35] space-y-1.5">
                  <div className="font-bold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#00A884]" />
                    <span>Community Digital Stewards</span>
                  </div>
                  <p className="text-[#8696A0] text-[11px] leading-relaxed">
                    Trusted village leaders, NGOs, or community centers can access a specialized advocate portal to escalate low-literacy bans directly to human moderators.
                  </p>
                </div>
                <div className="p-3.5 bg-[#182229] rounded-2xl border border-[#222E35] space-y-1.5">
                  <div className="font-bold text-white flex items-center gap-2">
                    <PhoneCall className="w-4 h-4 text-[#53BDEB]" />
                    <span>IVR &amp; Toll-Free Voice Support</span>
                  </div>
                  <p className="text-[#8696A0] text-[11px] leading-relaxed">
                    Toll-free shortcode telephone support allows users with zero data or simple feature phones to verify account status and submit spoken appeals.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'blueprint' && (
            <div className="space-y-4 text-xs">
              {/* Comparative Matrix */}
              <div className="p-4 bg-[#182229] rounded-2xl border border-[#222E35] space-y-3">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Globe2 className="w-4 h-4 text-[#00A884]" />
                  <span>Enforcement Paradigm Comparison</span>
                </h4>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="border-b border-[#2A3942] text-[#8696A0]">
                        <th className="py-2 pr-3">Dimension</th>
                        <th className="py-2 pr-3 text-rose-400">Western / Meta Model (Punitive)</th>
                        <th className="py-2 text-emerald-400">RDIF Model (Restorative)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      <tr>
                        <td className="py-2 font-semibold text-white pr-3">Enforcement</td>
                        <td className="py-2 text-rose-300 pr-3">Instant automated ban with zero warning</td>
                        <td className="py-2 text-emerald-300">Tiered traffic light with education popups</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-semibold text-white pr-3">Appeals</td>
                        <td className="py-2 text-rose-300 pr-3">Complex English text forms, bot rejections</td>
                        <td className="py-2 text-emerald-300">Voice notes &amp; native video in local tongues</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-semibold text-white pr-3">Identity</td>
                        <td className="py-2 text-rose-300 pr-3">Tied only to SIM (Inherited number traps)</td>
                        <td className="py-2 text-emerald-300">Decoupled: Phone + Email + National ID hash</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-semibold text-white pr-3">Data Rights</td>
                        <td className="py-2 text-rose-300 pr-3">Instant data lockout; destroys businesses</td>
                        <td className="py-2 text-emerald-300">Permanent data export &amp; contact portability</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-semibold text-white pr-3">Household Privacy</td>
                        <td className="py-2 text-rose-300 pr-3">Assumes 1 device per individual person</td>
                        <td className="py-2 text-emerald-300">Shared-device multi-profiles &amp; biometrics</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Generational Inclusivity */}
              <div className="p-4 bg-[#182229] rounded-2xl border border-[#222E35] space-y-3">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  <span>Generational Inclusivity Across Africa, LATAM &amp; Asia</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-[#111B21] rounded-xl border border-white/5">
                    <div className="font-bold text-amber-300 text-xs mb-1">👴 The Elders</div>
                    <p className="text-[11px] text-[#8696A0]">
                      High-contrast, large text, voice-guided interfaces, automatic fraud filtering, and audio explanations.
                    </p>
                  </div>
                  <div className="p-3 bg-[#111B21] rounded-xl border border-white/5">
                    <div className="font-bold text-[#53BDEB] text-xs mb-1">💼 The Providers</div>
                    <p className="text-[11px] text-[#8696A0]">
                      Data-light mobile commerce, instant micro-receipts, offline-first syncing, and zero data waste.
                    </p>
                  </div>
                  <div className="p-3 bg-[#111B21] rounded-xl border border-white/5">
                    <div className="font-bold text-emerald-300 text-xs mb-1">🌱 The Youth</div>
                    <p className="text-[11px] text-[#8696A0]">
                      Encrypted peer study channels, AI-assisted mentorship, and safe entrepreneurship spaces.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'schemas' && (
            <div className="space-y-4 text-xs font-mono">
              <div className="p-4 bg-[#182229] rounded-2xl border border-[#222E35] font-sans">
                <h4 className="font-bold text-white text-sm mb-1 flex items-center gap-2">
                  <FileCode2 className="w-4 h-4 text-purple-400" />
                  <span>Database &amp; Technical Implementation Schemas</span>
                </h4>
                <p className="text-[#8696A0] text-xs">
                  Production-ready PostgreSQL database definitions, client watchdog implementations, and mathematical NLP formulations.
                </p>
              </div>

              {/* PostgreSQL Triple Anchor Schema */}
              <div className="p-4 bg-[#0A0F12] rounded-2xl border border-[#222E35] space-y-2">
                <div className="text-emerald-400 font-bold flex items-center justify-between font-sans">
                  <span>1. PostgreSQL: Triple-Anchor Identity Schema</span>
                  <span className="text-[10px] bg-emerald-950/60 px-2 py-0.5 rounded text-emerald-300">DDL SQL</span>
                </div>
                <pre className="text-[11px] text-[#B3E5FC] overflow-x-auto p-3 bg-black/60 rounded-xl leading-relaxed">
{`CREATE TABLE securechat_users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Social and Route Anchors
    phone_e164 VARCHAR(20) UNIQUE NOT NULL, -- e.g., +250788000000
    backup_email_hash VARCHAR(64) UNIQUE NOT NULL, -- SHA-256 hash
    encrypted_email TEXT NOT NULL, -- AES-256-GCM encrypted
    
    -- Zero-Knowledge Proof Identity Anchor
    zkp_identity_hash VARCHAR(64) UNIQUE NOT NULL, -- H(National_ID || Salt)
    identity_salt VARCHAR(32) NOT NULL,
    
    -- Multi-Layer Authentication Elements
    master_password_hash VARCHAR(60) NOT NULL, -- Argon2id
    quick_pin_hash VARCHAR(60) NOT NULL, -- Argon2id 4-digit PIN
    duress_pin_hash VARCHAR(60) NOT NULL, -- Argon2id Duress trap
    
    -- Status Matrix
    restorative_status VARCHAR(20) DEFAULT 'CLEAR' 
      CHECK (restorative_status IN ('CLEAR', 'YELLOW', 'ORANGE', 'RED')),
    cooldown_until TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_users_phone ON securechat_users(phone_e164);
CREATE INDEX idx_users_zkp ON securechat_users(zkp_identity_hash);`}
                </pre>
              </div>

              {/* Federated Math */}
              <div className="p-4 bg-[#0A0F12] rounded-2xl border border-[#222E35] space-y-2">
                <div className="text-purple-300 font-bold flex items-center justify-between font-sans">
                  <span>2. Mathematical NLP: Differential Privacy &amp; FedAvg</span>
                  <span className="text-[10px] bg-purple-950/60 px-2 py-0.5 rounded text-purple-200">Math Formulation</span>
                </div>
                <div className="text-[11px] text-[#E9EDEF] p-3 bg-black/60 rounded-xl space-y-2 font-sans">
                  <p className="text-[#8696A0]">
                    Local noise perturbation prevents word phrasing leaks:
                  </p>
                  <p className="font-mono text-amber-300 bg-[#182229] p-2 rounded">
                    ΔW̃ᵢ = ΔWᵢ + 𝒩(0, σ²)
                  </p>
                  <p className="text-[#8696A0]">
                    Global aggregation over N regional handsets without reading private raw texts:
                  </p>
                  <p className="font-mono text-emerald-400 bg-[#182229] p-2 rounded">
                    Wₜ₊₁ = Wₜ + (1 / N) ∑ᵢ₌₁ᴺ ΔW̃ᵢ
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
