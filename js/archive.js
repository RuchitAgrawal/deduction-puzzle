/*
 * archive.js
 * Loads all cases from cases.json and renders the filterable archive grid.
 * Clicking a card opens the case in practice mode (?id=case-NNN&practice=1).
 */

var allCases = [];
var activeFilter = 'all';

document.addEventListener('DOMContentLoaded', function () {
  loadAllCases().then(function (cases) {
    allCases = cases;
    renderGrid(cases);
    setupFilters();
  });
});

function loadAllCases() {
  return fetch('/data/cases.json')
    .then(function (res) { return res.json(); })
    .then(function (data) { return data.cases || []; })
    .catch(function () { return []; });
}

function renderGrid(cases) {
  var grid = document.getElementById('case-grid');
  grid.innerHTML = '';

  if (!cases || cases.length === 0) {
    grid.innerHTML = '<p class="archive-empty">No cases found.</p>';
    return;
  }

  cases.forEach(function (c) {
    var card = buildCard(c);
    grid.appendChild(card);
  });
}

function buildCard(c) {
  var link = document.createElement('a');
  link.className = 'case-card';
  link.href = '/?id=' + encodeURIComponent(c.id) + '&practice=1';
  link.dataset.difficulty = c.difficulty || '';
  link.dataset.category   = c.category || '';
  link.setAttribute('aria-label', c.title + ', ' + c.difficulty + ' difficulty, ' + c.category);

  link.innerHTML =
    '<div class="case-card-left">' +
      '<span class="case-card-id">' + escapeHtml(c.id.toUpperCase()) + '</span>' +
      '<span class="case-card-title">' + escapeHtml(c.title) + '</span>' +
      '<div class="case-card-meta">' +
        '<span class="tag tag-' + escapeHtml(c.difficulty || 'easy') + '">' + escapeHtml(c.difficulty || 'easy') + '</span>' +
        '<span class="tag tag-category">' + escapeHtml(c.category || '') + '</span>' +
      '</div>' +
    '</div>' +
    '<span class="case-card-arrow" aria-hidden="true">-&gt;</span>';

  return link;
}

function setupFilters() {
  document.querySelectorAll('.filter-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.filter-btn').forEach(function (b) {
        b.classList.remove('active');
      });
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      applyFilter(activeFilter);
    });
  });
}

function applyFilter(filter) {
  document.querySelectorAll('.case-card').forEach(function (card) {
    if (filter === 'all') {
      card.classList.remove('hidden');
      return;
    }
    var matches = card.dataset.difficulty === filter || card.dataset.category === filter;
    card.classList.toggle('hidden', !matches);
  });

  var visible = document.querySelectorAll('.case-card:not(.hidden)').length;
  if (visible === 0) {
    var existing = document.querySelector('.archive-empty');
    if (!existing) {
      var msg = document.createElement('p');
      msg.className = 'archive-empty';
      msg.textContent = 'No cases match this filter.';
      document.getElementById('case-grid').appendChild(msg);
    }
  } else {
    var empty = document.querySelector('.archive-empty');
    if (empty) empty.remove();
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
