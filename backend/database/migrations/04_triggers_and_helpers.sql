-- Andhra Pradesh Voter Directory & Constituency Management System
-- Migration 04: Triggers and Automated Functions

-- Generic Updated At Trigger Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at Triggers
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN
        SELECT table_name
        FROM information_schema.columns
        WHERE column_name = 'updated_at'
          AND table_schema = 'public'
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS trg_set_updated_at_%I ON %I;
            CREATE TRIGGER trg_set_updated_at_%I
            BEFORE UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        ', tbl, tbl, tbl, tbl);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Helper function to recalculate constituency voter counts
CREATE OR REPLACE FUNCTION refresh_constituency_elector_count(cid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE mptc_constituencies
    SET total_electors = (
        SELECT COUNT(*) FROM voter_records WHERE constituency_id = cid
    )
    WHERE id = cid;
END;
$$ LANGUAGE plpgsql;
