// Shared types used across main, preload, and renderer layers.
// IPC channel names are defined once here to avoid string duplication.

export const IPC_CHANNELS = {
  DOCUMENTS_LIST: 'documents:list',
  DOCUMENTS_IMPORT: 'documents:import',
  QA_ASK: 'qa:ask',
} as const;

export type IpcChannel = typeof IPC_CHANNELS[keyof typeof IPC_CHANNELS];

export interface DocumentMeta {
  id: string;
  title: string;
  fileName: string;
  sizeBytes: number;
  importedAt: string;
  indexed: boolean;
}

export interface QaRequest {
  question: string;
}

export interface Citation {
  documentId: string;
  documentTitle: string;
  excerpt: string;
}

export interface QaResponse {
  answer: string;
  citations: Citation[];
}
