const API_BASE = '/api';

const getToken = () => localStorage.getItem('civicproof_token');

export const setToken = (token) => {
  if (token) {
    localStorage.setItem('civicproof_token', token);
  } else {
    localStorage.removeItem('civicproof_token');
  }
};

const request = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = { ...(options.headers || {}) };

  // Don't set Content-Type if body is FormData
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

export const api = {
  // Auth
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  logout: () => {
    setToken(null);
    return request('/auth/logout', { method: 'POST' });
  },
  getMe: () => request('/auth/me'),

  // Incidents
  getIncidents: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/incidents${query ? `?${query}` : ''}`);
  },
  getNearbyIncidents: (lng, lat, radius = 1000, category = '') => {
    const query = new URLSearchParams({ lng, lat, radius, ...(category ? { category } : {}) }).toString();
    return request(`/incidents/nearby?${query}`);
  },
  getIncidentById: (id) => request(`/incidents/${id}`),
  createIncident: (formData) => request('/incidents', { method: 'POST', body: formData }),
  updateIncident: (id, data) => request(`/incidents/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  suggestDuplicate: (id, targetIncidentId, reason) =>
    request(`/incidents/${id}/duplicate-suggestion`, {
      method: 'POST',
      body: JSON.stringify({ targetIncidentId, reason })
    }),
  claimResolution: (id, formData) => request(`/incidents/${id}/claim-resolution`, { method: 'POST', body: formData }),
  verifyResolution: (id, { verdict, note }) =>
    request(`/incidents/${id}/verification`, {
      method: 'POST',
      body: JSON.stringify({ verdict, note })
    }),
  reopenIncident: (id, reason) =>
    request(`/incidents/${id}/reopen`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    }),
  submitFeedback: (id, type, message) =>
    request(`/incidents/${id}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ type, message })
    }),

  // Evidence
  addEvidence: (id, formData) => request(`/incidents/${id}/evidence`, { method: 'POST', body: formData }),
  getIncidentEvidence: (id) => request(`/incidents/${id}/evidence`),

  // Official Complaints & Follow-up Escalation
  recordOfficialComplaint: (id, data) =>
    request(`/incidents/${id}/official-complaints`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  getOfficialComplaints: (id) => request(`/incidents/${id}/official-complaints`),
  updateStatusNote: (complaintId, data) =>
    request(`/official-complaints/${complaintId}/status-note`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),
  createFollowUpPacket: (id) =>
    request(`/incidents/${id}/follow-up-packet`, {
      method: 'POST'
    }),
  getFollowUpPacket: (id, packetId) => request(`/incidents/${id}/follow-up-packet/${packetId}`),

  // Admin & Moderation
  getAdminQueue: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/admin/incidents${query ? `?${query}` : ''}`);
  },
  assignIncident: (id, moderatorId) =>
    request(`/admin/incidents/${id}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ moderatorId })
    }),
  updateStatus: (id, status, note) =>
    request(`/admin/incidents/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note })
    }),
  mergeIncidents: (id, targetIncidentId, note) =>
    request(`/admin/incidents/${id}/merge`, {
      method: 'POST',
      body: JSON.stringify({ targetIncidentId, note })
    }),
  getFeedbackQueue: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/admin/feedback${query ? `?${query}` : ''}`);
  },
  updateFeedbackStatus: (id, status) =>
    request(`/admin/feedback/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }),

  // Dashboard
  getSummary: (days = 30) => request(`/dashboard/summary?days=${days}`),
  getRecurringHotspots: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/dashboard/recurring-hotspots${query ? `?${query}` : ''}`);
  }
};
