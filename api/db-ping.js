// GET /api/db-ping — proves frontend → function → Supabase. Does a trivial
// connectivity check (HEAD count on the tiny `health` table created by the
// 0001 migration) and returns ok/error WITHOUT leaking any key.
const { getAdminClient } = require('./_lib/supabase')

module.exports = async (req, res) => {
  try {
    const supabase = getAdminClient()
    const { error, count } = await supabase
      .from('health')
      .select('*', { count: 'exact', head: true })
    if (error) throw error
    res.status(200).json({ ok: true, table: 'health', rows: count ?? 0 })
  } catch (e) {
    // Never echo connection strings/keys; return a short, generic reason only.
    res.status(500).json({ ok: false, error: String(e && e.message || e).slice(0, 300) })
  }
}
