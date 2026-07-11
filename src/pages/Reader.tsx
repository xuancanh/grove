/** The reading environment — ported from design/grove-reader.jsx, backed by the API.
 *  Sentence-level highlights with tags + margin notes, chapter map, reading
 *  modes, AI thread digest, dictionary lookup, and reading-time logging. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, serverMode } from '../lib/data';
import type { BookDetail, ChapterContent, Highlight } from '../lib/types';
import { Glyph, I } from '../components/icons';
import { useStore } from '../lib/store';
import type { AiInit } from '../components/AICompanion';

interface ReadMode {
  name: string;
  icon: string;
  measure: number;
  size: number;
  leading: number;
  font: string;
  track: string;
  dark?: boolean;
  dim?: boolean;
  justify?: boolean;
}

const READ_MODES: Record<string, ReadMode> = {
  classic: { name: 'Classic', icon: 'book', measure: 34, size: 1.0, leading: 1.62, font: 'var(--read)', track: '0' },
  focus: { name: 'Focus', icon: 'focus', measure: 30, size: 1.04, leading: 1.7, font: 'var(--read)', track: '0', dim: true },
  night: { name: 'Night', icon: 'moon', measure: 34, size: 1.0, leading: 1.66, font: 'var(--read)', track: '0', dark: true },
  academic: { name: 'Academic', icon: 'contents', measure: 40, size: 0.92, leading: 1.9, font: 'var(--read)', track: '0', justify: true },
  dyslexia: { name: 'Dyslexia', icon: 'type', measure: 30, size: 1.06, leading: 1.95, font: "'Hanken Grotesk', sans-serif", track: '0.03em' },
};

const TAG_LIST: [string, string][] = [
  ['beautiful', 'Beautiful'],
  ['important', 'Important'],
  ['question', 'Question'],
  ['idea', 'Idea'],
];

export default function Reader({ openAI }: { openAI: (init?: AiInit) => void }) {
  const { bookId = '', chapterNo: chapterParam } = useParams();
  const navigate = useNavigate();
  const { settings, refreshLibrary } = useStore();

  const [book, setBook] = useState<BookDetail | null>(null);
  const [content, setContent] = useState<ChapterContent | null>(null);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('classic');
  const [digest, setDigest] = useState<null | 'thread'>(null);
  const [thread, setThread] = useState<{ beats: string[]; summary: string } | null>(null);
  const [threadBusy, setThreadBusy] = useState(false);
  const [showChrome, setShowChrome] = useState(true);
  const [showType, setShowType] = useState(false);
  const [showTOC, setShowTOC] = useState(false);
  const [typeSize, setTypeSize] = useState(settings.readerSize || 1.0);
  const [leadingAdj, setLeadingAdj] = useState(0);
  const [focusPara, setFocusPara] = useState(1);
  const [sel, setSel] = useState<{ p: number; s: number; bottom: number } | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [toast, setToast] = useState<{ icon: string; msg: string } | null>(null);
  const [lookup, setLookup] = useState<{ word: string; def: string; pos: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const chapterNo = Number(chapterParam) || 1;

  useEffect(() => {
    api.fetchBook(bookId).then(setBook).catch((e) => setError(e.message));
  }, [bookId]);

  useEffect(() => {
    setContent(null);
    setDigest(null);
    setThread(null);
    api.fetchChapter(bookId, chapterNo).then(setContent).catch((e) => setError(e.message));
    scrollRef.current?.scrollTo({ top: 0 });
  }, [bookId, chapterNo]);

  // Track reading progress: entering a chapter updates library state.
  useEffect(() => {
    if (!book) return;
    const total = book.chapters.length || 1;
    api
      .updateLibraryBook(bookId, {
        status: 'reading',
        currentChapter: chapterNo,
        progress: Math.min(1, (chapterNo - 1) / total),
      })
      .then(() => refreshLibrary())
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId, chapterNo, !!book]);

  // Log reading time every minute while the reader is open.
  useEffect(() => {
    const t = setInterval(() => {
      api.logSession(bookId, 1).catch(() => {});
    }, 60_000);
    return () => clearInterval(t);
  }, [bookId]);

  const M = READ_MODES[mode];
  const isDark = !!M.dark;
  const fsize = M.size * typeSize;
  const highlights = content?.highlights ?? [];

  const hlFor = useCallback(
    (p: number, s: number) => highlights.find((h) => h.paragraphIdx === p && h.sentenceIdx === s),
    [highlights],
  );

  const setHighlights = (fn: (prev: Highlight[]) => Highlight[]) =>
    setContent((c) => (c ? { ...c, highlights: fn(c.highlights) } : c));

  const showToast = (icon: string, msg: string) => {
    setToast({ icon, msg });
    setTimeout(() => setToast((t) => (t && t.msg === msg ? null : t)), 2400);
  };

  const toggleHighlight = async (p: number, s: number, tag: string) => {
    if (!content) return;
    const existing = hlFor(p, s);
    if (existing) {
      if (existing.tag === tag) {
        setHighlights((prev) => prev.filter((h) => h.id !== existing.id));
        api.deleteHighlight(existing.id).catch(() => {});
      } else {
        setHighlights((prev) => prev.map((h) => (h.id === existing.id ? { ...h, tag } : h)));
        api.patchHighlight(existing.id, { tag }).catch(() => {});
      }
      return existing;
    }
    const text = content.paragraphs[p]?.sentences[s] ?? '';
    const created = await api.createHighlight({
      bookId,
      chapterId: content.chapter.id,
      paragraphIdx: p,
      sentenceIdx: s,
      tag,
      text,
    });
    setHighlights((prev) => [...prev, created]);
    return created;
  };

  const onSentenceTap = (p: number, s: number, e: React.MouseEvent) => {
    if (digest) return;
    e.stopPropagation();
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setSel({ p, s, bottom: r.bottom });
    setNoteOpen(false);
    setShowChrome(false);
  };

  const closeSel = () => {
    setSel(null);
    setNoteOpen(false);
    setNoteDraft('');
  };

  const startNote = async () => {
    if (!sel) return;
    let h = hlFor(sel.p, sel.s);
    if (!h) h = await toggleHighlight(sel.p, sel.s, 'idea');
    setNoteDraft(h?.note ?? '');
    setNoteOpen(true);
  };

  const saveNote = async () => {
    if (!sel) return;
    const h = hlFor(sel.p, sel.s);
    if (h) {
      setHighlights((prev) => prev.map((x) => (x.id === h.id ? { ...x, note: noteDraft } : x)));
      api.patchHighlight(h.id, { note: noteDraft }).catch(() => {});
    }
    closeSel();
    showToast('note', 'Margin note saved');
  };

  const makeCard = async () => {
    if (!sel || !content) return;
    const sentence = content.paragraphs[sel.p]?.sentences[sel.s] ?? '';
    if (!hlFor(sel.p, sel.s)) await toggleHighlight(sel.p, sel.s, 'idea');
    const words = sentence.split(' ');
    const front =
      words.length > 8
        ? `Complete the passage from ${book?.title}: “${words.slice(0, Math.ceil(words.length / 2)).join(' ')}…”`
        : `Recall this passage from ${book?.title} (${content.chapter.title}).`;
    await api.createCard({
      bookId,
      front,
      back: sentence,
      source: sentence,
      chapterTitle: content.chapter.title,
    });
    showToast('cards', 'Card added to your deck');
    closeSel();
  };

  const doLookup = async () => {
    if (!sel || !content) return;
    const sentence = content.paragraphs[sel.p]?.sentences[sel.s] ?? '';
    const common = new Set('the a an and or but of to in on at for with as is are was were be been being i we you he she it they them this that these those not no so if then than when while which who whom whose our your their his her its my me us do did does have has had will would could should may might must can'.split(' '));
    const words = (sentence.toLowerCase().match(/[a-z]+/g) || []).filter((w) => !common.has(w));
    const word = words.sort((a, b) => b.length - a.length)[0];
    closeSel();
    if (!word) return;
    setLookup({ word, def: 'Looking up…', pos: '' });
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
      const data = await res.json();
      const meaning = data?.[0]?.meanings?.[0];
      setLookup({
        word,
        pos: meaning?.partOfSpeech ?? '',
        def: meaning?.definitions?.[0]?.definition ?? 'No definition found.',
      });
    } catch {
      setLookup({ word, pos: '', def: 'Definition unavailable offline.' });
    }
  };

  const openThread = async () => {
    setDigest('thread');
    setShowType(false);
    setShowTOC(false);
    if (thread || threadBusy) return;
    setThreadBusy(true);
    try {
      setThread(await api.aiThread(bookId, chapterNo));
    } catch (err) {
      showToast('sparkle', (err as Error).message);
      setDigest(null);
    } finally {
      setThreadBusy(false);
    }
  };

  const chapterIndex = book?.chapters.findIndex((c) => c.no === chapterNo) ?? -1;
  const nextChapter = book && chapterIndex >= 0 ? book.chapters[chapterIndex + 1] : undefined;

  const finishBook = async () => {
    await api.updateLibraryBook(bookId, { status: 'finished', progress: 1 });
    refreshLibrary();
    navigate(`/book/${bookId}`);
  };

  const pageStyle = isDark
    ? { background: '#15171A', color: '#D8D2C6' }
    : { background: 'var(--page)', color: 'var(--ink)' };

  if (error) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: 'var(--ink-2)' }}>
        {error} — <button onClick={() => navigate('/')} style={{ border: 'none', background: 'none', color: 'var(--accent)', fontWeight: 600 }}>back to library</button>
      </div>
    );
  }

  const progress = book ? chapterNo / Math.max(1, book.chapters.length) : 0;

  return (
    <div
      className="grove-scroll"
      ref={scrollRef}
      onClick={() => {
        setShowChrome((s) => !s);
        closeSel();
      }}
      style={{ position: 'fixed', inset: 0, overflowY: 'auto', ...pageStyle, transition: 'background 0.4s, color 0.4s' }}
    >
      {/* ── TOP CHROME ── */}
      <div
        style={{
          position: 'sticky', top: 0, zIndex: 30,
          transform: showChrome ? 'none' : 'translateY(-102%)',
          transition: 'transform 0.32s cubic-bezier(0.2,0.7,0.2,1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '13px 16px',
            background: isDark ? 'rgba(21,23,26,0.86)' : 'color-mix(in srgb, var(--page) 86%, transparent)',
            backdropFilter: 'blur(14px)',
            borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'var(--line)'}`,
          }}
        >
          <button onClick={() => navigate(`/book/${bookId}`)} style={iconBtn(false)}><I.back size={20} /></button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--read)', fontSize: 16, fontWeight: 500, lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {book?.title ?? '…'}
            </div>
            <div style={{ fontSize: 11.5, color: isDark ? '#8A857A' : 'var(--ink-3)', marginTop: 2 }}>
              {digest === 'thread' ? 'Thread digest' : content ? `Ch. ${chapterNo} · ${content.chapter.title}` : 'Loading…'}
            </div>
          </div>
          <button
            onClick={openThread}
            style={iconBtn(digest === 'thread')}
            title="Thread digest (AI)"
          >
            <I.thread size={19} />
          </button>
          <button
            onClick={() => { setShowTOC((v) => !v); setShowType(false); }}
            style={iconBtn(showTOC)}
            title="Chapter map"
          >
            <I.contents size={19} />
          </button>
          <button
            onClick={() => { setShowType((v) => !v); setShowTOC(false); }}
            style={iconBtn(showType)}
            title="Display"
          >
            <I.type size={19} />
          </button>
        </div>

        <div style={{ height: 2, background: isDark ? 'rgba(255,255,255,0.07)' : 'var(--line)' }}>
          <div style={{ height: '100%', width: `${progress * 100}%`, background: 'var(--accent)' }} />
        </div>

        {showType && (
          <div className="grove-enter grove-scroll" style={{ ...popover(isDark), maxHeight: '74vh', overflowY: 'auto' }}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>Reading mode</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {Object.entries(READ_MODES).map(([k, m]) => {
                const on = k === mode && !digest;
                return (
                  <button
                    key={k}
                    onClick={() => { setMode(k); setDigest(null); }}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 9,
                      padding: 12, borderRadius: 12, textAlign: 'left',
                      border: `1px solid ${on ? 'var(--accent)' : isDark ? 'rgba(255,255,255,0.1)' : 'var(--line)'}`,
                      background: on ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'transparent',
                      color: 'inherit',
                    }}
                  >
                    <Glyph name={m.icon} size={20} style={{ color: on ? 'var(--accent)' : 'inherit', opacity: on ? 1 : 0.7 }} />
                    <span style={{ fontSize: 13, fontWeight: on ? 600 : 500 }}>{m.name}</span>
                  </button>
                );
              })}
            </div>
            <div className="eyebrow" style={{ margin: '18px 0 12px' }}>Typography</div>
            <Stepper
              label="Type size"
              value={`${Math.round(fsize * 100)}%`}
              onMinus={() => setTypeSize((v) => Math.max(0.8, +(v - 0.05).toFixed(2)))}
              onPlus={() => setTypeSize((v) => Math.min(1.5, +(v + 0.05).toFixed(2)))}
              isDark={isDark}
            />
            <Stepper
              label="Line height"
              value={(M.leading + leadingAdj).toFixed(2)}
              onMinus={() => setLeadingAdj((v) => Math.max(-0.3, +(v - 0.05).toFixed(2)))}
              onPlus={() => setLeadingAdj((v) => Math.min(0.5, +(v + 0.05).toFixed(2)))}
              isDark={isDark}
            />
          </div>
        )}

        {showTOC && book && (
          <div className="grove-enter grove-scroll" style={{ ...popover(isDark), maxHeight: '70vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div className="eyebrow">Chapter map</div>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>{book.chapters.length} chapters</span>
            </div>
            <div style={{ display: 'grid', gap: 2 }}>
              {book.chapters.map((ch) => {
                const active = ch.no === chapterNo;
                const done = ch.no < chapterNo;
                return (
                  <button
                    key={ch.no}
                    onClick={() => { setShowTOC(false); navigate(`/read/${bookId}/${ch.no}`); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14, padding: '11px 12px', borderRadius: 10,
                      textAlign: 'left', width: '100%', border: 'none',
                      background: active ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'transparent',
                      color: 'inherit',
                    }}
                  >
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 12, width: 22, flex: 'none', color: active ? 'var(--accent)' : 'var(--ink-3)' }}>
                      {String(ch.no).padStart(2, '0')}
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontFamily: 'var(--read)', fontSize: 15, lineHeight: 1.25, fontWeight: active ? 600 : 400, opacity: done ? 0.6 : 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
                      <span style={{ width: 6, height: 6, borderRadius: 4, background: 'var(--line-2)', flex: 'none' }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── READING SURFACE ── */}
      {digest === 'thread' ? (
        <ThreadView
          title={content?.chapter.title ?? ''}
          chapterNo={chapterNo}
          thread={thread}
          busy={threadBusy}
          isDark={isDark}
        />
      ) : (
        <div style={{ maxWidth: `${M.measure}rem`, margin: '0 auto', padding: '56px 28px 200px' }}>
          <div style={{ marginBottom: 44, animation: 'groveFade 0.6s both' }}>
            <div className="eyebrow" style={{ color: 'var(--accent)', marginBottom: 14 }}>Chapter {chapterNo}</div>
            <h1 style={{ fontFamily: 'var(--read)', fontWeight: 400, fontSize: 'clamp(28px, 5vw, 40px)', lineHeight: 1.12, margin: 0, letterSpacing: '-0.01em' }}>
              {content?.chapter.title ?? '…'}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, fontSize: 12.5, color: isDark ? '#8A857A' : 'var(--ink-3)' }}>
              <I.clock size={14} /> about {content?.chapter.estMinutes ?? '–'} min
            </div>
          </div>

          {(content?.paragraphs ?? []).map((para, p) => {
            const dimmed = M.dim && p !== focusPara;
            return (
              <p
                key={p}
                onMouseEnter={() => M.dim && setFocusPara(p)}
                style={{
                  fontFamily: M.font, fontSize: `${fsize * 20}px`,
                  lineHeight: M.leading + leadingAdj, letterSpacing: M.track,
                  textAlign: M.justify ? 'justify' : 'left', hyphens: M.justify ? 'auto' : 'none',
                  margin: '0 0 1.5em', color: 'inherit',
                  opacity: dimmed ? 0.32 : 1, transition: 'opacity 0.4s ease',
                }}
              >
                {para.sentences.map((sent, s) => {
                  const h = hlFor(p, s);
                  const isSel = sel && sel.p === p && sel.s === s;
                  return (
                    <span
                      key={s}
                      data-ps={`${p}-${s}`}
                      onClick={(e) => onSentenceTap(p, s, e)}
                      style={{
                        cursor: 'pointer', borderRadius: 3,
                        background: h
                          ? `color-mix(in srgb, var(--tag-${h.tag}) 22%, transparent)`
                          : isSel ? 'var(--hl)' : 'transparent',
                        boxShadow: h ? `inset 0 -0.5em 0 color-mix(in srgb, var(--tag-${h.tag}) 16%, transparent)` : 'none',
                        padding: '0.05em 0', transition: 'background 0.45s, box-shadow 0.45s',
                      }}
                    >
                      {sent}{' '}
                      {h && h.note ? (
                        <I.note size={13} style={{ verticalAlign: 'super', margin: '0 1px', color: `var(--tag-${h.tag})`, opacity: 0.8 }} />
                      ) : null}
                    </span>
                  );
                })}
              </p>
            );
          })}

          {content && (
            <div style={{ marginTop: 64, paddingTop: 32, borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'var(--line)'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
              <div className="eyebrow">End of chapter</div>
              <div style={{ fontFamily: 'var(--read)', fontSize: 19, maxWidth: 360, lineHeight: 1.4 }}>
                You marked {highlights.length} passage{highlights.length === 1 ? '' : 's'} here.
              </div>
              {nextChapter ? (
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(`/read/${bookId}/${nextChapter.no}`); }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 12, border: 'none', background: 'var(--accent)', color: 'var(--accent-ink)', fontSize: 14, fontWeight: 600 }}
                >
                  Next: {nextChapter.title} <I.arrowRight size={16} />
                </button>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); finishBook(); }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 12, border: 'none', background: 'var(--accent)', color: 'var(--accent-ink)', fontSize: 14, fontWeight: 600 }}
                >
                  Finish book <I.check size={16} />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── PASSAGE SELECTION BAR ── */}
      {sel && content && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed', left: '50%', transform: 'translateX(-50%)',
            top: Math.min(Math.max(70, sel.bottom + 12), window.innerHeight - 220),
            zIndex: 35, width: 'min(440px, calc(100% - 32px))',
            background: isDark ? '#21242A' : 'var(--surface)', color: isDark ? '#E6E2D8' : 'var(--ink)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'var(--line)'}`,
            borderRadius: 16, boxShadow: '0 16px 44px -14px rgba(0,0,0,0.5)',
            padding: 14, animation: 'groveScaleIn 0.18s both',
          }}
        >
          {!noteOpen ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="eyebrow">{hlFor(sel.p, sel.s) ? 'Highlighted' : 'Highlight color'}</span>
                <button onClick={closeSel} style={{ ...barBtn(), padding: 4 }}><I.close size={16} /></button>
              </div>
              <div style={{ display: 'flex', gap: 7 }}>
                {TAG_LIST.map(([t, label]) => {
                  const on = hlFor(sel.p, sel.s)?.tag === t;
                  return (
                    <button
                      key={t}
                      onClick={() => toggleHighlight(sel.p, sel.s, t)}
                      title={label}
                      style={{
                        flex: 1, height: 34, borderRadius: 9,
                        border: on ? `2px solid var(--tag-${t})` : `1px solid ${isDark ? 'rgba(255,255,255,0.14)' : 'var(--line-2)'}`,
                        background: on ? `color-mix(in srgb, var(--tag-${t}) 22%, transparent)` : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <span style={{ width: 13, height: 13, borderRadius: 8, background: `var(--tag-${t})` }} />
                      {on && <I.check size={13} style={{ marginLeft: 5, color: `var(--tag-${t})` }} />}
                    </button>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: 6, borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'var(--line)'}`, paddingTop: 10 }}>
                <button onClick={startNote} style={{ ...barBtn(), flex: 1, justifyContent: 'center' }}><I.note size={17} /> Note</button>
                {serverMode && <button onClick={makeCard} style={{ ...barBtn(), flex: 1, justifyContent: 'center' }}><I.cards size={17} /> Card</button>}
                <button onClick={doLookup} style={{ ...barBtn(), flex: 1, justifyContent: 'center' }}><I.book size={17} /> Look up</button>
                {serverMode && (
                  <button
                    onClick={() => {
                      openAI({ bookId, chapterNo, passage: content.paragraphs[sel.p]?.sentences[sel.s] });
                      closeSel();
                    }}
                    style={{ ...barBtn(), flex: 1, justifyContent: 'center' }}
                  >
                    <I.sparkle size={17} /> Ask
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div>
              <div className="eyebrow" style={{ marginBottom: 10 }}>Margin note</div>
              <textarea
                autoFocus
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder="What does this passage make you think?"
                style={{
                  width: '100%', minHeight: 84, resize: 'none',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.14)' : 'var(--line-2)'}`,
                  borderRadius: 10, padding: 12, background: isDark ? '#191C20' : 'var(--page)', color: 'inherit',
                  fontFamily: 'var(--read)', fontSize: 15, lineHeight: 1.5, outline: 'none',
                }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-end' }}>
                <button onClick={closeSel} style={barBtn()}>Cancel</button>
                <button onClick={saveNote} style={{ ...barBtn(), background: 'var(--accent)', color: 'var(--accent-ink)', padding: '8px 16px' }}>Save</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* LOOK UP SHEET */}
      {lookup && (
        <div
          onClick={(e) => { e.stopPropagation(); setLookup(null); }}
          style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(520px, 100%)', margin: 16, padding: 24, borderRadius: 18,
              background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--line)',
              boxShadow: '0 20px 60px -20px rgba(0,0,0,0.5)', animation: 'groveSheetUp 0.28s both',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span style={{ fontFamily: 'var(--read)', fontSize: 26 }}>{lookup.word}</span>
              {lookup.pos && <span style={{ fontSize: 12.5, color: 'var(--ink-3)', fontStyle: 'italic' }}>{lookup.pos}</span>}
            </div>
            <div style={{ fontFamily: 'var(--read)', fontSize: 16, lineHeight: 1.55, marginTop: 12, color: 'var(--ink-2)' }}>{lookup.def}</div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: 'calc(28px + env(safe-area-inset-bottom))',
            zIndex: 50, display: 'flex', alignItems: 'center', gap: 11, padding: '12px 18px', borderRadius: 30,
            background: isDark ? '#2A2E34' : 'var(--ink)', color: isDark ? '#E6E2D8' : 'var(--page)',
            boxShadow: '0 12px 36px -10px rgba(0,0,0,0.5)', animation: 'groveFade 0.3s both',
          }}
        >
          <span style={{ width: 26, height: 26, borderRadius: 8, background: 'var(--accent)', color: 'var(--accent-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
            <Glyph name={toast.icon} size={16} />
          </span>
          <span style={{ fontSize: 13.5, fontWeight: 500 }}>{toast.msg}</span>
        </div>
      )}

      {/* AI SUMMON */}
      {serverMode && <button
        onClick={(e) => { e.stopPropagation(); openAI({ bookId, chapterNo }); }}
        style={{
          position: 'fixed', right: 'max(24px, env(safe-area-inset-right))', bottom: 'calc(24px + env(safe-area-inset-bottom))',
          zIndex: 40, width: 52, height: 52, borderRadius: 26, border: 'none',
          background: 'var(--accent)', color: 'var(--accent-ink)',
          display: showChrome ? 'flex' : 'none', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 26px -8px color-mix(in srgb, var(--accent) 70%, black)',
          animation: 'groveScaleIn 0.3s both',
        }}
        title="Ask Grove"
      >
        <I.sparkle size={23} />
      </button>}
    </div>
  );
}

function ThreadView({ title, chapterNo, thread, busy, isDark }: { title: string; chapterNo: number; thread: { beats: string[]; summary: string } | null; busy: boolean; isDark: boolean }) {
  return (
    <div style={{ maxWidth: '40rem', margin: '0 auto', padding: '52px 24px 200px' }}>
      <div style={{ marginBottom: 36 }}>
        <div className="eyebrow" style={{ color: 'var(--accent)', marginBottom: 12 }}>Thread · Chapter {chapterNo}</div>
        <h1 style={{ fontFamily: 'var(--read)', fontWeight: 400, fontSize: 'clamp(26px, 4.5vw, 34px)', margin: 0, lineHeight: 1.15 }}>{title}</h1>
        <p style={{ fontSize: 14, color: isDark ? '#9A958A' : 'var(--ink-2)', marginTop: 12 }}>
          {busy ? 'Condensing the chapter with your AI companion…' : thread ? `The chapter in ${thread.beats.length} beats — about a 2-minute review.` : ''}
        </p>
      </div>
      {busy && (
        <div style={{ display: 'grid', gap: 18 }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ height: 22, borderRadius: 8, background: isDark ? 'rgba(255,255,255,0.07)' : 'var(--surface-2)', animation: `groveShimmer 1.4s ${i * 0.15}s infinite` }} />
          ))}
        </div>
      )}
      {thread && (
        <>
          <div style={{ position: 'relative', paddingLeft: 30 }}>
            <div style={{ position: 'absolute', left: 7, top: 6, bottom: 6, width: 2, background: isDark ? 'rgba(255,255,255,0.1)' : 'var(--line-2)' }} />
            {thread.beats.map((beat, i) => (
              <div key={i} style={{ position: 'relative', marginBottom: 26, animation: `groveFade 0.5s ${i * 0.05}s both` }}>
                <div style={{ position: 'absolute', left: -30, top: 4, width: 16, height: 16, borderRadius: 10, background: isDark ? '#15171A' : 'var(--page)', border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ width: 5, height: 5, borderRadius: 5, background: 'var(--accent)' }} />
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)', marginBottom: 5 }}>{String(i + 1).padStart(2, '0')}</div>
                <div style={{ fontFamily: 'var(--read)', fontSize: 18, lineHeight: 1.5 }}>{beat}</div>
              </div>
            ))}
          </div>
          {thread.summary && (
            <div style={{ marginTop: 40, paddingTop: 24, borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'var(--line)'}` }}>
              <div className="eyebrow" style={{ marginBottom: 12 }}>Summary</div>
              <p style={{ fontFamily: 'var(--read)', fontSize: 17, lineHeight: 1.6, margin: 0 }}>{thread.summary}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Stepper({ label, value, onMinus, onPlus, isDark }: { label: string; value: string; onMinus: () => void; onPlus: () => void; isDark: boolean }) {
  const stepBtn = {
    width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.14)' : 'var(--line-2)'}`, background: 'transparent', color: 'inherit',
  } as const;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <span style={{ fontSize: 13.5 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button onClick={onMinus} style={stepBtn}><I.minus size={16} /></button>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 12, minWidth: 48, textAlign: 'center' }}>{value}</span>
        <button onClick={onPlus} style={stepBtn}><I.plus size={16} /></button>
      </div>
    </div>
  );
}

const iconBtn = (on: boolean) => ({
  width: 38, height: 38, borderRadius: 10, border: 'none', flex: 'none',
  background: on ? 'color-mix(in srgb, var(--accent) 16%, transparent)' : 'transparent',
  color: on ? 'var(--accent)' : 'inherit',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
} as const);

const popover = (isDark: boolean) => ({
  margin: '0 auto', maxWidth: 460, marginTop: 10, padding: 16,
  background: isDark ? 'rgba(28,31,36,0.96)' : 'color-mix(in srgb, var(--surface) 97%, transparent)',
  backdropFilter: 'blur(14px)', borderRadius: 16,
  border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'var(--line)'}`,
  boxShadow: '0 16px 40px -16px rgba(0,0,0,0.4)',
  position: 'absolute' as const, left: 16, right: 16, zIndex: 28,
});

const barBtn = () => ({
  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 11px', borderRadius: 9,
  border: 'none', background: 'transparent', color: 'inherit', fontSize: 13, fontWeight: 500,
} as const);
