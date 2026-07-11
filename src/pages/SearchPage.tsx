/** Search: ask a question of your whole thought layer; the AI synthesizes an
 *  answer from your highlights with cited sources. */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/data';
import type { SearchResult } from '../lib/types';
import { I } from '../components/icons';
import { ScreenHead, card, fieldStyle, linkBtn, wrap } from '../components/ui';

const RECENT_KEY = 'grove-recent-searches';

export default function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<SearchResult | null>(null);
  const [recent, setRecent] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
  });

  const run = async (q?: string) => {
    const question = (q ?? query).trim();
    if (!question || busy) return;
    setQuery(question);
    setBusy(true);
    setError('');
    setResult(null);
    try {
      setResult(await api.aiSearch(question));
      const next = [question, ...recent.filter((r) => r !== question)].slice(0, 6);
      setRecent(next);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grove-enter" style={{ ...wrap, maxWidth: 820 }}>
      <ScreenHead
        eyebrow="Ask your library"
        title="Search your thinking"
        sub="Ask a question and Grove answers from the passages you've marked — with sources."
      />

      <form onSubmit={(e) => { e.preventDefault(); run(); }} style={{ display: 'flex', gap: 10, marginBottom: 22 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What do my books say about living deliberately?"
          style={{ ...fieldStyle, padding: '14px 16px', fontSize: 15.5, fontFamily: 'var(--read)' }}
        />
        <button
          type="submit"
          disabled={busy || !query.trim()}
          style={{ width: 52, borderRadius: 12, border: 'none', background: 'var(--accent)', color: 'var(--accent-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: busy || !query.trim() ? 0.5 : 1 }}
        >
          <I.search size={20} />
        </button>
      </form>

      {!result && !busy && recent.length > 0 && (
        <div style={{ marginBottom: 26 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Recent</div>
          <div style={{ display: 'grid', gap: 8 }}>
            {recent.map((r) => (
              <button key={r} onClick={() => run(r)} className="row-hover" style={{ display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink-2)', fontSize: 14.5, fontFamily: 'var(--read)' }}>
                <I.clock size={15} style={{ color: 'var(--ink-3)', flex: 'none' }} /> {r}
              </button>
            ))}
          </div>
        </div>
      )}

      {busy && (
        <div style={{ display: 'grid', gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ height: 20, borderRadius: 8, background: 'var(--surface-2)', animation: `groveShimmer 1.4s ${i * 0.15}s infinite` }} />
          ))}
        </div>
      )}

      {error && <div style={{ fontSize: 14, color: '#B5552F' }}>{error}</div>}

      {result && (
        <div className="grove-enter">
          <div style={{ ...card, padding: 28, marginBottom: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
              <span style={{ width: 28, height: 28, borderRadius: 9, background: 'var(--accent)', color: 'var(--accent-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <I.sparkle size={16} />
              </span>
              <span className="eyebrow">Synthesis from your highlights</span>
            </div>
            <p style={{ fontFamily: 'var(--read)', fontSize: 18, lineHeight: 1.62, margin: 0 }}>{result.answer}</p>
          </div>

          {result.sources.length > 0 && (
            <>
              <div className="eyebrow" style={{ marginBottom: 12 }}>Sources · {result.sources.length}</div>
              <div style={{ display: 'grid', gap: 10 }}>
                {result.sources.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 16px', borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--line)' }}>
                    <I.quote size={18} style={{ color: 'var(--accent)', opacity: 0.6, flex: 'none', marginTop: 2 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--read)', fontSize: 15, lineHeight: 1.5 }}>“{s.text}”</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: 12, color: 'var(--ink-3)' }}>
                        {s.book} · {s.author}
                        {s.bookId && (
                          <button onClick={() => navigate(`/book/${s.bookId}`)} style={{ ...linkBtn, fontSize: 12 }}>
                            Open book <I.arrowRight size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
