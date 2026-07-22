/*
 * api/case-today.js
 * Returns the case scheduled for today's date.
 * Reads from data/cases.json. Falls back to the most recently scheduled case
 * if no entry exists for today.
 */

var fs   = require('fs');
var path = require('path');

module.exports = function (req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  var filePath = path.join(process.cwd(), 'data', 'cases.json');
  var raw, data;

  try {
    raw  = fs.readFileSync(filePath, 'utf8');
    data = JSON.parse(raw);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to read case data' });
  }

  var today  = new Date().toISOString().slice(0, 10);
  var caseId = data.schedule[today];

  if (!caseId) {
    var sorted = Object.keys(data.schedule).sort().reverse();
    caseId = data.schedule[sorted[0]];
  }

  var found = data.cases.find(function (c) { return c.id === caseId; });

  if (!found) {
    return res.status(404).json({ error: 'No case scheduled for today' });
  }

  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  return res.status(200).json(found);
};
