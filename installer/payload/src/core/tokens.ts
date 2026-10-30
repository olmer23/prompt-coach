/** Token estimation (cheap, no tokenizer dependency) */

export function estimateTokens(text: string): number {
  if (!text) return 0;
  // Heuristic: ~4 chars/token for English, ~2.5 for Cyrillic-heavy text.
  const cyrillic = (text.match(/[а-яёА-ЯЁ]/g) || []).length;
  const ratio = cyrillic / Math.max(1, text.length) > 0.3 ? 2.5 : 4;
  return Math.max(1, Math.round(text.length / ratio));
}

export function wordCount(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

export function isRussian(text: string): boolean {
  const cyr = (text.match(/[а-яёА-ЯЁ]/g) || []).length;
  return cyr / Math.max(1, text.length) > 0.2;
}
