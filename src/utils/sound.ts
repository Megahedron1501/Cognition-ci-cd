// Shared sound utility - one place to check the global on/off toggle before
// playing anything, instead of each tool duplicating that check.

let soundEnabled = true;

export function isSoundEnabled(): boolean {
  return soundEnabled;
}

export function setSoundEnabled(enabled: boolean): void {
  soundEnabled = enabled;
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
