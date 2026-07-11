// lume-reader.jsx — the reading environment → window.Reader
const { useState, useRef, useEffect, useMemo } = React;

// Reading-mode presets. Each tunes the reading surface.
const READ_MODES = {
  classic:  { name: "Classic",  icon: "classic",  measure: 34, size: 1.0,  leading: 1.62, align: "left",    font: "var(--read)", track: "0", page: null,    dim: false, justify: false },
  focus:    { name: "Focus",    icon: "focus",    measure: 30, size: 1.04, leading: 1.7,  align: "left",    font: "var(--read)", track: "0", page: null,    dim: true,  justify: false },
  night:    { name: "Night",    icon: "moon",     measure: 34, size: 1.0,  leading: 1.66, align: "left",    font: "var(--read)", track: "0", page: "dark", dim: false, justify: false },
  academic: { name: "Academic", icon: "academic", measure: 40, size: 0.92, leading: 1.9,  align: "justify", font: "var(--read)", track: "0", page: null,    dim: false, justify: true },
  dyslexia: { name: "Dyslexia", icon: "dyslexia", measure: 30, size: 1.06, leading: 1.95, align: "left",    font: "'Hanken Grotesk', sans-serif", track: "0.03em", page: null, dim: false, justify: false },
};

function Reader({ book, onExit, onOpenMemory, tweaks, openAI, focusText, registerChrome }) {
  const [mode, setMode] = useState("classic");
  const [digest, setDigest] = useState(null);     // null | "thread" | "summary" (separate views)
  const [showChrome, setShowChrome] = useState(true);
  const [showType, setShowType] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [showTOC, setShowTOC] = useState(false);
  const [typeSize, setTypeSize] = useState(tweaks.readerSize || 1.0);
  const [leadingAdj, setLeadingAdj] = useState(0);
  const [focusPara, setFocusPara] = useState(1);
  const [highlights, setHighlights] = useState(book.highlights || []);
  const [sel, setSel] = useState(null);          // {p,s, rect}
  const [noteFor, setNoteFor] = useState(null);   // highlight id being annotated
  const [noteDraft, setNoteDraft] = useState("");
  const [toast, setToast] = useState(null);       // transient confirmation
  const [flash, setFlash] = useState(null);       // "p-s" of a passage to spotlight
  const [showSearch, setShowSearch] = useState(false);
  const [lookup, setLookup] = useState(null);     // word being defined
  const [bookmarks, setBookmarks] = useState(() => {
    try { return JSON.parse(localStorage.getItem("lume-bm-" + book.id) || "[]"); } catch { return []; }
  });
  const [listen, setListen] = useState(null);     // { idx, playing, rate } or null
  const [speakingPS, setSpeakingPS] = useState(null);
  const scrollRef = useRef(null);
  const ttsRef = useRef({ stop: false });

  // Flat sentence list for search/TTS
  const flat = useMemo(() => {
    const out = []; (book.paragraphs || []).forEach((para, p) => para.forEach((sent, s) => out.push({ p, s, text: sent })));
    return out;
  }, [book]);

  // Jump to a passage and spotlight it (shared by focus/search/bookmarks).
  const jumpTo = (p, s) => {
    setDigest(null); setShowSearch(false); setFlash(`${p}-${s}`);
    setTimeout(() => {
      const host = scrollRef.current; if (!host) return;
      const el = host.querySelector(`[data-ps="${p}-${s}"]`);
      if (el) { const r = el.getBoundingClientRect(), hr = host.getBoundingClientRect();
        host.scrollTo({ top: host.scrollTop + (r.top - hr.top) - 150, behavior: "smooth" }); }
    }, 120);
    setTimeout(() => setFlash(f => (f === `${p}-${s}` ? null : f)), 3400);
  };

  // Persist bookmarks + restore scroll position per book.
  useEffect(() => {
    try { localStorage.setItem("lume-bm-" + book.id, JSON.stringify(bookmarks)); } catch {}
  }, [bookmarks, book.id]);
  useEffect(() => {
    const host = scrollRef.current; if (!host || focusText) return;
    let saved = 0; try { saved = +(localStorage.getItem("lume-pos-" + book.id) || 0); } catch {}
    if (saved > 0) setTimeout(() => host.scrollTo({ top: saved }), 60);
    const onScroll = () => { try { localStorage.setItem("lume-pos-" + book.id, String(host.scrollTop)); } catch {} };
    host.addEventListener("scroll", onScroll, { passive: true });
    return () => host.removeEventListener("scroll", onScroll);
  }, [book.id]);

  const topParagraph = () => {
    const host = scrollRef.current; if (!host) return 0;
    const ps = host.querySelectorAll("[data-ps]"); const hr = host.getBoundingClientRect();
    for (const el of ps) { const r = el.getBoundingClientRect(); if (r.bottom > hr.top + 90) return +el.dataset.ps.split("-")[0]; }
    return 0;
  };
  const toggleBookmark = () => {
    const p = topParagraph();
    setBookmarks(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p].sort((a,b)=>a-b));
    showToast("bookmark", bookmarks.includes(topParagraph()) ? "Bookmark removed" : "Bookmarked this spot");
  };

  // ── Listen (TTS) ──────────────────────────────────────────────
  const speakFrom = (i) => {
    if (!("speechSynthesis" in window)) { showToast("sound", "Listening isn't supported in this browser"); return; }
    const synth = window.speechSynthesis; synth.cancel(); ttsRef.current.stop = false;
    const rate = (listen && listen.rate) || 1;
    const speakOne = (k) => {
      if (ttsRef.current.stop || k >= flat.length) { setListen(null); setSpeakingPS(null); return; }
      const item = flat[k];
      setListen(l => ({ ...(l || {}), idx: k, playing: true, rate }));
      setSpeakingPS(`${item.p}-${item.s}`);
      const host = scrollRef.current;
      if (host) { const el = host.querySelector(`[data-ps="${item.p}-${item.s}"]`);
        if (el) { const r = el.getBoundingClientRect(), hr = host.getBoundingClientRect();
          if (r.top < hr.top + 80 || r.bottom > hr.bottom - 80) host.scrollTo({ top: host.scrollTop + (r.top - hr.top) - 180, behavior: "smooth" }); } }
      const u = new SpeechSynthesisUtterance(item.text);
      u.rate = rate;
      u.onend = () => { if (!ttsRef.current.stop) speakOne(k + 1); };
      synth.speak(u);
    };
    speakOne(i);
  };
  const startListen = () => { setShowChrome(false); setDigest(null); const i = listen ? listen.idx : 0; setListen({ idx: i, playing: true, rate: 1 }); speakFrom(i); };
  const pauseListen = () => { ttsRef.current.stop = true; window.speechSynthesis && window.speechSynthesis.cancel(); setListen(l => l && ({ ...l, playing: false })); setSpeakingPS(null); };
  const resumeListen = () => speakFrom(listen ? listen.idx : 0);
  const stepListen = (d) => { const ni = Math.max(0, Math.min(flat.length - 1, (listen ? listen.idx : 0) + d)); ttsRef.current.stop = true; window.speechSynthesis && window.speechSynthesis.cancel(); setListen(l => ({ ...(l||{rate:1}), idx: ni, playing: true })); setTimeout(() => speakFrom(ni), 50); };
  const cycleRate = () => { const rates = [0.8,1,1.25,1.5]; const cur = (listen && listen.rate) || 1; const nr = rates[(rates.indexOf(cur)+1) % rates.length]; ttsRef.current.stop = true; window.speechSynthesis && window.speechSynthesis.cancel(); setListen(l => ({ ...(l||{idx:0}), rate: nr, playing: true })); setTimeout(() => speakFrom(listen ? listen.idx : 0), 50); };
  const stopListen = () => { ttsRef.current.stop = true; window.speechSynthesis && window.speechSynthesis.cancel(); setListen(null); setSpeakingPS(null); };
  useEffect(() => () => { ttsRef.current.stop = true; window.speechSynthesis && window.speechSynthesis.cancel(); }, []);

  // Jump to + spotlight a passage when arriving from a note / card.
  useEffect(() => {
    if (!focusText || !book.paragraphs) return;
    const needle = focusText.replace(/[“”‘’"']/g, "").replace(/[….]+$/, "").trim().toLowerCase().slice(0, 26);
    let found = null;
    book.paragraphs.forEach((para, p) => para.forEach((sent, s) => {
      if (!found && needle && sent.toLowerCase().includes(needle)) found = { p, s };
    }));
    if (!found) return;
    const t = setTimeout(() => jumpTo(found.p, found.s), 360);
    return () => clearTimeout(t);
  }, [focusText, book]);

  const M = READ_MODES[mode];
  const isDark = M.page === "dark";

  // hide popovers when chrome hides
  useEffect(() => { if (!showChrome) { setShowType(false); setShowMore(false); setShowTOC(false); setShowSearch(false); } }, [showChrome]);

  const hlFor = (p, s) => highlights.find(h => h.p === p && h.s === s);

  const toggleHighlight = (p, s, tag) => {
    setHighlights(prev => {
      const ex = prev.find(h => h.p === p && h.s === s);
      if (ex) {
        if (ex.tag === tag) return prev.filter(h => h !== ex);      // same tag → remove
        return prev.map(h => h === ex ? { ...h, tag } : h);          // change tag
      }
      return [...prev, { id: "h" + Date.now(), p, s, tag, note: "", date: "Today" }];
    });
  };

  const onSentenceTap = (p, s, e) => {
    if (digest) return;
    e.stopPropagation();
    const r = e.currentTarget.getBoundingClientRect();
    const host = scrollRef.current.getBoundingClientRect();
    setSel({ p, s, top: r.top - host.top, bottom: r.bottom - host.top, left: r.left - host.left, width: r.width });
    setShowChrome(false);
  };

  const closeSel = () => { setSel(null); setNoteFor(null); setNoteDraft(""); };

  const showToast = (icon, msg) => { setToast({ icon, msg }); setTimeout(() => setToast(t => (t && t.msg === msg ? null : t)), 2400); };
  const makeCard = () => {
    if (!sel) return;
    if (!hlFor(sel.p, sel.s)) toggleHighlight(sel.p, sel.s, "idea");
    showToast("cards", "Card generated — added to your deck");
    closeSel();
  };

  const startNote = () => {
    if (!sel) return;
    const ex = hlFor(sel.p, sel.s);
    if (!ex) toggleHighlight(sel.p, sel.s, "idea");
    setNoteFor(`${sel.p}-${sel.s}`);
    setNoteDraft(ex?.note || "");
  };
  const saveNote = () => {
    const [p, s] = noteFor.split("-").map(Number);
    setHighlights(prev => prev.map(h => h.p === p && h.s === s ? { ...h, note: noteDraft } : h));
    closeSel();
  };

  // total highlight count for chrome
  const hlCount = highlights.length;

  const pageStyle = isDark
    ? { background: "#15171A", color: "#D8D2C6" }
    : { background: "var(--page)", color: "var(--ink)" };

  const fsize = (M.size * typeSize);

  return (
    <div className="lume-scroll" ref={scrollRef} onClick={() => { setShowChrome(s => !s); closeSel(); }}
      style={{ position: "absolute", inset: 0, overflowY: "auto", ...pageStyle, transition: "background 0.4s, color 0.4s" }}>

      {/* ── TOP CHROME ─────────────────────────────────────────── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 30,
        transform: showChrome ? "none" : "translateY(-102%)",
        transition: "transform 0.32s cubic-bezier(0.2,0.7,0.2,1)",
      }} onClick={e => e.stopPropagation()}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8, padding: "13px 16px",
          background: isDark ? "rgba(21,23,26,0.86)" : "color-mix(in srgb, var(--page) 86%, transparent)",
          backdropFilter: "blur(14px)", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "var(--line)"}`,
        }}>
          <button onClick={onExit} style={iconBtn(isDark)}><I.back size={20} /></button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "var(--read)", fontSize: 16, fontWeight: 500, lineHeight: 1.1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{book.title}</div>
            <div style={{ fontSize: 11.5, color: isDark ? "#8A857A" : "var(--ink-3)", marginTop: 2, fontFamily: "var(--ui)" }}>
              {digest === "thread" ? "Thread digest" : digest === "summary" ? "Summary" : `Ch. ${book.chapterNo} · ${book.chapterTitle}`}
            </div>
          </div>
          {/* Primary actions */}
          <button onClick={() => { setShowSearch(v => !v); setShowType(false); setShowTOC(false); setShowMore(false); }}
            style={iconBtn(isDark, showSearch)} title="Search in book"><I.search size={19} /></button>
          <button onClick={() => { listen ? stopListen() : startListen(); }}
            style={iconBtn(isDark, !!listen)} title="Listen"><I.sound size={19} /></button>
          <span style={{ width: 1, height: 22, background: isDark ? "rgba(255,255,255,0.12)" : "var(--line)", flex: "none", margin: "0 2px" }} />
          <button onClick={() => { setShowType(t => !t); setShowTOC(false); setShowMore(false); setShowSearch(false); }}
            style={iconBtn(isDark, showType)} title="Display"><I.type size={19} /></button>
          <button onClick={() => { setShowMore(m => !m); setShowType(false); setShowTOC(false); setShowSearch(false); }}
            style={iconBtn(isDark, showMore || showTOC || !!digest)} title="More"><I.more size={19} /></button>
        </div>

        {/* progress hairline */}
        <div style={{ height: 2, background: isDark ? "rgba(255,255,255,0.07)" : "var(--line)" }}>
          <div style={{ height: "100%", width: `${book.progress * 100}%`, background: "var(--accent)" }} />
        </div>

        {/* DISPLAY — reading mode + typography combined */}
        {showType && (
          <div className="lume-enter lume-scroll" style={{ ...popover(isDark), maxHeight: "74vh", overflowY: "auto" }}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>Reading mode</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {Object.entries(READ_MODES).map(([k, m]) => {
                const on = k === mode && !digest;
                return (
                  <button key={k} onClick={() => { setMode(k); setDigest(null); }} style={{
                    display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 9,
                    padding: "12px 12px", borderRadius: 12, textAlign: "left",
                    border: `1px solid ${on ? "var(--accent)" : (isDark ? "rgba(255,255,255,0.1)" : "var(--line)")}`,
                    background: on ? "color-mix(in srgb, var(--accent) 12%, transparent)" : "transparent",
                    color: "inherit",
                  }}>
                    <Glyph name={m.icon} size={20} style={{ color: on ? "var(--accent)" : "inherit", opacity: on ? 1 : 0.7 }} />
                    <span style={{ fontSize: 13, fontWeight: on ? 600 : 500 }}>{m.name}</span>
                  </button>
                );
              })}
            </div>
            <div className="eyebrow" style={{ margin: "18px 0 12px" }}>Typography</div>
            <Stepper label="Type size" value={`${Math.round(fsize*100)}%`}
              onMinus={() => setTypeSize(v => Math.max(0.8, +(v-0.05).toFixed(2)))}
              onPlus={() => setTypeSize(v => Math.min(1.5, +(v+0.05).toFixed(2)))} isDark={isDark} />
            <Stepper label="Line height" value={(M.leading + leadingAdj).toFixed(2)}
              onMinus={() => setLeadingAdj(v => Math.max(-0.3, +(v-0.05).toFixed(2)))}
              onPlus={() => setLeadingAdj(v => Math.min(0.5, +(v+0.05).toFixed(2)))} isDark={isDark} />
            <div style={{ fontSize: 12, color: isDark ? "#8A857A" : "var(--ink-3)", marginTop: 4, fontFamily: "var(--ui)" }}>
              Typeface follows your theme — change it in Tweaks.
            </div>
          </div>
        )}

        {/* MORE menu */}
        {showMore && (
          <div className="lume-enter" style={popover(isDark)}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Views</div>
            <div style={{ display: "grid", gap: 4 }}>
              <MoreItem icon="thread" label="Thread digest" sub="The chapter in ten beats" on={digest === "thread"} isDark={isDark}
                onClick={() => { setDigest(d => d === "thread" ? null : "thread"); setShowMore(false); }} />
              <MoreItem icon="align" label="Summary" sub="A full-page prose summary" on={digest === "summary"} isDark={isDark}
                onClick={() => { setDigest(d => d === "summary" ? null : "summary"); setShowMore(false); }} />
              <MoreItem icon="contents" label="Chapter map" sub={`${(book.chapters||[]).length} chapters`} isDark={isDark}
                onClick={() => { setShowMore(false); setShowTOC(true); }} />
              <MoreItem icon={bookmarks.includes(topParagraph()) ? "bookmarkFill" : "bookmark"} label={bookmarks.includes(topParagraph()) ? "Bookmarked" : "Bookmark this spot"}
                sub={bookmarks.length ? `${bookmarks.length} saved` : "Mark where you are"} on={bookmarks.includes(topParagraph())} isDark={isDark}
                onClick={() => { toggleBookmark(); setShowMore(false); }} />
            </div>
            {bookmarks.length > 0 && (
              <>
                <div className="eyebrow" style={{ margin: "14px 0 8px" }}>Bookmarks</div>
                <div style={{ display: "grid", gap: 2 }}>
                  {bookmarks.map(p => (
                    <button key={p} onClick={() => { setShowMore(false); jumpTo(p, 0); }} style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 9, width: "100%", textAlign: "left",
                      border: "none", background: "transparent", color: "inherit",
                    }}>
                      <I.bookmarkFill size={14} style={{ color: "var(--accent)", flex: "none" }} />
                      <span style={{ flex: 1, minWidth: 0, fontFamily: "var(--read)", fontSize: 13.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        “{(book.paragraphs[p] && book.paragraphs[p][0] || "").slice(0, 42)}…”
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* CHAPTER MAP (TOC) */}
        {showTOC && (
          <div className="lume-enter lume-scroll" style={{ ...popover(isDark), maxHeight: "70vh", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div className="eyebrow">Chapter map</div>
              <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: isDark ? "#8A857A" : "var(--ink-3)" }}>{(book.chapters||[]).length} chapters</span>
            </div>
            <div style={{ display: "grid", gap: 2 }}>
              {(book.chapters || []).map(ch => {
                const active = ch.no === book.chapterNo;
                const done = ch.status === "read";
                return (
                  <button key={ch.no} onClick={() => setShowTOC(false)} style={{
                    display: "flex", alignItems: "center", gap: 14, padding: "11px 12px", borderRadius: 10, textAlign: "left", width: "100%",
                    border: "none", background: active ? "color-mix(in srgb, var(--accent) 12%, transparent)" : "transparent", color: "inherit",
                  }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 12, width: 22, flex: "none", color: active ? "var(--accent)" : (isDark ? "#8A857A" : "var(--ink-3)") }}>{String(ch.no).padStart(2,"0")}</span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontFamily: "var(--read)", fontSize: 15, lineHeight: 1.25, fontWeight: active ? 600 : 400, opacity: done ? 0.6 : 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ch.title}</span>
                      <span style={{ fontSize: 11.5, color: isDark ? "#8A857A" : "var(--ink-3)" }}>{ch.est}{ch.marked > 0 ? ` · ${ch.marked} marked` : ""}</span>
                    </span>
                    {active ? <span style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)" }}>Here</span>
                      : done ? <I.check size={15} style={{ color: "var(--tag-idea)", flex: "none" }} />
                      : <span style={{ width: 6, height: 6, borderRadius: 4, background: isDark ? "rgba(255,255,255,0.2)" : "var(--line-2)", flex: "none" }} />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* SEARCH IN BOOK */}
        {showSearch && <window.SearchPanel book={book} isDark={isDark} onJump={(p, s) => { setShowSearch(false); jumpTo(p, s); }} />}
      </div>

      {/* ── READING SURFACE ────────────────────────────────────── */}
      {digest === "thread" ? (
        <ThreadView book={book} isDark={isDark} />
      ) : digest === "summary" ? (
        <SummaryReadView book={book} isDark={isDark} />
      ) : (
        <div style={{ maxWidth: `${M.measure}rem`, margin: "0 auto", padding: "56px 28px 200px" }}>
          {/* chapter header */}
          <div style={{ marginBottom: 44, animation: "lumeFade 0.6s both" }}>
            <div className="eyebrow" style={{ color: "var(--accent)", marginBottom: 14 }}>Chapter {book.chapterNo}</div>
            <h1 style={{ fontFamily: "var(--read)", fontWeight: 400, fontSize: "clamp(28px, 5vw, 40px)", lineHeight: 1.12, margin: 0, letterSpacing: "-0.01em" }}>
              {book.chapterTitle}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16, fontSize: 12.5, color: isDark ? "#8A857A" : "var(--ink-3)", fontFamily: "var(--ui)" }}>
              <I.clock size={14} /> {book.minutesLeft} min left in chapter
            </div>
          </div>

          {book.paragraphs.map((para, p) => {
            const dimmed = M.dim && p !== focusPara;
            return (
              <p key={p}
                 onMouseEnter={() => M.dim && setFocusPara(p)}
                 style={{
                   fontFamily: M.font, fontSize: `${fsize * 20}px`,
                   lineHeight: M.leading + leadingAdj, letterSpacing: M.track,
                   textAlign: M.justify ? "justify" : "left", hyphens: M.justify ? "auto" : "none",
                   margin: "0 0 1.5em", color: "inherit",
                   opacity: dimmed ? 0.32 : 1, transition: "opacity 0.4s ease",
                 }}>
                {para.map((sent, s) => {
                  const h = hlFor(p, s);
                  const isSel = sel && sel.p === p && sel.s === s;
                  const isFlash = flash === `${p}-${s}`;
                  const isSpeaking = speakingPS === `${p}-${s}`;
                  return (
                    <span key={s} data-ps={`${p}-${s}`} onClick={(e) => onSentenceTap(p, s, e)}
                      style={{
                        cursor: "pointer", borderRadius: 3,
                        background: isFlash ? "color-mix(in srgb, var(--accent) 24%, transparent)"
                          : isSpeaking ? "color-mix(in srgb, var(--accent) 14%, transparent)"
                          : h ? `color-mix(in srgb, var(--tag-${h.tag}) 22%, transparent)` : (isSel ? "var(--hl)" : "transparent"),
                        boxShadow: isFlash ? "0 0 0 2px color-mix(in srgb, var(--accent) 38%, transparent)"
                          : h ? `inset 0 -0.5em 0 color-mix(in srgb, var(--tag-${h.tag}) 16%, transparent)` : "none",
                        padding: "0.05em 0", transition: "background 0.45s, box-shadow 0.45s",
                        position: "relative",
                      }}>
                      {sent}{" "}
                      {h && h.note ? <I.note size={13} style={{ verticalAlign: "super", margin: "0 1px", color: `var(--tag-${h.tag})`, opacity: 0.8 }} /> : null}
                    </span>
                  );
                })}
              </p>
            );
          })}

          {/* end-of-chapter memory nudge */}
          <div style={{ marginTop: 64, paddingTop: 32, borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "var(--line)"}`, display: "flex", flexDirection: "column", alignItems: "center", gap: 16, textAlign: "center" }}>
            <div className="eyebrow">End of chapter</div>
            <div style={{ fontFamily: "var(--read)", fontSize: 19, maxWidth: 360, lineHeight: 1.4 }}>You marked {hlCount} passages here.</div>
            <button onClick={onOpenMemory} style={ghostBtn(isDark)}>
              Open chapter memory <I.arrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── PASSAGE SELECTION BAR ──────────────────────────────── */}
      {sel && (
        <PassageBar sel={sel} isDark={isDark} hl={hlFor(sel.p, sel.s)} noteOpen={noteFor === `${sel.p}-${sel.s}`}
          noteDraft={noteDraft} setNoteDraft={setNoteDraft}
          onTag={(t) => toggleHighlight(sel.p, sel.s, t)}
          onNote={startNote} onSaveNote={saveNote} onClose={closeSel} onCard={makeCard}
          onLookup={() => { setLookup(window.lookupWord(book.paragraphs[sel.p][sel.s])); closeSel(); }}
          onAsk={() => { openAI({ tab: "ask", passage: book.paragraphs[sel.p][sel.s] }); closeSel(); }} />
      )}

      {/* LISTEN BAR */}
      {listen && (
        <window.ListenBar isDark={isDark} playing={listen.playing} idx={listen.idx} total={flat.length} rate={listen.rate || 1}
          onPlayPause={() => listen.playing ? pauseListen() : resumeListen()} onPrev={() => stepListen(-1)} onNext={() => stepListen(1)}
          onRate={cycleRate} onClose={stopListen} />
      )}

      {/* LOOK UP SHEET */}
      {lookup && <window.LookupSheet word={lookup} isDark={isDark} onClose={() => setLookup(null)} />}

      {/* ── TOAST (card generated, etc.) ───────────────────────── */}
      {toast && (
        <div onClick={e => e.stopPropagation()} style={{
          position: "fixed", left: "50%", transform: "translateX(-50%)", bottom: "calc(28px + env(safe-area-inset-bottom))",
          zIndex: 50, display: "flex", alignItems: "center", gap: 11, padding: "12px 18px", borderRadius: 30,
          background: isDark ? "#2A2E34" : "var(--ink)", color: isDark ? "#E6E2D8" : "var(--page)",
          boxShadow: "0 12px 36px -10px rgba(0,0,0,0.5)", animation: "lumeFade 0.3s both", maxWidth: "calc(100% - 32px)",
        }}>
          <span style={{ width: 26, height: 26, borderRadius: 8, background: "var(--accent)", color: "var(--accent-ink)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Glyph name={toast.icon} size={16} /></span>
          <span style={{ fontSize: 13.5, fontWeight: 500 }}>{toast.msg}</span>
        </div>
      )}

      {/* ── AI SUMMON (invisible until here) ───────────────────── */}
      <button onClick={(e) => { e.stopPropagation(); openAI({ tab: "actions" }); }}
        style={{
          position: "fixed", right: "max(24px, env(safe-area-inset-right))", bottom: "calc(24px + env(safe-area-inset-bottom))",
          zIndex: 40, width: 52, height: 52, borderRadius: 26, border: "none",
          background: "var(--accent)", color: "var(--accent-ink)",
          display: showChrome ? "flex" : "none", alignItems: "center", justifyContent: "center",
          boxShadow: "0 8px 26px -8px color-mix(in srgb, var(--accent) 70%, black)",
          animation: "lumeScaleIn 0.3s both",
        }} title="Ask Lume">
        <I.sparkle size={23} />
      </button>
    </div>
  );
}

const MODE_BLURB = {
  classic: "A balanced serif setting — the default reading experience.",
  focus: "Dims everything but the paragraph you're reading. Hover to move focus.",
  night: "A dark page for low light, independent of your app theme.",
  academic: "Justified, wider measure, generous leading — built for close study.",
  dyslexia: "A humanist sans with extra letter and line spacing for easier tracking.",
};

// ── Thread (digest) view ─────────────────────────────────────────
function ThreadView({ book, isDark }) {
  return (
    <div style={{ maxWidth: "40rem", margin: "0 auto", padding: "52px 24px 200px" }}>
      <div style={{ marginBottom: 36 }}>
        <div className="eyebrow" style={{ color: "var(--accent)", marginBottom: 12 }}>Thread · Chapter {book.chapterNo}</div>
        <h1 style={{ fontFamily: "var(--read)", fontWeight: 400, fontSize: "clamp(26px, 4.5vw, 34px)", margin: 0, lineHeight: 1.15 }}>{book.chapterTitle}</h1>
        <p style={{ fontFamily: "var(--ui)", fontSize: 14, color: isDark ? "#9A958A" : "var(--ink-2)", marginTop: 12 }}>
          The chapter in {book.thread.length} beats — about a 2-minute review.
        </p>
      </div>
      <div style={{ position: "relative", paddingLeft: 30 }}>
        <div style={{ position: "absolute", left: 7, top: 6, bottom: 6, width: 2, background: isDark ? "rgba(255,255,255,0.1)" : "var(--line-2)" }} />
        {book.thread.map((beat, i) => (
          <div key={i} style={{ position: "relative", marginBottom: 26, animation: `lumeFade 0.5s ${i*0.05}s both` }}>
            <div style={{ position: "absolute", left: -30, top: 4, width: 16, height: 16, borderRadius: 10,
              background: isDark ? "#15171A" : "var(--page)", border: `2px solid var(--accent)`,
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ width: 5, height: 5, borderRadius: 5, background: "var(--accent)" }} />
            </div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)", marginBottom: 5 }}>{String(i+1).padStart(2,"0")}</div>
            <div style={{ fontFamily: "var(--read)", fontSize: 18, lineHeight: 1.5 }}>{beat}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Summary (full-page prose digest) ─────────────────────────────
function SummaryReadView({ book, isDark }) {
  const meta = isDark ? "#9A958A" : "var(--ink-2)";
  // Split the summary into sentences for a large editorial lead + body.
  const sents = (book.summary || "").match(/[^.!?]+[.!?]+/g) || [book.summary];
  const lead = sents.slice(0, 1).join(" ").trim();
  const rest = sents.slice(1).join(" ").trim();
  return (
    <div style={{ maxWidth: "40rem", margin: "0 auto", padding: "56px 28px 200px" }}>
      <div style={{ marginBottom: 36 }}>
        <div className="eyebrow" style={{ color: "var(--accent)", marginBottom: 12 }}>Summary · Chapter {book.chapterNo}</div>
        <h1 style={{ fontFamily: "var(--read)", fontWeight: 400, fontSize: "clamp(26px, 4.5vw, 34px)", margin: 0, lineHeight: 1.15 }}>{book.chapterTitle}</h1>
        <p style={{ fontFamily: "var(--ui)", fontSize: 14, color: meta, marginTop: 12 }}>
          The chapter's argument, distilled — about a 1-minute read.
        </p>
      </div>
      <p style={{ fontFamily: "var(--read)", fontSize: "clamp(21px, 3.4vw, 26px)", lineHeight: 1.5, margin: "0 0 1em", letterSpacing: "-0.01em" }}>{lead}</p>
      {rest && <p style={{ fontFamily: "var(--read)", fontSize: 18, lineHeight: 1.62, margin: 0, color: isDark ? "#C9C3B7" : "var(--ink-2)" }}>{rest}</p>}

      {/* key takeaways pulled from the thread */}
      {book.thread && (
        <div style={{ marginTop: 48, paddingTop: 28, borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "var(--line)"}` }}>
          <div className="eyebrow" style={{ marginBottom: 18 }}>Key takeaways</div>
          <div style={{ display: "grid", gap: 20 }}>
            {book.thread.slice(0, 4).map((beat, i) => (
              <div key={i} style={{ display: "flex", gap: 14 }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--accent)", flex: "none", width: 20, paddingTop: 3 }}>{String(i+1).padStart(2,"0")}</span>
                <span style={{ fontFamily: "var(--read)", fontSize: 16.5, lineHeight: 1.5 }}>{beat}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Passage action bar ───────────────────────────────────────────
function PassageBar({ sel, isDark, hl, noteOpen, noteDraft, setNoteDraft, onTag, onNote, onSaveNote, onAsk, onCard, onLookup, onClose }) {
  const tags = [["beautiful","Beautiful"],["important","Important"],["question","Question"],["idea","Idea"]];
  return (
    <div onClick={e => e.stopPropagation()} style={{
      position: "absolute", left: "50%", transform: "translateX(-50%)",
      top: Math.max(70, sel.bottom + 12),
      zIndex: 35, width: "min(440px, calc(100% - 32px))",
      background: isDark ? "#21242A" : "var(--surface)", color: isDark ? "#E6E2D8" : "var(--ink)",
      border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "var(--line)"}`,
      borderRadius: 16, boxShadow: "0 16px 44px -14px rgba(0,0,0,0.5)",
      padding: 14, animation: "lumeScaleIn 0.18s both",
    }}>
      {!noteOpen ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span className="eyebrow">{hl ? "Highlighted" : "Highlight color"}</span>
            <button onClick={onClose} style={{ ...barBtn(isDark), padding: 4 }}><I.close size={16} /></button>
          </div>
          {/* color swatches */}
          <div style={{ display: "flex", gap: 7 }}>
            {tags.map(([t, label]) => {
              const on = hl && hl.tag === t;
              return (
                <button key={t} onClick={() => onTag(t)} title={label} style={{
                  flex: 1, height: 34, borderRadius: 9, border: on ? `2px solid var(--tag-${t})` : `1px solid ${isDark ? "rgba(255,255,255,0.14)" : "var(--line-2)"}`,
                  background: on ? `color-mix(in srgb, var(--tag-${t}) 22%, transparent)` : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ width: 13, height: 13, borderRadius: 8, background: `var(--tag-${t})` }} />
                  {on && <I.check size={13} style={{ marginLeft: 5, color: `var(--tag-${t})` }} />}
                </button>
              );
            })}
          </div>
          {/* actions */}
          <div style={{ display: "flex", gap: 6, borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "var(--line)"}`, paddingTop: 10 }}>
            <button onClick={onNote} style={{ ...barBtn(isDark), flex: 1, justifyContent: "center" }}><I.note size={17} /> Note</button>
            <button onClick={onCard} style={{ ...barBtn(isDark), flex: 1, justifyContent: "center" }}><I.cards size={17} /> Card</button>
            <button onClick={onLookup} style={{ ...barBtn(isDark), flex: 1, justifyContent: "center" }}><I.book size={17} /> Look up</button>
            <button onClick={onAsk} style={{ ...barBtn(isDark), flex: 1, justifyContent: "center" }}><I.sparkle size={17} /> Ask</button>
          </div>
        </div>
      ) : (
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Margin note</div>
          <textarea autoFocus value={noteDraft} onChange={e => setNoteDraft(e.target.value)}
            placeholder="What does this passage make you think?"
            style={{ width: "100%", minHeight: 84, resize: "none", border: `1px solid ${isDark ? "rgba(255,255,255,0.14)" : "var(--line-2)"}`,
              borderRadius: 10, padding: 12, background: isDark ? "#191C20" : "var(--page)", color: "inherit",
              fontFamily: "var(--read)", fontSize: 15, lineHeight: 1.5, outline: "none" }} />
          <div style={{ display: "flex", gap: 8, marginTop: 10, justifyContent: "flex-end" }}>
            <button onClick={onClose} style={barBtn(isDark)}>Cancel</button>
            <button onClick={onSaveNote} style={{ ...barBtn(isDark), background: "var(--accent)", color: "var(--accent-ink)", border: "none", padding: "8px 16px" }}>Save</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── small bits ───────────────────────────────────────────────────
const MoreItem = ({ icon, label, sub, on, isDark, onClick }) => (
  <button onClick={onClick} style={{
    display: "flex", alignItems: "center", gap: 12, padding: "10px 11px", borderRadius: 10, width: "100%", textAlign: "left",
    border: "none", background: on ? "color-mix(in srgb, var(--accent) 11%, transparent)" : "transparent", color: "inherit",
  }}>
    <Glyph name={icon} size={19} style={{ color: on ? "var(--accent)" : (isDark ? "#9A958A" : "var(--ink-3)"), flex: "none" }} />
    <span style={{ flex: 1 }}>
      <span style={{ display: "block", fontSize: 14, fontWeight: on ? 600 : 500 }}>{label}</span>
      <span style={{ display: "block", fontSize: 11.5, color: isDark ? "#8A857A" : "var(--ink-3)", marginTop: 1 }}>{sub}</span>
    </span>
    {on && <I.check size={16} style={{ color: "var(--accent)", flex: "none" }} />}
  </button>
);

const Stepper = ({ label, value, onMinus, onPlus, isDark }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
    <span style={{ fontSize: 13.5 }}>{label}</span>
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <button onClick={onMinus} style={stepBtn(isDark)}><I.minus size={16} /></button>
      <span style={{ fontFamily: "var(--mono)", fontSize: 12, minWidth: 48, textAlign: "center" }}>{value}</span>
      <button onClick={onPlus} style={stepBtn(isDark)}><I.plus size={16} /></button>
    </div>
  </div>
);

const iconBtn = (isDark, on) => ({
  width: 38, height: 38, borderRadius: 10, border: "none", flex: "none",
  background: on ? "color-mix(in srgb, var(--accent) 16%, transparent)" : "transparent",
  color: on ? "var(--accent)" : "inherit", display: "flex", alignItems: "center", justifyContent: "center",
});
const popover = (isDark) => ({
  margin: "0 auto", maxWidth: 460, marginTop: 10, padding: 16,
  background: isDark ? "rgba(28,31,36,0.96)" : "color-mix(in srgb, var(--surface) 97%, transparent)",
  backdropFilter: "blur(14px)", borderRadius: 16,
  border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "var(--line)"}`,
  boxShadow: "0 16px 40px -16px rgba(0,0,0,0.4)",
  position: "absolute", left: 16, right: 16, zIndex: 28,
});
const stepBtn = (isDark) => ({
  width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
  border: `1px solid ${isDark ? "rgba(255,255,255,0.14)" : "var(--line-2)"}`, background: "transparent", color: "inherit",
});
const barBtn = (isDark) => ({
  display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 11px", borderRadius: 9,
  border: "none", background: "transparent", color: "inherit", fontSize: 13, fontWeight: 500,
});
const ghostBtn = (isDark) => ({
  display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 18px", borderRadius: 11,
  border: `1px solid ${isDark ? "rgba(255,255,255,0.16)" : "var(--line-2)"}`, background: "transparent",
  color: "inherit", fontSize: 14, fontWeight: 500,
});

window.Reader = Reader;
