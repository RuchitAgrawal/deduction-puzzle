/*
 * audio.js
 * Generates tactile sound effects using native JavaScript Web Audio API synthesizers.
 * Supports mute toggling and local state persistence.
 */

var audioCtx = null;
var isMuted = false;

function initAudio() {
  if (audioCtx) return;
  var AudioCtxConstructor = window.AudioContext || window.webkitAudioContext;
  if (AudioCtxConstructor) {
    audioCtx = new AudioCtxConstructor();
  }
}

function getMutedState() {
  try {
    return localStorage.getItem('dp_mute') === '1';
  } catch (_) {
    return false;
  }
}

function saveMutedState(muted) {
  try {
    localStorage.setItem('dp_mute', muted ? '1' : '0');
  } catch (_) {
    // LocalStorage unavailable
  }
}

function setupAudioToggle() {
  isMuted = getMutedState();
  var btn = document.getElementById('audio-toggle-btn');
  if (!btn) return;

  updateAudioButtonIcon(btn);

  btn.addEventListener('click', function () {
    initAudio();
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    isMuted = !isMuted;
    saveMutedState(isMuted);
    updateAudioButtonIcon(btn);
    if (!isMuted) {
      playClickSound();
    }
  });
}

function updateAudioButtonIcon(btn) {
  btn.innerHTML = '<span>' + (isMuted ? '🔇' : '🔊') + '</span>';
  btn.title = isMuted ? 'Unmute sound effects' : 'Mute sound effects';
}

function ensureContext() {
  if (isMuted) return false;
  initAudio();
  if (!audioCtx) return false;
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return true;
}

function playTone(freq, type, duration, startGain, endGain) {
  if (!ensureContext()) return;

  try {
    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();
    var now = audioCtx.currentTime;

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(startGain, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.001, endGain), now + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + duration);
  } catch (_) {
    // Ignore synthesizer errors on unsupported browsers
  }
}

function playClickSound() {
  playTone(850, 'sine', 0.05, 0.1, 0.001);
}

function playEliminateSound() {
  if (!ensureContext()) return;
  try {
    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();
    var now = audioCtx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  } catch (_) {
    // Ignore error
  }
}

function playRestoreSound() {
  if (!ensureContext()) return;
  try {
    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();
    var now = audioCtx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(500, now + 0.1);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  } catch (_) {
    // Ignore error
  }
}

function playTickSound() {
  playTone(1200, 'sine', 0.02, 0.06, 0.001);
}

function playSolveSound() {
  if (!ensureContext()) return;
  try {
    var notes = [440, 554.37, 659.25, 880];
    var now = audioCtx.currentTime;
    notes.forEach(function (freq, idx) {
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + (idx * 0.08));
      gain.gain.setValueAtTime(0.15, now + (idx * 0.08));
      gain.gain.exponentialRampToValueAtTime(0.001, now + (idx * 0.08) + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now + (idx * 0.08));
      osc.stop(now + (idx * 0.08) + 0.3);
    });
  } catch (_) {
    // Ignore error
  }
}

function playFailSound() {
  playTone(140, 'sawtooth', 0.35, 0.2, 0.01);
}
