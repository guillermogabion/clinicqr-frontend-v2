/**
 * ClinicQR — Sound + Speech Utility
 *
 * Plays a chime, then speaks the notification text aloud using Web Speech API.
 * No external audio files required.
 */

let audioCtx: AudioContext | null = null;
let unlocked = false;

/** Call once on any user gesture to unlock AudioContext */
export function unlockAudio() {
  if (unlocked) return;
  try {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    unlocked = true;
  } catch { /* not supported */ }
}

function getCtx(): AudioContext | null {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch { return null; }
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

/**
 * Plays a short chime then speaks `speechText` aloud.
 * @param type - notification type for picking the right chime
 * @param speechText - what to say after the chime (e.g. "Pedro's CBC result is ready")
 */
export function playNotificationSound(
  type: 'result' | 'prescription' | 'default' = 'default',
  speechText?: string
) {
  const ctx = getCtx();

  // Note sequences per type
  const sequences: Record<string, { freq: number; dur: number; delay: number }[]> = {
    result: [
      { freq: 880,  dur: 0.10, delay: 0    },
      { freq: 1100, dur: 0.10, delay: 0.12 },
      { freq: 1320, dur: 0.20, delay: 0.24 },
    ],
    prescription: [
      { freq: 660, dur: 0.10, delay: 0    },
      { freq: 880, dur: 0.10, delay: 0.13 },
      { freq: 660, dur: 0.16, delay: 0.26 },
    ],
    default: [
      { freq: 740, dur: 0.09, delay: 0    },
      { freq: 988, dur: 0.16, delay: 0.11 },
    ],
  };

  const notes = sequences[type] || sequences.default;
  // Total chime duration (last note start + its dur + small buffer)
  const lastNote = notes[notes.length - 1];
  const chimeDuration = lastNote.delay + lastNote.dur + 0.15;

  if (ctx) {
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.38, ctx.currentTime);
    masterGain.connect(ctx.destination);

    notes.forEach(({ freq, dur, delay }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      const start = ctx.currentTime + delay;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(1, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(start);
      osc.stop(start + dur + 0.05);
    });
  }

  // Speak after chime finishes
  if (speechText) {
    const delay = ctx ? chimeDuration * 1000 + 100 : 0;
    setTimeout(() => speak(speechText), delay);
  }
}

/**
 * Speak text using Web Speech API (TTS).
 * Cancels any ongoing speech first.
 */
export function speak(text: string, rate = 1.0, pitch = 1.0) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate;
  utterance.pitch = pitch;
  utterance.volume = 0.9;
  // Prefer a clear English voice if available
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(v =>
    v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.default)
  );
  if (preferred) utterance.voice = preferred;
  window.speechSynthesis.speak(utterance);
}

/** Map notification type string → sound type */
export function notificationTypeToSound(type: string): 'result' | 'prescription' | 'default' {
  if (type === 'RESULT_READY') return 'result';
  if (type === 'PRESCRIPTION_CREATED') return 'prescription';
  return 'default';
}

/**
 * Build a human-readable speech string from notification data.
 * data is the parsed JSON from Notification.data
 */
export function buildSpeechText(type: string, body: string, data: Record<string, any> | null): string {
  // Use the `body` field directly — it's already human-readable from the backend
  // e.g. "Pedro's CBC result is now available."
  // or "Dr. Santos requested CBC, URINE for Ana."
  return body || '';
}
