import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import type { DocumentMeta } from '../shared/types';

/**
 * PersistenceService manages local data storage for the knowledge base.
 * All filesystem access happens through this service in the main process.
 */
export class PersistenceService {
  private readonly baseDir: string;
  private readonly documentsDir: string;
  private readonly indexDir: string;
  private readonly metaFile: string;

  constructor() {
    this.baseDir = path.join(app.getPath('userData'), 'knowledge-base-data');
    this.documentsDir = path.join(this.baseDir, 'documents');
    this.indexDir = path.join(this.baseDir, 'index');
    this.metaFile = path.join(this.baseDir, 'documents.json');
    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    fs.mkdirSync(this.baseDir, { recursive: true });
    fs.mkdirSync(this.documentsDir, { recursive: true });
    fs.mkdirSync(this.indexDir, { recursive: true });
  }

  getBaseDir(): string {
    return this.baseDir;
  }

  listDocuments(): DocumentMeta[] {
    if (!fs.existsSync(this.metaFile)) {
      return [];
    }
    try {
      const raw = fs.readFileSync(this.metaFile, 'utf-8');
      return JSON.parse(raw) as DocumentMeta[];
    } catch {
      return [];
    }
  }

  saveDocumentMeta(docs: DocumentMeta[]): void {
    fs.writeFileSync(this.metaFile, JSON.stringify(docs, null, 2), 'utf-8');
  }

  saveDocumentContent(id: string, content: string): void {
    const filePath = path.join(this.documentsDir, `${id}.txt`);
    fs.writeFileSync(filePath, content, 'utf-8');
  }

  readDocumentContent(id: string): string {
    const filePath = path.join(this.documentsDir, `${id}.txt`);
    if (!fs.existsSync(filePath)) {
      return '';
    }
    return fs.readFileSync(filePath, 'utf-8');
  }
}
