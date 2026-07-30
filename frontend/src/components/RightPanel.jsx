import React, { useState } from 'react';
import { X, ExternalLink, FileText, Layers, BookmarkPlus } from 'lucide-react';

export default function RightPanel({
  pageData,
  volId,
  pdfPage,
  onClose,
  onNavigateToPage,
  onAddNote
}) {
  const [noteText, setNoteText] = useState('');

  const handleSaveNote = () => {
    if (!noteText.trim()) return;
    onAddNote({
      vol_id: volId,
      pdf_page: pdfPage,
      text: noteText,
      created_at: new Date().toISOString()
    });
    setNoteText('');
  };

  return (
    <aside className="right-panel">
      <div className="right-panel-header">
        <span>Page References & Tools</span>
        <button className="btn-icon" onClick={onClose}>
          <X size={16} />
        </button>
      </div>

      <div className="sidebar-content">
        <div style={{ marginBottom: '1.25rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-amber)', display: 'block', marginBottom: '0.5rem' }}>
            Detected Cross-References
          </span>
          {pageData?.references?.length > 0 ? (
            <div>
              {pageData.references.map((r, i) => (
                <div key={i} className="ref-badge">
                  <ExternalLink size={12} />
                  <span>
                    {r.type.toUpperCase()}: {r.target}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              No explicit cross-references detected on page {pdfPage}.
            </p>
          )}
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '0.5rem' }}>
            Add Note for Page {pdfPage}
          </span>
          <textarea
            className="form-input"
            rows={4}
            placeholder="Type your notes or reference observations here..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            style={{ width: '100%', marginBottom: '0.5rem' }}
          />
          <button className="btn-accent" style={{ width: '100%', padding: '0.35rem 0.6rem', fontSize: '0.8rem' }} onClick={handleSaveNote}>
            <FileText size={14} /> Save Note
          </button>
        </div>

        <div>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '0.5rem' }}>
            Related Handbook Topics
          </span>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <div style={{ padding: '0.4rem', borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}>
              → Fluid properties and PVT analysis
            </div>
            <div style={{ padding: '0.4rem', borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}>
              → Material balance equations
            </div>
            <div style={{ padding: '0.4rem', borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}>
              → Wellbore transient pressure testing
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
