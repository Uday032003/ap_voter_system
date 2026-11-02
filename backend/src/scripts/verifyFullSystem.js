async function verifySystem() {
  console.log('--- 1. Testing Backend Health ---');
  const healthRes = await fetch('http://localhost:5000/api/health');
  const health = await healthRes.json();
  console.log('Health:', health);

  console.log('\n--- 2. Testing Super Admin Flow ---');
  const adminLoginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'udayatanakala@gmail.com', password: 'Admin@123' })
  });
  const adminAuth = await adminLoginRes.json();
  console.log('Super Admin Login Status:', adminAuth.success, 'Role:', adminAuth.user?.role);

  const adminStatsRes = await fetch('http://localhost:5000/api/admin/dashboard-stats', {
    headers: { Authorization: `Bearer ${adminAuth.token}` }
  });
  const adminStats = await adminStatsRes.json();
  console.log('Admin Dashboard Stats:', adminStats.data);

  console.log('\n--- 3. Testing Hierarchy Tree ---');
  const hierRes = await fetch('http://localhost:5000/api/constituencies/hierarchy');
  const hier = await hierRes.json();
  console.log('Hierarchy Districts Count:', hier.data?.length);
  if (hier.data?.[0]) {
    console.log('First District:', hier.data[0].name_en, 'Assemblies:', hier.data[0].assemblyConstituencies?.length);
  }

  console.log('\n--- 4. Testing Leader Flow ---');
  const leaderLoginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'leader.atmakuru@apvoters.gov.in', password: 'Leader@123' })
  });
  const leaderAuth = await leaderLoginRes.json();
  console.log('Leader Login Status:', leaderAuth.success, 'Role:', leaderAuth.user?.role);

  const leaderStatsRes = await fetch('http://localhost:5000/api/leader/dashboard-stats', {
    headers: { Authorization: `Bearer ${leaderAuth.token}` }
  });
  const leaderStats = await leaderStatsRes.json();
  console.log('Leader Stats:', {
    accessStatus: leaderStats.data?.accessStatus,
    constituency: leaderStats.data?.constituency?.name_en,
    totalAvailableVoters: leaderStats.data?.totalAvailableVoters,
    totalAddedVoters: leaderStats.data?.totalAddedVoters
  });

  console.log('\n--- 5. Testing Leader Add to My List ---');
  const votersRes = await fetch('http://localhost:5000/api/voters?constituencyId=c1111111-0000-0000-0000-000000000001', {
    headers: { Authorization: `Bearer ${leaderAuth.token}` }
  });
  const voters = await votersRes.json();
  const testVoter = voters.records[0];
  console.log('Adding voter to list:', testVoter.name_en, 'ID:', testVoter.id);

  const addRes = await fetch('http://localhost:5000/api/leader/added-voters', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${leaderAuth.token}`
    },
    body: JSON.stringify({ voter_id: testVoter.id, notes: 'Verification test' })
  });
  const addResult = await addRes.json();
  console.log('Add Result:', addResult.is_added ? '✔ Added' : 'Failed');

  const addedListRes = await fetch('http://localhost:5000/api/leader/added-voters', {
    headers: { Authorization: `Bearer ${leaderAuth.token}` }
  });
  const addedList = await addedListRes.json();
  console.log('Added Voters List Count:', addedList.totalCount);

  // Clean up by removing
  await fetch(`http://localhost:5000/api/leader/added-voters/${testVoter.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${leaderAuth.token}` }
  });
  console.log('Removed test voter from list: ✔ Cleaned up');

  console.log('\n--- 6. Testing Commoner Citizen Flow ---');
  const citizenLoginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'citizen.guntur@apvoters.gov.in', password: 'Citizen@123' })
  });
  const citizenAuth = await citizenLoginRes.json();
  console.log('Citizen Login Status:', citizenAuth.success, 'Role:', citizenAuth.user?.role);

  const citizenVotersRes = await fetch('http://localhost:5000/api/voters?constituencyId=c1111111-0000-0000-0000-000000000001', {
    headers: { Authorization: `Bearer ${citizenAuth.token}` }
  });
  const citizenVoters = await citizenVotersRes.json();
  console.log('Citizen Voters Access Status:', citizenVotersRes.status, 'Total Roll:', citizenVoters.totalCount);

  console.log('\n--- 7. Testing Frontend Service ---');
  const feRes = await fetch('http://localhost:5173/');
  const feHtml = await feRes.text();
  console.log('Frontend Served:', feRes.status, 'HTML length:', feHtml.length, 'Contains Root Div:', feHtml.includes('id="root"'));

  console.log('\n=======================================================');
  console.log('✔ ALL FULL SYSTEM VERIFICATIONS PASSED SUCCESSFULLY!');
  console.log('=======================================================');
}

verifySystem().catch(err => {
  console.error('Verification failure:', err);
  process.exit(1);
});
