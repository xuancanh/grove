/**
 * Plain-text book import: splits raw text into chapters, paragraphs, and
 * sentences so uploaded books get the same anchored-highlight treatment as
 * the seeded catalog.
 *
 * Chapter boundaries: markdown headings (# …) or lines starting with
 * "Chapter/Part/Book/Canto N". If no boundaries are found the whole text
 * becomes a single chapter. Paragraphs split on blank lines; sentences on
 * terminal punctuation followed by whitespace and a capital/quote.
 */
export interface ImportedChapter {
  title: string;
  paragraphs: string[][];
}

const CHAPTER_RE = /^(#{1,3}\s+.+|(chapter|part|book|canto)\s+([0-9]+|[ivxlc]+)\b.*)$/i;

export function splitSentences(paragraph: string): string[] {
  const normalized = paragraph.replace(/\s+/g, ' ').trim();
  if (!normalized) return [];
  const parts = normalized.split(/(?<=[.!?…]["”’')\]]?)\s+(?=["“‘'([]?[A-Z0-9])/);
  return parts.map((s) => s.trim()).filter(Boolean);
}

export function importText(raw: string): ImportedChapter[] {
  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  const chapters: { title: string; body: string[] }[] = [];
  let current: { title: string; body: string[] } | null = null;

  for (const line of lines) {
    if (CHAPTER_RE.test(line.trim()) && line.trim().length < 100) {
      if (current) chapters.push(current);
      current = { title: line.trim().replace(/^#+\s*/, ''), body: [] };
    } else {
      if (!current) current = { title: 'Chapter 1', body: [] };
      current.body.push(line);
    }
  }
  if (current) chapters.push(current);

  return chapters
    .map((ch) => ({
      title: ch.title,
      paragraphs: ch.body
        .join('\n')
        .split(/\n\s*\n/)
        .map((p) => splitSentences(p))
        .filter((p) => p.length > 0),
    }))
    .filter((ch) => ch.paragraphs.length > 0);
}

/** ~200 words/minute rough reading-time estimate. */
export function estimateMinutes(paragraphs: string[][]): number {
  const words = paragraphs.flat().join(' ').split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}
