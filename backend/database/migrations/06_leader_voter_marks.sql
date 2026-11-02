-- Andhra Pradesh Voter Directory & Constituency Management System
-- Migration 06: Leader Voter Administrative Markings Table & RLS Policies

-- 1. Create table for Leader-specific voter administrative markings
CREATE TABLE IF NOT EXISTS leader_voter_marks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    leader_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    voter_id UUID NOT NULL REFERENCES voter_records(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_leader_voter_mark UNIQUE (leader_id, voter_id)
);

-- 2. Indexes for high-performance filtering and lookups
CREATE INDEX IF NOT EXISTS idx_leader_voter_marks_leader ON leader_voter_marks (leader_id);
CREATE INDEX IF NOT EXISTS idx_leader_voter_marks_voter ON leader_voter_marks (voter_id);
CREATE INDEX IF NOT EXISTS idx_leader_voter_marks_created ON leader_voter_marks (leader_id, created_at DESC);

-- 3. Enable Row-Level Security
ALTER TABLE leader_voter_marks ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies:
-- Leader can only select, insert, and delete their OWN markings.
-- Super Admin has full administrative visibility.
CREATE POLICY "Leader can view own voter markings"
ON leader_voter_marks FOR SELECT
TO authenticated
USING (leader_id = public.current_profile_id() OR public.is_super_admin());

CREATE POLICY "Leader can create own voter markings"
ON leader_voter_marks FOR INSERT
TO authenticated
WITH CHECK (leader_id = public.current_profile_id() OR public.is_super_admin());

CREATE POLICY "Leader can delete own voter markings"
ON leader_voter_marks FOR DELETE
TO authenticated
USING (leader_id = public.current_profile_id() OR public.is_super_admin());

CREATE POLICY "Super Admin full access to markings"
ON leader_voter_marks FOR ALL
TO authenticated
USING (public.is_super_admin());

-- 5. Trigger for updated_at
DROP TRIGGER IF EXISTS trg_set_updated_at_leader_voter_marks ON leader_voter_marks;
CREATE TRIGGER trg_set_updated_at_leader_voter_marks
BEFORE UPDATE ON leader_voter_marks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
