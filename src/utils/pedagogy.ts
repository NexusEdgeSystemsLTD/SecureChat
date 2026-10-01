import { StudentTier } from '../types';

/**
 * High-precision on-device pedagogical response synthesizer
 * Ensures immediate, uninterrupted mentoring guidance across tiers even during network offline states.
 */
export function getPedagogicalMentorReply(
  tier: StudentTier,
  fieldOfStudy: string,
  prompt: string,
  persona: 'research' | 'career' | 'stem' | 'general' = 'research'
): string {
  const p = prompt.toLowerCase();
  const discipline = fieldOfStudy || 'Computational & Mathematical Sciences';

  if (p.includes('thesis') || p.includes('research') || p.includes('paper') || p.includes('novelty') || p.includes('publish') || persona === 'research') {
    return `### 🔬 Research Mentorship & Academic Strategy (${tier})
**Specialization**: ${discipline}

1. **Novelty Isolation & Thesis Framing**:
   - Establish exactly what constraints prior publications operated under that you are relaxing.
   - Formulate your mathematical or empirical hypothesis:
     $$\\mathcal{H}_0: \\Delta_{\\text{metric}} \\le 0 \\quad \\text{vs.} \\quad \\mathcal{H}_1: \\Delta_{\\text{metric}} > \\epsilon$$
   - Clearly delineate between theoretical contribution (bounds, complexity) and empirical contribution (speedup, accuracy).

2. **Literature Matrix & Competitive Positioning**:
   - Synthesize the top 5 papers from flagship venues (ACM, IEEE, NeurIPS, SOSP, Nature).
   - Create an explicit comparison table: Assumptions $\\times$ Threat Models $\\times$ Benchmarks.

3. **Reproducible Experimental Protocol**:
   - Fix deterministic random seeds, isolate cache thrashing, and document environment containerization (Docker/Nix).
   - Report confidence intervals with at least 5 independent runs: $\\mu \\pm 1.96 \\cdot \\frac{\\sigma}{\\sqrt{n}}$.

4. **Actionable Milestone for This Week**:
   - Write a 250-word structured abstract covering: *Problem Statement, Identified Gap, Proposed Method, Key Expected Result, and Societal/Field Significance.*`;
  }

  if (p.includes('career') || p.includes('interview') || p.includes('job') || p.includes('internship') || persona === 'career') {
    return `### 🚀 Accelerated Career Development Blueprint (${tier})
**Track**: ${discipline} • Senior Systems & Technical Leadership

1. **High-Signal Proof of Work**:
   - Elite tech companies and research labs look for production-grade execution rather than tutorial clones.
   - Deliver 2 end-to-end artifacts with automated test suites, performance benchmarks, and clear architecture diagrams.

2. **Technical Interview Mastery**:
   - **Data Structures & Algorithms**: Master core recurring paradigms (Two Pointers, Monotonic Stacks, Union-Find, DP on Trees).
   - **System Design & Scale**: Always articulate throughput vs. latency trade-offs, database replication topology, and cache invalidation mechanics.

3. **Faculty & Industry Network Velocity**:
   - Send concise, high-value 3-sentence notes to Engineering Directors or Principal Investigators highlighting how your code or benchmark resolves an open problem in their repository.

4. **Actionable Step**:
   - Revamp your CV/Resume with quantifiable metrics: *"Architected X which yielded Y% throughput gain under constraint Z."*`;
  }

  return `### 🎓 Personalized Learning & Outperformance Blueprint
**Academic Level**: ${tier} • **Field**: ${discipline}

1. **First-Principles Axiomatic Derivation**:
   - Rather than superficial memorization, derive theorems and core primitives from ground truth.
   - Build minimal proof-of-concept implementations from scratch to deeply understand memory and execution trade-offs.

2. **Active Recall & Feynman Consolidation**:
   - Explain complex concepts in simple terms without consulting reference materials.
   - Formulate timed self-tests under exam or thesis defense conditions.

3. **Immediate Next Step**:
   - Feel free to share a specific theorem, code snippet, or thesis chapter draft for an in-depth peer review!`;
}
