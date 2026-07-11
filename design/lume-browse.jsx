// lume-browse.jsx — Library organization at scale → window.Browse
const { useState: useStateB, useMemo: useMemoB, useEffect: useEffectB, useRef: useRefB } = React;

const STATUS_META = {
  reading:   { label: "Reading",   color: "var(--accent)" },
  unread:    { label: "Unread",    color: "var(--ink-3)" },
  finished:  { label: "Finished",  color: "var(--tag-idea)" },
  reference: { label: "Reference", color: "var(--tag-important)" },
};

// Quick filters ("shelves") narrow whatever category you're in — zero filing, status-based.
const QUICK = [
  { id: "all",       label: "All",       icon: "library",  test: () => true },
  { id: "reading",   label: "Reading",   icon: "book",     test: b => b.status === "reading" },
  { id: "unread",    label: "Unread",    icon: "bookmark", test: b => b.status === "unread" },
  { id: "finished",  label: "Finished",  icon: "check",    test: b => b.status === "finished" },
  { id: "reference", label: "Reference", icon: "layers",   test: b => b.status === "reference" },
  { id: "marked",    label: "Marked",    icon: "highlight",test: b => (b.marked||0) > 0 },
  { id: "recent",    label: "Recent",    icon: "clock",    test: b => b.added <= 10 },
];

function Browse({ onOpenBook, onGoto }) {
  const S = window.lumeStyles;
  const [mode, setMode] = useStateB("books");        // books | papers
  const [cat, setCat] = useStateB("__all");         // primary: __all | __unsorted | collectionId
  const [shelf, setShelf] = useStateB("all");        // quick filter within category
  const [groupBy, setGroupBy] = useStateB("none");  // none|author|year|topic|status
  const [view, setView] = useStateB("rows");        // grid|rows|compact
  const [sort, setSort] = useStateB("recent");
  const [q, setQ] = useStateB("");
  const [topic, setTopic] = useStateB(null);
  const [menuFor, setMenuFor] = useStateB(null);    // book id with open collection menu
  const [asking, setAsking] = useStateB(false);     // "Ask this collection" sheet open
  const [importing, setImporting] = useStateB(false); // add-your-own-book sheet

  // Collections + membership are stateful so triage actually does something.
  const [collections, setCollections] = useStateB(window.COLLECTIONS);
  const [membership, setMembership] = useStateB(() => {
    const m = {}; window.BOOKS.forEach(b => m[b.id] = [...(b.coll || [])]); return m;
  });
  // Papers share the same collection set; their membership is tracked separately.
  const [paperMembership, setPaperMembership] = useStateB(() => {
    const m = {}; window.PAPERS.forEach(p => m[p.id] = [...(p.coll || [])]); return m;
  });
  const togglePaperColl = (paperId, collId) => {
    setPaperMembership(m => {
      const cur = m[paperId] || [];
      return { ...m, [paperId]: cur.includes(collId) ? cur.filter(c => c !== collId) : [...cur, collId] };
    });
  };

  const collsOf = (b) => membership[b.id] || [];
  const inColl = (b, c) => collsOf(b).includes(c);
  const unsortedCount = window.BOOKS.filter(b => collsOf(b).length === 0).length;

  const toggleColl = (bookId, collId) => {
    setMembership(m => {
      const cur = m[bookId] || [];
      return { ...m, [bookId]: cur.includes(collId) ? cur.filter(c => c !== collId) : [...cur, collId] };
    });
  };
  const addCollection = () => {
    const label = (prompt("Name your collection") || "").trim();
    if (!label) return;
    const id = "c" + Date.now();
    const palette = ["#B98A4E","#D98AA8","#8A6CB0","#3E7C8B","#5E8C5A","#C9764A"];
    setCollections(cs => [...cs, { id, label, color: palette[cs.length % palette.length] }]);
    setCat(id);
  };

  // Books in the current category, before the quick-filter is applied (for chip counts).
  const inCategory = useMemoB(() => window.BOOKS.filter(b => {
    if (cat === "__unsorted") return collsOf(b).length === 0;
    if (cat !== "__all") return inColl(b, cat);
    return true;
  }), [cat, membership]);

  // The active filtered + sorted set
  const result = useMemoB(() => {
    const qf = QUICK.find(s => s.id === shelf) || QUICK[0];
    let list = inCategory.filter(b => {
      if (!qf.test(b)) return false;
      if (topic && !(b.topics || []).includes(topic)) return false;
      if (q) { const hay = (b.title + b.author + (b.topics||[]).join(" ") + b.genre).toLowerCase(); if (!hay.includes(q.toLowerCase())) return false; }
      return true;
    });
    const by = {
      recent: (a,b) => a.added - b.added,
      az:     (a,b) => a.title.localeCompare(b.title),
      author: (a,b) => a.author.split(" ").slice(-1)[0].localeCompare(b.author.split(" ").slice(-1)[0]),
      year:   (a,b) => b.year - a.year,
      marked: (a,b) => (b.marked||0) - (a.marked||0),
    };
    return [...list].sort(by[sort]);
  }, [inCategory, shelf, topic, q, sort]);

  // Group the result for sectioned rendering
  const groups = useMemoB(() => {
    if (groupBy === "none") return [{ key: null, items: result }];
    const map = new Map();
    const push = (k, b) => { if (!map.has(k)) map.set(k, []); map.get(k).push(b); };
    result.forEach(b => {
      if (groupBy === "author") push(b.author, b);
      else if (groupBy === "year") push(b.year < 0 ? `${-b.year} BC` : (b.year < 1900 ? `Pre-1900` : `${Math.floor(b.year/10)*10}s`), b);
      else if (groupBy === "status") push(STATUS_META[b.status].label, b);
      else if (groupBy === "topic") (b.topics||["—"]).forEach(t => push(t, b));
    });
    let entries = [...map.entries()].map(([key, items]) => ({ key, items }));
    entries.sort((a,b) => groupBy === "year" ? 0 : b.items.length - a.items.length || String(a.key).localeCompare(String(b.key)));
    return entries;
  }, [result, groupBy]);

  const total = window.BOOKS.length;
  const activeColl = collections.find(c => c.id === cat);
  const activeTitle = cat === "__unsorted" ? "Unsorted"
    : cat === "__all" ? "All books"
    : (activeColl?.label || "Collection");

  // close menu on outside click
  useEffectB(() => {
    if (!menuFor) return;
    const h = () => setMenuFor(null);
    window.addEventListener("click", h);
    return () => window.removeEventListener("click", h);
  }, [menuFor]);

  const selectCat = (id) => { setCat(id); setTopic(null); setShelf("all"); };

  return (
    <div className="lume-enter" style={{ maxWidth: 1180, margin: "0 auto", padding: "clamp(28px, 5vw, 56px) clamp(20px, 4vw, 44px) 120px" }}>
      {/* Books / Papers mode switch */}
      <div style={{ display: "flex", gap: 2, padding: 3, borderRadius: 12, background: "var(--surface-2)", border: "1px solid var(--line)", marginBottom: 28, width: "fit-content" }}>
        {[["books", "Books", "library", window.BOOKS.length], ["papers", "Papers", "doc", window.PAPERS.length]].map(([v, l, ic, n]) => (
          <button key={v} onClick={() => setMode(v)} style={{
            display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 20px", borderRadius: 9, border: "none", fontSize: 14, fontWeight: mode === v ? 600 : 500,
            background: mode === v ? "var(--surface)" : "transparent", color: mode === v ? "var(--ink)" : "var(--ink-3)", boxShadow: mode === v ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
          }}>
            <Glyph name={ic} size={17} style={{ color: mode === v ? "var(--accent)" : "var(--ink-3)" }} /> {l}
            <span style={{ fontFamily: "var(--mono)", fontSize: 11, opacity: 0.6 }}>{n}</span>
          </button>
        ))}
      </div>

      {mode === "papers" ? <window.PapersView onGoto={onGoto} collections={collections} membership={paperMembership} onToggleColl={togglePaperColl} onNewColl={addCollection} /> : (
      <div className="brz-layout" style={{ display: "flex", gap: 30, alignItems: "flex-start" }}>

        {/* ── ORGANIZER RAIL ─────────────────────────────────── */}
        <aside className="brz-rail" style={{ width: 224, flex: "none" }}>
          <button onClick={() => setImporting(true)} style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", marginBottom: 18,
            padding: "11px 14px", borderRadius: 11, border: "none", background: "var(--accent)", color: "var(--accent-ink)", fontSize: 13.5, fontWeight: 600,
          }}>
            <I.plus size={17} /> Add a book
          </button>
          <div className="eyebrow" style={{ marginBottom: 16 }}>Library · {total}</div>

          <div className="brz-rail-group brz-list">
            <RailLabel>Library</RailLabel>
            <RailItem icon="library" label="All books" count={total} on={cat === "__all"} onClick={() => selectCat("__all")} />
            <RailItem icon="inbox" label="Unsorted" count={unsortedCount} accent on={cat === "__unsorted"} onClick={() => selectCat("__unsorted")} />
          </div>

          <div className="brz-rail-group brz-list" style={{ marginTop: 22 }}>
            <RailLabel>Collections</RailLabel>
            {collections.map(c => {
              const count = window.BOOKS.filter(b => collsOf(b).includes(c.id)).length;
              return <RailItem key={c.id} dot={c.color} label={c.label} count={count} on={cat === c.id} onClick={() => selectCat(c.id)} />;
            })}
            <button onClick={addCollection} className="brz-newcoll" style={{
              display: "flex", alignItems: "center", gap: 10, padding: "9px 11px", borderRadius: 10, width: "100%",
              border: "1px dashed var(--line-2)", background: "transparent", color: "var(--ink-3)", fontSize: 13, fontWeight: 500,
            }}>
              <I.folderPlus size={17} /> New collection
            </button>
          </div>
        </aside>

        {/* ── MAIN ───────────────────────────────────────────── */}
        <main className="brz-main" style={{ flex: 1, minWidth: 0 }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 16 }}>
            <div style={{ minWidth: 0 }}>
              <h1 style={{ fontFamily: "var(--read)", fontWeight: 400, fontSize: "clamp(26px, 4vw, 36px)", margin: 0, letterSpacing: "-0.01em" }}>{activeTitle}</h1>
              <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 6 }}>
                {result.length} {result.length === 1 ? "book" : "books"}
                {shelf !== "all" && <span> · {QUICK.find(s => s.id === shelf).label.toLowerCase()}</span>}
                {topic && <span> · filtered by <b style={{ color: "var(--ink-2)" }}>{topic}</b></span>}
              </div>
            </div>
            <button onClick={() => setAsking(true)} className="brz-ask-btn" style={{
              display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 30, flex: "none",
              border: "1px solid var(--accent)", background: "color-mix(in srgb, var(--accent) 10%, transparent)", color: "var(--accent)", fontSize: 13.5, fontWeight: 600,
            }}>
              <I.sparkle size={17} /> <span className="brz-ask-lbl">Ask this {cat === "__all" ? "library" : "collection"}</span>
            </button>
          </div>

          {/* Quick-filter chips (shelves) — narrow within the active category */}
          <div className="brz-quick lume-scroll" style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", paddingBottom: 2 }}>
            {QUICK.map(s => {
              const c = inCategory.filter(s.test).length;
              const on = shelf === s.id;
              if (s.id !== "all" && c === 0) return null;
              return (
                <button key={s.id} onClick={() => setShelf(s.id)} style={{
                  display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 13px", borderRadius: 30, flex: "none",
                  border: `1px solid ${on ? "var(--accent)" : "var(--line-2)"}`, background: on ? "var(--accent)" : "transparent",
                  color: on ? "var(--accent-ink)" : "var(--ink-2)", fontSize: 13, fontWeight: on ? 600 : 500,
                }}>
                  {s.label}
                  <span style={{ fontFamily: "var(--mono)", fontSize: 11, opacity: on ? 0.85 : 0.55 }}>{c}</span>
                </button>
              );
            })}
          </div>

          <div className="brz-toolbar" style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 22, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, flex: "1 1 200px", minWidth: 0, height: 40, padding: "0 13px", borderRadius: 10, background: "var(--surface)", border: "1px solid var(--line)" }}>
              <I.search size={17} style={{ color: "var(--ink-3)", flex: "none" }} />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search this view…"
                style={{ flex: 1, minWidth: 0, border: "none", background: "none", outline: "none", fontSize: 13.5, color: "var(--ink)", fontFamily: "var(--ui)" }} />
            </div>
            <Select label="Group" value={groupBy} icon="layers"
              options={[["none","No grouping"],["author","Author"],["year","Era"],["topic","Topic"],["status","Status"]]}
              onChange={setGroupBy} />
            <Select label="Sort" value={sort} icon="align"
              options={[["recent","Recently added"],["az","Title A–Z"],["author","Author"],["year","Year"],["marked","Most marked"]]}
              onChange={setSort} />
            <div style={{ display: "flex", gap: 2, padding: 3, borderRadius: 10, background: "var(--surface-2)", border: "1px solid var(--line)" }}>
              {[["grid","grid"],["rows","rows"],["compact","compact"]].map(([v, ic]) => (
                <button key={v} onClick={() => setView(v)} title={v} style={{
                  width: 34, height: 30, borderRadius: 7, border: "none", display: "flex", alignItems: "center", justifyContent: "center",
                  background: view === v ? "var(--surface)" : "transparent", color: view === v ? "var(--accent)" : "var(--ink-3)",
                  boxShadow: view === v ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                }}><Glyph name={ic} size={17} /></button>
              ))}
            </div>
            {topic && <button onClick={() => setTopic(null)} style={{ ...S.chip(true), fontSize: 12, gap: 6, display: "inline-flex", alignItems: "center" }}>{topic} <I.close size={13} /></button>}
          </div>

          {/* Triage banner */}
          {cat === "__unsorted" && result.length > 0 && (
            <div style={{ display: "flex", gap: 14, alignItems: "center", padding: "16px 18px", borderRadius: 14, marginBottom: 22,
              background: "color-mix(in srgb, var(--accent) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--accent) 28%, var(--line))" }}>
              <I.inbox size={22} style={{ color: "var(--accent)", flex: "none" }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{result.length} books haven't found a home</div>
                <div style={{ fontSize: 12.5, color: "var(--ink-2)", marginTop: 2 }}>Drop each into a collection to keep the pile from growing. The quick filters still find them in the meantime.</div>
              </div>
            </div>
          )}

          {/* Body */}
          {result.length === 0 ? (
            <div style={{ textAlign: "center", padding: "70px 20px", color: "var(--ink-3)" }}>
              <I.folder size={30} style={{ opacity: 0.4 }} />
              <p style={{ fontSize: 14, marginTop: 14 }}>Nothing here yet.</p>
            </div>
          ) : (
            groups.map((g, gi) => (
              <section key={g.key || gi} style={{ marginBottom: g.key ? 30 : 0 }}>
                {g.key && (
                  <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "8px 0 16px" }}>
                    <h3 style={{ fontFamily: "var(--ui)", fontSize: 13, fontWeight: 700, letterSpacing: "0.02em", margin: 0, color: "var(--ink-2)" }}>{g.key}</h3>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-3)" }}>{g.items.length}</span>
                    <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
                  </div>
                )}
                {view === "grid" ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 26 }}>
                    {g.items.map(b => <GridCard key={b.id} book={b} onOpen={onOpenBook} colls={collsOf(b)} collections={collections} />)}
                  </div>
                ) : (
                  <div>
                    {g.items.map((b, i) => (
                      <BookRow key={b.id} book={b} compact={view === "compact"} last={i === g.items.length-1}
                        onOpen={onOpenBook} collsOf={collsOf} collections={collections}
                        menuOpen={menuFor === b.id} onMenu={() => setMenuFor(menuFor === b.id ? null : b.id)}
                        onToggleColl={toggleColl} onTopic={setTopic} onNewColl={addCollection} />
                    ))}
                  </div>
                )}
              </section>
            ))
          )}
        </main>
      </div>
      )}

      {asking && (
        <CollectionAsk title={activeTitle} scope={cat === "__all" ? "library" : "collection"}
          books={inCategory}
          notes={window.NOTES.filter(n => inCategory.some(b => b.title === n.book))}
          onClose={() => setAsking(false)} />
      )}
      {importing && <ImportSheet onClose={() => setImporting(false)} />}
    </div>
  );
}

// ── Rail bits ────────────────────────────────────────────────────
const RailLabel = ({ children }) => (
  <div className="brz-rail-lbl" style={{ fontFamily: "var(--mono)", fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-3)", padding: "0 11px 8px" }}>{children}</div>
);
function RailItem({ icon, dot, label, count, on, accent, onClick }) {
  return (
    <button onClick={onClick} className="brz-railitem" style={{
      display: "flex", alignItems: "center", gap: 11, padding: "9px 11px", borderRadius: 10, width: "100%", textAlign: "left",
      border: "none", background: on ? "var(--surface)" : "transparent", color: on ? "var(--ink)" : "var(--ink-2)",
      fontSize: 13.5, fontWeight: on ? 600 : 500, position: "relative",
      boxShadow: on ? "inset 0 0 0 1px var(--line)" : "none",
    }}>
      {on && <span style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 3, height: 16, borderRadius: 3, background: accent ? "var(--accent)" : (dot || "var(--accent)") }} />}
      {dot ? <span style={{ width: 9, height: 9, borderRadius: 6, background: dot, flex: "none" }} />
           : <Glyph name={icon} size={17} style={{ color: on ? (accent ? "var(--accent)" : "var(--ink)") : "var(--ink-3)", flex: "none" }} />}
      <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
      <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: accent && count ? "var(--accent)" : "var(--ink-3)", fontWeight: accent && count ? 700 : 400 }}>{count}</span>
    </button>
  );
}

// ── Custom select (matches aesthetic) ────────────────────────────
function Select({ label, value, options, icon, onChange }) {
  const [open, setOpen] = useStateB(false);
  const ref = useRefB(null);
  useEffectB(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    window.addEventListener("click", h); return () => window.removeEventListener("click", h);
  }, [open]);
  const cur = options.find(o => o[0] === value);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)} style={{
        display: "flex", alignItems: "center", gap: 8, height: 40, padding: "0 12px", borderRadius: 10,
        border: "1px solid var(--line)", background: open ? "var(--surface-2)" : "var(--surface)", color: "var(--ink-2)", fontSize: 13, fontWeight: 500,
      }}>
        <Glyph name={icon} size={16} style={{ color: "var(--ink-3)" }} />
        <span className="brz-sel-lbl" style={{ color: "var(--ink-3)" }}>{label}:</span>
        <span style={{ color: "var(--ink)", fontWeight: 600 }}>{cur ? cur[1] : ""}</span>
        <I.chevronDown size={15} style={{ color: "var(--ink-3)" }} />
      </button>
      {open && (
        <div className="lume-enter" style={{
          position: "absolute", top: 46, right: 0, zIndex: 20, minWidth: 180, padding: 6,
          background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, boxShadow: "0 16px 40px -16px rgba(0,0,0,0.35)",
        }}>
          {options.map(([v, l]) => (
            <button key={v} onClick={() => { onChange(v); setOpen(false); }} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, width: "100%", padding: "9px 11px", borderRadius: 8,
              border: "none", background: v === value ? "var(--surface-2)" : "transparent", color: "var(--ink)", fontSize: 13.5, fontWeight: v === value ? 600 : 500, textAlign: "left",
            }}>
              {l} {v === value && <I.check size={15} style={{ color: "var(--accent)" }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Grid card ─────────────────────────────────────────────────────
function GridCard({ book, onOpen, colls, collections }) {
  const st = STATUS_META[book.status];
  return (
    <button onClick={() => onOpen(book)} className="hover-lift" style={{ background: "none", border: "none", padding: 0, textAlign: "left", display: "flex", flexDirection: "column", gap: 11 }}>
      <div style={{ position: "relative" }}>
        <Cover book={book} w="100%" h={210} radius={6} style={{ width: "100%" }} />
        {book.progress > 0 && book.progress < 1 && (
          <div style={{ position: "absolute", left: 8, right: 8, bottom: 8, height: 4, borderRadius: 3, background: "rgba(0,0,0,0.35)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${book.progress*100}%`, background: book.cover.accent }} />
          </div>
        )}
        <span style={{ position: "absolute", top: 8, left: 8, display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 8px", borderRadius: 20, fontSize: 10, fontWeight: 600, fontFamily: "var(--ui)",
          background: "color-mix(in srgb, var(--page) 86%, transparent)", backdropFilter: "blur(6px)", color: st.color }}>
          <span style={{ width: 5, height: 5, borderRadius: 4, background: st.color }} /> {st.label}
        </span>
      </div>
      <div>
        <div style={{ fontFamily: "var(--read)", fontSize: 15, lineHeight: 1.2 }}>{book.title}</div>
        <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 3 }}>{book.author}</div>
        {colls.length > 0 && (
          <div style={{ display: "flex", gap: 4, marginTop: 7 }}>
            {colls.map(cid => { const c = collections.find(x => x.id === cid); return c ? <span key={cid} style={{ width: 7, height: 7, borderRadius: 5, background: c.color }} title={c.label} /> : null; })}
          </div>
        )}
      </div>
    </button>
  );
}

// ── List / compact row ────────────────────────────────────────────
function BookRow({ book, compact, last, onOpen, collsOf, collections, menuOpen, onMenu, onToggleColl, onTopic, onNewColl }) {
  const st = STATUS_META[book.status];
  const colls = collsOf(book);
  return (
    <div className="row-hover" style={{
      display: "flex", gap: compact ? 14 : 18, alignItems: "center", padding: compact ? "10px 12px" : "14px 12px",
      borderRadius: 12, borderBottom: last ? "none" : "1px solid var(--line)", position: "relative",
    }}>
      <button onClick={() => onOpen(book)} style={{ display: "flex", gap: compact ? 14 : 18, alignItems: "center", flex: 1, minWidth: 0, border: "none", background: "none", color: "var(--ink)", textAlign: "left", padding: 0, cursor: "pointer" }}>
        {!compact && <Cover book={book} w={44} h={66} radius={4} />}
        <span style={{ width: 8, height: 8, borderRadius: 5, background: st.color, flex: "none", display: compact ? "block" : "none" }} title={st.label} />
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontFamily: "var(--read)", fontSize: compact ? 15 : 17, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{book.title}</span>
          <span style={{ display: "block", fontSize: compact ? 12 : 13, color: "var(--ink-2)", marginTop: compact ? 1 : 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {book.author} · {book.year < 0 ? `${-book.year} BC` : book.year}{!compact && ` · ${book.genre}`}
          </span>
        </span>
      </button>

      {/* topics (list view only) */}
      {!compact && (
        <div className="brz-row-topics" style={{ display: "flex", gap: 6, flex: "none" }}>
          {(book.topics || []).slice(0, 2).map(t => (
            <button key={t} onClick={(e) => { e.stopPropagation(); onTopic(t); }} style={{
              padding: "3px 9px", borderRadius: 20, border: "1px solid var(--line-2)", background: "transparent",
              color: "var(--ink-3)", fontSize: 11, fontWeight: 500, fontFamily: "var(--ui)",
            }}>{t}</button>
          ))}
        </div>
      )}

      {/* status (list) */}
      {!compact && (
        <span className="brz-row-status" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, color: st.color, fontWeight: 600, minWidth: 78, justifyContent: "flex-end" }}>
          <span style={{ width: 6, height: 6, borderRadius: 4, background: st.color }} /> {st.label}
        </span>
      )}

      {/* marked count */}
      {(book.marked||0) > 0 && (
        <span className="brz-row-marked" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--ink-3)", fontFamily: "var(--ui)", flex: "none" }}>
          <I.highlight size={14} /> {book.marked}
        </span>
      )}

      {/* collection dots */}
      <div style={{ display: "flex", gap: 3, flex: "none", width: 26, justifyContent: "flex-end" }}>
        {colls.slice(0,3).map(cid => { const c = collections.find(x => x.id === cid); return c ? <span key={cid} style={{ width: 7, height: 7, borderRadius: 5, background: c.color }} title={c.label} /> : null; })}
      </div>

      {/* add-to-collection menu */}
      <div style={{ position: "relative", flex: "none" }}>
        <button onClick={(e) => { e.stopPropagation(); onMenu(); }} title="Add to collection" style={{
          width: 32, height: 32, borderRadius: 8, border: "none", display: "flex", alignItems: "center", justifyContent: "center",
          background: menuOpen ? "var(--surface-2)" : "transparent", color: menuOpen ? "var(--accent)" : "var(--ink-3)",
        }}><I.folderPlus size={17} /></button>
        {menuOpen && (
          <div className="lume-enter" onClick={e => e.stopPropagation()} style={{
            position: "absolute", top: 38, right: 0, zIndex: 30, width: 210, padding: 6,
            background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, boxShadow: "0 16px 40px -14px rgba(0,0,0,0.4)",
          }}>
            <div className="eyebrow" style={{ padding: "6px 9px 8px" }}>Collections</div>
            {collections.map(c => {
              const on = colls.includes(c.id);
              return (
                <button key={c.id} onClick={() => onToggleColl(book.id, c.id)} style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "8px 9px", borderRadius: 8,
                  border: "none", background: "transparent", color: "var(--ink)", fontSize: 13, textAlign: "left",
                }}>
                  <span style={{ width: 16, height: 16, borderRadius: 5, border: `1.5px solid ${on ? c.color : "var(--line-2)"}`, background: on ? c.color : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                    {on && <I.check size={11} style={{ color: "var(--accent-ink)" }} />}
                  </span>
                  <span style={{ width: 8, height: 8, borderRadius: 5, background: c.color, flex: "none" }} />
                  <span style={{ flex: 1 }}>{c.label}</span>
                </button>
              );
            })}
            <button onClick={onNewColl} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "9px 9px", marginTop: 4, borderRadius: 8, border: "none", borderTop: "1px solid var(--line)", background: "transparent", color: "var(--ink-2)", fontSize: 13, fontWeight: 500 }}>
              <I.folderPlus size={16} /> New collection…
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Ask a category / collection ──────────────────────────────────
function CollectionAsk({ title, scope, books, notes, onClose }) {
  const [q, setQ] = useStateB("");
  const [phase, setPhase] = useStateB("idle");   // idle | thinking | answer
  const [answer, setAnswer] = useStateB(null);

  const suggestions = [
    `What are the through-lines across ${scope === "library" ? "my library" : title}?`,
    "What did I mark most often here?",
    "Summarise the ideas I keep returning to",
  ];

  const run = (text) => {
    const query = (text ?? q).trim();
    if (!query) return;
    setQ(query); setPhase("thinking");
    setTimeout(() => { setAnswer(synthForCategory(query, title, scope, books, notes)); setPhase("answer"); }, 1050);
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 70, background: "rgba(0,0,0,0.34)", animation: "lumeFadeIn 0.22s both", display: "flex", justifyContent: "center", alignItems: "flex-start" }}>
      <div onClick={e => e.stopPropagation()} className="lume-scroll" style={{
        marginTop: "min(12vh, 90px)", width: "min(640px, calc(100% - 32px))", maxHeight: "80vh", overflowY: "auto",
        background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 20,
        boxShadow: "0 30px 80px -30px rgba(0,0,0,0.5)", animation: "lumeScaleIn 0.26s both",
      }}>
        {/* header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "18px 20px 14px", borderBottom: "1px solid var(--line)", position: "sticky", top: 0, background: "var(--surface)", zIndex: 2 }}>
          <span style={{ width: 32, height: 32, borderRadius: 9, background: "color-mix(in srgb, var(--accent) 14%, transparent)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><I.sparkle size={18} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 600 }}>Ask {scope === "library" ? "your library" : title}</div>
            <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{books.length} {books.length === 1 ? "book" : "books"} · {notes.length} marked passages in scope</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "var(--surface-2)", color: "var(--ink-2)", display: "flex", alignItems: "center", justifyContent: "center" }}><I.close size={18} /></button>
        </div>

        {/* input */}
        <div style={{ padding: 20 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", height: 50, padding: "0 8px 0 16px", borderRadius: 14, background: "var(--page)", border: "1px solid var(--line-2)" }}>
            <input value={q} autoFocus onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === "Enter" && run()}
              placeholder={`Ask about ${scope === "library" ? "everything you've read" : title}…`}
              style={{ flex: 1, minWidth: 0, border: "none", background: "none", outline: "none", fontSize: 15, color: "var(--ink)", fontFamily: "var(--read)" }} />
            <button onClick={() => run()} style={{ width: 38, height: 38, borderRadius: 10, border: "none", background: "var(--accent)", color: "var(--accent-ink)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><I.arrowRight size={19} /></button>
          </div>

          {phase === "idle" && (
            <div style={{ marginTop: 18 }}>
              <div className="eyebrow" style={{ marginBottom: 10 }}>Try</div>
              <div style={{ display: "grid", gap: 8 }}>
                {suggestions.map((s, i) => (
                  <button key={i} onClick={() => run(s)} className="row-hover" style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 11,
                    border: "1px solid var(--line)", background: "var(--page)", color: "var(--ink)", textAlign: "left", fontSize: 14, fontFamily: "var(--read)",
                  }}>
                    <I.search size={15} style={{ color: "var(--ink-3)", flex: "none" }} /> {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {phase === "thinking" && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--ink-3)", padding: "22px 2px" }}>
              <I.sparkle size={18} style={{ color: "var(--accent)", animation: "lumeShimmer 1.2s infinite" }} />
              <span style={{ fontFamily: "var(--mono)", fontSize: 13, letterSpacing: "0.04em" }}>reading across {books.length} {books.length === 1 ? "book" : "books"}…</span>
            </div>
          )}

          {phase === "answer" && answer && (
            <div className="lume-enter" style={{ marginTop: 20 }}>
              <p style={{ fontFamily: "var(--read)", fontSize: 17, lineHeight: 1.6, margin: "0 0 24px" }}>{answer.text}</p>
              {answer.sources.length > 0 && (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                    <span className="eyebrow">Cited from your highlights</span>
                    <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
                    <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-3)" }}>{answer.sources.length}</span>
                  </div>
                  <div style={{ display: "grid", gap: 10 }}>
                    {answer.sources.map((s, i) => (
                      <div key={i} style={{ display: "flex", gap: 14, padding: "14px 16px", borderRadius: 12, background: "var(--page)", border: "1px solid var(--line)" }}>
                        <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--accent)", flex: "none", paddingTop: 3 }}>{String(i+1).padStart(2,"0")}</span>
                        <div>
                          <div style={{ fontFamily: "var(--read)", fontSize: 15, lineHeight: 1.45 }}>"{s.text}"</div>
                          <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 7 }}>{s.book}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Canned-but-plausible synthesis grounded in the category's actual notes.
function synthForCategory(query, title, scope, books, notes) {
  const where = scope === "library" ? "your library" : `“${title}”`;
  if (notes.length === 0) {
    return { text: `You haven't marked any passages in ${where} yet. Once you highlight while reading, Lume can synthesize answers from your own notes here.`, sources: [] };
  }
  const lo = query.toLowerCase();
  let picked = notes;
  if (/(time|mortal|death)/.test(lo)) picked = notes.filter(n => /time|eternit|death|mortal|change|past/i.test(n.text));
  else if (/(self|simpl|deliberate|live)/.test(lo)) picked = notes.filter(n => /self|simpl|deliberate|live|mind|content/i.test(n.text));
  else if (/(most|mark|return)/.test(lo)) picked = [...notes].sort((a,b) => (b.note?1:0)-(a.note?1:0));
  if (picked.length === 0) picked = notes;
  const sources = picked.slice(0, 4).map(n => ({ text: n.text, book: n.book }));
  const bookList = Array.from(new Set(sources.map(s => s.book)));
  const text = `Across the ${notes.length} passage${notes.length===1?"":"s"} you've marked in ${where}, the thread that keeps surfacing is attention as a deliberate act — choosing what to notice rather than drifting. ${bookList.length > 1 ? `${bookList.slice(0,-1).join(", ")} and ${bookList.slice(-1)} circle the same idea from different angles` : `${bookList[0]} returns to it repeatedly`}: that a considered life is built from what you decide to hold onto. Your highlights below are where that argument lives.`;
  return { text, sources };
}

// ── Add your own book (import) ───────────────────────────────────
function ImportSheet({ onClose }) {
  const [stage, setStage] = useStateB("drop");   // drop | reading | done
  const fakeImport = () => {
    setStage("reading");
    setTimeout(() => setStage("done"), 1600);
  };
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 70, background: "rgba(0,0,0,0.34)", display: "flex", justifyContent: "center", alignItems: "flex-start", animation: "lumeFadeIn 0.22s both" }}>
      <div onClick={e => e.stopPropagation()} style={{
        marginTop: "min(13vh, 100px)", width: "min(500px, calc(100% - 32px))",
        background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 20,
        boxShadow: "0 30px 80px -30px rgba(0,0,0,0.5)", animation: "lumeScaleIn 0.26s both", padding: 24,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Add a book</div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "var(--surface-2)", color: "var(--ink-2)", display: "flex", alignItems: "center", justifyContent: "center" }}><I.close size={18} /></button>
        </div>

        {stage === "drop" && (
          <div className="lume-enter">
            <button onClick={fakeImport} style={{
              width: "100%", padding: "44px 20px", borderRadius: 16, border: "2px dashed var(--line-2)", background: "var(--page)",
              color: "var(--ink-2)", display: "flex", flexDirection: "column", alignItems: "center", gap: 14, cursor: "pointer",
            }}>
              <span style={{ width: 56, height: 56, borderRadius: 16, background: "color-mix(in srgb, var(--accent) 12%, transparent)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}><I.upload size={26} /></span>
              <span style={{ fontFamily: "var(--read)", fontSize: 18, color: "var(--ink)" }}>Drop an EPUB or PDF</span>
              <span style={{ fontSize: 13, color: "var(--ink-3)" }}>or click to choose a file</span>
            </button>
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              {[["EPUB","Reflowable, best for novels"],["PDF","Papers & fixed layouts"]].map(([t, d]) => (
                <div key={t} style={{ flex: 1, padding: "14px 16px", borderRadius: 12, background: "var(--page)", border: "1px solid var(--line)" }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 11.5, fontWeight: 700, color: "var(--accent)" }}>{t}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4, lineHeight: 1.4 }}>{d}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {stage === "reading" && (
          <div className="lume-enter" style={{ textAlign: "center", padding: "30px 10px" }}>
            <I.spark size={28} style={{ color: "var(--accent)", animation: "lumeShimmer 1.2s infinite" }} />
            <div style={{ fontFamily: "var(--mono)", fontSize: 13, letterSpacing: "0.04em", color: "var(--ink-2)", marginTop: 14 }}>parsing chapters & building your reader…</div>
          </div>
        )}

        {stage === "done" && (
          <div className="lume-enter" style={{ textAlign: "center", padding: "20px 10px" }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "color-mix(in srgb, var(--tag-idea) 16%, transparent)", color: "var(--tag-idea)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}><I.check size={28} /></div>
            <div style={{ fontFamily: "var(--read)", fontSize: 20, marginBottom: 6 }}>Added to your library</div>
            <div style={{ fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.5, marginBottom: 22, maxWidth: 340, marginLeft: "auto", marginRight: "auto" }}>
              Lume detected the chapters and it's ready to read — it'll appear under <b>Unsorted</b> so you can file it.
            </div>
            <button onClick={onClose} style={{ ...window.lumeStyles.primaryBtn, padding: "12px 22px" }}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}

window.Browse = Browse;
window.CollectionAsk = CollectionAsk;
