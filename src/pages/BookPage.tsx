/** Book landing page: cover + meta, reading actions, chapter map, and the
 *  book's memory (tag distribution + saved passages). */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as api from '../lib/api';
import type { BookDetail, Highlight } from '../lib/types';
import { useStore } from '../lib/store';
import { Cover, I, TagDot } from '../components/icons';
import { ScreenHead, Stat, Toast, card, linkBtn, primaryBtn, secondaryBtn, wrap } from '../components/ui';
import type { AiInit } from '../components/AICompanion';

const STATUSES: [string, string][] = [
  ['reading', 'Reading'],
  ['unread', 'To read'],
  ['finished', 'Finished'],
  ['reference', 'Reference'],
];

export default function BookPage({ openAI }: { openAI: (init?: AiInit) => void }) {
  const { bookId = '' } = useParams();
  const navigate = useNavigate();
  const { library, refreshLibrary } = useStore();
  const [book, setBook] = useState<BookDetail | null>(null);
  const [notes, setNotes] = useState<Highlight[]>([]);
  const [toast, setToast] = useState('');
  const [busyCards, setBusyCards] = useState(false);
  const [error, setError] = useState('');

  const membership = library.books.find((b) => b.id === bookId);

  useEffect(() => {
    api.fetchBook(bookId).then(setBook).catch((e) => setError(e.message));
    api.fetchHighlights(bookId).then(setNotes).catch(() => {});
  }, [bookId]);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  };

  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const n of notes) counts[n.tag] = (counts[n.tag] ?? 0) + 1;
    return counts;
  }, [notes]);

  const addBook = async () => {
    await api.addToLibrary(bookId);
    await refreshLibrary();
    flash('Added to your library');
  };

  const setStatus = async (status: string) => {
    await api.updateLibraryBook(bookId, { status });
    await refreshLibrary();
  };

  const generateCards = async () => {
    setBusyCards(true);
    try {
      const res = await api.aiGenerateCards(bookId);
      flash(res.message ?? `${res.cards.length} cards generated from your highlights`);
    } catch (err) {
      flash((err as Error).message);
    } finally {
      setBusyCards(false);
    }
  };

  if (error) {
    return (
      <div style={wrap}>
        <div style={{ color: 'var(--ink-2)' }}>{error}</div>
      </div>
    );
  }
  if (!book) return <div style={wrap} />;

  const resumeChapter = membership?.currentChapter ?? 1;

  return (
    <div className="grove-enter" style={wrap}>
      <button onClick={() => navigate(-1)} style={{ ...linkBtn, marginBottom: 22 }}>
        <I.back size={16} /> Back
      </button>

      <div style={{ display: 'flex', gap: 26, alignItems: 'flex-end', marginBottom: 30, flexWrap: 'wrap' }}>
        <Cover book={book} w={128} h={192} radius={6} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>
            {book.genre}{book.year ? ` · ${book.year < 0 ? `${-book.year} BC` : book.year}` : ''}
          </div>
          <h1 style={{ fontFamily: 'var(--read)', fontWeight: 400, fontSize: 'clamp(28px, 7vw, 46px)', margin: 0, lineHeight: 1.05 }}>{book.title}</h1>
          {book.subtitle && <div style={{ fontFamily: 'var(--read)', fontSize: 18, color: 'var(--ink-2)', marginTop: 6 }}>{book.subtitle}</div>}
          <div style={{ fontSize: 15, color: 'var(--ink-2)', marginTop: 10 }}>{book.author}</div>
          <div className="grove-mem-stats" style={{ display: 'flex', gap: 28, marginTop: 22, flexWrap: 'wrap' }}>
            <Stat n={`${Math.round((membership?.progress ?? 0) * 100)}%`} l="Read" />
            <Stat n={notes.length} l="Passages marked" />
            <Stat n={notes.filter((n) => n.note).length} l="Margin notes" />
          </div>
        </div>
      </div>

      {/* actions */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        {membership ? (
          <>
            <button onClick={() => navigate(`/read/${bookId}/${resumeChapter}`)} style={primaryBtn}>
              {membership.progress > 0 ? 'Resume reading' : 'Start reading'} <I.arrowRight size={16} />
            </button>
            <button onClick={generateCards} disabled={busyCards} style={{ ...secondaryBtn, opacity: busyCards ? 0.6 : 1 }}>
              <I.sparkle size={16} /> {busyCards ? 'Generating…' : 'Generate cards'}
            </button>
            <button onClick={() => openAI({ bookId })} style={secondaryBtn}>
              <I.ask size={16} /> Ask about this book
            </button>
          </>
        ) : (
          <button onClick={addBook} style={primaryBtn}>
            <I.plus size={16} /> Add to my library
          </button>
        )}
      </div>

      {/* status control */}
      {membership && (
        <div style={{ display: 'inline-flex', gap: 4, padding: 4, borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--line)', marginBottom: 34, flexWrap: 'wrap' }}>
          {STATUSES.map(([value, label]) => {
            const on = membership.status === value;
            return (
              <button
                key={value}
                onClick={() => setStatus(value)}
                style={{
                  padding: '8px 15px', borderRadius: 9, border: 'none', fontSize: 13, fontWeight: on ? 600 : 500,
                  background: on ? 'var(--surface)' : 'transparent', color: on ? 'var(--ink)' : 'var(--ink-2)',
                  boxShadow: on ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {book.summary && (
        <div style={{ ...card, marginBottom: 26 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>About</div>
          <p style={{ fontFamily: 'var(--read)', fontSize: 16.5, lineHeight: 1.6, margin: 0, color: 'var(--ink-2)' }}>{book.summary}</p>
        </div>
      )}

      {/* chapter map */}
      <div style={{ ...card, marginBottom: 26, padding: 12 }}>
        <div className="eyebrow" style={{ margin: '10px 12px 12px' }}>Contents · {book.chapters.length} chapters</div>
        <div style={{ display: 'grid', gap: 2 }}>
          {book.chapters.map((ch) => {
            const active = membership && ch.no === membership.currentChapter && membership.status === 'reading';
            const done = membership && ch.no < membership.currentChapter;
            return (
              <button
                key={ch.no}
                className="row-hover"
                onClick={() => navigate(`/read/${bookId}/${ch.no}`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '12px 12px', borderRadius: 10,
                  textAlign: 'left', width: '100%', border: 'none',
                  background: active ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'transparent',
                  color: 'inherit',
                }}
              >
                <span style={{ fontFamily: 'var(--mono)', fontSize: 12, width: 24, flex: 'none', color: active ? 'var(--accent)' : 'var(--ink-3)' }}>
                  {String(ch.no).padStart(2, '0')}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontFamily: 'var(--read)', fontSize: 15.5, lineHeight: 1.25, fontWeight: active ? 600 : 400, opacity: done ? 0.65 : 1 }}>
                    {ch.title}
                  </span>
                  <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>
                    {ch.estMinutes} min{(ch.marked ?? 0) > 0 ? ` · ${ch.marked} marked` : ''}
                  </span>
                </span>
                {active ? (
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)' }}>Here</span>
                ) : done ? (
                  <I.check size={15} style={{ color: 'var(--tag-idea)' }} />
                ) : (
                  <I.chevron size={15} style={{ color: 'var(--ink-3)' }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* memory: tag distribution + passages */}
      {notes.length > 0 && (
        <>
          <div style={{ ...card, marginBottom: 26 }}>
            <div className="eyebrow" style={{ marginBottom: 16 }}>What caught your attention</div>
            <div style={{ display: 'flex', gap: 8, height: 12, borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
              {Object.entries(tagCounts).map(([t, c]) => (
                <div key={t} style={{ flex: c, background: `var(--tag-${t})`, opacity: 0.85 }} title={`${t}: ${c}`} />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
              {Object.entries(tagCounts).map(([t, c]) => (
                <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--ink-2)' }}>
                  <TagDot tag={t} /> {t} · {c}
                </span>
              ))}
            </div>
          </div>

          <h2 style={{ fontFamily: 'var(--read)', fontWeight: 400, fontSize: 22, margin: '0 0 18px' }}>Passages you saved</h2>
          <div style={{ display: 'grid', gap: 14, marginBottom: 30 }}>
            {notes.map((n) => (
              <div key={n.id} style={{ display: 'flex', gap: 16, padding: '18px 20px', borderRadius: 14, background: 'var(--surface)', border: '1px solid var(--line)' }}>
                <div style={{ width: 3, borderRadius: 3, background: `var(--tag-${n.tag})`, flex: 'none' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--read)', fontSize: 17, lineHeight: 1.45 }}>“{n.text}”</div>
                  {n.note && (
                    <div style={{ fontSize: 13.5, color: 'var(--ink-2)', marginTop: 10, paddingLeft: 12, borderLeft: '2px solid var(--line-2)', lineHeight: 1.5 }}>{n.note}</div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, fontSize: 11.5, color: 'var(--ink-3)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <TagDot tag={n.tag} size={7} /> {n.tag}
                    </span>
                    · <span>{n.chapterTitle}</span> ·{' '}
                    <button onClick={() => navigate(`/read/${bookId}/${n.chapterNo}`)} style={{ ...linkBtn, fontSize: 11.5 }}>
                      Go to chapter <I.arrowRight size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {toast && <Toast message={toast} />}
    </div>
  );
}
