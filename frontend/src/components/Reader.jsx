import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Columns, FileText, BookOpen } from 'lucide-react';

export default function Reader({
  volId,
  pdfPage,
  pageData,
  totalPages,
  onNavigate,
  onOpenSplitView,
  searchQuery
}) {
  const [zoom, setZoom] = useState(100);
  const [viewMode, setViewMode] = useState('pdf'); // Default to Interactive PDF Viewer Mode!

  const handlePrev = () => {
    if (pdfPage > 1) onNavigate(pdfPage - 1);
  };

  const handleNext = () => {
    if (pdfPage < totalPages) onNavigate(pdfPage + 1);
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z + 15, 200));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 15, 60));

  const highlightedText = (text) => {
    if (!searchQuery || !text) return text;
    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <mark key={i}>{part}</mark>
      ) : (
        part
      )
    );
  };

  const pdfSrc = `./pdfs/${volId}.pdf#page=${pdfPage}&toolbar=1&navpanes=1`;

  return (
    <main className="reader-container">
      <div className="reader-toolbar">
        <div className="toolbar-group">
          <button className="btn-icon" onClick={handlePrev} disabled={pdfPage <= 1} title="Previous Page">
            <ChevronLeft size={18} />
          </button>
          <span>
            Page{' '}
            <input
              type="number"
              className="page-input"
              value={pdfPage}
              min={1}
              max={totalPages}
              onChange={(e) => onNavigate(parseInt(e.target.value) || 1)}
            />{' '}
            / {totalPages}
          </span>
          <button className="btn-icon" onClick={handleNext} disabled={pdfPage >= totalPages} title="Next Page">
            <ChevronRight size={18} />
          </button>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
            [Printed Pg: {pageData?.printed_page || pdfPage}]
          </span>
        </div>

        <div className="toolbar-group">
          {/* Explicit View Mode Toggle Buttons */}
          <button
            className={`btn-accent ${viewMode === 'pdf' ? '' : 'btn-icon'}`}
            style={{
              padding: '0.3rem 0.65rem',
              fontSize: '0.8rem',
              background: viewMode === 'pdf' ? 'var(--accent-amber)' : 'var(--bg-primary)',
              color: viewMode === 'pdf' ? '#000' : 'var(--text-primary)'
            }}
            onClick={() => setViewMode('pdf')}
          >
            <BookOpen size={15} /> 📄 Interactive PDF Viewer
          </button>

          <button
            className={`btn-accent ${viewMode === 'text' ? '' : 'btn-icon'}`}
            style={{
              padding: '0.3rem 0.65rem',
              fontSize: '0.8rem',
              background: viewMode === 'text' ? 'var(--accent-blue)' : 'var(--bg-primary)',
              color: viewMode === 'text' ? '#fff' : 'var(--text-primary)'
            }}
            onClick={() => setViewMode('text')}
          >
            <FileText size={15} /> 📝 Extracted Text View
          </button>

          <button className="btn-icon" onClick={handleZoomOut} title="Zoom Out">
            <ZoomOut size={16} />
          </button>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', minWidth: '40px', textAlign: 'center' }}>
            {zoom}%
          </span>
          <button className="btn-icon" onClick={handleZoomIn} title="Zoom In">
            <ZoomIn size={16} />
          </button>

          <button className="btn-icon" onClick={onOpenSplitView} title="Toggle Side Panel">
            <Columns size={16} />
          </button>
        </div>
      </div>

      <div className="reader-viewport" style={{ padding: viewMode === 'pdf' ? '0' : '1.5rem' }}>
        {viewMode === 'pdf' ? (
          <iframe
            key={`${volId}-${pdfPage}`}
            src={pdfSrc}
            title={`PDF Viewer ${volId}`}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              background: '#1e293b'
            }}
          />
        ) : (
          <div
            className="page-card"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease'
            }}
          >
            <div className="page-header-strip">
              <span>
                {volId.toUpperCase()} — CH {pageData?.chapter_num || '1'}: {pageData?.chapter_title || 'General Engineering'}
              </span>
              <span>HANDBOOK PAGE {pageData?.printed_page || pdfPage} (PDF P. {pdfPage})</span>
            </div>

            <div className="page-text-content" style={{ padding: '0.5rem 0' }}>
              {pageData?.text_content ? (
                highlightedText(pageData.text_content)
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                  Loading page text content...
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
