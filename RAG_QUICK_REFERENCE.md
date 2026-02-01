# Quick Reference - Hybrid RAG Mode

## 🎯 What is Hybrid RAG?

The app automatically chooses the best retrieval strategy based on content size:

| Content Size | Strategy | Speed | Accuracy | Use Case |
|---|---|---|---|---|
| < 50KB | 📋 Context Mode | Fast | Good | Small websites, articles |
| > 50KB | 🔍 RAG Mode | Slower | Better | Large docs, research papers |

## 🚀 Getting Started

### 1. Start the Server
```bash
npm run server
```

### 2. Start the Frontend
```bash
cd frontend && npm run dev
# In another terminal
npm run frontend
```

### 3. Open Browser
Navigate to `http://localhost:4200`

## 📊 Understanding RAG Indicators

### When you load content:

**Small Content (<50KB):**
```
✓ Website loaded successfully!
Content: 30000 chars | Chunks: 20
📋 Context Mode
```

**Large Content (>50KB):**
```
✓ Website loaded successfully!
Content: 120000 chars | Chunks: 80
🔍 RAG Enabled
```

### During chat:

**Context Mode Answer:**
```
Your Question:
> What is the main topic?

Bot Response:
The main topic is... [standard response]
```

**RAG Mode Answer:**
```
Your Question:
> What is the main topic?

Bot Response:
The main topic is... [response] 🔍 [Semantic Search]
```

## ⚙️ Configuration Guide

### Change RAG Threshold

Edit `src/server.ts` (~line 115 for websites, ~line 167 for documents):

```typescript
// Current (50KB):
const useRAG = content.length > 50000;

// More aggressive RAG (25KB):
const useRAG = content.length > 25000;

// Conservative RAG (100KB):
const useRAG = content.length > 100000;
```

### Change Search Results Count

Edit `src/server.ts` in the `/api/chat` endpoint (~line 280):

```typescript
// Current (top 3 chunks):
const relevantChunks = await session.ragModule.semanticSearch(question, 3);

// More context (top 5 chunks):
const relevantChunks = await session.ragModule.semanticSearch(question, 5);

// Less context (top 2 chunks):
const relevantChunks = await session.ragModule.semanticSearch(question, 2);
```

## 🔍 How Semantic Search Works

1. **Question:** "What is the cost?"
2. **Generate embedding:** Convert question to 1536-dimensional vector
3. **Calculate similarity:** Compare with all chunk embeddings using cosine similarity
4. **Select top-k:** Return 3 most similar chunks
5. **Answer:** LLM reads selected chunks and answers

**Result:** More relevant context than just first 3 chunks!

## 📈 Cost Considerations

### API Calls per Query:

**Context Mode:**
- 1x Chat completion (LLM): ~$0.0001 per 1K tokens

**RAG Mode:**
- 1x Embeddings (question): ~$0.000002 per 1K tokens
- 1x Chat completion (LLM): ~$0.0001 per 1K tokens
- **Total overhead:** ~2% cost increase for better accuracy

### Cost Optimization:

```
Large threshold (100KB) → Save on embeddings API calls
Small threshold (25KB) → Better accuracy on more documents
Balance at 50KB → Default optimization
```

## 🧪 Testing RAG

### Test Case 1: Small Website (Context Mode)
```
1. Load: https://example.com (< 50KB)
2. Badge shows: 📋 Context Mode
3. Ask: "What is this?"
4. Response has NO semantic search badge
5. Server logs show: "Using simple context mode"
```

### Test Case 2: Large Document (RAG Mode)
```
1. Upload: Large PDF (> 50KB)
2. Badge shows: 🔍 RAG Enabled
3. Ask: "What is this about?"
4. Response shows: 🔍 [Semantic Search]
5. Server logs show: "Using RAG semantic search (3 chunks)"
```

## 🐛 Troubleshooting

### "No RAG badge appears"
- Check content size: should show in system message
- Expected: "Content: 120000 chars" (>50KB)
- If <50KB: Content is too small for RAG

### "RAG mode slow"
- Expected: +2-3 seconds for first query (embedding generation)
- Subsequent queries use cached embeddings: Normal speed
- Increase threshold if latency critical

### "API errors with RAG"
- Check OPENAI_API_KEY is set: `echo $env:OPENAI_API_KEY`
- Check API quota: https://platform.openai.com/account/api-keys
- Check embeddings model access: text-embedding-3-small

### "Wrong answers despite RAG"
- Try increasing search results: Change k=3 to k=5
- Try decreasing threshold: More aggressive RAG
- Check content quality: Garbage in, garbage out

## 💡 Pro Tips

### 1. Content Chunking
- Default chunk size: 1500 characters
- Overlap: 200 characters (prevents info loss)
- Adjust in `src/web-loader.ts` for different domains

### 2. Question Phrasing
- **Good:** "What are the main benefits?"
- **Better:** "List the main benefits of this product"
- **Best:** "What specific benefits does this product offer?"
- RAG performs better with specific questions

### 3. Document Preparation
- PDF quality matters: RAG works on extracted text
- DOCX: Best support for formatting preservation
- TXT: Fastest processing
- Large files: May take longer to embed

### 4. Monitoring
- Check server logs for RAG indicators
- Look for: "Using RAG semantic search" vs "Using simple context"
- Verify chunk counts in load responses

## 🔗 Related Commands

```bash
# Run with RAG enabled
npm run server

# Check health
curl http://localhost:5000/api/health

# Test website loading
curl -X POST http://localhost:5000/api/load-website \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'

# Test chat (after loading)
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"abc123","question":"What is this?"}'
```

## 📚 Further Reading

- [RAG Implementation Details](./RAG_IMPLEMENTATION.md)
- [Full README](./README.md)
- [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings)
- [Semantic Search Guide](https://huggingface.co/blog/vector-search-guide)

---

**Last Updated:** February 1, 2026
**RAG Version:** 1.0
