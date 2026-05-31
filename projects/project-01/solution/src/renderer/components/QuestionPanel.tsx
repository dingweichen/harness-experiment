import React, { useState, useRef, useEffect } from 'react';
import type { QaResponse, Citation } from '../../shared/types';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  text: string;
  citations?: Citation[];
}

export function QuestionPanel(): React.ReactElement {
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleAsk = async () => {
    const q = question.trim();
    if (!q || loading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      text: q,
    };

    setMessages(prev => [...prev, userMessage]);
    setQuestion('');
    setLoading(true);

    try {
      const response: QaResponse = await window.knowledgeBase.qa.ask({ question: q });
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        text: response.answer,
        citations: response.citations,
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        type: 'assistant',
        text: 'An error occurred while processing your question. Please try again.',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleAsk();
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Q&amp;A</h2>
        <span style={styles.hint}>Ask questions about your documents</span>
      </div>

      <div style={styles.messages}>
        {messages.length === 0 ? (
          <div style={styles.placeholder}>
            <div style={styles.placeholderIcon}>💬</div>
            <div style={styles.placeholderText}>Ask a question to get started</div>
            <div style={styles.placeholderSub}>Your answers will appear here</div>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} style={{ ...styles.message, ...(msg.type === 'user' ? styles.userMessage : styles.assistantMessage) }}>
              <div style={styles.messageLabel}>{msg.type === 'user' ? 'You' : 'Knowledge Base'}</div>
              <div style={styles.messageText}>{msg.text}</div>
              {msg.citations && msg.citations.length > 0 && (
                <div style={styles.citations}>
                  <div style={styles.citationsLabel}>Sources:</div>
                  {msg.citations.map((c, i) => (
                    <div key={i} style={styles.citation}>
                      <span style={styles.citationTitle}>{c.documentTitle}</span>
                      {c.excerpt && <span style={styles.citationExcerpt}> — {c.excerpt.slice(0, 100)}{c.excerpt.length > 100 ? '...' : ''}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
        {loading && (
          <div style={{ ...styles.message, ...styles.assistantMessage }}>
            <div style={styles.messageLabel}>Knowledge Base</div>
            <div style={styles.loadingDots}>
              <span style={styles.dot} />
              <span style={styles.dot} />
              <span style={styles.dot} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={styles.inputArea}>
        <textarea
          style={styles.textarea}
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question... (Enter to send, Shift+Enter for newline)"
          rows={3}
          disabled={loading}
        />
        <button
          style={{ ...styles.askButton, opacity: loading || !question.trim() ? 0.5 : 1 }}
          onClick={() => void handleAsk()}
          disabled={loading || !question.trim()}
        >
          Ask
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: '#181825',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
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
  hint: {
    fontSize: '12px',
    color: '#6c7086',
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  placeholder: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
    textAlign: 'center',
  },
  placeholderIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  placeholderText: {
    fontSize: '16px',
    color: '#cdd6f4',
    fontWeight: 500,
    marginBottom: '8px',
  },
  placeholderSub: {
    fontSize: '13px',
    color: '#6c7086',
  },
  message: {
    padding: '12px 16px',
    borderRadius: '10px',
    maxWidth: '85%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#313244',
    borderBottomRightRadius: '2px',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#1e1e2e',
    border: '1px solid #313244',
    borderBottomLeftRadius: '2px',
  },
  messageLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#6c7086',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  messageText: {
    fontSize: '14px',
    color: '#cdd6f4',
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
  },
  citations: {
    marginTop: '10px',
    paddingTop: '10px',
    borderTop: '1px solid #313244',
  },
  citationsLabel: {
    fontSize: '11px',
    color: '#6c7086',
    fontWeight: 600,
    textTransform: 'uppercase',
    marginBottom: '4px',
  },
  citation: {
    fontSize: '12px',
    color: '#a6adc8',
    marginTop: '4px',
  },
  citationTitle: {
    color: '#89b4fa',
    fontWeight: 500,
  },
  citationExcerpt: {
    color: '#6c7086',
  },
  loadingDots: {
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
    padding: '4px 0',
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#6c7086',
    animation: 'pulse 1.2s ease-in-out infinite',
  },
  inputArea: {
    display: 'flex',
    gap: '10px',
    padding: '16px',
    borderTop: '1px solid #313244',
    backgroundColor: '#1e1e2e',
    alignItems: 'flex-end',
  },
  textarea: {
    flex: 1,
    padding: '10px 14px',
    backgroundColor: '#313244',
    border: '1px solid #45475a',
    borderRadius: '8px',
    color: '#cdd6f4',
    fontSize: '14px',
    lineHeight: 1.5,
    resize: 'none',
    outline: 'none',
    fontFamily: 'inherit',
  },
  askButton: {
    padding: '10px 20px',
    backgroundColor: '#89b4fa',
    color: '#1e1e2e',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'opacity 0.2s',
  },
};
