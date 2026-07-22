/*
 * api/log-attempt.js
 * Records a player attempt (case_id, correct, time_taken, suspect).
 * MVP: logs structured JSON to stdout, captured by Vercel function logs.
 * Upgrade path: swap the console.log for a database insert.
 */

module.exports = function (req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  var body = req.body;

  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (_) {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }
  }

  if (!body || !body.case_id) {
    return res.status(400).json({ error: 'Missing required field: case_id' });
  }

  console.log(JSON.stringify({
    type:            'attempt',
    case_id:         body.case_id,
    session_id:      body.session_id   || 'unknown',
    correct:         Boolean(body.correct),
    time_taken:      Number(body.time_taken) || 0,
    guessed_suspect: body.guessed_suspect || '',
    timestamp:       new Date().toISOString(),
  }));

  return res.status(200).json({ ok: true });
};
