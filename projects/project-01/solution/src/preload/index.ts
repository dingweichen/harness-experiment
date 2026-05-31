import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../shared/types';
import type { DocumentMeta, QaRequest, QaResponse } from '../shared/types';

/**
 * Preload script: the ONLY bridge between main and renderer.
 * Exposes typed API as window.knowledgeBase via contextBridge.
 */
contextBridge.exposeInMainWorld('knowledgeBase', {
  documents: {
    list: (): Promise<DocumentMeta[]> =>
      ipcRenderer.invoke(IPC_CHANNELS.DOCUMENTS_LIST),

    import: (fileName: string, content: string): Promise<DocumentMeta> =>
      ipcRenderer.invoke(IPC_CHANNELS.DOCUMENTS_IMPORT, fileName, content),
  },
  qa: {
    ask: (request: QaRequest): Promise<QaResponse> =>
      ipcRenderer.invoke(IPC_CHANNELS.QA_ASK, request),
  },
});
