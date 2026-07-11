// lume-papers.jsx — the Papers library view (reference reading) → window.PapersView
const { useState: useStatePp, useMemo: useMemoPp, useEffect: useEffectPp, useRef: useRefPp } = React;

const PAPER_READ = {
  unread:  { label: "Unread",  color: "var(--ink-3)" },
  skimmed: { label: "Skimmed", color: "var(--tag-beautiful)" },
  read:    { label: "Read",    color: "var(--tag-idea)" },
};
const READ_ORDER = ["unread", "skimmed", "read"];

const lastName = (a) => (a || "").trim().split(/\s+/).slice(-1)[0] || "";
const loadReadState = () => { try { return JSON.parse(localStorage.getItem("lume_paper_read") || "{}"); } catch (e) { return {}; } };
const loadDownloadedP = () => { try { return JSON.parse(localStorage.getItem("lume_downloaded") || "[]"); } catch (e) { return []; } };

// Bring in any papers the user downloaded from Discover that aren't already shelved.
function libraryPapers() {
  const base = window.PAPERS.slice();
  const have = new Set(base.map(p => p.id));
  const cat = window.DISCOVER_CATALOG || [];
  loadDownloadedP().forEach(id => {
    if (have.has(id)) return;
    const c = cat.find(x => x.id === id && x.type === "paper");
    if (!c) return;
    base.push({ id: c.id, title: c.title, authors: [c.author], venue: c.venue, year: c.year,
      topics: c.topics, read: "unread", added: 0, annotations: 0, pages: c.pages, abstract: c.about || c.blurb, refs: [], coll: [], _new: true });
  });
  return base;
}

const PAPER_QUICK = [
  { id: "all",     label: "All",     test: () => true },
  { id: "unread",  label: "Unread",  test: p => p.read === "unread" },
  { id: "skimmed", label: "Skimmed", test: p => p.read === "skimmed" },
  { id: "read",    label: "Read",    test: p => p.read === "read" },
  { id: "marked",  label: "Annotated", test: p => (p.annotations || 0) > 0 },
];

// ══ PAPERS VIEW ══════════════════════════════════════════════════════════
function PapersView({ onGoto, collections: propColls, membership: propMem, onToggleColl, onNewColl }) {
  const S = window.lumeStyles;
  // Collections + membership come from Browse (shared with Books); fall back to internal if rendered alone.
  const [intColls, setIntColls] = useStatePp(() => window.COLLECTIONS);
  const [intMem, setIntMem] = useStatePp(() => { const m = {}; window.PAPERS.forEach(p => m[p.id] = [...(p.coll || [])]); return m; });
  const collections = propColls || intColls;
  const membership = propMem || intMem;
  const toggleColl = onToggleColl || ((id, c) => setIntMem(m => { const cur = m[id] || []; return { ...m, [id]: cur.includes(c) ? cur.filter(x => x !== c) : [...cur, c] }; }));
  const addColl = onNewColl || (() => { const label = (prompt("Name your collection") || "").trim(); if (!label) return; setIntColls(cs => [...cs, { id: "c" + Date.now(), label, color: "#3E7C8B" }]); });

  const [readState, setReadState] = useStatePp(loadReadState);   // id -> read|skimmed|unread overrides
  const [cat, setCat] = useStatePp("__all");        // __all | __unsorted | collectionId
  const [shelf, setShelf] = useStatePp("all");
  const [groupBy, setGroupBy] = useStatePp("none");
  const [sort, setSort] = useStatePp("recent");
  const [q, setQ] = useStatePp("");
  const [topic, setTopic] = useStatePp(null);
  const [active, setActive] = useStatePp(null);
  const [menuFor, setMenuFor] = useStatePp(null);
  const [importing, setImporting] = useStatePp(false);

  useEffectPp(() => { localStorage.setItem("lume_paper_read", JSON.stringify(readState)); }, [readState]);
  useEffectPp(() => {
    if (!menuFor) return;
    const h = () => setMenuFor(null);
    window.addEventListener("click", h); return () => window.removeEventListener("click", h);
  }, [menuFor]);

  const papers = useMemoPp(() => libraryPapers().map(p => ({ ...p, read: readState[p.id] || p.read })), [readState]);
  const setRead = (id, v) => setReadState(s => ({ ...s, [id]: v }));
  const citedBy = (id) => papers.filter(p => (p.refs || []).some(r => r.id === id));
  const collsOf = (p) => membership[p.id] || [];

  const total = papers.length;
  const unsortedCount = papers.filter(p => collsOf(p).length === 0).length;

  // papers in the active category (before quick/topic/search filters) — for chip counts
  const inCategory = useMemoPp(() => papers.filter(p => {
    if (cat === "__unsorted") return collsOf(p).length === 0;
    if (cat !== "__all") return collsOf(p).includes(cat);
    return true;
  }), [papers, cat, membership]);

  const result = useMemoPp(() => {
    const qf = PAPER_QUICK.find(s => s.id === shelf) || PAPER_QUICK[0];
    let list = inCategory.filter(p => {
      if (!qf.test(p)) return false;
      if (topic && !(p.topics || []).includes(topic)) return false;
      if (q) { const hay = (p.title + " " + p.authors.join(" ") + " " + p.venue + " " + p.topics.join(" ")).toLowerCase(); if (!hay.includes(q.toLowerCase())) return false; }
      return true;
    });
    const by = {
      recent:    (a, b) => a.added - b.added,
      year:      (a, b) => b.year - a.year,
      venue:     (a, b) => a.venue.localeCompare(b.venue),
      author:    (a, b) => lastName(a.authors[0]).localeCompare(lastName(b.authors[0])),
      annotated: (a, b) => (b.annotations || 0) - (a.annotations || 0),
    };
    return [...list].sort(by[sort]);
  }, [inCategory, shelf, topic, q, sort]);

  const groups = useMemoPp(() => {
    if (groupBy === "none") return [{ key: null, items: result }];
    const map = new Map();
    const push = (k, p) => { if (!map.has(k)) map.set(k, []); map.get(k).push(p); };
    result.forEach(p => {
      if (groupBy === "venue") push(p.venue, p);
      else if (groupBy === "decade") push(`${Math.floor(p.year / 10) * 10}s`, p);
      else if (groupBy === "read") push(PAPER_READ[p.read].label, p);
      else if (groupBy === "topic") (p.topics || ["—"]).forEach(t => push(t, p));
    });
    let entries = [...map.entries()].map(([key, items]) => ({ key, items }));
    entries.sort((a, b) => groupBy === "decade" ? String(b.key).localeCompare(String(a.key)) : b.items.length - a.items.length || String(a.key).localeCompare(String(b.key)));
    return entries;
  }, [result, groupBy]);

  const selectCat = (id) => { setCat(id); setTopic(null); setShelf("all"); };
  const activeColl = collections.find(c => c.id === cat);
  const activeTitle = cat === "__unsorted" ? "Unsorted" : cat === "__all" ? "All papers" : (activeColl?.label || "Collection");
  const unreadN = inCategory.filter(p => p.read === "unread").length;

  return (
    <div className="lume-enter" style={{ minWidth: 0 }}>
      <div className="brz-layout" style={{ display: "flex", gap: 30, alignItems: "flex-start" }}>

        {/* ── ORGANIZER RAIL ─────────────────────────────────── */}
        <aside className="brz-rail" style={{ width: 224, flex: "none" }}>
          <button onClick={() => setImporting(true)} style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", marginBottom: 18,
            padding: "11px 14px", borderRadius: 11, border: "none", background: "var(--accent)", color: "var(--accent-ink)", fontSize: 13.5, fontWeight: 600,
          }}>
            <I.plus size={17} /> Add a paper
          </button>
          <div className="eyebrow" style={{ marginBottom: 16 }}>Papers · {total}</div>

          <div className="brz-rail-group brz-list">
            <RailLabel>Library</RailLabel>
            <RailItem icon="doc" label="All papers" count={total} on={cat === "__all"} onClick={() => selectCat("__all")} />
            <RailItem icon="inbox" label="Unsorted" count={unsortedCount} accent on={cat === "__unsorted"} onClick={() => selectCat("__unsorted")} />
          </div>

          <div className="brz-rail-group brz-list" style={{ marginTop: 22 }}>
            <RailLabel>Collections</RailLabel>
            {collections.map(c => {
              const count = papers.filter(p => collsOf(p).includes(c.id)).length;
              return <RailItem key={c.id} dot={c.color} label={c.label} count={count} on={cat === c.id} onClick={() => selectCat(c.id)} />;
            })}
            <button onClick={addColl} className="brz-newcoll" style={{
              display: "flex", alignItems: "center", gap: 10, padding: "9px 11px", borderRadius: 10, width: "100%",
              border: "1px dashed var(--line-2)", background: "transparent", color: "var(--ink-3)", fontSize: 13, fontWeight: 500,
            }}>
              <I.folderPlus size={17} /> New collection
            </button>
          </div>
        </aside>

        {/* ── MAIN ───────────────────────────────────────────── */}
        <main className="brz-main" style={{ flex: 1, minWidth: 0 }}>
          {/* header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
            <div style={{ minWidth: 0 }}>
              <h1 style={{ fontFamily: "var(--read)", fontWeight: 400, fontSize: "clamp(26px, 4vw, 36px)", margin: 0, letterSpacing: "-0.01em" }}>{activeTitle}</h1>
              <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 6 }}>
                {result.length} {result.length === 1 ? "paper" : "papers"}{unreadN > 0 && <> · <b style={{ color: "var(--accent)" }}>{unreadN} unread</b></>}
                {topic && <span> · filtered by <b style={{ color: "var(--ink-2)" }}>{topic}</b></span>}
              </div>
            </div>
            <button onClick={() => onGoto && onGoto("discover")} className="brz-ask-btn" style={{
              display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 30, flex: "none",
              border: "1px solid var(--accent)", background: "color-mix(in srgb, var(--accent) 10%, transparent)", color: "var(--accent)", fontSize: 13.5, fontWeight: 600,
            }}>
              <I.compass size={17} /> <span className="brz-ask-lbl">Find papers</span>
            </button>
          </div>

          {/* read-state chips */}
          <div className="brz-quick lume-scroll" style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", paddingBottom: 2 }}>
            {PAPER_QUICK.map(s => {
              const c = inCategory.filter(s.test).length;
              const on = shelf === s.id;
              if (s.id !== "all" && c === 0) return null;
              return (
                <button key={s.id} onClick={() => setShelf(s.id)} style={{
                  display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 13px", borderRadius: 30, flex: "none",
                  border: `1px solid ${on ? "var(--accent)" : "var(--line-2)"}`, background: on ? "var(--accent)" : "transparent",
                  color: on ? "var(--accent-ink)" : "var(--ink-2)", fontSize: 13, fontWeight: on ? 600 : 500,
                }}>{s.label}<span style={{ fontFamily: "var(--mono)", fontSize: 11, opacity: on ? 0.85 : 0.55 }}>{c}</span></button>
              );
            })}
          </div>

          {/* toolbar */}
          <div className="brz-toolbar" style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 22, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, flex: "1 1 200px", minWidth: 0, height: 40, padding: "0 13px", borderRadius: 10, background: "var(--surface)", border: "1px solid var(--line)" }}>
              <I.search size={17} style={{ color: "var(--ink-3)", flex: "none" }} />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search papers, authors, venues…"
                style={{ flex: 1, minWidth: 0, border: "none", background: "none", outline: "none", fontSize: 13.5, color: "var(--ink)", fontFamily: "var(--ui)" }} />
            </div>
            <Select label="Group" value={groupBy} icon="layers"
              options={[["none", "No grouping"], ["venue", "Venue"], ["decade", "Decade"], ["topic", "Topic"], ["read", "Status"]]} onChange={setGroupBy} />
            <Select label="Sort" value={sort} icon="align"
              options={[["recent", "Recently added"], ["year", "Year"], ["venue", "Venue"], ["author", "Author"], ["annotated", "Most annotated"]]} onChange={setSort} />
            {topic && <button onClick={() => setTopic(null)} style={{ ...S.chip(true), fontSize: 12, gap: 6, display: "inline-flex", alignItems: "center" }}>{topic} <I.close size={13} /></button>}
          </div>

          {/* unsorted triage banner */}
          {cat === "__unsorted" && result.length > 0 && (
            <div style={{ display: "flex", gap: 14, alignItems: "center", padding: "16px 18px", borderRadius: 14, marginBottom: 22,
              background: "color-mix(in srgb, var(--accent) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--accent) 28%, var(--line))" }}>
              <I.inbox size={22} style={{ color: "var(--accent)", flex: "none" }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{result.length} papers aren't in a collection</div>
                <div style={{ fontSize: 12.5, color: "var(--ink-2)", marginTop: 2 }}>File each into a collection — they can sit alongside the books on the same theme.</div>
              </div>
            </div>
          )}

          {/* body */}
          {result.length === 0 ? (
            <div style={{ textAlign: "center", padding: "70px 20px", color: "var(--ink-3)" }}>
              <I.doc size={30} style={{ opacity: 0.4 }} />
              <p style={{ fontSize: 14, marginTop: 14 }}>No papers here yet.</p>
            </div>
          ) : (
            groups.map((g, gi) => (
              <section key={g.key || gi} style={{ marginBottom: g.key ? 28 : 0 }}>
                {g.key && (
                  <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "8px 0 12px" }}>
                    <h3 style={{ fontFamily: "var(--ui)", fontSize: 13, fontWeight: 700, letterSpacing: "0.02em", margin: 0, color: "var(--ink-2)" }}>{g.key}</h3>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-3)" }}>{g.items.length}</span>
                    <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
                  </div>
                )}
                <div>
                  {g.items.map((p, i) => (
                    <PaperRow key={p.id} paper={p} last={i === g.items.length - 1} citedByN={citedBy(p.id).length}
                      colls={collsOf(p)} collections={collections}
                      menuOpen={menuFor === p.id} onMenu={() => setMenuFor(menuFor === p.id ? null : p.id)}
                      onToggleColl={toggleColl} onNewColl={addColl}
                      onOpen={() => setActive(p.id)} onTopic={setTopic}
                      onCycle={() => setRead(p.id, READ_ORDER[(READ_ORDER.indexOf(p.read) + 1) % 3])} />
                  ))}
                </div>
              </section>
            ))
          )}
        </main>
      </div>

      {active && (
        <PaperDrawer paper={papers.find(p => p.id === active)} all={papers} citedBy={citedBy}
          colls={collsOf(papers.find(p => p.id === active) || {})} collections={collections}
          onClose={() => setActive(null)} onOpen={(id) => setActive(id)} onSetRead={setRead} />
      )}
      {importing && <PaperImportSheet onClose={() => setImporting(false)} />}
    </div>
  );
}

// ── A dense paper row ─────────────────────────────────────────────────
function PaperRow({ paper, last, citedByN, colls, collections, menuOpen, onMenu, onToggleColl, onNewColl, onOpen, onTopic, onCycle }) {
  const st = PAPER_READ[paper.read];
  return (
    <div className="row-hover" style={{
      display: "flex", gap: 16, alignItems: "center", padding: "14px 12px", borderRadius: 12,
      borderBottom: last ? "none" : "1px solid var(--line)", position: "relative",
    }}>
      {/* status dot — click to cycle */}
      <button onClick={onCycle} title={`${st.label} · click to change`} style={{
        width: 30, height: 30, borderRadius: 9, border: "none", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", flex: "none",
      }}>
        <span style={{ width: 11, height: 11, borderRadius: 7, border: `2px solid ${st.color}`, background: paper.read === "read" ? st.color : paper.read === "skimmed" ? `color-mix(in srgb, ${st.color} 45%, transparent)` : "transparent" }} />
      </button>

      <button onClick={onOpen} style={{ display: "flex", gap: 14, alignItems: "center", flex: 1, minWidth: 0, border: "none", background: "none", color: "var(--ink)", textAlign: "left", padding: 0, cursor: "pointer" }}>
        <span style={{ width: 34, height: 44, borderRadius: 5, background: "var(--surface-2)", border: "1px solid var(--line)", color: "var(--ink-3)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><I.doc size={17} /></span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontFamily: "var(--read)", fontSize: 17, lineHeight: 1.22, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{paper.title}</span>
          <span style={{ display: "block", fontSize: 12.5, color: "var(--ink-2)", marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {paper.authors.join(", ")} · <span style={{ fontStyle: "italic" }}>{paper.venue}</span> · {paper.year}
          </span>
        </span>
      </button>

      {/* topics */}
      <div className="brz-row-topics" style={{ display: "flex", gap: 6, flex: "none" }}>
        {(paper.topics || []).slice(0, 2).map(t => (
          <button key={t} onClick={(e) => { e.stopPropagation(); onTopic(t); }} style={{
            padding: "3px 9px", borderRadius: 20, border: "1px solid var(--line-2)", background: "transparent", color: "var(--ink-3)", fontSize: 11, fontWeight: 500, fontFamily: "var(--ui)",
          }}>{t}</button>
        ))}
      </div>

      {/* cited by */}
      {citedByN > 0 && (
        <span className="brz-row-status" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--ink-3)", fontFamily: "var(--ui)", flex: "none", minWidth: 70, justifyContent: "flex-end" }} title={`Cited by ${citedByN} in your library`}>
          <I.link size={14} /> {citedByN} cite{citedByN === 1 ? "" : "s"}
        </span>
      )}

      {/* annotations */}
      {(paper.annotations || 0) > 0 && (
        <span className="brz-row-marked" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--ink-3)", fontFamily: "var(--ui)", flex: "none" }}>
          <I.highlight size={14} /> {paper.annotations}
        </span>
      )}

      {/* collection dots */}
      <div style={{ display: "flex", gap: 3, flex: "none", width: 26, justifyContent: "flex-end" }}>
        {colls.slice(0, 3).map(cid => { const c = collections.find(x => x.id === cid); return c ? <span key={cid} style={{ width: 7, height: 7, borderRadius: 5, background: c.color }} title={c.label} /> : null; })}
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
                <button key={c.id} onClick={() => onToggleColl(paper.id, c.id)} style={{
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

// ── Paper detail drawer ────────────────────────────────────────────────
function PaperDrawer({ paper, all, citedBy, colls, collections, onClose, onOpen, onSetRead }) {
  useEffectPp(() => { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }, []);
  if (!paper) return null;
  const cb = citedBy(paper.id);
  const refsInLib = (paper.refs || []).filter(r => r.id && all.some(p => p.id === r.id));
  const refsExt = (paper.refs || []).filter(r => !(r.id && all.some(p => p.id === r.id)));
  const myColls = (colls || []).map(cid => collections.find(c => c.id === cid)).filter(Boolean);

  const RefRow = ({ title, sub, linkId }) => (
    <button onClick={() => linkId && onOpen(linkId)} className={linkId ? "row-hover" : ""} style={{
      display: "flex", alignItems: "center", gap: 13, padding: "11px 12px", borderRadius: 11, width: "100%", textAlign: "left",
      border: "none", background: "transparent", cursor: linkId ? "pointer" : "default", color: "var(--ink)",
    }}>
      <span style={{ width: 32, height: 42, borderRadius: 5, background: linkId ? "color-mix(in srgb, var(--accent) 12%, var(--surface))" : "var(--surface-2)", border: "1px solid var(--line)", color: linkId ? "var(--accent)" : "var(--ink-3)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><I.doc size={15} /></span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontFamily: "var(--read)", fontSize: 14.5, lineHeight: 1.25 }}>{title}</span>
        <span style={{ display: "block", fontSize: 12, color: "var(--ink-3)", marginTop: 3 }}>{sub}</span>
      </span>
      {linkId
        ? <I.arrowRight size={16} style={{ color: "var(--ink-3)", flex: "none" }} />
        : <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-3)", flex: "none", letterSpacing: "0.06em" }}>EXT</span>}
    </button>
  );

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(0,0,0,0.4)", animation: "lumeFadeIn 0.22s both", display: "flex", justifyContent: "flex-end" }}>
      <div onClick={e => e.stopPropagation()} className="lume-scroll" style={{
        width: "min(480px, 100%)", height: "100%", overflowY: "auto", background: "var(--bg)",
        borderLeft: "1px solid var(--line)", boxShadow: "-30px 0 80px -30px rgba(0,0,0,0.5)", animation: "lumeDrawerIn 0.34s cubic-bezier(0.2,0.7,0.2,1) both",
      }}>
        <div style={{ position: "sticky", top: 0, zIndex: 3, display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", background: "color-mix(in srgb, var(--bg) 88%, transparent)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--line)" }}>
          <span className="eyebrow" style={{ color: "var(--accent)" }}>Paper · {paper.venue}</span>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 9, border: "none", background: "var(--surface-2)", color: "var(--ink-2)", display: "flex", alignItems: "center", justifyContent: "center" }}><I.close size={18} /></button>
        </div>

        <div style={{ padding: "26px 26px 44px" }}>
          <span style={{ width: 46, height: 46, borderRadius: 12, background: "color-mix(in srgb, var(--accent) 14%, transparent)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}><I.doc size={24} /></span>
          <h1 style={{ fontFamily: "var(--read)", fontWeight: 400, fontSize: 26, lineHeight: 1.18, margin: 0, letterSpacing: "-0.01em" }}>{paper.title}</h1>
          <div style={{ fontSize: 14, color: "var(--ink-2)", marginTop: 10 }}>{paper.authors.join(", ")}</div>
          <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 3, fontStyle: "italic" }}>{paper.venue}, {paper.year}</div>

          {/* collections this paper belongs to */}
          {myColls.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 16 }}>
              {myColls.map(c => (
                <span key={c.id} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 11px", borderRadius: 30, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 12, color: "var(--ink-2)", fontWeight: 500 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 5, background: c.color }} /> {c.label}
                </span>
              ))}
            </div>
          )}

          {/* read-state segmented control */}
          <div style={{ display: "flex", gap: 4, padding: 4, borderRadius: 12, background: "var(--surface-2)", border: "1px solid var(--line)", marginTop: 18 }}>
            {READ_ORDER.map(k => {
              const on = paper.read === k;
              return (
                <button key={k} onClick={() => onSetRead(paper.id, k)} style={{
                  flex: 1, padding: "9px 0", borderRadius: 9, border: "none", fontSize: 13, fontWeight: on ? 600 : 500,
                  background: on ? "var(--surface)" : "transparent", color: on ? PAPER_READ[k].color : "var(--ink-3)",
                  boxShadow: on ? "0 1px 3px rgba(0,0,0,0.08)" : "none", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
                }}>
                  <span style={{ width: 9, height: 9, borderRadius: 6, border: `2px solid ${PAPER_READ[k].color}`, background: k === "read" ? PAPER_READ[k].color : k === "skimmed" ? `color-mix(in srgb, ${PAPER_READ[k].color} 45%, transparent)` : "transparent" }} />
                  {PAPER_READ[k].label}
                </button>
              );
            })}
          </div>

          <p style={{ fontFamily: "var(--read)", fontSize: 16.5, lineHeight: 1.62, color: "var(--ink)", margin: "24px 0 0" }}>{paper.abstract}</p>

          {/* meta strip */}
          <div style={{ display: "flex", gap: 26, margin: "24px 0", padding: "16px 0", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
            {[["Year", paper.year], ["Pages", paper.pages], ["Notes", paper.annotations || 0], ["Cited by", cb.length]].map(([k, v]) => (
              <div key={k}>
                <div style={{ fontFamily: "var(--read)", fontSize: 19, lineHeight: 1, color: "var(--ink)" }}>{v}</div>
                <div className="eyebrow" style={{ marginTop: 6 }}>{k}</div>
              </div>
            ))}
          </div>

          <button style={{ ...window.lumeStyles.secondaryBtn, width: "100%", justifyContent: "center" }}>
            <I.doc size={17} /> Open PDF <I.arrowRight size={14} style={{ opacity: 0.6 }} />
          </button>

          {/* annotations */}
          {(paper.marks || []).length > 0 && (
            <div style={{ marginTop: 30 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span className="eyebrow">Your highlights</span>
                <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
                <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-3)" }}>{paper.marks.length}</span>
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                {paper.marks.map((m, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, padding: "13px 15px", borderRadius: 12, background: "var(--surface)", border: "1px solid var(--line)" }}>
                    <span style={{ width: 3, borderRadius: 3, background: "var(--accent)", flex: "none" }} />
                    <div style={{ fontFamily: "var(--read)", fontSize: 14.5, lineHeight: 1.45 }}>{m}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* references */}
          {(refsInLib.length + refsExt.length) > 0 && (
            <div style={{ marginTop: 30 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span className="eyebrow">References</span>
                <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
                <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-3)" }}>{refsInLib.length + refsExt.length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {refsInLib.map(r => <RefRow key={r.id} title={r.title} sub={`${r.author} · ${r.year} · in your library`} linkId={r.id} />)}
                {refsExt.map((r, i) => <RefRow key={"e" + i} title={r.title} sub={`${r.author} · ${r.year}`} />)}
              </div>
            </div>
          )}

          {/* cited by */}
          {cb.length > 0 && (
            <div style={{ marginTop: 26 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span className="eyebrow">Cited by · in your library</span>
                <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
                <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-3)" }}>{cb.length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {cb.map(p => <RefRow key={p.id} title={p.title} sub={`${p.authors.join(", ")} · ${p.year}`} linkId={p.id} />)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Add a paper (import) ───────────────────────────────────────────────
function PaperImportSheet({ onClose }) {
  const [stage, setStage] = useStatePp("drop");   // drop | reading | done
  const [link, setLink] = useStatePp("");
  const go = () => { setStage("reading"); setTimeout(() => setStage("done"), 1700); };
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(0,0,0,0.34)", display: "flex", justifyContent: "center", alignItems: "flex-start", animation: "lumeFadeIn 0.22s both" }}>
      <div onClick={e => e.stopPropagation()} style={{
        marginTop: "min(13vh, 100px)", width: "min(520px, calc(100% - 32px))",
        background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 20,
        boxShadow: "0 30px 80px -30px rgba(0,0,0,0.5)", animation: "lumeScaleIn 0.26s both", padding: 24,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Add a paper</div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "var(--surface-2)", color: "var(--ink-2)", display: "flex", alignItems: "center", justifyContent: "center" }}><I.close size={18} /></button>
        </div>

        {stage === "drop" && (
          <div className="lume-enter">
            <button onClick={go} style={{
              width: "100%", padding: "40px 20px", borderRadius: 16, border: "2px dashed var(--line-2)", background: "var(--page)",
              color: "var(--ink-2)", display: "flex", flexDirection: "column", alignItems: "center", gap: 14, cursor: "pointer",
            }}>
              <span style={{ width: 56, height: 56, borderRadius: 16, background: "color-mix(in srgb, var(--accent) 12%, transparent)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}><I.doc size={26} /></span>
              <span style={{ fontFamily: "var(--read)", fontSize: 18, color: "var(--ink)" }}>Drop a PDF</span>
              <span style={{ fontSize: 13, color: "var(--ink-3)" }}>or click to choose a file</span>
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "16px 0" }}>
              <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
              <span className="eyebrow">or paste a link</span>
              <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center", height: 48, padding: "0 8px 0 14px", borderRadius: 12, background: "var(--page)", border: "1px solid var(--line-2)" }}>
              <I.link size={17} style={{ color: "var(--ink-3)", flex: "none" }} />
              <input value={link} onChange={e => setLink(e.target.value)} onKeyDown={e => e.key === "Enter" && link.trim() && go()}
                placeholder="arXiv ID, DOI, or URL — e.g. arXiv:1706.03762"
                style={{ flex: 1, minWidth: 0, border: "none", background: "none", outline: "none", fontSize: 13.5, color: "var(--ink)", fontFamily: "var(--ui)" }} />
              <button onClick={() => link.trim() && go()} style={{ width: 36, height: 36, borderRadius: 9, border: "none", background: link.trim() ? "var(--accent)" : "var(--surface-2)", color: link.trim() ? "var(--accent-ink)" : "var(--ink-3)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><I.arrowRight size={18} /></button>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              {[["PDF", "Drop or pick a file"], ["arXiv", "Paste an ID or link"], ["DOI", "Pulls metadata + refs"]].map(([t, d]) => (
                <div key={t} style={{ flex: 1, padding: "12px 14px", borderRadius: 12, background: "var(--page)", border: "1px solid var(--line)" }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 700, color: "var(--accent)" }}>{t}</div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 4, lineHeight: 1.4 }}>{d}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {stage === "reading" && (
          <div className="lume-enter" style={{ textAlign: "center", padding: "34px 10px" }}>
            <I.spark size={28} style={{ color: "var(--accent)", animation: "lumeShimmer 1.2s infinite" }} />
            <div style={{ fontFamily: "var(--mono)", fontSize: 13, letterSpacing: "0.04em", color: "var(--ink-2)", marginTop: 14 }}>fetching metadata & references…</div>
          </div>
        )}

        {stage === "done" && (
          <div className="lume-enter" style={{ textAlign: "center", padding: "20px 10px" }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "color-mix(in srgb, var(--tag-idea) 16%, transparent)", color: "var(--tag-idea)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}><I.check size={28} /></div>
            <div style={{ fontFamily: "var(--read)", fontSize: 20, marginBottom: 6 }}>Added to your papers</div>
            <div style={{ fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.5, marginBottom: 22, maxWidth: 360, marginLeft: "auto", marginRight: "auto" }}>
              Lume pulled the abstract and linked its references — it's under <b>Unsorted</b>, ready to file into a collection.
            </div>
            <button onClick={onClose} style={{ ...window.lumeStyles.primaryBtn, padding: "12px 22px" }}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}

window.PapersView = PapersView;
