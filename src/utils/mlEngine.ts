import { CognitiveProfile, ContentSuggestion, StudentTier, TopicAffinity } from '../types';

/**
 * Client-Side Privacy-Preserving ML Interest & Cognitive Learning Profiler
 * Zero-telemetry: Learns user academic inclinations, preferred topics, and study habits
 * purely inside the browser or via authenticated zero-knowledge server endpoints.
 */

const ACADEMIC_TOPIC_TAXONOMY: Array<{ name: string; category: string; keywords: string[] }> = [
  {
    name: 'End-to-End Cryptography & Security',
    category: 'Computer Science',
    keywords: ['encryption', 'e2ee', 'aes', 'gcm', 'signal', 'cipher', 'cryptography', 'zero-knowledge', 'hash', 'security', 'privacy', 'tor'],
  },
  {
    name: 'Deep Learning & Neural Architectures',
    category: 'AI & Data Science',
    keywords: ['neural', 'transformer', 'deep learning', 'weights', 'loss', 'backprop', 'embedding', 'attention', 'gradient', 'ml', 'ai', 'llm'],
  },
  {
    name: 'Doctoral Research & Thesis Formulation',
    category: 'Academic Research',
    keywords: ['thesis', 'dissertation', 'phd', 'post-phd', 'literature', 'peer review', 'conference', 'journal', 'abstract', 'methodology'],
  },
  {
    name: 'STEM Mathematics & Formal Proofs',
    category: 'Mathematics',
    keywords: ['proof', 'calculus', 'linear algebra', 'theorem', 'latex', 'matrix', 'eigenvector', 'integral', 'differential', 'topology'],
  },
  {
    name: 'Career Milestones & Engineering Leadership',
    category: 'Career Acceleration',
    keywords: ['interview', 'internship', 'resume', 'cv', 'career', 'promotion', 'salary', 'system design', 'offer', 'portfolio', 'tech lead'],
  },
  {
    name: 'Grants, Fellowships & University Admissions',
    category: 'Fellowships & Higher Ed',
    keywords: ['fellowship', 'grant', 'nsf', 'fulbright', 'admissions', 'sat', 'act', 'ap', 'gre', 'scholarship', 'proposal', 'funding'],
  },
  {
    name: 'Distributed Systems & Cloud Architecture',
    category: 'Systems Engineering',
    keywords: ['distributed', 'consensus', 'raft', 'p2p', 'sharding', 'latency', 'concurrency', 'docker', 'kubernetes', 'cloud'],
  },
];

export const INITIAL_COGNITIVE_PROFILE: CognitiveProfile = {
  interests: [
    { name: 'End-to-End Cryptography & Security', category: 'Computer Science', score: 0.94, interactedCount: 28 },
    { name: 'Deep Learning & Neural Architectures', category: 'AI & Data Science', score: 0.89, interactedCount: 22 },
    { name: 'Doctoral Research & Thesis Formulation', category: 'Academic Research', score: 0.82, interactedCount: 17 },
    { name: 'Grants, Fellowships & University Admissions', category: 'Fellowships & Higher Ed', score: 0.76, interactedCount: 14 },
    { name: 'Career Milestones & Engineering Leadership', category: 'Career Acceleration', score: 0.71, interactedCount: 11 },
  ],
  cognitiveTendencies: [
    'First-Principles Rigorous Deduction',
    'Mathematical Modeling & Formal Verification',
    'Systems-Level Architectural Synthesis',
  ],
  personalizedSuggestions: [
    {
      id: 'sug-1',
      title: 'Signal Protocol & AES-256-GCM Double Ratchet Breakdown',
      tier: 'University (Bachelor / Masters)',
      category: 'Cryptographic Systems',
      description: 'In-depth derivation of key agreement, forward secrecy, and break-in recovery with interactive diagrams.',
      actionUrl: '#security-protocol',
      matchScore: 98,
    },
    {
      id: 'sug-2',
      title: 'NeurIPS & ICML High-Impact Paper Framing Guide',
      tier: 'Masters / PhD / Post-PhD',
      category: 'Research Mentorship',
      description: 'Structuring novel empirical results, baseline ablation studies, and theoretical contribution proofs.',
      actionUrl: '#academic-mentor',
      matchScore: 94,
    },
    {
      id: 'sug-3',
      title: 'Pre-Doctoral & Post-Doctoral National Fellowship Radar',
      tier: 'PhD / Post-PhD',
      category: 'Fellowships & Grants',
      description: 'Active grant cycles, intellectual merit criteria, and broader impacts narrative templates.',
      actionUrl: '#grants',
      matchScore: 89,
    },
    {
      id: 'sug-4',
      title: 'Elite University Admissions & STEM Olympiad Masterclass',
      tier: 'High School / Early Undergrad',
      category: 'Admissions & Competitions',
      description: 'Competitive mathematics roadmap, research fair participation, and distinctive portfolio building.',
      actionUrl: '#admissions',
      matchScore: 85,
    },
  ],
  careerRoadmapMilestone: {
    phase: 'Phase 2: High-Impact Specialization & Technical Publications',
    milestone: 'Deliver 1 Peer-Reviewed Artifact & Production Open-Source System',
    recommendedAction: 'Finalize benchmark suite on distributed testbed and submit extended abstract.',
  },
  lastUpdated: Date.now(),
};

/**
 * Analyzes a text message locally to update the user's topic affinity scores
 */
export function updateProfileLocally(
  profile: CognitiveProfile,
  messageText: string
): CognitiveProfile {
  const lower = messageText.toLowerCase();
  const updatedInterests: TopicAffinity[] = [...profile.interests];

  ACADEMIC_TOPIC_TAXONOMY.forEach((tax) => {
    let matches = 0;
    tax.keywords.forEach((kw) => {
      if (lower.includes(kw)) matches++;
    });

    if (matches > 0) {
      const existingIdx = updatedInterests.findIndex((i) => i.name === tax.name);
      if (existingIdx >= 0) {
        const item = updatedInterests[existingIdx];
        const newCount = item.interactedCount + matches;
        const newScore = Math.min(0.99, Number((item.score + matches * 0.03).toFixed(2)));
        updatedInterests[existingIdx] = {
          ...item,
          score: newScore,
          interactedCount: newCount,
        };
      } else {
        updatedInterests.push({
          name: tax.name,
          category: tax.category,
          score: Math.min(0.85, 0.4 + matches * 0.1),
          interactedCount: matches,
        });
      }
    }
  });

  // Sort descending by score
  updatedInterests.sort((a, b) => b.score - a.score);

  return {
    ...profile,
    interests: updatedInterests.slice(0, 7),
    lastUpdated: Date.now(),
  };
}

/**
 * Returns curriculum roadmap suggestions based on student tier
 */
export function getCurriculumRoadmap(tier: StudentTier): Array<{
  stage: string;
  focus: string;
  skills: string[];
  recommendedOutput: string;
  status: 'completed' | 'in_progress' | 'upcoming';
}> {
  switch (tier) {
    case 'High School':
      return [
        {
          stage: 'Step 1: STEM Foundations & AP/IB Mastery',
          focus: 'Calculus BC, Physics C, AP Computer Science A, Chemistry',
          skills: ['Differential Calculus', 'Object-Oriented Design', 'Mechanics', 'Scientific Writing'],
          recommendedOutput: '5 on AP Exams / 7 on IB HL Courses',
          status: 'completed',
        },
        {
          stage: 'Step 2: Competitive Math & National Olympiads',
          focus: 'AMC 10/12, AIME qualification, USACO Silver/Gold',
          skills: ['Combinatorics', 'Number Theory', 'Dynamic Programming', 'Graph Search'],
          recommendedOutput: 'AIME Distinction & USACO Gold standing',
          status: 'in_progress',
        },
        {
          stage: 'Step 3: High School Research & College Applications',
          focus: 'ISEF / Regeneron STS / MIT THINK Research Project',
          skills: ['Literature Survey', 'Experimental Protocol', 'Personal Statement', 'Faculty Outreach'],
          recommendedOutput: 'Original science fair paper & Common App portfolio',
          status: 'upcoming',
        },
      ];

    case 'Bachelor':
      return [
        {
          stage: 'Year 1-2: Core Systems, Algorithms & Discrete Math',
          focus: 'Data Structures, Computer Architecture, Discrete Math, Linear Algebra',
          skills: ['C/C++', 'Algorithm Complexity (O)', 'Multithreading', 'Vector Calculus'],
          recommendedOutput: 'Top GPA & Undergraduate Teaching Assistantship',
          status: 'completed',
        },
        {
          stage: 'Year 3: Industrial Internships & Lab Research Assistant',
          focus: 'SWE Intern at Tier-1 tech or Research Assistant in Faculty Lab',
          skills: ['Full-Stack Systems', 'Cloud CI/CD', 'Git workflow', 'Lab Benchmarks'],
          recommendedOutput: 'Return internship offer + co-authored conference workshop paper',
          status: 'in_progress',
        },
        {
          stage: 'Year 4: Senior Capstone & Graduate School / Industry Launch',
          focus: 'Production open-source capstone, GRE (if required), Senior Thesis',
          skills: ['Architecture Documentation', 'System Scale', 'Technical Interviewing'],
          recommendedOutput: 'Graduation with Honors & Graduate Fellowship / L4 Tech Offer',
          status: 'upcoming',
        },
      ];

    case 'Masters':
      return [
        {
          stage: 'Semester 1-2: Advanced Graduate Seminars & Foundations',
          focus: 'Deep Learning Theory, Cryptographic Protocols, Distributed Consensus',
          skills: ['Empirical Rigor', 'Paper Critiques', 'Mathematical Derivations'],
          recommendedOutput: 'A-grades across qualifying coursework',
          status: 'completed',
        },
        {
          stage: 'Semester 3: Master Thesis Formulation & Novelty Isolation',
          focus: 'Identify research gap, formulate hypothesis, run baseline ablations',
          skills: ['LaTeX / BibTeX', 'Baseline Implementation', 'Ablation Testing'],
          recommendedOutput: 'Approved Thesis Proposal & First Workshop Submission',
          status: 'in_progress',
        },
        {
          stage: 'Semester 4: Master Thesis Defense & Transition to PhD / R&D',
          focus: 'Formal thesis defense, publication at IEEE/ACM, PhD lab admissions',
          skills: ['Public Defense Oratory', 'Camera-Ready Formatting', 'Patent / Tech Transfer'],
          recommendedOutput: 'Defended M.S. Thesis + First-author publication',
          status: 'upcoming',
        },
      ];

    case 'PhD':
      return [
        {
          stage: 'Year 1-2: Qualifying Exams & Literature Mastery',
          focus: 'Pass departmental quals, exhaustive domain survey, preliminary papers',
          skills: ['Comprehensive Literature Review', 'Theoretical Proofs', 'Advisor Alignment'],
          recommendedOutput: 'Passed PhD Candidacy Qualifying Exams',
          status: 'completed',
        },
        {
          stage: 'Year 3-4: Major Contributions & Flagship Conference Papers',
          focus: 'Multiple top-tier papers (NeurIPS, ICML, SOSP, USENIX, Nature, Crypto)',
          skills: ['Major Empirical Pipeline', 'Peer Review Response / Rebuttals', 'Grant Writing'],
          recommendedOutput: '3+ First-Author Flagship Publications with High Citation Impact',
          status: 'in_progress',
        },
        {
          stage: 'Year 5: Doctoral Dissertation Defense & Academic/Lab Job Market',
          focus: 'Collate dissertation, job talks at universities and research labs',
          skills: ['Job Talk Presentation', 'Research Statement', 'Teaching Portfolio'],
          recommendedOutput: 'Doctorate of Philosophy conferred + Faculty Tenure-Track / Research Scientist Offer',
          status: 'upcoming',
        },
      ];

    case 'Post-PhD':
      return [
        {
          stage: 'Phase 1: Post-Doctoral Independence & Multi-Lab Collaborations',
          focus: 'Drive independent research agenda distinct from doctoral advisor',
          skills: ['Inter-institutional Collaborations', 'Mentoring Junior PhDs', 'High-Risk High-Reward Explorations'],
          recommendedOutput: 'Signature independent publication line',
          status: 'completed',
        },
        {
          stage: 'Phase 2: Major Grant Winning & Lab Setup (NSF CAREER / ERC)',
          focus: 'Secure multi-year government and foundation research grants ($500k - $2M+)',
          skills: ['Grant Strategy & Broader Impacts', 'Budget Management', 'Equipment Procurement'],
          recommendedOutput: 'Funded Research Grant & Principal Investigator Status',
          status: 'in_progress',
        },
        {
          stage: 'Phase 3: Lab Direction, Spin-off Ventures & Global Thought Leadership',
          focus: 'Lead 10+ member research group, spin off deep-tech startups, keynote conferences',
          skills: ['Lab Culture & Ph.D. Placement', 'Venture Capital IP Transfer', 'Keynote Oratory'],
          recommendedOutput: 'Tenured Chair Professorship or Chief Scientist at Frontier AI Lab',
          status: 'upcoming',
        },
      ];
  }
}
