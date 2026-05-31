# Product Requirements

## Overview

A local knowledge base desktop application that lets users import documents and ask questions about their content.

## Core Features

### 1. Window Launch

- The app opens a `BrowserWindow` at 1200×800.
- Title: "Knowledge Base".
- Security: `contextIsolation: true`, `nodeIntegration: false`.
- All renderer ↔ main communication via the preload `contextBridge` API.

### 2. Document List Panel (Left Sidebar)

- Displayed in a left sidebar (~280px wide).
- Shows all imported documents as cards with:
  - Document title (filename without extension)
  - File size
  - Index status badge (Indexed / Not indexed)
- Shows empty state message "No documents imported yet." when no documents exist.
- "+ Import" button opens a file picker for `.txt` and `.md` files.

### 3. Q&A Panel (Right Area)

- Occupies the remaining width on the right.
- Displays conversation history (user questions + assistant answers).
- Input area at the bottom: multi-line textarea + "Ask" button.
- Enter submits the question; Shift+Enter adds a newline.
- Answers display relevant citations (document title + excerpt).
- Uses keyword matching to find relevant content across all indexed documents.

### 4. Data Directory

- `PersistenceService` creates `{userData}/knowledge-base-data/` on startup.
- Sub-directories: `documents/` (content files) and `index/` (reserved).
- Metadata stored in `documents.json` within the base directory.
- All I/O is asynchronous and happens only in the main process.

## Non-Goals (v1)

- No vector embeddings or semantic search (keyword matching only).
- No cloud sync.
- No multi-window support.
