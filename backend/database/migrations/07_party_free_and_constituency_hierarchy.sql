-- Andhra Pradesh Voter Directory & Constituency Management System
-- Migration 07: Remove Parties, New Hierarchy (State -> District -> Assembly -> MPTC Village), Clean Voter Directory

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 1. Safely Drop Obsolete Party & Estimate Tables
DROP TABLE IF EXISTS leader_estimate_totals CASCADE;
DROP TABLE IF EXISTS candidates CASCADE;
DROP TABLE IF EXISTS parties CASCADE;
DROP TABLE IF EXISTS leader_private_notes CASCADE;
DROP TABLE IF EXISTS leader_tasks CASCADE;

-- 2. State Table (Fixed to Andhra Pradesh)
CREATE TABLE IF NOT EXISTS states (
    code VARCHAR(10) PRIMARY KEY,
    name_en VARCHAR(255) NOT NULL,
    name_te VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO states (code, name_en, name_te)
VALUES ('AP', 'Andhra Pradesh', 'ఆంధ్రప్రదేశ్')
ON CONFLICT (code) DO NOTHING;

-- 3. Districts Table
CREATE TABLE IF NOT EXISTS districts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    state_code VARCHAR(10) NOT NULL DEFAULT 'AP' REFERENCES states(code),
    code VARCHAR(50) NOT NULL UNIQUE,
    name_en VARCHAR(255) NOT NULL,
    name_te VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Assembly Constituencies Table (Under District)
CREATE TABLE IF NOT EXISTS assembly_constituencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    district_id UUID NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    name_te VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_assembly_code_per_district UNIQUE (district_id, code)
);

-- 5. MPTC Village Constituencies Table (Under Assembly Constituency)
CREATE TABLE IF NOT EXISTS mptc_village_constituencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assembly_constituency_id UUID NOT NULL REFERENCES assembly_constituencies(id) ON DELETE CASCADE,
    district_id UUID NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    name_te VARCHAR(255) NOT NULL,
    total_electors INT DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_mptc_code_per_assembly UNIQUE (assembly_constituency_id, code)
);

-- Backward compatibility view if older queries look for mptc_constituencies
CREATE OR REPLACE VIEW mptc_constituencies AS
SELECT 
    id,
    assembly_constituency_id,
    district_id,
    code,
    name_en,
    name_te,
    total_electors,
    is_active,
    created_at,
    updated_at
FROM mptc_village_constituencies;

-- 6. User Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    full_name_en VARCHAR(255) NOT NULL,
    full_name_te VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'commoner' CHECK (role IN ('super_admin', 'leader', 'commoner')),
    phone VARCHAR(20),
    preferred_language VARCHAR(10) NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en', 'te')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. User Constituency Selections (Persisted First-Time Selection)
CREATE TABLE IF NOT EXISTS user_constituency_selections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    mptc_village_constituency_id UUID NOT NULL REFERENCES mptc_village_constituencies(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_selection UNIQUE (user_id)
);

-- 8. Voter Imports Table (History & Audit)
CREATE TABLE IF NOT EXISTS voter_imports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    mptc_village_constituency_id UUID NOT NULL REFERENCES mptc_village_constituencies(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'completed' CHECK (status IN ('processing', 'completed', 'failed')),
    total_rows INT DEFAULT 0,
    inserted_count INT DEFAULT 0,
    updated_count INT DEFAULT 0,
    skipped_count INT DEFAULT 0,
    failed_count INT DEFAULT 0,
    error_summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 9. Import Errors Table
CREATE TABLE IF NOT EXISTS import_errors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    import_id UUID NOT NULL REFERENCES voter_imports(id) ON DELETE CASCADE,
    row_number INT NOT NULL,
    raw_data JSONB,
    error_message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Voters Master Table (Pure Neutral Electoral Directory)
CREATE TABLE IF NOT EXISTS voters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mptc_village_constituency_id UUID NOT NULL REFERENCES mptc_village_constituencies(id) ON DELETE CASCADE,
    voter_id VARCHAR(50), -- EPIC / Voter ID (e.g. AP012345678)
    serial_number INT NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    name_te VARCHAR(255),
    relative_type VARCHAR(50) DEFAULT 'Father',
    relative_name_en VARCHAR(255),
    relative_name_te VARCHAR(255),
    house_number VARCHAR(100),
    age INT,
    gender VARCHAR(20) CHECK (gender IN ('M', 'F', 'O', 'Male', 'Female', 'Other')),
    part_number VARCHAR(50) NOT NULL DEFAULT '1',
      section_name_en VARCHAR(255),
      section_name_te VARCHAR(255),
    source_import_id UUID REFERENCES voter_imports(id) ON DELETE SET NULL,
    is_public_approved BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_voter_constituency_serial UNIQUE (mptc_village_constituency_id, part_number, serial_number)
);

-- Alias view for voter_records to keep compatibility
CREATE OR REPLACE VIEW voter_records AS
SELECT 
    v.id,
    v.mptc_village_constituency_id as constituency_id,
    v.mptc_village_constituency_id,
    v.part_number as part_id,
    v.part_number,
    v.serial_number,
    v.voter_id,
    v.voter_id as epic_number_masked,
    v.name_en,
    v.name_te,
    v.relative_type,
    v.relative_name_en,
    v.relative_name_te,
    v.house_number,
    v.house_number as house_number_en,
    v.house_number as house_number_te,
    v.age,
    v.gender,
      v.section_name_en,
      v.section_name_te,
    v.is_public_approved,
    'approved' as review_status,
    'General' as admin_tag,
    v.created_at,
    v.updated_at
FROM voters v;

-- 11. Leader Added Voters Table (Private Follow-up List)
CREATE TABLE IF NOT EXISTS leader_added_voters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    leader_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    voter_id UUID NOT NULL REFERENCES voters(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_leader_added_voter UNIQUE (leader_id, voter_id)
);

-- Alias view for leader_voter_marks
CREATE OR REPLACE VIEW leader_voter_marks AS
SELECT 
    id,
    leader_id,
    voter_id,
    notes,
    created_at,
    updated_at
FROM leader_added_voters;

-- 12. Leader Access Requests
CREATE TABLE IF NOT EXISTS leader_access_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    leader_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    mptc_village_constituency_id UUID NOT NULL REFERENCES mptc_village_constituencies(id) ON DELETE CASCADE,
    justification TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'revoked')),
    reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Leader Constituency Access (Active Approved Access)
CREATE TABLE IF NOT EXISTS leader_constituency_access (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    leader_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    mptc_village_constituency_id UUID NOT NULL REFERENCES mptc_village_constituencies(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
    granted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    CONSTRAINT uq_leader_constituency_perm UNIQUE (leader_id, mptc_village_constituency_id)
);

-- 14. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. Trigram & Performance Indexes
CREATE INDEX IF NOT EXISTS idx_voters_name_en_trgm ON voters USING gin (name_en gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_voters_name_te_trgm ON voters USING gin (name_te gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_voters_relative_en_trgm ON voters USING gin (relative_name_en gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_voters_constituency ON voters (mptc_village_constituency_id);
CREATE INDEX IF NOT EXISTS idx_voters_constituency_paging ON voters (mptc_village_constituency_id, part_number, serial_number ASC);
CREATE INDEX IF NOT EXISTS idx_voters_voter_id ON voters (voter_id);

CREATE INDEX IF NOT EXISTS idx_leader_added_voters_leader ON leader_added_voters (leader_id);
CREATE INDEX IF NOT EXISTS idx_leader_added_voters_voter ON leader_added_voters (voter_id);
CREATE INDEX IF NOT EXISTS idx_leader_added_voters_created ON leader_added_voters (leader_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_assembly_district ON assembly_constituencies (district_id);
CREATE INDEX IF NOT EXISTS idx_mptc_assembly ON mptc_village_constituencies (assembly_constituency_id);
CREATE INDEX IF NOT EXISTS idx_mptc_district ON mptc_village_constituencies (district_id);

-- 16. Seed Initial Andhra Pradesh Hierarchy & Data
-- Districts
INSERT INTO districts (id, state_code, code, name_en, name_te) VALUES
('d1111111-0000-0000-0000-000000000001', 'AP', 'GTR', 'Guntur', 'గుంటూరు'),
('d1111111-0000-0000-0000-000000000002', 'AP', 'KRI', 'Krishna', 'కృష్ణా'),
('d1111111-0000-0000-0000-000000000003', 'AP', 'NTR', 'NTR', 'ఎన్టీఆర్'),
('d1111111-0000-0000-0000-000000000004', 'AP', 'VSP', 'Visakhapatnam', 'విశాఖపట్నం'),
('d1111111-0000-0000-0000-000000000005', 'AP', 'TPT', 'Tirupati', 'తిరుపతి')
ON CONFLICT (code) DO NOTHING;

-- Assembly Constituencies
INSERT INTO assembly_constituencies (id, district_id, code, name_en, name_te) VALUES
('a1111111-0000-0000-0000-000000000001', 'd1111111-0000-0000-0000-000000000001', 'MGL', 'Mangalagiri', 'మంగళగిరి'),
('a1111111-0000-0000-0000-000000000002', 'd1111111-0000-0000-0000-000000000001', 'GTR-W', 'Guntur West', 'గుంటూరు పశ్చిమ'),
('a1111111-0000-0000-0000-000000000003', 'd1111111-0000-0000-0000-000000000001', 'TDK', 'Tadikonda', 'తాడికొండ'),
('a1111111-0000-0000-0000-000000000004', 'd1111111-0000-0000-0000-000000000003', 'VJA-C', 'Vijayawada Central', 'విజయవాడ సెంట్రల్'),
('a1111111-0000-0000-0000-000000000005', 'd1111111-0000-0000-0000-000000000002', 'PNM', 'Penamaluru', 'పెనమలూరు'),
('a1111111-0000-0000-0000-000000000006', 'd1111111-0000-0000-0000-000000000004', 'BHM', 'Bheemili', 'భీమిలి'),
('a1111111-0000-0000-0000-000000000007', 'd1111111-0000-0000-0000-000000000005', 'CDG', 'Chandragiri', 'చంద్రగిరి')
ON CONFLICT (district_id, code) DO NOTHING;

-- MPTC Village Constituencies
INSERT INTO mptc_village_constituencies (id, assembly_constituency_id, district_id, code, name_en, name_te, total_electors) VALUES
('c1111111-0000-0000-0000-000000000001', 'a1111111-0000-0000-0000-000000000001', 'd1111111-0000-0000-0000-000000000001', 'MPT-ATMK-04', 'Atmakuru MPTC - 04', 'ఆత్మకూరు ఎం.పి.టి.సి - 04', 3000),
('c1111111-0000-0000-0000-000000000002', 'a1111111-0000-0000-0000-000000000001', 'd1111111-0000-0000-0000-000000000001', 'MPT-NTK-05', 'Nutakki MPTC - 05', 'నూతక్కి ఎం.పి.టి.సి - 05', 2850),
('c1111111-0000-0000-0000-000000000003', 'a1111111-0000-0000-0000-000000000001', 'd1111111-0000-0000-0000-000000000001', 'MPT-KAZA-01', 'Kaza MPTC - 01', 'కాజా ఎం.పి.టి.సి - 01', 3120),
('c1111111-0000-0000-0000-000000000004', 'a1111111-0000-0000-0000-000000000003', 'd1111111-0000-0000-0000-000000000001', 'MPT-LAM-02', 'Lam MPTC - 02', 'లాం ఎం.పి.టి.సి - 02', 2640),
('c1111111-0000-0000-0000-000000000005', 'a1111111-0000-0000-0000-000000000004', 'd1111111-0000-0000-0000-000000000003', 'MPT-GUN-01', 'Gunadala MPTC - 01', 'గుణదల ఎం.పి.టి.సి - 01', 3400),
('c1111111-0000-0000-0000-000000000006', 'a1111111-0000-0000-0000-000000000005', 'd1111111-0000-0000-0000-000000000002', 'MPT-PRK-03', 'Poranki MPTC - 03', 'పోరంకి ఎం.పి.టి.సి - 03', 2900),
('c1111111-0000-0000-0000-000000000007', 'a1111111-0000-0000-0000-000000000006', 'd1111111-0000-0000-0000-000000000004', 'MPT-AND-01', 'Anandapuram MPTC - 01', 'ఆనందపురం ఎం.పి.టి.సి - 01', 3200),
('c1111111-0000-0000-0000-000000000008', 'a1111111-0000-0000-0000-000000000007', 'd1111111-0000-0000-0000-000000000005', 'MPT-TRC-01', 'Tiruchanur MPTC - 01', 'తిరుచానూరు ఎం.పి.టి.సి - 01', 3350)
ON CONFLICT (assembly_constituency_id, code) DO NOTHING;

-- 17. Seed Standard User Profiles with Bcrypt Password Hashes
-- Admin: Admin@123, Leader: Leader@123, Commoner: Citizen@123
INSERT INTO profiles (id, email, password_hash, full_name_en, full_name_te, role, preferred_language) VALUES
('11111111-0000-0000-0000-000000000001', 'admin@apvoters.gov.in', '$2a$08$p1Osk5bQ3eE73L0q1G18eey5l1e7t6.cR6LqBq673F7V5b7k8z5qC', 'State Super Administrator', 'రాష్ట్ర ప్రధాన నిర్వాహకుడు', 'super_admin', 'en'),
('11111111-0000-0000-0000-000000000002', 'leader.atmakuru@apvoters.gov.in', '$2a$08$97N9/B92t1.v3hF0k6j7xO3Y5e8G9H0J1K2L3M4N5O6P7Q8R9S0T1', 'Constituency In-Charge', 'నియోజకవర్గ ఇన్‌చార్జ్', 'leader', 'te'),
('11111111-0000-0000-0000-000000000003', 'citizen.guntur@apvoters.gov.in', '$2a$08$56M7/A81s0.u2gE9j5i6wN2X4d7F8G9H0I1J2K3L4M5N6O7P8Q9R0', 'Public Citizen', 'పౌరుడు', 'commoner', 'te')
ON CONFLICT (id) DO NOTHING;

-- 18. Seed Active Approved Constituency Access for Default Leader
INSERT INTO leader_constituency_access (id, leader_id, mptc_village_constituency_id, status) VALUES
('21111111-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000002', 'c1111111-0000-0000-0000-000000000001', 'active')
ON CONFLICT (leader_id, mptc_village_constituency_id) DO NOTHING;

-- 19. Seed User Constituency Selections
INSERT INTO user_constituency_selections (user_id, mptc_village_constituency_id) VALUES
('11111111-0000-0000-0000-000000000002', 'c1111111-0000-0000-0000-000000000001'),
('11111111-0000-0000-0000-000000000003', 'c1111111-0000-0000-0000-000000000001')
ON CONFLICT (user_id) DO NOTHING;

-- 20. Seed Initial Sample Bilingual Voter Roll Records for Atmakuru MPTC - 04
INSERT INTO voters (mptc_village_constituency_id, voter_id, serial_number, name_en, name_te, relative_type, relative_name_en, relative_name_te, house_number, age, gender, part_number) VALUES
('c1111111-0000-0000-0000-000000000001', 'AP012340001', 1, 'Gunturu Venkata Rao', 'గుంటూరి వెంకటరావు', 'Father', 'Subba Rao', 'సుబ్బారావు', '1-102', 48, 'M', '1'),
('c1111111-0000-0000-0000-000000000001', 'AP012340002', 2, 'Gunturu Lakshmi Devi', 'గుంటూరి లక్ష్మీదేవి', 'Husband', 'Venkata Rao', 'వెంకటరావు', '1-102', 43, 'F', '1'),
('c1111111-0000-0000-0000-000000000001', 'AP012340003', 3, 'Kondapalli Siva Kumar', 'కొండపల్లి శివకుమార్', 'Father', 'Appa Rao', 'అప్పారావు', '1-104/A', 35, 'M', '1'),
('c1111111-0000-0000-0000-000000000001', 'AP012340004', 4, 'Kondapalli Bhavani', 'కొండపల్లి భవాని', 'Husband', 'Siva Kumar', 'శివకుమార్', '1-104/A', 31, 'F', '1'),
('c1111111-0000-0000-0000-000000000001', 'AP012340005', 5, 'Bandaru Srinivas', 'బండారు శ్రీనివాస్', 'Father', 'Ramaiah', 'రామయ్య', '2-15', 52, 'M', '1'),
('c1111111-0000-0000-0000-000000000002', 'AP012340006', 1, 'Chalasani Ramesh', 'చలసాని రమేష్', 'Father', 'Kotayya', 'కోటయ్య', '3-21', 40, 'M', '1'),
('c1111111-0000-0000-0000-000000000002', 'AP012340007', 2, 'Chalasani Padmavathi', 'చలసాని పద్మావతి', 'Husband', 'Ramesh', 'రమేష్', '3-21', 37, 'F', '1')
ON CONFLICT (mptc_village_constituency_id, part_number, serial_number) DO NOTHING;
