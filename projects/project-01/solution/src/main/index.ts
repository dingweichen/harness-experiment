import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { PersistenceService } from '../services/PersistenceService';
import { IPC_CHANNELS, QaResponse } from '../shared/types';
import type { DocumentMeta, QaRequest } from '../shared/types';

let mainWindow: BrowserWindow | null = null;
let persistenceService: PersistenceService | null = null;

function createWindow(): void {
  persistenceService = new PersistenceService();

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'Knowledge Base',
    webPreferences: {
      preload: path.join(__dirname, '..', '..', '..', 'dist', 'preload', 'preload', 'index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, '..', '..', '..', 'dist', 'renderer', 'index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function registerIpcHandlers(): void {
  // List all documents
  ipcMain.handle(IPC_CHANNELS.DOCUMENTS_LIST, async (): Promise<DocumentMeta[]> => {
    if (!persistenceService) return [];
    return persistenceService.listDocuments();
  });

  // Import a document (content passed as string for simplicity)
  ipcMain.handle(
    IPC_CHANNELS.DOCUMENTS_IMPORT,
    async (_event, fileName: string, content: string): Promise<DocumentMeta> => {
      if (!persistenceService) throw new Error('Service not initialized');

      const id = Date.now().toString();
      const title = fileName.replace(/\.[^/.]+$/, '');
      const sizeBytes = Buffer.byteLength(content, 'utf-8');

      const meta: DocumentMeta = {
        id,
        title,
        fileName,
        sizeBytes,
        importedAt: new Date().toISOString(),
        indexed: true,
      };

      persistenceService.saveDocumentContent(id, content);
      const docs = persistenceService.listDocuments();
      docs.push(meta);
      persistenceService.saveDocumentMeta(docs);

      return meta;
    }
  );

  // Simple keyword-based Q&A
  ipcMain.handle(
    IPC_CHANNELS.QA_ASK,
    async (_event, request: QaRequest): Promise<QaResponse> => {
      if (!persistenceService) {
        return { answer: 'Service not initialized.', citations: [] };
      }

      const docs = persistenceService.listDocuments();
      if (docs.length === 0) {
        return {
          answer: 'No documents have been imported yet. Please import some documents first.',
          citations: [],
        };
      }

      const question = request.question.toLowerCase();
      const results: Array<{ doc: DocumentMeta; excerpt: string; score: number }> = [];

      for (const doc of docs) {
        const content = persistenceService.readDocumentContent(doc.id);
        const lines = content.split('\n');
        let bestScore = 0;
        let bestExcerpt = '';

        for (const line of lines) {
          const lower = line.toLowerCase();
          const words = question.split(/\s+/).filter(w => w.length > 2);
          const matches = words.filter(w => lower.includes(w)).length;
          if (matches > bestScore) {
            bestScore = matches;
            bestExcerpt = line.trim().slice(0, 200);
          }
        }

        if (bestScore > 0) {
          results.push({ doc, excerpt: bestExcerpt, score: bestScore });
        }
      }

      results.sort((a, b) => b.score - a.score);
      const top = results.slice(0, 3);

      if (top.length === 0) {
        return {
          answer: `No relevant content found for: "${request.question}". Try different keywords.`,
          citations: [],
        };
      }

      const answer =
        `Based on the knowledge base, here are the most relevant excerpts for "${request.question}":\n\n` +
        top.map((r, i) => `${i + 1}. From "${r.doc.title}": ${r.excerpt}`).join('\n\n');

      return {
        answer,
        citations: top.map(r => ({
          documentId: r.doc.id,
          documentTitle: r.doc.title,
          excerpt: r.excerpt,
        })),
      };
    }
  );
}

app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
