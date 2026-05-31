import React, { useState, useEffect, useCallback } from 'react';
import type { DocumentMeta } from '../../shared/types';

interface DocumentListProps {
  onDocumentSelect?: (doc: DocumentMeta) => void;
  selectedId?: string;
  onDocumentsChange?: (docs: DocumentMeta[]) => void;
}

export function DocumentList({ onDocumentSelect, selectedId, onDocumentsChange }: DocumentListProps): React.ReactElement {
  const [documents, setDocuments] = useState<DocumentMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const docs = await window.knowledgeBase.documents.list();
      setDocuments(docs);
      onDocumentsChange?.(docs);
    } finally {
      setLoading(false);
    }
  }, [onDocumentsChange]);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.md';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setImporting(true);
      try {
        const content = await file.text();
        await window.knowledgeBase.documents.import(file.name, content);
        await loadDocuments();
      } finally {
        setImporting(false);
      }
    };
    input.click();
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Documents</h2>
        <button
          style={{ ...styles.importButton, opacity: importing ? 0.6 : 1 }}
          onClick={handleImport}
          disabled={importing}
        >
          {importing ? 'Importing...' : '+ Import'}
        </button>
      </div>
      <div style={styles.list}>
        {loading ? (
          <div style={styles.empty}>Loading...</div>
        ) : documents.length === 0 ? (
          <div style={styles.empty}>No documents imported yet.</div>
        ) : (
          documents.map(doc => (
            <div
              key={doc.id}
              style={{
                ...styles.card,
                ...(selectedId === doc.id ? styles.cardSelected : {}),
              }}
              onClick={() => onDocumentSelect?.(doc)}
            >
              <div style={styles.cardTitle}>{doc.title}</div>
              <div style={styles.cardMeta}>
                <span style={styles.metaBadge}>{formatSize(doc.sizeBytes)}</span>
                <span style={{ ...styles.metaBadge, ...(doc.indexed ? styles.indexedBadge : styles.notIndexedBadge) }}>
                  {doc.indexed ? 'Indexed' : 'Not indexed'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: '#1e1e2e',
    borderRight: '1px solid #313244',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px',
    borderBottom: '1px solid #313244',
  },
  title: {
    margin: 0,
    fontSize: '14px',
    fontWeight: 600,
    color: '#cdd6f4',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  },
  importButton: {
    padding: '6px 12px',
    backgroundColor: '#89b4fa',
    color: '#1e1e2e',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  list: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px',
  },
  empty: {
    padding: '24px 16px',
    color: '#6c7086',
    fontSize: '13px',
    textAlign: 'center',
    lineHeight: 1.5,
  },
  card: {
    padding: '12px',
    marginBottom: '6px',
    backgroundColor: '#181825',
    borderRadius: '8px',
    cursor: 'pointer',
    border: '1px solid transparent',
    transition: 'border-color 0.15s, background-color 0.15s',
  },
  cardSelected: {
    backgroundColor: '#313244',
    borderColor: '#89b4fa',
  },
  cardTitle: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#cdd6f4',
    marginBottom: '6px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  cardMeta: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
  metaBadge: {
    fontSize: '11px',
    padding: '2px 6px',
    borderRadius: '4px',
    backgroundColor: '#313244',
    color: '#a6adc8',
  },
  indexedBadge: {
    backgroundColor: '#1e4a3a',
    color: '#a6e3a1',
  },
  notIndexedBadge: {
    backgroundColor: '#4a1e1e',
    color: '#f38ba8',
  },
};
