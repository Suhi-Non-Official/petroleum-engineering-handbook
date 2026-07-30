import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Reader from './components/Reader';
import RightPanel from './components/RightPanel';
import SearchModal from './components/SearchModal';
import ToolsPanel from './components/ToolsPanel';
import AIAssistant from './components/AIAssistant';

export default function App() {
  const [collectionData, setCollectionData] = useState(null);
  const [selectedVol, setSelectedVol] = useState('vol-1');
  const [activePdfPage, setActivePdfPage] = useState(1);
  const [pageData, setPageData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Panels state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [theme, setTheme] = useState('dark');

  // User personalization state
  const [userState, setUserState] = useState({
    bookmarks: [],
    notes: [],
    history: []
  });

  // Fetch Collection Metadata
  useEffect(() => {
    fetch('/api/collection')
      .then((res) => res.json())
      .then((data) => setCollectionData(data))
      .catch((err) => console.error('Failed to load collection metadata:', err));

    fetch('/api/user/state')
      .then((res) => res.json())
      .then((data) => setUserState(data))
      .catch((err) => console.error('Failed to load user state:', err));
  }, []);

  // Fetch Current Page Metadata & Text
  useEffect(() => {
    if (!selectedVol || !activePdfPage) return;
    fetch(`/api/page/${selectedVol}/${activePdfPage}`)
      .then((res) => res.json())
      .then((data) => {
        setPageData(data);
        // Track History
        fetch('/api/user/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vol_id: selectedVol,
            pdf_page: activePdfPage,
            chapter_title: data.chapter_title,
            timestamp: new Date().toISOString()
          })
        });
      })
      .catch((err) => console.error('Failed to load page data:', err));
  }, [selectedVol, activePdfPage]);

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if (e.key === 'ArrowRight') {
        const total = collectionData?.volumes?.find((v) => v.vol_id === selectedVol)?.page_count || 1000;
        if (activePdfPage < total) setActivePdfPage((p) => p + 1);
      } else if (e.key === 'ArrowLeft') {
        if (activePdfPage > 1) setActivePdfPage((p) => p - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePdfPage, selectedVol, collectionData]);

  const handleNavigateToPage = (volIdOrPage, pageMaybe) => {
    if (typeof volIdOrPage === 'string') {
      setSelectedVol(volIdOrPage);
      setActivePdfPage(pageMaybe || 1);
    } else {
      setActivePdfPage(volIdOrPage);
    }
  };

  const handleAddBookmark = (bm) => {
    fetch('/api/user/bookmark', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bm)
    })
      .then((res) => res.json())
      .then((data) => setUserState((prev) => ({ ...prev, bookmarks: data.bookmarks })));
  };

  const handleAddNote = (note) => {
    fetch('/api/user/note', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(note)
    })
      .then((res) => res.json())
      .then((data) => setUserState((prev) => ({ ...prev, notes: data.notes })));
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.body.className = nextTheme;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const currentVolMeta = collectionData?.volumes?.find((v) => v.vol_id === selectedVol);

  return (
    <div className="app-container">
      <Navbar
        selectedVol={selectedVol}
        onSelectVol={(v) => {
          setSelectedVol(v);
          setActivePdfPage(1);
        }}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenTools={() => setIsToolsOpen(true)}
        onOpenAI={() => setIsAIOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
        onToggleFullscreen={toggleFullscreen}
      />

      <div className="main-content">
        <Sidebar
          collectionData={collectionData}
          selectedVol={selectedVol}
          onSelectVol={setSelectedVol}
          activePdfPage={activePdfPage}
          onNavigateToPage={(pg) => setActivePdfPage(pg)}
          userState={userState}
          onAddBookmark={handleAddBookmark}
        />

        <Reader
          volId={selectedVol}
          pdfPage={activePdfPage}
          pageData={pageData}
          totalPages={currentVolMeta?.page_count || 1000}
          onNavigate={(pg) => setActivePdfPage(pg)}
          onOpenSplitView={() => setIsRightPanelOpen(!isRightPanelOpen)}
          searchQuery={searchQuery}
        />

        {isRightPanelOpen && (
          <RightPanel
            pageData={pageData}
            volId={selectedVol}
            pdfPage={activePdfPage}
            onClose={() => setIsRightPanelOpen(false)}
            onNavigateToPage={handleNavigateToPage}
            onAddNote={handleAddNote}
          />
        )}
      </div>

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectResult={(vol_id, pdf_page, q) => {
          setSelectedVol(vol_id);
          setActivePdfPage(pdf_page);
          setSearchQuery(q);
        }}
      />

      <ToolsPanel isOpen={isToolsOpen} onClose={() => setIsToolsOpen(false)} />

      <AIAssistant
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
        onNavigateToPage={(vol_id, pdf_page) => {
          setSelectedVol(vol_id);
          setActivePdfPage(pdf_page);
        }}
      />
    </div>
  );
}
