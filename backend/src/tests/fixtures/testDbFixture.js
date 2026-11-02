/**
 * ISOLATED TEST FIXTURE ONLY
 * Used exclusively by backend automated tests (node:test).
 * Strictly isolated; never imported or executed in production application paths.
 */

import bcrypt from 'bcryptjs';

const passwordHash = bcrypt.hashSync('Admin@123', 8);
const leaderHash = bcrypt.hashSync('Leader@123', 8);
const citizenHash = bcrypt.hashSync('Citizen@123', 8);

const testProfiles = [
  {
    id: 'u1111111-0000-0000-0000-000000000001',
    email: 'admin@apvoters.gov.in',
    password_hash: passwordHash,
    full_name: 'State Super Administrator',
    role: 'super_admin',
    is_active: true
  },
  {
    id: 'u1111111-0000-0000-0000-000000000002',
    email: 'leader.atmakuru@apvoters.gov.in',
    password_hash: leaderHash,
    full_name: 'Constituency In-Charge',
    role: 'leader',
    is_active: true
  },
  {
    id: 'u1111111-0000-0000-0000-000000000003',
    email: 'citizen.guntur@apvoters.gov.in',
    password_hash: citizenHash,
    full_name: 'Public Citizen',
    role: 'commoner',
    is_active: true
  }
];

const testLeaderAssignments = [
  {
    leader_id: 'u1111111-0000-0000-0000-000000000002',
    constituency_id: 'c1111111-0000-0000-0000-000000000001',
    status: 'active',
    expires_at: null,
    mptc_constituencies: {
      id: 'c1111111-0000-0000-0000-000000000001',
      name_en: 'Atmakuru MPTC - 04',
      name_te: 'ఆత్మకూరు ఎం.పి.టి.సి - 04',
      type: 'MPTC',
      code: 'MPT-ATMK-04'
    }
  }
];

// 3,000 voter records for pagination testing
const testVoterRecords = Array.from({ length: 3000 }, (_, idx) => {
  const serial = idx + 1;
  const isSpecial = serial === 1;
  return {
    id: `vtr-${serial}`,
    constituency_id: 'c1111111-0000-0000-0000-000000000001',
    part_id: 'part-01',
    ward_id: 'ward-01',
    serial_number: serial,
    name_en: isSpecial ? 'Gunturu Venkata Rao' : `Voter Record ${serial}`,
    name_te: isSpecial ? 'గుంటూరి వెంకటరావు' : `ఓటరు రికార్డు ${serial}`,
    relative_name_en: 'Subba Rao',
    relative_name_te: 'సుబ్బారావు',
    relative_type: 'Father',
    house_number_en: `1-${serial}`,
    house_number_te: `1-${serial}`,
    age: 25 + (serial % 50),
    gender: serial % 2 === 0 ? 'M' : 'F',
    epic_number_masked: 'AP01***' + String(serial).padStart(3, '0'),
    review_status: 'approved',
    admin_tag: 'General',
    is_public_approved: serial <= 100,
    electoral_roll_parts: {
      part_number: 1,
      part_name_en: 'Atmakuru Main Booth',
      part_name_te: 'ఆత్మకూరు ప్రధాన పోలింగ్ కేంద్రం'
    }
  };
});

let testMarks = [];
let testEstimates = [];

export function createTestSupabaseClient() {
  return {
    from(table) {
      return {
        select(fields, { count } = {}) {
          let rows = [];
          if (table === 'profiles') rows = [...testProfiles];
          else if (table === 'leader_constituency_access') rows = [...testLeaderAssignments];
          else if (table === 'voter_records') rows = [...testVoterRecords];
          else if (table === 'leader_voter_marks') {
            rows = testMarks.map(m => ({
              ...m,
              voter: testVoterRecords.find(v => v.id === m.voter_id)
            }));
          }
          else if (table === 'leader_estimates' || table === 'leader_estimate_totals') rows = [...testEstimates];
          else if (table === 'mptc_constituencies' || table === 'constituencies') {
            rows = [{ id: 'c1111111-0000-0000-0000-000000000001', total_electors: 3000, name_en: 'Atmakuru MPTC - 04' }];
          }
          else rows = [];

          let exactCount = rows.length;

          const queryObj = {
            eq(col, val) {
              if (col === 'voter.constituency_id') {
                rows = rows.filter(r => r.voter && r.voter.constituency_id === val);
              } else {
                rows = rows.filter(r => r[col] === val);
              }
              exactCount = rows.length;
              return queryObj;
            },
            gte(col, val) {
              rows = rows.filter(r => r[col] >= val);
              exactCount = rows.length;
              return queryObj;
            },
            lte(col, val) {
              rows = rows.filter(r => r[col] <= val);
              exactCount = rows.length;
              return queryObj;
            },
            in(col, vals) {
              rows = rows.filter(r => vals.includes(r[col]));
              exactCount = rows.length;
              return queryObj;
            },
            ilike(col, val) {
              const cleanVal = val.replace(/%/g, '').toLowerCase();
              rows = rows.filter(r => (r[col] || '').toLowerCase().includes(cleanVal));
              exactCount = rows.length;
              return queryObj;
            },
            or(conditionsStr) {
              const terms = conditionsStr.split(',');
              rows = rows.filter(r => {
                return terms.some(term => {
                  const parts = term.split('.');
                  const col = parts[0];
                  const op = parts[1];
                  const rawVal = parts[2] ? parts[2].replace(/%/g, '').toLowerCase() : '';
                  if (op === 'ilike') {
                    return (r[col] || '').toLowerCase().includes(rawVal);
                  }
                  if (op === 'eq') {
                    return String(r[col]) === rawVal;
                  }
                  return false;
                });
              });
              exactCount = rows.length;
              return queryObj;
            },
            order() {
              return queryObj;
            },
            range(start, end) {
              rows = rows.slice(start, end + 1);
              return queryObj;
            },
            limit(n) {
              rows = rows.slice(0, n);
              return queryObj;
            },
            async single() {
              return { data: rows[0] || null, error: rows.length > 0 ? null : new Error('Not found') };
            },
            async maybeSingle() {
              return { data: rows[0] || null, error: null };
            },
            then(resolve) {
              resolve({ data: rows, count: exactCount, error: null });
            }
          };

          return queryObj;
        },

        upsert(record) {
          if (table === 'leader_estimate_totals' || table === 'leader_estimates') {
            const existingIdx = testEstimates.findIndex(e => e.leader_id === record.leader_id && e.party_id === record.party_id && e.constituency_id === record.constituency_id);
            const fullRecord = { id: `est-${Date.now()}`, ...record };
            if (existingIdx >= 0) {
              testEstimates[existingIdx] = fullRecord;
            } else {
              testEstimates.push(fullRecord);
            }
            return {
              select() {
                return {
                  async single() {
                    return { data: fullRecord, error: null };
                  }
                };
              }
            };
          }

          const existingIdx = testMarks.findIndex(m => m.leader_id === record.leader_id && m.voter_id === record.voter_id);
          const fullRecord = { id: `mark-${Date.now()}`, ...record, created_at: new Date().toISOString() };
          if (existingIdx >= 0) {
            testMarks[existingIdx] = fullRecord;
          } else {
            testMarks.push(fullRecord);
          }
          return {
            select() {
              return {
                async single() {
                  return { data: fullRecord, error: null };
                }
              };
            }
          };
        },

        insert(record) {
          const item = { id: `item-${Date.now()}`, ...record };
          if (table === 'leader_estimates') testEstimates.push(item);
          return {
            select() {
              return {
                async single() {
                  return { data: item, error: null };
                }
              };
            },
            then(resolve) {
              resolve({ data: item, error: null });
            }
          };
        },

        update(updates) {
          return {
            eq(col, val) {
              return {
                select() {
                  return {
                    async single() {
                      return { data: updates, error: null };
                    }
                  };
                }
              };
            }
          };
        },

        delete() {
          return {
            eq(col1, val1) {
              return {
                eq(col2, val2) {
                  if (table === 'leader_voter_marks') {
                    testMarks = testMarks.filter(m => !(m[col1] === val1 && m[col2] === val2));
                  }
                  return Promise.resolve({ error: null });
                }
              };
            }
          };
        }
      };
    }
  };
}
