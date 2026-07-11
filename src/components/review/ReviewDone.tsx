/** Session-complete summary — breakdown per rating, mastered/needs-practice.
    UX replicated from Knowledge Loom's FlashcardDone. */
import type { Rating } from '../../lib/data';
import { RATINGS, RATING_COLOR, RATING_LABEL } from './constants';
import { card as cardStyle, primaryBtn } from '../ui';

export function ReviewDone({
  total,
  counts,
  onRestart,
}: {
  total: number;
  counts: Record<Rating, number>;
  onRestart: () => void;
}) {
  const needsPractice = counts.again + counts.hard;
  return (
    <div className="rv-done" style={{ ...cardStyle }}>
      <div className="rv-done-star" aria-hidden>✦</div>
      <h2>Session complete</h2>
      <p className="rv-done-sub">You went through {total} card{total === 1 ? '' : 's'}. Spacing does the rest.</p>
      <div className="rv-breakdown">
        {RATINGS.map((r) => (
          <div key={r} className="rv-cell" style={{ '--rate-color': RATING_COLOR[r] } as React.CSSProperties}>
            <b>{counts[r]}</b>
            <span>{RATING_LABEL[r]}</span>
          </div>
        ))}
      </div>
      <p className="rv-summary">
        <strong>{counts.good}</strong> mastered · <strong>{needsPractice}</strong> need{needsPractice === 1 ? 's' : ''} practice
        {counts.again > 0 && <> — the {counts.again} you forgot come back tomorrow.</>}
      </p>
      <button onClick={onRestart} style={{ ...primaryBtn }}>Review again</button>
    </div>
  );
}
