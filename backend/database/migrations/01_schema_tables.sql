-- Andhra Pradesh Voter Directory & Constituency Management System
-- Migration 01: Core Schema & Normalized Tables

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2. Profiles (Extends Supabase auth.users or standalone auth)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE, -- References auth.users(id) in Supabase
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name_en VARCHAR(255) NOT NULL,
    full_name_te VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'commoner' CHECK (role IN ('super_admin', 'leader', 'commoner')),
    phone VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Geographic Hierarchy: Districts
CREATE TABLE IF NOT EXISTS districts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name_en VARCHAR(255) NOT NULL,
    name_te VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Mandals (Tehsils)
CREATE TABLE IF NOT EXISTS mandals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    district_id UUID NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    name_te VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_mandal_code_per_district UNIQUE (district_id, code)
);

-- 5. Villages / Local Urban Areas
CREATE TABLE IF NOT EXISTS villages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mandal_id UUID NOT NULL REFERENCES mandals(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    name_te VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_village_code_per_mandal UNIQUE (mandal_id, code)
);

-- 6. MPTC Constituencies (Mandal Parishad Territorial Constituency)
CREATE TABLE IF NOT EXISTS mptc_constituencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mandal_id UUID NOT NULL REFERENCES mandals(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    name_te VARCHAR(255) NOT NULL,
    reservation_category VARCHAR(50) DEFAULT 'General', -- General, BC, SC, ST, Women
    total_electors INT DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_constituency_code_per_mandal UNIQUE (mandal_id, code)
);

-- 7. Constituency Areas (Mapping MPTC Constituencies to Villages / Local Areas)
-- (Constituency can span multiple villages or parts of villages)
CREATE TABLE IF NOT EXISTS constituency_areas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    constituency_id UUID NOT NULL REFERENCES mptc_constituencies(id) ON DELETE CASCADE,
    village_id UUID NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_constituency_village UNIQUE (constituency_id, village_id)
);

-- 8. Wards / Habitations
CREATE TABLE IF NOT EXISTS wards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    village_id UUID NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
    ward_number VARCHAR(50) NOT NULL,
    name_en VARCHAR(255),
    name_te VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_ward_per_village UNIQUE (village_id, ward_number)
);

-- 9. Polling Stations
CREATE TABLE IF NOT EXISTS polling_stations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    constituency_id UUID NOT NULL REFERENCES mptc_constituencies(id) ON DELETE CASCADE,
    village_id UUID REFERENCES villages(id) ON DELETE SET NULL,
    station_number VARCHAR(50) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    name_te VARCHAR(255) NOT NULL,
    building_en TEXT,
    building_te TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_station_number_per_constituency UNIQUE (constituency_id, station_number)
);

-- 10. Electoral Roll Parts (Polling Booth Parts)
CREATE TABLE IF NOT EXISTS electoral_roll_parts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    constituency_id UUID NOT NULL REFERENCES mptc_constituencies(id) ON DELETE CASCADE,
    polling_station_id UUID REFERENCES polling_stations(id) ON DELETE SET NULL,
    part_number VARCHAR(50) NOT NULL,
    part_name_en VARCHAR(255) NOT NULL,
    part_name_te VARCHAR(255) NOT NULL,
    total_voters INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_part_number_per_constituency UNIQUE (constituency_id, part_number)
);

-- 11. Voter Records
CREATE TABLE IF NOT EXISTS voter_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    constituency_id UUID NOT NULL REFERENCES mptc_constituencies(id) ON DELETE CASCADE,
    part_id UUID NOT NULL REFERENCES electoral_roll_parts(id) ON DELETE CASCADE,
    ward_id UUID REFERENCES wards(id) ON DELETE SET NULL,
    serial_number INT NOT NULL,
    epic_number_masked VARCHAR(50), -- Masked or tokenized identifier (e.g. ABC***1234)
    name_en VARCHAR(255) NOT NULL,
    name_te VARCHAR(255) NOT NULL,
    relative_type VARCHAR(50) DEFAULT 'Father', -- Father, Mother, Husband, Other
    relative_name_en VARCHAR(255),
    relative_name_te VARCHAR(255),
    house_number_en VARCHAR(100),
    house_number_te VARCHAR(100),
    age INT,
    gender VARCHAR(20) CHECK (gender IN ('M', 'F', 'O', 'Male', 'Female', 'Other')),
    is_public_approved BOOLEAN NOT NULL DEFAULT FALSE,
    review_status VARCHAR(50) NOT NULL DEFAULT 'approved' CHECK (review_status IN ('approved', 'needs_review', 'flagged')),
    admin_tag VARCHAR(100), -- Administrative categorization (e.g. 'Senior Citizen', 'PWD', 'NRI')
    source_file VARCHAR(255),
    source_page INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_part_serial UNIQUE (part_id, serial_number)
);

-- 12. Official Political Parties
CREATE TABLE IF NOT EXISTS parties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name_en VARCHAR(255) NOT NULL,
    name_te VARCHAR(255) NOT NULL,
    abbreviation VARCHAR(50) NOT NULL,
    symbol_name VARCHAR(100),
    logo_url TEXT,
    color_code VARCHAR(50) DEFAULT '#1e40af',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Official Candidates per Constituency
CREATE TABLE IF NOT EXISTS candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    constituency_id UUID NOT NULL REFERENCES mptc_constituencies(id) ON DELETE CASCADE,
    party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
    name_en VARCHAR(255) NOT NULL,
    name_te VARCHAR(255) NOT NULL,
    election_year INT NOT NULL DEFAULT 2024,
    status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Withdrawn', 'Disqualified')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. Leader Private Aggregate Estimates Dashboard Table
-- (Strictly aggregate totals entered by the Leader. Never attached to individual voter records)
CREATE TABLE IF NOT EXISTS leader_estimate_totals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    leader_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    constituency_id UUID NOT NULL REFERENCES mptc_constituencies(id) ON DELETE CASCADE,
    party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
    estimated_count INT NOT NULL CHECK (estimated_count >= 0),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_leader_constituency_party UNIQUE (leader_id, constituency_id, party_id)
);

-- 15. Leader Private Notes
CREATE TABLE IF NOT EXISTS leader_private_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    leader_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    constituency_id UUID NOT NULL REFERENCES mptc_constituencies(id) ON DELETE CASCADE,
    voter_record_id UUID REFERENCES voter_records(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. Leader Follow-up Tasks
CREATE TABLE IF NOT EXISTS leader_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    leader_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    constituency_id UUID NOT NULL REFERENCES mptc_constituencies(id) ON DELETE CASCADE,
    voter_record_id UUID REFERENCES voter_records(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    priority VARCHAR(50) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. Access Requests (Leader requests access to a constituency)
CREATE TABLE IF NOT EXISTS access_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    district_id UUID NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
    mandal_id UUID NOT NULL REFERENCES mandals(id) ON DELETE CASCADE,
    constituency_id UUID NOT NULL REFERENCES mptc_constituencies(id) ON DELETE CASCADE,
    justification TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'revoked')),
    reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. Leader Constituency Access (Active approved permissions)
CREATE TABLE IF NOT EXISTS leader_constituency_access (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    leader_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    constituency_id UUID NOT NULL REFERENCES mptc_constituencies(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
    granted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    CONSTRAINT uq_leader_constituency_active UNIQUE (leader_id, constituency_id)
);

-- 19. CSV Import Jobs
CREATE TABLE IF NOT EXISTS import_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    job_type VARCHAR(50) NOT NULL DEFAULT 'voters' CHECK (job_type IN ('voters', 'geography')),
    total_rows INT DEFAULT 0,
    success_rows INT DEFAULT 0,
    failed_rows INT DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 20. CSV Import Errors Report
CREATE TABLE IF NOT EXISTS import_errors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES import_jobs(id) ON DELETE CASCADE,
    row_number INT NOT NULL,
    raw_data JSONB,
    error_message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 21. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    details JSONB,
    ip_address VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
