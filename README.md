# LangChain Projects - Document Q&A Systems

This repository contains multiple document Q&A applications using LangChain and OpenAI.

## 🎯 Quick Navigation

### 🆕 **NEW: Document Q&A with Dual Admin/User Views**
A complete system with separate admin dashboard for document management and user interface for Q&A.

- **Start Here**: [START_HERE.md](START_HERE.md)
- **Quick Start**: [QUICK_START.md](QUICK_START.md)
- **Full Reference**: [FINAL_VERIFICATION.md](FINAL_VERIFICATION.md)
- **API Documentation**: [API_REFERENCE.md](API_REFERENCE.md)

**Start in 30 seconds:**
```bash
npm run dev:admin-user
# Then open http://localhost:4200
```

---

### 🔧 Original Systems
- **Website Q&A Chat**: `npm start` - Interactive CLI for website content
- **Tool Agent**: `npm run agent` - LangChain agent with tool calling
- **Document Upload Chat**: `npm run server` - Web UI for document Q&A

---

## 📚 Complete Project Index

See [INDEX.md](INDEX.md) for comprehensive navigation guide.

---

## 🏗️ LangChain Website Q&A Chat Application (Original)

A full-stack application with an Express backend and Angular frontend that uses LangChain and OpenAI to answer questions about website content.

## 📋 Project Structure

```
langchain/
├── src/
│   ├── server.ts              # Express backend API
│   ├── chat.ts                # Original CLI chat interface
│   ├── agent.ts               # Tool-based agent example
│   ├── web-loader.ts          # Web scraping utilities
│   └── setup-env.ts           # Environment setup
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── app.component.ts      # Main component
│   │   │   ├── app.component.html    # Template
│   │   │   ├── app.component.css     # Styling
│   │   │   └── services/
│   │   │       └── chat-api.service.ts  # API client
│   │   ├── main.ts            # Bootstrap
│   │   └── index.html         # HTML entry point
│   ├── angular.json           # Angular config
│   ├── package.json           # Frontend dependencies
│   └── tsconfig.json          # TypeScript config
├── package.json               # Backend dependencies
└── .env                       # Environment variables
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- OpenAI API key

### Installation

1. **Set up environment variables:**

The app will automatically load your API key from `D:\Projects\OpenAI_API_Key.txt`:

```bash
npm run setup
```

This creates a `.env` file in the root directory.

2. **Install backend dependencies:**

```bash
npm install
```

3. **Install frontend dependencies:**

```bash
cd frontend
npm install
cd ..
```

### Running the Application

#### Option 1: Run Backend and Frontend Together (Recommended)

```bash
npm run dev
```

This runs both the Express server (port 5000) and Angular dev server (port 4200) concurrently.

#### Option 2: Run Separately

**Terminal 1 - Backend Server:**
```bash
npm run server
```

**Terminal 2 - Frontend:**
```bash
npm run frontend
```

#### Legacy CLI Interface

```bash
npm start
```

Then use commands:
```
> load https://en.wikipedia.org/wiki/Artificial_intelligence
> What is AI?
> exit
```

### Available Scripts

| Script | Purpose |
|--------|---------|
| `npm run server` | Start Express backend API |
| `npm run frontend` | Start Angular dev server |
| `npm run dev` | Run both backend and frontend |
| `npm start` | CLI chat interface |
| `npm run agent` | Run tool agent example |
| `npm run setup` | Load API key from file |

## 🏗️ Architecture

### 🔍 Hybrid Retrieval-Augmented Generation (RAG)

The application implements an intelligent hybrid RAG system that automatically switches between two retrieval modes:

**Mode Selection (Content Size Threshold: 50KB):**

1. **Small Content (<50KB) - Context Mode** 📋
   - Uses simple sequential chunking (first 3 chunks)
   - Fast response time, minimal latency
   - Ideal for websites and small documents
   - Lower API costs

2. **Large Content (>50KB) - Semantic Search Mode** 🔍
   - Generates embeddings for all chunks using OpenAI embeddings API
   - Performs semantic similarity search to find relevant chunks
   - More accurate retrieval for complex documents
   - Better handling of multi-page documents, research papers, etc.

**How it Works:**

```
User Input
    ↓
[Size Check]
    ↙ (<50KB)          (>50KB) ↘
[Context Mode]      [RAG Mode]
 (First 3 chunks) → (Semantic Search)
    ↘                   ↙
      [Format Prompt]
            ↓
      [OpenAI API]
            ↓
      [Response]
```

**Technical Implementation:**

- **Vector Store**: In-memory FAISS-like implementation using cosine similarity
- **Embeddings**: OpenAI's embedding model (text-embedding-3-small)
- **Similarity Metric**: Cosine distance between embedding vectors
- **Search**: Top-k retrieval (default k=3 most similar chunks)

**Files:**
- [src/rag-module.ts](src/rag-module.ts) - RAG implementation with embedding generation and semantic search
- [src/server.ts](src/server.ts) - Updated endpoints to detect content size and initialize RAG

### Backend API (Express)

**Endpoints:**

- `POST /api/load-website` - Load a website and create a session
  ```json
  { "url": "https://example.com" }
  ```
  Returns: `{ sessionId, message, contentSize, chunksCount, hostname, ragMode }`
  - `ragMode: true` if content is >50KB (using semantic search)
  - `ragMode: false` if using simple context mode

- `POST /api/upload-document` - Upload and process a document
  ```json
  { "file": File }
  ```
  Returns: `{ sessionId, message, filename, contentSize, chunksCount, ragMode }`
  - Auto-detects RAG mode based on content size

- `POST /api/chat` - Send a question
  ```json
  { "sessionId": "abc123", "question": "What is this about?" }
  ```
  Returns: `{ question, answer, website, ragMode }`
  - `ragMode: true` if semantic search was used for this query

- `GET /api/session/:sessionId` - Get session info
- `GET /api/health` - Health check

### Frontend (Angular)

**Features:**

- 🎨 Modern, responsive UI with gradient design
- 📱 Mobile-friendly interface
- 🔄 Real-time chat updates
- 📊 Connection status indicator
- ⌨️ Keyboard shortcuts (Enter to send, Shift+Enter for new line)
- 🌐 Automatic website hostname display
- 🔍 **Hybrid RAG Mode Indicator** - Shows whether semantic search or context mode is active
- 📄 Document upload support (PDF, DOCX, TXT)
- ✂️ Automatic summarization of content
- 🧠 Intelligent content retrieval switching

**Components:**

- **AppComponent** - Main chat interface
- **ChatApiService** - HTTP communication with backend

## 📖 How to Use

1. **Open the application** at `http://localhost:4200`

2. **Load a website:**
   - Enter any URL in the "Load Website" field
   - Click "Load" button
   - The app will fetch and process the content

3. **Ask questions:**
   - Type your question in the chat input
   - Press Enter or click "Send"
   - Get instant answers based on website content

4. **Tips:**
   - The app uses the first 3 content chunks to provide context
   - Questions are answered by GPT-4o-mini model
   - Each session maintains its own website context

## 🔧 Configuration

### RAG Mode Configuration

Adjust RAG activation threshold in `src/server.ts`:

```typescript
// Load Website Endpoint - Line ~115
const useRAG = content.length > 50000; // Change threshold (bytes)

// Upload Document Endpoint - Line ~167  
const useRAG = cleanedContent.length > 50000; // Change threshold (bytes)
```

**Recommended Thresholds:**
- **50KB (default)**: Good balance for most use cases
- **25KB**: More aggressive RAG mode for better accuracy
- **100KB**: Conservative, only for very large documents

### Fine-tune Semantic Search

In `src/server.ts`, modify the chat endpoint search parameter:

```typescript
// Currently: semanticSearch(question, 3) - returns top 3 chunks
// Change to:
const relevantChunks = await session.ragModule.semanticSearch(question, 5); // Top 5 chunks
```

### Modify LLM Model

Edit `src/server.ts`:
```typescript
const llm = new ChatOpenAI({
  modelName: "gpt-4o-mini", // Change this
  temperature: 0.7,
});
```

### Adjust Content Chunking

Edit `src/web-loader.ts`:
```typescript
chunkText(content, 1500, 200) // Size: 1500 chars, Overlap: 200 chars
```

### Customize Frontend Styling

Edit `frontend/src/app/app.component.css`

RAG Badges:
- Green pulsing badge: "🔍 RAG Enabled" (semantic search active)
- Indigo badge: "📋 Context Mode" (simple context active)

## 🔐 Environment Variables

The `.env` file contains:
```
OPENAI_API_KEY=sk-proj-...
```

Never commit `.env` to version control!

## 🛠️ Development

### Debug Backend

Add logging to `src/server.ts`:
```typescript
console.log("Debug info:", variable);
```

### Debug Frontend

Use Angular DevTools browser extension or console:
```typescript
console.log(this.messages);
```

## 📝 Tech Stack

**Backend:**
- Express.js
- LangChain + OpenAI API
- TypeScript
- node-fetch + cheerio (web scraping)

**Frontend:**
- Angular 17
- TypeScript
- RxJS (reactive programming)
- CSS3 (modern styling)

## ⚠️ Troubleshooting

**"Cannot connect to backend"**
- Ensure backend server is running: `npm run server`
- Check port 5000 is not in use

**"OPENAI_API_KEY not found"**
- Run `npm run setup`
- Or ensure `D:\Projects\OpenAI_API_Key.txt` exists

**"Cannot load website"**
- Check the URL is valid
- Some websites may block automated requests

**"Blank answer"**
- Increase context chunks in `src/server.ts`
- Try a different website

## 📚 Resources

- [LangChain Documentation](https://js.langchain.com)
- [OpenAI API](https://platform.openai.com)
- [Angular Documentation](https://angular.io)
- [Express.js Guide](https://expressjs.com)

## 📄 License

MIT

## 🤝 Contributing

Feel free to extend this project:
- Add more extraction tools (links, images, metadata)
- Implement conversation history
- Add multi-language support
- Deploy to cloud platforms
