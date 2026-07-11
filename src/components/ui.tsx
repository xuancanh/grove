/** Shared layout primitives + style constants (ported from design groveStyles). */
import type { CSSProperties, ReactNode } from 'react';

export const wrap: CSSProperties = {
  maxWidth: 1080,
  margin: '0 auto',
  padding: 'clamp(28px, 5vw, 64px) clamp(20px, 4vw, 48px) 120px',
};
export const card: CSSProperties = {
  padding: 24,
  borderRadius: 18,
  background: 'var(--surface)',
  border: '1px solid var(--line)',
};
export const sectionH: CSSProperties = { fontFamily: 'var(--read)', fontWeight: 400, fontSize: 22, margin: 0 };
export const shelfGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 28 };
export const primaryBtn: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 12,
  border: 'none', background: 'var(--accent)', color: 'var(--accent-ink)', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap',
};
export const secondaryBtn: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 18px', borderRadius: 12,
  border: '1px solid var(--line-2)', background: 'transparent', color: 'var(--ink)', fontSize: 14, fontWeight: 500,
};
export const linkBtn: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
  color: 'var(--accent)', fontSize: 13.5, fontWeight: 600, padding: 0,
};
export const chip = (on: boolean): CSSProperties => ({
  padding: '8px 15px', borderRadius: 30,
  border: `1px solid ${on ? 'var(--accent)' : 'var(--line-2)'}`,
  background: on ? 'var(--accent)' : 'transparent',
  color: on ? 'var(--accent-ink)' : 'var(--ink-2)', fontSize: 13, fontWeight: 500,
});
export const fieldStyle: CSSProperties = {
  width: '100%', padding: '11px 13px', borderRadius: 10, border: '1px solid var(--line-2)',
  background: 'var(--page)', color: 'var(--ink)', fontSize: 14.5, outline: 'none',
};

export function ScreenHead({ eyebrow, title, sub, right }: { eyebrow?: string; title: string; sub?: string; right?: ReactNode }) {
  return (
    <div className="grove-head" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, marginBottom: 30, flexWrap: 'wrap' }}>
      <div style={{ minWidth: 0 }}>
        {eyebrow && <div className="eyebrow" style={{ marginBottom: 10 }}>{eyebrow}</div>}
        <h1 style={{ fontFamily: 'var(--read)', fontWeight: 400, fontSize: 'clamp(28px, 7vw, 44px)', margin: 0, letterSpacing: '-0.015em', lineHeight: 1.05 }}>{title}</h1>
        {sub && <p style={{ fontSize: 14.5, color: 'var(--ink-2)', margin: '12px 0 0', maxWidth: 520, lineHeight: 1.5 }}>{sub}</p>}
      </div>
      {right && <div className="grove-head-right">{right}</div>}
    </div>
  );
}

export function Overlay({ children, onClose, width = 560 }: { children: ReactNode; onClose: () => void; width?: number }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(0,0,0,0.36)',
        display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
        animation: 'groveFadeIn 0.22s both', padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="grove-scroll"
        style={{
          marginTop: 'min(11vh, 86px)', width: `min(${width}px, 100%)`, maxHeight: '82vh', overflowY: 'auto',
          background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 20,
          boxShadow: '0 30px 80px -30px rgba(0,0,0,0.55)', animation: 'groveScaleIn 0.26s both',
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function Stat({ n, l }: { n: string | number; l: string }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--read)', fontSize: 26, lineHeight: 1 }}>{n}</div>
      <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--mono)' }}>{l}</div>
    </div>
  );
}

export function Toast({ message }: { message: string }) {
  return (
    <div style={{
      position: 'fixed', left: '50%', bottom: 28, transform: 'translateX(-50%)', zIndex: 90,
      display: 'flex', alignItems: 'center', gap: 9, padding: '11px 17px', borderRadius: 30,
      background: 'var(--ink)', color: 'var(--page)', fontSize: 13.5, fontWeight: 500,
      boxShadow: '0 12px 36px -10px rgba(0,0,0,0.5)', animation: 'groveFade 0.3s both',
    }}>
      {message}
    </div>
  );
}

export function Empty({ icon, title, sub, action }: { icon?: ReactNode; title: string; sub?: string; action?: ReactNode }) {
  return (
    <div style={{ ...card, textAlign: 'center', padding: '48px 24px', color: 'var(--ink-2)' }}>
      {icon && <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14, color: 'var(--ink-3)' }}>{icon}</div>}
      <div style={{ fontFamily: 'var(--read)', fontSize: 20, color: 'var(--ink)' }}>{title}</div>
      {sub && <div style={{ fontSize: 14, marginTop: 8, lineHeight: 1.5 }}>{sub}</div>}
      {action && <div style={{ marginTop: 18, display: 'flex', justifyContent: 'center' }}>{action}</div>}
    </div>
  );
}
