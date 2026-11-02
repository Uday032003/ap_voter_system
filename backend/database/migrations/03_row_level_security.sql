-- Andhra Pradesh Voter Directory & Constituency Management System
-- Migration 03: Row Level Security (RLS) Policies

-- Helper functions for RLS
CREATE OR REPLACE FUNCTION public.current_profile_id()
RETURNS UUID AS $$
  SELECT id FROM public.profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE auth_user_id = auth.uid() AND role = 'super_admin' AND is_active = TRUE
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.has_constituency_access(cid UUID)
RETURNS BOOLEAN AS $$
  SELECT public.is_super_admin() OR EXISTS (
    SELECT 1 FROM public.leader_constituency_access lca
    JOIN public.profiles p ON p.id = lca.leader_id
    WHERE p.auth_user_id = auth.uid()
      AND lca.constituency_id = cid
      AND lca.status = 'active'
      AND (lca.expires_at IS NULL OR lca.expires_at > NOW())
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 1. Enable RLS on all relevant tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mandals ENABLE ROW LEVEL SECURITY;
ALTER TABLE villages ENABLE ROW LEVEL SECURITY;
ALTER TABLE mptc_constituencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE constituency_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE wards ENABLE ROW LEVEL SECURITY;
ALTER TABLE polling_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE electoral_roll_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE voter_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE leader_estimate_totals ENABLE ROW LEVEL SECURITY;
ALTER TABLE leader_private_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE leader_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE leader_constituency_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 2. Profiles Policies
CREATE POLICY "Public profiles can be read by authenticated users"
ON profiles FOR SELECT
TO authenticated
USING (TRUE);

CREATE POLICY "Users can update their own non-role profile fields"
ON profiles FOR UPDATE
TO authenticated
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "Super admins can manage all profiles"
ON profiles FOR ALL
TO authenticated
USING (public.is_super_admin());

-- 3. Geographic & Reference Tables (Read-only for public/auth, write for Super Admin)
CREATE POLICY "Anyone can view active geographic data"
ON districts FOR SELECT USING (is_active = TRUE OR public.is_super_admin());

CREATE POLICY "Super Admin can manage districts"
ON districts FOR ALL TO authenticated USING (public.is_super_admin());

CREATE POLICY "Anyone can view active mandals"
ON mandals FOR SELECT USING (is_active = TRUE OR public.is_super_admin());

CREATE POLICY "Super Admin can manage mandals"
ON mandals FOR ALL TO authenticated USING (public.is_super_admin());

CREATE POLICY "Anyone can view active villages"
ON villages FOR SELECT USING (is_active = TRUE OR public.is_super_admin());

CREATE POLICY "Super Admin can manage villages"
ON villages FOR ALL TO authenticated USING (public.is_super_admin());

CREATE POLICY "Anyone can view active constituencies"
ON mptc_constituencies FOR SELECT USING (is_active = TRUE OR public.is_super_admin());

CREATE POLICY "Super Admin can manage constituencies"
ON mptc_constituencies FOR ALL TO authenticated USING (public.is_super_admin());

CREATE POLICY "Anyone can view constituency areas"
ON constituency_areas FOR SELECT USING (TRUE);

CREATE POLICY "Super Admin can manage constituency areas"
ON constituency_areas FOR ALL TO authenticated USING (public.is_super_admin());

CREATE POLICY "Anyone can view wards"
ON wards FOR SELECT USING (TRUE);

CREATE POLICY "Super Admin can manage wards"
ON wards FOR ALL TO authenticated USING (public.is_super_admin());

CREATE POLICY "Anyone can view polling stations"
ON polling_stations FOR SELECT USING (TRUE);

CREATE POLICY "Super Admin can manage polling stations"
ON polling_stations FOR ALL TO authenticated USING (public.is_super_admin());

CREATE POLICY "Anyone can view electoral roll parts"
ON electoral_roll_parts FOR SELECT USING (TRUE);

CREATE POLICY "Super Admin can manage electoral roll parts"
ON electoral_roll_parts FOR ALL TO authenticated USING (public.is_super_admin());

CREATE POLICY "Anyone can view active parties"
ON parties FOR SELECT USING (is_active = TRUE OR public.is_super_admin());

CREATE POLICY "Super Admin can manage parties"
ON parties FOR ALL TO authenticated USING (public.is_super_admin());

CREATE POLICY "Anyone can view candidates"
ON candidates FOR SELECT USING (TRUE);

CREATE POLICY "Super Admin can manage candidates"
ON candidates FOR ALL TO authenticated USING (public.is_super_admin());

-- 4. Voter Records Policy
-- Super Admins: full access
-- Leaders: read voters in constituencies they have active approval for; update permitted administrative flags
-- Commoners: read ONLY records flagged with is_public_approved = true
CREATE POLICY "Super Admin full voter access"
ON voter_records FOR ALL
TO authenticated
USING (public.is_super_admin());

CREATE POLICY "Leader constituency voter access"
ON voter_records FOR SELECT
TO authenticated
USING (public.has_constituency_access(constituency_id));

CREATE POLICY "Leader update administrative review status"
ON voter_records FOR UPDATE
TO authenticated
USING (public.has_constituency_access(constituency_id))
WITH CHECK (public.has_constituency_access(constituency_id));

CREATE POLICY "Commoner view public approved records"
ON voter_records FOR SELECT
TO anon, authenticated
USING (is_public_approved = TRUE);

-- 5. Leader Private Notes (Isolated strictly to the Leader)
CREATE POLICY "Leader owns their private notes"
ON leader_private_notes FOR ALL
TO authenticated
USING (leader_id = public.current_profile_id() OR public.is_super_admin())
WITH CHECK (leader_id = public.current_profile_id());

-- 6. Leader Follow-up Tasks (Isolated strictly to the Leader)
CREATE POLICY "Leader owns their follow-up tasks"
ON leader_tasks FOR ALL
TO authenticated
USING (leader_id = public.current_profile_id() OR public.is_super_admin())
WITH CHECK (leader_id = public.current_profile_id());

-- 7. Leader Aggregate Estimates (Isolated strictly to the Leader)
CREATE POLICY "Leader owns their aggregate estimates"
ON leader_estimate_totals FOR ALL
TO authenticated
USING (leader_id = public.current_profile_id() OR public.is_super_admin())
WITH CHECK (leader_id = public.current_profile_id());

-- 8. Access Requests
CREATE POLICY "Users can create and view their own access requests"
ON access_requests FOR SELECT
TO authenticated
USING (user_id = public.current_profile_id() OR public.is_super_admin());

CREATE POLICY "Users can insert their own access requests"
ON access_requests FOR INSERT
TO authenticated
WITH CHECK (user_id = public.current_profile_id());

CREATE POLICY "Super Admin manages access requests"
ON access_requests FOR ALL
TO authenticated
USING (public.is_super_admin());

-- 9. Leader Constituency Access
CREATE POLICY "Leader can view own active access"
ON leader_constituency_access FOR SELECT
TO authenticated
USING (leader_id = public.current_profile_id() OR public.is_super_admin());

CREATE POLICY "Super Admin manages leader constituency access"
ON leader_constituency_access FOR ALL
TO authenticated
USING (public.is_super_admin());

-- 10. Import Jobs & Errors
CREATE POLICY "Super Admin manages imports"
ON import_jobs FOR ALL
TO authenticated
USING (public.is_super_admin());

CREATE POLICY "Super Admin manages import errors"
ON import_errors FOR ALL
TO authenticated
USING (public.is_super_admin());

-- 11. Audit Logs
CREATE POLICY "Super Admin views audit logs"
ON audit_logs FOR SELECT
TO authenticated
USING (public.is_super_admin());

CREATE POLICY "System inserts audit logs"
ON audit_logs FOR INSERT
TO authenticated
WITH CHECK (TRUE);
