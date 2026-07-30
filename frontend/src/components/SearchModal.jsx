import React, { useState } from 'react';
import { Search, X, Filter, BookOpen } from 'lucide-react';

export default function SearchModal({ isOpen, onClose, onSelectResult }) {
  const [query, setQuery] = useState('');
  const [volFilter, setVolFilter] = useState('all');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);

    try {
      const url = `/api/search?q=${encodeURIComponent(query)}&vol_id=${volFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
            <Search size={18} color="var(--accent-amber)" />
            <span>Global 7-Volume Handbook Search</span>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <input
              type="text"
              className="search-input-box"
              placeholder='Search terms, equations, figures (e.g. "Darcy law", "skin factor", "separator")...'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            <select
              className="volume-selector"
              value={volFilter}
              onChange={(e) => setVolFilter(e.target.value)}
            >
              <option value="all">All 7 Volumes</option>
              <option value="vol-1">Vol 1: General</option>
              <option value="vol-2">Vol 2: Drilling</option>
              <option value="vol-3">Vol 3: Facilities</option>
              <option value="vol-4">Vol 4: Production</option>
              <option value="vol-5">Vol 5: Reservoir</option>
              <option value="vol-6">Vol 6: Emerging</option>
              <option value="vol-7">Vol 7: Standards</option>
            </select>
            <button type="submit" className="btn-accent">
              Search
            </button>
          </form>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              Searching across 2+ million words in 7 volumes...
            </div>
          ) : results.length > 0 ? (
            <div className="results-list">
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                Found {results.length} matches across collection:
              </div>
              {results.map((r, i) => (
                <div
                  key={i}
                  className="search-result-item"
                  onClick={() => {
                    onSelectResult(r.vol_id, r.pdf_page, query);
                    onClose();
                  }}
                >
                  <div className="result-location">
                    {r.vol_id.toUpperCase()} — Chapter {r.chapter_num}: {r.chapter_title} — Page {r.printed_page} (PDF p. {r.pdf_page})
                  </div>
                  <div
                    className="result-snippet"
                    dangerouslySetInnerHTML={{ __html: r.snippet }}
                  />
                </div>
              ))}
            </div>
          ) : query ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              No matches found for "{query}". Try alternative engineering terminology.
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              Type your query above to search all 5,626 handbook pages instantly.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
