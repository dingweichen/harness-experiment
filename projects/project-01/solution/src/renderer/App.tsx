import React, { useState, useCallback } from 'react';
import { DocumentList } from './components/DocumentList';
import { QuestionPanel } from './components/QuestionPanel';
import type { DocumentMeta } from '../shared/types';

export function App(): React.ReactElement {
  const [selectedDoc, setSelectedDoc] = useState<DocumentMeta | undefined>(undefined);

  const handleDocumentsChange = useCallback((_docs: DocumentMeta[]) => {
    // Could be used for global state if needed
  }, []);

  return (
    <div style={styles.root}>
      <div style={styles.sidebar}>
        <DocumentList
          onDocumentSelect={setSelectedDoc}
          selectedId={selectedDoc?.id}
          onDocumentsChange={handleDocumentsChange}
        />
      </div>
      <div style={styles.main}>
        <QuestionPanel />
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    display: 'flex',
    height: '100vh',
    overflow: 'hidden',
    backgroundColor: '#11111b',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  sidebar: {
    width: '280px',
    minWidth: '200px',
    maxWidth: '400px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
};
