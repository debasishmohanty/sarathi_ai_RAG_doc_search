import { OpenAIEmbeddings } from "@langchain/openai";
import { distance } from "ml-distance";
import { Pinecone } from "@pinecone-database/pinecone";

interface Vector {
  id: string;
  values: number[];
  metadata?: Record<string, any>;
}

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

class PineconeVectorStore {
  private index: any;
  private namespace?: string;

  constructor(index: any, namespace?: string) {
    this.index = index;
    this.namespace = namespace;
  }

  async add(texts: string[], embeddings: number[][]): Promise<void> {
    const vectors: Vector[] = texts.map((t, i) => ({
      id: `${Date.now()}-${i}`,
      values: embeddings[i],
      metadata: { text: t },
    }));

    // Upsert in batches (simple single batch here)
    try {
      await this.index.upsert({ upsertRequest: { vectors, namespace: this.namespace } });
    } catch (err) {
      console.error("[Pinecone] upsert failed:", err);
      throw err;
    }
  }

  async search(queryEmbedding: number[], k = 3): Promise<string[]> {
    try {
      const result = await this.index.query({
        queryRequest: {
          vector: queryEmbedding,
          topK: k,
          includeMetadata: true,
          namespace: this.namespace,
        },
      });

      const matches = result.matches ?? [];
      return matches.map((m: any) => m.metadata?.text).filter(Boolean);
    } catch (err) {
      console.error("[Pinecone] query failed:", err);
      throw err;
    }
  }

  clear(): void {
    // No-op: removing vectors requires index-level operations; leave for manual cleanup
    return;
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
  private vectorStore: SimpleVectorStore | PineconeVectorStore;
  private chunks: string[] = [];
  private pineconeClient?: Pinecone;
  private usingPinecone: boolean = false;

  constructor() {
    this.embeddings = new OpenAIEmbeddings({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.vectorStore = new SimpleVectorStore();

    // Initialize Pinecone client if environment variables are provided
    const pineApiKey = process.env.PINECONE_API_KEY;
    const pineIndexName = process.env.PINECONE_INDEX_NAME;
    const pineNamespace = process.env.PINECONE_NAMESPACE;

    if (pineApiKey && pineIndexName) {
      try {
        this.pineconeClient = new Pinecone({ apiKey: pineApiKey });
        const idx = this.pineconeClient.Index(pineIndexName);
        this.vectorStore = new PineconeVectorStore(idx, pineNamespace);
        this.usingPinecone = true;
        console.log("[RAG] Pinecone vector store initialized");
      } catch (err) {
        console.warn("[RAG] Pinecone init failed, falling back to in-memory store:", err);
        this.vectorStore = new SimpleVectorStore();
        this.usingPinecone = false;
      }
    }
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

      // Store in vector store (Pinecone or in-memory)
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

      // If Pinecone returned fewer results, fall back to chunk list mapping
      if ((!results || results.length === 0) && this.chunks.length > 0 && !this.usingPinecone) {
        // No results and using in-memory -> return top first chunks
        return this.chunks.slice(0, topK);
      }

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
