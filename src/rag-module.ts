import { OpenAIEmbeddings } from "@langchain/openai";
import { distance } from "ml-distance";

/**
 * RAG Module: Handles semantic search using embeddings and cosine similarity
 * Provides FAISS-like vector store functionality without external dependencies
 */

interface StoredEmbedding {
  text: string;
  embedding: number[];
}

class SimpleVectorStore {
  private embeddings: StoredEmbedding[] = [];

  async add(texts: string[], embeddings: number[][]): Promise<void> {
    for (let i = 0; i < texts.length; i++) {
      this.embeddings.push({
        text: texts[i],
        embedding: embeddings[i],
      });
    }
  }

  /**
   * Semantic search: Find top-k most similar text chunks using cosine similarity
   */
  async search(
    queryEmbedding: number[],
    k: number = 3
  ): Promise<string[]> {
    if (this.embeddings.length === 0) {
      return [];
    }

    // Calculate cosine similarity with all stored embeddings
    const similarities = this.embeddings.map((stored) => ({
      text: stored.text,
      similarity: cosineSimilarity(queryEmbedding, stored.embedding),
    }));

    // Sort by similarity (highest first) and return top-k texts
    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, k)
      .map((item) => item.text);
  }

  clear(): void {
    this.embeddings = [];
  }
}

/**
 * Calculate cosine similarity between two vectors
 * Returns value between -1 and 1, where 1 is identical
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Vectors must have the same length");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

export class RAGModule {
  private embeddings: OpenAIEmbeddings;
  private vectorStore: SimpleVectorStore;
  private chunks: string[] = [];

  constructor() {
    this.embeddings = new OpenAIEmbeddings({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.vectorStore = new SimpleVectorStore();
  }

  /**
   * Generate embeddings for all chunks and build vector store
   */
  async initializeFromChunks(chunks: string[]): Promise<void> {
    if (chunks.length === 0) {
      throw new Error("Cannot initialize RAG with empty chunks");
    }

    this.chunks = chunks;

    try {
      // Generate embeddings for all chunks
      const embeddings = await this.embeddings.embedDocuments(chunks);

      // Store in vector store
      await this.vectorStore.add(chunks, embeddings);

      console.log(
        `[RAG] Initialized with ${chunks.length} chunks and generated embeddings`
      );
    } catch (error) {
      console.error("[RAG] Failed to generate embeddings:", error);
      throw error;
    }
  }

  /**
   * Semantic search: Find most relevant chunks for a query
   */
  async semanticSearch(query: string, topK: number = 3): Promise<string[]> {
    try {
      // Generate embedding for the query
      const queryEmbedding = await this.embeddings.embedQuery(query);

      // Find similar chunks
      const results = await this.vectorStore.search(queryEmbedding, topK);

      return results;
    } catch (error) {
      console.error("[RAG] Semantic search failed:", error);
      throw error;
    }
  }

  /**
   * Get all chunks (fallback to simple context mode)
   */
  getChunks(): string[] {
    return this.chunks;
  }

  /**
   * Clear the vector store (for session cleanup)
   */
  reset(): void {
    this.vectorStore.clear();
    this.chunks = [];
  }
}

export default RAGModule;
