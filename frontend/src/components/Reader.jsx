import React, { useRef, useEffect, useState } from 'react';

export default function Reader({
  volId,
  pdfPage,
  pageData,
  totalPages,
  onNavigate,
  onOpenSplitView,
  searchQuery
}) {
  const viewportRef = useRef(null);
  const pageRefs = useRef({});
  const [loadedRange, setLoadedRange] = useState({ start: 1, end: 20 });
  const isScrollingToPage = useRef(false);

  // Expand the loaded range as user scrolls
  const BUFFER = 10;

  // When volId changes, reset
  useEffect(() => {
    setLoadedRange({ start: 1, end: Math.min(20, totalPages) });
  }, [volId, totalPages]);

  // When sidebar navigation changes pdfPage, scroll to that page
  useEffect(() => {
    if (pdfPage && pageRefs.current[pdfPage]) {
      isScrollingToPage.current = true;
      pageRefs.current[pdfPage].scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Ensure the range includes this page
      setLoadedRange(prev => ({
        start: Math.min(prev.start, Math.max(1, pdfPage - BUFFER)),
        end: Math.max(prev.end, Math.min(totalPages, pdfPage + BUFFER))
      }));

      setTimeout(() => { isScrollingToPage.current = false; }, 800);
    } else if (pdfPage) {
      // Page not yet rendered, expand range to include it
      setLoadedRange({
        start: Math.max(1, pdfPage - BUFFER),
        end: Math.min(totalPages, pdfPage + BUFFER)
      });
    }
  }, [pdfPage, totalPages]);

  // Scroll after range expands to include target page
  useEffect(() => {
    if (pdfPage && pageRefs.current[pdfPage] && isScrollingToPage.current) {
      pageRefs.current[pdfPage].scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [loadedRange, pdfPage]);

  // On scroll: lazy load more pages & track current visible page
  const handleScroll = () => {
    const vp = viewportRef.current;
    if (!vp) return;

    const scrollTop = vp.scrollTop;
    const scrollHeight = vp.scrollHeight;
    const clientHeight = vp.clientHeight;

    // If near bottom, load more pages ahead
    if (scrollTop + clientHeight > scrollHeight - 1500) {
      setLoadedRange(prev => ({
        ...prev,
        end: Math.min(totalPages, prev.end + 15)
      }));
    }

    // If near top, load more pages before
    if (scrollTop < 1500 && loadedRange.start > 1) {
      setLoadedRange(prev => ({
        ...prev,
        start: Math.max(1, prev.start - 15)
      }));
    }

    // Track which page is currently visible (update page number in parent)
    if (!isScrollingToPage.current) {
      for (let p = loadedRange.start; p <= loadedRange.end; p++) {
        const el = pageRefs.current[p];
        if (el) {
          const rect = el.getBoundingClientRect();
          const vpRect = vp.getBoundingClientRect();
          if (rect.top >= vpRect.top - 100 && rect.top < vpRect.top + clientHeight / 2) {
            if (p !== pdfPage) {
              onNavigate(p);
            }
            break;
          }
        }
      }
    }
  };

  const pages = [];
  for (let p = loadedRange.start; p <= loadedRange.end; p++) {
    pages.push(p);
  }

  return (
    <main className="reader-container">
      <div className="reader-toolbar" style={{ height: '36px', padding: '0 0.75rem' }}>
        <div className="toolbar-group">
          <span style={{ fontSize: '0.8rem', color: 'var(--accent-amber)', fontWeight: 600 }}>
            {volId.toUpperCase()}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
            — {pageData?.chapter_title || 'Petroleum Engineering Handbook'}
          </span>
        </div>
        <div className="toolbar-group">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
            Page {pdfPage}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            / {totalPages}
          </span>
        </div>
      </div>

      <div
        className="reader-viewport"
        ref={viewportRef}
        onScroll={handleScroll}
        style={{
          padding: '1rem 0',
          background: '#525659',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.75rem'
        }}
      >
        {pages.map((p) => (
          <div
            key={`${volId}-page-${p}`}
            ref={(el) => { pageRefs.current[p] = el; }}
            style={{
              width: '100%',
              maxWidth: '900px',
              background: '#fff',
              boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
              borderRadius: '2px',
              position: 'relative',
              flexShrink: 0
            }}
          >
            <img
              src={`./data/previews/${volId}/page_${p}.jpg`}
              alt={`Page ${p}`}
              loading="lazy"
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                borderRadius: '2px'
              }}
              onError={(e) => {
                // Show a placeholder if image isn't rendered yet
                e.target.style.display = 'none';
                e.target.nextSibling && (e.target.nextSibling.style.display = 'flex');
              }}
            />
            <div
              style={{
                display: 'none',
                width: '100%',
                height: '1100px',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f8fafc',
                color: '#94a3b8',
                fontSize: '1.1rem',
                fontFamily: 'var(--font-mono)'
              }}
            >
              Page {p}
            </div>
          </div>
        ))}

        {loadedRange.end < totalPages && (
          <div style={{ padding: '2rem', color: '#94a3b8', fontSize: '0.85rem' }}>
            Scroll down to load more pages...
          </div>
        )}
      </div>
    </main>
  );
}
