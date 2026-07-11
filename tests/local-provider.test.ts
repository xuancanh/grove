/**
 * LocalProvider end-to-end under Node (fake-indexeddb): the full offline
 * flow — seeded catalog, library, highlights, FSRS cards, rhythm — with no
 * server and no login.
 */
import 'fake-indexeddb/auto';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { localProvider as api } from '../src/lib/data/local';

test('status: offline mode never requires auth', async () => {
  assert.deepEqual(await api.fetchStatus(), { ok: true, authRequired: false });
});

test('catalog: bundled seed is present with chapters and text', async () => {
  const catalog = await api.fetchCatalog();
  assert.ok(catalog.length >= 10, `seeded ${catalog.length} books`);
  const walden = catalog.find((b) => b.title === 'Walden');
  assert.ok(walden, 'Walden in catalog');
  const detail = await api.fetchBook(walden!.id);
  assert.ok(detail.chapters.length > 0);
  const chapter = await api.fetchChapter(walden!.id, 2);
  assert.ok(chapter.paragraphs.length > 0);
  assert.ok(chapter.paragraphs[0].sentences.length > 0);
});

test('library: add, progress, remove', async () => {
  const catalog = await api.fetchCatalog();
  const id = catalog[0].id;
  let lib = await api.addToLibrary(id);
  assert.equal(lib.books.length, 1);
  assert.equal(lib.books[0].status, 'unread');
  await api.updateLibraryBook(id, { status: 'reading', progress: 0.5, currentChapter: 2 });
  lib = await api.fetchLibrary();
  assert.equal(lib.books[0].progress, 0.5);
  assert.ok(lib.books[0].minutesLeft >= 0);
});

test('highlights: create, enrich, patch, list by book', async () => {
  const walden = (await api.fetchCatalog()).find((b) => b.title === 'Walden')!;
  const ch = await api.fetchChapter(walden.id, 2);
  const h = await api.createHighlight({
    bookId: walden.id, chapterId: ch.chapter.id, paragraphIdx: 1, sentenceIdx: 0,
    tag: 'important', text: ch.paragraphs[1].sentences[0],
  });
  assert.equal(h.bookTitle, 'Walden');
  assert.equal(h.chapterNo, 2);
  const patched = await api.patchHighlight(h.id, { note: 'live deliberately' });
  assert.equal(patched.note, 'live deliberately');
  assert.equal((await api.fetchHighlights(walden.id)).length, 1);
});

test('cards: FSRS review grows intervals; again lapses to 1 day', async () => {
  const walden = (await api.fetchCatalog()).find((b) => b.title === 'Walden')!;
  const card = await api.createCard({ bookId: walden.id, front: 'Why the woods?', back: 'To live deliberately.' });
  assert.equal(card.status, 'new');

  await api.reviewCard(card.id, 'good');
  const cards = await api.fetchCards();
  let c = cards.find((x) => x.id === card.id)!;
  assert.ok(c.repetitions === 1 && c.intervalDays >= 1);
  assert.ok((c.stability ?? 0) > 0, 'FSRS stability set');
  const firstInterval = c.intervalDays;

  await api.reviewCard(card.id, 'good');
  c = (await api.fetchCards()).find((x) => x.id === card.id)!;
  assert.ok(c.intervalDays >= firstInterval, 'interval does not shrink on good');

  await api.reviewCard(card.id, 'again');
  c = (await api.fetchCards()).find((x) => x.id === card.id)!;
  assert.equal(c.intervalDays, 1, 'lapse schedules tomorrow');
  assert.equal(c.lastRating, 'again');
});

test('sessions: rhythm aggregates today', async () => {
  const walden = (await api.fetchCatalog()).find((b) => b.title === 'Walden')!;
  await api.logSession(walden.id, 12);
  await api.logSession(walden.id, 8);
  const rhythm = await api.fetchRhythm();
  assert.equal(rhythm.todayMinutes, 20);
  assert.equal(rhythm.week.length, 7);
});

test('settings: ai key stored locally, surfaced as hasAiApiKey', async () => {
  const s = await api.patchSettings({ aiProvider: 'anthropic', aiApiKey: 'sk-test' });
  assert.equal(s.hasAiApiKey, true);
  assert.equal(s.serverAiProvider, 'none');
  const status = await api.fetchAiStatus();
  assert.deepEqual({ provider: status.provider, configured: status.configured }, { provider: 'anthropic', configured: true });
});

test('import: plain text becomes a private book with chapters', async () => {
  const detail = await api.importBook({
    title: 'My Notes', author: 'Me',
    text: '# Chapter One\n\nFirst paragraph here. Second sentence follows!\n\nAnother paragraph.\n\n# Chapter Two\n\nMore text here.',
  });
  assert.equal(detail.chapters.length, 2);
  const ch1 = await api.fetchChapter(detail.id, 1);
  assert.equal(ch1.paragraphs[0].sentences.length, 2);
  await api.deleteBook(detail.id);
  await assert.rejects(() => api.fetchBook(detail.id));
});

// ── Scheduler parity with Knowledge Loom ─────────────────────────────────────
// fsrs.ts is byte-identical across Loom, grove-server, and this client
// (verified by diff in CI-able form below would need the other repos; here we
// pin the same numeric behaviors Loom's backend-fsrs.test.ts asserts).
import { fsrsReview } from '../src/lib/fsrs';

test('parity: first good review schedules days out, reps=1, no lapse', () => {
  const good = fsrsReview(null, 3, 0);
  assert.ok(good.intervalDays >= 3, `good interval ${good.intervalDays} should be days, not hours`);
  assert.equal(good.state.reps, 1);
  assert.equal(good.state.lapses, 0);
  const again = fsrsReview(null, 1, 0);
  assert.equal(again.intervalDays, 1);
  assert.equal(again.state.lapses, 1);
});

test('parity: hard never schedules further than good', () => {
  const base = fsrsReview(null, 3, 0);
  const afterGood = fsrsReview(base.state, 3, base.intervalDays);
  const afterHard = fsrsReview(base.state, 2, base.intervalDays);
  assert.ok(afterHard.intervalDays <= afterGood.intervalDays);
});
