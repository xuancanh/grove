// lume-icons.jsx — minimal stroke icons + small shared primitives → window

const Icon = ({ d, size = 20, fill = "none", sw = 1.6, children, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor"
       strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={style}>
    {d ? <path d={d} /> : children}
  </svg>
);

const I = {
  library: (p) => <Icon {...p}><path d="M4 5h5v14H4zM9 5h5v14H9z"/><path d="M14.5 5.6l4 .9 1.7 13.7-4-.9z"/></Icon>,
  browse: (p) => <Icon {...p}><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/></Icon>,
  notes: (p) => <Icon {...p}><path d="M5 4h11l3 3v13H5z"/><path d="M9 9h7M9 13h7M9 17h4"/></Icon>,
  cards: (p) => <Icon {...p}><rect x="3" y="6" width="14" height="11" rx="2"/><path d="M8 4h11a2 2 0 0 1 2 2v9"/></Icon>,
  search: (p) => <Icon {...p}><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/></Icon>,
  memory: (p) => <Icon {...p}><circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/></Icon>,
  book: (p) => <Icon {...p}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 5.5V20.5"/></Icon>,
  back: (p) => <Icon {...p}><path d="M15 5l-7 7 7 7"/></Icon>,
  close: (p) => <Icon {...p}><path d="M6 6l12 12M18 6L6 18"/></Icon>,
  type: (p) => <Icon {...p}><path d="M4 7V5h16v2M9 19h6M12 5v14"/></Icon>,
  sparkle: (p) => <Icon {...p}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.7 2 .3.3M5 17l.5 1.5"/></Icon>,
  spark: (p) => <Icon {...p}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/></Icon>,
  thread: (p) => <Icon {...p}><path d="M5 6h14M5 10h14M5 14h9M5 18h9"/></Icon>,
  sun: (p) => <Icon {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19"/></Icon>,
  moon: (p) => <Icon {...p}><path d="M20 14.5A8 8 0 0 1 9.5 4 7 7 0 1 0 20 14.5z"/></Icon>,
  focus: (p) => <Icon {...p}><circle cx="12" cy="12" r="3"/><path d="M4 8V5h3M20 8V5h-3M4 16v3h3M20 16v3h-3"/></Icon>,
  academic: (p) => <Icon {...p}><path d="M12 4l9 4-9 4-9-4z"/><path d="M6 10v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5"/></Icon>,
  classic: (p) => <Icon {...p}><path d="M5 4h11l3 3v13H5z"/><path d="M9 9h6M9 12h6M9 15h4"/></Icon>,
  dyslexia: (p) => <Icon {...p}><path d="M4 18V6M4 6h8M4 12h6M14 18l4-12 4 12M15.2 14h5.6"/></Icon>,
  check: (p) => <Icon {...p}><path d="M5 12l4 4 10-10"/></Icon>,
  chevron: (p) => <Icon {...p}><path d="M9 5l7 7-7 7"/></Icon>,
  chevronDown: (p) => <Icon {...p}><path d="M5 9l7 7 7-7"/></Icon>,
  dot: (p) => <Icon {...p} fill="currentColor"><circle cx="12" cy="12" r="3.2" stroke="none"/></Icon>,
  plus: (p) => <Icon {...p}><path d="M12 5v14M5 12h14"/></Icon>,
  minus: (p) => <Icon {...p}><path d="M5 12h14"/></Icon>,
  send: (p) => <Icon {...p}><path d="M5 12h13M12 5l7 7-7 7"/></Icon>,
  highlight: (p) => <Icon {...p}><path d="M4 20h16M6 16l8.5-8.5 3 3L9 19H6z"/><path d="M13 6l2-2a1.5 1.5 0 0 1 2.2 0l1.8 1.8a1.5 1.5 0 0 1 0 2.2l-2 2"/></Icon>,
  note: (p) => <Icon {...p}><path d="M5 5h14v9l-4 4H5z"/><path d="M15 18v-4h4"/></Icon>,
  ask: (p) => <Icon {...p}><path d="M5 5h14v10H9l-4 4z"/><path d="M9.5 9a2.5 2.5 0 1 1 3 2.4V12"/><path d="M12 14.2v.1"/></Icon>,
  more: (p) => <Icon {...p} fill="currentColor" stroke="none"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></Icon>,
  clock: (p) => <Icon {...p}><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 1.8"/></Icon>,
  flame: (p) => <Icon {...p}><path d="M12 3c1 3 4 4.2 4 8a4 4 0 0 1-8 0c0-1.6.8-2.6 1.5-3.4C10 9 10 7 12 3z"/></Icon>,
  settings: (p) => <Icon {...p}><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/></Icon>,
  layers: (p) => <Icon {...p}><path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/></Icon>,
  arrowRight: (p) => <Icon {...p}><path d="M5 12h14M13 6l6 6-6 6"/></Icon>,
  quote: (p) => <Icon {...p}><path d="M9 7H5v6h4v-2H7c0-2 .7-3 2-3.5zM19 7h-4v6h4v-2h-2c0-2 .7-3 2-3.5z" fill="currentColor" stroke="none"/></Icon>,
  bookmark: (p) => <Icon {...p}><path d="M6 4h12v16l-6-4-6 4z"/></Icon>,
  align: (p) => <Icon {...p}><path d="M4 6h16M4 10h12M4 14h16M4 18h12"/></Icon>,
  sound: (p) => <Icon {...p}><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a3 3 0 0 1 0 6M18.5 7a6 6 0 0 1 0 10"/></Icon>,
  play: (p) => <Icon {...p} fill="currentColor" stroke="none"><path d="M7 5l12 7-12 7z"/></Icon>,
  pause: (p) => <Icon {...p} fill="currentColor" stroke="none"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></Icon>,
  skipFwd: (p) => <Icon {...p}><path d="M5 5l8 7-8 7zM18 5v14"/></Icon>,
  skipBack: (p) => <Icon {...p}><path d="M19 5l-8 7 8 7zM6 5v14"/></Icon>,
  bookmarkFill: (p) => <Icon {...p} fill="currentColor"><path d="M6 4h12v16l-6-4-6 4z"/></Icon>,
  link: (p) => <Icon {...p}><path d="M9 13a4 4 0 0 0 6 0l2-2a4 4 0 0 0-6-6l-1 1M15 11a4 4 0 0 0-6 0l-2 2a4 4 0 0 0 6 6l1-1"/></Icon>,
  share: (p) => <Icon {...p}><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.6M8.2 13.2l7.6 4.6"/></Icon>,
  download: (p) => <Icon {...p}><path d="M12 4v11M7 11l5 5 5-5M5 20h14"/></Icon>,
  copy: (p) => <Icon {...p}><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></Icon>,
  target: (p) => <Icon {...p}><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/></Icon>,
  upload: (p) => <Icon {...p}><path d="M12 16V5M7 9l5-5 5 5M5 20h14"/></Icon>,
  refresh: (p) => <Icon {...p}><path d="M4 12a8 8 0 0 1 13.7-5.6L20 8M20 4v4h-4M20 12a8 8 0 0 1-13.7 5.6L4 16M4 20v-4h4"/></Icon>,
  contents: (p) => <Icon {...p}><path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1.1" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1.1" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1.1" fill="currentColor" stroke="none"/></Icon>,
  inbox: (p) => <Icon {...p}><path d="M4 13l2.5-7h11L20 13M4 13v5h16v-5M4 13h4l1.5 2.5h5L16 13h4"/></Icon>,
  grid: (p) => <Icon {...p}><rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/></Icon>,
  rows: (p) => <Icon {...p}><rect x="4" y="5" width="16" height="4.5" rx="1.4"/><rect x="4" y="14.5" width="16" height="4.5" rx="1.4"/></Icon>,
  compact: (p) => <Icon {...p}><path d="M4 6h16M4 10h16M4 14h16M4 18h16"/></Icon>,
  folder: (p) => <Icon {...p}><path d="M4 7a2 2 0 0 1 2-2h3.2l2 2H18a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/></Icon>,
  folderPlus: (p) => <Icon {...p}><path d="M4 7a2 2 0 0 1 2-2h3.2l2 2H18a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M12 11v4M10 13h4"/></Icon>,
  tag: (p) => <Icon {...p}><path d="M4 4h7l9 9-7 7-9-9z"/><circle cx="8.5" cy="8.5" r="1.3" fill="currentColor" stroke="none"/></Icon>,
  star: (p) => <Icon {...p}><path d="M12 4l2.3 5 5.4.5-4.1 3.6 1.2 5.3L12 16.8 7.2 18.4l1.2-5.3L4.3 9.5 9.7 9z"/></Icon>,
  trash: (p) => <Icon {...p}><path d="M5 7h14M9 7V5h6v2M7 7l1 12h8l1-12"/></Icon>,
  compass: (p) => <Icon {...p}><circle cx="12" cy="12" r="8.5"/><path d="M15.6 8.4l-2.1 5.1-5.1 2.1 2.1-5.1z"/></Icon>,
  doc: (p) => <Icon {...p}><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><path d="M9 12h6M9 16h6"/></Icon>,
  trend: (p) => <Icon {...p}><path d="M4 16l5-5 3 3 7-7"/><path d="M15 7h4v4"/></Icon>,
};

// Small spine-style book cover
const Cover = ({ book, w = 96, h = 144, radius = 4, style, className }) => {
  const c = book.cover || { bg: "#333", fg: "#eee", accent: "#999" };
  const wn = typeof w === "number" ? w : h * 0.66;   // numeric basis for type scaling
  return (
    <div className={className} style={{
      width: w, height: h, borderRadius: radius, background: c.bg, color: c.fg,
      position: "relative", overflow: "hidden", flex: "none",
      boxShadow: "0 1px 0 rgba(0,0,0,0.04), 0 8px 22px -10px rgba(0,0,0,0.45)",
      ...style,
    }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: "rgba(255,255,255,0.12)" }} />
      <div style={{ position: "absolute", left: 5, top: 0, bottom: 0, width: 1, background: "rgba(0,0,0,0.18)" }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "space-between",
        padding: `${Math.round(h*0.1)}px ${Math.round(wn*0.13)}px ${Math.round(h*0.08)}px ${Math.round(wn*0.16)}px` }}>
        <div style={{ fontFamily: "'Newsreader', serif", fontWeight: 500, lineHeight: 1.08,
          fontSize: Math.max(11, wn*0.135), letterSpacing: "0.01em" }}>{book.title}</div>
        <div>
          <div style={{ width: Math.round(wn*0.34), height: 2, background: c.accent, marginBottom: 7, opacity: 0.9 }} />
          <div style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: Math.max(8, wn*0.072),
            opacity: 0.78, letterSpacing: "0.02em", textTransform: "uppercase" }}>{book.author}</div>
        </div>
      </div>
    </div>
  );
};

// status pill color map for cards
const CARD_STATUS = {
  new:      { label: "New", color: "var(--ink-3)" },
  learning: { label: "Learning", color: "var(--tag-beautiful)" },
  review:   { label: "Review", color: "var(--tag-important)" },
  due:      { label: "Due", color: "var(--accent)" },
  known:    { label: "Known", color: "var(--tag-idea)" },
};

const TagDot = ({ tag, size = 8 }) => (
  <span style={{ width: size, height: size, borderRadius: 10, background: `var(--tag-${tag})`, display: "inline-block", flex: "none" }} />
);

// Render an icon by string name (JSX can't use computed member access as a tag)
const Glyph = ({ name, ...p }) => { const C = I[name]; return C ? <C {...p} /> : null; };

Object.assign(window, { Icon, I, Glyph, Cover, CARD_STATUS, TagDot });
