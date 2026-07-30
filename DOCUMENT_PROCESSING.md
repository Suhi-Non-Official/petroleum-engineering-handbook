# Document Processing & Ingestion Pipeline Specifications

## Processing Overview

The ingestion pipeline converts 7 raw PDF files into structured JSON metadata, SQLite FTS5 search tables, and pre-rendered page previews.

### Pipeline Steps

1. **PDF Discovery**: Scans `Vol 1.pdf` through `Vol 7.pdf`.
2. **TOC & Bookmark Extraction**: Parses PDF outlines using `doc.get_toc()`.
3. **Text & Watermark Cleaning**: Strips copyright headers/footers (`ADVERTENCIA...`, emails).
4. **Page Offset Mapping**: Maps PDF 1-indexed page numbers to printed handbook page numbers.
5. **Cross-Reference Detection**: Identifies `Section X.Y`, `Figure A-B`, `Eq. C-D`, `Table M-N` patterns via regular expressions.
6. **SQLite FTS5 Indexing**: Inserts all 2,083,257 extracted words into `pages_fts` with porter stemming and unicode tokenization.
7. **Pre-Rendering Key Pages**: Generates web thumbnails for chapter start pages.
