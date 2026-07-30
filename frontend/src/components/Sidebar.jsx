import React, { useState } from 'react';
import { ListTree, Bookmark, FileText, History, Star, ChevronDown, ChevronRight, BookOpen } from 'lucide-react';

export default function Sidebar({
  collectionData,
  selectedVol,
  onSelectVol,
  activePdfPage,
  onNavigateToPage,
  userState,
  onAddBookmark
}) {
  const [activeTab, setActiveTab] = useState('toc');
  const [expandedChs, setExpandedChs] = useState({ '1': true, '2': true });

  const toggleChapter = (chNum) => {
    setExpandedChs((prev) => ({ ...prev, [chNum]: !prev[chNum] }));
  };

  const currentVolMeta = collectionData?.volumes?.find((v) => v.vol_id === selectedVol);

  return (
    <aside className="sidebar">
      <div className="sidebar-tabs">
        <button
          className={`sidebar-tab ${activeTab === 'toc' ? 'active' : ''}`}
          onClick={() => setActiveTab('toc')}
        >
          <ListTree size={16} />
          <span>Contents</span>
        </button>
        <button
          className={`sidebar-tab ${activeTab === 'bookmarks' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookmarks')}
        >
          <Bookmark size={16} />
          <span>Bookmarks</span>
        </button>
        <button
          className={`sidebar-tab ${activeTab === 'notes' ? 'active' : ''}`}
          onClick={() => setActiveTab('notes')}
        >
          <FileText size={16} />
          <span>Notes</span>
        </button>
        <button
          className={`sidebar-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <History size={16} />
          <span>History</span>
        </button>
      </div>

      <div className="sidebar-content">
        {activeTab === 'toc' && (
          <div className="toc-container">
            <div className="toc-volume-header">
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <BookOpen size={16} />
                {currentVolMeta?.title || 'Volume Contents'}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {currentVolMeta?.page_count} pgs
              </span>
            </div>

            <div className="toc-tree" style={{ marginTop: '0.5rem' }}>
              {currentVolMeta?.toc?.map((ch, idx) => {
                const isExpanded = expandedChs[ch.num] ?? (idx === 0);
                return (
                  <div key={idx} style={{ marginBottom: '0.4rem' }}>
                    <div
                      className="toc-chapter-item"
                      onClick={() => {
                        toggleChapter(ch.num);
                        onNavigateToPage(ch.page);
                      }}
                    >
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      <span style={{ fontWeight: '600' }}>Ch {ch.num}:</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ch.title}
                      </span>
                    </div>

                    {isExpanded &&
                      ch.sections?.map((sec, sIdx) => (
                        <div
                          key={sIdx}
                          className="toc-section-item"
                          onClick={() => onNavigateToPage(sec.page)}
                        >
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
                            {sec.num || `${ch.num}.${sIdx + 1}`}
                          </span>{' '}
                          {sec.title}
                        </div>
                      ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'bookmarks' && (
          <div className="user-items-list">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Saved Bookmarks</span>
              <button
                className="btn-accent"
                style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                onClick={() => onAddBookmark({ vol_id: selectedVol, pdf_page: activePdfPage, title: `Bookmark Page ${activePdfPage}` })}
              >
                + Add Current
              </button>
            </div>
            {userState?.bookmarks?.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '2rem' }}>
                No bookmarks saved yet. Click + Add Current to bookmark page {activePdfPage}.
              </p>
            ) : (
              userState?.bookmarks?.map((bm, i) => (
                <div
                  key={i}
                  className="search-result-item"
                  onClick={() => onNavigateToPage(bm.pdf_page)}
                >
                  <div className="result-location">{bm.vol_id.toUpperCase()} — Page {bm.pdf_page}</div>
                  <div style={{ fontSize: '0.85rem' }}>{bm.title}</div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="user-items-list">
            <span style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: '0.75rem' }}>
              Personal Notes
            </span>
            {userState?.notes?.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '2rem' }}>
                No notes created. Add notes directly from the reader or right panel.
              </p>
            ) : (
              userState?.notes?.map((n, i) => (
                <div key={i} className="search-result-item">
                  <div className="result-location">{n.vol_id?.toUpperCase()} — Page {n.pdf_page}</div>
                  <div style={{ fontSize: '0.85rem' }}>{n.text}</div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="user-items-list">
            <span style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: '0.75rem' }}>
              Reading History
            </span>
            {userState?.history?.map((h, i) => (
              <div
                key={i}
                className="search-result-item"
                onClick={() => onNavigateToPage(h.pdf_page)}
              >
                <div className="result-location">{h.vol_id?.toUpperCase()} — PDF Page {h.pdf_page}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {h.chapter_title || 'General Chapter'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
