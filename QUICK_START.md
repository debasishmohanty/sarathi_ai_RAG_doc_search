# Quick Start Guide - Document Q&A with Admin & User Views

## 5-Minute Setup

### 1. Install Dependencies
```bash
# Backend dependencies (already installed)
npm install

# Frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Set Environment Variables
Create a `.env` file in the project root:
```
OPENAI_API_KEY=sk-...your-openai-key...
```

Optional (for semantic search):
```
PINECONE_API_KEY=...
PINECONE_ENV=us-east-1-aws
PINECONE_INDEX_NAME=langchain-docs
PINECONE_NAMESPACE=docs-v1
```

### 3. Run the System
```bash
npm run dev:admin-user
```

This starts:
- **Backend**: http://localhost:5000
- **Frontend**: http://localhost:4200

## First Time Usage

### Step 1: Admin - Upload Documents

1. Open http://localhost:4200 in browser
2. Click **"👤 Admin Dashboard"** tab
3. Upload a document:
   - **Category**: Type `Policy` (or any category)
   - **File**: Select a `.pdf`, `.docx`, or `.txt` file
   - **Click**: "Upload Document"
4. Document appears in category list

### Step 2: User - Ask Questions

1. Click **"💬 User Chat"** tab
2. Click **"Policy"** category (or your chosen category)
3. Type a question about the document content
4. Bot responds with answer from that category's documents
5. See number of sources used and RAG status

## Features Explained

### Admin Dashboard
- **Upload Section**: Add new documents with category tags
- **Category Management**: See all categories and document counts
- **Document List**: View metadata and delete documents
- **Auto-Embedding**: Documents >50KB automatically get semantic search enabled

### User Chat
- **Category Sidebar**: Browse available categories
- **Chat Interface**: Ask questions, see chat history with timestamps
- **Source Tracking**: See how many documents contributed to answer
- **RAG Indicator**: Shows if semantic search was used

## Architecture Flow

```
ADMIN SIDE                          USER SIDE
┌─────────────────────┐           ┌──────────────────┐
│  Upload Document    │           │  Select Category │
│  + Category Tag     │           │                  │
└──────────┬──────────┘           └────────┬─────────┘
           │                               │
           ▼                               ▼
    ┌────────────────────────────────────────────┐
    │      CategoryStore (Central Repository)    │
    │ - Stores docs by category                  │
    │ - Per-doc RAG if >50KB                     │
    │ - Tracks user sessions                     │
    └────────────────────────────────────────────┘
           ▲                               │
           │                               ▼
    ┌──────┴─────────────────────────┬──────────────────┐
    │                                │                  │
    │      Admin Endpoints:          │  User Endpoints: │
    │ - Upload doc                   │ - Get categories │
    │ - List docs by category        │ - Create session │
    │ - Delete doc                   │ - Ask question   │
    │                                │ - Get answer     │
    └────────────────────────────────┴──────────────────┘
```

## Common Tasks

### Q: How do I upload multiple documents to same category?
1. Upload first document with category "Sales"
2. Upload second document with same category "Sales"
3. Both appear under "Sales" in document list
4. Users selecting "Sales" will get Q&A from both documents

### Q: What file types are supported?
- `.pdf` - PDF documents
- `.docx` - Microsoft Word
- `.txt` - Plain text

### Q: How large can documents be?
- Maximum 50MB per file
- Documents >50KB use semantic search (RAG mode)
- Documents <50KB use simple chunking

### Q: Can I delete a document?
Yes! Admin Dashboard → Select category → Click "× Delete" on document

### Q: How do users know which documents are used?
See "📚 X source(s)" below each answer showing number of documents that contributed

### Q: Is there authentication?
No - current implementation is for internal/trusted use. To add auth:
1. Modify endpoints to validate userId
2. Implement JWT token verification

## Troubleshooting

### Frontend not connecting to backend
```
Error: Cannot connect to backend. Make sure server is running on port 5000
```
**Solution:**
```bash
# Ensure backend is running
npm run server:admin-user
# Check if port 5000 is in use
lsof -i :5000  # macOS/Linux
netstat -ano | findstr :5000  # Windows
```

### Upload fails with file too large
```
Error: Request entity too large
```
**Solution:** File exceeds 50MB limit. Use smaller files.

### Documents not appearing after upload
**Solution:**
1. Check browser console for errors (F12)
2. Verify category name is not empty
3. Ensure file is valid format (.pdf, .docx, .txt)

### Semantic search not working
**Solution:**
1. If `RAG: No` in document metadata, content <50KB (expected)
2. Check `OPENAI_API_KEY` is set correctly
3. If using Pinecone, verify `PINECONE_*` env vars

## Development

### Project Structure
```
langchain/
├── src/
│   ├── server-admin-user.ts    # Backend API endpoints
│   ├── category-store.ts       # Document repository
│   ├── rag-module.ts           # Semantic search
│   └── document-parser.ts      # File parsing
├── frontend/
│   └── src/app/
│       ├── admin/              # Admin component
│       ├── user/               # User component
│       ├── services/           # API services
│       └── app.component.ts    # Main router
└── DUAL_VIEW_ARCHITECTURE.md   # Full documentation
```

### Key Files to Know
- **Backend**: `src/server-admin-user.ts` (endpoints) + `src/category-store.ts` (data)
- **Frontend**: `frontend/src/app/app.component.ts` (view switcher)
- **Admin UI**: `frontend/src/app/admin/admin.component.ts`
- **User UI**: `frontend/src/app/user/user.component.ts`
- **API Layer**: `frontend/src/app/services/admin-user-api.service.ts`

### Making Changes
1. Edit TypeScript files
2. Server auto-reloads (via ts-node watch)
3. Frontend auto-reloads (via Angular dev server)
4. Refresh browser if needed

## Next Steps

### Production Deployment
1. Build frontend: `cd frontend && npm run build`
2. Serve static files from backend
3. Add authentication
4. Deploy to cloud (Vercel, AWS, etc.)

### Scale Up
1. Add database (PostgreSQL) for persistence
2. Implement user authentication
3. Add document search/filtering
4. Track analytics

### Advanced Features
1. Support more file types (Excel, PowerPoint)
2. Add document versioning
3. Implement feedback/rating system
4. Multi-language support

---

**Need Help?** Check [DUAL_VIEW_ARCHITECTURE.md](DUAL_VIEW_ARCHITECTURE.md) for detailed documentation.
