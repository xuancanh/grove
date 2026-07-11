// lume-bookpage.jsx — per-book landing page → window.BookPage
const { useState: useStateBP, useMemo: useMemoBP } = React;

const BP_STATUS = {
  read:    { label: "Read",    color: "var(--tag-idea)" },
  reading: { label: "Reading", color: "var(--accent)" },
  unread:  { label: "Unread",  color: "var(--ink-3)" },
};

function BookPage({ book, onBack, onRead, onOpenMemory, openAI, onOpenSource }) {
  const S = window.lumeStyles;
  const [tab, setTab] = useStateBP("contents");
  const [asking, setAsking] = useStateBP(false);
  const [selNote, setSelNote] = useStateBP(null);
  const [selCard, setSelCard] = useStateBP(null);

  const notes = window.notesForBook(book.title);
  const cards = window.cardsForBook(book.title);
  const chapters = window.chaptersFor(book);
  const colls = window.COLLECTIONS.filter(c => (book.coll || []).includes(c.id));
  const started = (book.progress || 0) > 0;
  const finished = (book.progress || 0) >= 1;

  const tabs = [
    ["contents", "Contents", chapters.length],
    ["notes", "Notes", notes.length],
    ["cards", "Cards", cards.length],
  ];

  return (
    <div className="lume-enter" style={{ ...S.wrap, maxWidth: 1080 }}>
      <button onClick={onBack} style={{ ...S.linkBtn, marginBottom: 24 }}><I.back size={16} /> Library</button>

      {/* ── HERO ────────────────────────────────────────────── */}
      <div className="bp-hero" style={{ display: "flex", gap: 34, marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "none" }}>
          <Cover book={book} w={168} h={252} radius={8} />
          {finished && <span style={{ position: "absolute", top: 10, right: 10, background: "var(--accent)", color: "var(--accent-ink)", borderRadius: 20, padding: "4px 11px", fontSize: 11, fontWeight: 600 }}>Finished</span>}
        </div>

        <div style={{ flex: 1, minWidth: 260, display: "flex", flexDirection: "column" }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>{book.genre} · {book.year < 0 ? `${-book.year} BC` : book.year}</div>
          <h1 style={{ fontFamily: "var(--read)", fontWeight: 400, fontSize: "clamp(30px, 5vw, 48px)", margin: 0, lineHeight: 1.04, letterSpacing: "-0.015em" }}>{book.title}</h1>
          {book.subtitle && <div style={{ fontFamily: "var(--read)", fontStyle: "italic", fontSize: 18, color: "var(--ink-2)", marginTop: 6 }}>{book.subtitle}</div>}
          <div style={{ fontSize: 15.5, color: "var(--ink-2)", marginTop: 10 }}>{book.author}</div>

          {/* progress line */}
          {started && !finished && (
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 22, maxWidth: 380 }}>
              <div style={{ flex: 1, height: 5, borderRadius: 4, background: "var(--surface-2)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${book.progress*100}%`, background: "var(--accent)" }} />
              </div>
              <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink-3)" }}>{Math.round(book.progress*100)}%</span>
            </div>
          )}

          {/* meta stats */}
          <div style={{ display: "flex", gap: 26, marginTop: 22, flexWrap: "wrap" }}>
            <Stat n={notes.length} l="Notes" />
            <Stat n={cards.length} l="Cards" />
            <Stat n={chapters.length} l="Chapters" />
            {started && !finished && <Stat n={`${book.minutesLeft}m`} l="Left" />}
          </div>

          {/* actions */}
          <div style={{ display: "flex", gap: 10, marginTop: 26, flexWrap: "wrap" }}>
            <button onClick={() => onRead(book)} style={{ ...S.primaryBtn, padding: "13px 22px", fontSize: 15 }}>
              <I.book size={18} /> {finished ? "Read again" : started ? `Resume · ${book.minutesLeft} min left` : "Start reading"}
            </button>
            <button onClick={() => setAsking(true)} style={{ ...S.secondaryBtn, padding: "13px 18px", fontSize: 14.5 }}>
              <I.sparkle size={17} /> Ask this book
            </button>
            {started && (
              <button onClick={() => onOpenMemory(book)} style={{ ...S.secondaryBtn, padding: "13px 18px", fontSize: 14.5 }}>
                <I.memory size={17} /> Memory
              </button>
            )}
          </div>

          {colls.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 22, flexWrap: "wrap" }}>
              <span className="eyebrow">In</span>
              {colls.map(c => (
                <span key={c.id} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 12px", borderRadius: 20, background: "var(--surface)", border: "1px solid var(--line)", fontSize: 12.5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 5, background: c.color }} /> {c.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── AI TOOLS ────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, margin: "30px 0 36px" }}>
        {[
          ["Summarise", "A prose digest of the book", "align", () => openAI({ tab: "summary" })],
          ["Thread", "Key beats, scannable", "thread", () => openAI({ tab: "thread" })],
          ["Make cards", "Recall prompts from highlights", "cards", () => openAI({ tab: "cards" })],
          ["Ask", "Question anything in the book", "ask", () => setAsking(true)],
        ].map(([title, sub, icon, fn]) => (
          <button key={title} onClick={fn} className="hover-lift" style={{
            display: "flex", flexDirection: "column", gap: 12, padding: "18px 18px", borderRadius: 16, textAlign: "left",
            background: "var(--surface)", border: "1px solid var(--line)", color: "var(--ink)",
          }}>
            <span style={{ width: 40, height: 40, borderRadius: 11, background: "color-mix(in srgb, var(--accent) 12%, transparent)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}><Glyph name={icon} size={20} /></span>
            <span>
              <span style={{ display: "block", fontSize: 14.5, fontWeight: 600 }}>{title}</span>
              <span style={{ display: "block", fontSize: 12, color: "var(--ink-3)", marginTop: 3, lineHeight: 1.4 }}>{sub}</span>
            </span>
          </button>
        ))}
      </div>

      {/* ── TABS ────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--line)", marginBottom: 26 }}>
        {tabs.map(([k, label, count]) => {
          const on = tab === k;
          return (
            <button key={k} onClick={() => setTab(k)} style={{
              position: "relative", display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 16px",
              border: "none", background: "transparent", color: on ? "var(--ink)" : "var(--ink-3)", fontSize: 14.5, fontWeight: on ? 600 : 500,
            }}>
              {label} <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, opacity: 0.7 }}>{count}</span>
              {on && <span style={{ position: "absolute", left: 12, right: 12, bottom: -1, height: 2, borderRadius: 2, background: "var(--accent)" }} />}
            </button>
          );
        })}
      </div>

      {tab === "contents" && <Contents book={book} chapters={chapters} onRead={onRead} />}
      {tab === "notes" && <BookNotes notes={notes} onPick={setSelNote} />}
      {tab === "cards" && <BookCards cards={cards} onPick={setSelCard} />}

      <window.NoteModal note={selNote} onClose={() => setSelNote(null)} onOpenSource={onOpenSource} />
      <window.CardModal card={selCard} onClose={() => setSelCard(null)} onOpenSource={onOpenSource} />

      {asking && (
        <window.CollectionAsk title={book.title} scope="book" books={[book]} notes={notes}
          onClose={() => setAsking(false)} />
      )}
    </div>
  );
}

// ── Contents (table of contents) ─────────────────────────────────
function Contents({ book, chapters, onRead }) {
  return (
    <div style={{ display: "grid", gap: 2 }}>
      {chapters.map((ch, i) => {
        const st = BP_STATUS[ch.status];
        const active = ch.status === "reading";
        return (
          <button key={ch.no} onClick={() => onRead(book)} className="row-hover" style={{
            display: "flex", alignItems: "center", gap: 18, padding: "16px 14px", borderRadius: 12,
            border: "none", borderBottom: i < chapters.length-1 ? "1px solid var(--line)" : "none",
            background: active ? "color-mix(in srgb, var(--accent) 7%, transparent)" : "transparent", color: "var(--ink)", textAlign: "left", width: "100%",
          }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: 13, color: active ? "var(--accent)" : "var(--ink-3)", width: 26, flex: "none" }}>{String(ch.no).padStart(2,"0")}</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontFamily: "var(--read)", fontSize: 17, lineHeight: 1.25, fontWeight: active ? 500 : 400 }}>{ch.title}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 5, fontSize: 12, color: "var(--ink-3)" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><I.clock size={13} /> {ch.est}</span>
                {ch.marked > 0 && <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><I.highlight size={13} /> {ch.marked}</span>}
              </span>
            </span>
            {active
              ? <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "var(--accent)" }}><span style={{ width: 6, height: 6, borderRadius: 4, background: "var(--accent)" }} /> Reading</span>
              : <span style={{ fontSize: 12, color: st.color, fontWeight: ch.status === "read" ? 500 : 400 }}>{st.label}</span>}
            <I.chevron size={17} style={{ color: "var(--ink-3)", flex: "none" }} />
          </button>
        );
      })}
    </div>
  );
}

// ── Book notes ───────────────────────────────────────────────────
function BookNotes({ notes, onPick }) {
  if (notes.length === 0) return <Empty icon="note" msg="No notes in this book yet. Highlights you make while reading will collect here." />;
  return (
    <div style={{ columnWidth: 330, columnGap: 16 }}>
      {notes.map(n => (
        <button key={n.id} onClick={() => onPick(n)} className="hover-lift" style={{ display: "block", width: "100%", textAlign: "left", breakInside: "avoid", marginBottom: 16, padding: 20, borderRadius: 14, background: "var(--surface)", border: "1px solid var(--line)", borderLeft: `3px solid var(--tag-${n.tag})`, color: "var(--ink)", cursor: "pointer" }}>
          <div style={{ fontFamily: "var(--read)", fontSize: 17, lineHeight: 1.45 }}>"{n.text}"</div>
          {n.note && <div style={{ fontSize: 13.5, color: "var(--ink-2)", marginTop: 12, lineHeight: 1.5 }}>{n.note}</div>}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--line)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--ink-3)" }}><TagDot tag={n.tag} size={7} /> {n.tag}</span>
            <span style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{n.chapter} · {n.date}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

// ── Book cards ───────────────────────────────────────────────────
function BookCards({ cards, onPick }) {
  if (cards.length === 0) return <Empty icon="cards" msg="No flashcards yet. Generate recall cards from your highlights with the Make cards tool above." />;
  const due = cards.filter(c => c.status === "due" || c.status === "learning").length;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
        <div style={{ fontSize: 13.5, color: "var(--ink-2)" }}>{due > 0 ? <><b style={{ color: "var(--accent)" }}>{due} due</b> for review</> : "All caught up"}</div>
        {due > 0 && <button style={{ ...window.lumeStyles.primaryBtn, padding: "10px 18px", fontSize: 14 }}>Study {due} <I.arrowRight size={16} /></button>}
      </div>
      <div style={{ display: "grid", gap: 12 }}>
        {cards.map(c => {
          const st = window.CARD_STATUS[c.status];
          return (
            <button key={c.id} onClick={() => onPick(c)} className="hover-lift" style={{ display: "block", width: "100%", textAlign: "left", padding: "18px 20px", borderRadius: 14, background: "var(--surface)", border: "1px solid var(--line)", color: "var(--ink)", cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14 }}>
                <div style={{ fontFamily: "var(--read)", fontSize: 16.5, fontWeight: 500, lineHeight: 1.35 }}>{c.front}</div>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 11px", borderRadius: 20, fontSize: 11.5, fontWeight: 600, flex: "none",
                  background: `color-mix(in srgb, ${st.color} 14%, transparent)`, color: st.color }}>
                  <span style={{ width: 6, height: 6, borderRadius: 4, background: st.color }} /> {st.label}
                </span>
              </div>
              <div style={{ fontFamily: "var(--read)", fontSize: 14.5, color: "var(--ink-2)", lineHeight: 1.5, marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--line)" }}>{c.back}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const Stat = ({ n, l }) => (
  <div>
    <div style={{ fontFamily: "var(--read)", fontSize: 24, lineHeight: 1 }}>{n}</div>
    <div style={{ fontSize: 10.5, color: "var(--ink-3)", marginTop: 6, textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: "var(--mono)" }}>{l}</div>
  </div>
);

const Empty = ({ icon, msg }) => (
  <div style={{ textAlign: "center", padding: "56px 20px", color: "var(--ink-3)" }}>
    <Glyph name={icon} size={28} style={{ opacity: 0.4 }} />
    <p style={{ fontSize: 14, marginTop: 14, maxWidth: 360, marginLeft: "auto", marginRight: "auto", lineHeight: 1.5 }}>{msg}</p>
  </div>
);

window.BookPage = BookPage;
