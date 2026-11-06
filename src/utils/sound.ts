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
