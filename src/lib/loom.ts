/**
 * Knowledge Loom bridge — Grove is Loom-aware.
 *
 * Grove and Loom share one backend and one account, so this is a thin client
 * over Loom's own API:
 *   - server mode: same origin, same bearer token — connected by definition.
 *   - offline app: connects when built with VITE_LOOM_API (the hosted
 *     backend) + the shared Supabase config; the user signs in from
 *     Settings → Knowledge Loom. Grove data stays local — the connection is
 *     only used to PUSH cards/notes to the user's Loom vault.
 *
 * Loom endpoints used (bearer-authenticated, or local-mode without):
 *   POST /api/learn        { mode: 'write', title, body }   → markdown note
 *   POST /api/flashcards   { prompt, lesson }               → user flashcard
 */
import { supabase } from './supabase';
import { serverMode } from './data';
import type { Card, Highlight, Book } from './types';

const LOOM_API = (import.meta.env.VITE_LOOM_API as string | undefined)?.replace(/\/$/, '') ?? '';
const base = serverMode ? '' : LOOM_API;

/** Whether a Loom connection is possible in this build. */
export const loomAvailable = serverMode || (!!LOOM_API && !!supabase);

/** Whether the user is currently connected to Loom. */
export async function loomConnected(): Promise<boolean> {
  if (serverMode) return true;
  if (!LOOM_API) return false;
  if (!supabase) return false;
  const { data } = await supabase.auth.getSession();
  return !!data.session;
}

export async function loomAccountEmail(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user.email ?? null;
}

export async function connectLoom(email: string, password: string): Promise<void> {
  if (!supabase) throw new Error('This build has no Loom account support.');
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
}

export async function disconnectLoom(): Promise<void> {
  if (supabase) await supabase.auth.signOut();
}

async function loomHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    if (data.session) headers.Authorization = `Bearer ${data.session.access_token}`;
  }
  return headers;
}

async function loomPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: await loomHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let message = `Loom request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data.error) message = data.error;
    } catch { /* keep default */ }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

/** Sends one markdown note into the user's Loom vault; returns the note id. */
export async function sendNoteToLoom(title: string, body: string): Promise<string> {
  const res = await loomPost<{ note?: { id?: string } }>('/api/learn', { mode: 'write', title, body });
  if (!res.note?.id) throw new Error('Loom did not return the created note');
  return res.note.id;
}

/**
 * Copies Grove recall cards into Loom's user flashcards. Loom anchors user
 * cards to a note, so each sync writes one "Grove cards: <book>" note per
 * book and attaches that book's cards to it. Returns the number of cards.
 */
export async function syncCardsToLoom(cards: Card[]): Promise<number> {
  const byBook = new Map<string, Card[]>();
  for (const card of cards) {
    const key = card.bookTitle || 'Your reading';
    byBook.set(key, [...(byBook.get(key) ?? []), card]);
  }
  let sent = 0;
  for (const [bookTitle, group] of byBook) {
    const body =
      `Recall cards from [Grove] — *${bookTitle}*.\n\n` +
      group.map((c) => `- **${c.front.replace(/\n/g, ' ')}**`).join('\n');
    const noteId = await sendNoteToLoom(`Grove cards: ${bookTitle}`, body);
    for (const card of group) {
      const lesson = card.source ? `${card.back}\n\n> ${card.source}` : card.back;
      await loomPost('/api/flashcards', { prompt: card.front, lesson, noteId });
      sent += 1;
    }
  }
  return sent;
}

/** Builds the markdown "reading digest" note for one book. */
export function buildReadingDigest(book: Book, highlights: Highlight[]): { title: string; body: string } {
  const byChapter = new Map<string, Highlight[]>();
  for (const h of highlights) {
    const key = h.chapterTitle ?? 'Passages';
    byChapter.set(key, [...(byChapter.get(key) ?? []), h]);
  }
  const lines: string[] = [
    `Reading digest from [Grove] — *${book.title}* by ${book.author}${book.year ? ` (${book.year})` : ''}.`,
    '',
  ];
  if (book.summary) lines.push(book.summary, '');
  for (const [chapter, marks] of byChapter) {
    lines.push(`## ${chapter}`, '');
    for (const h of marks) {
      lines.push(`> ${h.text}`);
      if (h.note) lines.push(`>`, `> — ${h.note}`);
      lines.push(`> <small>#${h.tag}</small>`, '');
    }
  }
  return { title: `Reading: ${book.title}`, body: lines.join('\n') };
}
