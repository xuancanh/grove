/** Study hub: Notes (thought layer), Cards (deck), Review (SM-2 session). */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../lib/api';
import type { Card, Highlight } from '../lib/types';
import { CARD_STATUS, Glyph, I, TagDot, TAGS } from '../components/icons';
import { Empty, ScreenHead, Toast, card as cardStyle, chip, linkBtn, primaryBtn, wrap } from '../components/ui';

const STUDY_TABS: [string, string, string][] = [
  ['notes', 'Notes', 'notes'],
  ['cards', 'Cards', 'cards'],
  ['review', 'Review', 'refresh'],
];

export default function Study() {
  const [tab, setTab] = useState('notes');
  return (
    <div>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: 'clamp(28px, 5vw, 64px) clamp(20px, 4vw, 48px) 0' }}>
        <div className="eyebrow" style={{ marginBottom: 14, color: 'var(--accent)' }}>Study</div>
        <div style={{ display: 'inline-flex', gap: 4, padding: 4, borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
          {STUDY_TABS.map(([k, l, ic]) => {
            const on = tab === k;
            return (
              <button
                key={k}
                onClick={() => setTab(k)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 9, border: 'none',
                  fontSize: 14, fontWeight: on ? 600 : 500, background: on ? 'var(--surface)' : 'transparent',
                  color: on ? 'var(--ink)' : 'var(--ink-2)', boxShadow: on ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
                }}
              >
                <Glyph name={ic} size={17} style={{ color: on ? 'var(--accent)' : 'var(--ink-3)' }} /> {l}
              </button>
            );
          })}
        </div>
      </div>
      {tab === 'notes' && <Notes />}
      {tab === 'cards' && <Cards />}
      {tab === 'review' && <Review />}
    </div>
  );
}

// ── Notes ──────────────────────────────────────────────────────────────────
function Notes() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<Highlight[]>([]);
  const [tagFilter, setTagFilter] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.fetchHighlights().then((n) => { setNotes(n); setLoaded(true); }).catch(() => setLoaded(true));
  }, []);

  const filtered = tagFilter ? notes.filter((n) => n.tag === tagFilter) : notes;

  return (
    <div className="grove-enter" style={{ ...wrap, paddingTop: 30 }}>
      <ScreenHead title="Your thought layer" sub="Every passage you've marked, across all your books." />
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        <button style={chip(!tagFilter)} onClick={() => setTagFilter('')}>All · {notes.length}</button>
        {Object.keys(TAGS).map((t) => (
          <button key={t} style={chip(tagFilter === t)} onClick={() => setTagFilter(tagFilter === t ? '' : t)}>
            {t} · {notes.filter((n) => n.tag === t).length}
          </button>
        ))}
      </div>
      {loaded && filtered.length === 0 ? (
        <Empty icon={<I.notes size={30} />} title="No notes yet" sub="Tap a sentence while reading to highlight it — your margins collect here." />
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          {filtered.map((n) => (
            <div key={n.id} className="row-hover" style={{ display: 'flex', gap: 16, padding: '18px 20px', borderRadius: 14, background: 'var(--surface)', border: '1px solid var(--line)' }}>
              <div style={{ width: 3, borderRadius: 3, background: `var(--tag-${n.tag})`, flex: 'none' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--read)', fontSize: 17, lineHeight: 1.45 }}>“{n.text}”</div>
                {n.note && <div style={{ fontSize: 13.5, color: 'var(--ink-2)', marginTop: 10, paddingLeft: 12, borderLeft: '2px solid var(--line-2)', lineHeight: 1.5 }}>{n.note}</div>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, fontSize: 11.5, color: 'var(--ink-3)', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><TagDot tag={n.tag} size={7} /> {n.tag}</span>
                  · <span>{n.bookTitle} · {n.chapterTitle}</span> ·
                  <button onClick={() => navigate(`/read/${n.bookId}/${n.chapterNo}`)} style={{ ...linkBtn, fontSize: 11.5 }}>
                    Go to passage <I.arrowRight size={12} />
                  </button>
                  <span style={{ flex: 1 }} />
                  <button
                    onClick={() => { api.deleteHighlight(n.id).then(() => setNotes((prev) => prev.filter((x) => x.id !== n.id))); }}
                    style={{ border: 'none', background: 'none', color: 'var(--ink-3)', padding: 2, display: 'flex' }}
                    title="Delete highlight"
                  >
                    <I.trash size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Cards ──────────────────────────────────────────────────────────────────
function Cards() {
  const [cards, setCards] = useState<Card[]>([]);
  const [open, setOpen] = useState<Card | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.fetchCards().then((c) => { setCards(c); setLoaded(true); }).catch(() => setLoaded(true));
  }, []);

  const due = cards.filter((c) => c.status === 'due' || c.status === 'new').length;

  return (
    <div className="grove-enter" style={{ ...wrap, paddingTop: 30 }}>
      <ScreenHead
        title="Recall cards"
        sub="Cards distilled from your highlights. Review them to keep what you read."
        right={due > 0 ? <span style={{ fontSize: 13.5, color: 'var(--accent)', fontWeight: 600 }}>{due} ready to review</span> : undefined}
      />
      {loaded && cards.length === 0 ? (
        <Empty icon={<I.cards size={30} />} title="No cards yet" sub="Make cards from passages in the reader, or generate them from your highlights on a book's page." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {cards.map((c) => {
            const st = CARD_STATUS[c.status];
            return (
              <button
                key={c.id}
                className="hover-lift"
                onClick={() => { setOpen(c); setRevealed(false); }}
                style={{ ...cardStyle, textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 12 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: `color-mix(in srgb, ${st.color} 14%, transparent)`, color: st.color }}>
                    <span style={{ width: 6, height: 6, borderRadius: 4, background: st.color }} /> {st.label}
                  </span>
                  <span style={{ flex: 1 }} />
                  <span style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--mono)' }}>
                    {c.intervalDays > 0 ? `${c.intervalDays}d` : '—'}
                  </span>
                </div>
                <div style={{ fontFamily: 'var(--read)', fontSize: 16.5, lineHeight: 1.4, fontWeight: 500 }}>{c.front}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 'auto' }}>{c.bookTitle}{c.chapterTitle ? ` · ${c.chapterTitle}` : ''}</div>
              </button>
            );
          })}
        </div>
      )}

      {open && (
        <div onClick={() => setOpen(null)} style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(0,0,0,0.36)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: 16, animation: 'groveFadeIn 0.22s both' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ marginTop: 'min(11vh, 86px)', width: 'min(540px, 100%)', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 20, boxShadow: '0 30px 80px -30px rgba(0,0,0,0.55)', animation: 'groveScaleIn 0.26s both', padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <span style={{ width: 30, height: 30, borderRadius: 9, background: 'color-mix(in srgb, var(--accent) 14%, transparent)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><I.cards size={18} /></span>
              <div style={{ flex: 1 }}>
                <div className="eyebrow">Recall card</div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 3 }}>{open.bookTitle}{open.chapterTitle ? ` · ${open.chapterTitle}` : ''}</div>
              </div>
              <button
                onClick={() => { api.deleteCard(open.id).then(() => { setCards((prev) => prev.filter((x) => x.id !== open.id)); setOpen(null); }); }}
                style={{ width: 34, height: 34, borderRadius: 9, border: 'none', background: 'var(--surface-2)', color: 'var(--ink-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Delete card"
              >
                <I.trash size={16} />
              </button>
              <button onClick={() => setOpen(null)} style={{ width: 34, height: 34, borderRadius: 9, border: 'none', background: 'var(--surface-2)', color: 'var(--ink-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <I.close size={19} />
              </button>
            </div>
            <div style={{ padding: 22, borderRadius: 14, background: 'var(--page)', border: '1px solid var(--line)' }}>
              <div className="eyebrow" style={{ marginBottom: 10 }}>Prompt</div>
              <div style={{ fontFamily: 'var(--read)', fontSize: 20, lineHeight: 1.4, fontWeight: 500 }}>{open.front}</div>
            </div>
            {revealed ? (
              <div className="grove-enter" style={{ marginTop: 12, padding: 22, borderRadius: 14, background: 'color-mix(in srgb, var(--accent) 7%, var(--surface))', border: '1px solid color-mix(in srgb, var(--accent) 22%, var(--line))' }}>
                <div className="eyebrow" style={{ marginBottom: 10 }}>Answer</div>
                <div style={{ fontFamily: 'var(--read)', fontSize: 18, lineHeight: 1.55 }}>{open.back}</div>
              </div>
            ) : (
              <button onClick={() => setRevealed(true)} style={{ width: '100%', marginTop: 12, padding: 18, borderRadius: 14, border: '1px dashed var(--line-2)', background: 'transparent', color: 'var(--ink-2)', fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <I.spark size={16} style={{ color: 'var(--accent)' }} /> Reveal answer
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Review session (SM-2) ──────────────────────────────────────────────────
const RATINGS: ['again' | 'hard' | 'good' | 'easy', string, string][] = [
  ['again', 'Again', 'var(--tag-beautiful)'],
  ['hard', 'Hard', 'var(--tag-question)'],
  ['good', 'Good', 'var(--tag-important)'],
  ['easy', 'Easy', 'var(--tag-idea)'],
];

function Review() {
  const [queue, setQueue] = useState<Card[]>([]);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [doneCount, setDoneCount] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    api.fetchCards().then((cards) => {
      setQueue(cards.filter((c) => c.status === 'due' || c.status === 'new' || c.status === 'learning'));
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  const current = queue[idx];

  const rate = async (rating: 'again' | 'hard' | 'good' | 'easy') => {
    if (!current) return;
    api.reviewCard(current.id, rating).catch(() => {});
    setDoneCount((d) => d + 1);
    setRevealed(false);
    setIdx((i) => i + 1);
    if (rating === 'again') setToast('Scheduled for tomorrow');
    setTimeout(() => setToast(''), 1500);
  };

  return (
    <div className="grove-enter" style={{ ...wrap, paddingTop: 30, maxWidth: 720 }}>
      <ScreenHead
        title="Review"
        sub={loaded && queue.length === 0 ? undefined : 'Rate each card by how easily it came back to you. Spacing does the rest.'}
      />
      {loaded && queue.length === 0 ? (
        <Empty icon={<I.check size={30} />} title="Nothing due" sub="Cards you create will queue here when it's time to review them." />
      ) : !current ? (
        <Empty
          icon={<I.check size={30} />}
          title={`Session complete — ${doneCount} card${doneCount === 1 ? '' : 's'} reviewed`}
          sub="Come back tomorrow; the schedule adapts to each answer."
        />
      ) : (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <div style={{ flex: 1, height: 5, borderRadius: 4, background: 'var(--surface-2)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(idx / queue.length) * 100}%`, background: 'var(--accent)', transition: 'width 0.3s' }} />
            </div>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-3)' }}>{idx + 1} / {queue.length}</span>
          </div>

          <div style={{ ...cardStyle, padding: 30 }}>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 14 }}>{current.bookTitle}{current.chapterTitle ? ` · ${current.chapterTitle}` : ''}</div>
            <div style={{ fontFamily: 'var(--read)', fontSize: 23, lineHeight: 1.4, fontWeight: 500 }}>{current.front}</div>
            {revealed ? (
              <div className="grove-enter" style={{ marginTop: 22, paddingTop: 22, borderTop: '1px solid var(--line)' }}>
                <div className="eyebrow" style={{ marginBottom: 10 }}>Answer</div>
                <div style={{ fontFamily: 'var(--read)', fontSize: 18, lineHeight: 1.55 }}>{current.back}</div>
                {current.source && (
                  <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 14, fontStyle: 'italic' }}>“{current.source}”</div>
                )}
              </div>
            ) : null}
          </div>

          {revealed ? (
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              {RATINGS.map(([value, label, color]) => (
                <button
                  key={value}
                  onClick={() => rate(value)}
                  style={{
                    flex: 1, padding: '13px 0', borderRadius: 12, fontSize: 14, fontWeight: 600,
                    border: `1px solid color-mix(in srgb, ${color} 40%, var(--line))`,
                    background: `color-mix(in srgb, ${color} 12%, transparent)`, color,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : (
            <button onClick={() => setRevealed(true)} style={{ ...primaryBtn, width: '100%', justifyContent: 'center', marginTop: 18 }}>
              Reveal answer
            </button>
          )}
        </div>
      )}
      {toast && <Toast message={toast} />}
    </div>
  );
}
