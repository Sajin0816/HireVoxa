/**
 * Hirevoxa Deterministic Candidate-Job Matching Service
 * 
 * METHODOLOGY & SCORING DOCUMENTATION:
 * This rule-based matching engine deterministically evaluates candidate suitability against open job requisitions.
 * It is completely non-discriminatory and never considers nationality, age, gender, race, photos, or protected attributes.
 *
 * Scoring Breakdown (Total: 100 points, normalized to 10.0 scale):
 * 1. Technical Skill Overlap (Max 50 points):
 *    - Compares job required skills against candidate skills (case-insensitive).
 *    - Score = (matched skills / total required skills) * 50
 * 2. Experience Fit (Max 25 points):
 *    - Compares candidate years of experience against job minimum requirement.
 *    - Meets or exceeds: 25 points
 *    - 1 year below: 15 points
 *    - 2 years below: 8 points
 *    - >2 years below: 0 points
 * 3. Availability Timing (Max 15 points):
 *    - Immediate: 15 points
 *    - 2 Weeks: 11 points
 *    - 1 Month: 6 points
 *    - Other/Unspecified: 5 points
 * 4. Employment Preference Alignment (Max 10 points):
 *    - Exact match with job employment type: 10 points
 *    - Flexible or partial match: 6 points
 *    - Mismatched: 2 points
 */

export function calculateCandidateJobMatch(candidate, job) {
  if (!candidate || !job) {
    return {
      score: 0.0,
      matchedSkills: [],
      missingSkills: job?.requiredSkills || [],
      breakdown: {
        skillScore: 0,
        experienceScore: 0,
        availabilityScore: 0,
        preferenceScore: 0
      },
      methodology: 'Rule-based deterministic matching (non-AI)'
    };
  }

  const jobSkills = Array.isArray(job.requiredSkills) ? job.requiredSkills : [];
  const candSkills = Array.isArray(candidate.skills) ? candidate.skills : [];

  // 1. Skill Overlap (50 points max)
  const normalizedCandSkills = candSkills.map(s => s.trim().toLowerCase());
  const matchedSkills = [];
  const missingSkills = [];

  jobSkills.forEach(reqSkill => {
    const cleanSkill = reqSkill.trim();
    if (normalizedCandSkills.includes(cleanSkill.toLowerCase())) {
      matchedSkills.push(cleanSkill);
    } else {
      missingSkills.push(cleanSkill);
    }
  });

  const skillRatio = jobSkills.length > 0 ? matchedSkills.length / jobSkills.length : 1;
  const skillScore = Math.round(skillRatio * 50);

  // 2. Experience Fit (25 points max)
  const candExp = Number(candidate.yearsOfExperience) || 0;
  const reqExp = Number(job.minimumExperience) || 0;
  let experienceScore = 0;

  if (candExp >= reqExp) {
    experienceScore = 25;
  } else if (reqExp - candExp === 1) {
    experienceScore = 15;
  } else if (reqExp - candExp === 2) {
    experienceScore = 8;
  } else {
    experienceScore = 0;
  }

  // 3. Availability (15 points max)
  let availabilityScore = 5;
  const avail = (candidate.availability || '').toLowerCase();
  if (avail.includes('immediate')) {
    availabilityScore = 15;
  } else if (avail.includes('2 week')) {
    availabilityScore = 11;
  } else if (avail.includes('month')) {
    availabilityScore = 6;
  }

  // 4. Employment Preference Alignment (10 points max)
  let preferenceScore = 4;
  const candPref = (candidate.employmentPreference || '').toLowerCase();
  const jobPref = (job.employmentType || '').toLowerCase();

  if (candPref === jobPref || candPref === 'any') {
    preferenceScore = 10;
  } else if (candPref === 'contract' && jobPref === 'part-time') {
    preferenceScore = 7;
  }

  const rawTotal = skillScore + experienceScore + availabilityScore + preferenceScore;
  const normalizedScore = Number((rawTotal / 10).toFixed(1));

  return {
    score: normalizedScore,
    matchedSkills,
    missingSkills,
    breakdown: {
      skillScore,
      experienceScore,
      availabilityScore,
      preferenceScore,
      rawTotal
    },
    methodology: 'Rule-based deterministic matching (non-AI)'
  };
}

export function rankCandidatesForJob(candidates, job) {
  return candidates
    .map(candidate => {
      const match = calculateCandidateJobMatch(candidate, job);
      return {
        candidate,
        jobId: job._id,
        jobTitle: job.title,
        ...match
      };
    })
    .sort((a, b) => b.score - a.score);
}
