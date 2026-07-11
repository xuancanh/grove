/** AI reading companion — sheet (bottom) or drawer (right) surface.
 *  Streams responses from /api/ai/chat, grounded in the current book/chapter. */
import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/data';
import type { ChatMessage } from '../lib/types';
import { I } from './icons';
import { useNavigate } from 'react-router-dom';

export interface AiInit {
  bookId?: string;
  chapterNo?: number;
  passage?: string;
}

const SUGGESTIONS = [
  'What should I pay attention to in this chapter?',
  'Explain this in plain language.',
  'How does this connect to my other highlights?',
];

export function AICompanion({
  open,
  initial,
  surface,
  onClose,
}: {
  open: boolean;
  initial: AiInit | null;
  surface: string;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [configured, setConfigured] = useState<boolean | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    api.fetchAiStatus().then((s) => setConfigured(s.configured)).catch(() => setConfigured(false));
  }, [open]);

  // When invoked with a passage, prefill the composer.
  useEffect(() => {
    if (open && initial?.passage) {
      setInput(`About this passage: “${initial.passage}” — `);
    }
  }, [open, initial]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || busy) return;
    setError('');
    setInput('');
    const next: ChatMessage[] = [...messages, { role: 'user', content }];
    setMessages([...next, { role: 'assistant', content: '' }]);
    setBusy(true);
    try {
      await api.aiChatStream(
        { bookId: initial?.bookId, chapterNo: initial?.chapterNo, messages: next },
        (chunk) =>
          setMessages((m) => {
            const copy = [...m];
            copy[copy.length - 1] = { role: 'assistant', content: copy[copy.length - 1].content + chunk };
            return copy;
          }),
      );
    } catch (err) {
      setError((err as Error).message);
      setMessages((m) => (m[m.length - 1]?.content === '' ? m.slice(0, -1) : m));
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  const isDrawer = surface === 'drawer';

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(0,0,0,0.3)', animation: 'groveFadeIn 0.2s both' }}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="grove-scroll"
        style={{
          position: 'fixed',
          background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--line)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          ...(isDrawer
            ? { top: 0, right: 0, bottom: 0, width: 'min(430px, 100%)', animation: 'groveDrawerIn 0.3s cubic-bezier(0.2,0.7,0.2,1) both', borderRadius: 0 }
            : { left: '50%', transform: 'translateX(-50%)', bottom: 0, width: 'min(680px, 100%)', height: 'min(72vh, 640px)', borderRadius: '20px 20px 0 0', animation: 'groveSheetUp 0.32s cubic-bezier(0.2,0.7,0.2,1) both' }),
        }}
      >
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '16px 18px', borderBottom: '1px solid var(--line)' }}>
          <span style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--accent)', color: 'var(--accent-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <I.sparkle size={18} />
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--read)', fontSize: 16.5, fontWeight: 500 }}>Ask Grove</div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>Grounded in your book and highlights</div>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 9, border: 'none', background: 'var(--surface-2)', color: 'var(--ink-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <I.close size={19} />
          </button>
        </div>

        {/* messages */}
        <div ref={scrollRef} className="grove-scroll" style={{ flex: 1, overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {configured === false && (
            <div style={{ padding: '14px 16px', borderRadius: 12, background: 'color-mix(in srgb, var(--accent) 8%, var(--surface-2))', fontSize: 13.5, lineHeight: 1.5 }}>
              No AI provider is configured yet. Add one in{' '}
              <button onClick={() => { onClose(); navigate('/settings'); }} style={{ border: 'none', background: 'none', padding: 0, color: 'var(--accent)', fontWeight: 600, fontSize: 13.5 }}>
                Settings → Intelligence
              </button>{' '}
              — Anthropic, OpenAI, Gemini, or any OpenAI-compatible endpoint (Ollama, OpenRouter…).
            </div>
          )}
          {messages.length === 0 && configured !== false && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              <div className="eyebrow" style={{ marginBottom: 4 }}>Try asking</div>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  style={{ textAlign: 'left', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--line)', background: 'var(--page)', color: 'var(--ink-2)', fontSize: 14, fontFamily: 'var(--read)' }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '86%',
                padding: '12px 15px',
                borderRadius: m.role === 'user' ? '15px 15px 4px 15px' : '15px 15px 15px 4px',
                background: m.role === 'user' ? 'var(--accent)' : 'var(--page)',
                color: m.role === 'user' ? 'var(--accent-ink)' : 'var(--ink)',
                border: m.role === 'user' ? 'none' : '1px solid var(--line)',
                fontSize: 14.5, lineHeight: 1.55,
                fontFamily: m.role === 'assistant' ? 'var(--read)' : 'var(--ui)',
                whiteSpace: 'pre-wrap',
              }}
            >
              {m.content || (busy && i === messages.length - 1 ? '…' : '')}
            </div>
          ))}
          {error && <div style={{ fontSize: 13, color: '#B5552F' }}>{error}</div>}
        </div>

        {/* composer */}
        <form
          onSubmit={(e) => { e.preventDefault(); send(); }}
          style={{ display: 'flex', gap: 10, padding: 14, borderTop: '1px solid var(--line)' }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about what you're reading…"
            style={{ flex: 1, padding: '12px 14px', borderRadius: 12, border: '1px solid var(--line-2)', background: 'var(--page)', color: 'var(--ink)', fontSize: 14.5, outline: 'none' }}
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            style={{ width: 46, height: 46, borderRadius: 12, border: 'none', background: 'var(--accent)', color: 'var(--accent-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: busy || !input.trim() ? 0.5 : 1 }}
          >
            <I.send size={19} />
          </button>
        </form>
      </div>
    </div>
  );
}
