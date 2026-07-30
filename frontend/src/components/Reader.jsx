import React from 'react';

export default function Reader({
  volId,
  pdfPage,
  pageData,
  totalPages,
  onNavigate,
  onOpenSplitView,
  searchQuery
}) {
  // Build the PDF URL — open directly to the requested page, with scrollbar, no toolbar clutter
  const pdfSrc = `./pdfs/${volId}.pdf#page=${pdfPage}&view=FitH&scrollbar=1&toolbar=0&navpanes=0`;

  return (
    <main className="reader-container">
      <div className="reader-toolbar" style={{ height: '36px', padding: '0 0.75rem' }}>
        <div className="toolbar-group">
          <span style={{ fontSize: '0.8rem', color: 'var(--accent-amber)', fontWeight: 600 }}>
            {volId.toUpperCase()}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            — {pageData?.chapter_title || 'General Engineering'}
          </span>
        </div>
        <div className="toolbar-group">
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {totalPages} pages
          </span>
        </div>
      </div>

      <div className="reader-viewport" style={{ padding: 0, background: '#525659' }}>
        <iframe
          key={`${volId}-${pdfPage}`}
          src={pdfSrc}
          title={`PDF Viewer — ${volId}`}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block'
          }}
          allowFullScreen
        />
      </div>
    </main>
  );
}
