// lume-study.jsx — Notes (Thought Layer), Cards (Recall), Search → window
const { useState: useStateS, useMemo: useMemoS, useEffect: useEffectS, useRef: useRefS } = React;

// ── Shared filter dropdown (pill style) ───────────────────────────
function FilterDropdown({ label, value, options, onChange, dot }) {
  const [open, setOpen] = useStateS(false);
  const ref = useRefS(null);
  useEffectS(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    window.addEventListener("click", h); return () => window.removeEventListener("click", h);
  }, [open]);
  const cur = options.find(o => o.value === value) || options[0];
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)} style={{
        display: "inline-flex", alignItems: "center", gap: 8, height: 38, padding: "0 12px", borderRadius: 30, whiteSpace: "nowrap",
        border: `1px solid ${value !== "all" ? "var(--accent)" : "var(--line-2)"}`,
        background: value !== "all" ? "color-mix(in srgb, var(--accent) 10%, transparent)" : "var(--surface)",
        color: "var(--ink)", fontSize: 13, fontWeight: 500,
      }}>
        <span style={{ color: "var(--ink-3)" }}>{label}</span>
        {cur.color && <span style={{ width: 8, height: 8, borderRadius: 5, background: cur.color }} />}
        <span style={{ fontWeight: 600 }}>{cur.label}</span>
        <I.chevronDown size={14} style={{ color: "var(--ink-3)" }} />
      </button>
      {open && (
        <div className="lume-enter lume-scroll" style={{
          position: "absolute", top: 44, left: 0, zIndex: 30, minWidth: 200, maxHeight: 320, overflowY: "auto", padding: 6,
          background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, boxShadow: "0 16px 40px -16px rgba(0,0,0,0.35)",
        }}>
          {options.map(o => (
            <button key={o.value} onClick={() => { onChange(o.value); setOpen(false); }} style={{
              display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "9px 11px", borderRadius: 8,
              border: "none", background: o.value === value ? "var(--surface-2)" : "transparent", color: "var(--ink)",
              fontSize: 13.5, fontWeight: o.value === value ? 600 : 500, textAlign: "left",
            }}>
              {o.color && <span style={{ width: 9, height: 9, borderRadius: 5, background: o.color, flex: "none" }} />}
              <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{o.label}</span>
              {o.count != null && <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-3)" }}>{o.count}</span>}
              {o.value === value && <I.check size={15} style={{ color: "var(--accent)" }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ══ NOTES — Thought Layer ══════════════════════════════════════════
function Notes({ onOpenSource }) {
  const [view, setView] = useStateS("notes");
  const [tag, setTag] = useStateS("all");
  const [coll, setColl] = useStateS("all");
  const [book, setBook] = useStateS("all");
  const [q, setQ] = useStateS("");
  const [selNote, setSelNote] = useStateS(null);
  const tags = ["all", "beautiful", "important", "question", "idea"];

  const notes = useMemoS(() => {
    return window.NOTES.filter(n =>
      (tag === "all" || n.tag === tag) &&
      (coll === "all" || window.collsForTitle(n.book).includes(coll)) &&
      (book === "all" || n.book === book) &&
      (!q || (n.text + n.note + n.book).toLowerCase().includes(q.toLowerCase()))
    );
  }, [tag, coll, book, q]);

  const counts = {};
  window.NOTES.forEach(n => counts[n.tag] = (counts[n.tag]||0)+1);

  // Collection options (only those that actually contain marked books)
  const collOpts = [{ value: "all", label: "All collections" },
    ...window.COLLECTIONS.filter(c => window.NOTES.some(n => window.collsForTitle(n.book).includes(c.id)))
      .map(c => ({ value: c.id, label: c.label, color: c.color,
        count: new Set(window.NOTES.filter(n => window.collsForTitle(n.book).includes(c.id)).map(n=>n.book)).size }))];
  // Book options, narrowed to the active collection
  const bookTitles = window.titlesWithNotes.filter(t => coll === "all" || window.collsForTitle(t).includes(coll));
  const bookOpts = [{ value: "all", label: "All books" },
    ...bookTitles.map(t => ({ value: t, label: t, count: window.NOTES.filter(n => n.book === t).length }))];

  // keep book valid when collection changes
  useEffectS(() => { if (book !== "all" && !bookTitles.includes(book)) setBook("all"); }, [coll]);

  return (
    <div className="lume-enter" style={S.wrap}>
      <window.ScreenHead eyebrow="Thought Layer" title="Notes"
        sub="Every passage you've marked and every margin note, gathered in one place — searchable across all your reading." />

      {/* view toggle: notes vs connections */}
      <div style={{ display: "inline-flex", gap: 4, padding: 4, borderRadius: 12, background: "var(--surface-2)", border: "1px solid var(--line)", marginBottom: 22 }}>
        {[["notes","All notes"],["connections","Connections"]].map(([k,l]) => (
          <button key={k} onClick={() => setView(k)} style={{
            padding: "8px 16px", borderRadius: 9, border: "none", fontSize: 13.5, fontWeight: view===k?600:500,
            background: view===k ? "var(--surface)" : "transparent", color: view===k ? "var(--ink)" : "var(--ink-2)",
            boxShadow: view===k ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            display: "inline-flex", alignItems: "center", gap: 7,
          }}>{k==="connections" && <I.link size={15} />}{l}{k==="connections" && <span style={{ fontFamily: "var(--mono)", fontSize: 11, opacity: 0.6 }}>{window.CONNECTIONS.length}</span>}</button>
        ))}
      </div>

      {view === "connections" ? (
        <window.Connections onOpenSource={onOpenSource} />
      ) : (
      <React.Fragment>

      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "1 1 240px", maxWidth: 340, height: 38, padding: "0 14px", borderRadius: 30, background: "var(--surface)", border: "1px solid var(--line)" }}>
          <I.search size={17} style={{ color: "var(--ink-3)" }} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search your thinking…"
            style={{ flex: 1, minWidth: 0, border: "none", background: "none", outline: "none", fontSize: 13.5, color: "var(--ink)", fontFamily: "var(--ui)" }} />
        </div>
        <FilterDropdown label="In" value={coll} options={collOpts} onChange={setColl} />
        <FilterDropdown label="Book" value={book} options={bookOpts} onChange={setBook} />
      </div>

      <div className="lume-scroll" style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {tags.map(t => (
          <button key={t} onClick={() => setTag(t)} style={{ ...S.chip(tag===t), whiteSpace: "nowrap" }}>
            {t !== "all" && <TagDot tag={t} size={8} />}
            <span style={{ marginLeft: t!=="all"?6:0 }}>{t === "all" ? "All tags" : t}</span>
            <span style={{ marginLeft: 6, opacity: 0.6, fontFamily: "var(--mono)", fontSize: 11 }}>{t==="all" ? window.NOTES.length : (counts[t]||0)}</span>
          </button>
        ))}
      </div>

      <div style={{ columnWidth: 340, columnGap: 18 }}>
        {notes.map(n => (
          <button key={n.id} onClick={() => setSelNote(n)} className="hover-lift" style={{ display: "block", width: "100%", textAlign: "left", breakInside: "avoid", marginBottom: 18, padding: 22, borderRadius: 16, background: "var(--surface)", border: "1px solid var(--line)", borderTop: `3px solid var(--tag-${n.tag})`, color: "var(--ink)", cursor: "pointer" }}>
            <div style={{ fontFamily: "var(--read)", fontSize: 18, lineHeight: 1.45 }}>"{n.text}"</div>
            {n.note && <div style={{ fontSize: 14, color: "var(--ink-2)", marginTop: 14, lineHeight: 1.55 }}>{n.note}</div>}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--line)" }}>
              <span style={{ fontSize: 12.5, color: "var(--ink-2)" }}>{n.book}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--ink-3)" }}>
                <TagDot tag={n.tag} size={7} /> {n.tag} · {n.date}
              </span>
            </div>
          </button>
        ))}
      </div>
      {notes.length === 0 && <Empty msg="No notes match that filter yet." />}
      </React.Fragment>
      )}
      <window.NoteModal note={selNote} onClose={() => setSelNote(null)} onOpenSource={onOpenSource} />
    </div>
  );
}

// ══ CARDS — Recall Practice ════════════════════════════════════════
function Cards({ onOpenSource }) {
  const [session, setSession] = useStateS(false);
  const [coll, setColl] = useStateS("all");
  const [book, setBook] = useStateS("all");
  const [selCard, setSelCard] = useStateS(null);

  const cards = useMemoS(() => window.CARDS.filter(c =>
    (coll === "all" || window.collsForTitle(c.book).includes(coll)) &&
    (book === "all" || c.book === book)
  ), [coll, book]);

  const due = cards.filter(c => c.status === "due" || c.status === "learning");
  const counts = { new:0, learning:0, review:0, known:0, due:0 };
  cards.forEach(c => counts[c.status]++);

  const collOpts = [{ value: "all", label: "All collections" },
    ...window.COLLECTIONS.filter(c => window.CARDS.some(cd => window.collsForTitle(cd.book).includes(c.id)))
      .map(c => ({ value: c.id, label: c.label, color: c.color,
        count: window.CARDS.filter(cd => window.collsForTitle(cd.book).includes(c.id)).length }))];
  const bookTitles = window.titlesWithCards.filter(t => coll === "all" || window.collsForTitle(t).includes(coll));
  const bookOpts = [{ value: "all", label: "All books" },
    ...bookTitles.map(t => ({ value: t, label: t, count: window.CARDS.filter(c => c.book === t).length }))];
  useEffectS(() => { if (book !== "all" && !bookTitles.includes(book)) setBook("all"); }, [coll]);

  if (session) return <StudySession cards={due.length ? due : cards.slice(0,4)} onExit={() => setSession(false)} />;

  return (
    <div className="lume-enter" style={S.wrap}>
      <window.ScreenHead eyebrow="Recall Practice" title="Cards"
        sub="Spaced-repetition prompts, generated from your own highlights. Review what's fading before it's gone."
        right={
          <button onClick={() => setSession(true)} disabled={due.length === 0} style={{ ...S.primaryBtn, padding: "14px 24px", fontSize: 15, opacity: due.length === 0 ? 0.5 : 1 }}>
            Study {due.length} due <I.arrowRight size={17} />
          </button>
        } />

      <div style={{ display: "flex", gap: 10, marginBottom: 26, flexWrap: "wrap", alignItems: "center" }}>
        <FilterDropdown label="In" value={coll} options={collOpts} onChange={setColl} />
        <FilterDropdown label="Book" value={book} options={bookOpts} onChange={setBook} />
        {(coll !== "all" || book !== "all") && (
          <span style={{ fontSize: 12.5, color: "var(--ink-3)" }}>{cards.length} {cards.length === 1 ? "card" : "cards"}</span>
        )}
      </div>

      {/* status overview */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 34 }}>
        {[["due","Due now"],["learning","Learning"],["review","In review"],["known","Known"]].map(([k,l]) => {
          const st = window.CARD_STATUS[k];
          return (
            <div key={k} style={{ ...S.card, padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <span style={{ width: 9, height: 9, borderRadius: 6, background: st.color }} />
                <span style={{ fontSize: 12.5, color: "var(--ink-2)" }}>{l}</span>
              </div>
              <div style={{ fontFamily: "var(--read)", fontSize: 34, lineHeight: 1 }}>{counts[k]}</div>
            </div>
          );
        })}
      </div>

      <h2 style={{ ...S.sectionH, marginBottom: 18 }}>{coll === "all" && book === "all" ? "All cards" : "Cards"}</h2>
      <div style={{ display: "grid", gap: 12 }}>
        {cards.map(c => {
          const st = window.CARD_STATUS[c.status];
          return (
            <button key={c.id} onClick={() => setSelCard(c)} className="hover-lift" style={{ display: "flex", alignItems: "center", gap: 18, padding: "18px 22px", borderRadius: 14, background: "var(--surface)", border: "1px solid var(--line)", width: "100%", textAlign: "left", color: "var(--ink)", cursor: "pointer" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "var(--read)", fontSize: 16.5, lineHeight: 1.35 }}>{c.front}</div>
                <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 6 }}>{c.book}</div>
              </div>
              <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--ink-3)", minWidth: 36, textAlign: "right" }}>{c.interval}</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 11px", borderRadius: 20, fontSize: 11.5, fontWeight: 600,
                background: `color-mix(in srgb, ${st.color} 14%, transparent)`, color: st.color }}>
                <span style={{ width: 6, height: 6, borderRadius: 4, background: st.color }} /> {st.label}
              </span>
            </button>
          );
        })}
        {cards.length === 0 && <Empty msg="No cards in this view yet." />}
      </div>
      <window.CardModal card={selCard} onClose={() => setSelCard(null)} onOpenSource={onOpenSource} />
    </div>
  );
}

function StudySession({ cards, onExit }) {
  const [i, setI] = useStateS(0);
  const [flipped, setFlipped] = useStateS(false);
  const [done, setDone] = useStateS(false);
  const c = cards[i];

  const grade = () => {
    if (i + 1 >= cards.length) { setDone(true); return; }
    setFlipped(false); setI(i + 1);
  };

  if (done) return (
    <div className="lume-enter" style={{ ...S.wrap, textAlign: "center", paddingTop: 120 }}>
      <div style={{ width: 64, height: 64, borderRadius: 40, background: "color-mix(in srgb, var(--tag-idea) 16%, transparent)", color: "var(--tag-idea)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
        <I.check size={32} />
      </div>
      <h1 style={{ fontFamily: "var(--read)", fontWeight: 400, fontSize: 36, margin: "0 0 12px" }}>Session complete</h1>
      <p style={{ color: "var(--ink-2)", fontSize: 15, marginBottom: 30 }}>You reviewed {cards.length} cards. Next batch is due tomorrow.</p>
      <button onClick={onExit} style={S.primaryBtn}>Back to cards</button>
    </div>
  );

  return (
    <div className="lume-enter" style={{ ...S.wrap, maxWidth: 720 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 36 }}>
        <button onClick={onExit} style={S.linkBtn}><I.close size={16} /> End session</button>
        <span style={{ fontFamily: "var(--mono)", fontSize: 12.5, color: "var(--ink-3)" }}>{i+1} / {cards.length}</span>
      </div>
      <div style={{ height: 4, borderRadius: 3, background: "var(--surface-2)", marginBottom: 44, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${((i)/cards.length)*100}%`, background: "var(--accent)", transition: "width 0.3s" }} />
      </div>

      <div onClick={() => setFlipped(f => !f)} style={{
        minHeight: 320, borderRadius: 22, background: "var(--surface)", border: "1px solid var(--line)",
        padding: "48px 44px", display: "flex", flexDirection: "column", justifyContent: "center", cursor: "pointer",
        position: "relative", animation: "lumeScaleIn 0.3s both",
      }}>
        <div className="eyebrow" style={{ position: "absolute", top: 24, left: 44 }}>{flipped ? "Answer" : "Prompt"} · {c.book}</div>
        <div style={{ fontFamily: "var(--read)", fontSize: flipped ? 22 : 26, lineHeight: 1.4, textAlign: "center", color: flipped ? "var(--ink)" : "var(--ink)" }}>
          {flipped ? c.back : c.front}
        </div>
        {!flipped && <div style={{ position: "absolute", bottom: 22, left: 0, right: 0, textAlign: "center", fontSize: 12.5, color: "var(--ink-3)" }}>Tap to reveal</div>}
      </div>

      {flipped && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginTop: 20, animation: "lumeFade 0.3s both" }}>
          {[["Again","var(--accent)"],["Hard","var(--tag-beautiful)"],["Good","var(--tag-important)"],["Easy","var(--tag-idea)"]].map(([l,col]) => (
            <button key={l} onClick={grade} style={{ padding: "14px 0", borderRadius: 12, border: `1px solid ${col}`, background: "transparent", color: col, fontSize: 13.5, fontWeight: 600 }}>{l}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// ══ SEARCH ═════════════════════════════════════════════════════════
function Search() {
  const [q, setQ] = useStateS("");
  const [submitted, setSubmitted] = useStateS(false);
  const [thinking, setThinking] = useStateS(false);
  const demo = window.SEARCH_DEMO;

  const go = (query) => {
    const text = (query ?? q).trim();
    if (!text) return;
    setQ(text); setThinking(true); setSubmitted(true);
    setTimeout(() => setThinking(false), 1100);
  };

  return (
    <div className="lume-enter" style={{ ...S.wrap, maxWidth: 780 }}>
      {!submitted ? (
        <div style={{ paddingTop: 40 }}>
          <div className="eyebrow" style={{ marginBottom: 14, color: "var(--accent)" }}>Ask your library</div>
          <h1 style={{ fontFamily: "var(--read)", fontWeight: 400, fontSize: "clamp(30px, 4.5vw, 46px)", margin: "0 0 16px", lineHeight: 1.08 }}>
            Ask a question across everything you've read.
          </h1>
          <p style={{ fontSize: 15.5, color: "var(--ink-2)", lineHeight: 1.55, marginBottom: 34, maxWidth: 560 }}>
            Lume answers from your own highlights and notes — and shows you the passages it drew from.
          </p>
          <SearchBar q={q} setQ={setQ} onGo={() => go()} />
          <div style={{ marginTop: 36 }}>
            <div className="eyebrow" style={{ marginBottom: 14 }}>Try</div>
            <div style={{ display: "grid", gap: 8 }}>
              {window.SEARCH_RECENT.map((r, i) => (
                <button key={i} onClick={() => go(r)} className="row-hover" style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderRadius: 12,
                  border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)", textAlign: "left", fontSize: 14.5, fontFamily: "var(--read)",
                }}>
                  <I.search size={16} style={{ color: "var(--ink-3)", flex: "none" }} /> {r}
                  <I.arrowRight size={16} style={{ marginLeft: "auto", color: "var(--ink-3)" }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div>
          <SearchBar q={q} setQ={setQ} onGo={() => go()} compact />
          <div style={{ marginTop: 30 }}>
            <div style={{ fontFamily: "var(--read)", fontSize: 24, lineHeight: 1.25, marginBottom: 24 }}>{q}</div>
            {thinking ? (
              <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--ink-3)", padding: "20px 0" }}>
                <I.sparkle size={18} style={{ color: "var(--accent)", animation: "lumeShimmer 1.2s infinite" }} />
                <span style={{ fontFamily: "var(--mono)", fontSize: 13, letterSpacing: "0.04em" }}>reading across your library…</span>
              </div>
            ) : (
              <div className="lume-enter">
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <I.sparkle size={16} style={{ color: "var(--accent)" }} />
                  <span className="eyebrow">Synthesis</span>
                </div>
                <p style={{ fontFamily: "var(--read)", fontSize: 18.5, lineHeight: 1.6, margin: "0 0 32px" }}>{demo.answer}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <span className="eyebrow">Cited from your highlights</span>
                  <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
                  <span style={{ fontSize: 12, color: "var(--ink-3)", fontFamily: "var(--mono)" }}>{demo.sources.length}</span>
                </div>
                <div style={{ display: "grid", gap: 12 }}>
                  {demo.sources.map((s, i) => (
                    <div key={i} style={{ display: "flex", gap: 16, padding: "18px 20px", borderRadius: 14, background: "var(--surface)", border: "1px solid var(--line)" }}>
                      <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--accent)", flex: "none", paddingTop: 3 }}>{String(i+1).padStart(2,"0")}</span>
                      <div>
                        <div style={{ fontFamily: "var(--read)", fontSize: 16, lineHeight: 1.45 }}>"{s.text}"</div>
                        <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 8 }}>{s.book} · {s.author}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SearchBar({ q, setQ, onGo, compact }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, height: compact ? 50 : 60, padding: "0 8px 0 20px", borderRadius: 16,
      background: "var(--surface)", border: "1px solid var(--line-2)", boxShadow: compact ? "none" : "0 8px 30px -16px rgba(0,0,0,0.2)" }}>
      <I.search size={20} style={{ color: "var(--ink-3)", flex: "none" }} />
      <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === "Enter" && onGo()} autoFocus={!compact}
        placeholder="What do my books say about…"
        style={{ flex: 1, border: "none", background: "none", outline: "none", fontSize: compact ? 15 : 17, color: "var(--ink)", fontFamily: "var(--read)" }} />
      <button onClick={onGo} style={{ width: compact ? 38 : 44, height: compact ? 38 : 44, borderRadius: 11, border: "none", background: "var(--accent)", color: "var(--accent-ink)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
        <I.arrowRight size={20} />
      </button>
    </div>
  );
}

const Empty = ({ msg }) => (
  <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--ink-3)" }}>
    <I.notes size={30} style={{ opacity: 0.4 }} />
    <p style={{ fontSize: 14, marginTop: 14 }}>{msg}</p>
  </div>
);

const S = window.lumeStyles;
Object.assign(window, { Notes, Cards, Search });
