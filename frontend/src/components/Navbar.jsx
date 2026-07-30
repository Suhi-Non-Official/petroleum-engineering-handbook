import React from 'react';
import { BookOpen, Search, Wrench, Bot, Sun, Moon, Maximize, ShieldAlert } from 'lucide-react';

export default function Navbar({
  selectedVol,
  onSelectVol,
  onOpenSearch,
  onOpenTools,
  onOpenAI,
  theme,
  onToggleTheme,
  onToggleFullscreen
}) {
  const volumes = [
    { id: 'vol-1', name: 'Vol 1: General Engineering' },
    { id: 'vol-2', name: 'Vol 2: Drilling Engineering' },
    { id: 'vol-3', name: 'Vol 3: Facilities Engineering' },
    { id: 'vol-4', name: 'Vol 4: Production Operations' },
    { id: 'vol-5', name: 'Vol 5: Reservoir Engineering' },
    { id: 'vol-6', name: 'Vol 6: Emerging Technologies' },
    { id: 'vol-7', name: 'Vol 7: Indexes & Standards' }
  ];

  return (
    <header className="navbar">
      <div className="brand">
        <BookOpen className="brand-icon" size={24} />
        <span>PETROLEUM ENGINEERING HANDBOOK</span>
        <span className="brand-subtitle">7-VOLUME PLATFORM</span>
      </div>

      <div className="nav-actions">
        <select
          className="volume-selector"
          value={selectedVol}
          onChange={(e) => onSelectVol(e.target.value)}
        >
          {volumes.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>

        <button className="search-trigger" onClick={onOpenSearch}>
          <Search size={16} />
          <span>Search 7 volumes...</span>
          <span className="search-shortcut">Ctrl K</span>
        </button>

        <button className="btn-accent" onClick={onOpenTools}>
          <Wrench size={16} />
          <span>Engineering Tools</span>
        </button>

        <button className="btn-accent" style={{ background: 'var(--accent-blue)', color: '#fff' }} onClick={onOpenAI}>
          <Bot size={16} />
          <span>Ask AI</span>
        </button>

        <button className="btn-icon" onClick={onToggleTheme} title="Toggle Theme">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button className="btn-icon" onClick={onToggleFullscreen} title="Toggle Fullscreen">
          <Maximize size={18} />
        </button>
      </div>
    </header>
  );
}
