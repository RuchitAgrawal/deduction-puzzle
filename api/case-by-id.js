/*
 * api/case-by-id.js
 * Returns a specific case by ID.
 * Query param: ?id=case-001
 */

var fs   = require('fs');
var path = require('path');

module.exports = function (req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  var id = (req.query && req.query.id) || '';

  if (!id) {
    return res.status(400).json({ error: 'Missing id parameter' });
  }

  var filePath = path.join(process.cwd(), 'data', 'cases.json');
  var raw, data;

  try {
    raw  = fs.readFileSync(filePath, 'utf8');
    data = JSON.parse(raw);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to read case data' });
  }

  var found = data.cases.find(function (c) { return c.id === id; });

  if (!found) {
    return res.status(404).json({ error: 'Case not found' });
  }

  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
  return res.status(200).json(found);
};
