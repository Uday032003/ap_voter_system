-- Andhra Pradesh Voter Directory & Constituency Management System
-- Migration 02: High-Performance Search & Foreign Key Indexes

-- Voter Directory Trigram and Pattern-Matching Indexes (Bilingual Search)
CREATE INDEX IF NOT EXISTS idx_voters_name_en_trgm ON voter_records USING gin (name_en gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_voters_name_te_trgm ON voter_records USING gin (name_te gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_voters_relative_en_trgm ON voter_records USING gin (relative_name_en gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_voters_relative_te_trgm ON voter_records USING gin (relative_name_te gin_trgm_ops);

-- Voter Directory Filtering & Ordering Indexes
CREATE INDEX IF NOT EXISTS idx_voters_constituency ON voter_records (constituency_id);
CREATE INDEX IF NOT EXISTS idx_voters_part ON voter_records (part_id);
CREATE INDEX IF NOT EXISTS idx_voters_part_serial ON voter_records (part_id, serial_number ASC);
CREATE INDEX IF NOT EXISTS idx_voters_constituency_part_serial ON voter_records (constituency_id, part_id, serial_number ASC);
CREATE INDEX IF NOT EXISTS idx_voters_house_no ON voter_records (house_number_en);
CREATE INDEX IF NOT EXISTS idx_voters_review_status ON voter_records (review_status);
CREATE INDEX IF NOT EXISTS idx_voters_public_approved ON voter_records (is_public_approved);

-- Geographic Hierarchy Indexes
CREATE INDEX IF NOT EXISTS idx_mandals_district ON mandals (district_id);
CREATE INDEX IF NOT EXISTS idx_villages_mandal ON villages (mandal_id);
CREATE INDEX IF NOT EXISTS idx_constituencies_mandal ON mptc_constituencies (mandal_id);
CREATE INDEX IF NOT EXISTS idx_constituency_areas_constituency ON constituency_areas (constituency_id);
CREATE INDEX IF NOT EXISTS idx_constituency_areas_village ON constituency_areas (village_id);
CREATE INDEX IF NOT EXISTS idx_wards_village ON wards (village_id);
CREATE INDEX IF NOT EXISTS idx_polling_stations_constituency ON polling_stations (constituency_id);
CREATE INDEX IF NOT EXISTS idx_electoral_roll_parts_constituency ON electoral_roll_parts (constituency_id);
CREATE INDEX IF NOT EXISTS idx_electoral_roll_parts_station ON electoral_roll_parts (polling_station_id);

-- Leader Workspace & Privacy Indexes
CREATE INDEX IF NOT EXISTS idx_leader_access_leader ON leader_constituency_access (leader_id, status);
CREATE INDEX IF NOT EXISTS idx_leader_access_constituency ON leader_constituency_access (constituency_id, status);
CREATE INDEX IF NOT EXISTS idx_leader_notes_leader ON leader_private_notes (leader_id, constituency_id);
CREATE INDEX IF NOT EXISTS idx_leader_notes_voter ON leader_private_notes (voter_record_id);
CREATE INDEX IF NOT EXISTS idx_leader_tasks_leader ON leader_tasks (leader_id, constituency_id, status);
CREATE INDEX IF NOT EXISTS idx_leader_tasks_due ON leader_tasks (due_date);
CREATE INDEX IF NOT EXISTS idx_leader_estimates_leader ON leader_estimate_totals (leader_id, constituency_id);

-- Candidate and Party Indexes
CREATE INDEX IF NOT EXISTS idx_candidates_constituency ON candidates (constituency_id, election_year);
CREATE INDEX IF NOT EXISTS idx_candidates_party ON candidates (party_id);

-- Access Requests & Import Indexes
CREATE INDEX IF NOT EXISTS idx_access_requests_user ON access_requests (user_id, status);
CREATE INDEX IF NOT EXISTS idx_access_requests_status ON access_requests (status);
CREATE INDEX IF NOT EXISTS idx_import_jobs_user ON import_jobs (user_id);
CREATE INDEX IF NOT EXISTS idx_import_errors_job ON import_errors (job_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs (created_at DESC);
