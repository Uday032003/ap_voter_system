# Andhra Pradesh Voter Directory & Constituency Management System
## Database Schema, Migration & Setup Guide

This guide details how to set up the PostgreSQL database schema, apply migrations, enforce Row-Level Security (RLS), and configure Supabase.

---

### Migration Files Overview
All SQL migrations are organized sequentially in the [`backend/database/migrations/`](file:///c:/Users/polim/OneDrive/Desktop/Andhra%20Pradesh%20Voter%20Directory%20&%20Constituency%20Management%20System/backend/database/migrations/) directory:

1. **`01_schema_tables.sql`**: Enables extensions (`uuid-ossp`, `pg_trgm`) and creates all normalized core tables:
   - `profiles`, `districts`, `mandals`, `villages`, `mptc_constituencies`
   - `constituency_areas` (M-to-M mapping of villages to MPTC constituencies)
   - `wards`, `polling_stations`, `electoral_roll_parts`
   - `voter_records` (bilingual Telugu & English names, masked EPIC, part/serial uniqueness)
   - `parties`, `candidates`
   - `leader_estimate_totals` (strictly aggregate party totals, unique per leader & constituency)
   - `leader_private_notes`, `leader_tasks`
   - `access_requests`, `leader_constituency_access`
   - `import_jobs`, `import_errors`, `audit_logs`
2. **`02_indexes.sql`**: High-performance indexes:
   - Trigram GIN indexes on `name_en`, `name_te`, `relative_name_en`, `relative_name_te`
   - B-tree composite indexes for infinite scroll pagination on `(constituency_id, part_id, serial_number ASC)`
   - Foreign key & filter indexes
3. **`03_row_level_security.sql`**: RLS policies:
   - Super Admin: complete administrative access
   - Leader: access restricted to approved constituencies; private notes/tasks/estimates strictly owned by leader
   - Commoner: read-only access strictly restricted to `is_public_approved = true` records with masked fields
4. **`04_triggers_and_helpers.sql`**:
   - Automated `updated_at` timestamp triggers across all tables
   - Helper function `refresh_constituency_elector_count()`
5. **`05_sample_seed_data.sql`**:
   - Seed profiles for Super Admin, Constituency Leader, and Citizen
   - Geographic hierarchy for Guntur district, Mangalagiri mandal, Atmakuru village, and Atmakuru MPTC - 04
   - Official political parties (YSRCP, TDP, JSP, INC, BJP) and candidates
   - Approved leader access mappings and baseline aggregate estimates
6. **`06_leader_voter_marks.sql`**:
   - Creates the dedicated `leader_voter_marks` table for touch-friendly per-voter administrative tracking
   - Foreign keys to `profiles(id)` (leader) and `voter_records(id)` (voter)
   - Unique constraint `(leader_id, voter_id)` preventing duplicate markings
   - Separate data isolation: keeps official voter records clean and non-partisan
   - Row-Level Security policies: Leaders can strictly read, insert, and delete only their own markings; Commoners have 0 access; Super Admins can audit all markings
   - Automatic `updated_at` trigger and index on `(leader_id, created_at DESC)`

---

### Setting Up with Supabase

#### Option A: Supabase Web Dashboard (SQL Editor)
1. Log into your [Supabase Dashboard](https://app.supabase.com) and open your project.
2. Navigate to **SQL Editor** in the left sidebar.
3. Open and run the migration scripts in numerical order:
   - Copy content of `01_schema_tables.sql` → Run
   - Copy content of `02_indexes.sql` → Run
   - Copy content of `03_row_level_security.sql` → Run
   - Copy content of `04_triggers_and_helpers.sql` → Run
   - Copy content of `05_sample_seed_data.sql` → Run
   - Copy content of `06_leader_voter_marks.sql` → Run
4. Navigate to **Project Settings** → **API** to copy:
   - Project URL (`SUPABASE_URL` / `VITE_SUPABASE_URL`)
   - `anon` `public` key (`SUPABASE_ANON_KEY` / `VITE_SUPABASE_ANON_KEY`)
   - `service_role` `secret` key (`SUPABASE_SERVICE_ROLE_KEY`)
5. Update `backend/.env` with these credentials:
   ```env
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOi...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
   ```

#### Option B: Supabase CLI
```bash
supabase login
supabase link --project-ref your-project-id
supabase db push
```

---

### How to Create the First Super Admin
To grant an account full Super Admin privileges:

1. Have the user sign up through the application or Supabase Auth.
2. In the Supabase SQL Editor, promote their profile:
   ```sql
   UPDATE profiles
   SET role = 'super_admin'
   WHERE email = 'admin@yourdomain.com';
   ```
3. Super Admins can then promote or approve other Leaders directly via the **Admin Center** (`/admin`).
