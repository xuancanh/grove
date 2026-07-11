/** Settings: appearance, reading preferences, AI provider (Intelligence), account. */
import { useState } from 'react';
import { useStore } from '../lib/store';
import { serverMode } from '../lib/data';
import { I } from '../components/icons';
import { ScreenHead, Toast, fieldStyle, primaryBtn, secondaryBtn, wrap } from '../components/ui';

const THEME_META: [string, string, string, string][] = [
  ['indigo', 'Indigo', '#E9EAF3', '#4B45D1'],
  ['paper', 'Paper', '#F1EBDD', '#B5552F'],
  ['slate', 'Slate', '#E8EAEC', '#2F6E8B'],
  ['sage', 'Sage', '#E4E8DF', '#5E7A4E'],
  ['night', 'Night', '#16181B', '#C9824E'],
];

const ACCENTS = ['#4B45D1', '#B5552F', '#2F6E8B', '#5E7A4E', '#8A6CB0'];

const PROVIDERS: [string, string, string][] = [
  ['', 'Server default', 'Use the provider configured by the server administrator.'],
  ['anthropic', 'Anthropic', 'Claude models via the Anthropic API.'],
  ['openai', 'OpenAI', 'GPT models via the OpenAI API.'],
  ['gemini', 'Google Gemini', 'Gemini models via the Generative Language API.'],
  ['openai-compatible', 'OpenAI-compatible', 'OpenRouter, Ollama, vLLM, LM Studio — any Chat Completions endpoint.'],
  ['none', 'Off', 'Disable AI features for your account.'],
];

export default function SettingsPage() {
  const { settings, updateSettings, signOut, authEnabled, session } = useStore();
  const [toast, setToast] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [savingAi, setSavingAi] = useState(false);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  };

  const seg = (label: string, key: keyof typeof settings, opts: [string, string][]) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '18px 0', borderBottom: '1px solid var(--line)', flexWrap: 'wrap' }}>
      <div style={{ fontSize: 15 }}>{label}</div>
      <div style={{ display: 'inline-flex', gap: 4, padding: 4, borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--line)', flexWrap: 'wrap' }}>
        {opts.map(([value, text]) => {
          const on = settings[key] === value;
          return (
            <button
              key={value}
              onClick={() => updateSettings({ [key]: value })}
              style={{
                padding: '7px 14px', borderRadius: 7, border: 'none', fontSize: 13, fontWeight: on ? 600 : 500,
                background: on ? 'var(--surface)' : 'transparent', color: on ? 'var(--ink)' : 'var(--ink-2)',
              }}
            >
              {text}
            </button>
          );
        })}
      </div>
    </div>
  );

  const saveAi = async () => {
    setSavingAi(true);
    try {
      await updateSettings({
        aiProvider: settings.aiProvider,
        aiModel: settings.aiModel,
        aiBaseUrl: settings.aiBaseUrl,
        ...(apiKey ? { aiApiKey: apiKey } : {}),
      });
      setApiKey('');
      flash('Intelligence settings saved');
    } catch (err) {
      flash((err as Error).message);
    } finally {
      setSavingAi(false);
    }
  };

  return (
    <div className="grove-enter" style={{ ...wrap, maxWidth: 760 }}>
      <ScreenHead
        eyebrow="Preferences"
        title="Settings"
        sub="Tune how Grove looks, reads, and thinks. Changes sync to your account."
      />

      {/* Theme */}
      <div className="eyebrow" style={{ margin: '8px 0 16px' }}>Theme</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginBottom: 40 }}>
        {THEME_META.map(([key, label, bg, ac]) => {
          const on = settings.theme === key;
          return (
            <button
              key={key}
              onClick={() => updateSettings({ theme: key })}
              className="hover-lift"
              style={{ textAlign: 'left', padding: 13, borderRadius: 14, cursor: 'pointer', background: 'var(--surface)', border: on ? '2px solid var(--accent)' : '1px solid var(--line)' }}
            >
              <div style={{ height: 54, borderRadius: 9, background: bg, position: 'relative', marginBottom: 11, border: '1px solid color-mix(in srgb, var(--ink) 12%, transparent)' }}>
                <span style={{ position: 'absolute', left: 10, bottom: 10, width: 22, height: 22, borderRadius: '50%', background: ac }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, fontWeight: on ? 600 : 500 }}>{label}</span>
                {on && <I.check size={16} style={{ color: 'var(--accent)' }} />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Accent */}
      <div className="eyebrow" style={{ marginBottom: 16 }}>Accent</div>
      <div style={{ display: 'flex', gap: 14, marginBottom: 40, flexWrap: 'wrap' }}>
        {ACCENTS.map((c) => {
          const on = settings.accent === c;
          return (
            <button
              key={c}
              onClick={() => updateSettings({ accent: c })}
              aria-label={c}
              style={{ width: 40, height: 40, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer', boxShadow: on ? `0 0 0 3px var(--bg), 0 0 0 5px ${c}` : 'inset 0 0 0 1px rgba(0,0,0,0.15)' }}
            />
          );
        })}
      </div>

      {/* Reading & interface */}
      <div className="eyebrow" style={{ marginBottom: 4 }}>Reading &amp; interface</div>
      {seg('Reading face', 'readFont', [['newsreader', 'Newsreader'], ['spectral', 'Spectral'], ['lora', 'Lora'], ['literata', 'Literata'], ['fraunces', 'Fraunces']])}
      {seg('Interface face', 'uiFont', [['hanken', 'Hanken'], ['inter', 'Inter']])}
      {seg('Density', 'density', [['compact', 'Compact'], ['regular', 'Regular'], ['comfy', 'Comfy']])}
      {seg('AI surface', 'aiSurface', [['sheet', 'Sheet'], ['drawer', 'Drawer']])}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '18px 0', borderBottom: '1px solid var(--line)' }}>
        <div style={{ fontSize: 15 }}>Daily reading goal</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            type="number"
            min={5}
            max={480}
            value={settings.dailyGoalMinutes}
            onChange={(e) => updateSettings({ dailyGoalMinutes: Math.max(5, Math.min(480, Number(e.target.value) || 30)) })}
            style={{ ...fieldStyle, width: 90, textAlign: 'center' }}
          />
          <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>minutes</span>
        </div>
      </div>

      {/* Intelligence — AI runs on the backend; offline builds hide it. */}
      {serverMode && <>
      <div className="eyebrow" style={{ margin: '40px 0 8px' }}>Intelligence</div>
      <p style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.5, margin: '0 0 18px' }}>
        Grove's companion, thread digests, card generation, and library search run on the model you choose.
        Your API key is encrypted at rest and never shown again.
        {settings.serverAiProvider && settings.serverAiProvider !== 'none' && (
          <> The server default is <strong>{settings.serverAiProvider}</strong>.</>
        )}
      </p>
      <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
        {PROVIDERS.map(([value, label, sub]) => {
          const on = settings.aiProvider === value;
          return (
            <button
              key={value}
              onClick={() => updateSettings({ aiProvider: value })}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', padding: '13px 15px', borderRadius: 12,
                border: on ? '2px solid var(--accent)' : '1px solid var(--line)',
                background: on ? 'color-mix(in srgb, var(--accent) 7%, var(--surface))' : 'var(--surface)', color: 'inherit',
              }}
            >
              <span style={{ width: 18, height: 18, borderRadius: '50%', flex: 'none', border: on ? '6px solid var(--accent)' : '2px solid var(--line-2)' }} />
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', fontSize: 14.5, fontWeight: on ? 600 : 500 }}>{label}</span>
                <span style={{ display: 'block', fontSize: 12.5, color: 'var(--ink-3)', marginTop: 2 }}>{sub}</span>
              </span>
            </button>
          );
        })}
      </div>
      {settings.aiProvider && settings.aiProvider !== 'none' && (
        <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
          <input
            style={fieldStyle}
            placeholder={`Model (optional — e.g. ${settings.aiProvider === 'anthropic' ? 'claude-sonnet-5' : settings.aiProvider === 'openai' ? 'gpt-4o-mini' : settings.aiProvider === 'gemini' ? 'gemini-2.0-flash' : 'llama3.1'})`}
            value={settings.aiModel}
            onChange={(e) => updateSettings({ aiModel: e.target.value })}
          />
          {settings.aiProvider === 'openai-compatible' && (
            <input
              style={fieldStyle}
              placeholder="Base URL (e.g. http://localhost:11434/v1 for Ollama)"
              value={settings.aiBaseUrl}
              onChange={(e) => updateSettings({ aiBaseUrl: e.target.value })}
            />
          )}
          <input
            style={fieldStyle}
            type="password"
            placeholder={settings.hasAiApiKey ? 'API key saved — enter a new one to replace it' : 'API key'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>
      )}
      <button onClick={saveAi} disabled={savingAi} style={{ ...primaryBtn, opacity: savingAi ? 0.6 : 1 }}>
        {savingAi ? 'Saving…' : 'Save intelligence settings'}
      </button>

      </>}

      {/* Account */}
      <div className="eyebrow" style={{ margin: '44px 0 14px' }}>Account</div>
      {authEnabled ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, color: 'var(--ink-2)' }}>{session?.user.email}</span>
          <button onClick={signOut} style={secondaryBtn}>
            <I.logout size={16} /> Sign out
          </button>
        </div>
      ) : (
        <p style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.5, margin: 0 }}>
          Running in local single-user mode. Configure Supabase (SUPABASE_URL, SUPABASE_JWT_SECRET, VITE_SUPABASE_*)
          to enable accounts and multi-user sync.
        </p>
      )}

      {toast && <Toast message={toast} />}
    </div>
  );
}
