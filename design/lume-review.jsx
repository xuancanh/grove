// lume-review.jsx — Daily Review + Connections → window.Review, window.Connections
const { useState: useStateRv, useMemo: useMemoRv } = React;

// ══ DAILY REVIEW — resurface past highlights, one at a time ════════
function Review({ onOpenSource }) {
  const S = window.lumeStyles;
  // A calm daily set: a handful of highlights to revisit.
  const queue = useMemoRv(() => {
    const pool = [...window.NOTES];
    return pool.slice(0, 5);
  }, []);
  const [i, setI] = useStateRv(0);
  const [done, setDone] = useStateRv(false);
  const [kept, setKept] = useStateRv(0);

  const n = queue[i];
  const advance = (keep) => {
    if (keep) setKept(k => k + 1);
    if (i + 1 >= queue.length) { setDone(true); return; }
    setI(i + 1);
  };

  if (done) return (
    <div className="lume-enter" style={{ ...S.wrap, maxWidth: 640, textAlign: "center", paddingTop: 100 }}>
      <div style={{ width: 64, height: 64, borderRadius: 40, background: "color-mix(in srgb, var(--accent) 14%, transparent)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
        <I.check size={32} />
      </div>
      <h1 style={{ fontFamily: "var(--read)", fontWeight: 400, fontSize: 36, margin: "0 0 12px" }}>That's today's review</h1>
      <p style={{ color: "var(--ink-2)", fontSize: 15.5, lineHeight: 1.55, marginBottom: 8 }}>You revisited {queue.length} passages and kept {kept} close.</p>
      <p style={{ color: "var(--ink-3)", fontSize: 13.5, marginBottom: 30 }}>A fresh set surfaces tomorrow.</p>
      <button onClick={() => { setI(0); setDone(false); setKept(0); }} style={{ ...S.secondaryBtn, padding: "12px 22px" }}><I.refresh size={17} /> Review again</button>
    </div>
  );

  return (
    <div className="lume-enter" style={{ ...S.wrap, maxWidth: 680 }}>
      <window.ScreenHead eyebrow="Daily review" title="Resurface"
        sub="A few passages from across your reading, brought back so they don't fade. Keep what still resonates." />

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <div style={{ flex: 1, height: 4, borderRadius: 3, background: "var(--surface-2)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${(i/queue.length)*100}%`, background: "var(--accent)", transition: "width 0.3s" }} />
        </div>
        <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink-3)" }}>{i+1} / {queue.length}</span>
      </div>

      <div key={n.id} style={{ position: "relative", padding: "44px 40px", borderRadius: 22, background: "var(--surface)", border: "1px solid var(--line)", borderTop: `4px solid var(--tag-${n.tag})`, animation: "lumeScaleIn 0.3s both", marginBottom: 22 }}>
        <I.quote size={30} style={{ color: `var(--tag-${n.tag})`, opacity: 0.5, marginBottom: 14 }} />
        <div style={{ fontFamily: "var(--read)", fontSize: "clamp(22px, 3.4vw, 27px)", lineHeight: 1.45 }}>{n.text}</div>
        {n.note && <div style={{ fontFamily: "var(--read)", fontSize: 16, lineHeight: 1.6, color: "var(--ink-2)", marginTop: 20, paddingLeft: 16, borderLeft: "2px solid var(--line-2)" }}>{n.note}</div>}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 26, paddingTop: 18, borderTop: "1px solid var(--line)" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--ink-2)" }}>
            <I.book size={15} /> {n.book}{n.chapter ? ` · ${n.chapter}` : ""}
          </span>
          <button onClick={() => onOpenSource({ book: n.book, passage: n.text })} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "var(--accent)", fontSize: 13, fontWeight: 600 }}>
            Open in book <I.arrowRight size={15} />
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <button onClick={() => advance(false)} style={{ padding: "15px 0", borderRadius: 14, border: "1px solid var(--line-2)", background: "transparent", color: "var(--ink-2)", fontSize: 14.5, fontWeight: 500 }}>Let it rest</button>
        <button onClick={() => advance(true)} style={{ padding: "15px 0", borderRadius: 14, border: "none", background: "var(--accent)", color: "var(--accent-ink)", fontSize: 14.5, fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <I.bookmarkFill size={16} /> Keep close
        </button>
      </div>
    </div>
  );
}

// ══ CONNECTIONS — ideas that rhyme across books ════════════════════
function Connections({ onOpenSource }) {
  const noteById = (id) => window.NOTES.find(x => x.id === id);
  return (
    <div className="lume-enter">
      <div style={{ display: "grid", gap: 22 }}>
        {window.CONNECTIONS.map(c => {
          const notes = c.noteIds.map(noteById).filter(Boolean);
          const books = Array.from(new Set(notes.map(n => n.book)));
          return (
            <div key={c.id} style={{ padding: "26px 26px", borderRadius: 18, background: "var(--surface)", border: "1px solid var(--line)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 14 }}>
                <span style={{ width: 34, height: 34, borderRadius: 10, background: "color-mix(in srgb, var(--accent) 13%, transparent)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><I.link size={18} /></span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--read)", fontSize: 20, lineHeight: 1.2 }}>{c.theme}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4 }}>{notes.length} passages · {books.length} books</div>
                </div>
              </div>
              <p style={{ fontFamily: "var(--read)", fontSize: 16, lineHeight: 1.6, color: "var(--ink-2)", margin: "0 0 18px" }}>{c.insight}</p>
              <div style={{ display: "grid", gap: 10 }}>
                {notes.map(n => (
                  <button key={n.id} onClick={() => onOpenSource({ book: n.book, passage: n.text })} className="row-hover" style={{
                    display: "flex", gap: 14, alignItems: "flex-start", padding: "14px 16px", borderRadius: 12,
                    border: "1px solid var(--line)", background: "var(--page)", color: "var(--ink)", textAlign: "left", width: "100%",
                  }}>
                    <span style={{ width: 3, alignSelf: "stretch", borderRadius: 3, background: `var(--tag-${n.tag})`, flex: "none" }} />
                    <span style={{ flex: 1 }}>
                      <span style={{ display: "block", fontFamily: "var(--read)", fontSize: 15.5, lineHeight: 1.45 }}>"{n.text}"</span>
                      <span style={{ display: "block", fontSize: 12, color: "var(--ink-3)", marginTop: 7 }}>{n.book} · {n.author}</span>
                    </span>
                    <I.arrowRight size={16} style={{ color: "var(--ink-3)", flex: "none", marginTop: 3 }} />
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, { Review, Connections });
