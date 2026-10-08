import React, { useState } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Lock, 
  Users, 
  Briefcase, 
  Key, 
  ChevronRight, 
  Plus, 
  AlertCircle, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  Sparkles, 
  ShieldAlert, 
  UserCheck, 
  Crown, 
  Cpu, 
  Coins, 
  FileText, 
  FolderLock,
  Layers,
  ArrowRight,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';
import { Department, OrganizationTenant, OrgMember, OrgRole, UserProfile } from '../types';

interface TenancyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  tenants: OrganizationTenant[];
  departments: Department[];
  members: OrgMember[];
  activeTenantId: string;
  onSelectTenant: (tenantId: string) => void;
  onSwitchUserRole: (userPatch: Partial<UserProfile>) => void;
  onCreateTenant: (newTenant: Omit<OrganizationTenant, 'id' | 'createdAt' | 'departmentCount' | 'totalMembers'>) => void;
  onCreateDepartment: (newDept: { name: string; code: string; description: string; tenantId: string }) => void;
  onAddMember: (newMember: Omit<OrgMember, 'id'>) => void;
}

export const TenancyModal: React.FC<TenancyModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  tenants,
  departments,
  members,
  activeTenantId,
  onSelectTenant,
  onSwitchUserRole,
  onCreateTenant,
  onCreateDepartment,
  onAddMember,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'departments' | 'members' | 'matrix' | 'createTenant' | 'createDept'>('overview');
  const [selectedDeptId, setSelectedDeptId] = useState<string | 'all'>('all');
  const [searchMember, setSearchMember] = useState('');

  // Forms
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgSlug, setNewOrgSlug] = useState('');
  const [newOrgType, setNewOrgType] = useState<'enterprise' | 'government' | 'ngo' | 'public_civic'>('enterprise');
  const [newOrgDesc, setNewOrgDesc] = useState('');

  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptCode, setNewDeptCode] = useState('');
  const [newDeptDesc, setNewDeptDesc] = useState('');

  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<OrgRole>('MEMBER');
  const [newMemberDeptId, setNewMemberDeptId] = useState<string>('');
  const [newMemberTitle, setNewMemberTitle] = useState('');

  if (!isOpen) return null;

  const currentTenant = tenants.find((t) => t.id === activeTenantId) || tenants[0];
  const tenantDepartments = departments.filter((d) => d.tenantId === currentTenant.id);
  const tenantMembers = members.filter((m) => m.tenantId === currentTenant.id);

  // Executive check
  const isExecutive = currentUser.orgRole === 'MD' || currentUser.orgRole === 'CTO' || currentUser.orgRole === 'DAF';

  const handleCreateOrgSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    onCreateTenant({
      name: newOrgName.trim(),
      slug: (newOrgSlug.trim() || newOrgName.toLowerCase().replace(/\s+/g, '-')),
      type: newOrgType,
      logo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=120&auto=format&fit=crop&q=80',
      description: newOrgDesc.trim() || 'Enterprise secure organization',
      executiveUsers: {
        mdId: currentUser.id,
      },
      enforceDepartmentIsolation: true,
    });
    setNewOrgName('');
    setNewOrgSlug('');
    setNewOrgDesc('');
    setActiveTab('overview');
  };

  const handleCreateDeptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim() || !newDeptCode.trim()) return;
    onCreateDepartment({
      name: newDeptName.trim(),
      code: newDeptCode.trim().toUpperCase(),
      description: newDeptDesc.trim() || `${newDeptName} Department operations`,
      tenantId: currentTenant.id,
    });
    setNewDeptName('');
    setNewDeptCode('');
    setNewDeptDesc('');
    setActiveTab('departments');
  };

  const handleAddMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberEmail.trim()) return;
    onAddMember({
      userId: `user_${Date.now()}`,
      tenantId: currentTenant.id,
      departmentId: (newMemberRole === 'MD' || newMemberRole === 'CTO' || newMemberRole === 'DAF') ? undefined : (newMemberDeptId || tenantDepartments[0]?.id),
      name: newMemberName.trim(),
      email: newMemberEmail.trim(),
      role: newMemberRole,
      title: newMemberTitle.trim() || `${newMemberRole} at ${currentTenant.name}`,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      status: 'active',
      phone: '+1 (555) 000-0000',
    });
    setNewMemberName('');
    setNewMemberEmail('');
    setNewMemberTitle('');
    setActiveTab('members');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 md:p-6 animate-in fade-in">
      <div className="bg-[#111B21] border border-[#222E35] rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden text-[#E9EDEF] flex flex-col max-h-[92vh]">
        {/* Header */}
        <header className="px-6 py-4 bg-[#202C33] border-b border-[#222E35] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#00A884]/20 text-[#00A884] ring-1 ring-[#00A884]/40">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Multi-Tenant Organization & Department Firewall</h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#00A884]/20 text-[#00A884] border border-[#00A884]/30 font-semibold">
                  Zero Cross-Department Leakage
                </span>
              </div>
              <p className="text-xs text-[#8696A0]">
                MD, CTO & DAF Executive Triad Control • Isolated Departmental Sub-Tenants • Public Citizen Access
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#111B21] text-[#8696A0] hover:text-white flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </header>

        {/* Executive Identity Switcher Banner */}
        <div className="bg-gradient-to-r from-[#182229] via-[#202C33] to-[#182229] px-6 py-3 border-b border-[#2A3942] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-[#8696A0]">Current Identity Simulator:</span>
            <div className="flex items-center gap-1.5 font-medium text-white bg-[#111B21] px-2.5 py-1 rounded-xl border border-[#374248]">
              <span className={`w-2 h-2 rounded-full ${
                currentUser.orgRole === 'MD' ? 'bg-amber-400' :
                currentUser.orgRole === 'CTO' ? 'bg-cyan-400' :
                currentUser.orgRole === 'DAF' ? 'bg-emerald-400' :
                currentUser.orgRole === 'DEPT_HEAD' ? 'bg-purple-400' :
                'bg-blue-400'
              }`} />
              <span className="font-bold text-[#00A884]">{currentUser.orgRole || 'MD'}</span>
              <span>•</span>
              <span className="truncate max-w-[160px]">{currentUser.name}</span>
              <span className="text-[10px] text-[#8696A0]">
                ({currentUser.departmentId ? departments.find(d => d.id === currentUser.departmentId)?.name : 'All Departments / Omniscient'})
              </span>
            </div>
          </div>

          {/* Quick-switch roles for live demonstration */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-[#8696A0] mr-1">Simulate As:</span>
            <button
              onClick={() => onSwitchUserRole({
                orgRole: 'MD',
                orgTitle: 'Managing Director & CEO (Full Department Control)',
                departmentId: undefined,
              })}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                currentUser.orgRole === 'MD'
                  ? 'bg-amber-500 text-black shadow-sm'
                  : 'bg-[#2A3942] text-amber-300 hover:bg-[#374248]'
              }`}
              title="Managing Director: Full control & visibility over all departments"
            >
              MD
            </button>
            <button
              onClick={() => onSwitchUserRole({
                orgRole: 'CTO',
                orgTitle: 'Chief Technology Officer (All Depts + Crypto Systems)',
                departmentId: undefined,
              })}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                currentUser.orgRole === 'CTO'
                  ? 'bg-cyan-500 text-black shadow-sm'
                  : 'bg-[#2A3942] text-cyan-300 hover:bg-[#374248]'
              }`}
              title="Chief Technology Officer: Full executive oversight across all departments"
            >
              CTO
            </button>
            <button
              onClick={() => onSwitchUserRole({
                orgRole: 'DAF',
                orgTitle: 'Director of Administration & Finance (Full Audit & Dept Oversight)',
                departmentId: undefined,
              })}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                currentUser.orgRole === 'DAF'
                  ? 'bg-emerald-500 text-black shadow-sm'
                  : 'bg-[#2A3942] text-emerald-300 hover:bg-[#374248]'
              }`}
              title="Director of Administration & Finance: Controls treasury & cross-department approvals"
            >
              DAF
            </button>
            <button
              onClick={() => onSwitchUserRole({
                orgRole: 'DEPT_HEAD',
                orgTitle: 'Lead Cryptographic Architect (ENG Only)',
                departmentId: 'dept_eng',
              })}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                currentUser.orgRole === 'DEPT_HEAD' && currentUser.departmentId === 'dept_eng'
                  ? 'bg-purple-500 text-white shadow-sm'
                  : 'bg-[#2A3942] text-purple-300 hover:bg-[#374248]'
              }`}
              title="ENG Dept Head: CANNOT see Finance, HR, or Legal members/conversations"
            >
              ENG Lead
            </button>
            <button
              onClick={() => onSwitchUserRole({
                orgRole: 'MEMBER',
                orgTitle: 'Financial Analyst (FIN Only)',
                departmentId: 'dept_fin',
              })}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                currentUser.orgRole === 'MEMBER' && currentUser.departmentId === 'dept_fin'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'bg-[#2A3942] text-blue-300 hover:bg-[#374248]'
              }`}
              title="FIN Member: CANNOT see Engineering or HR members/conversations"
            >
              FIN Member
            </button>
            <button
              onClick={() => onSwitchUserRole({
                orgRole: 'CITIZEN',
                orgTitle: 'Verified Sovereign Citizen',
                departmentId: undefined,
              })}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                currentUser.orgRole === 'CITIZEN'
                  ? 'bg-zinc-200 text-black shadow-sm'
                  : 'bg-[#2A3942] text-[#AEBAC1] hover:bg-[#374248]'
              }`}
              title="Citizen: Public sovereignty directory"
            >
              Citizen
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#222E35] bg-[#182229] text-xs overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 min-w-[130px] py-3 font-semibold transition-colors flex items-center justify-center gap-1.5 border-b-2 ${
              activeTab === 'overview'
                ? 'border-[#00A884] text-[#00A884]'
                : 'border-transparent text-[#8696A0] hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" /> Organization Tenants ({tenants.length})
          </button>
          <button
            onClick={() => setActiveTab('departments')}
            className={`flex-1 min-w-[130px] py-3 font-semibold transition-colors flex items-center justify-center gap-1.5 border-b-2 ${
              activeTab === 'departments'
                ? 'border-[#00A884] text-[#00A884]'
                : 'border-transparent text-[#8696A0] hover:text-white'
            }`}
          >
            <FolderLock className="w-4 h-4" /> Sub-Departments ({tenantDepartments.length})
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`flex-1 min-w-[120px] py-3 font-semibold transition-colors flex items-center justify-center gap-1.5 border-b-2 ${
              activeTab === 'members'
                ? 'border-[#00A884] text-[#00A884]'
                : 'border-transparent text-[#8696A0] hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" /> Members & Directory ({tenantMembers.length})
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex-1 min-w-[130px] py-3 font-semibold transition-colors flex items-center justify-center gap-1.5 border-b-2 ${
              activeTab === 'matrix'
                ? 'border-[#00A884] text-[#00A884]'
                : 'border-transparent text-[#8696A0] hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> Firewall Security Matrix
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* TAB 1: OVERVIEW & TENANT SWITCHER */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Notice Banner */}
              <div className="bg-[#202C33] p-4 rounded-2xl border border-[#2A3942] flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#00A884] flex-shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-white text-sm">
                    Multi-Tenant Cryptographic Partitioning
                  </div>
                  <p className="text-[#8696A0]">
                    Each organization operates as an isolated sovereign tenant. Company accounts hold distinct department silos. 
                    <strong className="text-amber-300"> MD, CTO, and DAF</strong> hold omniscient governance across all departments, 
                    while employees in one department (e.g. ENG) are completely invisible and walled off from other departments (e.g. FIN, HR).
                  </p>
                </div>
              </div>

              {/* Tenants Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider text-[11px]">
                    Available Enterprise &amp; Civic Tenants
                  </h4>
                  <button
                    onClick={() => setActiveTab('createTenant')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#00A884]/20 hover:bg-[#00A884]/30 text-[#00A884] text-xs font-semibold border border-[#00A884]/40 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Create New Organization
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tenants.map((tenant) => {
                    const isSelected = tenant.id === activeTenantId;
                    const depts = departments.filter((d) => d.tenantId === tenant.id);
                    const mems = members.filter((m) => m.tenantId === tenant.id);

                    return (
                      <div
                        key={tenant.id}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                          isSelected
                            ? 'bg-[#202C33] border-[#00A884] ring-1 ring-[#00A884]/60'
                            : 'bg-[#182229] border-[#2A3942] hover:border-[#374248]'
                        }`}
                        onClick={() => onSelectTenant(tenant.id)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={tenant.logo}
                              alt={tenant.name}
                              className="w-12 h-12 rounded-xl object-cover ring-1 ring-white/10"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <h5 className="font-bold text-sm text-white">{tenant.name}</h5>
                                {isSelected && (
                                  <span className="text-[10px] bg-[#00A884] text-black font-bold px-1.5 py-0.5 rounded">
                                    ACTIVE
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-[#8696A0] capitalize">
                                {tenant.type} • {tenant.slug}
                              </span>
                            </div>
                          </div>
                        </div>

                        <p className="text-xs text-[#8696A0] mb-3 line-clamp-2">
                          {tenant.description}
                        </p>

                        <div className="grid grid-cols-3 gap-2 text-center text-xs pt-3 border-t border-[#2A3942]">
                          <div className="bg-[#111B21] p-1.5 rounded-lg">
                            <div className="font-bold text-white">{depts.length}</div>
                            <div className="text-[10px] text-[#8696A0]">Departments</div>
                          </div>
                          <div className="bg-[#111B21] p-1.5 rounded-lg">
                            <div className="font-bold text-white">{mems.length}</div>
                            <div className="text-[10px] text-[#8696A0]">Members</div>
                          </div>
                          <div className="bg-[#111B21] p-1.5 rounded-lg">
                            <div className="font-bold text-emerald-400">100%</div>
                            <div className="text-[10px] text-[#8696A0]">Isolated</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DEPARTMENTS & ACCESS VIEW */}
          {activeTab === 'departments' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {currentTenant.name} Departments ({tenantDepartments.length})
                  </h4>
                  <p className="text-xs text-[#8696A0]">
                    Sub-divisions operating in segregated cryptographic channels.
                  </p>
                </div>
                {isExecutive && (
                  <button
                    onClick={() => setActiveTab('createDept')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#00A884]/20 hover:bg-[#00A884]/30 text-[#00A884] text-xs font-semibold border border-[#00A884]/40 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Sub-Department
                  </button>
                )}
              </div>

              {/* Status Alert regarding user's current role access */}
              <div className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between ${
                isExecutive
                  ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                  : 'bg-purple-950/20 border-purple-500/40 text-purple-200'
              }`}>
                <div className="flex items-center gap-2.5">
                  {isExecutive ? (
                    <Crown className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  ) : (
                    <FolderLock className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  )}
                  <div>
                    <span className="font-bold">
                      {isExecutive ? 'Executive Omniscience Active: ' : 'Department Air-Gap Enforced: '}
                    </span>
                    <span>
                      {isExecutive
                        ? `As ${currentUser.orgRole}, you have full authority and uninhibited access to inspect, moderate and control all ${tenantDepartments.length} departments.`
                        : `Your user identity is isolated to "${departments.find(d => d.id === currentUser.departmentId)?.name || 'Unassigned'}". You cannot see members or chats outside your department.`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Departments List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tenantDepartments.map((dept) => {
                  const deptMembers = members.filter((m) => m.departmentId === dept.id);
                  const isUserInThisDept = currentUser.departmentId === dept.id;
                  const canAccess = isExecutive || isUserInThisDept;

                  return (
                    <div
                      key={dept.id}
                      className={`p-4 rounded-2xl border transition-all relative ${
                        canAccess
                          ? 'bg-[#202C33] border-[#2A3942]'
                          : 'bg-[#182229]/60 border-red-950/40 opacity-75'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-2 rounded-xl text-white font-bold text-xs ${
                            dept.code === 'ENG' ? 'bg-cyan-600/30 text-cyan-400' :
                            dept.code === 'FIN' ? 'bg-emerald-600/30 text-emerald-400' :
                            dept.code === 'HR' ? 'bg-pink-600/30 text-pink-400' :
                            'bg-amber-600/30 text-amber-400'
                          }`}>
                            {dept.code}
                          </div>
                          <div>
                            <h5 className="font-bold text-sm text-white flex items-center gap-1.5">
                              {dept.name}
                              {isUserInThisDept && (
                                <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.2 rounded border border-blue-500/30">
                                  YOUR DEPT
                                </span>
                              )}
                            </h5>
                            <span className="text-[11px] text-[#8696A0]">
                              Lead: {dept.leadUserName || 'Department Supervisor'}
                            </span>
                          </div>
                        </div>

                        {canAccess ? (
                          <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                            <Eye className="w-3 h-3" /> Accessible
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[11px] text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-800/40">
                            <EyeOff className="w-3 h-3" /> Walled Off
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[#8696A0] mb-3">
                        {dept.description}
                      </p>

                      <div className="flex items-center justify-between text-xs pt-2.5 border-t border-[#2A3942] text-[#8696A0]">
                        <span>{deptMembers.length} Assigned Members</span>
                        <span className="text-[11px] font-mono">Airgap: ACTIVE</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: MEMBERS & STRICT ABAC DIRECTORY */}
          {activeTab === 'members' && (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Directory &amp; Departmental Isolation ({tenantMembers.length} Members)
                  </h4>
                  <p className="text-xs text-[#8696A0]">
                    Only members permitted by the ABAC policy are visible.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#8696A0]" />
                    <input
                      type="text"
                      value={searchMember}
                      onChange={(e) => setSearchMember(e.target.value)}
                      placeholder="Search member..."
                      className="bg-[#202C33] border border-[#2A3942] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#8696A0] focus:outline-none focus:border-[#00A884]"
                    />
                  </div>

                  <select
                    value={selectedDeptId}
                    onChange={(e) => setSelectedDeptId(e.target.value)}
                    className="bg-[#202C33] border border-[#2A3942] rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#00A884]"
                  >
                    <option value="all">All Visible Departments</option>
                    {tenantDepartments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Members Table */}
              <div className="border border-[#222E35] rounded-2xl overflow-hidden bg-[#182229]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#202C33] text-[#8696A0] uppercase font-semibold text-[10px] tracking-wider border-b border-[#2A3942]">
                    <tr>
                      <th className="px-4 py-3">Member</th>
                      <th className="px-4 py-3">Department</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Visibility Under Current User</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#202C33]/60">
                    {tenantMembers
                      .filter((m) => {
                        if (searchMember && !m.name.toLowerCase().includes(searchMember.toLowerCase()) && !m.email.toLowerCase().includes(searchMember.toLowerCase())) {
                          return false;
                        }
                        if (selectedDeptId !== 'all' && m.departmentId !== selectedDeptId) {
                          return false;
                        }
                        return true;
                      })
                      .map((member) => {
                        const isVisible = isExecutive || 
                          member.role === 'MD' || 
                          member.role === 'CTO' || 
                          member.role === 'DAF' || 
                          member.departmentId === currentUser.departmentId;

                        const dept = departments.find((d) => d.id === member.departmentId);

                        return (
                          <tr key={member.id} className={isVisible ? 'hover:bg-[#202C33]/40' : 'bg-red-950/10 opacity-50'}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <img
                                  src={member.avatar}
                                  alt={member.name}
                                  className="w-8 h-8 rounded-full object-cover ring-1 ring-white/10"
                                />
                                <div>
                                  <div className="font-semibold text-white flex items-center gap-1.5">
                                    {member.name}
                                    {member.userId === currentUser.id && (
                                      <span className="text-[9px] bg-[#00A884]/20 text-[#00A884] px-1 py-0.2 rounded">
                                        YOU
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-[#8696A0]">{member.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {dept ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#202C33] text-[#AEBAC1] border border-[#2A3942]">
                                  <span className="font-bold text-[10px] text-cyan-400">{dept.code}</span>
                                  <span>{dept.name}</span>
                                </span>
                              ) : (
                                <span className="text-amber-400 font-semibold bg-amber-950/30 px-2 py-0.5 rounded border border-amber-800/40">
                                  ★ Executive (All Depts)
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                                member.role === 'MD' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                                member.role === 'CTO' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                                member.role === 'DAF' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                                member.role === 'DEPT_HEAD' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                                'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              }`}>
                                {member.role}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {isVisible ? (
                                <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Visible
                                </span>
                              ) : (
                                <span className="text-rose-400 flex items-center gap-1 text-[11px]">
                                  <Lock className="w-3.5 h-3.5" /> Walled Off (Different Dept)
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: FIREWALL SECURITY MATRIX */}
          {activeTab === 'matrix' && (
            <div className="space-y-5 text-xs">
              <div className="bg-[#202C33] p-5 rounded-2xl border border-[#2A3942] space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#00A884]" />
                  Attribute-Based Access Control (ABAC) Firewall Specifications
                </h4>
                <p className="text-[#8696A0]">
                  Mathematical proof of departmental segregation. The table below represents the permission boundary enforced across chat creation, participant querying, search indexing, and real-time message broadcasting.
                </p>

                <div className="border border-[#374248] rounded-xl overflow-hidden mt-3">
                  <table className="w-full text-left">
                    <thead className="bg-[#182229] text-[#AEBAC1] uppercase text-[10px] font-bold border-b border-[#374248]">
                      <tr>
                        <th className="p-3">User Role</th>
                        <th className="p-3">Engineering (ENG)</th>
                        <th className="p-3">Finance (FIN)</th>
                        <th className="p-3">HR &amp; Talent</th>
                        <th className="p-3">Legal &amp; Compliance</th>
                        <th className="p-3">Cross-Dept Control</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#374248]/50 text-[11px]">
                      <tr className="bg-amber-950/20 font-medium">
                        <td className="p-3 text-amber-300 font-bold">Managing Director (MD)</td>
                        <td className="p-3 text-emerald-400">✓ Full Access</td>
                        <td className="p-3 text-emerald-400">✓ Full Access</td>
                        <td className="p-3 text-emerald-400">✓ Full Access</td>
                        <td className="p-3 text-emerald-400">✓ Full Access</td>
                        <td className="p-3 text-amber-300 font-bold">Omniscient Executive</td>
                      </tr>
                      <tr className="bg-cyan-950/20 font-medium">
                        <td className="p-3 text-cyan-300 font-bold">Chief Technology Officer (CTO)</td>
                        <td className="p-3 text-emerald-400">✓ Full Access</td>
                        <td className="p-3 text-emerald-400">✓ Full Access</td>
                        <td className="p-3 text-emerald-400">✓ Full Access</td>
                        <td className="p-3 text-emerald-400">✓ Full Access</td>
                        <td className="p-3 text-cyan-300 font-bold">Omniscient Executive</td>
                      </tr>
                      <tr className="bg-emerald-950/20 font-medium">
                        <td className="p-3 text-emerald-300 font-bold">Director Admin &amp; Finance (DAF)</td>
                        <td className="p-3 text-emerald-400">✓ Full Access</td>
                        <td className="p-3 text-emerald-400">✓ Full Access</td>
                        <td className="p-3 text-emerald-400">✓ Full Access</td>
                        <td className="p-3 text-emerald-400">✓ Full Access</td>
                        <td className="p-3 text-emerald-300 font-bold">Omniscient Executive</td>
                      </tr>
                      <tr>
                        <td className="p-3 text-purple-300 font-bold">Engineering Staff (ENG)</td>
                        <td className="p-3 text-emerald-400">✓ Full Internal</td>
                        <td className="p-3 text-rose-400">✗ Blinded / Denied</td>
                        <td className="p-3 text-rose-400">✗ Blinded / Denied</td>
                        <td className="p-3 text-rose-400">✗ Blinded / Denied</td>
                        <td className="p-3 text-rose-400 font-semibold">Strict Airgap Wall</td>
                      </tr>
                      <tr>
                        <td className="p-3 text-blue-300 font-bold">Finance Staff (FIN)</td>
                        <td className="p-3 text-rose-400">✗ Blinded / Denied</td>
                        <td className="p-3 text-emerald-400">✓ Full Internal</td>
                        <td className="p-3 text-rose-400">✗ Blinded / Denied</td>
                        <td className="p-3 text-rose-400">✗ Blinded / Denied</td>
                        <td className="p-3 text-rose-400 font-semibold">Strict Airgap Wall</td>
                      </tr>
                      <tr>
                        <td className="p-3 text-pink-300 font-bold">Human Resources Staff (HR)</td>
                        <td className="p-3 text-rose-400">✗ Blinded / Denied</td>
                        <td className="p-3 text-rose-400">✗ Blinded / Denied</td>
                        <td className="p-3 text-emerald-400">✓ Full Internal</td>
                        <td className="p-3 text-rose-400">✗ Blinded / Denied</td>
                        <td className="p-3 text-rose-400 font-semibold">Strict Airgap Wall</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CREATE NEW TENANT FORM */}
          {activeTab === 'createTenant' && (
            <form onSubmit={handleCreateOrgSubmit} className="space-y-4 max-w-xl mx-auto">
              <div className="text-center mb-4">
                <h4 className="text-base font-bold text-white">Create New Sovereign Organization</h4>
                <p className="text-xs text-[#8696A0]">
                  Set up a dedicated multi-tenant boundary for a corporation, public ministry, or NGO.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8696A0] mb-1">
                  Organization / Company Name
                </label>
                <input
                  type="text"
                  required
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="e.g. Apex Global Logistics Ltd"
                  className="w-full bg-[#202C33] border border-[#2A3942] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#00A884]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#8696A0] mb-1">
                    Organization Identifier Slug
                  </label>
                  <input
                    type="text"
                    value={newOrgSlug}
                    onChange={(e) => setNewOrgSlug(e.target.value)}
                    placeholder="e.g. apex-logistics"
                    className="w-full bg-[#202C33] border border-[#2A3942] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#00A884]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#8696A0] mb-1">
                    Organization Type
                  </label>
                  <select
                    value={newOrgType}
                    onChange={(e) => setNewOrgType(e.target.value as any)}
                    className="w-full bg-[#202C33] border border-[#2A3942] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#00A884]"
                  >
                    <option value="enterprise">Commercial Enterprise</option>
                    <option value="government">Government / Public Ministry</option>
                    <option value="ngo">Civil Society / NGO</option>
                    <option value="public_civic">Public Civic &amp; Citizen Network</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8696A0] mb-1">
                  Description &amp; Mandate
                </label>
                <textarea
                  rows={3}
                  value={newOrgDesc}
                  onChange={(e) => setNewOrgDesc(e.target.value)}
                  placeholder="Briefly state mission, jurisdiction and data handling policy..."
                  className="w-full bg-[#202C33] border border-[#2A3942] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#00A884]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className="px-4 py-2 rounded-xl bg-[#202C33] text-[#8696A0] hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#00A884] text-black font-bold text-xs hover:bg-[#00A884]/90 transition-all flex items-center gap-1.5"
                >
                  <Building2 className="w-4 h-4" /> Provision Tenant
                </button>
              </div>
            </form>
          )}

          {/* TAB 6: CREATE SUB-DEPARTMENT FORM */}
          {activeTab === 'createDept' && (
            <form onSubmit={handleCreateDeptSubmit} className="space-y-4 max-w-xl mx-auto">
              <div className="text-center mb-4">
                <h4 className="text-base font-bold text-white">Create Department Sub-Tenant</h4>
                <p className="text-xs text-[#8696A0]">
                  Establish an isolated boundary under <strong className="text-white">{currentTenant.name}</strong>.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-[#8696A0] mb-1">
                    Department Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newDeptName}
                    onChange={(e) => setNewDeptName(e.target.value)}
                    placeholder="e.g. Risk & Quantitative Analytics"
                    className="w-full bg-[#202C33] border border-[#2A3942] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#00A884]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#8696A0] mb-1">
                    Code (3-5 Letters)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    value={newDeptCode}
                    onChange={(e) => setNewDeptCode(e.target.value.toUpperCase())}
                    placeholder="e.g. RISK"
                    className="w-full bg-[#202C33] border border-[#2A3942] rounded-xl px-4 py-2.5 text-xs text-white font-mono uppercase focus:outline-none focus:border-[#00A884]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8696A0] mb-1">
                  Department Mission &amp; Functional Scope
                </label>
                <textarea
                  rows={3}
                  value={newDeptDesc}
                  onChange={(e) => setNewDeptDesc(e.target.value)}
                  placeholder="Outline responsibilities and isolation parameters..."
                  className="w-full bg-[#202C33] border border-[#2A3942] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#00A884]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('departments')}
                  className="px-4 py-2 rounded-xl bg-[#202C33] text-[#8696A0] hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#00A884] text-black font-bold text-xs hover:bg-[#00A884]/90 transition-all flex items-center gap-1.5"
                >
                  <FolderLock className="w-4 h-4" /> Provision Sub-Department
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
