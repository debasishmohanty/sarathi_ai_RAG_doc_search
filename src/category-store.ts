/**
 * Category-aware document storage and management
 * Admin: upload documents with categories → store embeddings
 * User: select category → chat with docs from that category
 */

import { RAGModule } from "./rag-module";

export interface CategoryDocument {
  id: string;
  category: string;
  filename: string;
  filePath: string;
  content: string;
  chunks: string[];
  uploadedAt: Date;
  ragModule?: RAGModule;
  useRAG: boolean;
}

export interface CategorySession {
  sessionId: string;
  userId: string;
  category: string;
  documents: CategoryDocument[];
  createdAt: Date;
}

export class CategoryStore {
  private documents: Map<string, CategoryDocument> = new Map();
  private categories: Set<string> = new Set();
  private sessions: Map<string, CategorySession> = new Map();

  /**
   * Register a new document with category
   */
  async addDocument(
    id: string,
    category: string,
    filename: string,
    filePath: string,
    content: string,
    chunks: string[]
  ): Promise<CategoryDocument> {
    const useRAG = content.length > 50000;
    let ragModule: RAGModule | undefined;

    if (useRAG) {
      try {
        ragModule = new RAGModule();
        await ragModule.initializeFromChunks(chunks);
        console.log(`[CategoryStore] RAG initialized for ${category}/${filename}`);
      } catch (error) {
        console.warn(
          `[CategoryStore] RAG init failed for ${category}/${filename}:`,
          error
        );
      }
    }

    const doc: CategoryDocument = {
      id,
      category,
      filename,
      filePath,
      content,
      chunks,
      uploadedAt: new Date(),
      ragModule,
      useRAG,
    };

    this.documents.set(id, doc);
    this.categories.add(category);

    return doc;
  }

  /**
   * Get all categories
   */
  getCategories(): string[] {
    return Array.from(this.categories).sort();
  }

  /**
   * Get documents for a category
   */
  getDocumentsByCategory(category: string): CategoryDocument[] {
    return Array.from(this.documents.values()).filter(
      (doc) => doc.category === category
    );
  }

  /**
   * Search across documents in a category
   */
  async searchCategory(
    category: string,
    query: string,
    topK: number = 3
  ): Promise<string[]> {
    const docs = this.getDocumentsByCategory(category);
    if (docs.length === 0) {
      return [];
    }

    const results: { text: string; docName: string }[] = [];

    for (const doc of docs) {
      try {
        let chunks: string[];

        if (doc.useRAG && doc.ragModule) {
          // Use semantic search
          chunks = await doc.ragModule.semanticSearch(query, 2);
        } else {
          // Use simple context (first 2 chunks)
          chunks = doc.chunks.slice(0, 2);
        }

        chunks.forEach((chunk) => {
          results.push({
            text: chunk,
            docName: doc.filename,
          });
        });
      } catch (error) {
        console.warn(
          `[CategoryStore] Search failed for ${doc.filename}:`,
          error
        );
      }
    }

    // Return top-k, limited to topK results total
    return results
      .slice(0, topK)
      .map((r) => `[${r.docName}]\n${r.text}`);
  }

  /**
   * Create a user session for a category
   */
  createSession(userId: string, category: string): CategorySession {
    const sessionId = Math.random().toString(36).substring(7);
    const documents = this.getDocumentsByCategory(category);

    const session: CategorySession = {
      sessionId,
      userId,
      category,
      documents,
      createdAt: new Date(),
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): CategorySession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Delete document
   */
  deleteDocument(id: string): boolean {
    const doc = this.documents.get(id);
    if (doc) {
      doc.ragModule?.reset();
      this.documents.delete(id);
      return true;
    }
    return false;
  }

  /**
   * Clear all (for reset)
   */
  clear(): void {
    this.documents.forEach((doc) => doc.ragModule?.reset());
    this.documents.clear();
    this.categories.clear();
    this.sessions.clear();
  }
}

export default CategoryStore;
