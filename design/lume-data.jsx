// lume-data.jsx — sample content for Lume (exported to window at bottom)
// Public-domain texts so highlights / threads / cards feel real.

// ── Highlight tag system ───────────────────────────────────────────────
const TAGS = {
  beautiful: { label: "beautiful", color: "#C9764A" },
  important: { label: "important", color: "#3E7C8B" },
  question:  { label: "question",  color: "#8A6CB0" },
  idea:      { label: "idea",      color: "#5E8C5A" },
};

// ── The book currently being read, with full chapter text ──────────────
// Each paragraph is an array of sentences so highlights anchor to spans.
const WALDEN = {
  id: "walden",
  title: "Walden",
  subtitle: "or, Life in the Woods",
  author: "Henry David Thoreau",
  year: 1854,
  cover: { bg: "#2E3B30", fg: "#E9E0CC", accent: "#C9764A" },
  genre: "Philosophy",
  progress: 0.34,
  minutesLeft: 22,
  chapterNo: 2,
  chapterTitle: "Where I Lived, and What I Lived For",
  chapters: [
    { no: 1,  title: "Economy",                              est: "62 min", marked: 7, status: "read" },
    { no: 2,  title: "Where I Lived, and What I Lived For",   est: "14 min", marked: 4, status: "reading" },
    { no: 3,  title: "Reading",                               est: "12 min", marked: 0, status: "unread" },
    { no: 4,  title: "Sounds",                                est: "16 min", marked: 0, status: "unread" },
    { no: 5,  title: "Solitude",                              est: "11 min", marked: 0, status: "unread" },
    { no: 6,  title: "Visitors",                              est: "15 min", marked: 0, status: "unread" },
    { no: 7,  title: "The Bean-Field",                        est: "13 min", marked: 0, status: "unread" },
    { no: 8,  title: "The Village",                           est: "7 min",  marked: 0, status: "unread" },
    { no: 9,  title: "The Ponds",                             est: "24 min", marked: 0, status: "unread" },
    { no: 10, title: "Conclusion",                            est: "18 min", marked: 0, status: "unread" },
  ],
  paragraphs: [
    [
      "At a certain season of our life we are accustomed to consider every spot as the possible site of a house.",
      "I have thus surveyed the country on every side within a dozen miles of where I live.",
      "In imagination I have bought all the farms in succession, for all were to be bought, and I knew their price.",
    ],
    [
      "I went to the woods because I wished to live deliberately, to front only the essential facts of life, and see if I could not learn what it had to teach, and not, when I came to die, discover that I had not lived.",
      "I did not wish to live what was not life, living is so dear; nor did I wish to practise resignation, unless it was quite necessary.",
      "I wanted to live deep and suck out all the marrow of life, to live so sturdily and Spartan-like as to put to rout all that was not life.",
    ],
    [
      "Still we live meanly, like ants; though the fable tells us that we were long ago changed into men.",
      "Our life is frittered away by detail.",
      "Simplicity, simplicity, simplicity! I say, let your affairs be as two or three, and not a hundred or a thousand.",
      "Simplify, simplify.",
    ],
    [
      "Why should we live with such hurry and waste of life?",
      "We are determined to be starved before we are hungry.",
      "Men say that a stitch in time saves nine, and so they take a thousand stitches to-day to save nine to-morrow.",
    ],
    [
      "Time is but the stream I go a-fishing in.",
      "I drink at it; but while I drink I see the sandy bottom and detect how shallow it is.",
      "Its thin current slides away, but eternity remains.",
      "I would drink deeper; fish in the sky, whose bottom is pebbly with stars.",
    ],
    [
      "Let us spend one day as deliberately as Nature, and not be thrown off the track by every nutshell and mosquito's wing that falls on the rails.",
      "Let us rise early and fast, or break fast, gently and without perturbation.",
      "Why should we knock under and go with the stream?",
    ],
    [
      "If you stand right fronting and face to face to a fact, you will see the sun glimmer on both its surfaces, as if it were a cimeter, and feel its sweet edge dividing you through the heart and marrow, and so you will happily conclude your mortal career.",
      "Be it life or death, we crave only reality.",
    ],
  ],
  // Highlights anchored to [paragraphIndex, sentenceIndex]
  highlights: [
    { id: "h1", p: 1, s: 0, tag: "important", note: "The thesis of the whole book — living deliberately as a deliberate act.", date: "Mar 14" },
    { id: "h2", p: 2, s: 2, tag: "beautiful", note: "", date: "Mar 14" },
    { id: "h3", p: 4, s: 0, tag: "beautiful", note: "Time as a stream you fish in. The image never leaves you.", date: "Mar 16" },
    { id: "h4", p: 3, s: 0, tag: "question", note: "Is hurry a modern disease or an old one? He's writing in 1854.", date: "Mar 16" },
  ],
  // A condensed "Thread" digest of the chapter (~10 beats)
  thread: [
    "Thoreau goes to the woods on purpose — not to escape, but to test what life actually requires.",
    "He wants to 'live deliberately': to face only the essential facts and not discover, at death, that he never lived.",
    "Most of us live 'meanly, like ants,' busy with detail that adds up to nothing.",
    "His prescription is brutal and simple: Simplicity, simplicity, simplicity.",
    "Modern hurry is a kind of self-starvation — we rush to save time we then waste.",
    "A 'stitch in time' becomes a thousand anxious stitches today to save nine tomorrow.",
    "Time itself is just a stream he goes fishing in; its current is shallow, but eternity stays.",
    "He'd rather drink deeper — fish in a sky whose bottom is 'pebbly with stars.'",
    "Live one day as deliberately as Nature does: rise early, fast, stay unhurried.",
    "Face each fact directly and you feel its edge — because what we truly crave is reality.",
  ],
  summary: "Thoreau explains why he moved to Walden Pond: to strip life to its essentials and find out what it has to teach. He diagnoses modern restlessness — our days 'frittered away by detail' — and prescribes radical simplicity. The chapter builds to its famous images of time as a shallow stream and life as a fact to be met edge-on, arguing that what we really want is not comfort but reality.",
};

// ── Collections (user-made groupings) & topics ─────────────────────────
const COLLECTIONS = [
  { id: "stoic",  label: "Stoic practice",      color: "#B98A4E" },
  { id: "modern", label: "American Modernism",  color: "#D98AA8" },
  { id: "mind",   label: "Origins of mind",     color: "#8A6CB0" },
  { id: "revisit",label: "To revisit",          color: "#3E7C8B" },
];

// ── The library ────────────────────────────────────────────────────────
// status: reading | unread | finished | reference ; added = days ago ; coll = collection ids
const BOOKS = [
  WALDEN,
  { id: "meditations", title: "Meditations", author: "Marcus Aurelius", year: 180, genre: "Philosophy",
    cover: { bg: "#3A3A44", fg: "#E6E2D8", accent: "#B98A4E" }, progress: 0.72, minutesLeft: 41, notes: 23, marked: 23,
    status: "reading", added: 9, topics: ["Ethics","Self","Mortality"], coll: ["stoic","revisit"] },
  { id: "dalloway", title: "Mrs Dalloway", author: "Virginia Woolf", year: 1925, genre: "Fiction",
    cover: { bg: "#5B4B6E", fg: "#F0E8DE", accent: "#D98AA8" }, progress: 0.0, minutesLeft: 0, notes: 0, marked: 0,
    status: "unread", added: 1, topics: ["Time","Society","Mind"], coll: ["modern"] },
  { id: "gatsby", title: "The Great Gatsby", author: "F. Scott Fitzgerald", year: 1925, genre: "Fiction",
    cover: { bg: "#1C3B4A", fg: "#EDD9A3", accent: "#E0B84C" }, progress: 1.0, minutesLeft: 0, notes: 18, marked: 18,
    status: "finished", added: 30, topics: ["Desire","Society"], coll: ["modern"] },
  { id: "frankenstein", title: "Frankenstein", author: "Mary Shelley", year: 1818, genre: "Fiction",
    cover: { bg: "#2A2E2C", fg: "#CFE0D8", accent: "#7FA89A" }, progress: 0.51, minutesLeft: 88, notes: 11, marked: 11,
    status: "reading", added: 14, topics: ["Mortality","Mind","Nature"], coll: [] },
  { id: "tao", title: "Tao Te Ching", author: "Laozi", year: -400, genre: "Philosophy",
    cover: { bg: "#46402F", fg: "#EFE7CF", accent: "#C0A24E" }, progress: 0.28, minutesLeft: 18, notes: 14, marked: 14,
    status: "reading", added: 20, topics: ["Self","Nature","Power"], coll: ["revisit"] },
  { id: "essays", title: "Essays", author: "Ralph Waldo Emerson", year: 1841, genre: "Essays",
    cover: { bg: "#3E2F2A", fg: "#EAD9C6", accent: "#C77B4E" }, progress: 0.0, minutesLeft: 0, notes: 0, marked: 0,
    status: "unread", added: 3, topics: ["Self","Society"], coll: ["stoic"] },
  { id: "darkness", title: "Heart of Darkness", author: "Joseph Conrad", year: 1899, genre: "Fiction",
    cover: { bg: "#23262B", fg: "#D8C9A8", accent: "#9A7B3E" }, progress: 0.0, minutesLeft: 0, notes: 0, marked: 0,
    status: "unread", added: 0, topics: ["Society","Power"], coll: [] },
  { id: "prophet", title: "The Prophet", author: "Kahlil Gibran", year: 1923, genre: "Poetry",
    cover: { bg: "#3B4654", fg: "#E8E2D4", accent: "#C99A5E" }, progress: 0.0, minutesLeft: 0, notes: 0, marked: 0,
    status: "unread", added: 0, topics: ["Self","Beauty"], coll: [] },
  { id: "republic", title: "The Republic", author: "Plato", year: -375, genre: "Philosophy",
    cover: { bg: "#2C3A3A", fg: "#E6E4D6", accent: "#C8A24E" }, progress: 0.0, minutesLeft: 0, notes: 6, marked: 6,
    status: "reference", added: 5, topics: ["Ethics","Power","Society"], coll: [] },
  { id: "darwin", title: "On the Origin of Species", author: "Charles Darwin", year: 1859, genre: "Science",
    cover: { bg: "#33402C", fg: "#E7E6D2", accent: "#A7B36A" }, progress: 0.0, minutesLeft: 0, notes: 4, marked: 4,
    status: "reference", added: 11, topics: ["Nature","Mind"], coll: ["mind"] },
  { id: "austen", title: "Pride and Prejudice", author: "Jane Austen", year: 1813, genre: "Fiction",
    cover: { bg: "#6B4A57", fg: "#F2E6DE", accent: "#E0A8B8" }, progress: 1.0, minutesLeft: 0, notes: 9, marked: 9,
    status: "finished", added: 40, topics: ["Society","Desire"], coll: [] },
  { id: "whitman", title: "Leaves of Grass", author: "Walt Whitman", year: 1855, genre: "Poetry",
    cover: { bg: "#2E4636", fg: "#E4ECD8", accent: "#8FB36A" }, progress: 0.0, minutesLeft: 0, notes: 0, marked: 0,
    status: "unread", added: 0, topics: ["Self","Beauty","Nature"], coll: [] },
  { id: "nietzsche", title: "Beyond Good and Evil", author: "Friedrich Nietzsche", year: 1886, genre: "Philosophy",
    cover: { bg: "#2A2A30", fg: "#DEDAD0", accent: "#B57A4E" }, progress: 0.18, minutesLeft: 64, notes: 7, marked: 7,
    status: "reading", added: 6, topics: ["Ethics","Power","Self"], coll: ["revisit"] },
  { id: "dostoevsky", title: "Notes from Underground", author: "Fyodor Dostoevsky", year: 1864, genre: "Fiction",
    cover: { bg: "#34302E", fg: "#DAD2C6", accent: "#9A6B5E" }, progress: 0.0, minutesLeft: 0, notes: 0, marked: 0,
    status: "unread", added: 1, topics: ["Mind","Self","Society"], coll: [] },
  { id: "smith", title: "The Wealth of Nations", author: "Adam Smith", year: 1776, genre: "Economics",
    cover: { bg: "#2C3640", fg: "#DDE4E8", accent: "#C0A24E" }, progress: 0.0, minutesLeft: 0, notes: 3, marked: 3,
    status: "reference", added: 22, topics: ["Society","Power"], coll: [] },
  { id: "james", title: "The Principles of Psychology", author: "William James", year: 1890, genre: "Science",
    cover: { bg: "#38343F", fg: "#E2DCE6", accent: "#9A8AB0" }, progress: 0.0, minutesLeft: 0, notes: 5, marked: 5,
    status: "reference", added: 8, topics: ["Mind","Self"], coll: ["mind"] },
];

// Give Walden derived note counts + organization fields
WALDEN.notes = WALDEN.highlights.length;
WALDEN.marked = WALDEN.highlights.length;
Object.assign(WALDEN, { status: "reading", added: 2, topics: ["Nature","Self","Time"], coll: ["revisit"] });

// ── All notes / highlights across the library (Thought Layer) ──────────
const NOTES = [
  { id: "n1", book: "Walden", author: "Thoreau", tag: "important",
    text: "I went to the woods because I wished to live deliberately, to front only the essential facts of life…",
    note: "The thesis of the whole book — living deliberately as a deliberate act.", date: "Mar 14", chapter: "Where I Lived" },
  { id: "n2", book: "Walden", author: "Thoreau", tag: "beautiful",
    text: "Time is but the stream I go a-fishing in.", note: "Time as a stream you fish in. The image never leaves you.", date: "Mar 16", chapter: "Where I Lived" },
  { id: "n3", book: "Walden", author: "Thoreau", tag: "question",
    text: "Why should we live with such hurry and waste of life?", note: "Is hurry a modern disease or an old one? He's writing in 1854.", date: "Mar 16", chapter: "Where I Lived" },
  { id: "n4", book: "Meditations", author: "Marcus Aurelius", tag: "important",
    text: "You have power over your mind — not outside events. Realize this, and you will find strength.",
    note: "The whole Stoic project in one line.", date: "Mar 11", chapter: "Book V" },
  { id: "n5", book: "Meditations", author: "Marcus Aurelius", tag: "idea",
    text: "Waste no more time arguing about what a good man should be. Be one.",
    note: "Stop theorizing the self. Practice it.", date: "Mar 9", chapter: "Book X" },
  { id: "n6", book: "Meditations", author: "Marcus Aurelius", tag: "beautiful",
    text: "Dwell on the beauty of life. Watch the stars, and see yourself running with them.",
    note: "", date: "Mar 8", chapter: "Book VII" },
  { id: "n7", book: "The Great Gatsby", author: "Fitzgerald", tag: "beautiful",
    text: "So we beat on, boats against the current, borne back ceaselessly into the past.",
    note: "The most famous last line in American fiction, and it earns it.", date: "Feb 28", chapter: "Chapter IX" },
  { id: "n8", book: "The Great Gatsby", author: "Fitzgerald", tag: "idea",
    text: "He had come a long way to this blue lawn, and his dream must have seemed so close that he could hardly fail to grasp it.",
    note: "The green light. Desire is always one lawn away.", date: "Feb 27", chapter: "Chapter IX" },
  { id: "n9", book: "Tao Te Ching", author: "Laozi", tag: "idea",
    text: "When you are content to be simply yourself and don't compare or compete, everybody will respect you.",
    note: "", date: "Feb 20", chapter: "Verse 8" },
  { id: "n10", book: "Tao Te Ching", author: "Laozi", tag: "question",
    text: "The journey of a thousand miles begins beneath one's feet.",
    note: "We quote this as motivation, but he meant it almost as a warning about over-reaching.", date: "Feb 19", chapter: "Verse 64" },
  { id: "n11", book: "Frankenstein", author: "Shelley", tag: "important",
    text: "Nothing is so painful to the human mind as a great and sudden change.",
    note: "", date: "Feb 14", chapter: "Chapter 16" },
  { id: "n12", book: "Frankenstein", author: "Shelley", tag: "beautiful",
    text: "I saw the dull yellow eye of the creature open; it breathed hard, and a convulsive motion agitated its limbs.",
    note: "The horror is in the ordinariness of the verbs.", date: "Feb 12", chapter: "Chapter 5" },
];

// ── Recall cards (spaced repetition), auto-generated from highlights ───
const CARDS = [
  { id: "c1", book: "Walden", status: "due", front: "Why did Thoreau go to the woods?",
    back: "To live deliberately — to front only the essential facts of life and not discover, at death, that he had never lived.", interval: "—", chapter: "Where I Lived", source: "I went to the woods because I wished to live deliberately" },
  { id: "c2", book: "Walden", status: "due", front: "What is Thoreau's one-word prescription for a frittered life?",
    back: "Simplicity. ('Simplicity, simplicity, simplicity!')", interval: "1d", chapter: "Where I Lived", source: "Simplicity, simplicity, simplicity!" },
  { id: "c3", book: "Walden", status: "learning", front: "Complete the image: 'Time is but the ___ I go a-fishing in.'",
    back: "the stream. Its current is shallow, but eternity remains.", interval: "3d", chapter: "Where I Lived", source: "Time is but the stream I go a-fishing in." },
  { id: "c4", book: "Meditations", status: "review", front: "Marcus Aurelius: where do we have power, and where not?",
    back: "Over your mind — not outside events. Realize this and you find strength.", interval: "6d", chapter: "Book V", source: "You have power over your mind — not outside events." },
  { id: "c5", book: "Meditations", status: "review", front: "Aurelius' answer to endlessly debating the good man?",
    back: "'Waste no more time arguing about what a good man should be. Be one.'", interval: "9d", chapter: "Book X", source: "Waste no more time arguing about what a good man should be." },
  { id: "c6", book: "The Great Gatsby", status: "known", front: "What does the green light represent for Gatsby?",
    back: "The ever-receding dream — desire that always seems one lawn away.", interval: "21d", chapter: "Chapter IX", source: "He had come a long way to this blue lawn." },
  { id: "c7", book: "Tao Te Ching", status: "new", front: "Laozi on contentment and respect?",
    back: "When you are content to be simply yourself and don't compare or compete, everybody will respect you.", interval: "—", chapter: "Verse 8", source: "When you are content to be simply yourself and don't compare or compete, everybody will respect you." },
  { id: "c8", book: "Frankenstein", status: "new", front: "Shelley: what is most painful to the human mind?",
    back: "'Nothing is so painful to the human mind as a great and sudden change.'", interval: "—", chapter: "Chapter 16", source: "Nothing is so painful to the human mind as a great and sudden change." },
];

// ── Reading rhythm (last 7 days, minutes) ──────────────────────────────
const RHYTHM = [
  { day: "M", min: 18 }, { day: "T", min: 42 }, { day: "W", min: 12 },
  { day: "T", min: 55 }, { day: "F", min: 30 }, { day: "S", min: 0 }, { day: "S", min: 38 },
];

// ── Search synthesis (precomputed answer for the demo) ─────────────────
const SEARCH_DEMO = {
  query: "What do my books say about living deliberately?",
  answer: "Across your highlights, a single argument keeps surfacing: a good life is a chosen one, not a default one. Thoreau frames it most directly — he goes to the woods 'to live deliberately,' afraid of reaching death having never lived. Marcus Aurelius locates that deliberateness inward: the only thing you govern is your mind, so stop debating the good life and simply live it. Laozi adds the counterweight — deliberate living isn't striving harder but ceasing to compare and compete. Read together, your marked passages treat attention, not effort, as the raw material of a life.",
  sources: [
    { book: "Walden", author: "Thoreau", text: "I went to the woods because I wished to live deliberately, to front only the essential facts of life…" },
    { book: "Meditations", author: "Marcus Aurelius", text: "You have power over your mind — not outside events. Realize this, and you will find strength." },
    { book: "Meditations", author: "Marcus Aurelius", text: "Waste no more time arguing about what a good man should be. Be one." },
    { book: "Tao Te Ching", author: "Laozi", text: "When you are content to be simply yourself and don't compare or compete, everybody will respect you." },
  ],
};

const SEARCH_RECENT = [
  "What do my books say about living deliberately?",
  "Every passage I marked about time",
  "How does Marcus Aurelius define strength?",
  "Memorable last lines",
];

// ── Lookups: map a note/card book title → book record & its collections ─
const bookByTitle = (title) => BOOKS.find(b => b.title === title) || null;
const collsForTitle = (title) => { const b = bookByTitle(title); return b ? (b.coll || []) : []; };
// Distinct book titles that actually have notes / cards
const titlesWithNotes = Array.from(new Set(NOTES.map(n => n.book)));
const titlesWithCards = Array.from(new Set(CARDS.map(c => c.book)));
const notesForBook = (title) => NOTES.filter(n => n.book === title);
const cardsForBook = (title) => CARDS.filter(c => c.book === title);

// Generate a plausible chapter list for books that don't have a real one.
const GENERIC_PARTS = ["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"];
const chaptersFor = (book) => {
  if (book.chapters) return book.chapters;
  const n = book.genre === "Poetry" ? 9 : book.genre === "Fiction" ? 12 : 8;
  const readTo = Math.round((book.progress || 0) * n);
  return Array.from({ length: n }, (_, i) => ({
    no: i + 1,
    title: book.genre === "Poetry" ? `Canto ${GENERIC_PARTS[i]}` : `Chapter ${GENERIC_PARTS[i]}`,
    est: `${8 + (i * 7) % 18} min`,
    marked: i < readTo ? (i % 3) : 0,
    status: i < readTo ? "read" : (i === readTo && book.progress > 0 && book.progress < 1 ? "reading" : "unread"),
  }));
};

// ── Connections: "ideas that rhyme" across books ───────────────────────
const CONNECTIONS = [
  { id: "x1", theme: "Living deliberately", noteIds: ["n1", "n4", "n9"],
    insight: "Three writers, one instruction: choose your life rather than inherit it. Thoreau fronts the essential facts, Aurelius governs the inner citadel, Laozi stops competing — all forms of the same deliberate attention." },
  { id: "x2", theme: "Time & impermanence", noteIds: ["n2", "n10", "n11"],
    insight: "Time appears as a current you can drift on or drink from. Thoreau fishes in it, Laozi watches the journey begin underfoot, Shelley fears the sudden change — three angles on a life measured against what doesn't last." },
  { id: "x3", theme: "Practice over theory", noteIds: ["n5", "n1"],
    insight: "Both Aurelius and Thoreau distrust talking about the good life. Be one; live deliberately. The instruction is always a verb." },
  { id: "x4", theme: "Beauty in the ordinary", noteIds: ["n6", "n12", "n7"],
    insight: "Attention redeems the plain: Aurelius runs with the stars, Shelley finds horror in convulsing limbs, Fitzgerald beats on against the current. Each makes the everyday luminous by looking harder." },
];

// ── Lexicon for look-up / define on selection ──────────────────────────
const LEXICON = {
  deliberately: { pos: "adverb", def: "In a way that is intentional and considered; on purpose, with full awareness.", etym: "From Latin dēlīberāre, 'to weigh thoroughly.'" },
  marrow: { pos: "noun", def: "The soft fatty tissue in bone cavities; figuratively, the essential or innermost part of something.", etym: "Old English mearg." },
  resignation: { pos: "noun", def: "The acceptance of something undesirable but inevitable.", etym: "From Latin resignare, 'to unseal, cancel.'" },
  frittered: { pos: "verb", def: "Wasted (time, money, or energy) on trifling matters, little by little.", etym: "From fritter, 'a fragment.'" },
  eternity: { pos: "noun", def: "Infinite or unending time; a state outside of time altogether.", etym: "From Latin aeternus, 'lasting, perpetual.'" },
  simplicity: { pos: "noun", def: "The quality of being plain, uncomplicated, or easy to understand.", etym: "From Latin simplus, 'single, plain.'" },
  somnolence: { pos: "noun", def: "A state of drowsiness; sleepiness.", etym: "From Latin somnus, 'sleep.'" },
  perturbation: { pos: "noun", def: "Anxiety or disquiet; a deviation from a regular or expected state.", etym: "From Latin perturbare, 'to throw into confusion.'" },
  meanly: { pos: "adverb", def: "In a poor, small, or ignoble manner; without largeness of spirit.", etym: "From Old English gemǣne, 'common.'" },
  cimeter: { pos: "noun", def: "Archaic spelling of scimitar — a short, curved single-edged sword.", etym: "From Italian scimitarra." },
};

// Pick the most 'lookup-worthy' word in a sentence (longest uncommon word).
const COMMON_WORDS = new Set("the a an and or but of to in on at for with as is are was were be been being i we you he she it they them this that these those not no so if then than when while which who whom whose our your their his her its my me us do did does have has had will would could should may might must can".split(" "));
const lookupWord = (sentence) => {
  const words = (sentence.toLowerCase().match(/[a-z]+/g) || []);
  let best = null;
  for (const w of words) {
    if (LEXICON[w]) return w;
    if (!COMMON_WORDS.has(w) && (!best || w.length > best.length)) best = w;
  }
  return best;
};
const defineWord = (word) => LEXICON[word] || {
  pos: "", def: `A definition for “${word}” would appear here, pulled from Lume's built-in dictionary.`, etym: "" };

// ── Reading goals & rhythm history ─────────────────────────────────────
const READING_GOAL = { dailyMinutes: 30 };
// last 12 weeks of total minutes, oldest → newest
const RHYTHM_HISTORY = [220, 180, 305, 140, 260, 320, 95, 240, 280, 360, 210, 195];

// ── Papers in your library (reference reading) ─────────────────────────
// read: read | skimmed | unread · refs carry an `id` when the cited work is also in your library.
const PAPERS = [
  { id: "turingmind", title: "Computing Machinery and Intelligence", authors: ["Alan M. Turing"], venue: "Mind", year: 1950,
    topics: ["Mind"], read: "read", added: 5, annotations: 6, pages: 28, coll: ["mind"],
    abstract: "Turing replaces the question “Can machines think?” with the imitation game, then methodically dismantles nine objections to the possibility of machine intelligence.",
    refs: [{ title: "On Computable Numbers, with an Application to the Entscheidungsproblem", author: "A. M. Turing", year: 1936 }],
    marks: ["I propose to consider the question, 'Can machines think?'", "We may hope that machines will eventually compete with men in all purely intellectual fields."] },
  { id: "shannon", title: "A Mathematical Theory of Communication", authors: ["Claude E. Shannon"], venue: "Bell System Technical Journal", year: 1948,
    topics: ["Mind", "Society"], read: "skimmed", added: 12, annotations: 3, pages: 55, coll: ["mind"],
    abstract: "Shannon shows that any message — voice, text, image — can be reduced to bits travelling through a noisy channel, and derives the hard limits on how fast information can move.",
    refs: [{ title: "Certain Factors Affecting Telegraph Speed", author: "H. Nyquist", year: 1924 }, { title: "Transmission of Information", author: "R. V. L. Hartley", year: 1928 }] },
  { id: "bush", title: "As We May Think", authors: ["Vannevar Bush"], venue: "The Atlantic", year: 1945,
    topics: ["Mind", "Society"], read: "read", added: 20, annotations: 4, pages: 16, coll: [],
    abstract: "Bush imagines the “memex,” a desk that links documents by association rather than rigid indexes — a startlingly exact premonition of hypertext and the personal computer.",
    refs: [],
    marks: ["The human mind operates by association.", "Wholly new forms of encyclopedias will appear, ready-made with a mesh of associative trails."] },
  { id: "maslow", title: "A Theory of Human Motivation", authors: ["A. H. Maslow"], venue: "Psychological Review", year: 1943,
    topics: ["Mind", "Self"], read: "unread", added: 2, annotations: 0, pages: 22, coll: ["mind"],
    abstract: "Maslow argues that human needs stack into a hierarchy — you pursue belonging only once you are fed and safe, and meaning only once you belong.",
    refs: [{ title: "What Is an Emotion?", author: "William James", year: 1884, id: "james" }] },
  { id: "james", title: "What Is an Emotion?", authors: ["William James"], venue: "Mind", year: 1884,
    topics: ["Mind", "Self"], read: "read", added: 30, annotations: 5, pages: 18, coll: ["mind", "revisit"],
    abstract: "James inverts common sense: we do not tremble because we are afraid, we are afraid because we tremble. Emotion is the felt perception of bodily change.",
    refs: [{ title: "The Expression of the Emotions in Man and Animals", author: "Charles Darwin", year: 1872 }],
    marks: ["The bodily changes follow directly the perception of the exciting fact."] },
  { id: "nagel", title: "What Is It Like to Be a Bat?", authors: ["Thomas Nagel"], venue: "The Philosophical Review", year: 1974,
    topics: ["Mind", "Self"], read: "read", added: 8, annotations: 7, pages: 15, coll: ["mind", "revisit"],
    abstract: "Nagel argues that consciousness has an irreducibly subjective character — there is something it is like to be an organism — that no physical account can fully capture.",
    refs: [{ title: "What Is an Emotion?", author: "William James", year: 1884, id: "james" }, { title: "Computing Machinery and Intelligence", author: "A. M. Turing", year: 1950, id: "turingmind" }],
    marks: ["An organism has conscious mental states if and only if there is something that it is like to be that organism."] },
  { id: "hardin", title: "The Tragedy of the Commons", authors: ["Garrett Hardin"], venue: "Science", year: 1968,
    topics: ["Society", "Nature", "Power"], read: "skimmed", added: 14, annotations: 2, pages: 8, coll: [],
    abstract: "Hardin shows how individually rational use of a shared resource leads to its collective ruin, and argues the problem has no purely technical solution.",
    refs: [] },
  { id: "berlin", title: "Two Concepts of Liberty", authors: ["Isaiah Berlin"], venue: "Inaugural Lecture, Oxford", year: 1958,
    topics: ["Society", "Power", "Self"], read: "unread", added: 1, annotations: 0, pages: 34, coll: ["revisit"],
    abstract: "Berlin distinguishes “negative” liberty — freedom from interference — from “positive” liberty — the freedom to be one's own master, and warns how the latter can curdle into coercion.",
    refs: [{ title: "On Liberty", author: "J. S. Mill", year: 1859 }] },
  { id: "einstein", title: "On the Electrodynamics of Moving Bodies", authors: ["Albert Einstein"], venue: "Annalen der Physik", year: 1905,
    topics: ["Nature", "Time"], read: "unread", added: 3, annotations: 0, pages: 31, coll: [],
    abstract: "From two simple postulates Einstein dissolves absolute time and space, making simultaneity relative to the observer — the special theory of relativity.",
    refs: [{ title: "Über die von der molekularkinetischen Theorie…", author: "A. Einstein", year: 1905 }] },
];
const PAPERS_BY_ID = Object.fromEntries(PAPERS.map(p => [p.id, p]));
// Papers in your library that cite a given paper id
const papersCiting = (id) => PAPERS.filter(p => (p.refs || []).some(r => r.id === id));

Object.assign(window, {
  TAGS, WALDEN, BOOKS, COLLECTIONS, NOTES, CARDS, RHYTHM, SEARCH_DEMO, SEARCH_RECENT,
  bookByTitle, collsForTitle, titlesWithNotes, titlesWithCards, notesForBook, cardsForBook, chaptersFor,
  CONNECTIONS, LEXICON, lookupWord, defineWord, READING_GOAL, RHYTHM_HISTORY,
  PAPERS, PAPERS_BY_ID, papersCiting,
});
