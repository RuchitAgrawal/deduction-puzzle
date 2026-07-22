/*
 * analytics.js
 * Anonymous event tracking via navigator.sendBeacon.
 * Session ID is set by game.js before this is called.
 */

function trackEvent(name, data) {
  var sessionId = localStorage.getItem('dp_sid');
  var payload = Object.assign(
    { event: name, session_id: sessionId, ts: Date.now() },
    data || {}
  );

  try {
    navigator.sendBeacon('/api/track', JSON.stringify(payload));
  } catch (_) {
    // sendBeacon not available or blocked; non-critical
  }
}
