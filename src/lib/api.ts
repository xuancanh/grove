/**
 * Typed HTTP client for the Grove API (/api/grove on the shared Knowledge Loom enterprise backend). Attaches the Supabase access token as
 * a Bearer header when auth is enabled; throws Error(message) on non-2xx.
 */
import { supabase } from './supabase';
import type {
  AiStatus,
  Book,
  BookDetail,
  Card,
  ChapterContent,
  ChatMessage,
  Collection,
  Highlight,
  LibraryState,
  Rhythm,
  SearchResult,
  Settings,
} from './types';

async function authHeaders(): Promise<Record<string, string>> {
  if (!supabase) return {};
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(url: string, init: RequestInit = {}): Promise<T> {
  const auth = await authHeaders();
  const res = await fetch(url, {
    ...init,
    headers: { ...auth, ...(init.body ? { 'content-type': 'application/json' } : {}), ...(init.headers as Record<string, string>) },
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body.error) message = body.error;
    } catch { /* keep default */ }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

// ── Status ────────────────────────────────────────────────────────────────
export const fetchStatus = () => request<{ ok: boolean; authRequired: boolean }>('/api/grove/status');

// ── Catalog & books ───────────────────────────────────────────────────────
export const fetchCatalog = () => request<Book[]>('/api/grove/catalog');
export const fetchBook = (id: string) => request<BookDetail>(`/api/grove/books/${encodeURIComponent(id)}`);
export const fetchChapter = (id: string, no: number) =>
  request<ChapterContent>(`/api/grove/books/${encodeURIComponent(id)}/chapters/${no}`);
export const importBook = (payload: { title: string; author?: string; genre?: string; text: string }) =>
  request<BookDetail>('/api/grove/books', { method: 'POST', body: JSON.stringify(payload) });
export const deleteBook = (id: string) =>
  request<{ deleted: string }>(`/api/grove/books/${encodeURIComponent(id)}`, { method: 'DELETE' });

// ── Library ───────────────────────────────────────────────────────────────
export const fetchLibrary = () => request<LibraryState>('/api/grove/library');
export const addToLibrary = (bookId: string) =>
  request<LibraryState>(`/api/grove/library/${encodeURIComponent(bookId)}`, { method: 'POST' });
export const updateLibraryBook = (
  bookId: string,
  patch: { status?: string; progress?: number; currentChapter?: number },
) => request(`/api/grove/library/${encodeURIComponent(bookId)}`, { method: 'PATCH', body: JSON.stringify(patch) });
export const removeFromLibrary = (bookId: string) =>
  request(`/api/grove/library/${encodeURIComponent(bookId)}`, { method: 'DELETE' });

// ── Collections ───────────────────────────────────────────────────────────
export const createCollection = (label: string, color: string) =>
  request<Collection>('/api/grove/collections', { method: 'POST', body: JSON.stringify({ label, color }) });
export const deleteCollection = (id: string) =>
  request(`/api/grove/collections/${encodeURIComponent(id)}`, { method: 'DELETE' });
export const setCollectionMembership = (collectionId: string, bookId: string, on: boolean) =>
  request(`/api/grove/collections/${encodeURIComponent(collectionId)}/books/${encodeURIComponent(bookId)}`, {
    method: on ? 'PUT' : 'DELETE',
  });

// ── Highlights ────────────────────────────────────────────────────────────
export const fetchHighlights = (bookId?: string) =>
  request<Highlight[]>(`/api/grove/highlights${bookId ? `?bookId=${encodeURIComponent(bookId)}` : ''}`);
export const createHighlight = (payload: {
  bookId: string;
  chapterId: string;
  paragraphIdx: number;
  sentenceIdx: number;
  tag: string;
  text: string;
  note?: string;
}) => request<Highlight>('/api/grove/highlights', { method: 'POST', body: JSON.stringify(payload) });
export const patchHighlight = (id: string, patch: { tag?: string; note?: string }) =>
  request<Highlight>(`/api/grove/highlights/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(patch) });
export const deleteHighlight = (id: string) =>
  request(`/api/grove/highlights/${encodeURIComponent(id)}`, { method: 'DELETE' });

// ── Cards ─────────────────────────────────────────────────────────────────
export const fetchCards = () => request<Card[]>('/api/grove/cards');
export const createCard = (payload: {
  bookId: string;
  highlightId?: string;
  front: string;
  back: string;
  source?: string;
  chapterTitle?: string;
}) => request<Card>('/api/grove/cards', { method: 'POST', body: JSON.stringify(payload) });
export const reviewCard = (id: string, rating: 'again' | 'hard' | 'good' | 'easy') =>
  request(`/api/grove/cards/${encodeURIComponent(id)}/review`, { method: 'POST', body: JSON.stringify({ rating }) });
export const deleteCard = (id: string) =>
  request(`/api/grove/cards/${encodeURIComponent(id)}`, { method: 'DELETE' });

// ── Sessions ──────────────────────────────────────────────────────────────
export const logSession = (bookId: string, minutes: number) =>
  request('/api/grove/sessions', { method: 'POST', body: JSON.stringify({ bookId, minutes }) });
export const fetchRhythm = () => request<Rhythm>('/api/grove/sessions/rhythm');

// ── Settings ──────────────────────────────────────────────────────────────
export const fetchSettings = () => request<Settings>('/api/grove/settings');
export const patchSettings = (patch: Partial<Settings> & { aiApiKey?: string }) =>
  request<Settings>('/api/grove/settings', { method: 'PATCH', body: JSON.stringify(patch) });

// ── AI ────────────────────────────────────────────────────────────────────
export const fetchAiStatus = () => request<AiStatus>('/api/grove/ai/status');
export const aiThread = (bookId: string, chapterNo: number) =>
  request<{ beats: string[]; summary: string }>('/api/grove/ai/thread', {
    method: 'POST',
    body: JSON.stringify({ bookId, chapterNo }),
  });
export const aiGenerateCards = (bookId: string) =>
  request<{ cards: Card[]; message?: string }>('/api/grove/ai/cards', {
    method: 'POST',
    body: JSON.stringify({ bookId }),
  });
export const aiSearch = (query: string) =>
  request<SearchResult>('/api/grove/ai/search', { method: 'POST', body: JSON.stringify({ query }) });

/** Streams the AI companion response; calls onChunk per token batch. */
export async function aiChatStream(
  payload: { bookId?: string; chapterNo?: number; messages: ChatMessage[] },
  onChunk: (text: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const auth = await authHeaders();
  const res = await fetch('/api/grove/ai/chat', {
    method: 'POST',
    headers: { ...auth, 'content-type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  });
  if (!res.ok || !res.body) {
    let message = `Chat failed (${res.status})`;
    try {
      const body = await res.json();
      if (body.error) message = body.error;
    } catch { /* keep default */ }
    throw new Error(message);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const data = trimmed.slice(5).trim();
      if (data === '[DONE]') return;
      try {
        const event = JSON.parse(data);
        if (event.error) throw new Error(event.error);
        if (event.text) onChunk(event.text);
      } catch (err) {
        if (err instanceof Error && err.message && !(err instanceof SyntaxError)) throw err;
      }
    }
  }
}
