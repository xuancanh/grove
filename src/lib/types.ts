/** API types shared across the frontend. Mirrors the server's response shapes. */

export interface Book {
  id: string;
  ownerId: string | null;
  title: string;
  subtitle: string;
  author: string;
  year: number | null;
  genre: string;
  coverBg: string;
  coverFg: string;
  coverAccent: string;
  summary: string;
  topics: string[];
  createdAt: string;
}

export interface LibraryBook extends Book {
  status: 'reading' | 'unread' | 'finished' | 'reference';
  progress: number;
  currentChapter: number;
  addedAt: string;
  lastReadAt: string | null;
  notes: number;
  chapterCount: number;
  minutesLeft: number;
  coll: string[];
}

export interface Collection {
  id: string;
  userId: string;
  label: string;
  color: string;
}

export interface LibraryState {
  books: LibraryBook[];
  collections: Collection[];
}

export interface Chapter {
  id: string;
  bookId: string;
  no: number;
  title: string;
  estMinutes: number;
  marked?: number;
}

export interface BookDetail extends Book {
  chapters: Chapter[];
}

export interface Paragraph {
  id: string;
  chapterId: string;
  idx: number;
  sentences: string[];
}

export interface Highlight {
  id: string;
  userId: string;
  bookId: string;
  chapterId: string;
  paragraphIdx: number;
  sentenceIdx: number;
  tag: string;
  text: string;
  note: string;
  createdAt: string;
  bookTitle?: string;
  bookAuthor?: string;
  chapterTitle?: string;
  chapterNo?: number;
}

export interface ChapterContent {
  chapter: Chapter;
  paragraphs: Paragraph[];
  highlights: Highlight[];
}

export interface Card {
  id: string;
  userId: string;
  bookId: string;
  bookTitle: string;
  highlightId: string | null;
  front: string;
  back: string;
  source: string;
  chapterTitle: string;
  createdAt: string;
  status: 'new' | 'learning' | 'due' | 'review' | 'known';
  intervalDays: number;
  repetitions: number;
  nextReviewAt: string | null;
  lastRating: string | null;
  // FSRS-4.5 memory state (same model as Knowledge Loom flashcards)
  stability?: number;
  difficulty?: number;
  lapses?: number;
  lastReviewAt?: string | null;
}

export interface Rhythm {
  week: { day: string; min: number }[];
  history: number[];
  todayMinutes: number;
}

export interface Settings {
  userId: string;
  displayName: string;
  theme: string;
  accent: string;
  readFont: string;
  uiFont: string;
  density: string;
  aiSurface: string;
  readerSize: number;
  dailyGoalMinutes: number;
  aiProvider: string;
  aiModel: string;
  aiBaseUrl: string;
  hasAiApiKey: boolean;
  serverAiProvider: string;
}

export interface AiStatus {
  provider: string;
  model: string;
  configured: boolean;
}

export interface SearchResult {
  answer: string;
  sources: { book: string; author: string; text: string; bookId?: string }[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
