import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
import express, { Request, Response } from "express";
import cors from "cors";
import multer from "multer";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { loadWebContent, chunkText } from "./web-loader";
import { parseDocument, cleanDocumentText } from "./document-parser";
import RAGModule from "./rag-module";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "..", ".env") });

// Validate API key
if (!process.env.OPENAI_API_KEY) {
  console.error("ERROR: OPENAI_API_KEY environment variable is NOT set");
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// File upload configuration
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req: any, _file: any, cb: any) => {
    cb(null, uploadDir);
  },
  filename: (_req: any, file: any, cb: any) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// Initialize LLM
const llm = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  temperature: 0.7,
});

// QA Template
const qaTemplate = `You are a helpful assistant that answers questions about the following content.
Use the provided content to answer the user's question accurately and concisely.

Content:
{context}

User Question: {question}

Answer: `;

// Summarization Template
const summaryTemplate = `Please provide a clear and concise summary of the following content.
Highlight the main points and key information.

Content:
{content}

Summary: `;

const qaPrompt = PromptTemplate.fromTemplate(qaTemplate);
const summaryPrompt = PromptTemplate.fromTemplate(summaryTemplate);

// In-memory storage for website and document content
interface WebsiteSession {
  url: string;
  content: string;
  chunks: string[];
  type: "website" | "document";
  useRAG: boolean;
  ragModule?: RAGModule;
}

interface DocumentSession extends WebsiteSession {
  filename: string;
  filePath: string;
  type: "document";
}

const sessions: Map<string, WebsiteSession | DocumentSession> = new Map();

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  return Math.random().toString(36).substring(7);
}

/**
 * POST /api/load-website
 * Load a website and start a new session
 */
app.post("/api/load-website", async (req: Request, res: Response) => {
  try {
    const { url } = req.body;

    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "URL is required" });
    }

    console.log(`📡 Loading website: ${url}`);
    const content = await loadWebContent(url);
    const chunks = chunkText(content);
    
    // Determine if RAG should be used (threshold: 50KB)
    const useRAG = content.length > 50000;

    const sessionId = generateSessionId();
    const session: WebsiteSession = {
      url,
      content,
      chunks,
      type: "website",
      useRAG,
    };

    // Initialize RAG if content is large
    if (useRAG) {
      try {
        const ragModule = new RAGModule();
        await ragModule.initializeFromChunks(chunks);
        session.ragModule = ragModule;
        console.log(`🔍 RAG enabled for this session (content size: ${content.length} bytes)`);
      } catch (error) {
        console.warn(`⚠️ RAG initialization failed, falling back to simple context:`, error);
        session.useRAG = false;
      }
    } else {
      console.log(`✓ Using simple context mode (content size: ${content.length} bytes)`);
    }

    sessions.set(sessionId, session);

    res.json({
      sessionId,
      message: `Website loaded successfully!`,
      contentSize: content.length,
      chunksCount: chunks.length,
      ragMode: useRAG,
      hostname: new URL(url).hostname,
    });
  } catch (error) {
    console.error("Error loading website:", error);
    res.status(500).json({
      error: `Failed to load website: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
});

/**
 * POST /api/upload-document
 * Upload and process a document
 */
app.post("/api/upload-document", upload.single("file"), async (req: any, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    console.log(`📄 Processing document: ${req.file.originalname}`);

    const content = await parseDocument(req.file.path, req.file.mimetype);
    const cleanedContent = cleanDocumentText(content);
    const chunks = chunkText(cleanedContent);
    
    // Determine if RAG should be used (threshold: 50KB)
    const useRAG = cleanedContent.length > 50000;

    const sessionId = generateSessionId();
    const session: DocumentSession = {
      filename: req.file.originalname,
      filePath: req.file.path,
      url: req.file.originalname,
      content: cleanedContent,
      chunks,
      type: "document",
      useRAG,
    };

    // Initialize RAG if document is large
    if (useRAG) {
      try {
        const ragModule = new RAGModule();
        await ragModule.initializeFromChunks(chunks);
        session.ragModule = ragModule;
        console.log(`🔍 RAG enabled for this document (content size: ${cleanedContent.length} bytes)`);
      } catch (error) {
        console.warn(`⚠️ RAG initialization failed, falling back to simple context:`, error);
        session.useRAG = false;
      }
    } else {
      console.log(`✓ Using simple context mode (content size: ${cleanedContent.length} bytes)`);
    }

    sessions.set(sessionId, session);

    res.json({
      sessionId,
      message: `Document uploaded and processed successfully!`,
      filename: req.file.originalname,
      contentSize: cleanedContent.length,
      chunksCount: chunks.length,
      ragMode: useRAG,
    });
  } catch (error) {
    // Clean up uploaded file if error
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        // Ignore cleanup errors
      }
    }

    console.error("Error processing document:", error);
    res.status(500).json({
      error: `Failed to process document: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
});

/**
 * POST /api/summarize
 * Generate a summary of the loaded content
 */
app.post("/api/summarize", async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required" });
    }

    const session = sessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    console.log(`📝 Generating summary for session: ${sessionId}`);

    // Use first 5 chunks for better summary
    const contextChunks = session.chunks.slice(0, 5).join("\n\n");

    const formattedPrompt = await summaryPrompt.format({
      content: contextChunks,
    });

    const summary = await llm.invoke(formattedPrompt);

    res.json({
      summary: typeof summary === "string" ? summary : summary.content,
      sessionId,
    });
  } catch (error) {
    console.error("Error generating summary:", error);
    res.status(500).json({
      error: `Failed to generate summary: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
});

/**
 * POST /api/chat
 * Send a question and get an answer
 */
app.post("/api/chat", async (req: Request, res: Response) => {
  try {
    const { sessionId, question } = req.body;

    if (!sessionId || !question) {
      return res.status(400).json({ error: "sessionId and question are required" });
    }

    const session = sessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found. Load a website first." });
    }

    console.log(`🤔 Processing question: ${question}`);

    let contextChunks: string;
    let ragUsed = false;

    // Use RAG for semantic search if available and enabled
    if (session.useRAG && session.ragModule) {
      try {
        const relevantChunks = await session.ragModule.semanticSearch(question, 3);
        contextChunks = relevantChunks.join("\n\n");
        ragUsed = true;
        console.log(`✓ Using RAG semantic search (${relevantChunks.length} chunks)`);
      } catch (error) {
        console.warn(`⚠️ RAG search failed, falling back to simple context:`, error);
        contextChunks = session.chunks.slice(0, 3).join("\n\n");
        ragUsed = false;
      }
    } else {
      // Use simple context mode (first 3 chunks)
      contextChunks = session.chunks.slice(0, 3).join("\n\n");
      console.log(`✓ Using simple context mode (${Math.min(3, session.chunks.length)} chunks)`);
    }

    // Format and call LLM
    const formattedPrompt = await qaPrompt.format({
      context: contextChunks,
      question,
    });

    const answer = await llm.invoke(formattedPrompt);

    res.json({
      question,
      answer: typeof answer === 'string' ? answer : answer.content,
      website: session.url,
      ragMode: ragUsed,
    });
  } catch (error) {
    console.error("Error processing question:", error);
    res.status(500).json({
      error: `Failed to process question: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
});

/**
 * Health check (must be before /:sessionId route)
 */
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok" });
});

/**
 * GET /api/session/:sessionId
 * Get session info
 */
app.get("/api/session/:sessionId", (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  res.json({
    url: session.url,
    hostname: new URL(session.url).hostname,
    contentSize: session.content.length,
    chunksCount: session.chunks.length,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ CORS enabled for Angular frontend`);
  console.log(`✓ API ready at http://localhost:${PORT}/api\n`);
});
