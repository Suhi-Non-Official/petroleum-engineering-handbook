import React, { useState } from 'react';
import { X, FileText } from 'lucide-react';

export default function RightPanel({
  pageData,
  volId,
  pdfPage,
  onClose,
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
        <span>Personal Notes</span>
        <button className="btn-icon" onClick={onClose}>
          <X size={16} />
        </button>
      </div>

      <div className="sidebar-content" style={{ padding: '1rem' }}>
        <div>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '0.5rem' }}>
            Add Note for Page {pdfPage}
          </span>
          <textarea
            className="form-input"
            rows={6}
            placeholder="Type your personal observations, equations, or notes for this page..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            style={{ width: '100%', marginBottom: '0.75rem' }}
          />
          <button className="btn-accent" style={{ width: '100%', padding: '0.45rem 0.6rem', fontSize: '0.85rem' }} onClick={handleSaveNote}>
            <FileText size={16} /> Save Note
          </button>
        </div>
      </div>
    </aside>
  );
}
