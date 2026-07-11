// lume-home.jsx — Library, Browse, Memory → window
const { useState: useStateH, useMemo: useMemoH } = React;

// Shared screen header
function ScreenHead({ eyebrow, title, sub, right }) {
  return (
    <div className="lume-head" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20, marginBottom: 30, flexWrap: "wrap" }}>
      <div style={{ minWidth: 0 }}>
        {eyebrow && <div className="eyebrow" style={{ marginBottom: 10 }}>{eyebrow}</div>}
        <h1 style={{ fontFamily: "var(--read)", fontWeight: 400, fontSize: "clamp(28px, 7vw, 44px)", margin: 0, letterSpacing: "-0.015em", lineHeight: 1.05 }}>{title}</h1>
        {sub && <p style={{ fontSize: 14.5, color: "var(--ink-2)", margin: "12px 0 0", maxWidth: 520, lineHeight: 1.5 }}>{sub}</p>}
      </div>
      {right && <div className="lume-head-right">{right}</div>}
    </div>
  );
}

// ══ LIBRARY ════════════════════════════════════════════════════════
function Library({ onOpenBook, onOpenMemory, onGoto }) {
  const cont = window.WALDEN;
  const reading = window.BOOKS.filter(b => b.progress > 0 && b.progress < 1);
  const resurfaced = window.NOTES[6]; // Gatsby last line
  const greeting = (() => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"; })();

  return (
    <div className="lume-enter" style={wrap}>
      <ScreenHead eyebrow={greeting} title="Your reading room"
        sub="Pick up where you left off, keep your rhythm, and revisit what moved you." />

      {/* Continue hero */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 18, marginBottom: 18 }}>
        <div onClick={() => onOpenBook(cont)} className="hover-lift lume-hero" style={{
          display: "flex", gap: 26, padding: 26, borderRadius: 20, cursor: "pointer",
          background: "var(--surface)", border: "1px solid var(--line)", alignItems: "center",
          position: "relative", overflow: "hidden",
        }}>
          <Cover book={cont} w={120} h={180} radius={6} className="lume-hero-cover" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="eyebrow" style={{ color: "var(--accent)", marginBottom: 10 }}>Continue reading</div>
            <div style={{ fontFamily: "var(--read)", fontSize: "clamp(22px, 6vw, 27px)", lineHeight: 1.12, marginBottom: 4 }}>{cont.title}</div>
            <div style={{ fontSize: 14, color: "var(--ink-2)", marginBottom: 18 }}>{cont.author} · Ch. {cont.chapterNo}, {cont.chapterTitle}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
              <div style={{ flex: 1, maxWidth: 320, height: 5, borderRadius: 4, background: "var(--surface-2)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${cont.progress*100}%`, background: "var(--accent)" }} />
              </div>
              <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink-3)" }}>{Math.round(cont.progress*100)}%</span>
            </div>
            <div className="lume-hero-actions" style={{ display: "flex", gap: 10 }}>
              <button onClick={(e) => { e.stopPropagation(); onOpenBook(cont); }} style={primaryBtn}>Resume · {cont.minutesLeft} min left</button>
              <button onClick={(e) => { e.stopPropagation(); onOpenMemory(cont); }} style={secondaryBtn}>Memory</button>
            </div>
          </div>
        </div>
      </div>

      {/* Rhythm + resurfaced row */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 18, marginBottom: 40 }} className="lume-cols">
        <RhythmCard />
        <ResurfacedCard note={resurfaced} onGoto={onGoto} />
      </div>

      {/* Collection */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 20 }}>
        <h2 style={sectionH}>Your collection</h2>
        <button onClick={() => onGoto("browse")} style={linkBtn}>Browse all <I.arrowRight size={15} /></button>
      </div>
      <div style={shelfGrid}>
        {window.BOOKS.map(b => <ShelfBook key={b.id} book={b} onOpen={onOpenBook} />)}
      </div>
    </div>
  );
}

function RhythmCard() {
  const data = window.RHYTHM;
  const max = Math.max(...data.map(d => d.min), 1);
  const total = data.reduce((a, d) => a + d.min, 0);
  const streak = 4;
  const goal = (window.READING_GOAL && window.READING_GOAL.dailyMinutes) || 30;
  const todayMin = data[data.length - 1].min;
  const pct = Math.min(1, todayMin / goal);
  const R = 22, C = 2 * Math.PI * R;
  return (
    <div style={card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>This week's rhythm</div>
          <div style={{ fontFamily: "var(--read)", fontSize: 28 }}>{Math.floor(total/60)}h {total%60}m</div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--accent)", fontSize: 12.5, fontWeight: 600, marginTop: 6 }}>
            <I.flame size={14} /> {streak}-day streak
          </div>
        </div>
        {/* daily goal ring */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: pct >= 1 ? "var(--tag-idea)" : "var(--ink-2)" }}>{pct >= 1 ? "Goal met" : "Today's goal"}</div>
            <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>{todayMin} / {goal} min</div>
          </div>
          <div style={{ position: "relative", width: 54, height: 54 }}>
            <svg width="54" height="54" viewBox="0 0 54 54">
              <circle cx="27" cy="27" r={R} fill="none" stroke="var(--surface-2)" strokeWidth="5" />
              <circle cx="27" cy="27" r={R} fill="none" stroke={pct >= 1 ? "var(--tag-idea)" : "var(--accent)"} strokeWidth="5" strokeLinecap="round"
                strokeDasharray={C} strokeDashoffset={C * (1 - pct)} transform="rotate(-90 27 27)" />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)" }}>
              {pct >= 1 ? <I.check size={20} style={{ color: "var(--tag-idea)" }} /> : <I.flame size={18} />}
            </div>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 80 }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ width: "100%", maxWidth: 30, height: `${Math.max(4, (d.min/max)*64)}px`, borderRadius: 5,
              background: d.min === 0 ? "var(--surface-2)" : (i === data.length-1 ? "var(--accent)" : "color-mix(in srgb, var(--accent) 42%, var(--surface-2))") }} />
            <span style={{ fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--mono)" }}>{d.day}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResurfacedCard({ note, onGoto }) {
  return (
    <div style={{ ...card, display: "flex", flexDirection: "column" }}>
      <div className="eyebrow" style={{ marginBottom: 16 }}>Resurfaced from your margins</div>
      <I.quote size={26} style={{ color: "var(--accent)", opacity: 0.5, marginBottom: 8 }} />
      <div style={{ fontFamily: "var(--read)", fontSize: 19, lineHeight: 1.42, flex: 1 }}>"{note.text}"</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
        <span style={{ fontSize: 12.5, color: "var(--ink-3)" }}>{note.book} · {note.author}</span>
        <button onClick={() => onGoto("notes")} style={linkBtn}>All notes <I.arrowRight size={14} /></button>
      </div>
    </div>
  );
}

function ShelfBook({ book, onOpen }) {
  const done = book.progress >= 1;
  return (
    <button onClick={() => onOpen(book)} className="hover-lift" style={{
      background: "none", border: "none", padding: 0, textAlign: "left", display: "flex", flexDirection: "column", gap: 12,
    }}>
      <div style={{ position: "relative" }}>
        <Cover book={book} w="100%" h={210} radius={6} style={{ width: "100%" }} />
        {book.progress > 0 && !done && (
          <div style={{ position: "absolute", left: 8, right: 8, bottom: 8, height: 4, borderRadius: 3, background: "rgba(0,0,0,0.35)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${book.progress*100}%`, background: book.cover.accent }} />
          </div>
        )}
        {done && <span style={{ position: "absolute", top: 8, right: 8, background: "var(--accent)", color: "var(--accent-ink)", borderRadius: 20, padding: "3px 9px", fontSize: 10.5, fontWeight: 600, fontFamily: "var(--ui)" }}>Finished</span>}
      </div>
      <div>
        <div style={{ fontFamily: "var(--read)", fontSize: 15.5, lineHeight: 1.2 }}>{book.title}</div>
        <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 3 }}>{book.author}</div>
      </div>
    </button>
  );
}

// ══ BROWSE — now lives in lume-browse.jsx (richer organization model) ══

// ══ MEMORY VIEW ════════════════════════════════════════════════════
function Memory({ book, onBack, onOpenBook }) {
  const b = book || window.WALDEN;
  const notes = window.NOTES.filter(n => n.book === b.title);
  const hl = b.highlights || [];
  const tagCounts = {};
  (notes.length ? notes : []).forEach(n => tagCounts[n.tag] = (tagCounts[n.tag]||0)+1);

  return (
    <div className="lume-enter" style={wrap}>
      <button onClick={onBack} style={{ ...linkBtn, marginBottom: 22 }}><I.back size={16} /> Back</button>

      <div className="lume-mem-head" style={{ display: "flex", gap: 26, alignItems: "flex-end", marginBottom: 36, flexWrap: "wrap" }}>
        <Cover book={b} w={128} h={192} radius={6} className="lume-mem-cover" />
        <div style={{ minWidth: 0 }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Memory</div>
          <h1 style={{ fontFamily: "var(--read)", fontWeight: 400, fontSize: "clamp(28px, 7vw, 46px)", margin: 0, lineHeight: 1.05 }}>{b.title}</h1>
          <div style={{ fontSize: 15, color: "var(--ink-2)", marginTop: 10 }}>{b.author} · {b.year < 0 ? `${-b.year} BC` : b.year}</div>
          <div className="lume-mem-stats" style={{ display: "flex", gap: 28, marginTop: 22, flexWrap: "wrap" }}>
            <Stat n={`${Math.round((b.progress||0)*100)}%`} l="Read" />
            <Stat n={b.marked || hl.length} l="Passages marked" />
            <Stat n={notes.filter(n=>n.note).length} l="Margin notes" />
          </div>
        </div>
      </div>

      {/* tag distribution */}
      <div style={{ ...card, marginBottom: 26 }}>
        <div className="eyebrow" style={{ marginBottom: 16 }}>What caught your attention</div>
        <div style={{ display: "flex", gap: 8, height: 12, borderRadius: 8, overflow: "hidden", marginBottom: 16 }}>
          {Object.entries(tagCounts).map(([t, c]) => (
            <div key={t} style={{ flex: c, background: `var(--tag-${t})`, opacity: 0.85 }} title={`${t}: ${c}`} />
          ))}
        </div>
        <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
          {Object.entries(tagCounts).map(([t, c]) => (
            <span key={t} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: "var(--ink-2)" }}>
              <TagDot tag={t} /> {t} · {c}
            </span>
          ))}
        </div>
      </div>

      {/* marked passages timeline */}
      <h2 style={{ ...sectionH, marginBottom: 18 }}>Passages you saved</h2>
      <div style={{ display: "grid", gap: 14, marginBottom: 30 }}>
        {notes.map(n => (
          <div key={n.id} style={{ display: "flex", gap: 16, padding: "18px 20px", borderRadius: 14, background: "var(--surface)", border: "1px solid var(--line)" }}>
            <div style={{ width: 3, borderRadius: 3, background: `var(--tag-${n.tag})`, flex: "none" }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "var(--read)", fontSize: 17, lineHeight: 1.45 }}>"{n.text}"</div>
              {n.note && <div style={{ fontSize: 13.5, color: "var(--ink-2)", marginTop: 10, paddingLeft: 12, borderLeft: "2px solid var(--line-2)", lineHeight: 1.5 }}>{n.note}</div>}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, fontSize: 11.5, color: "var(--ink-3)" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}><TagDot tag={n.tag} size={7} /> {n.tag}</span>
                · <span>{n.chapter}</span> · <span>{n.date}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button onClick={() => onOpenBook(b)} style={primaryBtn}>Resume reading <I.arrowRight size={16} /></button>
    </div>
  );
}

const Stat = ({ n, l }) => (
  <div>
    <div style={{ fontFamily: "var(--read)", fontSize: 26, lineHeight: 1 }}>{n}</div>
    <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 6, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "var(--mono)" }}>{l}</div>
  </div>
);

// shared styles
const wrap = { maxWidth: 1080, margin: "0 auto", padding: "clamp(28px, 5vw, 64px) clamp(20px, 4vw, 48px) 120px" };
const card = { padding: 24, borderRadius: 18, background: "var(--surface)", border: "1px solid var(--line)" };
const sectionH = { fontFamily: "var(--read)", fontWeight: 400, fontSize: 22, margin: 0 };
const shelfGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 28 };
const primaryBtn = { display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 20px", borderRadius: 12, border: "none", background: "var(--accent)", color: "var(--accent-ink)", fontSize: 14, fontWeight: 600, whiteSpace: "nowrap" };
const secondaryBtn = { display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 18px", borderRadius: 12, border: "1px solid var(--line-2)", background: "transparent", color: "var(--ink)", fontSize: 14, fontWeight: 500 };
const linkBtn = { display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "var(--accent)", fontSize: 13.5, fontWeight: 600, padding: 0 };
const chip = (on) => ({ padding: "8px 15px", borderRadius: 30, border: `1px solid ${on ? "var(--accent)" : "var(--line-2)"}`, background: on ? "var(--accent)" : "transparent", color: on ? "var(--accent-ink)" : "var(--ink-2)", fontSize: 13, fontWeight: 500 });

Object.assign(window, { Library, Memory, ScreenHead, lumeStyles: { wrap, card, sectionH, primaryBtn, secondaryBtn, linkBtn, chip } });
