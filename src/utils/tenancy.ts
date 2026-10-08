import { Department, OrganizationTenant, OrgMember, UserProfile } from '../types';

export const INITIAL_TENANTS: OrganizationTenant[] = [
  {
    id: 'tenant_nexusedge',
    name: 'NexusEdge Systems Ltd',
    slug: 'nexusedge',
    type: 'enterprise',
    logo: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=120&auto=format&fit=crop&q=80',
    description: 'High-security multi-national defense tech, cryptography & distributed software solutions.',
    executiveUsers: {
      mdId: 'user_alex_md',
      ctoId: 'user_marcus_cto',
      dafId: 'user_elena_daf',
    },
    departmentCount: 4,
    totalMembers: 18,
    createdAt: Date.now() - 86400000 * 45,
    enforceDepartmentIsolation: true,
  },
  {
    id: 'tenant_civic',
    name: 'National Civic & Digital Public Infrastructure',
    slug: 'civic-public',
    type: 'government',
    logo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=120&auto=format&fit=crop&q=80',
    description: 'Sovereign communication gateway for public citizens, community leaders & municipal bureaus.',
    executiveUsers: {
      mdId: 'user_civic_md',
      ctoId: 'user_civic_cto',
      dafId: 'user_civic_daf',
    },
    departmentCount: 3,
    totalMembers: 12,
    createdAt: Date.now() - 86400000 * 90,
    enforceDepartmentIsolation: true,
  },
];

export const INITIAL_DEPARTMENTS: Department[] = [
  // NexusEdge Systems Departments
  {
    id: 'dept_eng',
    tenantId: 'tenant_nexusedge',
    name: 'Software & Cryptographic Engineering',
    code: 'ENG',
    description: 'Core protocol developers, zero-knowledge research, rust/wasm backend, and security review.',
    leadUserId: 'user_marcus_cto',
    leadUserName: 'Dr. Marcus Wei (CTO)',
    memberCount: 5,
    createdAt: Date.now() - 86400000 * 40,
  },
  {
    id: 'dept_fin',
    tenantId: 'tenant_nexusedge',
    name: 'Finance & Asset Accounting',
    code: 'FIN',
    description: 'Corporate treasury, payroll disbursement, audit compliance, financial forecasting.',
    leadUserId: 'user_elena_daf',
    leadUserName: 'Elena Vance (DAF)',
    memberCount: 4,
    createdAt: Date.now() - 86400000 * 40,
  },
  {
    id: 'dept_hr',
    tenantId: 'tenant_nexusedge',
    name: 'Human Resources & Talent',
    code: 'HR',
    description: 'Global talent sourcing, onboarding, confidential employee relations & benefits management.',
    leadUserId: 'user_sarah_hr',
    leadUserName: 'Sarah Connor (HR Lead)',
    memberCount: 4,
    createdAt: Date.now() - 86400000 * 38,
  },
  {
    id: 'dept_legal',
    tenantId: 'tenant_nexusedge',
    name: 'Legal, Compliance & Data Sovereignty',
    code: 'LEG',
    description: 'Contract management, GDPR/regional regulatory compliance, patent prosecution.',
    leadUserId: 'user_david_legal',
    leadUserName: 'David K. (Chief Counsel)',
    memberCount: 3,
    createdAt: Date.now() - 86400000 * 35,
  },

  // National Civic Departments
  {
    id: 'dept_civic_registry',
    tenantId: 'tenant_civic',
    name: 'Civil Registry & Digital ID Services',
    code: 'REG',
    description: 'Public biometric registration verification, passport and identity credential lifecycle.',
    leadUserId: 'user_civic_reg_head',
    leadUserName: 'Director Amina (Registry)',
    memberCount: 4,
    createdAt: Date.now() - 86400000 * 85,
  },
  {
    id: 'dept_civic_health',
    tenantId: 'tenant_civic',
    name: 'Public Health & Epidemiology',
    code: 'HLT',
    description: 'Community health clinics, emergency vaccine distribution, hospital coordination.',
    leadUserId: 'user_civic_health_head',
    leadUserName: 'Dr. Robert (Health Dept Head)',
    memberCount: 5,
    createdAt: Date.now() - 86400000 * 80,
  },
  {
    id: 'dept_civic_finance',
    tenantId: 'tenant_civic',
    name: 'Revenue, Grants & Civic Treasury (DAF)',
    code: 'TREAS',
    description: 'Municipal budget allocations, public service subsidies, and vendor disbursements.',
    leadUserId: 'user_civic_daf',
    leadUserName: 'Hon. Miriam (Civic DAF)',
    memberCount: 3,
    createdAt: Date.now() - 86400000 * 80,
  },
];

export const INITIAL_MEMBERS: OrgMember[] = [
  // NexusEdge Executives (Omniscient view across all departments)
  {
    id: 'member_1',
    userId: 'user_master_001',
    tenantId: 'tenant_nexusedge',
    name: 'Alex Thorne',
    email: 'alex.thorne@nexusedge.io',
    role: 'MD',
    title: 'Managing Director & CEO',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    status: 'active',
    phone: '+1 (555) 019-2834',
  },
  {
    id: 'member_2',
    userId: 'user_marcus_cto',
    tenantId: 'tenant_nexusedge',
    name: 'Dr. Marcus Wei',
    email: 'marcus.wei@nexusedge.io',
    role: 'CTO',
    title: 'Chief Technology Officer',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    status: 'active',
    phone: '+1 (555) 992-1049',
  },
  {
    id: 'member_3',
    userId: 'user_elena_daf',
    tenantId: 'tenant_nexusedge',
    name: 'Elena Vance',
    email: 'elena.vance@nexusedge.io',
    role: 'DAF',
    title: 'Director of Administration & Finance (DAF)',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    status: 'active',
    phone: '+1 (555) 481-9204',
  },

  // Department Members (Strictly isolated: ENG cannot see FIN, FIN cannot see HR)
  // --- ENG Department
  {
    id: 'member_eng_1',
    userId: 'user_turing_advisor',
    tenantId: 'tenant_nexusedge',
    departmentId: 'dept_eng',
    name: 'Dr. Alan Turing',
    email: 'alan.turing@nexusedge.io',
    role: 'DEPT_HEAD',
    title: 'Principal Cryptographic Architect',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    status: 'active',
    phone: '+1 (555) 773-1029',
  },
  {
    id: 'member_eng_2',
    userId: 'user_kevin_eng',
    tenantId: 'tenant_nexusedge',
    departmentId: 'dept_eng',
    name: 'Kevin Zhao',
    email: 'kevin.zhao@nexusedge.io',
    role: 'MEMBER',
    title: 'Senior Distributed Systems Engineer',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
    status: 'active',
    phone: '+1 (555) 302-8192',
  },
  {
    id: 'member_eng_3',
    userId: 'user_maya_eng',
    tenantId: 'tenant_nexusedge',
    departmentId: 'dept_eng',
    name: 'Maya Lin',
    email: 'maya.lin@nexusedge.io',
    role: 'MEMBER',
    title: 'Zero-Knowledge Protocol Engineer',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
    status: 'active',
    phone: '+1 (555) 819-2041',
  },

  // --- FIN Department
  {
    id: 'member_fin_1',
    userId: 'user_julian_fin',
    tenantId: 'tenant_nexusedge',
    departmentId: 'dept_fin',
    name: 'Julian Sterling',
    email: 'julian.sterling@nexusedge.io',
    role: 'DEPT_HEAD',
    title: 'Senior Treasury & Audit Lead',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
    status: 'active',
    phone: '+1 (555) 601-2940',
  },
  {
    id: 'member_fin_2',
    userId: 'user_clara_fin',
    tenantId: 'tenant_nexusedge',
    departmentId: 'dept_fin',
    name: 'Clara Oswald',
    email: 'clara.oswald@nexusedge.io',
    role: 'MEMBER',
    title: 'Disbursement & Financial Analyst',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
    status: 'active',
    phone: '+1 (555) 912-3849',
  },

  // --- HR Department
  {
    id: 'member_hr_1',
    userId: 'user_sarah',
    tenantId: 'tenant_nexusedge',
    departmentId: 'dept_hr',
    name: 'Sarah Connor',
    email: 'sarah.connor@nexusedge.io',
    role: 'DEPT_HEAD',
    title: 'Director of Human Resources',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
    status: 'active',
    phone: '+1 (555) 492-1038',
  },
  {
    id: 'member_hr_2',
    userId: 'user_liam_hr',
    tenantId: 'tenant_nexusedge',
    departmentId: 'dept_hr',
    name: 'Liam Hemsworth',
    email: 'liam.h@nexusedge.io',
    role: 'MEMBER',
    title: 'Talent Acquisition & Culture Specialist',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
    status: 'active',
    phone: '+1 (555) 203-9182',
  },

  // --- Legal Department
  {
    id: 'member_leg_1',
    userId: 'user_david_legal',
    tenantId: 'tenant_nexusedge',
    departmentId: 'dept_legal',
    name: 'David Kim',
    email: 'david.kim@nexusedge.io',
    role: 'DEPT_HEAD',
    title: 'General Counsel & Compliance Officer',
    avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=200&auto=format&fit=crop&q=80',
    status: 'active',
    phone: '+1 (555) 774-8831',
  },

  // Citizen / Public Users (Belong to Public Civic or Independent)
  {
    id: 'member_civic_1',
    userId: 'user_hs_student',
    tenantId: 'tenant_civic',
    departmentId: 'dept_civic_registry',
    name: 'Fatima Al-Mansoor',
    email: 'fatima.scholar@civic.gov',
    role: 'MEMBER',
    title: 'Civic Research Scholar & Student Delegate',
    avatar: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=200&auto=format&fit=crop&q=80',
    status: 'active',
    phone: '+1 (555) 910-2849',
  },
  {
    id: 'member_civic_2',
    userId: 'user_civic_citizen',
    tenantId: 'tenant_civic',
    name: 'Citizen Kofi Mensah',
    email: 'kofi.mensah@civic.gov',
    role: 'CITIZEN',
    title: 'Verified Sovereign Citizen',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
    status: 'active',
    phone: '+233 24 102 9384',
  },
];

const TENANCY_STORAGE_KEYS = {
  TENANTS: 'securechat_org_tenants',
  DEPARTMENTS: 'securechat_org_departments',
  MEMBERS: 'securechat_org_members',
  CURRENT_TENANT_ID: 'securechat_active_tenant_id',
};

export function loadTenants(): OrganizationTenant[] {
  try {
    const raw = localStorage.getItem(TENANCY_STORAGE_KEYS.TENANTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load tenants', e);
  }
  return INITIAL_TENANTS;
}

export function saveTenants(tenants: OrganizationTenant[]): void {
  localStorage.setItem(TENANCY_STORAGE_KEYS.TENANTS, JSON.stringify(tenants));
}

export function loadDepartments(): Department[] {
  try {
    const raw = localStorage.getItem(TENANCY_STORAGE_KEYS.DEPARTMENTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load departments', e);
  }
  return INITIAL_DEPARTMENTS;
}

export function saveDepartments(depts: Department[]): void {
  localStorage.setItem(TENANCY_STORAGE_KEYS.DEPARTMENTS, JSON.stringify(depts));
}

export function loadMembers(): OrgMember[] {
  try {
    const raw = localStorage.getItem(TENANCY_STORAGE_KEYS.MEMBERS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load members', e);
  }
  return INITIAL_MEMBERS;
}

export function saveMembers(members: OrgMember[]): void {
  localStorage.setItem(TENANCY_STORAGE_KEYS.MEMBERS, JSON.stringify(members));
}

export function loadActiveTenantId(): string {
  try {
    const raw = localStorage.getItem(TENANCY_STORAGE_KEYS.CURRENT_TENANT_ID);
    if (raw) return raw;
  } catch (e) {
    console.error('Failed to load active tenant id', e);
  }
  return 'tenant_nexusedge';
}

export function saveActiveTenantId(id: string): void {
  localStorage.setItem(TENANCY_STORAGE_KEYS.CURRENT_TENANT_ID, id);
}

/**
 * Access Control Evaluator (ABAC / Multi-Tenant Isolation):
 *
 * Rules:
 * 1. Global Executives (MD, CTO, DAF):
 *    - Have full cross-departmental visibility and control over all departments within their tenant.
 *    - Can see members, chats, audits, and metrics from ENG, FIN, HR, LEGAL, etc.
 *
 * 2. Department Heads & Department Members:
 *    - Strictly bounded to their own assigned department (`departmentId`).
 *    - CANNOT see, list, search, or message any user or chat belonging to a DIFFERENT department.
 *    - "make sure none from any other department gets to see anyone from other department"
 *
 * 3. Citizens:
 *    - Public portal access only, cannot see internal enterprise departments unless explicitly federated.
 */
export function canUserAccessDepartment(user: UserProfile, targetDepartmentId?: string): boolean {
  if (!targetDepartmentId) return true; // Global or non-departmental resource

  // MD, CTO, and DAF have omniscient authority across all departments within their organization
  if (user.orgRole === 'MD' || user.orgRole === 'CTO' || user.orgRole === 'DAF') {
    return true;
  }

  // Department members can ONLY access their own department
  return user.departmentId === targetDepartmentId;
}

export function canUserSeeMember(currentUser: UserProfile, targetMember: OrgMember): boolean {
  // If in different tenants, cannot see unless citizen public directory
  if (currentUser.tenantId && targetMember.tenantId && currentUser.tenantId !== targetMember.tenantId) {
    return false;
  }

  // Global executives (MD, CTO, DAF) see EVERYONE in their tenant
  if (currentUser.orgRole === 'MD' || currentUser.orgRole === 'CTO' || currentUser.orgRole === 'DAF') {
    return true;
  }

  // Target is an executive? Non-executives can see executives to communicate upward
  if (targetMember.role === 'MD' || targetMember.role === 'CTO' || targetMember.role === 'DAF') {
    return true;
  }

  // Same department? Allowed
  if (currentUser.departmentId && targetMember.departmentId && currentUser.departmentId === targetMember.departmentId) {
    return true;
  }

  // Strict departmental wall: Users from different departments CANNOT see each other
  return false;
}
