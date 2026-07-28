/*
 * engine/cases.js
 * Loads case data from cases.json and exposes query helpers.
 * File is read once at startup and cached in memory for the process lifetime.
 */

const fs   = require('fs');
const path = require('path');

const CASES_PATH = process.env.CASES_JSON_PATH
  || path.join(__dirname, '../../data/cases.json');

let caseData = null;

function load() {
  if (caseData) return caseData;
  const raw = fs.readFileSync(CASES_PATH, 'utf8');
  caseData  = JSON.parse(raw);
  return caseData;
}

function getCaseById(id) {
  const data = load();
  return data.cases.find(c => c.id === id) || null;
}

function getCaseForToday() {
  const data  = load();
  const today = new Date().toISOString().slice(0, 10);
  let caseId  = data.schedule[today];

  if (!caseId) {
    // Fall back to the most recently scheduled case
    const sorted = Object.keys(data.schedule).sort().reverse();
    caseId = data.schedule[sorted[0]];
  }

  return getCaseById(caseId);
}

function getAllReleasedCases() {
  const data  = load();
  const today = new Date().toISOString().slice(0, 10);

  // Build a reverse lookup: caseId -> releaseDate
  const dateById = {};
  Object.keys(data.schedule).forEach(date => {
    dateById[data.schedule[date]] = date;
  });

  return data.cases.filter(c => {
    const releaseDate = dateById[c.id];
    return releaseDate && releaseDate <= today;
  });
}

function getCaseByIndex(n) {
  const released = getAllReleasedCases();
  return released[n] || null;
}

function getReleasedCount() {
  return getAllReleasedCases().length;
}

module.exports = {
  getCaseById,
  getCaseForToday,
  getAllReleasedCases,
  getCaseByIndex,
  getReleasedCount
};
