// Authoritative Server-Side Pricing & Entitlements Configuration
// Hirevoxa Monetization Engine — Phase 5
// All monetary values are maintained in integer minor units (cents) to avoid floating-point errors.

export const PRICING_CONFIG = {
  version: '1.0.0',
  currency: 'USD',
  updatedAt: '2026-10-30T00:00:00Z',

  // Candidate Plan: Free Forever ($0)
  CANDIDATE: {
    tier: 'free',
    name: 'Candidate Free Forever',
    priceCents: 0,
    priceFormatted: '$0',
    billingInterval: null,
    entitlements: {
      profileCreation: true,
      jobDiscovery: true,
      jobApplications: true,
      applicationTracking: true,
      interviewParticipation: true,
      messaging: true,
      feeForCandidate: 0
    },
    description: 'Candidates will never be charged to join, apply, or interview on Hirevoxa.'
  },

  // Employer Starter Plan: Free Pilot ($0 to start)
  EMPLOYER_STARTER: {
    tier: 'starter',
    name: 'Employer Starter Pilot',
    priceCents: 0,
    priceFormatted: '$0',
    billingInterval: null,
    isPilot: true,
    limits: {
      maxActiveJobs: 5,
      candidateSearchTier: 'standard',
      savedTalentLimit: 10,
      teamMembersLimit: 2,
      analyticsTier: 'basic',
      csvExport: false
    },
    description: 'Pilot access for qualified hiring teams to evaluate Hirevoxa talent matching.'
  },

  // Employer Pro Plan: $199 USD / Month
  EMPLOYER_PRO: {
    tier: 'pro',
    name: 'Employer Pro Subscription',
    priceCents: 19900, // $199.00 USD
    priceFormatted: '$199',
    billingInterval: 'month',
    isPilot: false,
    limits: {
      maxActiveJobs: 50,
      candidateSearchTier: 'advanced', // multi-filter, salary, timezone overlap
      savedTalentLimit: 500,
      teamMembersLimit: 10,
      analyticsTier: 'advanced',
      csvExport: true,
      prioritySupport: true
    },
    description: 'For growing organizations hiring Latin American engineering talent at scale.'
  },

  // Successful Placement Fee: $2,500 USD per qualifying hire
  SUCCESSFUL_PLACEMENT: {
    feeCents: 250000, // $2,500.00 USD
    feeFormatted: '$2,500',
    currency: 'USD',
    guaranteePeriodDays: 90, // 90-day replacement policy
    triggerEvent: 'Application.status === "Hired"',
    description: 'Payable only upon confirmed hiring placement, backed by a 90-day replacement guarantee.',
    termsVersion: 'HVX-TOS-2026-V1'
  }
};

export const SUBSCRIPTION_STATUSES = [
  'pending',
  'active',
  'past_due',
  'cancelled',
  'expired'
];

export const PLACEMENT_FEE_STATUSES = [
  'not_eligible',
  'eligible',
  'invoiced',
  'paid',
  'waived',
  'disputed'
];

export const INVOICE_STATUSES = [
  'draft',
  'open',
  'paid',
  'void',
  'uncollectible'
];

/**
 * Format integer minor units (cents) to standard USD string
 * @param {number} cents
 * @returns {string} e.g. "$2,500.00"
 */
export function formatCentsToUSD(cents) {
  if (typeof cents !== 'number' || isNaN(cents)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(cents / 100);
}

/**
 * Sanitize and validate fee amounts (must be positive integer minor units)
 * @param {number} cents
 * @returns {boolean}
 */
export function isValidMinorUnitAmount(cents) {
  return Number.isInteger(cents) && cents >= 0;
}
