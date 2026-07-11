/** Discover: the shared public-domain catalog + upload your own book. */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../lib/api';
import { useStore } from '../lib/store';
import type { Book } from '../lib/types';
import { Cover, I } from '../components/icons';
import { Overlay, ScreenHead, Toast, card, chip, fieldStyle, primaryBtn, secondaryBtn, wrap } from '../components/ui';

export default function Discover() {
  const { library, refreshLibrary } = useStore();
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState<Book[]>([]);
  const [genre, setGenre] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    api.fetchCatalog().then(setCatalog).catch(() => {});
  }, []);

  const inLibrary = useMemo(() => new Set(library.books.map((b) => b.id)), [library.books]);
  const genres = useMemo(() => [...new Set(catalog.map((b) => b.genre))].sort(), [catalog]);
  const filtered = genre ? catalog.filter((b) => b.genre === genre) : catalog;

  const add = async (id: string) => {
    await api.addToLibrary(id);
    await refreshLibrary();
    setToast('Added to your library');
    setTimeout(() => setToast(''), 2000);
  };

  return (
    <div className="grove-enter" style={wrap}>
      <ScreenHead
        eyebrow="Discover"
        title="Find your next book"
        sub="Public-domain classics, ready to read — or bring your own text."
        right={
          <button style={primaryBtn} onClick={() => setUploadOpen(true)}>
            <I.upload size={16} /> Upload a book
          </button>
        }
      />

      <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
        <button style={chip(!genre)} onClick={() => setGenre('')}>All</button>
        {genres.map((g) => (
          <button key={g} style={chip(genre === g)} onClick={() => setGenre(genre === g ? '' : g)}>{g}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {filtered.map((b) => {
          const owned = inLibrary.has(b.id);
          return (
            <div key={b.id} style={{ ...card, display: 'flex', gap: 18, padding: 18 }}>
              <button onClick={() => navigate(`/book/${b.id}`)} style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}>
                <Cover book={b} w={84} h={126} radius={5} />
              </button>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <div className="eyebrow" style={{ marginBottom: 6 }}>
                  {b.genre}{b.year ? ` · ${b.year < 0 ? `${-b.year} BC` : b.year}` : ''}
                </div>
                <button onClick={() => navigate(`/book/${b.id}`)} style={{ border: 'none', background: 'none', padding: 0, textAlign: 'left', color: 'inherit', cursor: 'pointer' }}>
                  <div style={{ fontFamily: 'var(--read)', fontSize: 18, lineHeight: 1.2 }}>{b.title}</div>
                </button>
                <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 4 }}>{b.author}</div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-2)', marginTop: 8, lineHeight: 1.45, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {b.summary}
                </div>
                <div style={{ marginTop: 'auto', paddingTop: 12 }}>
                  {owned ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, color: 'var(--tag-idea)' }}>
                      <I.check size={15} /> In your library
                    </span>
                  ) : (
                    <button onClick={() => add(b.id)} style={{ ...secondaryBtn, padding: '8px 14px', fontSize: 13 }}>
                      <I.plus size={14} /> Add to library
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {uploadOpen && <UploadModal onClose={() => setUploadOpen(false)} onDone={(id) => { setUploadOpen(false); refreshLibrary(); navigate(`/book/${id}`); }} />}
      {toast && <Toast message={toast} />}
    </div>
  );
}

function UploadModal({ onClose, onDone }: { onClose: () => void; onDone: (bookId: string) => void }) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [genre, setGenre] = useState('');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setText(await file.text());
    if (!title) setTitle(file.name.replace(/\.(txt|md)$/i, ''));
  };

  const submit = async () => {
    if (!title.trim() || !text.trim()) {
      setError('A title and some text are required.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const book = await api.importBook({ title: title.trim(), author: author.trim(), genre: genre.trim() || 'Uploaded', text });
      onDone(book.id);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <Overlay onClose={onClose} width={620}>
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 6 }}>Upload</div>
            <div style={{ fontFamily: 'var(--read)', fontSize: 24 }}>Bring your own book</div>
          </div>
          <button onClick={onClose} style={{ marginLeft: 'auto', width: 34, height: 34, borderRadius: 9, border: 'none', background: 'var(--surface-2)', color: 'var(--ink-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <I.close size={19} />
          </button>
        </div>
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }} className="grove-cols">
            <input style={fieldStyle} placeholder="Title *" value={title} onChange={(e) => setTitle(e.target.value)} />
            <input style={fieldStyle} placeholder="Author" value={author} onChange={(e) => setAuthor(e.target.value)} />
            <input style={fieldStyle} placeholder="Genre" value={genre} onChange={(e) => setGenre(e.target.value)} />
          </div>
          <label
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 12, border: '1px dashed var(--line-2)', color: 'var(--ink-2)', fontSize: 13.5, cursor: 'pointer' }}
          >
            <I.upload size={16} /> Choose a .txt or .md file — or paste below
            <input type="file" accept=".txt,.md,text/plain" style={{ display: 'none' }} onChange={(e) => onFile(e.target.files?.[0])} />
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={'Paste the full text. Chapters are detected from lines like "Chapter 1" or markdown headings; paragraphs from blank lines.'}
            style={{ ...fieldStyle, minHeight: 180, resize: 'vertical', fontFamily: 'var(--read)', lineHeight: 1.5 }}
          />
          {error && <div style={{ fontSize: 13, color: '#B5552F' }}>{error}</div>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button onClick={onClose} style={secondaryBtn}>Cancel</button>
            <button onClick={submit} disabled={busy} style={{ ...primaryBtn, opacity: busy ? 0.6 : 1 }}>
              {busy ? 'Importing…' : 'Import book'}
            </button>
          </div>
        </div>
      </div>
    </Overlay>
  );
}
