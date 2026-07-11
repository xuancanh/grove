# Grove — Read as Thinking

The **Grove** reading app: a personal library of public-domain classics
(plus your own uploads), a distraction-free reader with sentence-anchored
highlights and margin notes, spaced-repetition recall cards, reading-rhythm
tracking, and an AI companion grounded in the book you are reading and the
passages you have marked.

Grove is a companion app to [Knowledge Loom](https://github.com/xuancanh/knowledgeloom)
— one account, one subscription, one backend.

Grove is **offline-first for reading**: with no login and no server you
get the full reading experience — the bundled public-domain catalog, your
own text uploads, highlights & margin notes, collections, and reading
rhythm, all in IndexedDB on the device. **AI and the learning system
(recall cards, reviews) are account features**: their logic lives only in
the backend, and those surfaces appear only in server mode. The same
codebase ships as web/PWA and as native iOS/Android apps via
**Capacitor**.

## Modes

| Mode | How | Auth | Data |
|---|---|---|---|
| **Offline (default)** | `npm run dev` / the Capacitor app | none | reading + notes only — IndexedDB (Dexie), `src/lib/data/local.ts` |
| Server | build with `VITE_GROVE_SERVER=1` | Supabase (shared with Knowledge Loom) | everything, incl. AI + cards — hosted `/api/grove` |

Pages talk only to the `DataProvider` in `src/lib/data/` — the local and
remote implementations mirror each other (see
`docs/OFFLINE_ARCHITECTURE.md`).

## Cards & learning

Recall cards use **FSRS-4.5** — the same scheduler, data model, and review
UX as Knowledge Loom's flashcards (grade Forgot / Tricky / Easy, flip-card
session with keyboard + swipe, session summary). The scheduler exists
exactly once, exported by `@knowledge-loom/server` and imported by
grove-server; it never ships to the client. Cards & review are
server-mode features.

## Develop

```bash
npm install
npm run dev            # offline mode on :5175 — no backend needed
npm test               # LocalProvider end-to-end under fake-indexeddb

# Native shells (Capacitor)
npm run ios            # build web → cap sync → open Xcode
npm run android        # build web → cap sync → open Android Studio

# Server mode (hosted backend)
VITE_GROVE_SERVER=1 GROVE_API=http://localhost:8787 npm run dev
```

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
