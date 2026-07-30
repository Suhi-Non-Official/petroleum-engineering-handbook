# Petroleum Engineering Handbook Platform — 7-Volume Digital Reference System

A modern, full-stack, AI-assisted interactive digital reference platform built for the complete **seven-volume Petroleum Engineering Handbook collection**.

---

## 🌟 Key Features

1. **Full 7-Volume Coverage**: Unified access to Volume 1 through Volume 7 (5,626 pages, 2.08M+ words).
2. **Instant Search Engine**: SQLite FTS5 multi-volume search with exact matching, snippet previews, term highlighting, and volume/chapter filters.
3. **High-Performance Canvas Reader**: Zoom, Fit-Width/Page, Single Page, Continuous Scroll, Two-Page Spread, and High-Resolution PDF Image modes.
4. **Hierarchical 7-Volume Table of Contents**: Complete chapter and section tree with direct jump navigation.
5. **Petroleum Unit Converter**: 13 unit categories (`psi`, `bar`, `md`, `cp`, `bbl/d`, `°API`, `lbm/gal`, etc.).
6. **Engineering Calculators**:
   - Darcy Radial Liquid Flow Rate
   - Hydrostatic Pressure & Gradient
   - Productivity Index
   - API Gravity to Density Conversion
7. **"Ask the Handbook" AI Assistant**: Grounded RAG assistant that answers questions using ONLY handbook content with explicit volume, chapter, section, and page citations.
8. **Personalization**: User Bookmarks, Notes, Reading History, and Favorites.

---

## 🏗️ Project Architecture

```text
petroleum-handbook/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI REST Server
│   │   └── calculators.py   # Unit conversion & petroleum formulas
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/      # Reader, Sidebar, Navbar, SearchModal, ToolsPanel, AIAssistant
│   │   ├── App.jsx
│   │   └── index.css        # Petroleum dark/light styling system
│   └── package.json
├── data/
│   ├── global/
│   │   ├── collection.json  # 7-volume TOC & metadata
│   │   ├── search.db        # SQLite FTS5 database
│   │   └── cross_refs.json  # Cross-references index
│   ├── volumes/             # Vol 1 to Vol 7 metadata & page json
│   └── previews/            # High-res pre-rendered page previews
├── ingest.py                # Automated PDF ingestion pipeline
├── ARCHITECTURE.md
├── DOCUMENT_PROCESSING.md
├── SEARCH.md
├── AI_RAG.md
└── CALCULATORS.md
```

---

## 🚀 Quick Start Guide

### 1. Ingest all 7 PDF Volumes
```bash
python ingest.py
```

### 2. Start the Backend API Server
```bash
python backend/app/main.py
```
*Backend runs on http://127.0.0.1:8000*

### 3. Start the Frontend Web Application
```bash
cd frontend
npm run dev
```
*Frontend runs on http://localhost:3000*

---

## 🛠️ Adding New Calculators & Extending
To add new engineering calculators, edit `backend/app/calculators.py` and register the calculator type in `backend/app/main.py` and `frontend/src/components/ToolsPanel.jsx`.
