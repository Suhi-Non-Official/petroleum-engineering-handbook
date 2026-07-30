import React, { useState } from 'react';
import { Bot, X, Send, BookOpen, AlertTriangle } from 'lucide-react';

export default function AIAssistant({ isOpen, onClose, onNavigateToPage }) {
  const [question, setQuestion] = useState('');
  const [volFilter, setVolFilter] = useState('all');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    const userQ = question;
    setQuestion('');
    setLoading(true);

    const pendingItem = { q: userQ, a: null, citations: [] };
    setHistory((prev) => [...prev, pendingItem]);

    try {
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userQ, vol_filter: volFilter })
      });
      const data = await res.json();

      setHistory((prev) =>
        prev.map((item) => (item.q === userQ ? { q: userQ, a: data.answer, citations: data.citations } : item))
      );
    } catch (err) {
      console.error(err);
      setHistory((prev) =>
        prev.map((item) =>
          item.q === userQ
            ? { q: userQ, a: 'Error connecting to handbook search engine.', citations: [] }
            : item
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ width: '750px', height: '80vh' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
            <Bot size={18} color="var(--accent-blue)" />
            <span>Ask the Handbook — Grounded RAG Assistant</span>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '0.6rem 0.85rem', borderRadius: '6px', fontSize: '0.75rem', color: 'var(--accent-blue)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={16} />
            <span>Answers are generated using <strong>ONLY</strong> the 7-volume Petroleum Engineering Handbook. Every factual claim is backed by exact citations.</span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
            {history.length === 0 ? (
              <div style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Ask any petroleum engineering question:</p>
                <p style={{ fontSize: '0.8rem' }}>• "What factors affect reservoir permeability?"</p>
                <p style={{ fontSize: '0.8rem' }}>• "Explain Darcy's law assumptions"</p>
                <p style={{ fontSize: '0.8rem' }}>• "How does gas lift operation work?"</p>
              </div>
            ) : (
              history.map((h, i) => (
                <div key={i} style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontWeight: 600, color: 'var(--accent-amber)', fontSize: '0.9rem', marginBottom: '0.4rem' }}>
                    Q: {h.q}
                  </div>
                  {h.a ? (
                    <div style={{ background: 'var(--bg-primary)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                      {h.a}

                      {h.citations?.length > 0 && (
                        <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                            Authoritative Citations:
                          </div>
                          {h.citations.map((c, cIdx) => (
                            <div
                              key={cIdx}
                              className="citation-box"
                              onClick={() => {
                                onNavigateToPage(c.vol_id, c.pdf_page);
                                onClose();
                              }}
                            >
                              👉 {c.citation_str} [Click to Open Page]
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Searching 7 volumes for answer...
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleAsk} style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <input
              type="text"
              className="search-input-box"
              placeholder="Ask a technical question..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <button type="submit" className="btn-accent" style={{ background: 'var(--accent-blue)', color: '#fff' }} disabled={loading}>
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
