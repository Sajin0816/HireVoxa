// Hirevoxa Reusable API Client
// Connects to Express backend with environment variable configuration, credentials, and anti-CSRF headers

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (typeof window !== 'undefined' && (window.location.hostname === 'hirevoxa.vercel.app' || window.location.hostname.endsWith('.vercel.app'))) {
    return 'https://hirevoxa-server.vercel.app/api';
  }
  return 'http://localhost:5000/api';
};

const API_BASE_URL = getApiBaseUrl();

function getToken() {
  return localStorage.getItem('hirevoxa_token');
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getToken();

  const headers = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    'X-Requested-With': 'XMLHttpRequest',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const timeoutMs = options.timeoutMs || 15000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  if (options.signal) {
    options.signal.addEventListener('abort', () => controller.abort());
  }

  try {
    const res = await fetch(url, {
      credentials: 'include',
      ...options,
      headers,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg = data?.error || `API error ${res.status}: ${res.statusText}`;
      const error = new Error(errorMsg);
      error.status = res.status;
      error.details = data;
      throw error;
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      const timeoutError = new Error('Request timed out. The server took too long to respond. Please retry.');
      timeoutError.status = 504;
      timeoutError.isTimeout = true;
      console.error(`[API Client] Request to ${endpoint} timed out after ${timeoutMs}ms.`);
      throw timeoutError;
    }

    if (error.message === 'Failed to fetch') {
      const networkError = new Error('Unable to connect to the Hirevoxa server. Please verify your connection or try again shortly.');
      networkError.status = 0;
      networkError.isNetworkError = true;
      console.error(`[API Client] Request to ${endpoint} failed (network connectivity issue):`, error.message);
      throw networkError;
    }

    console.error(`[API Client] Request to ${endpoint} failed:`, error.message);
    throw error;
  }
}

export const api = {
  // System Health
  getHealth: () => request('/health'),

  // Auth
  login: (credentials) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),
  register: (userData) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    }),
  demoLogin: (role = 'company') =>
    request('/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify({ role })
    }),
  logout: () =>
    request('/auth/logout', {
      method: 'POST'
    }),
  getMe: () => request('/auth/me'),

  // Candidates
  getCandidates: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.append(k, v);
    });
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request(`/candidates${qs}`);
  },
  getCandidateById: (id) => request(`/candidates/${id}`),
  getMyProfile: () => request('/candidates/me'),
  updateMyProfile: (profile) => request('/candidates/me', {
    method: 'PATCH',
    body: JSON.stringify(profile)
  }),
  getMyResume: () => request('/candidates/me/resume'),
  uploadMyResume: (file) => {
    const formData = new FormData();
    formData.append('resume', file);
    return request('/candidates/me/resume', { method: 'POST', body: formData });
  },
  deleteMyResume: (id) => request(`/candidates/me/resume/${id}`, { method: 'DELETE' }),
  downloadResume: async (id) => {
    const res = await fetch(`${API_BASE_URL}/candidates/resume/${id}`, {
      credentials: 'include',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {})
      }
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      const error = new Error(data?.error || `API error ${res.status}`);
      error.status = res.status;
      throw error;
    }
    return res.blob();
  },

  // Jobs
  getJobs: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.append(k, v);
    });
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request(`/jobs${qs}`);
  },
  getJobById: (id) => request(`/jobs/${id}`),
  createJob: (jobData) =>
    request('/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData)
    }),
  updateJob: (id, updates) =>
    request(`/jobs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    }),
  deleteJob: (id) =>
    request(`/jobs/${id}`, {
      method: 'DELETE'
    }),

  // Candidate & Company applications
  getApplications: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.append(k, v);
    });
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request(`/applications${qs}`);
  },
  getApplication: (id) => request(`/applications/${id}`),
  submitApplication: (jobId, payload) => request(`/applications`, {
    method: 'POST',
    body: JSON.stringify({ ...payload, jobId })
  }),
  updateApplicationStatus: (id, payload) => request(`/applications/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  }),
  withdrawApplication: (id, reason) => request(`/applications/${id}/withdraw`, {
    method: 'POST',
    body: JSON.stringify({ reason })
  }),
  addApplicationNote: (id, note) => request(`/applications/${id}/notes`, {
    method: 'POST',
    body: JSON.stringify({ note })
  }),

  // Notifications
  getNotifications: () => request('/notifications'),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => request('/notifications/read-all', { method: 'PATCH' }),

  // Interviews
  getInterviews: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.append(k, v);
    });
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request(`/interviews${qs}`);
  },
  createInterview: (interviewData) =>
    request('/interviews', {
      method: 'POST',
      body: JSON.stringify(interviewData)
    }),
  updateInterview: (id, updates) =>
    request(`/interviews/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    }),
  deleteInterview: (id) =>
    request(`/interviews/${id}`, {
      method: 'DELETE'
    }),

  // Matching & Recommendations
  getRecommendations: () => request('/matches/recommendations'),
  getJobMatches: (jobId) => request(`/matches/job/${jobId}`),

  // Shortlists
  getShortlists: (userId) => {
    const qs = userId ? `?userId=${userId}` : '';
    return request(`/shortlists${qs}`);
  },
  toggleShortlist: (payload) =>
    request('/shortlists/toggle', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  // Messages
  getMessages: (conversationId) => {
    const qs = conversationId ? `?conversationId=${conversationId}` : '';
    return request(`/messages${qs}`);
  },
  sendMessage: (payload) =>
    request('/messages', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  // Reports & Metrics
  getReportsMetrics: () => request('/reports/metrics'),

  // Phase 4.5: Secure Operations Admin Endpoints
  getAdminSummary: () => request('/admin/summary'),

  getAdminUsers: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.append(k, v);
    });
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request(`/admin/users${qs}`);
  },
  getAdminUserById: (id) => request(`/admin/users/${id}`),
  updateAdminUserStatus: (id, { status, reason }) =>
    request(`/admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason })
    }),
  updateAdminUserRole: (id, { role, adminRole }) =>
    request(`/admin/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role, adminRole })
    }),

  getAdminCompanies: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.append(k, v);
    });
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request(`/admin/companies${qs}`);
  },
  getAdminCompanyById: (id) => request(`/admin/companies/${id}`),
  verifyAdminCompany: (id, { verificationStatus, reason }) =>
    request(`/admin/companies/${id}/verify`, {
      method: 'PATCH',
      body: JSON.stringify({ verificationStatus, reason })
    }),

  getAdminJobs: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.append(k, v);
    });
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request(`/admin/jobs${qs}`);
  },
  getAdminJobById: (id) => request(`/admin/jobs/${id}`),
  moderateAdminJob: (id, { moderationStatus, reason }) =>
    request(`/admin/jobs/${id}/moderate`, {
      method: 'PATCH',
      body: JSON.stringify({ moderationStatus, reason })
    }),

  getAdminApplications: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.append(k, v);
    });
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request(`/admin/applications${qs}`);
  },

  getAdminAuditLogs: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.append(k, v);
    });
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request(`/admin/audit-logs${qs}`);
  },

  getAdminSupportTickets: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.append(k, v);
    });
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request(`/admin/support-tickets${qs}`);
  },
  getAdminSupportTicketById: (id) => request(`/admin/support-tickets/${id}`),
  createAdminSupportTicket: (ticketData) =>
    request('/admin/support-tickets', {
      method: 'POST',
      body: JSON.stringify(ticketData)
    }),
  updateAdminSupportTicket: (id, updates) =>
    request(`/admin/support-tickets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    }),
  addAdminSupportTicketNote: (id, { note }) =>
    request(`/admin/support-tickets/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ note })
    }),

  getAdminSettings: () => request('/admin/settings'),
  updateAdminSettings: (settingsData) =>
    request('/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify(settingsData)
    }),

  exportAdminReportCsv: async (type) => {
    const url = `${API_BASE_URL}/admin/reports/export/${type}`;
    const token = getToken();
    const res = await fetch(url, {
      credentials: 'include',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    if (!res.ok) {
      throw new Error(`Export failed: ${res.statusText}`);
    }
    return res.blob();
  },

  // Monetization & Billing (Phase 5)
  getPricing: () => request('/pricing'),
  getCompanyBilling: () => request('/billing/company'),
  subscribePro: (payload) =>
    request('/billing/subscribe', {
      method: 'POST',
      body: JSON.stringify(payload || { plan: 'pro' })
    }),
  cancelSubscription: () =>
    request('/billing/cancel', {
      method: 'POST'
    }),
  payPlacementFee: (placementFeeId) =>
    request(`/billing/placements/${placementFeeId}/pay`, {
      method: 'POST'
    }),
  getAdminBillingMetrics: () => request('/billing/admin/metrics'),
  adminGenerateInvoice: (payload) =>
    request('/billing/admin/invoices/generate', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  adminWaivePlacementFee: (id, reason) =>
    request(`/billing/admin/placements/${id}/waive`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    }),
  adminDisputePlacementFee: (id, reason) =>
    request(`/billing/admin/placements/${id}/dispute`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    }),
  exportBillingCsv: async () => {
    const url = `${API_BASE_URL}/billing/admin/export`;
    const token = getToken();
    const res = await fetch(url, {
      credentials: 'include',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    if (!res.ok) {
      throw new Error(`Billing export failed: ${res.statusText}`);
    }
    return res.blob();
  }
};
