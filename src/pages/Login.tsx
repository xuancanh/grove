/** Sign in / sign up with Supabase email+password. Only rendered when auth is enabled. */
import { useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { Logo } from '../components/icons';

export default function Login() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError('');
    setInfo('');
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error, data } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (!data.session) setInfo('Check your inbox to confirm your email, then sign in.');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const field = {
    width: '100%', padding: '12px 14px', borderRadius: 11, border: '1px solid var(--line-2)',
    background: 'var(--page)', color: 'var(--ink)', fontSize: 15, outline: 'none',
  } as const;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="grove-enter" style={{ width: 400, maxWidth: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <Logo />
          <span style={{ fontFamily: 'var(--read)', fontSize: 26, fontWeight: 500 }}>Grove</span>
        </div>
        <div style={{ fontFamily: 'var(--read)', fontSize: 19, color: 'var(--ink-2)', marginBottom: 28 }}>
          Read as thinking.
        </div>

        <div style={{ padding: 26, borderRadius: 18, background: 'var(--surface)', border: '1px solid var(--line)' }}>
          <div style={{ display: 'inline-flex', gap: 4, padding: 4, borderRadius: 11, background: 'var(--surface-2)', border: '1px solid var(--line)', marginBottom: 22 }}>
            {(['signin', 'signup'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); setInfo(''); }}
                style={{
                  padding: '8px 16px', borderRadius: 8, border: 'none', fontSize: 13.5,
                  fontWeight: mode === m ? 600 : 500,
                  background: mode === m ? 'var(--surface)' : 'transparent',
                  color: mode === m ? 'var(--ink)' : 'var(--ink-2)',
                  boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                {m === 'signin' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input style={field} type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input style={field} type="password" required minLength={6} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            {error && <div style={{ fontSize: 13.5, color: '#B5552F' }}>{error}</div>}
            {info && <div style={{ fontSize: 13.5, color: 'var(--tag-idea)' }}>{info}</div>}
            <button
              type="submit"
              disabled={busy}
              style={{
                marginTop: 6, padding: '12px 16px', borderRadius: 11, border: 'none',
                background: 'var(--accent)', color: 'var(--accent-ink)', fontSize: 15, fontWeight: 600,
                opacity: busy ? 0.7 : 1,
              }}
            >
              {busy ? 'Working…' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>
        </div>

        <div style={{ marginTop: 18, fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.5 }}>
          Your library, highlights, and cards are private to your account.
        </div>
      </div>
    </div>
  );
}
