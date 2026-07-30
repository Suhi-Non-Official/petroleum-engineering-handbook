# Search Engine Architecture

## Full-Text Search Engine (FTS5)

The platform utilizes SQLite FTS5 for lightning-fast full-text search across all 7 volumes (5,626 pages).

### Features

- **Exact Phrase Matching**: Quoted strings (e.g., `"Darcy law"`).
- **Volume Filter**: Target Volume 1 through Volume 7 individually or search all 7 simultaneously.
- **Snippet Highlighting**: Returns context snippets with terms wrapped in `<mark>` tags.
- **Relevance Ranking**: Ranks matches by FTS5 match density and structural position.
