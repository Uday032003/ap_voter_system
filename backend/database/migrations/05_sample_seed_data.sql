-- Andhra Pradesh Voter Directory & Constituency Management System
-- Migration 05: Core Seed Data (Geographic, Parties, Initial Profiles, Initial Voters)

-- 1. Seed Profiles (UUIDs are static for repeatable testing and development)
INSERT INTO profiles (id, email, full_name_en, full_name_te, role, phone, is_active)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'admin@apvoters.gov.in', 'Dr. Ramesh Kumar (Super Admin)', 'డా. రమేష్ కుమార్', 'super_admin', '9848012345', TRUE),
  ('22222222-2222-2222-2222-222222222222', 'leader.atmakuru@apvoters.gov.in', 'Smt. K. Bhavani (Constituency Leader)', 'శ్రీమతి కె. భవాని', 'leader', '9848054321', TRUE),
  ('33333333-3333-3333-3333-333333333333', 'citizen.guntur@apvoters.gov.in', 'Sri. V. Srinivasa Rao (Citizen)', 'శ్రీ వి. శ్రీనివాసరావు', 'commoner', '9848099887', TRUE)
ON CONFLICT (email) DO NOTHING;

-- 2. Seed Districts
INSERT INTO districts (id, code, name_en, name_te, is_active)
VALUES 
  ('d1111111-0000-0000-0000-000000000001', 'GNT', 'Guntur', 'గుంటూరు', TRUE),
  ('d1111111-0000-0000-0000-000000000002', 'KRI', 'Krishna', 'కృష్ణా', TRUE),
  ('d1111111-0000-0000-0000-000000000003', 'VSP', 'Visakhapatnam', 'విశాఖపట్నం', TRUE)
ON CONFLICT (code) DO NOTHING;

-- 3. Seed Mandals
INSERT INTO mandals (id, district_id, code, name_en, name_te, is_active)
VALUES 
  ('m1111111-0000-0000-0000-000000000001', 'd1111111-0000-0000-0000-000000000001', 'MGL', 'Mangalagiri', 'మంగళగిరి', TRUE),
  ('m1111111-0000-0000-0000-000000000002', 'd1111111-0000-0000-0000-000000000001', 'TDP', 'Tadepalli', 'తాడేపల్లి', TRUE),
  ('m1111111-0000-0000-0000-000000000003', 'd1111111-0000-0000-0000-000000000001', 'TNK', 'Tenali', 'తెనాలి', TRUE)
ON CONFLICT (district_id, code) DO NOTHING;

-- 4. Seed Villages
INSERT INTO villages (id, mandal_id, code, name_en, name_te, is_active)
VALUES 
  ('v1111111-0000-0000-0000-000000000001', 'm1111111-0000-0000-0000-000000000001', 'ATM', 'Atmakuru', 'ఆత్మకూరు', TRUE),
  ('v1111111-0000-0000-0000-000000000002', 'm1111111-0000-0000-0000-000000000001', 'NUT', 'Nutakki', 'నూతక్కి', TRUE),
  ('v1111111-0000-0000-0000-000000000003', 'm1111111-0000-0000-0000-000000000001', 'CKK', 'Chinakakani', 'చినకాకాని', TRUE)
ON CONFLICT (mandal_id, code) DO NOTHING;

-- 5. Seed MPTC Constituency
INSERT INTO mptc_constituencies (id, mandal_id, code, name_en, name_te, reservation_category, total_electors, is_active)
VALUES 
  ('c1111111-0000-0000-0000-000000000001', 'm1111111-0000-0000-0000-000000000001', 'MPTC-MGL-04', 'Atmakuru MPTC - 04', 'ఆత్మకూరు ఎంపీటీసీ - 04', 'General (Women)', 3020, TRUE),
  ('c1111111-0000-0000-0000-000000000002', 'm1111111-0000-0000-0000-000000000001', 'MPTC-MGL-05', 'Nutakki MPTC - 05', 'నూతక్కి ఎంపీటీసీ - 05', 'General', 2850, TRUE)
ON CONFLICT (mandal_id, code) DO NOTHING;

-- 6. Constituency Areas Mapping (Atmakuru MPTC covers Atmakuru village and part of Chinakakani)
INSERT INTO constituency_areas (id, constituency_id, village_id, notes)
VALUES 
  ('ca111111-0000-0000-0000-000000000001', 'c1111111-0000-0000-0000-000000000001', 'v1111111-0000-0000-0000-000000000001', 'Complete village area'),
  ('ca111111-0000-0000-0000-000000000002', 'c1111111-0000-0000-0000-000000000001', 'v1111111-0000-0000-0000-000000000003', 'North sector habitation')
ON CONFLICT (constituency_id, village_id) DO NOTHING;

-- 7. Wards
INSERT INTO wards (id, village_id, ward_number, name_en, name_te)
VALUES 
  ('w1111111-0000-0000-0000-000000000001', 'v1111111-0000-0000-0000-000000000001', '01', 'Ward No. 1 (Bazaar Area)', 'వార్డు నం. 1 (బజార్ వీధి)'),
  ('w1111111-0000-0000-0000-000000000002', 'v1111111-0000-0000-0000-000000000001', '02', 'Ward No. 2 (Temple Street)', 'వార్డు నం. 2 (గుడి వీధి)'),
  ('w1111111-0000-0000-0000-000000000003', 'v1111111-0000-0000-0000-000000000001', '03', 'Ward No. 3 (School Area)', 'వార్డు నం. 3 (పాఠశాల ప్రాంతం)')
ON CONFLICT (village_id, ward_number) DO NOTHING;

-- 8. Polling Stations
INSERT INTO polling_stations (id, constituency_id, village_id, station_number, name_en, name_te, building_en, building_te)
VALUES 
  ('ps111111-0000-0000-0000-000000000001', 'c1111111-0000-0000-0000-000000000001', 'v1111111-0000-0000-0000-000000000001', '01', 'MPPS Atmakuru East Wing', 'మండల పరిషత్ ప్రాథమిక పాఠశాల ఆత్మకూరు తూర్పు భాగం', 'Room No. 1, Main Block', 'గది నం. 1, ప్రధాన భవనం'),
  ('ps111111-0000-0000-0000-000000000002', 'c1111111-0000-0000-0000-000000000001', 'v1111111-0000-0000-0000-000000000001', '02', 'MPPS Atmakuru West Wing', 'మండల పరిషత్ ప్రాథమిక పాఠశాల ఆత్మకూరు పశ్చిమ భాగం', 'Room No. 3, New Block', 'గది నం. 3, నూతన భవనం'),
  ('ps111111-0000-0000-0000-000000000003', 'c1111111-0000-0000-0000-000000000001', 'v1111111-0000-0000-0000-000000000003', '03', 'ZPHS Chinakakani North', 'జిల్లా పరిషత్ ఉన్నత పాఠశాల చినకాకాని ఉత్తర భాగం', 'Room No. 2, Science Wing', 'గది నం. 2, సైన్స్ వింగ్')
ON CONFLICT (constituency_id, station_number) DO NOTHING;

-- 9. Electoral Roll Parts
INSERT INTO electoral_roll_parts (id, constituency_id, polling_station_id, part_number, part_name_en, part_name_te, total_voters)
VALUES 
  ('erp11111-0000-0000-0000-000000000001', 'c1111111-0000-0000-0000-000000000001', 'ps111111-0000-0000-0000-000000000001', '101', 'Part 101 - Atmakuru Gramam Ward 1', 'పార్టు 101 - ఆత్మకూరు గ్రామం వార్డు 1', 1050),
  ('erp11111-0000-0000-0000-000000000002', 'c1111111-0000-0000-0000-000000000001', 'ps111111-0000-0000-0000-000000000002', '102', 'Part 102 - Atmakuru Gramam Ward 2', 'పార్టు 102 - ఆత్మకూరు గ్రామం వార్డు 2', 980),
  ('erp11111-0000-0000-0000-000000000003', 'c1111111-0000-0000-0000-000000000001', 'ps111111-0000-0000-0000-000000000003', '103', 'Part 103 - Chinakakani Habitation', 'పార్టు 103 - చినకాకాని నివాస ప్రాంతం', 990)
ON CONFLICT (constituency_id, part_number) DO NOTHING;

-- 10. Official Political Parties
INSERT INTO parties (id, code, name_en, name_te, abbreviation, symbol_name, color_code, is_active)
VALUES 
  ('p1111111-0000-0000-0000-000000000001', 'YSRCP', 'YSR Congress Party', 'యువజన శ్రామిక రైతు కాంగ్రెస్ పార్టీ', 'YSRCP', 'Fan (సీలింగ్ ఫ్యాన్)', '#15803d', TRUE),
  ('p1111111-0000-0000-0000-000000000002', 'TDP', 'Telugu Desam Party', 'తెలుగు దేశం పార్టీ', 'TDP', 'Bicycle (సైకిల్)', '#eab308', TRUE),
  ('p1111111-0000-0000-0000-000000000003', 'JSP', 'JanaSena Party', 'జనసేన పార్టీ', 'JSP', 'Glass Tumbler (గాజు గ్లాసు)', '#dc2626', TRUE),
  ('p1111111-0000-0000-0000-000000000004', 'INC', 'Indian National Congress', 'భారత జాతీయ కాంగ్రెస్', 'INC', 'Hand (చేయి)', '#2563eb', TRUE),
  ('p1111111-0000-0000-0000-000000000005', 'BJP', 'Bharatiya Janata Party', 'భారతీయ జనతా పార్టీ', 'BJP', 'Lotus (కమలం)', '#ea580c', TRUE)
ON CONFLICT (code) DO NOTHING;

-- 11. Candidates
INSERT INTO candidates (id, constituency_id, party_id, name_en, name_te, election_year, status)
VALUES 
  ('cd111111-0000-0000-0000-000000000001', 'c1111111-0000-0000-0000-000000000001', 'p1111111-0000-0000-0000-000000000001', 'G. Anitha Reddy', 'జి. అనిత రెడ్డి', 2024, 'Active'),
  ('cd111111-0000-0000-0000-000000000002', 'c1111111-0000-0000-0000-000000000001', 'p1111111-0000-0000-0000-000000000002', 'M. Lakshmi Prasanna', 'ఎం. లక్ష్మి ప్రసన్న', 2024, 'Active'),
  ('cd111111-0000-0000-0000-000000000003', 'c1111111-0000-0000-0000-000000000001', 'p1111111-0000-0000-0000-000000000003', 'Ch. Padmavathi', 'చ. పద్మావతి', 2024, 'Active')
ON CONFLICT DO NOTHING;

-- 12. Approved Leader Constituency Access
INSERT INTO leader_constituency_access (id, leader_id, constituency_id, status, granted_by, granted_at)
VALUES 
  ('lca11111-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'c1111111-0000-0000-0000-000000000001', 'active', '11111111-1111-1111-1111-111111111111', NOW())
ON CONFLICT (leader_id, constituency_id) DO NOTHING;

-- 13. Sample Leader Aggregate Estimates (Non-negative counts, completely decoupled from individual voters)
INSERT INTO leader_estimate_totals (id, leader_id, constituency_id, party_id, estimated_count, notes)
VALUES 
  ('est11111-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'c1111111-0000-0000-0000-000000000001', 'p1111111-0000-0000-0000-000000000001', 1150, 'Historical baseline from gram panchayat booth trend'),
  ('est11111-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'c1111111-0000-0000-0000-000000000001', 'p1111111-0000-0000-0000-000000000002', 1080, 'Ground campaign active participation rate'),
  ('est11111-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'c1111111-0000-0000-0000-000000000001', 'p1111111-0000-0000-0000-000000000003', 420, 'Youth wing outreach estimate')
ON CONFLICT (leader_id, constituency_id, party_id) DO NOTHING;

-- 14. Sample Leader Private Notes
INSERT INTO leader_private_notes (id, leader_id, constituency_id, title, content)
VALUES 
  ('pn111111-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'c1111111-0000-0000-0000-000000000001', 'Booth 101 Voter List Verification', 'Completed cross-checking of bazaar ward houses 1-12 to 1-45. Need to verify new additions in 2024 roll.'),
  ('pn111111-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'c1111111-0000-0000-0000-000000000001', 'Senior Citizen Assistance Scheme', 'Coordinate with booth volunteers for wheelchair accessibility at MPPS Atmakuru East Wing polling booth.')
ON CONFLICT DO NOTHING;

-- 15. Sample Leader Tasks
INSERT INTO leader_tasks (id, leader_id, constituency_id, title, description, due_date, status, priority)
VALUES 
  ('tk111111-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'c1111111-0000-0000-0000-000000000001', 'Review flagged spelling corrections in Part 102', 'Check Telugu spelling mismatches reported by booth agents in Chinakakani', CURRENT_DATE + INTERVAL '5 days', 'pending', 'high'),
  ('tk111111-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'c1111111-0000-0000-0000-000000000001', 'Finalize aggregate estimates update', 'Update MPTC level aggregate party estimate after Mandal committee meeting', CURRENT_DATE + INTERVAL '2 days', 'in_progress', 'medium')
ON CONFLICT DO NOTHING;
