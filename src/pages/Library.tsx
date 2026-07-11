/** Library home: continue-reading hero, rhythm + resurfaced cards, shelf grid. */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../lib/store';
import { fetchHighlights, fetchRhythm } from '../lib/api';
import type { Highlight, LibraryBook, Rhythm } from '../lib/types';
import { Cover, Glyph, I } from '../components/icons';
import { ScreenHead, wrap, card, sectionH, shelfGrid, primaryBtn, secondaryBtn, linkBtn, Empty } from '../components/ui';

export default function Library() {
  const { library, settings } = useStore();
  const navigate = useNavigate();
  const [rhythm, setRhythm] = useState<Rhythm | null>(null);
  const [notes, setNotes] = useState<Highlight[]>([]);

  useEffect(() => {
    fetchRhythm().then(setRhythm).catch(() => {});
    fetchHighlights().then(setNotes).catch(() => {});
  }, []);

  const cont = useMemo(() => {
    const reading = library.books.filter((b) => b.status === 'reading');
    reading.sort((a, b) => (b.lastReadAt ?? '').localeCompare(a.lastReadAt ?? ''));
    return reading[0] ?? null;
  }, [library.books]);

  const resurfaced = useMemo(() => {
    if (notes.length === 0) return null;
    return notes[Math.floor(Math.random() * notes.length)];
  }, [notes]);

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  })();

  return (
    <div className="grove-enter" style={wrap}>
      <ScreenHead
        eyebrow={greeting}
        title="Your reading room"
        sub="Pick up where you left off, keep your rhythm, and revisit what moved you."
      />

      {cont ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 18, marginBottom: 18 }}>
          <div
            onClick={() => navigate(`/book/${cont.id}`)}
            className="hover-lift grove-hero"
            style={{
              display: 'flex', gap: 26, padding: 26, borderRadius: 20, cursor: 'pointer',
              background: 'var(--surface)', border: '1px solid var(--line)', alignItems: 'center',
              position: 'relative', overflow: 'hidden',
            }}
          >
            <Cover book={cont} w={120} h={180} radius={6} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="eyebrow" style={{ color: 'var(--accent)', marginBottom: 10 }}>Continue reading</div>
              <div style={{ fontFamily: 'var(--read)', fontSize: 'clamp(22px, 6vw, 27px)', lineHeight: 1.12, marginBottom: 4 }}>{cont.title}</div>
              <div style={{ fontSize: 14, color: 'var(--ink-2)', marginBottom: 18 }}>
                {cont.author} · Chapter {cont.currentChapter} of {cont.chapterCount}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                <div style={{ flex: 1, maxWidth: 320, height: 5, borderRadius: 4, background: 'var(--surface-2)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${cont.progress * 100}%`, background: 'var(--accent)' }} />
                </div>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-3)' }}>{Math.round(cont.progress * 100)}%</span>
              </div>
              <div className="grove-hero-actions" style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(`/read/${cont.id}/${cont.currentChapter}`); }}
                  style={primaryBtn}
                >
                  Resume{cont.minutesLeft ? ` · ${cont.minutesLeft} min left` : ''}
                </button>
                <button onClick={(e) => { e.stopPropagation(); navigate(`/book/${cont.id}`); }} style={secondaryBtn}>
                  Memory
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : library.books.length === 0 ? (
        <div style={{ marginBottom: 18 }}>
          <Empty
            icon={<I.library size={30} />}
            title="Your library is empty"
            sub="Add public-domain classics from Discover, or upload your own book."
            action={<button style={primaryBtn} onClick={() => navigate('/discover')}>Discover books <I.arrowRight size={16} /></button>}
          />
        </div>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 18, marginBottom: 40 }} className="grove-cols">
        <RhythmCard rhythm={rhythm} goal={settings.dailyGoalMinutes} />
        <ResurfacedCard note={resurfaced} onGoto={() => navigate('/study')} />
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={sectionH}>Your collection</h2>
        <button onClick={() => navigate('/browse')} style={linkBtn}>Browse all <I.arrowRight size={15} /></button>
      </div>
      <div style={shelfGrid}>
        {library.books.map((b) => (
          <ShelfBook key={b.id} book={b} onOpen={() => navigate(`/book/${b.id}`)} />
        ))}
      </div>
    </div>
  );
}

function RhythmCard({ rhythm, goal }: { rhythm: Rhythm | null; goal: number }) {
  const data = rhythm?.week ?? Array.from({ length: 7 }, (_, i) => ({ day: 'MTWTFSS'[i], min: 0 }));
  const max = Math.max(...data.map((d) => d.min), 1);
  const total = data.reduce((a, d) => a + d.min, 0);
  const todayMin = rhythm?.todayMinutes ?? 0;
  const streak = (() => {
    let s = 0;
    for (let i = data.length - 1; i >= 0; i--) {
      if (data[i].min > 0) s++;
      else if (i < data.length - 1) break;
    }
    return s;
  })();
  const pct = Math.min(1, todayMin / Math.max(1, goal));
  const R = 22;
  const C = 2 * Math.PI * R;

  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>This week's rhythm</div>
          <div style={{ fontFamily: 'var(--read)', fontSize: 28 }}>{Math.floor(total / 60)}h {total % 60}m</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--accent)', fontSize: 12.5, fontWeight: 600, marginTop: 6 }}>
            <I.flame size={14} /> {streak}-day streak
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: pct >= 1 ? 'var(--tag-idea)' : 'var(--ink-2)' }}>
              {pct >= 1 ? 'Goal met' : "Today's goal"}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2 }}>{todayMin} / {goal} min</div>
          </div>
          <div style={{ position: 'relative', width: 54, height: 54 }}>
            <svg width="54" height="54" viewBox="0 0 54 54">
              <circle cx="27" cy="27" r={R} fill="none" stroke="var(--surface-2)" strokeWidth="5" />
              <circle
                cx="27" cy="27" r={R} fill="none"
                stroke={pct >= 1 ? 'var(--tag-idea)' : 'var(--accent)'} strokeWidth="5" strokeLinecap="round"
                strokeDasharray={C} strokeDashoffset={C * (1 - pct)} transform="rotate(-90 27 27)"
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
              {pct >= 1 ? <Glyph name="check" size={20} style={{ color: 'var(--tag-idea)' }} /> : <I.flame size={18} />}
            </div>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 80 }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: '100%', maxWidth: 30, height: `${Math.max(4, (d.min / max) * 64)}px`, borderRadius: 5,
                background: d.min === 0 ? 'var(--surface-2)' : i === data.length - 1 ? 'var(--accent)' : 'color-mix(in srgb, var(--accent) 42%, var(--surface-2))',
              }}
            />
            <span style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--mono)' }}>{d.day}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResurfacedCard({ note, onGoto }: { note: Highlight | null; onGoto: () => void }) {
  return (
    <div style={{ ...card, display: 'flex', flexDirection: 'column' }}>
      <div className="eyebrow" style={{ marginBottom: 16 }}>Resurfaced from your margins</div>
      <I.quote size={26} style={{ color: 'var(--accent)', opacity: 0.5, marginBottom: 8 }} />
      <div style={{ fontFamily: 'var(--read)', fontSize: 19, lineHeight: 1.42, flex: 1 }}>
        {note ? `“${note.text}”` : 'Highlights you make while reading will resurface here.'}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
        <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>{note ? `${note.bookTitle} · ${note.bookAuthor}` : '—'}</span>
        <button onClick={onGoto} style={linkBtn}>All notes <I.arrowRight size={14} /></button>
      </div>
    </div>
  );
}

function ShelfBook({ book, onOpen }: { book: LibraryBook; onOpen: () => void }) {
  const done = book.status === 'finished' || book.progress >= 1;
  return (
    <button onClick={onOpen} className="hover-lift" style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ position: 'relative', width: '100%' }}>
        <div style={{ width: '100%' }}>
          <CoverFluid book={book} />
        </div>
        {book.progress > 0 && !done && (
          <div style={{ position: 'absolute', left: 8, right: 8, bottom: 8, height: 4, borderRadius: 3, background: 'rgba(0,0,0,0.35)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${book.progress * 100}%`, background: book.coverAccent }} />
          </div>
        )}
        {done && (
          <span style={{ position: 'absolute', top: 8, right: 8, background: 'var(--accent)', color: 'var(--accent-ink)', borderRadius: 20, padding: '3px 9px', fontSize: 10.5, fontWeight: 600 }}>
            Finished
          </span>
        )}
      </div>
      <div>
        <div style={{ fontFamily: 'var(--read)', fontSize: 15.5, lineHeight: 1.2 }}>{book.title}</div>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 3 }}>{book.author}</div>
      </div>
    </button>
  );
}

/** Full-width cover for the shelf grid. */
function CoverFluid({ book }: { book: LibraryBook }) {
  return (
    <div
      style={{
        width: '100%', height: 210, borderRadius: 6, background: book.coverBg, color: book.coverFg,
        position: 'relative', overflow: 'hidden',
        boxShadow: '0 1px 0 rgba(0,0,0,0.04), 0 8px 22px -10px rgba(0,0,0,0.45)',
      }}
    >
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: 'rgba(255,255,255,0.12)' }} />
      <div style={{ position: 'absolute', left: 5, top: 0, bottom: 0, width: 1, background: 'rgba(0,0,0,0.18)' }} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '20px 16px 16px 20px' }}>
        <div style={{ fontFamily: "'Newsreader', serif", fontWeight: 500, lineHeight: 1.08, fontSize: 18 }}>{book.title}</div>
        <div>
          <div style={{ width: 44, height: 2, background: book.coverAccent, marginBottom: 7, opacity: 0.9 }} />
          <div style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 10, opacity: 0.78, letterSpacing: '0.02em', textTransform: 'uppercase' }}>{book.author}</div>
        </div>
      </div>
    </div>
  );
}
