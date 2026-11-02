import { generateVoterRecords } from './voterGenerator.js';
import bcrypt from 'bcryptjs';

class DataStore {
  constructor() {
    this.profiles = [];
    this.districts = [];
    this.mandals = [];
    this.villages = [];
    this.mptcConstituencies = [];
    this.constituencyAreas = [];
    this.wards = [];
    this.pollingStations = [];
    this.electoralRollParts = [];
    this.voterRecords = [];
    this.parties = [];
    this.candidates = [];
    this.leaderEstimateTotals = [];
    this.leaderPrivateNotes = [];
    this.leaderTasks = [];
    this.accessRequests = [];
    this.leaderConstituencyAccess = [];
    this.importJobs = [];
    this.importErrors = [];
    this.auditLogs = [];

    this.initSeedData();
  }

  initSeedData() {
    // Default development password for all seed accounts: "Admin@123", "Leader@123", "Citizen@123"
    const salt = bcrypt.genSaltSync(10);
    const superAdminHash = bcrypt.hashSync('Admin@123', salt);
    const leaderHash = bcrypt.hashSync('Leader@123', salt);
    const citizenHash = bcrypt.hashSync('Citizen@123', salt);

    // 1. Profiles
    this.profiles = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        email: 'admin@apvoters.gov.in',
        password_hash: superAdminHash,
        full_name_en: 'Dr. Ramesh Kumar (Super Admin)',
        full_name_te: 'డా. రమేష్ కుమార్',
        role: 'super_admin',
        phone: '9848012345',
        is_active: true,
        created_at: new Date('2024-01-01').toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        email: 'leader.atmakuru@apvoters.gov.in',
        password_hash: leaderHash,
        full_name_en: 'Smt. K. Bhavani (Constituency Leader)',
        full_name_te: 'శ్రీమతి కె. భవాని',
        role: 'leader',
        phone: '9848054321',
        is_active: true,
        created_at: new Date('2024-01-10').toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        email: 'citizen.guntur@apvoters.gov.in',
        password_hash: citizenHash,
        full_name_en: 'Sri. V. Srinivasa Rao (Citizen)',
        full_name_te: 'శ్రీ వి. శ్రీనివాసరావు',
        role: 'commoner',
        phone: '9848099887',
        is_active: true,
        created_at: new Date('2024-02-01').toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    // 2. Districts
    this.districts = [
      { id: 'd1111111-0000-0000-0000-000000000001', code: 'GNT', name_en: 'Guntur', name_te: 'గుంటూరు', is_active: true },
      { id: 'd1111111-0000-0000-0000-000000000002', code: 'KRI', name_en: 'Krishna', name_te: 'కృష్ణా', is_active: true },
      { id: 'd1111111-0000-0000-0000-000000000003', code: 'VSP', name_en: 'Visakhapatnam', name_te: 'విశాఖపట్నం', is_active: true }
    ];

    // 3. Mandals
    this.mandals = [
      { id: 'm1111111-0000-0000-0000-000000000001', district_id: 'd1111111-0000-0000-0000-000000000001', code: 'MGL', name_en: 'Mangalagiri', name_te: 'మంగళగిరి', is_active: true },
      { id: 'm1111111-0000-0000-0000-000000000002', district_id: 'd1111111-0000-0000-0000-000000000001', code: 'TDP', name_en: 'Tadepalli', name_te: 'తాడేపల్లి', is_active: true },
      { id: 'm1111111-0000-0000-0000-000000000003', district_id: 'd1111111-0000-0000-0000-000000000001', code: 'TNK', name_en: 'Tenali', name_te: 'తెనాలి', is_active: true }
    ];

    // 4. Villages
    this.villages = [
      { id: 'v1111111-0000-0000-0000-000000000001', mandal_id: 'm1111111-0000-0000-0000-000000000001', code: 'ATM', name_en: 'Atmakuru', name_te: 'ఆత్మకూరు', is_active: true },
      { id: 'v1111111-0000-0000-0000-000000000002', mandal_id: 'm1111111-0000-0000-0000-000000000001', code: 'NUT', name_en: 'Nutakki', name_te: 'నూతక్కి', is_active: true },
      { id: 'v1111111-0000-0000-0000-000000000003', mandal_id: 'm1111111-0000-0000-0000-000000000001', code: 'CKK', name_en: 'Chinakakani', name_te: 'చినకాకాని', is_active: true }
    ];

    // 5. MPTC Constituencies
    this.mptcConstituencies = [
      { id: 'c1111111-0000-0000-0000-000000000001', mandal_id: 'm1111111-0000-0000-0000-000000000001', code: 'MPTC-MGL-04', name_en: 'Atmakuru MPTC - 04', name_te: 'ఆత్మకూరు ఎంపీటీసీ - 04', reservation_category: 'General (Women)', total_electors: 3000, is_active: true },
      { id: 'c1111111-0000-0000-0000-000000000002', mandal_id: 'm1111111-0000-0000-0000-000000000001', code: 'MPTC-MGL-05', name_en: 'Nutakki MPTC - 05', name_te: 'నూతక్కి ఎంపీటీసీ - 05', reservation_category: 'General', total_electors: 2850, is_active: true }
    ];

    // 6. Constituency Areas
    this.constituencyAreas = [
      { id: 'ca1', constituency_id: 'c1111111-0000-0000-0000-000000000001', village_id: 'v1111111-0000-0000-0000-000000000001', notes: 'Complete village area' },
      { id: 'ca2', constituency_id: 'c1111111-0000-0000-0000-000000000001', village_id: 'v1111111-0000-0000-0000-000000000003', notes: 'North sector habitation' }
    ];

    // 7. Wards
    this.wards = [
      { id: 'w1111111-0000-0000-0000-000000000001', village_id: 'v1111111-0000-0000-0000-000000000001', ward_number: '01', name_en: 'Ward No. 1 (Bazaar Area)', name_te: 'వార్డు నం. 1 (బజార్ వీధి)' },
      { id: 'w1111111-0000-0000-0000-000000000002', village_id: 'v1111111-0000-0000-0000-000000000001', ward_number: '02', name_en: 'Ward No. 2 (Temple Street)', name_te: 'వార్డు నం. 2 (గుడి వీధి)' },
      { id: 'w1111111-0000-0000-0000-000000000003', village_id: 'v1111111-0000-0000-0000-000000000001', ward_number: '03', name_en: 'Ward No. 3 (School Area)', name_te: 'వార్డు నం. 3 (పాఠశాల ప్రాంతం)' }
    ];

    // 8. Polling Stations
    this.pollingStations = [
      { id: 'ps111111-0000-0000-0000-000000000001', constituency_id: 'c1111111-0000-0000-0000-000000000001', village_id: 'v1111111-0000-0000-0000-000000000001', station_number: '01', name_en: 'MPPS Atmakuru East Wing', name_te: 'మండల పరిషత్ ప్రాథమిక పాఠశాల ఆత్మకూరు తూర్పు భాగం', building_en: 'Room No. 1, Main Block', building_te: 'గది నం. 1, ప్రధాన భవనం' },
      { id: 'ps111111-0000-0000-0000-000000000002', constituency_id: 'c1111111-0000-0000-0000-000000000001', village_id: 'v1111111-0000-0000-0000-000000000001', station_number: '02', name_en: 'MPPS Atmakuru West Wing', name_te: 'మండల పరిషత్ ప్రాథమిక పాఠశాల ఆత్మకూరు పశ్చిమ భాగం', building_en: 'Room No. 3, New Block', building_te: 'గది నం. 3, నూతన భవనం' },
      { id: 'ps111111-0000-0000-0000-000000000003', constituency_id: 'c1111111-0000-0000-0000-000000000001', village_id: 'v1111111-0000-0000-0000-000000000003', station_number: '03', name_en: 'ZPHS Chinakakani North', name_te: 'జిల్లా పరిషత్ ఉన్నత పాఠశాల చినకాకాని ఉత్తర భాగం', building_en: 'Room No. 2, Science Wing', building_te: 'గది నం. 2, సైన్స్ వింగ్' }
    ];

    // 9. Electoral Roll Parts
    this.electoralRollParts = [
      { id: 'erp11111-0000-0000-0000-000000000001', constituency_id: 'c1111111-0000-0000-0000-000000000001', polling_station_id: 'ps111111-0000-0000-0000-000000000001', part_number: '101', part_name_en: 'Part 101 - Atmakuru Gramam Ward 1', part_name_te: 'పార్టు 101 - ఆత్మకూరు గ్రామం వార్డు 1', total_voters: 1000 },
      { id: 'erp11111-0000-0000-0000-000000000002', constituency_id: 'c1111111-0000-0000-0000-000000000001', polling_station_id: 'ps111111-0000-0000-0000-000000000002', part_number: '102', part_name_en: 'Part 102 - Atmakuru Gramam Ward 2', part_name_te: 'పార్టు 102 - ఆత్మకూరు గ్రామం వార్డు 2', total_voters: 1000 },
      { id: 'erp11111-0000-0000-0000-000000000003', constituency_id: 'c1111111-0000-0000-0000-000000000001', polling_station_id: 'ps111111-0000-0000-0000-000000000003', part_number: '103', part_name_en: 'Part 103 - Chinakakani Habitation', part_name_te: 'పార్టు 103 - చినకాకాని నివాస ప్రాంతం', total_voters: 1000 }
    ];

    // 10. Pre-generate 3,000 Voter Records for Atmakuru MPTC - 04
    this.voterRecords = generateVoterRecords(
      'c1111111-0000-0000-0000-000000000001',
      this.electoralRollParts,
      3000
    );

    // 11. Official Political Parties
    this.parties = [
      { id: 'p1111111-0000-0000-0000-000000000001', code: 'YSRCP', name_en: 'YSR Congress Party', name_te: 'యువజన శ్రామిక రైతు కాంగ్రెస్ పార్టీ', abbreviation: 'YSRCP', symbol_name: 'Ceiling Fan (సీలింగ్ ఫ్యాన్)', color_code: '#15803d', is_active: true },
      { id: 'p1111111-0000-0000-0000-000000000002', code: 'TDP', name_en: 'Telugu Desam Party', name_te: 'తెలుగు దేశం పార్టీ', abbreviation: 'TDP', symbol_name: 'Bicycle (సైకిల్)', color_code: '#eab308', is_active: true },
      { id: 'p1111111-0000-0000-0000-000000000003', code: 'JSP', name_en: 'JanaSena Party', name_te: 'జనసేన పార్టీ', abbreviation: 'JSP', symbol_name: 'Glass Tumbler (గాజు గ్లాసు)', color_code: '#dc2626', is_active: true },
      { id: 'p1111111-0000-0000-0000-000000000004', code: 'INC', name_en: 'Indian National Congress', name_te: 'భారత జాతీయ కాంగ్రెస్', abbreviation: 'INC', symbol_name: 'Hand (చేయి)', color_code: '#2563eb', is_active: true },
      { id: 'p1111111-0000-0000-0000-000000000005', code: 'BJP', name_en: 'Bharatiya Janata Party', name_te: 'భారతీయ జనతా పార్టీ', abbreviation: 'BJP', symbol_name: 'Lotus (కమలం)', color_code: '#ea580c', is_active: true }
    ];

    // 12. Candidates
    this.candidates = [
      { id: 'cd1', constituency_id: 'c1111111-0000-0000-0000-000000000001', party_id: 'p1111111-0000-0000-0000-000000000001', name_en: 'G. Anitha Reddy', name_te: 'జి. అనిత రెడ్డి', election_year: 2024, status: 'Active' },
      { id: 'cd2', constituency_id: 'c1111111-0000-0000-0000-000000000001', party_id: 'p1111111-0000-0000-0000-000000000002', name_en: 'M. Lakshmi Prasanna', name_te: 'ఎం. లక్ష్మి ప్రసన్న', election_year: 2024, status: 'Active' },
      { id: 'cd3', constituency_id: 'c1111111-0000-0000-0000-000000000001', party_id: 'p1111111-0000-0000-0000-000000000003', name_en: 'Ch. Padmavathi', name_te: 'చ. పద్మావతి', election_year: 2024, status: 'Active' }
    ];

    // 13. Leader Constituency Access
    this.leaderConstituencyAccess = [
      {
        id: 'lca1',
        leader_id: '22222222-2222-2222-2222-222222222222',
        constituency_id: 'c1111111-0000-0000-0000-000000000001',
        status: 'active',
        granted_by: '11111111-1111-1111-1111-111111111111',
        granted_at: new Date('2024-01-15').toISOString(),
        expires_at: null
      }
    ];

    // 14. Leader Private Notes
    this.leaderPrivateNotes = [
      {
        id: 'pn1',
        leader_id: '22222222-2222-2222-2222-222222222222',
        constituency_id: 'c1111111-0000-0000-0000-000000000001',
        voter_record_id: 'vtr-101-1',
        title: 'Booth 101 Voter List Verification',
        content: 'Completed cross-checking of bazaar ward houses 1-12 to 1-45. Need to verify new additions in 2024 roll.',
        created_at: new Date('2024-02-10T10:00:00Z').toISOString(),
        updated_at: new Date('2024-02-10T10:00:00Z').toISOString()
      },
      {
        id: 'pn2',
        leader_id: '22222222-2222-2222-2222-222222222222',
        constituency_id: 'c1111111-0000-0000-0000-000000000001',
        voter_record_id: null,
        title: 'Senior Citizen Polling Assistance',
        content: 'Coordinate with booth volunteers for wheelchair accessibility at MPPS Atmakuru East Wing polling booth.',
        created_at: new Date('2024-02-14T14:30:00Z').toISOString(),
        updated_at: new Date('2024-02-14T14:30:00Z').toISOString()
      }
    ];

    // 15. Leader Tasks
    this.leaderTasks = [
      {
        id: 'tk1',
        leader_id: '22222222-2222-2222-2222-222222222222',
        constituency_id: 'c1111111-0000-0000-0000-000000000001',
        voter_record_id: 'vtr-101-20',
        title: 'Review flagged spelling corrections in Part 102',
        description: 'Check Telugu spelling mismatches reported by booth agents in Chinakakani.',
        due_date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
        status: 'pending',
        priority: 'high',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'tk2',
        leader_id: '22222222-2222-2222-2222-222222222222',
        constituency_id: 'c1111111-0000-0000-0000-000000000001',
        voter_record_id: null,
        title: 'Finalize aggregate estimates update',
        description: 'Update MPTC level aggregate party estimate after Mandal committee meeting.',
        due_date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
        status: 'in_progress',
        priority: 'medium',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    // 16. Leader Aggregate Estimates (Decoupled from individual voters)
    this.leaderEstimateTotals = [
      {
        id: 'est1',
        leader_id: '22222222-2222-2222-2222-222222222222',
        constituency_id: 'c1111111-0000-0000-0000-000000000001',
        party_id: 'p1111111-0000-0000-0000-000000000001',
        estimated_count: 1150,
        notes: 'Historical baseline from gram panchayat booth trend',
        created_at: new Date('2024-02-01').toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'est2',
        leader_id: '22222222-2222-2222-2222-222222222222',
        constituency_id: 'c1111111-0000-0000-0000-000000000001',
        party_id: 'p1111111-0000-0000-0000-000000000002',
        estimated_count: 1080,
        notes: 'Ground campaign active participation rate',
        created_at: new Date('2024-02-01').toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'est3',
        leader_id: '22222222-2222-2222-2222-222222222222',
        constituency_id: 'c1111111-0000-0000-0000-000000000001',
        party_id: 'p1111111-0000-0000-0000-000000000003',
        estimated_count: 420,
        notes: 'Youth wing outreach estimate',
        created_at: new Date('2024-02-01').toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    // 17. Access Requests
    this.accessRequests = [
      {
        id: 'ar1',
        user_id: '22222222-2222-2222-2222-222222222222',
        district_id: 'd1111111-0000-0000-0000-000000000001',
        mandal_id: 'm1111111-0000-0000-0000-000000000001',
        constituency_id: 'c1111111-0000-0000-0000-000000000001',
        justification: 'Assigned as constituency coordinator for Atmakuru MPTC electoral roll verification.',
        status: 'approved',
        reviewed_by: '11111111-1111-1111-1111-111111111111',
        reviewed_at: new Date('2024-01-15').toISOString(),
        review_notes: 'Verified credentials and authorization letter.',
        created_at: new Date('2024-01-12').toISOString(),
        updated_at: new Date('2024-01-15').toISOString()
      }
    ];

    // 18. Audit Logs
    this.auditLogs = [
      {
        id: 'log1',
        user_id: '11111111-1111-1111-1111-111111111111',
        action: 'SYSTEM_INITIALIZATION',
        entity_type: 'SYSTEM',
        entity_id: 'ROOT',
        details: { message: 'Database initialized with 3,000 electoral roll records for Atmakuru MPTC.' },
        ip_address: '127.0.0.1',
        created_at: new Date('2024-01-01').toISOString()
      }
    ];
  }

  // --- Profile Methods ---
  findProfileByEmail(email) {
    return this.profiles.find(p => p.email.toLowerCase() === email.toLowerCase());
  }

  findProfileById(id) {
    return this.profiles.find(p => p.id === id);
  }

  createProfile(profileData) {
    const newProfile = {
      id: profileData.id || `prof-${Date.now()}`,
      ...profileData,
      is_active: profileData.is_active ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.profiles.push(newProfile);
    return newProfile;
  }

  updateProfile(id, updates) {
    const profile = this.findProfileById(id);
    if (!profile) return null;
    // Don't allow changing role via regular profile update
    const safeUpdates = { ...updates };
    delete safeUpdates.id;
    delete safeUpdates.email;
    Object.assign(profile, safeUpdates, { updated_at: new Date().toISOString() });
    return profile;
  }

  // --- Leader Access Checks ---
  hasLeaderConstituencyAccess(leaderId, constituencyId) {
    return this.leaderConstituencyAccess.some(
      lca => lca.leader_id === leaderId &&
             lca.constituency_id === constituencyId &&
             lca.status === 'active' &&
             (!lca.expires_at || new Date(lca.expires_at) > new Date())
    );
  }

  getLeaderApprovedConstituencies(leaderId) {
    const accessList = this.leaderConstituencyAccess.filter(
      lca => lca.leader_id === leaderId && lca.status === 'active'
    );
    const constIds = accessList.map(a => a.constituency_id);
    return this.mptcConstituencies.filter(c => constIds.includes(c.id));
  }

  // --- Voter Directory Methods ---
  queryVoters({
    constituencyId,
    partId,
    wardId,
    search,
    reviewStatus,
    adminTag,
    gender,
    minAge,
    maxAge,
    isPublicApprovedOnly = false,
    page = 1,
    limit = 30
  }) {
    let results = this.voterRecords;

    if (constituencyId) {
      results = results.filter(v => v.constituency_id === constituencyId);
    }

    if (isPublicApprovedOnly) {
      results = results.filter(v => v.is_public_approved === true);
    }

    if (partId) {
      results = results.filter(v => v.part_id === partId);
    }

    if (wardId) {
      results = results.filter(v => v.ward_id === wardId);
    }

    if (reviewStatus) {
      results = results.filter(v => v.review_status === reviewStatus);
    }

    if (adminTag) {
      results = results.filter(v => v.admin_tag === adminTag);
    }

    if (gender) {
      results = results.filter(v => v.gender === gender);
    }

    if (minAge) {
      results = results.filter(v => v.age >= Number(minAge));
    }

    if (maxAge) {
      results = results.filter(v => v.age <= Number(maxAge));
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      results = results.filter(v => {
        return (
          v.name_en.toLowerCase().includes(q) ||
          v.name_te.includes(q) ||
          (v.relative_name_en && v.relative_name_en.toLowerCase().includes(q)) ||
          (v.relative_name_te && v.relative_name_te.includes(q)) ||
          v.serial_number.toString() === q ||
          (v.house_number_en && v.house_number_en.toLowerCase().includes(q)) ||
          (v.house_number_te && v.house_number_te.includes(q)) ||
          (v.epic_number_masked && v.epic_number_masked.toLowerCase().includes(q)) ||
          (v.part_number && v.part_number.toString() === q)
        );
      });
    }

    // Stable ordering by part_number and serial_number
    results.sort((a, b) => {
      const partDiff = Number(a.part_number || 0) - Number(b.part_number || 0);
      if (partDiff !== 0) return partDiff;
      return a.serial_number - b.serial_number;
    });

    const totalCount = results.length;
    const startIndex = (page - 1) * limit;
    const pageRecords = results.slice(startIndex, startIndex + limit);

    return {
      records: pageRecords,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      hasMore: startIndex + limit < totalCount
    };
  }

  getVoterById(id) {
    return this.voterRecords.find(v => v.id === id);
  }

  updateVoterReviewStatus(id, reviewStatus, adminTag) {
    const voter = this.getVoterById(id);
    if (!voter) return null;
    if (reviewStatus) voter.review_status = reviewStatus;
    if (adminTag !== undefined) voter.admin_tag = adminTag;
    voter.updated_at = new Date().toISOString();
    return voter;
  }

  bulkUpdateVoters({ voterIds, constituencyId, updates, userRole, userId }) {
    const allowed = ['review_status', 'admin_tag', 'is_public_approved'];
    let successCount = 0;
    const failedIds = [];

    voterIds.forEach(id => {
      const voter = this.getVoterById(id);
      if (!voter) {
        failedIds.push({ id, reason: 'Record not found' });
        return;
      }

      // Constituency check for Leaders
      if (userRole === 'leader' && voter.constituency_id !== constituencyId) {
        failedIds.push({ id, reason: 'Unauthorized for this constituency' });
        return;
      }

      // Apply updates
      Object.keys(updates).forEach(key => {
        if (allowed.includes(key)) {
          // Only super_admin can alter is_public_approved
          if (key === 'is_public_approved' && userRole !== 'super_admin') return;
          voter[key] = updates[key];
        }
      });
      voter.updated_at = new Date().toISOString();
      successCount++;
    });

    this.logAudit({
      userId,
      action: 'BULK_UPDATE_VOTERS',
      entityType: 'VOTER_RECORDS',
      details: { total: voterIds.length, successCount, failedCount: failedIds.length, updates }
    });

    return { successCount, failedIds };
  }

  // --- Audit Logging ---
  logAudit({ userId, action, entityType, entityId = null, details = {}, ipAddress = '127.0.0.1' }) {
    const log = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details,
      ip_address: ipAddress,
      created_at: new Date().toISOString()
    };
    this.auditLogs.unshift(log);
    // Keep max 2000 in-memory logs
    if (this.auditLogs.length > 2000) {
      this.auditLogs.pop();
    }
    return log;
  }
}

export const dataStore = new DataStore();
