// Prompting hierarchy data model.
//
// Ordered least-to-most intrusive, matching standard ABA data-sheet codes.
// A trial records the prompt level in effect when the learner responded, so
// a correct response at any level above Independent is a *prompted* correct,
// not an independent one - the distinction BCBAs use to judge mastery and
// to plan prompt fading.

export type PromptLevel = 'I' | 'G' | 'V' | 'M' | 'PP' | 'FP';

export const PROMPT_LEVELS: { code: PromptLevel; label: string }[] = [
  { code: 'I', label: 'Independent' },
  { code: 'G', label: 'Gestural' },
  { code: 'V', label: 'Verbal' },
  { code: 'M', label: 'Model' },
  { code: 'PP', label: 'Partial Physical' },
  { code: 'FP', label: 'Full Physical' },
];

export const DEFAULT_PROMPT_LEVEL: PromptLevel = 'I';

export function promptLabel(code: PromptLevel): string {
  return PROMPT_LEVELS.find(p => p.code === code)?.label ?? code;
}
