// Hirevoxa Reusable API Client
// Connects to Express backend with environment variable configuration and auth token handling

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

function getToken() {
  return localStorage.getItem('hirevoxa_token');
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers
    });

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

  // Interviews
  getInterviews: () => request('/interviews'),
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
  getReportsMetrics: () => request('/reports/metrics')
};
