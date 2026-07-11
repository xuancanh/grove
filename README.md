# Grove — Read as Thinking

The **Grove** reading app: a personal library of public-domain classics
(plus your own uploads), a distraction-free reader with sentence-anchored
highlights and margin notes, spaced-repetition recall cards, reading-rhythm
tracking, and an AI companion grounded in the book you are reading and the
passages you have marked.

Grove is a companion app to [Knowledge Loom](https://github.com/xuancanh/knowledgeloom)
— one account, one subscription, one backend.

> **⚠️ This repo is the frontend only.** The Grove API is part of the
> private Knowledge Loom enterprise backend (served under `/api/grove`),
> so this app is **not self-hostable** — the source is public for
> transparency and reuse of the UI, not as a runnable product. If you're
> looking for something to self-host, Knowledge Loom's core is
> source-available.

## Stack

React 19 + TypeScript + Vite SPA, react-router, Supabase auth (shared
session with Knowledge Loom — one login works in both apps).

## Develop

```bash
npm install
GROVE_API=http://localhost:8787 npm run dev   # Vite on :5175, /api proxied
```

Point `GROVE_API` at a running Knowledge Loom enterprise backend
(`knowledge-loom-ee`: `npm start`), which mounts the Grove API. Without
auth configured the backend runs in local single-user mode and no login is
required.

Auth env (production): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` —
the same Supabase project as Knowledge Loom.

## What's inside

- **Library** — continue-reading hero, weekly rhythm chart with daily goal
  ring, resurfaced highlights, shelf grid.
- **Browse** — organizer with status / collection / topic filters and
  user-defined collections.
- **Discover** — shared public-domain catalog anyone can add from, plus
  plain-text/markdown upload with automatic chapter, paragraph, and sentence
  splitting (uploads are private to the uploader).
- **Reader** — tap a sentence to highlight (4 semantic tags), margin notes,
  recall-card creation, dictionary lookup, AI "ask about this passage",
  chapter map, five reading modes, typography controls, AI thread digest of
  the chapter, automatic progress + reading-time tracking.
- **Study** — Notes (the thought layer across all books), Cards, and a Review
  session driven by the SM-2 spaced-repetition algorithm.
- **Search** — ask a question of your own highlights; the AI synthesizes an
  answer with cited sources.
- **Settings** — five themes, accents, reading faces, density, AI surface,
  daily goal, per-user AI provider config, account management.

## API

All calls go to `/api/grove/*` on the shared backend (see
`src/lib/api.ts`): `catalog`, `books`, `library`, `collections`,
`highlights`, `cards` (+SM-2 `review`), `sessions` (+`rhythm`), `settings`,
`ai/{status,chat,thread,cards,search}` (chat streams SSE), `status`.
AI calls count against the Knowledge Loom plan quota (`ai.grove.*`).

Built from the design in [`./design`](./design) (Grove design system,
formerly "Lume").
