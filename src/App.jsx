import { useState, useEffect, useMemo, useRef } from 'react';

const SHELVES = [
  { id: 'reading', label: 'currently reading' },
  { id: 'read', label: 'read' },
  { id: 'tbr', label: 'tbr' },
];

const PALETTE = ['#6E8FA8', '#3F6E8C', '#8FAFC2', '#4A5C7A', '#5A8299'];

function hashStr(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function colorFor(book) {
  return PALETTE[hashStr(book.title + book.author) % PALETTE.length];
}

function heightFor(pages) {
  const p = Number(pages) || 220;
  const clamped = Math.max(80, Math.min(700, p));
  return 90 + (clamped - 80) * (90 / 620);
}

function widthFor(pages) {
  const p = Number(pages) || 220;
  const clamped = Math.max(80, Math.min(700, p));
  return 20 + (clamped - 80) * (14 / 620);
}

function swayClass(id) {
  const n = hashStr(id) % 3;
  return `sway-${n}`;
}

export default function TheLibrary() {
  const [books, setBooks] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [formOpenFor, setFormOpenFor] = useState(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [pages, setPages] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);
  const [entryDraft, setEntryDraft] = useState('');
  const [entryType, setEntryType] = useState('note');
  const titleInputRef = useRef(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('library:books');
      if (saved) setBooks(JSON.parse(saved));
    } catch (e) {
      // no shelf saved yet
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem('library:books', JSON.stringify(books));
    } catch (e) {
      // storage unavailable
    }
  }, [books, loaded]);

  useEffect(() => {
    if (formOpenFor && titleInputRef.current) titleInputRef.current.focus();
  }, [formOpenFor]);

  useEffect(() => {
    if (selectedBook) {
      const fresh = books.find((b) => b.id === selectedBook.id);
      if (fresh && fresh !== selectedBook) setSelectedBook(fresh);
    }
  }, [books]);

  function addBook(shelfId) {
    if (!title.trim() || !author.trim()) {
      setError('A book needs a title and an author.');
      return;
    }
    const newBook = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: title.trim(),
      author: author.trim(),
      pages: pages ? Number(pages) : null,
      note: note.trim() || null,
      shelf: shelfId,
      entries: [],
    };
    setBooks((b) => [newBook, ...b]);
    setTitle('');
    setAuthor('');
    setPages('');
    setNote('');
    setError('');
    setFormOpenFor(null);
  }

  function removeBook(id) {
    setBooks((b) => b.filter((x) => x.id !== id));
    setSelectedBook(null);
  }

  function addEntry(bookId) {
    if (!entryDraft.trim()) return;
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: entryType,
      text: entryDraft.trim(),
    };
    setBooks((b) =>
      b.map((book) =>
        book.id === bookId
          ? { ...book, entries: [entry, ...(book.entries || [])] }
          : book
      )
    );
    setEntryDraft('');
  }

  function removeEntry(bookId, entryId) {
    setBooks((b) =>
      b.map((book) =>
        book.id === bookId
          ? {
              ...book,
              entries: (book.entries || []).filter((e) => e.id !== entryId),
            }
          : book
      )
    );
  }

  function booksFor(shelfId) {
    return books.filter((b) => b.shelf === shelfId);
  }

  return (
    <div className="lib-root">
      <style>{`
        .lib-root {
          --bg: #F7F4EE;
          --ink: #2E2A26;
          --muted: #8C8578;
          --line: #D8D2C4;
          --accent: #3F6E8C;
          --card: #FFFFFF;
          min-height: 100%;
          background: var(--bg);
          color: var(--ink);
          font-family: Georgia, "Iowan Old Style", "Palatino Linotype", serif;
          padding: 44px 24px 90px;
          box-sizing: border-box;
        }
        .lib-header { max-width: 680px; margin: 0 auto 8px; }
        .lib-eyebrow {
          font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
          font-size: 10.5px; letter-spacing: 0.18em; text-transform: uppercase;
          color: var(--muted); margin-bottom: 6px;
        }
        .lib-title { font-size: 28px; font-weight: 400; margin: 0 0 2px; letter-spacing: 0.01em; }
        .lib-sub { font-size: 13.5px; font-style: italic; color: var(--muted); margin: 0 0 40px; }

        .thread-section { max-width: 680px; margin: 0 auto 60px; position: relative; }
        .thread-line { display: block; width: 100%; height: 10px; overflow: visible; }
        .thread-header {
          display: flex; align-items: baseline; justify-content: space-between;
          margin-top: 8px; margin-bottom: 22px;
        }
        .thread-label {
          font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
          font-size: 10.5px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted);
        }
        .thread-count { opacity: 0.7; margin-left: 4px; }

        .add-toggle {
          background: transparent; border: none; color: var(--accent);
          font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
          font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase;
          cursor: pointer; padding: 2px 0; border-bottom: 1px solid transparent;
        }
        .add-toggle:hover { border-bottom-color: var(--accent); }
        .add-toggle:focus-visible { outline: 1px solid var(--accent); outline-offset: 3px; }

        .add-form {
          margin: -8px 0 30px; padding: 18px 0 0;
          display: grid; gap: 12px;
        }
        .add-form label {
          display: block; font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
          font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase;
          color: var(--muted); margin-bottom: 5px;
        }
        .add-form input, .add-form textarea {
          width: 100%; box-sizing: border-box; background: var(--card);
          border: 1px solid var(--line); color: var(--ink);
          font-family: Georgia, serif; font-size: 14px; padding: 8px 10px; border-radius: 2px;
        }
        .add-form input:focus, .add-form textarea:focus { outline: 1px solid var(--accent); }
        .add-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .add-form-error { color: #A85C4E; font-size: 12px; font-style: italic; }
        .add-form-actions { display: flex; justify-content: flex-end; gap: 14px; margin-top: 2px; }
        .btn-text {
          background: transparent; border: none; cursor: pointer;
          font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
          font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase;
        }
        .btn-text.primary { color: var(--ink); border-bottom: 1px solid var(--ink); }
        .btn-text.ghost { color: var(--muted); }

        .rack { display: flex; align-items: flex-start; gap: 14px; flex-wrap: wrap; min-height: 60px; margin-top: -4px; }
        .rack-empty { font-size: 13px; font-style: italic; color: var(--muted); padding: 10px 0; }

        .ribbon-unit { display: flex; flex-direction: column; align-items: center; cursor: pointer; }
        .ribbon-string { position: relative; width: 1px; height: 10px; background: var(--muted); }
        .ribbon-string::before {
          content: ""; position: absolute; top: -3px; left: 50%; transform: translateX(-50%);
          width: 5px; height: 5px; border-radius: 50%; background: var(--muted);
        }
        .ribbon {
          position: relative;
          border-radius: 1px 1px 0 0;
          clip-path: polygon(0 0, 100% 0, 100% 82%, 50% 100%, 0 82%);
          display: flex; align-items: flex-start; justify-content: center;
          padding-top: 10px;
          transform-origin: top center;
          transition: filter 0.15s ease;
        }
        .ribbon-unit:hover .ribbon, .ribbon-unit:focus-visible .ribbon { filter: brightness(1.06); }
        .ribbon-unit:focus-visible { outline: none; }
        .ribbon-unit:focus-visible .ribbon { outline: 1px solid var(--ink); outline-offset: 2px; }
        .ribbon-text {
          writing-mode: vertical-rl;
          transform: rotate(180deg);
          font-size: 11.5px;
          color: rgba(46,42,38,0.82);
          max-height: 78%;
          overflow: hidden;
          white-space: nowrap;
          letter-spacing: 0.01em;
        }
        .sway-0 { animation: sway0 4.6s ease-in-out infinite; }
        .sway-1 { animation: sway1 5.4s ease-in-out infinite; }
        .sway-2 { animation: sway2 5s ease-in-out infinite; }
        @keyframes sway0 { 0%,100% { transform: rotate(-1.4deg); } 50% { transform: rotate(1.4deg); } }
        @keyframes sway1 { 0%,100% { transform: rotate(1.1deg); } 50% { transform: rotate(-1.6deg); } }
        @keyframes sway2 { 0%,100% { transform: rotate(-1.8deg); } 50% { transform: rotate(0.9deg); } }
        @media (prefers-reduced-motion: reduce) {
          .sway-0, .sway-1, .sway-2 { animation: none; }
        }

        .detail-overlay {
          position: fixed; inset: 0; background: rgba(46,42,38,0.5);
          display: flex; align-items: center; justify-content: center; padding: 20px; z-index: 10;
        }
        .detail-card {
          background: var(--bg); border: 1px solid var(--line); border-radius: 4px;
          max-width: 440px; width: 100%; max-height: 84vh; overflow-y: auto;
          padding: 28px; position: relative;
        }
        .detail-close {
          position: absolute; top: 16px; right: 18px; background: transparent; border: none;
          color: var(--muted); font-size: 18px; cursor: pointer; line-height: 1;
        }
        .detail-shelf {
          font-family: ui-monospace, monospace; font-size: 10px;
          letter-spacing: 0.1em; text-transform: uppercase; color: var(--accent); margin-bottom: 10px;
        }
        .detail-title { font-size: 21px; margin: 0 0 3px; padding-right: 20px; }
        .detail-author { font-size: 13.5px; font-style: italic; color: var(--muted); margin: 0 0 6px; }
        .detail-note { font-size: 13.5px; color: var(--ink); margin: 0 0 20px; line-height: 1.5; }
        .detail-remove {
          background: transparent; border: none; color: #A85C4E;
          font-family: ui-monospace, monospace; font-size: 10.5px;
          letter-spacing: 0.06em; text-transform: uppercase; cursor: pointer; padding: 0;
          border-bottom: 1px solid transparent;
        }
        .detail-remove:hover { border-bottom-color: #A85C4E; }

        .entry-log-title {
          font-family: ui-monospace, monospace; font-size: 10.5px;
          letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted);
          margin: 20px 0 12px; border-top: 1px solid var(--line); padding-top: 16px;
        }
        .entry-add { display: flex; gap: 8px; margin-bottom: 14px; }
        .entry-add select {
          background: var(--card); border: 1px solid var(--line); font-size: 12px;
          padding: 7px 6px; border-radius: 2px; color: var(--ink); font-family: ui-monospace, monospace;
        }
        .entry-add input {
          flex: 1; background: var(--card); border: 1px solid var(--line);
          font-family: Georgia, serif; font-size: 13.5px; padding: 7px 10px; border-radius: 2px; color: var(--ink);
        }
        .entry-add input:focus, .entry-add select:focus { outline: 1px solid var(--accent); }
        .entry-list { display: flex; flex-direction: column; gap: 10px; }
        .entry-row {
          display: flex; align-items: flex-start; gap: 10px;
          padding-bottom: 10px; border-bottom: 1px solid var(--line);
        }
        .entry-tag {
          font-family: ui-monospace, monospace; font-size: 9.5px; letter-spacing: 0.06em;
          text-transform: uppercase; color: var(--accent); flex-shrink: 0; padding-top: 2px; width: 44px;
        }
        .entry-text { font-size: 13.5px; line-height: 1.5; flex: 1; }
        .entry-remove {
          background: transparent; border: none; color: var(--muted); cursor: pointer;
          font-size: 14px; flex-shrink: 0; padding: 0;
        }
        .entry-remove:hover { color: #A85C4E; }
        .entry-empty { font-size: 12.5px; font-style: italic; color: var(--muted); }

        @media (max-width: 520px) {
          .lib-title { font-size: 23px; }
          .add-form-row { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="lib-header">
        <div className="lib-eyebrow">a running record</div>
        <h1 className="lib-title">the shelf</h1>
        <p className="lib-sub">
          everything read, being read, and waiting to be.
        </p>
      </div>

      {SHELVES.map((s) => {
        const shelfBooks = booksFor(s.id);
        return (
          <section className="thread-section" key={s.id}>
            <div className="thread-header">
              <span className="thread-label">
                {s.label}{' '}
                <span className="thread-count">({shelfBooks.length})</span>
              </span>
              <button
                className="add-toggle"
                onClick={() =>
                  setFormOpenFor(formOpenFor === s.id ? null : s.id)
                }
              >
                {formOpenFor === s.id ? 'close' : '+ add'}
              </button>
            </div>

            {formOpenFor === s.id && (
              <div className="add-form">
                <div>
                  <label htmlFor={`title-${s.id}`}>title</label>
                  <input
                    id={`title-${s.id}`}
                    ref={titleInputRef}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addBook(s.id);
                      }
                    }}
                    placeholder="The Bell Jar"
                  />
                </div>
                <div className="add-form-row">
                  <div>
                    <label htmlFor={`author-${s.id}`}>author</label>
                    <input
                      id={`author-${s.id}`}
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addBook(s.id);
                        }
                      }}
                      placeholder="Sylvia Plath"
                    />
                  </div>
                  <div>
                    <label htmlFor={`pages-${s.id}`}>pages (optional)</label>
                    <input
                      id={`pages-${s.id}`}
                      type="number"
                      min="1"
                      value={pages}
                      onChange={(e) => setPages(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addBook(s.id);
                        }
                      }}
                      placeholder="244"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor={`note-${s.id}`}>
                    a line about it (optional)
                  </label>
                  <textarea
                    id={`note-${s.id}`}
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="picked this up because of the cover, stayed for the ending"
                  />
                </div>
                {error && <div className="add-form-error">{error}</div>}
                <div className="add-form-actions">
                  <button
                    type="button"
                    className="btn-text ghost"
                    onClick={() => setFormOpenFor(null)}
                  >
                    cancel
                  </button>
                  <button
                    type="button"
                    className="btn-text primary"
                    onClick={() => addBook(s.id)}
                  >
                    shelve it
                  </button>
                </div>
              </div>
            )}

            <svg
              className="thread-line"
              viewBox="0 0 680 10"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                d="M0,2 Q340,8 680,2"
                fill="none"
                stroke="var(--muted)"
                strokeWidth="1"
              />
            </svg>
            <div className="rack">
              {shelfBooks.length === 0 ? (
                <div className="rack-empty">nothing here yet.</div>
              ) : (
                shelfBooks.map((book) => (
                  <div
                    key={book.id}
                    className="ribbon-unit"
                    tabIndex={0}
                    role="button"
                    onClick={() => setSelectedBook(book)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedBook(book);
                      }
                    }}
                    title={`${book.title} — ${book.author}`}
                  >
                    <div className="ribbon-string" />
                    <div
                      className={`ribbon ${swayClass(book.id)}`}
                      style={{
                        width: `${widthFor(book.pages)}px`,
                        height: `${heightFor(book.pages)}px`,
                        background: colorFor(book),
                      }}
                    >
                      <span className="ribbon-text">{book.title}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        );
      })}

      {selectedBook && (
        <div className="detail-overlay" onClick={() => setSelectedBook(null)}>
          <div className="detail-card" onClick={(e) => e.stopPropagation()}>
            <button
              className="detail-close"
              onClick={() => setSelectedBook(null)}
              aria-label="close"
            >
              ×
            </button>
            <div className="detail-shelf">
              {SHELVES.find((s) => s.id === selectedBook.shelf).label}
            </div>
            <h2 className="detail-title">{selectedBook.title}</h2>
            <p className="detail-author">{selectedBook.author}</p>
            {selectedBook.note && (
              <p className="detail-note">{selectedBook.note}</p>
            )}
            <button
              className="detail-remove"
              onClick={() => removeBook(selectedBook.id)}
            >
              remove from shelf
            </button>

            {selectedBook.shelf === 'reading' && (
              <>
                <div className="entry-log-title">log as you go</div>
                <div className="entry-add">
                  <select
                    value={entryType}
                    onChange={(e) => setEntryType(e.target.value)}
                  >
                    <option value="note">note</option>
                    <option value="quote">quote</option>
                    <option value="word">word</option>
                    <option value="page">page</option>
                  </select>
                  <input
                    value={entryDraft}
                    onChange={(e) => setEntryDraft(e.target.value)}
                    placeholder={
                      entryType === 'page' ? 'on page 118' : 'type it in'
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addEntry(selectedBook.id);
                      }
                    }}
                  />
                  <button
                    className="btn-text primary"
                    onClick={() => addEntry(selectedBook.id)}
                  >
                    add
                  </button>
                </div>
                <div className="entry-list">
                  {(selectedBook.entries || []).length === 0 ? (
                    <div className="entry-empty">nothing logged yet.</div>
                  ) : (
                    selectedBook.entries.map((entry) => (
                      <div className="entry-row" key={entry.id}>
                        <span className="entry-tag">{entry.type}</span>
                        <span className="entry-text">{entry.text}</span>
                        <button
                          className="entry-remove"
                          onClick={() => removeEntry(selectedBook.id, entry.id)}
                          aria-label="remove entry"
                        >
                          ×
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
