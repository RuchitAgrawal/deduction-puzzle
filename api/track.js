/*
 * api/track.js
 * Receives anonymous analytics events from the client.
 * MVP: logs to stdout, captured by Vercel function logs.
 * Upgrade path: replace with a proper analytics service or DB write.
 */

module.exports = function (req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  var body = req.body;

  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (_) { body = {}; }
  }

  console.log(JSON.stringify(Object.assign({ type: 'event' }, body || {})));
  return res.status(200).json({ ok: true });
};
