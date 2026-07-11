// lume-detail.jsx — Note & Card detail modals → window.NoteModal / window.CardModal
const { useState: useStateD } = React;

function Overlay({ children, onClose, width = 560 }) {
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 80, background: "rgba(0,0,0,0.36)",
      display: "flex", justifyContent: "center", alignItems: "flex-start",
      animation: "lumeFadeIn 0.22s both", padding: "16px",
    }}>
      <div onClick={e => e.stopPropagation()} className="lume-scroll" style={{
        marginTop: "min(11vh, 86px)", width: `min(${width}px, 100%)`, maxHeight: "82vh", overflowY: "auto",
        background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 20,
        boxShadow: "0 30px 80px -30px rgba(0,0,0,0.55)", animation: "lumeScaleIn 0.26s both",
      }}>{children}</div>
    </div>
  );
}

const sourceBtn = {
  display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 20px", borderRadius: 12, whiteSpace: "nowrap",
  border: "none", background: "var(--accent)", color: "var(--accent-ink)", fontSize: 14.5, fontWeight: 600,
};
const ghost = {
  display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 18px", borderRadius: 12,
  border: "1px solid var(--line-2)", background: "transparent", color: "var(--ink)", fontSize: 14, fontWeight: 500,
};

// ── Note detail ──────────────────────────────────────────────────
function NoteModal({ note, onClose, onOpenSource }) {
  const [shareOpen, setShareOpen] = useStateD(false);
  const [toast, setToast] = useStateD(null);
  if (!note) return null;

  const markdown = `> ${note.text}\n${note.note ? `\n${note.note}\n` : ""}\n— ${note.book}${note.chapter ? `, ${note.chapter}` : ""}`;
  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(null), 1800); };
  const copyMd = () => {
    try { navigator.clipboard.writeText(markdown); } catch {}
    flash("Markdown copied to clipboard");
  };
  return (
    <Overlay onClose={onClose}>
      <div style={{ borderTop: `4px solid var(--tag-${note.tag})`, borderRadius: "20px 20px 0 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "20px 22px 0" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-3)" }}>
            <TagDot tag={note.tag} size={9} /> {note.tag}
          </span>
          <span style={{ flex: 1 }} />
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 9, border: "none", background: "var(--surface-2)", color: "var(--ink-2)", display: "flex", alignItems: "center", justifyContent: "center" }}><I.close size={19} /></button>
        </div>

        <div style={{ padding: "16px 22px 22px" }}>
          <I.quote size={28} style={{ color: `var(--tag-${note.tag})`, opacity: 0.55, marginBottom: 8 }} />
          <div style={{ fontFamily: "var(--read)", fontSize: 23, lineHeight: 1.45 }}>{note.text}</div>

          {note.note && (
            <div style={{ marginTop: 22 }}>
              <div className="eyebrow" style={{ marginBottom: 10 }}>Your note</div>
              <div style={{ fontFamily: "var(--read)", fontSize: 16, lineHeight: 1.6, color: "var(--ink-2)", paddingLeft: 14, borderLeft: "2px solid var(--line-2)" }}>{note.note}</div>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 24, fontSize: 12.5, color: "var(--ink-3)" }}>
            <I.book size={15} /> {note.book}{note.chapter ? <> · {note.chapter}</> : null} · {note.date}
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 24, flexWrap: "wrap" }}>
            <button onClick={() => { onOpenSource({ book: note.book, passage: note.text }); onClose(); }} style={sourceBtn}>
              <I.book size={17} /> Go to passage <I.arrowRight size={16} />
            </button>
            <button onClick={copyMd} style={ghost}><I.copy size={16} /> Copy</button>
            <button onClick={() => setShareOpen(true)} style={ghost}><I.share size={16} /> Share</button>
          </div>
        </div>
      </div>

      {toast && (
        <div style={{ position: "fixed", left: "50%", bottom: 28, transform: "translateX(-50%)", zIndex: 90, display: "flex", alignItems: "center", gap: 9, padding: "11px 17px", borderRadius: 30, background: "var(--ink)", color: "var(--page)", fontSize: 13.5, fontWeight: 500, boxShadow: "0 12px 36px -10px rgba(0,0,0,0.5)", animation: "lumeFade 0.3s both" }}>
          <I.check size={16} style={{ color: "var(--accent)" }} /> {toast}
        </div>
      )}
      {shareOpen && <QuoteCard note={note} onClose={() => setShareOpen(false)} onCopy={() => flash("Quote card saved")} />}
    </Overlay>
  );
}

// Shareable quote card
function QuoteCard({ note, onClose, onCopy }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 95, background: "rgba(0,0,0,0.5)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, padding: 20, animation: "lumeFadeIn 0.22s both" }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "min(440px, 100%)", aspectRatio: "4 / 5", borderRadius: 20, overflow: "hidden",
        background: "var(--page)", border: "1px solid var(--line)", boxShadow: "0 30px 80px -30px rgba(0,0,0,0.6)",
        display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "40px 36px",
        animation: "lumeScaleIn 0.28s both", position: "relative",
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, width: 5, height: "100%", background: `var(--tag-${note.tag})` }} />
        <I.quote size={36} style={{ color: `var(--tag-${note.tag})`, opacity: 0.55 }} />
        <div style={{ fontFamily: "var(--read)", fontSize: "clamp(22px, 4.5vw, 28px)", lineHeight: 1.4, color: "var(--ink)" }}>{note.text}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: "var(--read)", fontSize: 15, color: "var(--ink)" }}>{note.book}</div>
            <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 2 }}>{note.author || note.chapter}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: "var(--read)", fontSize: 15, color: "var(--ink-3)" }}>
            <span style={{ width: 18, height: 18, borderRadius: 5, background: "var(--accent)", color: "var(--accent-ink)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><I.spark size={11} /></span>
            Lume
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => { onCopy(); onClose(); }} style={{ ...sourceBtn, padding: "12px 22px" }}><I.download size={17} /> Save image</button>
        <button onClick={onClose} style={{ ...ghost, background: "var(--surface)" }}>Close</button>
      </div>
    </div>
  );
}

// ── Card detail ──────────────────────────────────────────────────
function CardModal({ card, onClose, onOpenSource }) {
  const [revealed, setRevealed] = useStateD(false);
  if (!card) return null;
  const st = window.CARD_STATUS[card.status];
  return (
    <Overlay onClose={onClose} width={540}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "20px 22px 14px" }}>
          <span style={{ width: 30, height: 30, borderRadius: 9, background: "color-mix(in srgb, var(--accent) 14%, transparent)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}><I.cards size={18} /></span>
          <div style={{ flex: 1 }}>
            <div className="eyebrow">Recall card</div>
            <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 3 }}>{card.book}{card.chapter ? ` · ${card.chapter}` : ""}</div>
          </div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 11px", borderRadius: 20, fontSize: 11.5, fontWeight: 600,
            background: `color-mix(in srgb, ${st.color} 14%, transparent)`, color: st.color }}>
            <span style={{ width: 6, height: 6, borderRadius: 4, background: st.color }} /> {st.label}
          </span>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 9, border: "none", background: "var(--surface-2)", color: "var(--ink-2)", display: "flex", alignItems: "center", justifyContent: "center", marginLeft: 4 }}><I.close size={19} /></button>
        </div>

        <div style={{ padding: "8px 22px 22px" }}>
          {/* prompt */}
          <div style={{ padding: "22px 22px", borderRadius: 14, background: "var(--page)", border: "1px solid var(--line)" }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Prompt</div>
            <div style={{ fontFamily: "var(--read)", fontSize: 20, lineHeight: 1.4, fontWeight: 500 }}>{card.front}</div>
          </div>

          {/* answer */}
          {revealed ? (
            <div className="lume-enter" style={{ marginTop: 12, padding: "22px 22px", borderRadius: 14, background: "color-mix(in srgb, var(--accent) 7%, var(--surface))", border: "1px solid color-mix(in srgb, var(--accent) 22%, var(--line))" }}>
              <div className="eyebrow" style={{ marginBottom: 10 }}>Answer</div>
              <div style={{ fontFamily: "var(--read)", fontSize: 18, lineHeight: 1.55 }}>{card.back}</div>
            </div>
          ) : (
            <button onClick={() => setRevealed(true)} style={{
              width: "100%", marginTop: 12, padding: "18px", borderRadius: 14, border: "1px dashed var(--line-2)",
              background: "transparent", color: "var(--ink-2)", fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}><I.spark size={16} style={{ color: "var(--accent)" }} /> Reveal answer</button>
          )}

          {card.interval && card.interval !== "—" && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16, fontSize: 12.5, color: "var(--ink-3)" }}>
              <I.clock size={14} /> Next review in {card.interval}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 22, flexWrap: "wrap" }}>
            <button onClick={() => { onOpenSource({ book: card.book, passage: card.source }); onClose(); }} style={sourceBtn}>
              <I.book size={17} /> Go to passage <I.arrowRight size={16} />
            </button>
            <button onClick={onClose} style={ghost}>Close</button>
          </div>
        </div>
      </div>
    </Overlay>
  );
}

Object.assign(window, { NoteModal, CardModal });
