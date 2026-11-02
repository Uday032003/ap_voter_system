import { createClient } from '@supabase/supabase-js';
import { ENV } from './env.js';

let supabaseClient = null;
let supabaseAdmin = null;

if (ENV.IS_SUPABASE_CONFIGURED) {
  if (ENV.SUPABASE_ANON_KEY) {
    supabaseClient = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY);
  }
  if (ENV.SUPABASE_SERVICE_ROLE_KEY) {
    supabaseAdmin = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
}

export { supabaseClient, supabaseAdmin };
