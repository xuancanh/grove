/** App shell: routing, sidebar / bottom tabs, theming, AI companion overlay. */
import { useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from './lib/store';
import { Glyph, Logo } from './components/icons';
import { AICompanion, type AiInit } from './components/AICompanion';
import Login from './pages/Login';
import Library from './pages/Library';
import Browse from './pages/Browse';
import Discover from './pages/Discover';
import BookPage from './pages/BookPage';
import Reader from './pages/Reader';
import Study from './pages/Study';
import SearchPage from './pages/SearchPage';
import SettingsPage from './pages/SettingsPage';

const NAV: [string, string, string][] = [
  ['/', 'Library', 'library'],
  ['/browse', 'Browse', 'browse'],
  ['/discover', 'Discover', 'compass'],
  ['/study', 'Study', 'layers'],
  ['/search', 'Search', 'search'],
  ['/settings', 'Settings', 'settings'],
];

export default function App() {
  const { signedIn, authReady, settings } = useStore();
  const location = useLocation();
  const [ai, setAi] = useState<{ open: boolean; init: AiInit | null }>({ open: false, init: null });

  const openAI = (init?: AiInit) => setAi({ open: true, init: init ?? null });

  const density = settings.density;
  const denseScale = density === 'compact' ? 0.94 : density === 'comfy' ? 1.06 : 1.0;
  const inReader = location.pathname.startsWith('/read/');

  if (!authReady) return null;

  if (!signedIn) {
    return (
      <div className="grove-root grove-scroll" data-theme={settings.theme} data-readfont={settings.readFont} data-uifont={settings.uiFont}>
        <Login />
      </div>
    );
  }

  return (
    <div
      className="grove-root grove-scroll"
      data-theme={settings.theme}
      data-readfont={settings.readFont}
      data-uifont={settings.uiFont}
      style={{ ['--accent' as string]: settings.accent, fontSize: `${denseScale * 16}px` }}
    >
      {inReader ? (
        <Routes>
          <Route path="/read/:bookId/:chapterNo?" element={<Reader openAI={openAI} />} />
        </Routes>
      ) : (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          <Sidebar />
          <main style={{ flex: 1, minWidth: 0, position: 'relative' }}>
            <Routes>
              <Route path="/" element={<Library />} />
              <Route path="/browse" element={<Browse />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/study" element={<Study />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/book/:bookId" element={<BookPage openAI={openAI} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      )}

      {!inReader && <BottomTabs />}

      <AICompanion
        open={ai.open}
        initial={ai.init}
        surface={settings.aiSurface}
        onClose={() => setAi((a) => ({ ...a, open: false }))}
      />
    </div>
  );
}

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { library } = useStore();
  const reading = library.books.filter((b) => b.status === 'reading').length;

  return (
    <aside
      className="grove-sidebar"
      style={{
        width: 232, flex: 'none', borderRight: '1px solid var(--line)', padding: '30px 18px',
        position: 'sticky', top: 0, height: '100vh', display: 'flex', flexDirection: 'column',
        background: 'color-mix(in srgb, var(--surface) 50%, var(--bg))',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '0 10px', marginBottom: 38 }}>
        <Logo />
        <span style={{ fontFamily: 'var(--read)', fontSize: 22, fontWeight: 500, letterSpacing: '-0.01em' }}>Grove</span>
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {NAV.map(([path, label, icon]) => {
          const on = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              style={{
                display: 'flex', alignItems: 'center', gap: 13, padding: '11px 14px', borderRadius: 11,
                border: 'none', background: on ? 'var(--surface)' : 'transparent',
                color: on ? 'var(--ink)' : 'var(--ink-2)', fontSize: 14.5, fontWeight: on ? 600 : 500,
                boxShadow: on ? '0 1px 0 rgba(0,0,0,0.03), inset 0 0 0 1px var(--line)' : 'none',
                position: 'relative', transition: 'background 0.15s',
              }}
            >
              {on && (
                <span style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 18, borderRadius: 3, background: 'var(--accent)' }} />
              )}
              <Glyph name={icon} size={19} style={{ color: on ? 'var(--accent)' : 'var(--ink-3)' }} /> {label}
            </button>
          );
        })}
      </nav>
      <div style={{ marginTop: 'auto', padding: '16px 14px', borderRadius: 14, background: 'var(--surface)', border: '1px solid var(--line)' }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Today</div>
        <div style={{ fontFamily: 'var(--read)', fontSize: 15, lineHeight: 1.35 }}>
          {library.books.length} in library · {reading} reading
        </div>
      </div>
    </aside>
  );
}

function BottomTabs() {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <nav
      className="grove-bottom"
      style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 45,
        display: 'none', gridTemplateColumns: `repeat(${NAV.length}, 1fr)`,
        background: 'color-mix(in srgb, var(--surface) 88%, transparent)', backdropFilter: 'blur(16px)',
        borderTop: '1px solid var(--line)', paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {NAV.map(([path, label, icon]) => {
        const on = location.pathname === path;
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '10px 0 9px',
              border: 'none', background: 'transparent', color: on ? 'var(--accent)' : 'var(--ink-3)',
            }}
          >
            <Glyph name={icon} size={21} /> <span style={{ fontSize: 10.5, fontWeight: on ? 600 : 500 }}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
