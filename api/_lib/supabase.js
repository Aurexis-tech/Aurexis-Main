// Server-side Supabase admin client using the SERVICE-ROLE key. SERVER ONLY —
// the service role BYPASSES Row-Level Security, so this must never be imported
// into browser code or exposed to the client. Keys come from the environment.
const { createClient } = require('@supabase/supabase-js')

let _admin = null
function getAdminClient() {
  const url = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set')
  }
  if (!_admin) {
    _admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return _admin
}

module.exports = { getAdminClient }
