// GET /api/health — liveness probe. No secrets, no dependencies.
module.exports = (req, res) => {
  res.status(200).json({ ok: true, ts: Date.now() })
}
