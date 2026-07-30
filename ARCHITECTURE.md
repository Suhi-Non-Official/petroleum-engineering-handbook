# System Architecture & Technical Specifications

## Architectural Overview

The Petroleum Engineering Handbook Platform is designed as a **Local-First, High-Performance Knowledge Reference System**.

```
[ PDF Source Files (Vol 1-7) ] ──> [ ingest.py Ingestion Pipeline ]
                                                │
                                                ▼
[ SQLite FTS5 Database ] <───> [ FastAPI Backend (Python) ] <───> [ React + Vite Web UI ]
```

### Components

1. **Ingestion Layer (`ingest.py`)**:
   - Uses PyMuPDF (`fitz`) for fast text extraction, line bounding boxes, image rendering, and TOC outline parsing.
   - Cleans watermark noise and normalizes unicode characters.
   - Indexes all 5,626 pages into SQLite FTS5 database (`search.db`).

2. **Backend API Layer (`backend/app/main.py`)**:
   - Built on FastAPI & Uvicorn.
   - Serves page metadata, full-text FTS5 queries, dynamic 150 DPI page preview image rendering, unit conversions, engineering calculations, and grounded RAG responses.

3. **Frontend Presentation Layer (`frontend/`)**:
   - Built with React 18, Vite, Lucide React Icons, and Vanilla CSS.
   - Implements a responsive 3-column layout (Desktop), 2-column (Tablet), and slide-out navigation (Mobile).
   - Features dark/light themes, canvas page zoom/fit, split-view mode, and keyboard shortcuts (`Ctrl+K`, `←`, `→`, `B`, `N`, `+`, `-`, `F`).
