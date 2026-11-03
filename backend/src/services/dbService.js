import { pool } from '../config/db.js';
import { supabaseAdmin, supabaseClient } from '../config/supabase.js';
import { ENV } from '../config/env.js';

let overrideClient = null;

function hasPool() {
  return !overrideClient && Boolean(pool);
}

function getClient() {
  if (overrideClient) return overrideClient;
  const client = supabaseAdmin || supabaseClient;
  if (!client && !hasPool()) {
    throw new Error('Database is not configured. Please set DATABASE_URL or SUPABASE_URL in your environment variables.');
  }
  return client;
}

export const dbService = {
  getClient() {
    return getClient();
  },
  setClient(client) {
    overrideClient = client;
  },

  // Connection Health Check
  async checkHealth() {
    if (hasPool()) {
      const { rows } = await pool.query('SELECT 1 as healthy');
      return Boolean(rows.length > 0);
    }
    const client = getClient();
    const { data, error } = await client.from('districts').select('id').limit(1);
    if (error) throw error;
    return true;
  },

  // ==========================================
  // 1. PROFILES & AUTHENTICATION
  // ==========================================
  async getProfileByEmail(email) {
    if (hasPool()) {
      const { rows } = await pool.query('SELECT * FROM profiles WHERE lower(email) = lower($1)', [email.trim()]);
      return rows[0] || null;
    }
    const client = getClient();
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .ilike('email', email.trim().toLowerCase())
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  async getProfileById(id) {
    if (hasPool()) {
      const { rows } = await pool.query('SELECT * FROM profiles WHERE id = $1', [id]);
      return rows[0] || null;
    }
    const client = getClient();
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  async createProfile(profileData) {
    if (hasPool()) {
      const keys = Object.keys(profileData);
      const vals = Object.values(profileData);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      const query = `INSERT INTO profiles (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`;
      const { rows } = await pool.query(query, vals);
      return rows[0];
    }
    const client = getClient();
    const { data, error } = await client
      .from('profiles')
      .insert([profileData])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateProfile(id, updates) {
    if (hasPool()) {
      const keys = Object.keys(updates);
      const vals = Object.values(updates);
      const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
      vals.push(id);
      const query = `UPDATE profiles SET ${setClause}, updated_at = NOW() WHERE id = $${vals.length} RETURNING *`;
      const { rows } = await pool.query(query, vals);
      return rows[0];
    }
    const client = getClient();
    const { data, error } = await client
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // ==========================================
  // 2. GEOGRAPHIC HIERARCHY
  // State (AP) -> District -> Assembly -> MPTC Village
  // ==========================================
  async getDistricts() {
    if (hasPool()) {
      const { rows } = await pool.query('SELECT * FROM districts WHERE is_active = true ORDER BY name_en ASC');
      return rows;
    }
    const client = getClient();
    const { data, error } = await client.from('districts').select('*').eq('is_active', true).order('name_en');
    if (error) throw error;
    return data || [];
  },

  async getAssemblyConstituencies(districtId = null) {
    if (hasPool()) {
      const query = districtId
        ? 'SELECT a.*, d.name_en as district_name_en, d.name_te as district_name_te FROM assembly_constituencies a JOIN districts d ON a.district_id = d.id WHERE a.district_id = $1 AND a.is_active = true ORDER BY a.name_en ASC'
        : 'SELECT a.*, d.name_en as district_name_en, d.name_te as district_name_te FROM assembly_constituencies a JOIN districts d ON a.district_id = d.id WHERE a.is_active = true ORDER BY a.name_en ASC';
      const { rows } = await pool.query(query, districtId ? [districtId] : []);
      return rows;
    }
    const client = getClient();
    let query = client.from('assembly_constituencies').select('*, districts:district_id(*)').eq('is_active', true);
    if (districtId) query = query.eq('district_id', districtId);
    const { data, error } = await query.order('name_en');
    if (error) throw error;
    return data || [];
  },

  async getMptcConstituencies(assemblyId = null, districtId = null) {
    if (hasPool()) {
      const conditions = ['m.is_active = true'];
      const values = [];
      let idx = 1;

      if (assemblyId) {
        conditions.push(`m.assembly_constituency_id = $${idx++}`);
        values.push(assemblyId);
      }
      if (districtId) {
        conditions.push(`m.district_id = $${idx++}`);
        values.push(districtId);
      }

      const query = `
        SELECT m.*, 
               a.name_en as assembly_name_en, a.name_te as assembly_name_te,
               d.name_en as district_name_en, d.name_te as district_name_te
        FROM mptc_village_constituencies m
        JOIN assembly_constituencies a ON m.assembly_constituency_id = a.id
        JOIN districts d ON m.district_id = d.id
        WHERE ${conditions.join(' AND ')}
        ORDER BY m.name_en ASC
      `;
      const { rows } = await pool.query(query, values);
      return rows;
    }
    const client = getClient();
    let query = client.from('mptc_village_constituencies').select('*, assembly_constituencies(*), districts(*)').eq('is_active', true);
    if (assemblyId) query = query.eq('assembly_constituency_id', assemblyId);
    if (districtId) query = query.eq('district_id', districtId);
    const { data, error } = await query.order('name_en');
    if (error) throw error;
    return data || [];
  },

  async getConstituencyById(id) {
    if (hasPool()) {
      const { rows } = await pool.query(`
        SELECT m.*,
               a.id as assembly_id, a.name_en as assembly_name_en, a.name_te as assembly_name_te,
               d.id as district_id, d.name_en as district_name_en, d.name_te as district_name_te
        FROM mptc_village_constituencies m
        JOIN assembly_constituencies a ON m.assembly_constituency_id = a.id
        JOIN districts d ON m.district_id = d.id
        WHERE m.id = $1
      `, [id]);
      return rows[0] || null;
    }
    const client = getClient();
    const { data, error } = await client
      .from('mptc_village_constituencies')
      .select('*, assembly_constituencies(*), districts(*)')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  async getConstituencies() {
    return this.getMptcConstituencies();
  },

  // Super Admin Hierarchy Management
  async createDistrict({ code, name_en, name_te }) {
    if (hasPool()) {
      const { rows } = await pool.query(
        'INSERT INTO districts (state_code, code, name_en, name_te) VALUES ($1, $2, $3, $4) RETURNING *',
        ['AP', code.trim().toUpperCase(), name_en.trim(), name_te ? name_te.trim() : name_en.trim()]
      );
      return rows[0];
    }
    const client = getClient();
    const { data, error } = await client.from('districts').insert([{ state_code: 'AP', code: code.trim().toUpperCase(), name_en, name_te: name_te || name_en }]).select().single();
    if (error) throw error;
    return data;
  },

  async updateDistrict(id, { name_en, name_te, is_active }) {
    if (hasPool()) {
      const updates = [];
      const values = [];
      let idx = 1;
      if (name_en !== undefined) { updates.push(`name_en = $${idx++}`); values.push(name_en); }
      if (name_te !== undefined) { updates.push(`name_te = $${idx++}`); values.push(name_te); }
      if (is_active !== undefined) { updates.push(`is_active = $${idx++}`); values.push(is_active); }
      updates.push('updated_at = NOW()');
      values.push(id);
      const { rows } = await pool.query(`UPDATE districts SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`, values);
      return rows[0];
    }
    const client = getClient();
    const { data, error } = await client.from('districts').update({ name_en, name_te, is_active }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async createAssemblyConstituency({ district_id, code, name_en, name_te }) {
    if (hasPool()) {
      const { rows } = await pool.query(
        'INSERT INTO assembly_constituencies (district_id, code, name_en, name_te) VALUES ($1, $2, $3, $4) RETURNING *',
        [district_id, code.trim().toUpperCase(), name_en.trim(), name_te ? name_te.trim() : name_en.trim()]
      );
      return rows[0];
    }
    const client = getClient();
    const { data, error } = await client.from('assembly_constituencies').insert([{ district_id, code: code.trim().toUpperCase(), name_en, name_te: name_te || name_en }]).select().single();
    if (error) throw error;
    return data;
  },

  async updateAssemblyConstituency(id, { name_en, name_te, is_active }) {
    if (hasPool()) {
      const updates = [];
      const values = [];
      let idx = 1;
      if (name_en !== undefined) { updates.push(`name_en = $${idx++}`); values.push(name_en); }
      if (name_te !== undefined) { updates.push(`name_te = $${idx++}`); values.push(name_te); }
      if (is_active !== undefined) { updates.push(`is_active = $${idx++}`); values.push(is_active); }
      updates.push('updated_at = NOW()');
      values.push(id);
      const { rows } = await pool.query(`UPDATE assembly_constituencies SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`, values);
      return rows[0];
    }
    const client = getClient();
    const { data, error } = await client.from('assembly_constituencies').update({ name_en, name_te, is_active }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async createMptcConstituency({ assembly_constituency_id, code, name_en, name_te, total_electors = 0 }) {
    if (hasPool()) {
      const aRes = await pool.query('SELECT district_id FROM assembly_constituencies WHERE id = $1', [assembly_constituency_id]);
      if (aRes.rows.length === 0) throw new Error('Assembly constituency not found');
      const district_id = aRes.rows[0].district_id;

      const { rows } = await pool.query(
        'INSERT INTO mptc_village_constituencies (assembly_constituency_id, district_id, code, name_en, name_te, total_electors) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [assembly_constituency_id, district_id, code.trim().toUpperCase(), name_en.trim(), name_te ? name_te.trim() : name_en.trim(), total_electors]
      );
      return rows[0];
    }
    const client = getClient();
    const { data: assembly } = await client.from('assembly_constituencies').select('district_id').eq('id', assembly_constituency_id).single();
    const { data, error } = await client.from('mptc_village_constituencies').insert([{
      assembly_constituency_id,
      district_id: assembly.district_id,
      code: code.trim().toUpperCase(),
      name_en,
      name_te: name_te || name_en,
      total_electors
    }]).select().single();
    if (error) throw error;
    return data;
  },

  async updateMptcConstituency(id, { name_en, name_te, total_electors, is_active }) {
    if (hasPool()) {
      const updates = [];
      const values = [];
      let idx = 1;
      if (name_en !== undefined) { updates.push(`name_en = $${idx++}`); values.push(name_en); }
      if (name_te !== undefined) { updates.push(`name_te = $${idx++}`); values.push(name_te); }
      if (total_electors !== undefined) { updates.push(`total_electors = $${idx++}`); values.push(total_electors); }
      if (is_active !== undefined) { updates.push(`is_active = $${idx++}`); values.push(is_active); }
      updates.push('updated_at = NOW()');
      values.push(id);
      const { rows } = await pool.query(`UPDATE mptc_village_constituencies SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`, values);
      return rows[0];
    }
    const client = getClient();
    const { data, error } = await client.from('mptc_village_constituencies').update({ name_en, name_te, total_electors, is_active }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async getFullHierarchyTree() {
    if (hasPool()) {
      const districtsRes = await pool.query('SELECT * FROM districts ORDER BY name_en ASC');
      const assembliesRes = await pool.query('SELECT * FROM assembly_constituencies ORDER BY name_en ASC');
      const mptcsRes = await pool.query('SELECT * FROM mptc_village_constituencies ORDER BY name_en ASC');

      const districts = districtsRes.rows;
      const assemblies = assembliesRes.rows;
      const mptcs = mptcsRes.rows;

      return districts.map(d => ({
        ...d,
        assemblyConstituencies: assemblies
          .filter(a => a.district_id === d.id)
          .map(a => ({
            ...a,
            mptcConstituencies: mptcs.filter(m => m.assembly_constituency_id === a.id)
          }))
      }));
    }
    const client = getClient();
    const { data: districts } = await client.from('districts').select('*').order('name_en');
    const { data: assemblies } = await client.from('assembly_constituencies').select('*').order('name_en');
    const { data: mptcs } = await client.from('mptc_village_constituencies').select('*').order('name_en');

    return (districts || []).map(d => ({
      ...d,
      assemblyConstituencies: (assemblies || [])
        .filter(a => a.district_id === d.id)
        .map(a => ({
          ...a,
          mptcConstituencies: (mptcs || []).filter(m => m.assembly_constituency_id === a.id)
        }))
    }));
  },

  // ==========================================
  // 3. PERSISTED USER CONSTITUENCY SELECTION
  // ==========================================
  async getUserConstituencySelection(userId) {
    if (hasPool()) {
      const { rows } = await pool.query(`
        SELECT s.id, s.mptc_village_constituency_id, s.updated_at,
               m.code as mptc_code, m.name_en as mptc_name_en, m.name_te as mptc_name_te, m.total_electors,
               a.id as assembly_id, a.code as assembly_code, a.name_en as assembly_name_en, a.name_te as assembly_name_te,
               d.id as district_id, d.code as district_code, d.name_en as district_name_en, d.name_te as district_name_te
        FROM user_constituency_selections s
        JOIN mptc_village_constituencies m ON s.mptc_village_constituency_id = m.id
        JOIN assembly_constituencies a ON m.assembly_constituency_id = a.id
        JOIN districts d ON m.district_id = d.id
        WHERE s.user_id = $1
      `, [userId]);
      return rows[0] || null;
    }
    const client = getClient();
    const { data, error } = await client
      .from('user_constituency_selections')
      .select('*, mptc_village_constituencies(*, assembly_constituencies(*), districts(*))')
      .eq('user_id', userId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;
    const m = data.mptc_village_constituencies;
    return {
      id: data.id,
      mptc_village_constituency_id: data.mptc_village_constituency_id,
      updated_at: data.updated_at,
      mptc_code: m?.code,
      mptc_name_en: m?.name_en,
      mptc_name_te: m?.name_te,
      total_electors: m?.total_electors,
      assembly_id: m?.assembly_constituencies?.id,
      assembly_name_en: m?.assembly_constituencies?.name_en,
      assembly_name_te: m?.assembly_constituencies?.name_te,
      district_id: m?.districts?.id,
      district_name_en: m?.districts?.name_en,
      district_name_te: m?.districts?.name_te
    };
  },

  async saveUserConstituencySelection(userId, mptcConstituencyId) {
    if (hasPool()) {
      const { rows } = await pool.query(`
        INSERT INTO user_constituency_selections (user_id, mptc_village_constituency_id, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (user_id)
        DO UPDATE SET mptc_village_constituency_id = EXCLUDED.mptc_village_constituency_id, updated_at = NOW()
        RETURNING *
      `, [userId, mptcConstituencyId]);
      return rows[0];
    }
    const client = getClient();
    const { data, error } = await client
      .from('user_constituency_selections')
      .upsert({ user_id: userId, mptc_village_constituency_id: mptcConstituencyId, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // ==========================================
  // 4. SUPER ADMIN DASHBOARD METRICS
  // Real database metrics, zero mock fallbacks
  // ==========================================
  async getAdminDashboardStats() {
    if (hasPool()) {
      const statsQuery = `
        SELECT 
          (SELECT COUNT(*)::int FROM districts WHERE is_active = true) as districts_count,
          (SELECT COUNT(*)::int FROM assembly_constituencies WHERE is_active = true) as assemblies_count,
          (SELECT COUNT(*)::int FROM mptc_village_constituencies WHERE is_active = true) as mptcs_count,
          (SELECT COUNT(*)::int FROM voters) as total_voters,
          (SELECT COUNT(*)::int FROM leader_access_requests WHERE status = 'pending') as pending_requests_count,
          (SELECT COUNT(*)::int FROM voter_imports WHERE status = 'failed') as failed_imports_count,
          (SELECT COUNT(*)::int FROM profiles WHERE role = 'leader') as leaders_count
      `;
      const statsRes = await pool.query(statsQuery);

      const recentImportsRes = await pool.query(`
        SELECT i.*, m.name_en as constituency_name_en, m.name_te as constituency_name_te, p.full_name_en as uploader_name
        FROM voter_imports i
        JOIN mptc_village_constituencies m ON i.mptc_village_constituency_id = m.id
        LEFT JOIN profiles p ON i.uploaded_by = p.id
        ORDER BY i.created_at DESC
        LIMIT 5
      `);

      return {
        ...statsRes.rows[0],
        recentImports: recentImportsRes.rows
      };
    }
    const client = getClient();
    const [d, a, m, v, r, f] = await Promise.all([
      client.from('districts').select('id', { count: 'exact', head: true }),
      client.from('assembly_constituencies').select('id', { count: 'exact', head: true }),
      client.from('mptc_village_constituencies').select('id', { count: 'exact', head: true }),
      client.from('voters').select('id', { count: 'exact', head: true }),
      client.from('leader_access_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      client.from('voter_imports').select('id', { count: 'exact', head: true }).eq('status', 'failed')
    ]);

    const { data: recentImports } = await client
      .from('voter_imports')
      .select('*, mptc_village_constituencies(name_en, name_te)')
      .order('created_at', { ascending: false })
      .limit(5);

    return {
      districts_count: d.count || 0,
      assemblies_count: a.count || 0,
      mptcs_count: m.count || 0,
      total_voters: v.count || 0,
      pending_requests_count: r.count || 0,
      failed_imports_count: f.count || 0,
      recentImports: recentImports || []
    };
  },

  // ==========================================
  // 5. LEADER ACCESS & DASHBOARD STATS
  // ==========================================
  async hasLeaderConstituencyAccess(leaderId, constituencyId) {
    if (hasPool()) {
      const { rows } = await pool.query(`
        SELECT id FROM leader_constituency_access
        WHERE leader_id = $1 AND mptc_village_constituency_id = $2 AND status = 'active'
        AND (expires_at IS NULL OR expires_at > NOW())
      `, [leaderId, constituencyId]);
      return rows.length > 0;
    }
    const client = getClient();
    const { data, error } = await client
      .from('leader_constituency_access')
      .select('id, expires_at')
      .eq('leader_id', leaderId)
      .eq('mptc_village_constituency_id', constituencyId)
      .eq('status', 'active');
    if (error) throw error;
    if (!data || data.length === 0) return false;
    const record = data[0];
    return !record.expires_at || new Date(record.expires_at) > new Date();
  },

  async getLeaderApprovedConstituencies(leaderId) {
    if (hasPool()) {
      const { rows } = await pool.query(`
        SELECT c.*, a.name_en as assembly_name_en, a.name_te as assembly_name_te, d.name_en as district_name_en
        FROM leader_constituency_access lca
        JOIN mptc_village_constituencies c ON lca.mptc_village_constituency_id = c.id
        JOIN assembly_constituencies a ON c.assembly_constituency_id = a.id
        JOIN districts d ON c.district_id = d.id
        WHERE lca.leader_id = $1 AND lca.status = 'active'
        AND (lca.expires_at IS NULL OR lca.expires_at > NOW())
      `, [leaderId]);
      return rows;
    }
    const client = getClient();
    const { data, error } = await client
      .from('leader_constituency_access')
      .select('mptc_village_constituencies(*, assembly_constituencies(*), districts(*))')
      .eq('leader_id', leaderId)
      .eq('status', 'active');
    if (error) throw error;
    return (data || []).map(d => d.mptc_village_constituencies).filter(Boolean);
  },

  async getLeaderDashboardStats(leaderId, constituencyId = null) {
    if (hasPool()) {
      let targetConstituencyId = constituencyId;
      if (!targetConstituencyId) {
        const savedSel = await this.getUserConstituencySelection(leaderId);
        targetConstituencyId = savedSel?.mptc_village_constituency_id;
      }

      if (!targetConstituencyId) {
        const approved = await this.getLeaderApprovedConstituencies(leaderId);
        targetConstituencyId = approved[0]?.id || null;
      }

      if (!targetConstituencyId) {
        const lastReq = await pool.query(`
          SELECT mptc_village_constituency_id, status FROM leader_access_requests
          WHERE leader_id = $1
          ORDER BY created_at DESC LIMIT 1
        `, [leaderId]);
        if (lastReq.rows.length > 0) {
          targetConstituencyId = lastReq.rows[0].mptc_village_constituency_id;
        }
      }

      let constituency = null;
      let accessStatus = 'none';

      if (targetConstituencyId) {
        const cRes = await pool.query(`
          SELECT m.*, a.name_en as assembly_name_en, a.name_te as assembly_name_te,
                 d.name_en as district_name_en, d.name_te as district_name_te
          FROM mptc_village_constituencies m
          JOIN assembly_constituencies a ON m.assembly_constituency_id = a.id
          JOIN districts d ON m.district_id = d.id
          WHERE m.id = $1
        `, [targetConstituencyId]);
        constituency = cRes.rows[0] || null;

        const hasActive = await this.hasLeaderConstituencyAccess(leaderId, targetConstituencyId);
        if (hasActive) {
          accessStatus = 'approved';
        } else {
          const reqRes = await pool.query(`
            SELECT status FROM leader_access_requests
            WHERE leader_id = $1 AND mptc_village_constituency_id = $2
            ORDER BY created_at DESC LIMIT 1
          `, [leaderId, targetConstituencyId]);
          accessStatus = reqRes.rows[0]?.status || 'none';
        }
      }

      let totalAvailableVoters = 0;
      let totalAddedVoters = 0;

      if (targetConstituencyId && accessStatus === 'approved') {
        const vCount = await pool.query('SELECT COUNT(*)::int as total FROM voters WHERE mptc_village_constituency_id = $1', [targetConstituencyId]);
        totalAvailableVoters = vCount.rows[0]?.total || 0;
      }

      const addedCount = await pool.query(`
        SELECT COUNT(*)::int as total 
        FROM leader_added_voters lav
        JOIN voters v ON lav.voter_id = v.id
        WHERE lav.leader_id = $1 ${targetConstituencyId ? 'AND v.mptc_village_constituency_id = $2' : ''}
      `, targetConstituencyId ? [leaderId, targetConstituencyId] : [leaderId]);
      totalAddedVoters = addedCount.rows[0]?.total || 0;

      return {
        constituency,
        accessStatus,
        totalAvailableVoters,
        totalAddedVoters
      };
    }

    return {
      constituency: null,
      accessStatus: 'none',
      totalAvailableVoters: 0,
      totalAddedVoters: 0
    };
  },

  // Leader Access Requests Submission & Management
  async submitAccessRequest({ leaderId, mptcConstituencyId, justification }) {
    if (hasPool()) {
      const { rows } = await pool.query(`
        INSERT INTO leader_access_requests (leader_id, mptc_village_constituency_id, justification, status)
        VALUES ($1, $2, $3, 'pending')
        RETURNING *
      `, [leaderId, mptcConstituencyId, justification]);
      return rows[0];
    }
    const client = getClient();
    const { data, error } = await client
      .from('leader_access_requests')
      .insert([{ leader_id: leaderId, mptc_village_constituency_id: mptcConstituencyId, justification, status: 'pending' }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getAccessRequests(userId = null, role = 'super_admin') {
    if (hasPool()) {
      let query = `
        SELECT r.*,
               p.full_name_en as leader_name, p.email as leader_email, p.phone as leader_phone,
               m.name_en as constituency_name_en, m.name_te as constituency_name_te,
               a.name_en as assembly_name_en, d.name_en as district_name_en,
               rev.full_name_en as reviewer_name
        FROM leader_access_requests r
        JOIN profiles p ON r.leader_id = p.id
        JOIN mptc_village_constituencies m ON r.mptc_village_constituency_id = m.id
        JOIN assembly_constituencies a ON m.assembly_constituency_id = a.id
        JOIN districts d ON m.district_id = d.id
        LEFT JOIN profiles rev ON r.reviewed_by = rev.id
      `;
      const values = [];
      if (role !== 'super_admin' && userId) {
        query += ` WHERE r.leader_id = $1`;
        values.push(userId);
      }
      query += ` ORDER BY r.created_at DESC`;

      const { rows } = await pool.query(query, values);
      return rows;
    }
    const client = getClient();
    let query = client.from('leader_access_requests').select('*, profiles:leader_id(*), mptc_village_constituencies(*, assembly_constituencies(*), districts(*))').order('created_at', { ascending: false });
    if (role !== 'super_admin' && userId) query = query.eq('leader_id', userId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async approveAccessRequest(requestId, reviewedBy, notes = '') {
    if (hasPool()) {
      const rRes = await pool.query('SELECT * FROM leader_access_requests WHERE id = $1', [requestId]);
      if (rRes.rows.length === 0) throw new Error('Access request not found');
      const req = rRes.rows[0];

      await pool.query(`
        UPDATE leader_access_requests
        SET status = 'approved', reviewed_by = $1, review_notes = $2, reviewed_at = NOW(), updated_at = NOW()
        WHERE id = $3
      `, [reviewedBy, notes, requestId]);

      await pool.query(`
        INSERT INTO leader_constituency_access (leader_id, mptc_village_constituency_id, status, granted_by, granted_at)
        VALUES ($1, $2, 'active', $3, NOW())
        ON CONFLICT (leader_id, mptc_village_constituency_id)
        DO UPDATE SET status = 'active', granted_by = EXCLUDED.granted_by, granted_at = NOW(), expires_at = NULL
      `, [req.leader_id, req.mptc_village_constituency_id, reviewedBy]);

      return { success: true, message: 'Access request approved and constituency permissions granted.' };
    }
    const client = getClient();
    const { data: req } = await client.from('leader_access_requests').select('*').eq('id', requestId).single();
    await client.from('leader_access_requests').update({ status: 'approved', reviewed_by: reviewedBy, review_notes: notes, reviewed_at: new Date().toISOString() }).eq('id', requestId);
    await client.from('leader_constituency_access').upsert({ leader_id: req.leader_id, mptc_village_constituency_id: req.mptc_village_constituency_id, status: 'active', granted_by: reviewedBy, granted_at: new Date().toISOString() }, { onConflict: 'leader_id, mptc_village_constituency_id' });
    return { success: true };
  },

  async rejectAccessRequest(requestId, reviewedBy, notes = '') {
    if (hasPool()) {
      await pool.query(`
        UPDATE leader_access_requests
        SET status = 'rejected', reviewed_by = $1, review_notes = $2, reviewed_at = NOW(), updated_at = NOW()
        WHERE id = $3
      `, [reviewedBy, notes, requestId]);
      return { success: true, message: 'Access request rejected.' };
    }
    const client = getClient();
    await client.from('leader_access_requests').update({ status: 'rejected', reviewed_by: reviewedBy, review_notes: notes, reviewed_at: new Date().toISOString() }).eq('id', requestId);
    return { success: true };
  },

  async revokeLeaderAccess(leaderId, mptcConstituencyId, reviewedBy) {
    if (hasPool()) {
      await pool.query(`
        UPDATE leader_constituency_access
        SET status = 'revoked'
        WHERE leader_id = $1 AND mptc_village_constituency_id = $2
      `, [leaderId, mptcConstituencyId]);

      await pool.query(`
        UPDATE leader_access_requests
        SET status = 'revoked', updated_at = NOW()
        WHERE leader_id = $1 AND mptc_village_constituency_id = $2 AND status = 'approved'
      `, [leaderId, mptcConstituencyId]);

      return { success: true, message: 'Constituency access revoked successfully.' };
    }
    const client = getClient();
    await client.from('leader_constituency_access').update({ status: 'revoked' }).eq('leader_id', leaderId).eq('mptc_village_constituency_id', mptcConstituencyId);
    return { success: true };
  },

  // ==========================================
  // 6. LEADER ADMINISTRATIVE LIST (Add to My List)
  // General administrative follow-up tracking only. Zero party fields.
  // ==========================================
  async addVoterToList(leaderId, voterId, notes = null) {
    if (hasPool()) {
      const vRes = await pool.query('SELECT id, mptc_village_constituency_id FROM voters WHERE id = $1', [voterId]);
      if (vRes.rows.length === 0) throw new Error('Voter record not found');
      const voter = vRes.rows[0];

      const hasAccess = await this.hasLeaderConstituencyAccess(leaderId, voter.mptc_village_constituency_id);
      if (!hasAccess) {
        throw new Error('Unauthorized: You do not have approved active access to this constituency.');
      }

      const res = await pool.query(`
        INSERT INTO leader_added_voters (leader_id, voter_id, notes, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        ON CONFLICT (leader_id, voter_id)
        DO UPDATE SET notes = EXCLUDED.notes, updated_at = NOW()
        RETURNING *
      `, [leaderId, voterId, notes]);

      return { success: true, is_added: true, is_marked: true, data: res.rows[0] };
    }
    const client = getClient();
    const { data, error } = await client.from('leader_added_voters').upsert({ leader_id: leaderId, voter_id: voterId, notes, updated_at: new Date().toISOString() }, { onConflict: 'leader_id, voter_id' }).select().single();
    if (error) throw error;
    return { success: true, is_added: true, is_marked: true, data };
  },

  async removeVoterFromList(leaderId, voterId) {
    if (hasPool()) {
      await pool.query('DELETE FROM leader_added_voters WHERE leader_id = $1 AND voter_id = $2', [leaderId, voterId]);
      return { success: true, is_added: false, is_marked: false };
    }
    const client = getClient();
    await client.from('leader_added_voters').delete().eq('leader_id', leaderId).eq('voter_id', voterId);
    return { success: true, is_added: false, is_marked: false };
  },

  // Aliases for compatibility
  async markVoter(leaderId, voterId, notes = null) {
    return this.addVoterToList(leaderId, voterId, notes);
  },
  async unmarkVoter(leaderId, voterId) {
    return this.removeVoterFromList(leaderId, voterId);
  },

  async getAddedVoters({
    leaderId,
    constituencyId,
    search,
    partNumber,
    gender,
    page = 1,
    limit = 25
  }) {
    if (hasPool()) {
      const conditions = [`lav.leader_id = $1`];
      const values = [leaderId];
      let paramIdx = 2;

      if (constituencyId) {
        conditions.push(`v.mptc_village_constituency_id = $${paramIdx++}`);
        values.push(constituencyId);
      }
      if (partNumber) {
        conditions.push(`v.part_number = $${paramIdx++}`);
        values.push(String(partNumber));
      }
      if (gender) {
        conditions.push(`v.gender = $${paramIdx++}`);
        values.push(gender);
      }
      if (search && search.trim()) {
        const q = `%${search.trim().toLowerCase()}%`;
        const numVal = parseInt(search.trim(), 10);
        if (!isNaN(numVal)) {
          conditions.push(`(lower(v.name_en) LIKE $${paramIdx} OR lower(v.name_te) LIKE $${paramIdx} OR lower(v.relative_name_en) LIKE $${paramIdx} OR lower(v.relative_name_te) LIKE $${paramIdx} OR lower(v.voter_id) LIKE $${paramIdx} OR lower(v.house_number) LIKE $${paramIdx} OR v.serial_number = ${numVal})`);
        } else {
          conditions.push(`(lower(v.name_en) LIKE $${paramIdx} OR lower(v.name_te) LIKE $${paramIdx} OR lower(v.relative_name_en) LIKE $${paramIdx} OR lower(v.relative_name_te) LIKE $${paramIdx} OR lower(v.voter_id) LIKE $${paramIdx} OR lower(v.house_number) LIKE $${paramIdx})`);
        }
        values.push(q);
        paramIdx++;
      }

      const whereClause = `WHERE ${conditions.join(' AND ')}`;
      const countRes = await pool.query(`
        SELECT COUNT(*)::int as total
        FROM leader_added_voters lav
        JOIN voters v ON lav.voter_id = v.id
        ${whereClause}
      `, values);
      const totalCount = countRes.rows[0]?.total || 0;

      const offset = (page - 1) * limit;
      values.push(limit);
      const limitParam = `$${paramIdx++}`;
      values.push(offset);
      const offsetParam = `$${paramIdx++}`;

      const dataRes = await pool.query(`
        SELECT v.*,
               v.section_name_en,
               v.section_name_te,
               lav.id as added_id, lav.notes as added_notes, lav.created_at as added_at,
               true as is_added, true as is_marked
        FROM leader_added_voters lav
        JOIN voters v ON lav.voter_id = v.id
        ${whereClause}
        ORDER BY lav.created_at DESC
        LIMIT ${limitParam} OFFSET ${offsetParam}
      `, values);

      return {
        records: dataRes.rows,
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: offset + limit < totalCount
      };
    }

    return { records: [], totalCount: 0, page, limit, totalPages: 0, hasMore: false };
  },

  async getMarkedVoters(params) {
    return this.getAddedVoters(params);
  },

  // ==========================================
  // 7. NEUTRAL MASTER VOTER ROLL
  // ==========================================
  async queryVoters({
    constituencyId,
    partNumber,
    search,
    gender,
    minAge,
    maxAge,
    leaderId = null,
    isPublicApprovedOnly = false,
    page = 1,
    limit = 25
  }) {
    if (hasPool()) {
      const conditions = [];
      const values = [];
      let paramIdx = 1;

      if (constituencyId) {
        conditions.push(`v.mptc_village_constituency_id = $${paramIdx++}`);
        values.push(constituencyId);
      }
      if (isPublicApprovedOnly) {
        conditions.push(`v.is_public_approved = true`);
      }
      if (partNumber) {
        conditions.push(`v.part_number = $${paramIdx++}`);
        values.push(String(partNumber));
      }
      if (gender) {
        conditions.push(`v.gender = $${paramIdx++}`);
        values.push(gender);
      }
      if (minAge) {
        conditions.push(`v.age >= $${paramIdx++}`);
        values.push(Number(minAge));
      }
      if (maxAge) {
        conditions.push(`v.age <= $${paramIdx++}`);
        values.push(Number(maxAge));
      }

      if (search && search.trim()) {
        const q = `%${search.trim().toLowerCase()}%`;
        const numVal = parseInt(search.trim(), 10);
        if (!isNaN(numVal)) {
          conditions.push(`(lower(v.name_en) LIKE $${paramIdx} OR lower(v.name_te) LIKE $${paramIdx} OR lower(v.relative_name_en) LIKE $${paramIdx} OR lower(v.relative_name_te) LIKE $${paramIdx} OR lower(v.voter_id) LIKE $${paramIdx} OR lower(v.house_number) LIKE $${paramIdx} OR v.serial_number = ${numVal})`);
        } else {
          conditions.push(`(lower(v.name_en) LIKE $${paramIdx} OR lower(v.name_te) LIKE $${paramIdx} OR lower(v.relative_name_en) LIKE $${paramIdx} OR lower(v.relative_name_te) LIKE $${paramIdx} OR lower(v.voter_id) LIKE $${paramIdx} OR lower(v.house_number) LIKE $${paramIdx})`);
        }
        values.push(q);
        paramIdx++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const countRes = await pool.query(`SELECT COUNT(*)::int as total FROM voters v ${whereClause}`, values);
      const totalCount = countRes.rows[0]?.total || 0;

      const offset = (page - 1) * limit;
      let leaderJoin = '';
      let leaderSelect = 'false as is_added, false as is_marked';

      if (leaderId) {
        leaderJoin = `LEFT JOIN leader_added_voters lav ON v.id = lav.voter_id AND lav.leader_id = $${paramIdx++}`;
        values.push(leaderId);
        leaderSelect = 'CASE WHEN lav.id IS NOT NULL THEN true ELSE false END as is_added, CASE WHEN lav.id IS NOT NULL THEN true ELSE false END as is_marked';
      }

      values.push(limit);
      const limitParam = `$${paramIdx++}`;
      values.push(offset);
      const offsetParam = `$${paramIdx++}`;

      const dataQuery = `
        SELECT v.*,
               v.section_name_en,
               v.section_name_te,
               ${leaderSelect}
        FROM voters v
        ${leaderJoin}
        ${whereClause}
        ORDER BY v.part_number ASC, v.serial_number ASC
        LIMIT ${limitParam} OFFSET ${offsetParam}
      `;

      const dataRes = await pool.query(dataQuery, values);

      return {
        records: dataRes.rows,
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: offset + limit < totalCount
      };
    }

    return { records: [], totalCount: 0, page, limit, totalPages: 0, hasMore: false };
  },

  async getVoterById(id, leaderId = null) {
    if (hasPool()) {
      const { rows } = await pool.query(`
        SELECT v.*,
               v.section_name_en,
               v.section_name_te,
               m.name_en as constituency_name_en, m.name_te as constituency_name_te,
               a.name_en as assembly_name_en, a.name_te as assembly_name_te,
               d.name_en as district_name_en, d.name_te as district_name_te
        FROM voters v
        JOIN mptc_village_constituencies m ON v.mptc_village_constituency_id = m.id
        JOIN assembly_constituencies a ON m.assembly_constituency_id = a.id
        JOIN districts d ON m.district_id = d.id
        WHERE v.id = $1
      `, [id]);

      if (rows.length === 0) return null;
      const voter = rows[0];

      let is_added = false;
      if (leaderId) {
        const mRes = await pool.query('SELECT id FROM leader_added_voters WHERE leader_id = $1 AND voter_id = $2', [leaderId, id]);
        is_added = mRes.rows.length > 0;
      }

      return {
        ...voter,
        is_added,
        is_marked: is_added
      };
    }
    return null;
  },

  async updateVoter(id, updates) {
    if (hasPool()) {
      const allowed = [
        'name_en', 'name_te', 'relative_type', 'relative_name_en', 'relative_name_te',
        'house_number', 'age', 'gender', 'part_number', 'voter_id', 'serial_number', 'section_name_en', 'section_name_te'
      ];
      const setClauses = [];
      const values = [];
      let idx = 1;

      for (const key of allowed) {
        if (updates[key] !== undefined) {
          setClauses.push(`${key} = $${idx++}`);
          values.push(updates[key]);
        }
      }

      if (setClauses.length === 0) return this.getVoterById(id);

      setClauses.push('updated_at = NOW()');
      values.push(id);

      const query = `UPDATE voters SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`;
      const { rows } = await pool.query(query, values);
      return rows[0];
    }
    const client = getClient();
    const { data, error } = await client.from('voters').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  // ==========================================
  // 8. AUTOMATED CSV VOTER IMPORT
  // Flow: Upload CSV -> Validate -> Detect Duplicates & Invalid Rows -> Show Summary -> Confirm Import -> Save Records
  // ZERO manual review queue.
  // ==========================================
  async validateCsvRows(mptcConstituencyId, parsedRows) {
    if (hasPool()) {
      const existingRes = await pool.query(
        'SELECT voter_id, part_number, serial_number FROM voters WHERE mptc_village_constituency_id = $1',
        [mptcConstituencyId]
      );
      const existingSerialSet = new Set(existingRes.rows.map(r => `${r.part_number}_${r.serial_number}`));
      const existingVoterIdSet = new Set(existingRes.rows.filter(r => r.voter_id).map(r => r.voter_id.trim().toUpperCase()));

      const validRows = [];
      const duplicates = [];
      const invalidRows = [];
      const fileSerialSet = new Set();
      const fileVoterIdSet = new Set();

      parsedRows.forEach((row, index) => {
        const rowNum = index + 2; // header is row 1
        const errors = [];

        const serialNumber = parseInt(row.serial_number, 10);
        if (isNaN(serialNumber) || serialNumber <= 0) {
          errors.push('Invalid or missing serial_number');
        }

        const nameEn = (row.name_en || row.name || '').trim();
        const nameTe = (row.name_te || '').trim();
        if (!nameEn && !nameTe) {
          errors.push('Missing voter name (English or Telugu required)');
        }

        const partNumber = String(row.part_number || '1').trim();
        const voterId = (row.voter_id || row.epic_number || '').trim().toUpperCase();

        // Duplicate checks
        const serialKey = `${partNumber}_${serialNumber}`;
        if (existingSerialSet.has(serialKey)) {
          errors.push(`Duplicate serial: Part ${partNumber} Serial ${serialNumber} already exists in this constituency`);
        } else if (fileSerialSet.has(serialKey)) {
          errors.push(`Duplicate within CSV: Part ${partNumber} Serial ${serialNumber} appears multiple times in file`);
        }

        if (voterId) {
          if (existingVoterIdSet.has(voterId)) {
            errors.push(`Duplicate Voter ID: ${voterId} already exists in database`);
          } else if (fileVoterIdSet.has(voterId)) {
            errors.push(`Duplicate Voter ID in CSV: ${voterId} repeated in file`);
          }
        }

        if (errors.length > 0) {
          if (errors.some(e => e.includes('Duplicate'))) {
            duplicates.push({ rowNumber: rowNum, data: row, reason: errors.join('; ') });
          } else {
            invalidRows.push({ rowNumber: rowNum, data: row, reason: errors.join('; ') });
          }
        } else {
          fileSerialSet.add(serialKey);
          if (voterId) fileVoterIdSet.add(voterId);

          validRows.push({
            mptc_village_constituency_id: mptcConstituencyId,
            voter_id: voterId || null,
            serial_number: serialNumber,
            name_en: nameEn || nameTe,
            name_te: nameTe || null,
            relative_type: row.relative_type || 'Father',
            relative_name_en: (row.relative_name_en || row.relative_name || '').trim() || null,
            relative_name_te: (row.relative_name_te || '').trim() || null,
            house_number: (row.house_number || '').trim() || null,
            age: parseInt(row.age, 10) || null,
            gender: (row.gender || 'M').toUpperCase().startsWith('F') ? 'F' : ((row.gender || 'M').toUpperCase().startsWith('O') ? 'O' : 'M'),
            part_number: partNumber,
            section_name_en: (row.section_name_en || row.section_name || '').trim() || null,
            section_name_te: (row.section_name_te || '').trim() || null,
            is_public_approved: true
          });
        }
      });

      return {
        totalRows: parsedRows.length,
        validCount: validRows.length,
        duplicateCount: duplicates.length,
        invalidCount: invalidRows.length,
        validRows,
        duplicates,
        invalidRows
      };
    }

    return { totalRows: parsedRows.length, validCount: parsedRows.length, duplicateCount: 0, invalidCount: 0, validRows: parsedRows, duplicates: [], invalidRows: [] };
  },

  async commitVoterImport({ uploadedBy, mptcConstituencyId, fileName, validRows, duplicates = [], invalidRows = [] }) {
    if (hasPool()) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Create voter_imports record
        const importRes = await client.query(`
          INSERT INTO voter_imports (
            uploaded_by, mptc_village_constituency_id, file_name, status,
            total_rows, inserted_count, skipped_count, failed_count, completed_at
          ) VALUES ($1, $2, $3, 'completed', $4, $5, $6, $7, NOW())
          RETURNING id
        `, [
          uploadedBy,
          mptcConstituencyId,
          fileName,
          validRows.length + duplicates.length + invalidRows.length,
          validRows.length,
          duplicates.length,
          invalidRows.length
        ]);
        const importId = importRes.rows[0].id;

        // Insert valid records
        for (const row of validRows) {
          await client.query(`
            INSERT INTO voters (
              mptc_village_constituency_id, voter_id, serial_number, name_en, name_te,
              relative_type, relative_name_en, relative_name_te, house_number, age, gender,
              part_number, source_import_id, is_public_approved
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true)
            ON CONFLICT (mptc_village_constituency_id, part_number, serial_number)
            DO UPDATE SET
              name_en = EXCLUDED.name_en,
              name_te = COALESCE(EXCLUDED.name_te, voters.name_te),
              voter_id = COALESCE(EXCLUDED.voter_id, voters.voter_id),
              relative_name_en = COALESCE(EXCLUDED.relative_name_en, voters.relative_name_en),
              relative_name_te = COALESCE(EXCLUDED.relative_name_te, voters.relative_name_te),
              house_number = COALESCE(EXCLUDED.house_number, voters.house_number),
              age = COALESCE(EXCLUDED.age, voters.age),
              gender = COALESCE(EXCLUDED.gender, voters.gender),
                section_name_en = COALESCE(EXCLUDED.section_name_en, voters.section_name_en),
                section_name_te = COALESCE(EXCLUDED.section_name_te, voters.section_name_te),
              updated_at = NOW()
          `, [
            mptcConstituencyId,
            row.voter_id,
            row.serial_number,
            row.name_en,
            row.name_te,
            row.relative_type,
            row.relative_name_en,
            row.relative_name_te,
            row.house_number,
            row.age,
            row.gender,
            row.part_number,
            importId,
            row.section_name_en || null,
            row.section_name_te || null
          ]);
        }

        // Record invalid rows in import_errors
        const allErrors = [
          ...duplicates.map(d => ({ rowNumber: d.rowNumber, data: d.data, message: d.reason })),
          ...invalidRows.map(i => ({ rowNumber: i.rowNumber, data: i.data, message: i.reason }))
        ];

        for (const err of allErrors) {
          await client.query(`
            INSERT INTO import_errors (import_id, row_number, raw_data, error_message)
            VALUES ($1, $2, $3, $4)
          `, [importId, err.rowNumber, JSON.stringify(err.data), err.message]);
        }

        await client.query('COMMIT');

        return {
          success: true,
          importId,
          totalRows: validRows.length + duplicates.length + invalidRows.length,
          insertedCount: validRows.length,
          skippedCount: duplicates.length,
          failedCount: invalidRows.length
        };
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }
    return { success: true, insertedCount: validRows.length };
  },

  async getImportHistory() {
    if (hasPool()) {
      const { rows } = await pool.query(`
        SELECT i.*,
               m.name_en as constituency_name_en, m.name_te as constituency_name_te,
               p.full_name_en as uploader_name
        FROM voter_imports i
        JOIN mptc_village_constituencies m ON i.mptc_village_constituency_id = m.id
        LEFT JOIN profiles p ON i.uploaded_by = p.id
        ORDER BY i.created_at DESC
      `);
      return rows;
    }
    const client = getClient();
    const { data, error } = await client
      .from('voter_imports')
      .select('*, mptc_village_constituencies(name_en, name_te), profiles:uploaded_by(full_name_en)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getImportErrors(importId) {
    if (hasPool()) {
      const { rows } = await pool.query('SELECT * FROM import_errors WHERE import_id = $1 ORDER BY row_number ASC', [importId]);
      return rows;
    }
    const client = getClient();
    const { data, error } = await client.from('import_errors').select('*').eq('import_id', importId).order('row_number');
    if (error) throw error;
    return data || [];
  },

  // ==========================================
  // 9. AUDIT LOGS
  // ==========================================
  async logAudit({ userId, action, entityType, entityId = null, details = null }) {
    if (hasPool()) {
      try {
        await pool.query(`
          INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, created_at)
          VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, NOW())
        `, [userId || null, action, entityType, entityId, details ? JSON.stringify(details) : null]);
      } catch (err) {
        console.warn('Audit log write error:', err.message);
      }
      return;
    }
    const client = getClient();
    try {
      await client.from('audit_logs').insert([{ user_id: userId, action, entity_type: entityType, entity_id: entityId, details }]);
    } catch (err) {
      console.warn('Audit log write error:', err.message);
    }
  }
};
