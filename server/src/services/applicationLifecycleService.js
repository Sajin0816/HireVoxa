/**
 * Centralized Application Lifecycle State Machine & Transition Rules
 * Enforces authoritative status transitions and business logic across Hirevoxa recruitment workflow.
 */

export const APPLICATION_STATUSES = [
  'Submitted',
  'Under Review',
  'Shortlisted',
  'Interview',
  'Offered',
  'Hired',
  'Rejected',
  'Withdrawn'
];

export const TERMINAL_STATUSES = ['Hired', 'Rejected', 'Withdrawn'];

const ALLOWED_COMPANY_TRANSITIONS = {
  'Submitted': ['Under Review', 'Shortlisted', 'Rejected'],
  'Under Review': ['Shortlisted', 'Interview', 'Rejected'],
  'Shortlisted': ['Interview', 'Offered', 'Rejected'],
  'Interview': ['Offered', 'Rejected', 'Shortlisted'],
  'Offered': ['Hired', 'Rejected'],
  'Hired': [],
  'Rejected': [],
  'Withdrawn': []
};

const ALLOWED_CANDIDATE_TRANSITIONS = {
  'Submitted': ['Withdrawn'],
  'Under Review': ['Withdrawn'],
  'Shortlisted': ['Withdrawn'],
  'Interview': ['Withdrawn'],
  'Offered': ['Hired', 'Withdrawn'], // Candidate can accept offer (Hired) or decline/withdraw
  'Hired': [],
  'Rejected': [],
  'Withdrawn': []
};

/**
 * Validates whether a requested transition is permitted based on current status and user role.
 * Throws an Error with a clear explanation if invalid.
 */
export function validateStatusTransition(currentStatus, targetStatus, role) {
  if (!APPLICATION_STATUSES.includes(targetStatus)) {
    throw new Error(`Invalid target application status "${targetStatus}". Allowed statuses: ${APPLICATION_STATUSES.join(', ')}.`);
  }

  if (currentStatus === targetStatus) {
    throw new Error(`Application is already in status "${currentStatus}".`);
  }

  if (TERMINAL_STATUSES.includes(currentStatus)) {
    throw new Error(`Application is in terminal state "${currentStatus}" and cannot be transitioned.`);
  }

  const allowed = role === 'candidate'
    ? ALLOWED_CANDIDATE_TRANSITIONS[currentStatus] || []
    : ALLOWED_COMPANY_TRANSITIONS[currentStatus] || [];

  if (!allowed.includes(targetStatus)) {
    throw new Error(
      `Role "${role}" cannot transition application from "${currentStatus}" to "${targetStatus}". Allowed next stages: ${
        allowed.length > 0 ? allowed.join(', ') : 'None (Terminal stage)'
      }.`
    );
  }

  return true;
}

/**
 * Checks if an application can be withdrawn by a candidate.
 */
export function canCandidateWithdraw(currentStatus) {
  return !TERMINAL_STATUSES.includes(currentStatus);
}
