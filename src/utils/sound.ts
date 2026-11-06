// Shared sound utility - one place to check the global on/off toggle before
// playing anything, instead of each tool duplicating that check.

let soundEnabled = true;

export function isSoundEnabled(): boolean {
  return soundEnabled;
}

export function setSoundEnabled(enabled: boolean): void {
  soundEnabled = enabled;
}

// Speaks text aloud with the browser's built-in speech synthesis - used to
// deliver instructions (the SD) to learners who can't read them. Cancels
// anything already being spoken so repeats never stack up.
export function speak(text: string): void {
  if (!soundEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
}

// A soft three-note rising chime, generated in code so it needs no sound file.
export function playChime(): void {
  if (!soundEnabled) return;
  try {
    const context = new AudioContext();
    [523.25, 659.25, 783.99].forEach((frequency, i) => {
      const start = context.currentTime + i * 0.25;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.25, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.6);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.6);
    });
  } catch {
    // Silently fail
  }
}

export function playSound(src: string, volume = 0.5): void {
  if (!soundEnabled) return;
  try {
    const audio = new Audio(src);
    audio.volume = volume;
    audio.play().catch(() => {});
  } catch {
    // Silently fail
  }
}
