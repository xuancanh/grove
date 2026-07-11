// lume-discover.jsx — find & download new books and papers → window.Discover
const { useState: useStateD, useMemo: useMemoD, useEffect: useEffectD, useRef: useRefD } = React;

// ── The catalog of downloadable works (public-domain books + landmark papers) ──
// type: book | paper ; topics map onto the same vocabulary the library uses.
const CATALOG = [
  // ── Books ──────────────────────────────────────────────────────────
  { id: "civil", type: "book", title: "Civil Disobedience", author: "Henry David Thoreau", year: 1849,
    genre: "Essay", topics: ["Society", "Power", "Self"], format: "EPUB", pages: 28, downloads: "41.2k",
    cover: { bg: "#2E3B30", fg: "#E9E0CC", accent: "#C9764A" },
    blurb: "The essay that taught the modern world how to say no.",
    about: "Written after a night in jail for refusing a poll tax, Thoreau argues that the individual conscience outranks the state. The pamphlet that later moved Gandhi and King." },
  { id: "nature", type: "book", title: "Nature", author: "Ralph Waldo Emerson", year: 1836,
    genre: "Essay", topics: ["Nature", "Self", "Beauty"], format: "EPUB", pages: 92, downloads: "33.8k",
    cover: { bg: "#33402C", fg: "#E7E6D2", accent: "#A7B36A" },
    blurb: "The founding document of American Transcendentalism.",
    about: "Emerson's first book makes the case that nature is not scenery but a direct channel to the spirit — the soil Thoreau would soon plant himself in at Walden Pond." },
  { id: "zarathustra", type: "book", title: "Thus Spoke Zarathustra", author: "Friedrich Nietzsche", year: 1883,
    genre: "Philosophy", topics: ["Self", "Power", "Ethics"], format: "EPUB", pages: 352, downloads: "58.6k",
    cover: { bg: "#2A2A30", fg: "#DEDAD0", accent: "#B57A4E" },
    blurb: "A prophet comes down from the mountain to teach the overman.",
    about: "Half philosophy, half scripture, Nietzsche's strangest book dramatizes the death of God and the call to create your own values. Read it as a poem and it opens." },
  { id: "mobydick", type: "book", title: "Moby-Dick", author: "Herman Melville", year: 1851,
    genre: "Fiction", topics: ["Nature", "Desire", "Mortality"], format: "EPUB", pages: 635, downloads: "72.1k",
    cover: { bg: "#1C3B4A", fg: "#DCE6EC", accent: "#5E8FA8" },
    blurb: "One man's monomania against the indifferent sea.",
    about: "Equal parts adventure, encyclopedia, and metaphysical fever dream. Ahab's hunt for the white whale is the great American novel about obsession and the limits of will." },
  { id: "crime", type: "book", title: "Crime and Punishment", author: "Fyodor Dostoevsky", year: 1866,
    genre: "Fiction", topics: ["Mind", "Society", "Ethics"], format: "EPUB", pages: 545, downloads: "64.5k",
    cover: { bg: "#34302E", fg: "#DAD2C6", accent: "#9A6B5E" },
    blurb: "A murder, and the conscience that will not let it rest.",
    about: "Raskolnikov theorizes himself into a killing, then spends 500 pages being slowly reclaimed by guilt. The deepest novel ever written about the gap between idea and act." },
  { id: "artofwar", type: "book", title: "The Art of War", author: "Sun Tzu", year: -500,
    genre: "Philosophy", topics: ["Power", "Society"], format: "EPUB", pages: 68, downloads: "49.0k",
    cover: { bg: "#46402F", fg: "#EFE7CF", accent: "#C0A24E" },
    blurb: "Twenty-five centuries of strategy in a slim volume.",
    about: "Less about war than about winning without fighting. Sun Tzu's terse maxims on terrain, timing, and deception read as cleanly today in a boardroom as on a battlefield." },
  { id: "rilke", type: "book", title: "Letters to a Young Poet", author: "Rainer Maria Rilke", year: 1929,
    genre: "Letters", topics: ["Self", "Beauty", "Solitude"], format: "EPUB", pages: 96, downloads: "38.4k",
    cover: { bg: "#3B4654", fg: "#E8E2D4", accent: "#C99A5E" },
    blurb: "Ten letters on how to live an inward, patient life.",
    about: "A famous poet answers a stranger's questions about whether he should write — and answers instead the deeper question of how to bear solitude and live the questions themselves." },
  { id: "odyssey", type: "book", title: "The Odyssey", author: "Homer", year: -700,
    genre: "Poetry", topics: ["Desire", "Mortality", "Nature"], format: "EPUB", pages: 416, downloads: "55.3k",
    cover: { bg: "#243A44", fg: "#E6DCC0", accent: "#C99A5E" },
    blurb: "The original story of the long way home.",
    about: "Ten years of sea, monsters, and longing as Odysseus claws his way back to Ithaca. The template for nearly every journey narrative that followed." },
  { id: "onliberty", type: "book", title: "On Liberty", author: "John Stuart Mill", year: 1859,
    genre: "Philosophy", topics: ["Society", "Power", "Self"], format: "EPUB", pages: 132, downloads: "29.7k",
    cover: { bg: "#3E2F2A", fg: "#EAD9C6", accent: "#C77B4E" },
    blurb: "Where does my freedom end and yours begin?",
    about: "Mill's defense of the individual against the 'tyranny of the majority' still sets the terms of every argument about speech, harm, and the proper reach of society." },
  { id: "dreams", type: "book", title: "The Interpretation of Dreams", author: "Sigmund Freud", year: 1899,
    genre: "Science", topics: ["Mind", "Self"], format: "EPUB", pages: 510, downloads: "27.9k",
    cover: { bg: "#38343F", fg: "#E2DCE6", accent: "#9A8AB0" },
    blurb: "The book that gave the unconscious a map.",
    about: "Right or wrong, Freud's claim that dreams are 'the royal road to the unconscious' invented the modern idea that the mind keeps secrets from itself." },
  { id: "ethics", type: "book", title: "Nicomachean Ethics", author: "Aristotle", year: -340,
    genre: "Philosophy", topics: ["Ethics", "Self", "Society"], format: "EPUB", pages: 320, downloads: "31.5k",
    cover: { bg: "#2C3A3A", fg: "#E6E4D6", accent: "#C8A24E" },
    blurb: "What is a good life, and how is it built?",
    about: "Aristotle's answer to the oldest question: the good life is not a feeling but a practice, virtue formed by habit, aimed at flourishing. Still the starting point for ethics." },
  { id: "souls", type: "book", title: "The Souls of Black Folk", author: "W. E. B. Du Bois", year: 1903,
    genre: "Essay", topics: ["Society", "Self", "Power"], format: "EPUB", pages: 264, downloads: "34.2k",
    cover: { bg: "#2A2E2C", fg: "#CFE0D8", accent: "#7FA89A" },
    blurb: "Fourteen essays that reframed a nation's conscience.",
    about: "Du Bois names 'double-consciousness' — the felt experience of seeing yourself through a world's contempt — and turns sociology into something closer to scripture." },

  // ── Papers ─────────────────────────────────────────────────────────
  { id: "turingmind", type: "paper", title: "Computing Machinery and Intelligence", author: "Alan M. Turing", year: 1950,
    venue: "Mind, Vol. LIX", topics: ["Mind"], format: "PDF", pages: 28, downloads: "18.9k", tint: "#3E7C8B",
    blurb: "Proposes the imitation game and asks, can machines think? The paper that founded the field of AI.",
    about: "Turing sidesteps the unanswerable 'can machines think?' for an operational test — the imitation game — and demolishes nine objections in turn. The intellectual cornerstone of artificial intelligence." },
  { id: "shannon", type: "paper", title: "A Mathematical Theory of Communication", author: "Claude E. Shannon", year: 1948,
    venue: "Bell System Technical Journal", topics: ["Mind", "Society"], format: "PDF", pages: 55, downloads: "21.3k", tint: "#5E7A4E",
    blurb: "Defines the bit and the channel. The single paper that created information theory.",
    about: "Shannon shows that all communication — voice, text, image — reduces to bits moving through a noisy channel, and derives the hard limits on how fast they can move. The bedrock of the digital age." },
  { id: "bush", type: "paper", title: "As We May Think", author: "Vannevar Bush", year: 1945,
    venue: "The Atlantic", topics: ["Mind", "Society"], format: "PDF", pages: 16, downloads: "12.7k", tint: "#8A6CB0",
    blurb: "Imagines the 'memex' — a desk that links documents by association. The dream that became the web.",
    about: "Written as WWII ended, Bush pictures a machine that augments memory by trails of association rather than rigid indexes — a startlingly exact premonition of hypertext and the personal computer." },
  { id: "maslow", type: "paper", title: "A Theory of Human Motivation", author: "A. H. Maslow", year: 1943,
    venue: "Psychological Review", topics: ["Mind", "Self"], format: "PDF", pages: 22, downloads: "16.4k", tint: "#C9764A",
    blurb: "Introduces the hierarchy of needs, from safety to self-actualization.",
    about: "Maslow's claim that human needs stack — you chase belonging only once you're fed and safe, and meaning only once you belong — became the most cited idea in popular psychology." },
  { id: "einstein", type: "paper", title: "On the Electrodynamics of Moving Bodies", author: "Albert Einstein", year: 1905,
    venue: "Annalen der Physik", topics: ["Nature", "Time"], format: "PDF", pages: 31, downloads: "14.1k", tint: "#2F6E8B",
    blurb: "The special theory of relativity, with no footnotes and almost no citations.",
    about: "From two simple postulates Einstein dissolves absolute time and space, making simultaneity relative to the observer. One of the great 1905 papers that remade physics." },
  { id: "hayek", type: "paper", title: "The Use of Knowledge in Society", author: "F. A. Hayek", year: 1945,
    venue: "American Economic Review", topics: ["Society", "Power"], format: "PDF", pages: 18, downloads: "9.8k", tint: "#9A7B3E",
    blurb: "Why no central planner can know what the price system already knows.",
    about: "Hayek argues that the crucial economic knowledge is dispersed, local, and fleeting — so prices, not planners, are the only mechanism that can coordinate it. A founding text of modern economics." },
];

const CATALOG_BY_ID = Object.fromEntries(CATALOG.map(x => [x.id, x]));

// Related = shares the most topics; ties broken by same type, then downloads. Top N.
const relatedTo = (item, n = 4) => {
  const ts = new Set(item.topics || []);
  return CATALOG
    .filter(x => x.id !== item.id)
    .map(x => ({ x, score: (x.topics || []).filter(t => ts.has(t)).length + (x.type === item.type ? 0.3 : 0) }))
    .filter(o => o.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map(o => o.x);
};

const ALL_TOPICS = Array.from(new Set(CATALOG.flatMap(c => c.topics))).sort();

// Curated suggestion shelves
const SHELVES = [
  { id: "walden", eyebrow: "Because you read", title: "Walden", icon: "library",
    sub: "More from the Transcendentalists and the literature of the self in nature.",
    ids: ["civil", "nature", "rilke", "mobydick", "odyssey", "zarathustra"] },
  { id: "foryou", eyebrow: "Picked for you", title: "From the ideas you keep marking", icon: "sparkle",
    sub: "Drawn from the topics across your highlights — the self, ethics, and the examined life.",
    ids: ["ethics", "onliberty", "crime", "souls", "zarathustra", "dreams"] },
  { id: "papers", eyebrow: "Papers", title: "Landmark papers worth an afternoon", icon: "doc",
    sub: "Short, world-changing, and free. The kind of reading that rewires how you think.",
    ids: ["turingmind", "shannon", "bush", "maslow", "einstein", "hayek"] },
  { id: "trending", eyebrow: "Trending this week", title: "What other readers are downloading", icon: "trend",
    sub: null,
    ids: ["mobydick", "crime", "artofwar", "turingmind", "ethics", "odyssey"] },
];

// ── Download state (persisted) ─────────────────────────────────────────
const loadDownloaded = () => { try { return JSON.parse(localStorage.getItem("lume_downloaded") || "[]"); } catch (e) { return []; } };

// ══ DISCOVER ════════════════════════════════════════════════════════════
function Discover() {
  const S = window.lumeStyles;
  const [q, setQ] = useStateD("");
  const [type, setType] = useStateD("all");        // all | book | paper
  const [topic, setTopic] = useStateD(null);
  const [active, setActive] = useStateD(null);      // item open in the detail drawer
  const [downloaded, setDownloaded] = useStateD(loadDownloaded);   // array of ids
  const [progress, setProgress] = useStateD({});    // id -> 0..100 while downloading
  const timers = useRefD({});

  useEffectD(() => { localStorage.setItem("lume_downloaded", JSON.stringify(downloaded)); }, [downloaded]);
  useEffectD(() => () => { Object.values(timers.current).forEach(clearInterval); }, []);

  const isDown = (id) => downloaded.includes(id);
  const startDownload = (id) => {
    if (isDown(id) || progress[id] != null) return;
    setProgress(p => ({ ...p, [id]: 4 }));
    timers.current[id] = setInterval(() => {
      setProgress(p => {
        const next = Math.min(100, (p[id] || 0) + (8 + Math.random() * 16));
        if (next >= 100) {
          clearInterval(timers.current[id]); delete timers.current[id];
          setDownloaded(d => d.includes(id) ? d : [...d, id]);
          const { [id]: _, ...rest } = p; return rest;
        }
        return { ...p, [id]: next };
      });
    }, 240);
  };

  const filtering = q.trim() !== "" || topic !== null || type !== "all";
  const results = useMemoD(() => {
    const needle = q.trim().toLowerCase();
    return CATALOG.filter(c => {
      if (type !== "all" && c.type !== type) return false;
      if (topic && !(c.topics || []).includes(topic)) return false;
      if (needle) {
        const hay = (c.title + " " + c.author + " " + (c.genre || c.venue || "") + " " + c.topics.join(" ") + " " + c.blurb).toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [q, type, topic]);

  const resBooks = results.filter(r => r.type === "book");
  const resPapers = results.filter(r => r.type === "paper");

  const cardProps = { onOpen: setActive, isDown, progress, onGet: startDownload };

  return (
    <div className="lume-enter" style={{ ...S.wrap, maxWidth: 1140 }}>
      <window.ScreenHead eyebrow="Discover"
        title="Find your next book."
        sub="Search a library of public-domain classics and landmark papers — then download any of them straight into Lume, free." />

      {/* Search */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, height: 60, padding: "0 8px 0 20px", borderRadius: 16,
        background: "var(--surface)", border: "1px solid var(--line-2)", boxShadow: "0 8px 30px -16px rgba(0,0,0,0.2)", marginBottom: 16 }}>
        <I.search size={20} style={{ color: "var(--ink-3)", flex: "none" }} />
        <input value={q} onChange={e => setQ(e.target.value)}
          placeholder="Search titles, authors, ideas — “Dostoevsky”, “information theory”, “the self”…"
          style={{ flex: 1, minWidth: 0, border: "none", background: "none", outline: "none", fontSize: 16, color: "var(--ink)", fontFamily: "var(--read)" }} />
        {q && <button onClick={() => setQ("")} style={{ width: 34, height: 34, borderRadius: 9, border: "none", background: "var(--surface-2)", color: "var(--ink-2)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><I.close size={17} /></button>}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap", marginBottom: 34 }}>
        <div style={{ display: "flex", gap: 2, padding: 3, borderRadius: 11, background: "var(--surface-2)", border: "1px solid var(--line)" }}>
          {[["all", "All"], ["book", "Books"], ["paper", "Papers"]].map(([v, l]) => (
            <button key={v} onClick={() => setType(v)} style={{
              padding: "7px 16px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: type === v ? 600 : 500,
              background: type === v ? "var(--surface)" : "transparent", color: type === v ? "var(--ink)" : "var(--ink-3)",
              boxShadow: type === v ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            }}>{l}</button>
          ))}
        </div>
        <div className="lume-scroll" style={{ display: "flex", gap: 7, overflowX: "auto", flex: 1, minWidth: 0, paddingBottom: 2 }}>
          {ALL_TOPICS.map(t => {
            const on = topic === t;
            return (
              <button key={t} onClick={() => setTopic(on ? null : t)} style={{
                padding: "7px 13px", borderRadius: 30, flex: "none", fontSize: 12.5, fontWeight: on ? 600 : 500,
                border: `1px solid ${on ? "var(--accent)" : "var(--line-2)"}`, background: on ? "var(--accent)" : "transparent",
                color: on ? "var(--accent-ink)" : "var(--ink-2)",
              }}>{t}</button>
            );
          })}
        </div>
      </div>

      {filtering ? (
        // ── RESULTS ───────────────────────────────────────────────
        results.length === 0 ? (
          <div style={{ textAlign: "center", padding: "70px 20px", color: "var(--ink-3)" }}>
            <I.compass size={32} style={{ opacity: 0.4 }} />
            <p style={{ fontSize: 14.5, marginTop: 14, fontFamily: "var(--read)" }}>No works match that. Try a broader term or clear the filters.</p>
          </div>
        ) : (
          <div className="lume-enter">
            <div style={{ fontSize: 13, color: "var(--ink-3)", marginBottom: 22 }}>
              {results.length} {results.length === 1 ? "work" : "works"}{topic && <> in <b style={{ color: "var(--ink-2)" }}>{topic}</b></>}
            </div>
            {resBooks.length > 0 && (
              <section style={{ marginBottom: resPapers.length ? 40 : 0 }}>
                {(type === "all") && <RailHead title="Books" count={resBooks.length} />}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))", gap: 28 }}>
                  {resBooks.map(b => <BookFindCard key={b.id} item={b} {...cardProps} />)}
                </div>
              </section>
            )}
            {resPapers.length > 0 && (
              <section>
                {(type === "all") && <RailHead title="Papers" count={resPapers.length} />}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 16 }}>
                  {resPapers.map(p => <PaperFindCard key={p.id} item={p} {...cardProps} />)}
                </div>
              </section>
            )}
          </div>
        )
      ) : (
        // ── CURATED SHELVES ───────────────────────────────────────
        <div style={{ display: "flex", flexDirection: "column", gap: 52 }}>
          {SHELVES.map(sh => (
            <Rail key={sh.id} shelf={sh} items={sh.ids.map(id => CATALOG_BY_ID[id]).filter(Boolean)} {...cardProps} />
          ))}
        </div>
      )}

      {active && (
        <DetailDrawer item={active} onClose={() => setActive(null)} onOpen={setActive}
          isDown={isDown} progress={progress} onGet={startDownload} />
      )}
    </div>
  );
}

// ── Section header ────────────────────────────────────────────────
function RailHead({ eyebrow, icon, title, sub, count }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
        {eyebrow && (
          <span className="eyebrow" style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "var(--accent)" }}>
            {icon && <Glyph name={icon} size={14} />} {eyebrow}
          </span>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 11, marginTop: eyebrow ? 7 : 0 }}>
        <h2 style={{ fontFamily: "var(--read)", fontWeight: 400, fontSize: 25, margin: 0, letterSpacing: "-0.01em" }}>{title}</h2>
        {count != null && <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink-3)" }}>{count}</span>}
      </div>
      {sub && <p style={{ fontSize: 13.5, color: "var(--ink-2)", margin: "8px 0 0", maxWidth: 560, lineHeight: 1.5 }}>{sub}</p>}
    </div>
  );
}

// ── A horizontally-scrolling shelf ────────────────────────────────
function Rail({ shelf, items, ...cardProps }) {
  const allPapers = items.every(i => i.type === "paper");
  return (
    <section>
      <RailHead eyebrow={shelf.eyebrow} icon={shelf.icon} title={shelf.title} sub={shelf.sub} />
      <div className="lume-scroll" style={{ display: "flex", gap: allPapers ? 16 : 26, overflowX: "auto", padding: "4px 4px 16px", margin: "0 -4px" }}>
        {items.map(it => it.type === "paper"
          ? <div key={it.id} style={{ width: 320, flex: "none" }}><PaperFindCard item={it} {...cardProps} /></div>
          : <div key={it.id} style={{ width: 158, flex: "none" }}><BookFindCard item={it} {...cardProps} /></div>
        )}
      </div>
    </section>
  );
}

// ── Book card ──────────────────────────────────────────────────────
function BookFindCard({ item, onOpen, isDown, progress, onGet }) {
  const down = isDown(item.id);
  const pct = progress[item.id];
  return (
    <div className="hover-lift" style={{ display: "flex", flexDirection: "column", gap: 11 }}>
      <button onClick={() => onOpen(item)} style={{ border: "none", background: "none", padding: 0, cursor: "pointer", display: "block", position: "relative" }}>
        <Cover book={item} w="100%" h={216} radius={6} style={{ width: "100%" }} />
        <span style={{ position: "absolute", top: 8, left: 8, display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 8px", borderRadius: 20,
          fontSize: 9.5, fontWeight: 700, fontFamily: "var(--mono)", letterSpacing: "0.04em",
          background: "color-mix(in srgb, var(--page) 86%, transparent)", backdropFilter: "blur(6px)", color: "var(--ink-2)" }}>
          {item.format}
        </span>
        {down && (
          <span style={{ position: "absolute", top: 8, right: 8, width: 24, height: 24, borderRadius: 20, background: "var(--tag-idea)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <I.check size={14} />
          </span>
        )}
      </button>
      <div style={{ minWidth: 0 }}>
        <button onClick={() => onOpen(item)} style={{ border: "none", background: "none", padding: 0, textAlign: "left", cursor: "pointer", display: "block", width: "100%" }}>
          <div style={{ fontFamily: "var(--read)", fontSize: 15.5, lineHeight: 1.2, color: "var(--ink)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{item.title}</div>
          <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.author}</div>
        </button>
        <GetButton size="sm" down={down} pct={pct} onGet={() => onGet(item.id)} downloads={item.downloads} />
      </div>
    </div>
  );
}

// ── Paper card ─────────────────────────────────────────────────────
function PaperFindCard({ item, onOpen, isDown, progress, onGet }) {
  const down = isDown(item.id);
  const pct = progress[item.id];
  const tint = item.tint || "var(--accent)";
  return (
    <div className="hover-lift" style={{ display: "flex", flexDirection: "column", borderRadius: 16, background: "var(--surface)", border: "1px solid var(--line)", overflow: "hidden", height: "100%" }}>
      <button onClick={() => onOpen(item)} style={{ border: "none", background: "none", padding: "18px 20px 14px", textAlign: "left", cursor: "pointer", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 13 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontFamily: "var(--mono)", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", color: tint }}>
            <span style={{ width: 18, height: 18, borderRadius: 5, background: `color-mix(in srgb, ${tint} 16%, transparent)`, color: tint, display: "flex", alignItems: "center", justifyContent: "center" }}><I.doc size={12} /></span>
            PAPER · {item.format}
          </span>
          <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--ink-3)" }}>{item.year}</span>
        </div>
        <div style={{ fontFamily: "var(--read)", fontSize: 18.5, lineHeight: 1.22, color: "var(--ink)" }}>{item.title}</div>
        <div style={{ fontSize: 12.5, color: "var(--ink-2)", marginTop: 6 }}>{item.author} · <span style={{ fontStyle: "italic" }}>{item.venue}</span></div>
        <p style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.5, margin: "12px 0 0",
          display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{item.blurb}</p>
      </button>
      <div style={{ padding: "0 20px 18px" }}>
        <GetButton size="sm" down={down} pct={pct} onGet={() => onGet(item.id)} downloads={item.downloads} />
      </div>
    </div>
  );
}

// ── Get / download control (compact, used on cards) ────────────────
function GetButton({ down, pct, onGet, downloads, size = "sm" }) {
  const downloading = pct != null;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 10 }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, color: "var(--ink-3)", fontFamily: "var(--ui)" }}>
        <I.download size={13} /> {downloads}
      </span>
      {down ? (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "var(--tag-idea)", fontFamily: "var(--ui)" }}>
          <I.check size={14} /> In library
        </span>
      ) : downloading ? (
        <span style={{ position: "relative", overflow: "hidden", display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 9, fontSize: 12, fontWeight: 600, fontFamily: "var(--mono)",
          background: "var(--surface-2)", color: "var(--ink-2)", minWidth: 78, justifyContent: "center" }}>
          <span style={{ position: "absolute", inset: 0, width: `${pct}%`, background: "color-mix(in srgb, var(--accent) 22%, transparent)", transition: "width 0.24s linear" }} />
          <span style={{ position: "relative" }}>{Math.round(pct)}%</span>
        </span>
      ) : (
        <button onClick={(e) => { e.stopPropagation(); onGet(); }} style={{
          display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 13px", borderRadius: 9, border: "1px solid var(--accent)",
          background: "color-mix(in srgb, var(--accent) 10%, transparent)", color: "var(--accent)", fontSize: 12, fontWeight: 600,
        }}>
          <I.download size={14} /> Get
        </button>
      )}
    </div>
  );
}

// ── Detail drawer (full info + related works) ──────────────────────
function DetailDrawer({ item, onClose, onOpen, isDown, progress, onGet }) {
  const related = useMemoD(() => relatedTo(item), [item.id]);
  const down = isDown(item.id);
  const pct = progress[item.id];
  const downloading = pct != null;
  const isPaper = item.type === "paper";
  const tint = isPaper ? (item.tint || "var(--accent)") : item.cover.accent;

  // lock scroll while open
  useEffectD(() => { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }, []);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(0,0,0,0.4)", animation: "lumeFadeIn 0.22s both", display: "flex", justifyContent: "flex-end" }}>
      <div onClick={e => e.stopPropagation()} className="lume-scroll" style={{
        width: "min(480px, 100%)", height: "100%", overflowY: "auto", background: "var(--bg)",
        borderLeft: "1px solid var(--line)", boxShadow: "-30px 0 80px -30px rgba(0,0,0,0.5)", animation: "lumeDrawerIn 0.34s cubic-bezier(0.2,0.7,0.2,1) both",
      }}>
        {/* top bar */}
        <div style={{ position: "sticky", top: 0, zIndex: 3, display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", background: "color-mix(in srgb, var(--bg) 88%, transparent)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--line)" }}>
          <span className="eyebrow" style={{ color: tint }}>{isPaper ? "Paper" : "Book"} · {item.format}</span>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 9, border: "none", background: "var(--surface-2)", color: "var(--ink-2)", display: "flex", alignItems: "center", justifyContent: "center" }}><I.close size={18} /></button>
        </div>

        <div style={{ padding: "26px 26px 40px" }}>
          {/* header */}
          {isPaper ? (
            <div>
              <span style={{ width: 46, height: 46, borderRadius: 12, background: `color-mix(in srgb, ${tint} 16%, transparent)`, color: tint, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}><I.doc size={24} /></span>
              <h1 style={{ fontFamily: "var(--read)", fontWeight: 400, fontSize: 27, lineHeight: 1.18, margin: 0, letterSpacing: "-0.01em" }}>{item.title}</h1>
              <div style={{ fontSize: 14, color: "var(--ink-2)", marginTop: 10 }}>{item.author}</div>
              <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 3, fontStyle: "italic" }}>{item.venue}, {item.year}</div>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 20 }}>
              <Cover book={item} w={116} h={172} radius={6} />
              <div style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
                <h1 style={{ fontFamily: "var(--read)", fontWeight: 400, fontSize: 24, lineHeight: 1.15, margin: 0, letterSpacing: "-0.01em" }}>{item.title}</h1>
                <div style={{ fontSize: 14, color: "var(--ink-2)", marginTop: 9 }}>{item.author}</div>
                <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 4 }}>{item.year < 0 ? `${-item.year} BC` : item.year} · {item.genre}</div>
              </div>
            </div>
          )}

          {/* about */}
          <p style={{ fontFamily: "var(--read)", fontSize: 16.5, lineHeight: 1.62, color: "var(--ink)", margin: "24px 0 0" }}>{item.about}</p>

          {/* meta strip */}
          <div style={{ display: "flex", gap: 26, margin: "24px 0", padding: "16px 0", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
            {[["Format", item.format], ["Pages", item.pages], ["Downloads", item.downloads]].map(([k, v]) => (
              <div key={k}>
                <div style={{ fontFamily: "var(--read)", fontSize: 19, lineHeight: 1, color: "var(--ink)" }}>{v}</div>
                <div className="eyebrow" style={{ marginTop: 6 }}>{k}</div>
              </div>
            ))}
          </div>

          {/* download CTA */}
          {down ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderRadius: 13, background: "color-mix(in srgb, var(--tag-idea) 12%, transparent)", border: "1px solid color-mix(in srgb, var(--tag-idea) 34%, var(--line))" }}>
              <span style={{ width: 30, height: 30, borderRadius: 9, background: "var(--tag-idea)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><I.check size={17} /></span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>In your library</div>
                <div style={{ fontSize: 12.5, color: "var(--ink-2)", marginTop: 1 }}>Find it under <b>Unsorted</b> in Browse.</div>
              </div>
            </div>
          ) : downloading ? (
            <div style={{ borderRadius: 13, overflow: "hidden", position: "relative", height: 50, background: "var(--surface-2)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct}%`, background: "color-mix(in srgb, var(--accent) 24%, transparent)", transition: "width 0.24s linear" }} />
              <span style={{ position: "relative", fontFamily: "var(--mono)", fontSize: 13, letterSpacing: "0.04em", color: "var(--ink-2)" }}>downloading · {Math.round(pct)}%</span>
            </div>
          ) : (
            <button onClick={() => onGet(item.id)} style={{
              width: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9, height: 50, borderRadius: 13,
              border: "none", background: "var(--accent)", color: "var(--accent-ink)", fontSize: 15, fontWeight: 600,
            }}>
              <I.download size={19} /> Download {item.format} · free
            </button>
          )}

          {/* topics */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 22 }}>
            {item.topics.map(t => (
              <span key={t} style={{ padding: "5px 12px", borderRadius: 30, border: "1px solid var(--line-2)", background: "var(--surface)", color: "var(--ink-2)", fontSize: 12, fontWeight: 500 }}>{t}</span>
            ))}
          </div>

          {/* related */}
          {related.length > 0 && (
            <div style={{ marginTop: 34 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <span className="eyebrow">Related works</span>
                <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {related.map(r => (
                  <button key={r.id} onClick={() => onOpen(r)} className="row-hover" style={{
                    display: "flex", alignItems: "center", gap: 14, padding: "10px 12px", borderRadius: 12, width: "100%",
                    border: "none", background: "transparent", textAlign: "left", cursor: "pointer", color: "var(--ink)",
                  }}>
                    {r.type === "paper" ? (
                      <span style={{ width: 38, height: 52, borderRadius: 5, background: `color-mix(in srgb, ${r.tint || "var(--accent)"} 14%, var(--surface))`, color: r.tint || "var(--accent)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><I.doc size={18} /></span>
                    ) : (
                      <Cover book={r} w={38} h={52} radius={4} />
                    )}
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontFamily: "var(--read)", fontSize: 15, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.title}</span>
                      <span style={{ display: "block", fontSize: 12, color: "var(--ink-3)", marginTop: 3 }}>{r.author} · {r.type === "paper" ? "Paper" : r.genre}</span>
                    </span>
                    {isDown(r.id)
                      ? <I.check size={16} style={{ color: "var(--tag-idea)", flex: "none" }} />
                      : <I.arrowRight size={16} style={{ color: "var(--ink-3)", flex: "none" }} />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Discover, DISCOVER_CATALOG: CATALOG });
