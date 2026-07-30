import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Columns, FileText, Image as ImageIcon } from 'lucide-react';

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
  const [viewMode, setViewMode] = useState('text'); // User can toggle between 'canvas' (Image) and 'text' (Text-Only)
  const [imgError, setImgError] = useState(false);

  const handlePrev = () => {
    if (pdfPage > 1) {
      setImgError(false);
      onNavigate(pdfPage - 1);
    }
  };

  const handleNext = () => {
    if (pdfPage < totalPages) {
      setImgError(false);
      onNavigate(pdfPage + 1);
    }
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

  const imageSrc = `/api/page-image/${volId}/${pdfPage}`;
  const staticFallbackSrc = `./data/previews/${volId}/page_${pdfPage}.jpg`;

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
              onChange={(e) => {
                setImgError(false);
                onNavigate(parseInt(e.target.value) || 1);
              }}
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
            className={`btn-accent ${viewMode === 'text' ? '' : 'btn-icon'}`}
            style={{
              padding: '0.3rem 0.6rem',
              fontSize: '0.8rem',
              background: viewMode === 'text' ? 'var(--accent-amber)' : 'var(--bg-primary)',
              color: viewMode === 'text' ? '#000' : 'var(--text-primary)'
            }}
            onClick={() => {
              setViewMode('text');
              setImgError(false);
            }}
          >
            <FileText size={15} /> 📄 Text-Only
          </button>

          <button
            className={`btn-accent ${viewMode === 'canvas' ? '' : 'btn-icon'}`}
            style={{
              padding: '0.3rem 0.6rem',
              fontSize: '0.8rem',
              background: viewMode === 'canvas' ? 'var(--accent-blue)' : 'var(--bg-primary)',
              color: viewMode === 'canvas' ? '#fff' : 'var(--text-primary)'
            }}
            onClick={() => {
              setViewMode('canvas');
              setImgError(false);
            }}
          >
            <ImageIcon size={15} /> 📷 Image View
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

          <button className="btn-icon" onClick={onOpenSplitView} title="Toggle Split View Mode">
            <Columns size={16} />
          </button>
        </div>
      </div>

      <div className="reader-viewport">
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

          {viewMode === 'canvas' && !imgError ? (
            <div>
              <div style={{ background: 'rgba(56, 189, 248, 0.15)', color: 'var(--accent-blue)', padding: '0.4rem 0.75rem', borderRadius: '4px', fontSize: '0.75rem', marginBottom: '1rem', fontWeight: 600 }}>
                High-Resolution Original PDF Image View Active
              </div>
              <img
                src={imageSrc}
                onError={(e) => {
                  if (e.target.src.includes('/api/')) {
                    e.target.src = staticFallbackSrc;
                  } else {
                    setImgError(true);
                  }
                }}
                alt={`Page ${pdfPage}`}
                className="scanned-image-view"
              />
            </div>
          ) : (
            <div className="page-text-content" style={{ padding: '0.5rem 0' }}>
              {pageData?.text_content ? (
                highlightedText(pageData.text_content)
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                  Loading page text content...
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
