import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Reader from './components/Reader';
import RightPanel from './components/RightPanel';
import SearchModal from './components/SearchModal';
import ToolsPanel from './components/ToolsPanel';

export default function App() {
  const [collectionData, setCollectionData] = useState(null);
  const [selectedVol, setSelectedVol] = useState('vol-1');
  const [activePdfPage, setActivePdfPage] = useState(1);
  const [pageData, setPageData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Cache loaded volume pages in memory for 100% instant page turns in static mode
  const volPagesCache = useRef({});

  // Modals & Panels state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [theme, setTheme] = useState('dark');

  // User state with localStorage persistence
  const [userState, setUserState] = useState(() => {
    const saved = localStorage.getItem('petroleum_user_state');
    return saved ? JSON.parse(saved) : { bookmarks: [], notes: [], history: [] };
  });

  useEffect(() => {
    localStorage.setItem('petroleum_user_state', JSON.stringify(userState));
  }, [userState]);

  // Fetch Collection Metadata (API with Static Fallback)
  useEffect(() => {
    fetch('/api/collection')
      .then((res) => {
        if (!res.ok) throw new Error('API offline');
        return res.json();
      })
      .then((data) => setCollectionData(data))
      .catch(() => {
        fetch('./data/global/collection.json')
          .then((res) => res.json())
          .then((data) => setCollectionData(data))
          .catch((err) => console.error('Failed to load static collection:', err));
      });
  }, []);

  // Fetch Page Data with In-Memory Caching
  useEffect(() => {
    if (!selectedVol || !activePdfPage) return;

    // Try API first
    fetch(`/api/page/${selectedVol}/${activePdfPage}`)
      .then((res) => {
        if (!res.ok) throw new Error('API offline');
        return res.json();
      })
      .then((data) => setPageData(data))
      .catch(() => {
        // Static mode: check in-memory cache
        if (volPagesCache.current[selectedVol]) {
          const pages = volPagesCache.current[selectedVol];
          const match = pages.find((p) => p.pdf_page === activePdfPage) || pages[0];
          setPageData({
            vol_id: selectedVol,
            pdf_page: activePdfPage,
            printed_page: match?.printed_page || activePdfPage,
            chapter_num: match?.chapter_num || '1',
            chapter_title: match?.chapter_title || 'General Engineering',
            section_num: match?.section_num || '',
            section_title: match?.section_title || '',
            text_content: match?.text_content || `Volume ${selectedVol.replace('vol-', '')} — Page ${activePdfPage} content.`
          });
        } else {
          // Load volume pages.json into cache once
          fetch(`./data/volumes/${selectedVol}/pages.json`)
            .then((res) => res.json())
            .then((pages) => {
              volPagesCache.current[selectedVol] = pages;
              const match = pages.find((p) => p.pdf_page === activePdfPage) || pages[0];
              setPageData({
                vol_id: selectedVol,
                pdf_page: activePdfPage,
                printed_page: match?.printed_page || activePdfPage,
                chapter_num: match?.chapter_num || '1',
                chapter_title: match?.chapter_title || 'General Engineering',
                section_num: match?.section_num || '',
                section_title: match?.section_title || '',
                text_content: match?.text_content || `Volume ${selectedVol.replace('vol-', '')} — Page ${activePdfPage} content.`
              });
            })
            .catch((err) => console.error('Failed to load volume static pages:', err));
        }
      });
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

  const handleAddBookmark = (bm) => {
    const newBm = { ...bm, id: `bm_${Date.now()}` };
    setUserState((prev) => ({ ...prev, bookmarks: [...prev.bookmarks, newBm] }));
  };

  const handleDeleteBookmark = (bmId) => {
    setUserState((prev) => ({
      ...prev,
      bookmarks: prev.bookmarks.filter((b) => b.id !== bmId && b.pdf_page !== bmId)
    }));
  };

  const handleAddNote = (note) => {
    const newNote = { ...note, id: `note_${Date.now()}` };
    setUserState((prev) => ({ ...prev, notes: [...prev.notes, newNote] }));
  };

  const handleDeleteNote = (noteId) => {
    setUserState((prev) => ({
      ...prev,
      notes: prev.notes.filter((n) => n.id !== noteId)
    }));
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
          onDeleteBookmark={handleDeleteBookmark}
          onDeleteNote={handleDeleteNote}
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
            onAddNote={handleAddNote}
          />
        )}
      </div>

      <SearchModal
        isOpen={isSearchOpen}
        selectedVol={selectedVol}
        onClose={() => setIsSearchOpen(false)}
        onSelectResult={(vol_id, pdf_page, q) => {
          setSelectedVol(vol_id);
          setActivePdfPage(pdf_page);
          setSearchQuery(q);
        }}
      />

      <ToolsPanel isOpen={isToolsOpen} onClose={() => setIsToolsOpen(false)} />
    </div>
  );
}
