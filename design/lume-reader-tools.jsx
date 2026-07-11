// lume-reader-tools.jsx — presentational reader panels → window
// SearchPanel, ListenBar, LookupSheet, BookmarksPanel
const { useState: useStateRT, useMemo: useMemoRT, useEffect: useEffectRT, useRef: useRefRT } = React;

const rtPanel = (isDark) => ({
  margin: "0 auto", maxWidth: 460, marginTop: 10, padding: 16,
  background: isDark ? "rgba(28,31,36,0.97)" : "color-mix(in srgb, var(--surface) 98%, transparent)",
  backdropFilter: "blur(14px)", borderRadius: 16,
  border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "var(--line)"}`,
  boxShadow: "0 16px 40px -16px rgba(0,0,0,0.4)",
  position: "absolute", left: 16, right: 16, zIndex: 28,
});

// ── Search within the book ───────────────────────────────────────
function SearchPanel({ book, isDark, onJump }) {
  const [q, setQ] = useStateRT("");
  const results = useMemoRT(() => {
    if (!q.trim() || !book.paragraphs) return [];
    const needle = q.trim().toLowerCase();
    const out = [];
    book.paragraphs.forEach((para, p) => para.forEach((sent, s) => {
      const i = sent.toLowerCase().indexOf(needle);
      if (i >= 0) out.push({ p, s, sent, i });
    }));
    return out.slice(0, 30);
  }, [q, book]);

  const mark = (sent, i) => {
    if (i < 0) return sent;
    const pre = sent.slice(0, i), hit = sent.slice(i, i + q.length), post = sent.slice(i + q.length);
    return <>{pre}<mark style={{ background: "color-mix(in srgb, var(--accent) 30%, transparent)", color: "inherit", borderRadius: 2 }}>{hit}</mark>{post}</>;
  };

  return (
    <div className="lume-enter lume-scroll" style={{ ...rtPanel(isDark), maxHeight: "72vh", overflowY: "auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, height: 42, padding: "0 12px", borderRadius: 11, background: isDark ? "#191C20" : "var(--page)", border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "var(--line-2)"}`, marginBottom: 12 }}>
        <I.search size={17} style={{ color: "var(--ink-3)" }} />
        <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Find in this chapter…"
          style={{ flex: 1, border: "none", background: "none", outline: "none", fontSize: 14, color: "inherit", fontFamily: "var(--ui)" }} />
        {q && <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--ink-3)" }}>{results.length}</span>}
      </div>
      {q && results.length === 0 && <div style={{ fontSize: 13, color: "var(--ink-3)", padding: "8px 4px" }}>No matches in this chapter.</div>}
      <div style={{ display: "grid", gap: 4 }}>
        {results.map((r, k) => (
          <button key={k} onClick={() => onJump(r.p, r.s)} className="row-hover" style={{
            display: "block", textAlign: "left", width: "100%", padding: "10px 12px", borderRadius: 9,
            border: "none", background: "transparent", color: "inherit", fontFamily: "var(--read)", fontSize: 14.5, lineHeight: 1.45,
          }}>{mark(r.sent, r.i)}</button>
        ))}
      </div>
    </div>
  );
}

// ── Listen (TTS) playback bar ────────────────────────────────────
function ListenBar({ isDark, playing, idx, total, rate, onPlayPause, onPrev, onNext, onRate, onClose }) {
  const rates = [0.8, 1, 1.25, 1.5];
  return (
    <div onClick={e => e.stopPropagation()} style={{
      position: "fixed", left: "50%", transform: "translateX(-50%)", bottom: "calc(20px + env(safe-area-inset-bottom))",
      zIndex: 42, display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 18,
      background: isDark ? "#23272D" : "var(--ink)", color: isDark ? "#E6E2D8" : "var(--page)",
      boxShadow: "0 14px 40px -12px rgba(0,0,0,0.5)", maxWidth: "calc(100% - 24px)",
      animation: "lumeFade 0.3s both",
    }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "0 8px", fontSize: 12.5 }}>
        <I.sound size={16} style={{ opacity: 0.8 }} /> Listening
      </span>
      <span style={{ width: 1, height: 22, background: "rgba(255,255,255,0.16)" }} />
      <button onClick={onPrev} style={listenBtn}><I.skipBack size={18} /></button>
      <button onClick={onPlayPause} style={{ ...listenBtn, width: 42, height: 42, background: "var(--accent)", color: "var(--accent-ink)" }}>
        {playing ? <I.pause size={20} /> : <I.play size={20} />}
      </button>
      <button onClick={onNext} style={listenBtn}><I.skipFwd size={18} /></button>
      <button onClick={onRate} style={{ ...listenBtn, width: "auto", padding: "0 10px", fontFamily: "var(--mono)", fontSize: 12.5 }}>{rate}×</button>
      <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, opacity: 0.6, minWidth: 48, textAlign: "center" }}>{idx + 1}/{total}</span>
      <button onClick={onClose} style={listenBtn}><I.close size={18} /></button>
    </div>
  );
}
const listenBtn = { width: 36, height: 36, borderRadius: 10, border: "none", background: "transparent", color: "inherit", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" };

// ── Look up / Define sheet ───────────────────────────────────────
function LookupSheet({ word, isDark, onClose }) {
  const [tab, setTab] = useStateRT("define");
  if (!word) return null;
  const entry = window.defineWord(word);
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 58, background: "rgba(0,0,0,0.3)", animation: "lumeFadeIn 0.2s both" }}>
      <div onClick={e => e.stopPropagation()} style={{
        position: "fixed", left: "50%", bottom: 0, transform: "translateX(-50%)", width: "min(520px, 100%)",
        background: "var(--surface)", color: "var(--ink)", borderRadius: "22px 22px 0 0",
        border: "1px solid var(--line)", borderBottom: "none", boxShadow: "0 -20px 60px -24px rgba(0,0,0,0.4)",
        padding: "20px 22px calc(26px + env(safe-area-inset-bottom))", animation: "lumeSheetUp 0.34s cubic-bezier(0.2,0.7,0.2,1) both",
      }}>
        <div style={{ position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", width: 36, height: 4, borderRadius: 3, background: "var(--line-2)" }} />
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginTop: 4 }}>
          <h2 style={{ fontFamily: "var(--read)", fontWeight: 500, fontSize: 28, margin: 0, textTransform: "lowercase" }}>{word}</h2>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "var(--surface-2)", color: "var(--ink-2)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><I.close size={18} /></button>
        </div>
        <div style={{ display: "flex", gap: 4, margin: "16px 0 18px" }}>
          {[["define","Define"],["wiki","Wikipedia"],["translate","Translate"]].map(([k,l]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              padding: "7px 13px", borderRadius: 9, border: "none", fontSize: 12.5, fontWeight: tab===k?600:500,
              background: tab===k ? "color-mix(in srgb, var(--accent) 13%, transparent)" : "transparent",
              color: tab===k ? "var(--accent)" : "var(--ink-2)",
            }}>{l}</button>
          ))}
        </div>
        {tab === "define" && (
          <div className="lume-enter">
            {entry.pos && <div style={{ fontFamily: "var(--read)", fontStyle: "italic", fontSize: 14, color: "var(--ink-3)", marginBottom: 8 }}>{entry.pos}</div>}
            <div style={{ fontFamily: "var(--read)", fontSize: 18, lineHeight: 1.5 }}>{entry.def}</div>
            {entry.etym && <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--line)" }}>{entry.etym}</div>}
          </div>
        )}
        {tab === "wiki" && (
          <div className="lume-enter" style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <I.book size={20} style={{ color: "var(--ink-3)", marginTop: 2, flex: "none" }} />
            <div style={{ fontFamily: "var(--read)", fontSize: 15.5, lineHeight: 1.55, color: "var(--ink-2)" }}>
              A Wikipedia summary for “{word}” would appear here, with a link to read the full article in Lume's reader.
            </div>
          </div>
        )}
        {tab === "translate" && (
          <div className="lume-enter">
            <div className="eyebrow" style={{ marginBottom: 10 }}>Spanish · French · German</div>
            <div style={{ fontFamily: "var(--read)", fontSize: 16, lineHeight: 1.8, color: "var(--ink-2)" }}>
              Translations of “{word}” into your chosen languages would appear here.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { SearchPanel, ListenBar, LookupSheet });
