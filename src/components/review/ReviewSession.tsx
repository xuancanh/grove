/** Presentational review session — card stack, 3D flip, ratings, nav.
    UX replicated from Knowledge Loom's FlashcardStudy. */
import { useEffect, useRef } from 'react';
import type { ReviewSession } from '../../hooks/useReviewSession';
import { RATINGS, RATING_COLOR, RATING_KEY, RATING_LABEL, formatNextReview } from './constants';
import { linkBtn, primaryBtn } from '../ui';

export function ReviewSessionView({ session }: { session: ReviewSession }) {
  const { queue, current, idx, flipped, slideDir, ratings, counts, progress, flip, rate, goTo } = session;
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (!current) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if ((e.key === ' ' || e.key === 'Enter') && !flipped) { e.preventDefault(); flip(); return; }
      if (flipped) {
        for (const r of RATINGS) {
          if (e.key === RATING_KEY[r]) { e.preventDefault(); rate(r); return; }
        }
      }
      if (e.key === 'ArrowRight') { e.preventDefault(); goTo(idx + 1, 'left'); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(idx - 1, 'right'); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current, flipped, idx, flip, rate, goTo]);

  if (!current) return null;

  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 20) { if (!flipped) flip(); return; }
    if (dx < -50) goTo(idx + 1, 'left');
    else if (dx > 50) goTo(idx - 1, 'right');
  };

  const existingRating = ratings[current.id];
  const nextLabel = formatNextReview(current.nextReviewAt);

  return (
    <>
      <div className="rv-bar">
        <div className="rv-track"><div className="rv-fill" style={{ width: `${progress}%` }} /></div>
        <span className="rv-count">{idx + 1} / {queue.length}</span>
        <span className="rv-live">
          {RATINGS.map((r) => counts[r] > 0 && (
            <span key={r} className="rv-lc" style={{ background: `color-mix(in srgb, ${RATING_COLOR[r]} 14%, transparent)`, color: RATING_COLOR[r] }}>
              {counts[r]}
            </span>
          ))}
        </span>
      </div>

      <div className="rv-stage" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {idx + 2 < queue.length && <div className="rv-ghost rv-g2" aria-hidden />}
        {idx + 1 < queue.length && <div className="rv-ghost rv-g1" aria-hidden />}
        <div key={current.id} className={`rv-scene${slideDir ? ` rv-slide-${slideDir}` : ''}`}>
          <div
            className={`rv-card${flipped ? ' rv-flipped' : ''}`}
            onClick={() => { if (!flipped) flip(); }}
            role="button"
            tabIndex={0}
          >
            <div className="rv-face">
              <div className="rv-meta">
                <span>{current.bookTitle}{current.chapterTitle ? ` · ${current.chapterTitle}` : ''}</span>
                <span style={{ flex: 1 }} />
                {nextLabel && <span className={`rv-next${nextLabel === 'due now' ? ' rv-due' : ''}`}>{nextLabel}</span>}
              </div>
              <div className="rv-prompt-area"><div className="rv-prompt">{current.front}</div></div>
              <div className="rv-foot">
                {current.repetitions > 0 && (
                  <span className="rv-sr">
                    {current.stability !== undefined && current.stability > 0 && `S ${current.stability.toFixed(1)}d · `}
                    Interval {current.intervalDays}d · Reps {current.repetitions}
                  </span>
                )}
                <span style={{ flex: 1 }} />
                <span><kbd>Space</kbd> reveal</span>
              </div>
            </div>
            <div className="rv-face rv-back" aria-hidden={!flipped}>
              <div className="rv-back-q">{current.front}</div>
              <div className="rv-sep" />
              <div className="rv-answer-scroll">
                <div className="rv-answer">{current.back}</div>
                {current.source && <div className="rv-source">“{current.source}”</div>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rv-actions">
        {!flipped ? (
          <>
            {existingRating && <div className="rv-prev-badge">Previously: {RATING_LABEL[existingRating]}</div>}
            <button onClick={flip} style={{ ...primaryBtn, width: '100%', justifyContent: 'center' }}>
              Reveal answer
            </button>
          </>
        ) : (
          <>
            <span className="rv-rate-prompt">How easily did it come back?</span>
            <div className="rv-rate-row">
              {RATINGS.map((r) => (
                <button key={r} className="rv-rate" style={{ '--rate-color': RATING_COLOR[r] } as React.CSSProperties} onClick={() => rate(r)}>
                  {RATING_LABEL[r]} <kbd>{RATING_KEY[r]}</kbd>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="rv-nav">
        <button onClick={() => goTo(idx - 1, 'right')} disabled={idx === 0} style={{ ...linkBtn, opacity: idx === 0 ? 0.4 : 1 }}>← Previous</button>
        <span className="rv-nav-hint">swipe or use arrow keys</span>
        <button onClick={() => goTo(idx + 1, 'left')} disabled={idx === queue.length - 1} style={{ ...linkBtn, opacity: idx === queue.length - 1 ? 0.4 : 1 }}>Next →</button>
      </div>
    </>
  );
}
