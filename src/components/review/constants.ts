/** Rating scale + labels, matching Knowledge Loom's flashcards. */
import type { Rating } from '../../lib/data';

export const RATINGS: Rating[] = ['again', 'hard', 'good'];

export const RATING_LABEL: Record<Rating, string> = {
  again: 'Forgot',
  hard: 'Tricky',
  good: 'Easy',
};

export const RATING_COLOR: Record<Rating, string> = {
  again: 'var(--tag-beautiful)',
  hard: 'var(--tag-question)',
  good: 'var(--tag-important)',
};

export const RATING_KEY: Record<Rating, string> = { again: '1', hard: '2', good: '3' };

export function formatNextReview(nextReviewAt: string | null | undefined): string {
  if (!nextReviewAt) return '';
  const diffMs = new Date(nextReviewAt).getTime() - Date.now();
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.round(diffMs / 86400000);
  if (diffHours <= 0) return 'due now';
  if (diffHours < 24) return `next in ${diffHours}h`;
  return `next in ${diffDays}d`;
}
