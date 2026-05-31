import type { DocumentMeta, QaRequest, QaResponse } from '../shared/types';

/**
 * Type declarations for window.knowledgeBase exposed by the preload script.
 * Renderer code uses these types to communicate with the main process.
 */
declare global {
  interface Window {
    knowledgeBase: {
      documents: {
        list: () => Promise<DocumentMeta[]>;
        import: (fileName: string, content: string) => Promise<DocumentMeta>;
      };
      qa: {
        ask: (request: QaRequest) => Promise<QaResponse>;
      };
    };
  }
}
