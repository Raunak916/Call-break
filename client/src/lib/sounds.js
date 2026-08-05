/**
 * Sound effects using Web Audio API — no external files needed.
 * All sounds are generated from oscillators with envelopes.
 */

let ctx = null;
function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}

function play(freq, type, duration, { volume = 0.15, decay = 0.3, detune = 0 } = {}) {
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.detune.value = detune;
    gain.gain.setValueAtTime(volume, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    osc.connect(gain).connect(c.destination);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + duration);
  } catch { /* audio not available */ }
}

function noise(duration, { volume = 0.08 } = {}) {
  try {
    const c = getCtx();
    const bufferSize = c.sampleRate * duration;
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buffer;
    const gain = c.createGain();
    gain.gain.setValueAtTime(volume, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    src.connect(gain).connect(c.destination);
    src.start(c.currentTime);
  } catch { /* audio not available */ }
}

/** Card placed on table — short tap */
export function playCard() {
  noise(0.06, { volume: 0.12 });
  play(800, 'sine', 0.08, { volume: 0.06 });
}

/** Card dealt — soft whoosh */
export function playDeal() {
  noise(0.12, { volume: 0.06 });
}

/** Timer tick — subtle click (last 5 seconds) */
export function playTick() {
  play(1200, 'sine', 0.04, { volume: 0.05 });
}

/** Timer urgency — lower tone (last 3 seconds) */
export function playTickUrgent() {
  play(800, 'sine', 0.06, { volume: 0.08 });
}

/** Bid submitted — two-tone confirmation */
export function playBid() {
  play(523, 'sine', 0.1, { volume: 0.1 });
  setTimeout(() => play(659, 'sine', 0.1, { volume: 0.1 }), 80);
}

/** Turn notification — gentle chime */
export function playYourTurn() {
  play(784, 'sine', 0.15, { volume: 0.1 });
  setTimeout(() => play(988, 'sine', 0.15, { volume: 0.1 }), 120);
}

/** Trick won — ascending tone */
export function playTrickWon() {
  play(523, 'sine', 0.12, { volume: 0.08 });
  setTimeout(() => play(659, 'sine', 0.12, { volume: 0.08 }), 100);
  setTimeout(() => play(784, 'sine', 0.15, { volume: 0.08 }), 200);
}

/** Game over — fanfare */
export function playGameOver() {
  const notes = [523, 659, 784, 1047];
  notes.forEach((f, i) => {
    setTimeout(() => play(f, 'sine', 0.3, { volume: 0.12 }), i * 150);
  });
}

/** Chat message received — soft pop */
export function playChat() {
  play(440, 'sine', 0.06, { volume: 0.05 });
}

/** Room join — ascending chime */
export function playJoin() {
  play(440, 'sine', 0.1, { volume: 0.08 });
  setTimeout(() => play(554, 'sine', 0.1, { volume: 0.08 }), 100);
  setTimeout(() => play(659, 'sine', 0.12, { volume: 0.08 }), 200);
}
