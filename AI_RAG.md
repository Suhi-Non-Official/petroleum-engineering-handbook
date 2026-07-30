# Grounded AI & RAG Specifications

## "Ask the Handbook" AI Assistant

The AI assistant operates on a strict **Grounded RAG Architecture** to eliminate hallucinations.

### Processing Workflow

```
[ User Question ] ──> [ FTS5 Vector/Keyword Retrieval ] ──> [ Relevant Handbook Chunks ] ──> [ Answer Synthesis + Citations ]
```

### Citation Standards

Every response attaches explicit citations:
`[Volume X — Chapter Y (Title) — Page P (PDF p. P')]`

If context is insufficient, the system responds:
*"I could not find sufficient information in the Petroleum Engineering Handbook for your query."*
