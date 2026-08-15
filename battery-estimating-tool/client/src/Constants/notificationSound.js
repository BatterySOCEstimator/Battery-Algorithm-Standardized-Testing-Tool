// A short two-note chime for live-arriving notifications, synthesized with
// the Web Audio API rather than shipped as an audio file. Browsers refuse to
// play audio before the page has seen a user gesture, so the AudioContext is
// created lazily and resumed on the first pointer/key interaction, then
// reused for every chime after that.
let audioContext = null;

function getAudioContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!audioContext) audioContext = new AudioContextClass();
  if (audioContext.state === "suspended") audioContext.resume();
  return audioContext;
}

if (typeof window !== "undefined") {
  const primeAudioContext = () => getAudioContext();
  window.addEventListener("pointerdown", primeAudioContext, { once: true });
  window.addEventListener("keydown", primeAudioContext, { once: true });
}

export function playNotificationSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    [880, 1318.5].forEach((frequency, i) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;

      const start = now + i * 0.1;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.2, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);

      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.3);
    });
  } catch {
    // Web Audio unsupported/blocked — the toast + badge still cover it.
  }
}
