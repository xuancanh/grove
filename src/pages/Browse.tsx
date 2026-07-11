/** Browse — the library organizer: filter by status, collection, or topic;
 *  manage collections; act on individual books. */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../lib/api';
import { useStore } from '../lib/store';
import type { LibraryBook } from '../lib/types';
import { Cover, I } from '../components/icons';
import { Empty, ScreenHead, chip, fieldStyle, linkBtn, primaryBtn, wrap } from '../components/ui';

const STATUS_FILTERS: [string, string][] = [
  ['', 'All'],
  ['reading', 'Reading'],
  ['unread', 'To read'],
  ['finished', 'Finished'],
  ['reference', 'Reference'],
];

const COLL_COLORS = ['#B98A4E', '#D98AA8', '#8A6CB0', '#3E7C8B', '#5E8C5A'];

export default function Browse() {
  const { library, refreshLibrary } = useStore();
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const [collId, setCollId] = useState('');
  const [topic, setTopic] = useState('');
  const [query, setQuery] = useState('');
  const [newColl, setNewColl] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [collMenuFor, setCollMenuFor] = useState<string | null>(null);

  const topics = useMemo(() => {
    const set = new Set<string>();
    for (const b of library.books) for (const t of b.topics) set.add(t);
    return [...set].sort();
  }, [library.books]);

  const filtered = library.books.filter((b) => {
    if (status && b.status !== status) return false;
    if (collId && !b.coll.includes(collId)) return false;
    if (topic && !b.topics.includes(topic)) return false;
    if (query && !`${b.title} ${b.author}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const createColl = async () => {
    if (!newLabel.trim()) return;
    await api.createCollection(newLabel.trim(), COLL_COLORS[library.collections.length % COLL_COLORS.length]);
    setNewLabel('');
    setNewColl(false);
    refreshLibrary();
  };

  return (
    <div className="grove-enter" style={wrap}>
      <ScreenHead
        eyebrow="Organize"
        title="Browse your library"
        sub="Everything you've gathered — filter by state, collection, or theme."
        right={
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by title or author…"
            style={{ ...fieldStyle, width: 240 }}
          />
        }
      />

      {/* status chips */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {STATUS_FILTERS.map(([value, label]) => (
          <button key={value} style={chip(status === value)} onClick={() => setStatus(value)}>
            {label}{value ? ` · ${library.books.filter((b) => b.status === value).length}` : ` · ${library.books.length}`}
          </button>
        ))}
      </div>

      {/* collections + topics */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap', alignItems: 'center' }}>
        {library.collections.map((c) => (
          <button
            key={c.id}
            style={{ ...chip(collId === c.id), display: 'inline-flex', alignItems: 'center', gap: 7 }}
            onClick={() => setCollId(collId === c.id ? '' : c.id)}
          >
            <span style={{ width: 8, height: 8, borderRadius: 6, background: c.color }} /> {c.label}
          </button>
        ))}
        {newColl ? (
          <span style={{ display: 'inline-flex', gap: 6 }}>
            <input
              autoFocus
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createColl()}
              placeholder="Collection name"
              style={{ ...fieldStyle, width: 170, padding: '8px 12px' }}
            />
            <button style={chip(true)} onClick={createColl}>Add</button>
            <button style={chip(false)} onClick={() => setNewColl(false)}>Cancel</button>
          </span>
        ) : (
          <button style={{ ...chip(false), display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => setNewColl(true)}>
            <I.folderPlus size={14} /> New collection
          </button>
        )}
        <span style={{ width: 1, height: 20, background: 'var(--line-2)', margin: '0 4px' }} />
        {topics.map((t) => (
          <button key={t} style={chip(topic === t)} onClick={() => setTopic(topic === t ? '' : t)}>{t}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Empty
          icon={<I.browse size={30} />}
          title="Nothing here"
          sub={library.books.length === 0 ? 'Your library is empty — add books from Discover.' : 'No books match these filters.'}
          action={library.books.length === 0 ? <button style={primaryBtn} onClick={() => navigate('/discover')}>Discover books</button> : undefined}
        />
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {filtered.map((b) => (
            <BrowseRow
              key={b.id}
              book={b}
              collMenuOpen={collMenuFor === b.id}
              onToggleCollMenu={() => setCollMenuFor(collMenuFor === b.id ? null : b.id)}
              onOpen={() => navigate(`/book/${b.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BrowseRow({
  book,
  onOpen,
  collMenuOpen,
  onToggleCollMenu,
}: {
  book: LibraryBook;
  onOpen: () => void;
  collMenuOpen: boolean;
  onToggleCollMenu: () => void;
}) {
  const { library, refreshLibrary } = useStore();

  const toggleColl = async (collectionId: string) => {
    const on = !book.coll.includes(collectionId);
    await api.setCollectionMembership(collectionId, book.id, on);
    refreshLibrary();
  };

  const remove = async () => {
    await api.removeFromLibrary(book.id);
    refreshLibrary();
  };

  return (
    <div className="row-hover" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '13px 16px', borderRadius: 14, background: 'var(--surface)', border: '1px solid var(--line)', position: 'relative' }}>
      <button onClick={onOpen} style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 0, border: 'none', background: 'none', padding: 0, textAlign: 'left', color: 'inherit' }}>
        <Cover book={book} w={40} h={60} radius={3} />
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontFamily: 'var(--read)', fontSize: 16.5, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{book.title}</span>
          <span style={{ display: 'block', fontSize: 12.5, color: 'var(--ink-3)', marginTop: 3 }}>
            {book.author}{book.genre ? ` · ${book.genre}` : ''}
          </span>
        </span>
      </button>

      <div className="grove-browse-meta" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {book.coll.length > 0 && (
          <span style={{ display: 'inline-flex', gap: 4 }}>
            {book.coll.map((id) => {
              const c = library.collections.find((x) => x.id === id);
              return c ? <span key={id} title={c.label} style={{ width: 9, height: 9, borderRadius: 6, background: c.color }} /> : null;
            })}
          </span>
        )}
        <span className="grove-browse-notes" style={{ fontSize: 12.5, color: 'var(--ink-3)', fontFamily: 'var(--mono)' }}>
          {book.notes} notes
        </span>
        {book.progress > 0 && book.progress < 1 ? (
          <span style={{ width: 70, height: 4, borderRadius: 3, background: 'var(--surface-2)', overflow: 'hidden', display: 'inline-block' }}>
            <span style={{ display: 'block', height: '100%', width: `${book.progress * 100}%`, background: 'var(--accent)' }} />
          </span>
        ) : (
          <span style={{ fontSize: 11.5, fontWeight: 600, color: book.status === 'finished' ? 'var(--tag-idea)' : 'var(--ink-3)', textTransform: 'capitalize' }}>
            {book.status === 'unread' ? 'to read' : book.status}
          </span>
        )}
        <button onClick={onToggleCollMenu} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: collMenuOpen ? 'var(--surface-2)' : 'transparent', color: 'var(--ink-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <I.more size={17} />
        </button>
      </div>

      {collMenuOpen && (
        <div style={{ position: 'absolute', right: 12, top: 'calc(100% - 6px)', zIndex: 40, width: 230, padding: 10, borderRadius: 14, background: 'var(--surface)', border: '1px solid var(--line)', boxShadow: '0 16px 40px -14px rgba(0,0,0,0.35)', animation: 'groveScaleIn 0.16s both' }}>
          <div className="eyebrow" style={{ padding: '2px 6px 8px' }}>Collections</div>
          {library.collections.length === 0 && (
            <div style={{ fontSize: 12.5, color: 'var(--ink-3)', padding: '0 6px 8px' }}>Create a collection above first.</div>
          )}
          {library.collections.map((c) => {
            const on = book.coll.includes(c.id);
            return (
              <button key={c.id} onClick={() => toggleColl(c.id)} style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '8px 8px', borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--ink)', fontSize: 13.5, textAlign: 'left' }}>
                <span style={{ width: 9, height: 9, borderRadius: 6, background: c.color }} />
                <span style={{ flex: 1 }}>{c.label}</span>
                {on && <I.check size={15} style={{ color: 'var(--accent)' }} />}
              </button>
            );
          })}
          <div style={{ borderTop: '1px solid var(--line)', marginTop: 8, paddingTop: 8 }}>
            <button onClick={remove} style={{ ...linkBtn, color: 'var(--tag-beautiful)', fontSize: 13, padding: '4px 6px' }}>
              <I.trash size={14} /> Remove from library
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
