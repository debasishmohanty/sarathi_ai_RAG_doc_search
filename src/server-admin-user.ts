import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
import express, { Request, Response } from "express";
import cors from "cors";
import multer from "multer";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { parseDocument, cleanDocumentText } from "./document-parser";
import { chunkText } from "./web-loader";
import CategoryStore from "./category-store";

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

// Serve static files from Angular build in production
if (process.env.NODE_ENV === 'production') {
  const frontendBuildPath = path.join(__dirname, '..', 'frontend', 'dist', 'langchain-chat', 'browser');
  app.use(express.static(frontendBuildPath));
}

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

// Initialize LLM and category store
const llm = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  temperature: 0.7,
});

const categoryStore = new CategoryStore();

// QA Template
const qaTemplate = `You are a helpful assistant specialized in answering questions about {category} policies and documents.
Use ONLY the provided content to answer the user's question accurately and concisely.
If the answer is not in the provided content, say so clearly.

Content:
{context}

User Question: {question}

Answer: `;

const qaPrompt = PromptTemplate.fromTemplate(qaTemplate);

// ============================================================================
// ADMIN ENDPOINTS
// ============================================================================

/**
 * POST /api/admin/upload-document
 * Admin uploads a document with a category
 * Body: { category: "Policy", file: <multipart> }
 */
app.post(
  "/api/admin/upload-document",
  upload.single("file"),
  async (req: any, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const { category } = req.body;
      if (!category || typeof category !== "string") {
        return res.status(400).json({ error: "Category is required" });
      }

      console.log(
        `📄 Admin uploading: ${req.file.originalname} → Category: ${category}`
      );

      // Parse document
      const content = await parseDocument(
        req.file.path,
        req.file.mimetype
      );
      const cleanedContent = cleanDocumentText(content);
      const chunks = chunkText(cleanedContent);

      // Add to category store
      const docId = Math.random().toString(36).substring(7);
      const doc = await categoryStore.addDocument(
        docId,
        category,
        req.file.originalname,
        req.file.path,
        cleanedContent,
        chunks
      );

      res.json({
        success: true,
        message: `Document uploaded to category "${category}"`,
        docId,
        category,
        filename: req.file.originalname,
        contentSize: cleanedContent.length,
        chunksCount: chunks.length,
        ragMode: doc.useRAG,
      });
    } catch (error) {
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (e) {
          // ignore cleanup errors
        }
      }
      console.error("Admin upload error:", error);
      res.status(500).json({
        error: `Failed to upload document: ${
          error instanceof Error ? error.message : String(error)
        }`,
      });
    }
  }
);

/**
 * GET /api/admin/categories
 * Get all available categories
 */
app.get("/api/admin/categories", (req: Request, res: Response) => {
  const categories = categoryStore.getCategories();
  res.json({ categories });
});

/**
 * GET /api/admin/documents?category=Policy
 * Get documents for a category
 */
app.get("/api/admin/documents", (req: Request, res: Response) => {
  const { category } = req.query;

  if (!category || typeof category !== "string") {
    return res.status(400).json({ error: "Category query param required" });
  }

  const docs = categoryStore.getDocumentsByCategory(category);
  const formatted = docs.map((doc) => ({
    id: doc.id,
    filename: doc.filename,
    uploadedAt: doc.uploadedAt,
    contentSize: doc.content.length,
    chunksCount: doc.chunks.length,
    ragMode: doc.useRAG,
  }));

  res.json({ category, documents: formatted });
});

/**
 * DELETE /api/admin/documents/:docId
 * Delete a document
 */
app.delete("/api/admin/documents/:docId", (req: Request, res: Response) => {
  const { docId } = req.params;
  const deleted = categoryStore.deleteDocument(docId);

  if (!deleted) {
    return res.status(404).json({ error: "Document not found" });
  }

  res.json({ success: true, message: "Document deleted" });
});

// ============================================================================
// USER ENDPOINTS
// ============================================================================

/**
 * GET /api/user/categories
 * User fetches available categories to chat about
 */
app.get("/api/user/categories", (req: Request, res: Response) => {
  const categories = categoryStore.getCategories();
  res.json({ categories });
});

/**
 * POST /api/user/session
 * User creates a chat session for a category
 * Body: { userId: "user123", category: "Policy" }
 */
app.post("/api/user/session", (req: Request, res: Response) => {
  const { userId, category } = req.body;

  if (!userId || !category) {
    return res
      .status(400)
      .json({ error: "userId and category are required" });
  }

  const session = categoryStore.createSession(userId, category);

  if (session.documents.length === 0) {
    return res.status(400).json({
      error: `No documents found for category "${category}"`,
    });
  }

  res.json({
    sessionId: session.sessionId,
    category: session.category,
    documentCount: session.documents.length,
    message: `Session created for category "${category}" with ${session.documents.length} document(s)`,
  });
});

/**
 * POST /api/user/chat
 * User asks a question within a category session
 * Body: { sessionId: "abc123", question: "What is the policy?" }
 */
app.post("/api/user/chat", async (req: Request, res: Response) => {
  try {
    const { sessionId, question } = req.body;

    if (!sessionId || !question) {
      return res
        .status(400)
        .json({ error: "sessionId and question are required" });
    }

    const session = categoryStore.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    console.log(
      `💬 User question in ${session.category}: ${question.substring(0, 50)}...`
    );

    // Search for relevant chunks in the category
    const contextChunks = await categoryStore.searchCategory(
      session.category,
      question,
      3
    );

    if (contextChunks.length === 0) {
      return res.json({
        answer: `No relevant information found in ${session.category} documents to answer your question.`,
        ragMode: false,
        category: session.category,
      });
    }

    const context = contextChunks.join("\n\n---\n\n");

    // Format and call LLM
    const formattedPrompt = await qaPrompt.format({
      category: session.category,
      context,
      question,
    });

    const answer = await llm.invoke(formattedPrompt);

    res.json({
      question,
      answer: typeof answer === "string" ? answer : answer.content,
      category: session.category,
      ragMode: true,
      sourcesUsed: contextChunks.length,
    });
  } catch (error) {
    console.error("User chat error:", error);
    res.status(500).json({
      error: `Failed to process question: ${
        error instanceof Error ? error.message : String(error)
      }`,
    });
  }
});

/**
 * Health check
 */
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok", mode: "admin-user" });
});

// Serve Angular app for all other routes in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req: Request, res: Response) => {
    const frontendBuildPath = path.join(__dirname, '..', 'frontend', 'dist', 'langchain-chat', 'browser', 'index.html');
    res.sendFile(frontendBuildPath);
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`\n✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ CORS enabled`);
  console.log(`✓ Admin API at http://localhost:${PORT}/api/admin`);
  console.log(`✓ User API at http://localhost:${PORT}/api/user\n`);
});

export default app;
