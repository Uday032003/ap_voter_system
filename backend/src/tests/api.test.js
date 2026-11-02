process.env.NODE_ENV = 'test';

import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import app from '../server.js';
import { dbService } from '../services/dbService.js';
import { pool } from '../config/db.js';

let server;
let baseUrl;

test.before(async () => {
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  if (pool) await pool.end();
});

// Helper for HTTP requests
async function api(path, options = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

test('1. System Health Check', async () => {
  const res = await api('/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.data.status, 'healthy');
});

test('2. Authentication Flow & Role Verification (Real Credential Hashes)', async () => {
  // Super Admin Login
  const adminRes = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@apvoters.gov.in', password: 'Admin@123' })
  });
  assert.equal(adminRes.status, 200);
  assert.equal(adminRes.data.user.role, 'super_admin');
  assert.ok(adminRes.data.token);

  // Leader Login
  const leaderRes = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'leader.atmakuru@apvoters.gov.in', password: 'Leader@123' })
  });
  assert.equal(leaderRes.status, 200);
  assert.equal(leaderRes.data.user.role, 'leader');
  assert.ok(leaderRes.data.user.approvedConstituencies.length > 0);

  // Citizen / Commoner Login
  const citizenRes = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'citizen.guntur@apvoters.gov.in', password: 'Citizen@123' })
  });
  assert.equal(citizenRes.status, 200);
  assert.equal(citizenRes.data.user.role, 'commoner');
});

test('3. New Hierarchy (District -> Assembly -> MPTC Village)', async () => {
  const res = await api('/api/geography/districts');
  assert.equal(res.status, 200);
  assert.ok(res.data.data.length > 0);

  const assembliesRes = await api('/api/geography/assemblies');
  assert.equal(assembliesRes.status, 200);
  assert.ok(assembliesRes.data.data.length > 0);

  const mptcsRes = await api('/api/geography/mptcs');
  assert.equal(mptcsRes.status, 200);
  assert.ok(mptcsRes.data.data.length > 0);
});

test('4. Security & Constituency Access Control for Leader', async () => {
  const leaderRes = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'leader.atmakuru@apvoters.gov.in', password: 'Leader@123' })
  });
  const leaderToken = leaderRes.data.token;

  // Approved constituency: Atmakuru MPTC - 04 (c1111111-0000-0000-0000-000000000001) -> 200 OK
  const approvedAccess = await api('/api/voters?constituencyId=c1111111-0000-0000-0000-000000000001', {
    headers: { Authorization: `Bearer ${leaderToken}` }
  });
  assert.equal(approvedAccess.status, 200);
  assert.ok(approvedAccess.data.records.length > 0);

  // Unauthorized constituency: Nutakki MPTC - 05 (c1111111-0000-0000-0000-000000000002) -> 403 Forbidden
  const forbiddenAccess = await api('/api/voters?constituencyId=c1111111-0000-0000-0000-000000000002', {
    headers: { Authorization: `Bearer ${leaderToken}` }
  });
  assert.equal(forbiddenAccess.status, 403);
});

test('5. Commoner Directory Access & Restrictions', async () => {
  const citizenRes = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'citizen.guntur@apvoters.gov.in', password: 'Citizen@123' })
  });
  const citizenToken = citizenRes.data.token;

  // Commoner can view voters for their constituency
  const votersRes = await api('/api/voters?constituencyId=c1111111-0000-0000-0000-000000000001', {
    headers: { Authorization: `Bearer ${citizenToken}` }
  });
  assert.equal(votersRes.status, 200);

  // Commoner cannot access admin routes (e.g. /api/admin/dashboard-stats) -> 403 Forbidden
  const adminRes = await api('/api/admin/dashboard-stats', {
    headers: { Authorization: `Bearer ${citizenToken}` }
  });
  assert.equal(adminRes.status, 403);
});

test('6. Touch-Friendly Add to My List & Leader Added Voters Persistence', async () => {
  const leaderRes = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'leader.atmakuru@apvoters.gov.in', password: 'Leader@123' })
  });
  const token = leaderRes.data.token;

  // Get real voter from approved constituency
  const votersRes = await api('/api/voters?constituencyId=c1111111-0000-0000-0000-000000000001', {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.ok(votersRes.data.records.length > 0);
  const targetVoter = votersRes.data.records[0];

  // 1. Leader adds voter to list
  const markRes = await api(`/api/voters/${targetVoter.id}/mark`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ notes: 'Follow-up for roll verification' })
  });
  assert.equal(markRes.status, 200);
  assert.equal(markRes.data.is_added, true);

  // 2. Added record appears in Leader Added Voters
  const addedRes = await api('/api/leader/added-voters', {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(addedRes.status, 200);
  assert.ok(addedRes.data.records.some(r => r.id === targetVoter.id));

  // 3. Remove voter from list
  const unmarkRes = await api(`/api/voters/${targetVoter.id}/mark`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(unmarkRes.status, 200);
  assert.equal(unmarkRes.data.is_added, false);
});
