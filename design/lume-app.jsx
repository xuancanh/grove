// lume-app.jsx — app shell, navigation, routing, tweaks
const { useState: useStateApp, useEffect: useEffectApp } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "indigo",
  "accent": "#4B45D1",
  "readFont": "newsreader",
  "uiFont": "hanken",
  "density": "regular",
  "aiSurface": "sheet",
  "readerSize": 1.0,
  "showRhythm": true
}/*EDITMODE-END*/;

const THEME_META = [
  ["indigo", "Indigo", "#E9EAF3", "#4B45D1"],
  ["paper",  "Paper",  "#F1EBDD", "#B5552F"],
  ["slate",  "Slate",  "#E8EAEC", "#2F6E8B"],
  ["sage",   "Sage",   "#E4E8DF", "#5E7A4E"],
  ["night",  "Night",  "#16181B", "#C9824E"],
];

const NAV = [
  ["library", "Library", "library"],
  ["browse", "Browse", "browse"],
  ["discover", "Discover", "compass"],
  ["study", "Study", "layers"],
  ["search", "Search", "search"],
  ["settings", "Settings", "settings"],
];

// Study tabs → routed sub-views (Notes / Cards / Review live under one item)
const STUDY_TABS = [["notes", "Notes", "notes"], ["cards", "Cards", "cards"], ["review", "Review", "refresh"]];

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [route, setRoute] = useStateApp("library");
  const [book, setBook] = useStateApp(null);          // active reader book
  const [pageBook, setPageBook] = useStateApp(null);  // book landing page
  const [memBook, setMemBook] = useStateApp(null);    // memory view book
  const [aiOpen, setAiOpen] = useStateApp(false);
  const [aiInit, setAiInit] = useStateApp(null);
  const [focusText, setFocusText] = useStateApp(null);   // passage to spotlight in reader
  const prevRoute = React.useRef("library");
  const readerBack = React.useRef("library");            // where the reader returns to

  // apply accent override on top of theme
  const rootStyle = { "--accent": t.accent };

  // Clicking a book anywhere opens its landing page first.
  const openBook = (b) => { prevRoute.current = route; setPageBook(b); setRoute("book"); window.scrollTo(0, 0); };
  // Entering the reader (only Walden has full text; others use it as a stand-in).
  const readBook = (b) => { readerBack.current = (route === "reader" ? readerBack.current : route); setBook((b && b.paragraphs) ? b : window.WALDEN); setFocusText(null); setRoute("reader"); };
  // Jump straight to a passage in the reader (from a note / card).
  const openSource = ({ book: title, passage }) => {
    readerBack.current = (route === "reader" ? readerBack.current : route);
    const rec = window.bookByTitle(title);
    setBook((rec && rec.paragraphs) ? rec : window.WALDEN);
    setFocusText(passage || null);
    setRoute("reader");
  };
  const openMemory = (b) => { setMemBook(b || window.WALDEN); setRoute("memory"); };
  const goto = (r) => { setBook(null); setFocusText(null); setRoute(r); };

  const openAI = (init) => { setAiInit(init); setAiOpen(true); };

  const inReader = route === "reader";
  const density = t.density;
  const denseScale = density === "compact" ? 0.94 : density === "comfy" ? 1.06 : 1.0;

  return (
    <div className="lume-root lume-scroll" data-theme={t.theme} data-readfont={t.readFont} data-uifont={t.uiFont}
      style={{ ...rootStyle, fontSize: `${denseScale*16}px` }}>

      {/* MAIN LAYOUT */}
      {inReader ? (
        <window.Reader book={book} tweaks={t} focusText={focusText}
          onExit={() => goto(readerBack.current)} onOpenMemory={() => openMemory(book)} openAI={openAI} />
      ) : (
        <div style={{ display: "flex", minHeight: "100vh" }}>
          <Sidebar route={route} setRoute={(r) => { prevRoute.current = r; goto(r); }}
            theme={t.theme} setTheme={(v) => setTweak("theme", v)} />
          <main style={{ flex: 1, minWidth: 0, position: "relative" }}>
            {route === "library" && <window.Library onOpenBook={openBook} onOpenMemory={openMemory} onGoto={(r)=>{prevRoute.current=r; goto(r);}} />}
            {route === "browse" && <window.Browse onOpenBook={openBook} onGoto={(r)=>{prevRoute.current=r; goto(r);}} />}
            {route === "discover" && <window.Discover />}
            {route === "book" && <window.BookPage book={pageBook} onBack={() => goto(prevRoute.current)} onRead={readBook} onOpenMemory={openMemory} openAI={openAI} onOpenSource={openSource} />}
            {route === "notes" && <window.Notes onOpenSource={openSource} />}
            {route === "cards" && <window.Cards onOpenSource={openSource} />}
            {route === "review" && <window.Review onOpenSource={openSource} />}
            {route === "study" && <StudyHub onOpenSource={openSource} />}
            {route === "settings" && <Settings t={t} setTweak={setTweak} />}
            {route === "search" && <window.Search />}
            {route === "memory" && <window.Memory book={memBook} onBack={() => goto(prevRoute.current)} onOpenBook={openBook} />}
          </main>
        </div>
      )}

      {/* MOBILE BOTTOM TABS */}
      {!inReader && <BottomTabs route={route} setRoute={(r) => { prevRoute.current = r; goto(r); }} />}

      {/* AI COMPANION */}
      <window.AICompanion book={book || ((pageBook && pageBook.thread) ? pageBook : window.WALDEN)} open={aiOpen} initial={aiInit}
        surface={t.aiSurface} onClose={() => setAiOpen(false)} />

      {/* TWEAKS */}
      <TweaksPanel>
        <TweakSection label="Theme" />
        <TweakRadio label="Skin" value={t.theme} options={["indigo","paper","slate","night","sage"]}
          onChange={(v) => setTweak("theme", v)} />
        <TweakColor label="Accent" value={t.accent}
          options={["#4B45D1","#B5552F","#2F6E8B","#5E7A4E","#8A6CB0"]}
          onChange={(v) => setTweak("accent", v)} />
        <TweakSection label="Typography" />
        <TweakSelect label="Reading face" value={t.readFont}
          options={["newsreader","spectral","lora","literata","fraunces"]}
          onChange={(v) => setTweak("readFont", v)} />
        <TweakRadio label="UI face" value={t.uiFont} options={["hanken","inter"]}
          onChange={(v) => setTweak("uiFont", v)} />
        <TweakSlider label="Reader size" value={t.readerSize} min={0.85} max={1.3} step={0.05}
          onChange={(v) => setTweak("readerSize", v)} />
        <TweakRadio label="Density" value={t.density} options={["compact","regular","comfy"]}
          onChange={(v) => setTweak("density", v)} />
        <TweakSection label="AI companion" />
        <TweakRadio label="Surface" value={t.aiSurface} options={["sheet","drawer"]}
          onChange={(v) => setTweak("aiSurface", v)} />
      </TweaksPanel>
    </div>
  );
}

// ── Sidebar (wide screens) ───────────────────────────────────────
function Sidebar({ route, setRoute, theme, setTheme }) {
  const [themeOpen, setThemeOpen] = useStateApp(false);
  return (
    <aside className="lume-sidebar" style={{
      width: 232, flex: "none", borderRight: "1px solid var(--line)", padding: "30px 18px",
      position: "sticky", top: 0, height: "100vh", display: "flex", flexDirection: "column",
      background: "color-mix(in srgb, var(--surface) 50%, var(--bg))",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "0 10px", marginBottom: 38 }}>
        <Logo />
        <span style={{ fontFamily: "var(--read)", fontSize: 22, fontWeight: 500, letterSpacing: "-0.01em" }}>Lume</span>
      </div>
      <nav style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {NAV.map(([k, label, icon]) => {
          const on = route === k;
          return (
            <button key={k} onClick={() => setRoute(k)} style={{
              display: "flex", alignItems: "center", gap: 13, padding: "11px 14px", borderRadius: 11,
              border: "none", background: on ? "var(--surface)" : "transparent",
              color: on ? "var(--ink)" : "var(--ink-2)", fontSize: 14.5, fontWeight: on ? 600 : 500,
              boxShadow: on ? "0 1px 0 rgba(0,0,0,0.03), inset 0 0 0 1px var(--line)" : "none",
              position: "relative", transition: "background 0.15s",
            }}>
              {on && <span style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 3, height: 18, borderRadius: 3, background: "var(--accent)" }} />}
              <Glyph name={icon} size={19} style={{ color: on ? "var(--accent)" : "var(--ink-3)" }} /> {label}
            </button>
          );
        })}
      </nav>
      <div style={{ marginTop: "auto", padding: "16px 14px", borderRadius: 14, background: "var(--surface)", border: "1px solid var(--line)" }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Today</div>
        <div style={{ fontFamily: "var(--read)", fontSize: 15, lineHeight: 1.35 }}>38 min read · 2 cards due</div>
      </div>

      {/* Appearance / theme chooser */}
      <div style={{ position: "relative", marginTop: 12 }}>
        <button onClick={() => setThemeOpen((o) => !o)} style={{
          display: "flex", alignItems: "center", gap: 11, width: "100%", padding: "11px 14px", borderRadius: 11,
          border: "none", background: themeOpen ? "var(--surface)" : "transparent",
          color: themeOpen ? "var(--ink)" : "var(--ink-2)", fontSize: 14.5, fontWeight: themeOpen ? 600 : 500,
          boxShadow: themeOpen ? "inset 0 0 0 1px var(--line)" : "none", transition: "background 0.15s",
        }}>
          <span style={{ width: 19, height: 19, borderRadius: "50%", flex: "none",
            background: (THEME_META.find((m) => m[0] === theme) || THEME_META[0])[3],
            boxShadow: "inset 0 0 0 1.5px color-mix(in srgb, var(--ink) 22%, transparent)" }} />
          Appearance
          <Glyph name="chevronDown" size={15} style={{ marginLeft: "auto", color: "var(--ink-3)", transform: themeOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
        </button>
        {themeOpen && (
          <ThemeMenu theme={theme} setTheme={setTheme} onPick={() => setThemeOpen(false)}
            style={{ position: "absolute", left: 0, right: 0, bottom: "calc(100% + 8px)", zIndex: 60 }} />
        )}
      </div>
    </aside>
  );
}

// ── Theme menu (shared by sidebar + mobile) ──────────────────────
function ThemeMenu({ theme, setTheme, onPick, style }) {
  return (
    <div style={{
      padding: 8, borderRadius: 14, background: "var(--surface)", border: "1px solid var(--line)",
      boxShadow: "0 12px 32px -8px rgba(0,0,0,0.28)", ...style,
    }}>
      <div className="eyebrow" style={{ padding: "4px 8px 8px" }}>Theme</div>
      {THEME_META.map(([key, label, bg, ac]) => {
        const on = theme === key;
        return (
          <button key={key} onClick={() => { setTheme(key); onPick && onPick(); }} style={{
            display: "flex", alignItems: "center", gap: 11, width: "100%", padding: "8px 10px", borderRadius: 9,
            border: "none", background: on ? "var(--surface-2)" : "transparent",
            color: "var(--ink)", fontSize: 14, fontWeight: on ? 600 : 500, textAlign: "left",
          }}>
            <span style={{ width: 26, height: 26, borderRadius: 8, flex: "none", background: bg,
              border: "1px solid color-mix(in srgb, var(--ink) 14%, transparent)",
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ width: 11, height: 11, borderRadius: "50%", background: ac }} />
            </span>
            {label}
            {on && <Glyph name="check" size={16} style={{ marginLeft: "auto", color: "var(--accent)" }} />}
          </button>
        );
      })}
    </div>
  );
}

// ── Mobile appearance button (hidden on wide screens) ────────────
function MobileTheme({ theme, setTheme }) {
  const [open, setOpen] = useStateApp(false);
  const ac = (THEME_META.find((m) => m[0] === theme) || THEME_META[0])[3];
  return (
    <div className="lume-mobile-theme" style={{ position: "fixed", right: 16, bottom: 84, zIndex: 60, display: "none" }}>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: -1 }} />
          <ThemeMenu theme={theme} setTheme={setTheme} onPick={() => setOpen(false)}
            style={{ position: "absolute", right: 0, bottom: "calc(100% + 10px)", width: 180 }} />
        </>
      )}
      <button onClick={() => setOpen((o) => !o)} aria-label="Appearance" style={{
        width: 48, height: 48, borderRadius: "50%", border: "1px solid var(--line)",
        background: "var(--surface)", boxShadow: "0 6px 20px -6px rgba(0,0,0,0.35)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ width: 20, height: 20, borderRadius: "50%", background: ac,
          boxShadow: "inset 0 0 0 1.5px color-mix(in srgb, var(--ink) 22%, transparent)" }} />
      </button>
    </div>
  );
}

function BottomTabs({ route, setRoute }) {
  return (
    <nav className="lume-bottom" style={{
      position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 45,
      display: "none", gridTemplateColumns: `repeat(${NAV.length}, 1fr)`,
      background: "color-mix(in srgb, var(--surface) 88%, transparent)", backdropFilter: "blur(16px)",
      borderTop: "1px solid var(--line)", paddingBottom: "env(safe-area-inset-bottom)",
    }}>
      {NAV.map(([k, label, icon]) => {
        const on = route === k;
        return (
          <button key={k} onClick={() => setRoute(k)} style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "10px 0 9px",
            border: "none", background: "transparent", color: on ? "var(--accent)" : "var(--ink-3)",
          }}>
            <Glyph name={icon} size={21} /> <span style={{ fontSize: 10.5, fontWeight: on ? 600 : 500 }}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function Logo() {
  return (
    <span style={{ width: 30, height: 30, borderRadius: 9, background: "var(--accent)", color: "var(--accent-ink)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
      </svg>
    </span>
  );
}

// ── Study hub (Notes + Cards + Review under one nav item) ──────
function StudyHub({ onOpenSource }) {
  const [tab, setTab] = useStateApp("notes");
  return (
    <div>
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "32px 40px 0" }}>
        <div className="eyebrow" style={{ marginBottom: 14, color: "var(--accent)" }}>Study</div>
        <div style={{ display: "inline-flex", gap: 4, padding: 4, borderRadius: 12, background: "var(--surface-2)", border: "1px solid var(--line)" }}>
          {STUDY_TABS.map(([k, l, ic]) => {
            const on = tab === k;
            return (
              <button key={k} onClick={() => setTab(k)} style={{
                display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 18px", borderRadius: 9, border: "none",
                fontSize: 14, fontWeight: on ? 600 : 500, background: on ? "var(--surface)" : "transparent",
                color: on ? "var(--ink)" : "var(--ink-2)", boxShadow: on ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
              }}>
                <Glyph name={ic} size={17} style={{ color: on ? "var(--accent)" : "var(--ink-3)" }} /> {l}
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ marginTop: -8 }}>
        {tab === "notes" && <window.Notes onOpenSource={onOpenSource} />}
        {tab === "cards" && <window.Cards onOpenSource={onOpenSource} />}
        {tab === "review" && <window.Review onOpenSource={onOpenSource} />}
      </div>
    </div>
  );
}

// ── Settings screen ─────────────────────────────────────
function Settings({ t, setTweak }) {
  const seg = (label, key, opts) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "18px 0", borderBottom: "1px solid var(--line)", flexWrap: "wrap" }}>
      <div style={{ fontSize: 15, color: "var(--ink)" }}>{label}</div>
      <div style={{ display: "inline-flex", gap: 4, padding: 4, borderRadius: 10, background: "var(--surface-2)", border: "1px solid var(--line)", flexWrap: "wrap" }}>
        {opts.map(([ov, ol]) => {
          const on = t[key] === ov;
          return (
            <button key={ov} onClick={() => setTweak(key, ov)} style={{
              padding: "7px 14px", borderRadius: 7, border: "none", fontSize: 13, fontWeight: on ? 600 : 500,
              background: on ? "var(--surface)" : "transparent", color: on ? "var(--ink)" : "var(--ink-2)",
            }}>{ol}</button>
          );
        })}
      </div>
    </div>
  );
  return (
    <div className="lume-enter" style={{ maxWidth: 760, margin: "0 auto", padding: "34px 40px 90px" }}>
      <window.ScreenHead eyebrow="Preferences" title="Settings"
        sub="Tune how Lume looks and reads. Changes apply instantly and are remembered on this device." />

      <div className="eyebrow" style={{ margin: "8px 0 16px" }}>Theme</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12, marginBottom: 40 }}>
        {THEME_META.map(([key, label, bg, ac]) => {
          const on = t.theme === key;
          return (
            <button key={key} onClick={() => setTweak("theme", key)} className="hover-lift" style={{
              textAlign: "left", padding: 13, borderRadius: 14, cursor: "pointer", background: "var(--surface)",
              border: on ? "2px solid var(--accent)" : "1px solid var(--line)",
            }}>
              <div style={{ height: 54, borderRadius: 9, background: bg, position: "relative", marginBottom: 11,
                border: "1px solid color-mix(in srgb, var(--ink) 12%, transparent)" }}>
                <span style={{ position: "absolute", left: 10, bottom: 10, width: 22, height: 22, borderRadius: "50%", background: ac }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 14, fontWeight: on ? 600 : 500, color: "var(--ink)" }}>{label}</span>
                {on && <Glyph name="check" size={16} style={{ color: "var(--accent)" }} />}
              </div>
            </button>
          );
        })}
      </div>

      <div className="eyebrow" style={{ marginBottom: 16 }}>Accent</div>
      <div style={{ display: "flex", gap: 14, marginBottom: 40, flexWrap: "wrap" }}>
        {["#4B45D1", "#B5552F", "#2F6E8B", "#5E7A4E", "#8A6CB0"].map((c) => {
          const on = t.accent === c;
          return (
            <button key={c} onClick={() => setTweak("accent", c)} aria-label={c} style={{
              width: 40, height: 40, borderRadius: "50%", background: c, border: "none", cursor: "pointer",
              boxShadow: on ? `0 0 0 3px var(--bg), 0 0 0 5px ${c}` : "inset 0 0 0 1px rgba(0,0,0,0.15)",
            }} />
          );
        })}
      </div>

      <div className="eyebrow" style={{ marginBottom: 4 }}>Reading &amp; interface</div>
      {seg("Reading face", "readFont", [["newsreader", "Newsreader"], ["spectral", "Spectral"], ["lora", "Lora"], ["literata", "Literata"], ["fraunces", "Fraunces"]])}
      {seg("Interface face", "uiFont", [["hanken", "Hanken"], ["inter", "Inter"]])}
      {seg("Density", "density", [["compact", "Compact"], ["regular", "Regular"], ["comfy", "Comfy"]])}
      {seg("AI surface", "aiSurface", [["sheet", "Sheet"], ["drawer", "Drawer"]])}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
