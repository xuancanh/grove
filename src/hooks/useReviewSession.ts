/**
 * useReviewSession — state for one FSRS review session (queue, flip, ratings,
 * navigation). Follows Loom's pattern: feature logic lives in a hook under
 * src/hooks, presentation in components.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, type Rating } from '../lib/data';
import type { Card } from '../lib/types';

export interface ReviewSession {
  queue: Card[];
  current: Card | null;
  idx: number;
  flipped: boolean;
  slideDir: 'left' | 'right' | null;
  ratings: Record<string, Rating>;
  counts: Record<Rating, number>;
  progress: number;
  loaded: boolean;
  finished: boolean;
  flip: () => void;
  rate: (rating: Rating) => void;
  goTo: (index: number, dir: 'left' | 'right') => void;
  restart: () => void;
}

export function useReviewSession(): ReviewSession {
  const [queue, setQueue] = useState<Card[]>([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [slideDir, setSlideDir] = useState<'left' | 'right' | null>(null);
  const [ratings, setRatings] = useState<Record<string, Rating>>({});
  const [loaded, setLoaded] = useState(false);
  const [finished, setFinished] = useState(false);

  const restart = useCallback(() => {
    api.fetchCards().then((cards) => {
      setQueue(cards.filter((c) => c.status === 'due' || c.status === 'new' || c.status === 'learning'));
      setIdx(0); setFlipped(false); setSlideDir(null); setRatings({}); setFinished(false); setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);
  useEffect(restart, [restart]);

  const current = queue[idx] ?? null;

  const counts = useMemo(() => {
    const c: Record<Rating, number> = { again: 0, hard: 0, good: 0 };
    for (const r of Object.values(ratings)) c[r] += 1;
    return c;
  }, [ratings]);

  const progress = queue.length ? Math.round((Object.keys(ratings).length / queue.length) * 100) : 0;

  const goTo = useCallback((next: number, dir: 'left' | 'right') => {
    setQueue((q) => {
      if (next >= 0 && next < q.length) {
        setSlideDir(dir); setFlipped(false); setIdx(next);
      }
      return q;
    });
  }, []);

  const flip = useCallback(() => setFlipped(true), []);

  const rate = useCallback((rating: Rating) => {
    if (!current) return;
    api.reviewCard(current.id, rating).catch(() => {});
    setRatings((prev) => ({ ...prev, [current.id]: rating }));
    if (idx + 1 < queue.length) goTo(idx + 1, 'left');
    else setFinished(true);
  }, [current, idx, queue.length, goTo]);

  return { queue, current, idx, flipped, slideDir, ratings, counts, progress, loaded, finished, flip, rate, goTo, restart };
}
