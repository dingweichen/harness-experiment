# Architecture

## Overview

This is a local-first knowledge base application built with Electron. It follows a strict four-layer architecture to enforce security and separation of concerns.

## Layer Structure

```
src/
├── main/          # Main process — BrowserWindow lifecycle + IPC registration
├── preload/       # Preload script — contextBridge bridge
├── renderer/      # React UI — communicates via window.knowledgeBase
├── services/      # Business logic — filesystem, data management
└── shared/        # Shared types used across all layers
```

## Layers

### Main Process (`src/main/`)

- Creates the `BrowserWindow` at 1200×800 with `contextIsolation: true` and `nodeIntegration: false`.
- Registers IPC handlers for all channels defined in `IPC_CHANNELS`.
- Instantiates `PersistenceService` and passes it to handlers.
- Never imports renderer code.

### Preload (`src/preload/`)

- The **only** bridge between main and renderer.
- Uses `contextBridge.exposeInMainWorld('knowledgeBase', ...)` to expose a typed API object.
- Never imports React or renderer modules.
- Typed surface: `window.knowledgeBase.documents.{list, import}` and `window.knowledgeBase.qa.ask`.

### Renderer (`src/renderer/`)

- React 18 application, bundled with esbuild to `dist/renderer/bundle.js`.
- Communicates with main **exclusively** through `window.knowledgeBase`.
- Never imports Node.js modules (`fs`, `path`, `electron`).
- Types declared in `src/renderer/types.d.ts`.

### Services (`src/services/`)

- Pure TypeScript running in the main process.
- `PersistenceService` — manages `userData/knowledge-base-data/` directory tree.
- Receives dependencies via constructor injection.
- May import from `src/shared/` but never from `src/renderer/`.

## IPC Channels

All channel names live in `src/shared/types.ts` under `IPC_CHANNELS`:

| Channel | Direction | Description |
|---|---|---|
| `documents:list` | renderer → main | Fetch all document metadata |
| `documents:import` | renderer → main | Import a new document |
| `qa:ask` | renderer → main | Submit a question |

## Data Directory

`PersistenceService` creates and manages:

```
{userData}/knowledge-base-data/
├── documents.json      # Document metadata index
├── documents/          # Raw document content files
└── index/              # Reserved for future vector index
```
