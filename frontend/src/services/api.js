// Production & Local Dynamic API Base:
// 1. Reads VITE_API_URL if configured (e.g., https://your-backend.onrender.com or https://your-backend.onrender.com/api)
// 2. Falls back to '/api' for local Vite dev proxy and relative deployments
const rawApiUrl = (import.meta.env.VITE_API_URL || '').trim();
const API_BASE = rawApiUrl
  ? (rawApiUrl.endsWith('/api') ? rawApiUrl.replace(/\/+$/, '') : `${rawApiUrl.replace(/\/+$/, '')}/api`)
  : '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('ap_voters_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = data.message || `Request failed with status ${res.status}`;
    throw new Error(errorMsg);
  }
  return data;
}

export const api = {
  // ==========================================
  // AUTH
  // ==========================================
  async login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return handleResponse(res);
  },

  async register(userData) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return handleResponse(res);
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // ==========================================
  // GEOGRAPHY & HIERARCHY
  // State (AP) -> District -> Assembly -> MPTC Village
  // ==========================================
  async getDistricts() {
    const res = await fetch(`${API_BASE}/geography/districts`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async getAssemblies(districtId) {
    const query = districtId ? `?district_id=${districtId}` : '';
    const res = await fetch(`${API_BASE}/geography/assemblies${query}`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async getMptcs(assemblyId, districtId) {
    const params = new URLSearchParams();
    if (assemblyId) params.append('assembly_id', assemblyId);
    if (districtId) params.append('district_id', districtId);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE}/geography/mptcs${query}`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async getConstituencyHierarchy() {
    const res = await fetch(`${API_BASE}/constituencies/hierarchy`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async getConstituency(id) {
    const res = await fetch(`${API_BASE}/constituencies/${id}`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  // User Constituency Selection Persistence
  async getUserConstituencySelection() {
    const res = await fetch(`${API_BASE}/geography/user-selection`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async saveUserConstituencySelection(mptcVillageConstituencyId) {
    const res = await fetch(`${API_BASE}/geography/user-selection`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ mptc_village_constituency_id: mptcVillageConstituencyId })
    });
    return handleResponse(res);
  },

  // Super Admin Constituency Management
  async createDistrict(data) {
    const res = await fetch(`${API_BASE}/constituencies/districts`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async updateDistrict(id, data) {
    const res = await fetch(`${API_BASE}/constituencies/districts/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async createAssembly(data) {
    const res = await fetch(`${API_BASE}/constituencies/assemblies`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async updateAssembly(id, data) {
    const res = await fetch(`${API_BASE}/constituencies/assemblies/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async createMptc(data) {
    const res = await fetch(`${API_BASE}/constituencies/mptcs`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async updateMptc(id, data) {
    const res = await fetch(`${API_BASE}/constituencies/mptcs/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  // ==========================================
  // SUPER ADMIN DASHBOARD & CSV IMPORT
  // ==========================================
  async getAdminDashboardStats() {
    const res = await fetch(`${API_BASE}/admin/dashboard-stats`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async validateImportCsv(file, mptcConstituencyId) {
    const token = localStorage.getItem('ap_voters_token');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mptc_village_constituency_id', mptcConstituencyId);

    const res = await fetch(`${API_BASE}/imports/validate`, {
      method: 'POST',
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: formData
    });
    return handleResponse(res);
  },

  async confirmImport(payload) {
    const res = await fetch(`${API_BASE}/imports/confirm`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  async getImportHistory() {
    const res = await fetch(`${API_BASE}/imports/history`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async getImportErrors(jobId) {
    const res = await fetch(`${API_BASE}/imports/errors/${jobId}`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  // ==========================================
  // VOTERS DIRECTORY (Commoner, Leader, Super Admin)
  // ==========================================
  async getVoters(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/voters?${query}`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async getSections(params = {}) {
    const query = new URLSearchParams(params).toString();
    const qStr = query ? `?${query}` : '';
    const res = await fetch(`${API_BASE}/voters/sections${qStr}`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async getVoter(id) {
    const res = await fetch(`${API_BASE}/voters/${id}`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async updateVoter(id, updates) {
    const res = await fetch(`${API_BASE}/voters/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates)
    });
    return handleResponse(res);
  },

  // ==========================================
  // LEADER SPECIFIC
  // ==========================================
  async getLeaderDashboardStats(constituencyId = null) {
    const query = constituencyId ? `?constituencyId=${constituencyId}` : '';
    const res = await fetch(`${API_BASE}/leader/dashboard-stats${query}`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async getAddedVoters(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/leader/added-voters?${query}`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async addVoterToList(voterId, notes = null) {
    const res = await fetch(`${API_BASE}/leader/added-voters`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ voter_id: voterId, notes })
    });
    return handleResponse(res);
  },

  async removeVoterFromList(voterId) {
    const res = await fetch(`${API_BASE}/leader/added-voters/${voterId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // ==========================================
  // LEADER ACCESS REQUESTS
  // ==========================================
  async submitAccessRequest(data) {
    const res = await fetch(`${API_BASE}/access-requests`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async getAccessRequests() {
    const res = await fetch(`${API_BASE}/access-requests`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  async approveAccessRequest(id, review_notes = '') {
    const res = await fetch(`${API_BASE}/access-requests/${id}/approve`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ review_notes })
    });
    return handleResponse(res);
  },

  async rejectAccessRequest(id, review_notes = '') {
    const res = await fetch(`${API_BASE}/access-requests/${id}/reject`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ review_notes })
    });
    return handleResponse(res);
  },

  async revokeAccess(leaderId, mptcConstituencyId) {
    const res = await fetch(`${API_BASE}/access-requests/revoke`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ leader_id: leaderId, mptc_village_constituency_id: mptcConstituencyId })
    });
    return handleResponse(res);
  },

  // ==========================================
  // AUDIT LOGS
  // ==========================================
  async getAuditLogs(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/audit-logs?${query}`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  // ==========================================
  // PUBLIC PORTAL
  // ==========================================
  async getPublicVoters(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/public/voters?${query}`);
    return handleResponse(res);
  },

  async getPublicConstituencyInfo(id) {
    const res = await fetch(`${API_BASE}/public/constituency-info/${id}`);
    return handleResponse(res);
  }
};
