// lume-ai.jsx — reading-aware AI companion → window.AICompanion
const { useState: useStateAI, useEffect: useEffectAI, useRef: useRefAI } = React;

function AICompanion({ book, open, initial, surface = "sheet", onClose }) {
  const [tab, setTab] = useStateAI("actions");      // actions | summary | thread | cards | ask
  const [passage, setPassage] = useStateAI(null);
  const [thinking, setThinking] = useStateAI(false);
  const [chat, setChat] = useStateAI([]);
  const [input, setInput] = useStateAI("");
  const bodyRef = useRefAI(null);

  useEffectAI(() => {
    if (open && initial) {
      setTab(initial.tab || "actions");
      setPassage(initial.passage || null);
      if (initial.tab === "ask" && initial.passage) {
        setChat([{ role: "ctx", text: initial.passage }]);
      } else if (initial.tab === "ask") {
        setChat([]);
      }
    }
  }, [open, initial]);

  const run = (next) => {
    if (next === "ask") { setTab("ask"); return; }
    setThinking(true); setTab(next);
    setTimeout(() => setThinking(false), 850);
  };

  const ask = () => {
    if (!input.trim()) return;
    const q = input.trim();
    setChat(c => [...c, { role: "user", text: q }]);
    setInput(""); setThinking(true);
    setTimeout(() => {
      setThinking(false);
      setChat(c => [...c, { role: "ai", text: answerFor(q, passage) }]);
    }, 900);
  };

  useEffectAI(() => { if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight; }, [chat, thinking, tab]);

  if (!open) return null;

  const isDrawer = surface === "drawer";

  const panel = (
    <div onClick={e => e.stopPropagation()} style={{
      background: "var(--surface)", color: "var(--ink)",
      display: "flex", flexDirection: "column", overflow: "hidden",
      ...(isDrawer ? {
        position: "fixed", top: 0, right: 0, bottom: 0, width: "min(440px, 92vw)", zIndex: 60,
        borderLeft: "1px solid var(--line)", boxShadow: "-20px 0 60px -24px rgba(0,0,0,0.45)",
        animation: "lumeDrawerIn 0.34s cubic-bezier(0.2,0.7,0.2,1) both",
      } : {
        position: "fixed", left: "50%", bottom: 0, transform: "translateX(-50%)",
        width: "min(560px, 100%)", maxHeight: "82vh", zIndex: 60,
        borderRadius: "22px 22px 0 0", border: "1px solid var(--line)", borderBottom: "none",
        boxShadow: "0 -20px 60px -24px rgba(0,0,0,0.4)",
        animation: "lumeSheetUp 0.36s cubic-bezier(0.2,0.7,0.2,1) both",
      }),
    }}>
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 18px 12px" }}>
        {!isDrawer && <div style={{ position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", width: 36, height: 4, borderRadius: 3, background: "var(--line-2)" }} />}
        <div style={{ width: 30, height: 30, borderRadius: 9, background: "color-mix(in srgb, var(--accent) 16%, transparent)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <I.sparkle size={18} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14.5, fontWeight: 600 }}>Lume</div>
          <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>Reading Ch. {book.chapterNo} · {book.chapterTitle}</div>
        </div>
        <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "var(--surface-2)", color: "var(--ink-2)", display: "flex", alignItems: "center", justifyContent: "center" }}><I.close size={18} /></button>
      </div>

      {/* tabs */}
      {tab !== "actions" && (
        <div style={{ display: "flex", gap: 4, padding: "0 14px 10px", borderBottom: "1px solid var(--line)" }}>
          {[["summary","Summary"],["thread","Thread"],["cards","Cards"],["ask","Ask"]].map(([k,l]) => (
            <button key={k} onClick={() => run(k)} style={{
              padding: "7px 13px", borderRadius: 9, border: "none", fontSize: 12.5, fontWeight: tab===k?600:500,
              background: tab===k ? "color-mix(in srgb, var(--accent) 13%, transparent)" : "transparent",
              color: tab===k ? "var(--accent)" : "var(--ink-2)",
            }}>{l}</button>
          ))}
        </div>
      )}

      {/* body */}
      <div ref={bodyRef} className="lume-scroll" style={{ overflowY: "auto", padding: tab==="actions" ? 14 : "18px", flex: 1 }}>
        {tab === "actions" && <Actions onRun={run} passage={passage} />}
        {tab !== "actions" && thinking && <Thinking />}
        {tab === "summary" && !thinking && <SummaryView book={book} />}
        {tab === "thread" && !thinking && <ThreadDigest book={book} />}
        {tab === "cards" && !thinking && <CardsGen book={book} />}
        {tab === "ask" && <AskView chat={chat} thinking={thinking} passage={passage} />}
      </div>

      {/* ask input */}
      {tab === "ask" && (
        <div style={{ padding: 14, borderTop: "1px solid var(--line)", display: "flex", gap: 8 }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && ask()}
            placeholder={passage ? "Ask about this passage…" : "Ask about this chapter…"}
            style={{ flex: 1, height: 42, borderRadius: 11, border: "1px solid var(--line-2)", background: "var(--page)",
              padding: "0 14px", fontSize: 14, color: "var(--ink)", fontFamily: "var(--ui)", outline: "none" }} />
          <button onClick={ask} style={{ width: 42, height: 42, borderRadius: 11, border: "none", background: "var(--accent)", color: "var(--accent-ink)", display: "flex", alignItems: "center", justifyContent: "center" }}><I.send size={18} /></button>
        </div>
      )}
    </div>
  );

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 55, background: "rgba(0,0,0,0.32)", animation: "lumeFadeIn 0.25s both" }}>
      {panel}
    </div>
  );
}

function Actions({ onRun, passage }) {
  const items = [
    ["summary", "Summarise", "A tight prose summary of the chapter", "align"],
    ["thread", "Thread", "Ten scannable beats for review", "thread"],
    ["cards", "Make cards", "Recall prompts from your highlights", "cards"],
    ["ask", "Ask a question", passage ? "About the passage you selected" : "Anything about this chapter", "ask"],
  ];
  return (
    <div>
      {passage && (
        <div style={{ padding: "12px 14px", borderRadius: 12, background: "var(--surface-2)", marginBottom: 12, borderLeft: "2px solid var(--accent)" }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Selected passage</div>
          <div style={{ fontFamily: "var(--read)", fontSize: 14.5, lineHeight: 1.5, color: "var(--ink-2)" }}>"{passage}"</div>
        </div>
      )}
      <div style={{ display: "grid", gap: 8 }}>
        {items.map(([k, title, sub, icon]) => (
          <button key={k} onClick={() => onRun(k)} style={{
            display: "flex", alignItems: "center", gap: 14, padding: "14px 15px", borderRadius: 13,
            border: "1px solid var(--line)", background: "var(--page)", color: "var(--ink)", textAlign: "left", width: "100%",
          }}>
            <span style={{ width: 38, height: 38, borderRadius: 10, flex: "none", background: "color-mix(in srgb, var(--accent) 12%, transparent)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}><Glyph name={icon} size={19} /></span>
            <span style={{ flex: 1 }}>
              <span style={{ display: "block", fontSize: 14.5, fontWeight: 600 }}>{title}</span>
              <span style={{ display: "block", fontSize: 12.5, color: "var(--ink-3)", marginTop: 2 }}>{sub}</span>
            </span>
            <I.chevron size={18} style={{ color: "var(--ink-3)" }} />
          </button>
        ))}
      </div>
    </div>
  );
}

function Thinking() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--ink-3)", padding: "8px 0" }}>
      <I.sparkle size={16} style={{ color: "var(--accent)", animation: "lumeShimmer 1.2s infinite" }} />
      <span style={{ fontSize: 13.5, fontFamily: "var(--mono)", letterSpacing: "0.04em" }}>thinking…</span>
    </div>
  );
}

function SummaryView({ book }) {
  return (
    <div className="lume-enter">
      <div className="eyebrow" style={{ marginBottom: 12 }}>Chapter summary</div>
      <p style={{ fontFamily: "var(--read)", fontSize: 16.5, lineHeight: 1.62, margin: 0, color: "var(--ink)" }}>{book.summary}</p>
      <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid var(--line)", fontSize: 12.5, color: "var(--ink-3)" }}>
        Drawn from the full chapter and your 4 highlights.
      </div>
    </div>
  );
}

function ThreadDigest({ book }) {
  return (
    <div className="lume-enter" style={{ display: "grid", gap: 10 }}>
      {book.thread.map((b, i) => (
        <div key={i} style={{ display: "flex", gap: 12 }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)", marginTop: 3, flex: "none", width: 18 }}>{String(i+1).padStart(2,"0")}</span>
          <span style={{ fontFamily: "var(--read)", fontSize: 15.5, lineHeight: 1.5 }}>{b}</span>
        </div>
      ))}
    </div>
  );
}

function CardsGen({ book }) {
  const cards = (window.CARDS || []).filter(c => c.book === "Walden").slice(0, 3);
  return (
    <div className="lume-enter">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div className="eyebrow">Generated · {cards.length} cards</div>
        <button style={{ fontSize: 12.5, fontWeight: 600, color: "var(--accent)", background: "none", border: "none" }}>Add all to deck</button>
      </div>
      <div style={{ display: "grid", gap: 10 }}>
        {cards.map(c => (
          <div key={c.id} style={{ padding: 14, borderRadius: 12, background: "var(--page)", border: "1px solid var(--line)" }}>
            <div style={{ fontFamily: "var(--read)", fontSize: 15, fontWeight: 500, marginBottom: 7 }}>{c.front}</div>
            <div style={{ fontFamily: "var(--read)", fontSize: 14, color: "var(--ink-2)", lineHeight: 1.5 }}>{c.back}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AskView({ chat, thinking, passage }) {
  if (chat.length === 0 && !thinking) {
    return (
      <div style={{ textAlign: "center", padding: "30px 16px", color: "var(--ink-3)" }}>
        <I.sparkle size={26} style={{ color: "var(--accent)", opacity: 0.6 }} />
        <p style={{ fontSize: 14, marginTop: 12, lineHeight: 1.5 }}>Ask anything about this chapter.<br/>Lume answers from the text and your notes.</p>
      </div>
    );
  }
  return (
    <div style={{ display: "grid", gap: 14 }}>
      {chat.map((m, i) => {
        if (m.role === "ctx") return (
          <div key={i} style={{ padding: "10px 12px", borderRadius: 10, background: "var(--surface-2)", borderLeft: "2px solid var(--accent)", fontFamily: "var(--read)", fontSize: 13.5, lineHeight: 1.5, color: "var(--ink-2)" }}>"{m.text}"</div>
        );
        const me = m.role === "user";
        return (
          <div key={i} style={{ display: "flex", justifyContent: me ? "flex-end" : "flex-start" }}>
            <div style={{ maxWidth: "86%", padding: me ? "10px 14px" : "0", borderRadius: 14,
              background: me ? "var(--accent)" : "transparent", color: me ? "var(--accent-ink)" : "var(--ink)",
              fontFamily: me ? "var(--ui)" : "var(--read)", fontSize: me ? 14 : 15.5, lineHeight: 1.55 }}>
              {!me && <I.sparkle size={14} style={{ color: "var(--accent)", marginRight: 6, verticalAlign: "-2px" }} />}
              {m.text}
            </div>
          </div>
        );
      })}
      {thinking && <Thinking />}
    </div>
  );
}

// canned but plausible answers
function answerFor(q, passage) {
  const lo = q.toLowerCase();
  if (passage) return "In this line, Thoreau compresses his whole argument: deliberate living means meeting experience directly rather than sleepwalking through inherited routine. The verbs — 'front,' 'live,' 'learn' — are all active and chosen.";
  if (lo.includes("simpl")) return "Simplicity is Thoreau's central prescription. He repeats the word three times for emphasis, arguing that a life 'frittered away by detail' can only be recovered by reducing affairs to 'two or three' rather than 'a hundred or a thousand.'";
  if (lo.includes("time")) return "Thoreau treats time as 'the stream I go a-fishing in' — something we move through but rarely look into. Its current is shallow; eternity is what remains when you stop hurrying.";
  if (lo.includes("why") && lo.includes("wood")) return "He went to the woods to 'live deliberately' — to test life against only its essential facts, so he wouldn't reach death and find he had never truly lived.";
  return "Thoreau's argument here is that most lives run on autopilot — busy, hurried, and unexamined. His remedy is attention: simplify your affairs, meet each fact directly, and let reality, not routine, set the pace.";
}

window.AICompanion = AICompanion;
