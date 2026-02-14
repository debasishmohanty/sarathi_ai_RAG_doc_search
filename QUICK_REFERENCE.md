# 🎯 Quick Reference - Document Q&A System

## 🚀 Start Here (Copy-Paste Ready)

```bash
# 1. Set API key
echo "OPENAI_API_KEY=sk-your-key" > .env

# 2. Start everything
npm run dev:admin-user

# 3. Open browser
# Admin: http://localhost:4200 → Click "Admin Dashboard"
# User:  http://localhost:4200 → Click "User Chat"
```

## 📱 UI Quick Guide

### Admin Dashboard
```
┌─────────────────────────────────────────────────────┐
│ 📋 ADMIN DASHBOARD - DOCUMENT MANAGEMENT            │
├─────────────────────────────────────────────────────┤
│                                                      │
│  UPLOAD SECTION                                      │
│  ┌──────────────────────────────┐                   │
│  │ Category: [_____________]     │                  │
│  │ File: [Choose file____]      │                  │
│  │ [Upload Document Button]      │                  │
│  └──────────────────────────────┘                   │
│                                                      │
│  CATEGORIES                                          │
│  [Policy]  [Technical]  [Legal]                      │
│   (2)       (1)         (3)                          │
│                                                      │
│  DOCUMENTS IN POLICY                                 │
│  ┌──────────────────────────────┐                   │
│  │ policy-2024.pdf      [Delete]│                   │
│  │ Size: 1.2 MB | Chunks: 12    │                   │
│  │ RAG: Yes | Uploaded: 1/10    │                   │
│  └──────────────────────────────┘                   │
│  ┌──────────────────────────────┐                   │
│  │ policy-2023.pdf      [Delete]│                   │
│  │ Size: 0.8 MB | Chunks: 8     │                   │
│  │ RAG: Yes | Uploaded: 1/9     │                   │
│  └──────────────────────────────┘                   │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### User Chat Interface
```
┌─────────────────────────────────────────────────────┐
│ 💬 USER CHAT - DOCUMENT Q&A                         │
├──────────┬────────────────────────────────────────┤
│         │                                           │
│ Policy  │  Policy (2 docs) [End Session]           │
│ Tech    │  ┌──────────────────────────────────┐   │
│ Legal   │  │ Q: What's the vacation policy?   │   │
│         │  │                                   │   │
│         │  │ A: Based on the policy docs,     │   │
│         │  │    you get 20 days/year...       │   │
│         │  │ 📚 2 sources | RAG: Yes          │   │
│         │  │ 2:45 PM                          │   │
│         │  └──────────────────────────────────┘   │
│         │  ┌──────────────────────────────────┐   │
│         │  │ [Ask a question...]             │   │
│         │  │ [Send]                           │   │
│         │  └──────────────────────────────────┘   │
│         │                                           │
└─────────────────────────────────────────────────────┘
```

## 🔑 Keyboard Shortcuts

| Action | Key |
|--------|-----|
| Send question | Enter |
| Cancel | Escape (in admin form) |
| Switch to Admin | Alt+A |
| Switch to User | Alt+U |

## 🛠️ Common Commands

```bash
# Start everything (backend + frontend)
npm run dev:admin-user

# Start backend only
npm run server:admin-user

# Start frontend only (from frontend/ directory)
npm start

# Check if backend is running
curl http://localhost:5000/api/health

# View backend logs
tail -f /uploads/*  # Check for file uploads

# Reset (clear documents - restarts backend)
npm run server:admin-user  # Fresh CategoryStore
```

## 📊 File Types Supported

| Type | Extension | Parser |
|------|-----------|--------|
| PDF | .pdf | pdf-parse |
| Word | .docx | mammoth |
| Text | .txt | fs (native) |
| Max Size | 50 MB | multer limit |

## 🎨 Category Naming Tips

Good:
- "Company Policy"
- "Technical Docs"
- "Legal Agreements"
- "Product FAQ"

Avoid:
- Special characters: `@#$%`
- Very long names (>50 chars)
- Duplicate names

## 🔍 How RAG Mode Works

```
Document Size ≤50KB          Document Size >50KB
       ↓                              ↓
   Simple Chunking          RAG Mode Enabled
   • Fast lookup            • Semantic search
   • No AI embeddings       • OpenAI embeddings
   • No Pinecone            • Optional Pinecone
   ↓                              ↓
  RAG: No                        RAG: Yes
  ✅ Good for                  ✅ Good for
  - Small docs                 - Large docs
  - Quick answers              - Accurate answers
```

## 📈 Expected Performance

| Operation | Time | Notes |
|-----------|------|-------|
| Upload small doc | <1s | <1MB, simple chunking |
| Upload large doc | 2-5s | With RAG initialization |
| First question | 2-3s | Network + LLM |
| Next question | 1-2s | Cached category |
| Category switch | <1s | UI only |

## 🚨 Troubleshooting Quick Fixes

### "Cannot connect to backend"
```bash
# Check if backend is running
lsof -i :5000              # macOS/Linux
netstat -ano | findstr 5000 # Windows

# Restart if needed
npm run server:admin-user
```

### "File upload fails"
```
✓ File < 50 MB?
✓ File type = .pdf/.docx/.txt?
✓ Category name not empty?
✓ Disk space available?
```

### "Slow answers"
```
Check:
1. OpenAI API working? → Try curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models
2. Internet connection? → ping 8.8.8.8
3. Large document? → May need 5-10 seconds
4. Pinecone configured? → May be initializing first time
```

### "Chat shows error"
```
1. Browser console (F12) → Check exact error
2. Backend logs → Check terminal for errors
3. API health → http://localhost:5000/api/health
4. Session valid? → Create new session (select category again)
```

## 💾 Data Locations

| Data | Location | Type |
|------|----------|------|
| Uploaded files | `/uploads/` | Filesystem |
| Documents | Memory (CategoryStore) | RAM |
| Env vars | `.env` | File |
| Frontend code | `frontend/` | Folder |
| Backend code | `src/` | Folder |

**Note:** Everything cleared on backend restart (no persistence). Add PostgreSQL for persistence.

## 🔐 Default Behavior

| Setting | Value | Change In |
|---------|-------|-----------|
| API port | 5000 | `.env` or code |
| Frontend port | 4200 | frontend `package.json` |
| Chunk size | 1500 chars | `src/category-store.ts` |
| Chunk overlap | 200 chars | `src/category-store.ts` |
| RAG threshold | 50 KB | `src/category-store.ts` |
| Upload limit | 50 MB | `src/server-admin-user.ts` |
| API timeout | 30s (default) | Express config |

## 📲 API Response Examples

### Upload Success
```json
{
  "success": true,
  "message": "Document added successfully",
  "docId": "doc_12345",
  "category": "Policy",
  "filename": "policy.pdf",
  "contentSize": 1245000,
  "chunksCount": 12,
  "ragMode": true
}
```

### Chat Response
```json
{
  "question": "What's the vacation policy?",
  "answer": "Based on the policy documents, employees get 20 days of paid vacation per year...",
  "category": "Policy",
  "ragMode": true,
  "sourcesUsed": 2
}
```

### Error Response
```json
{
  "success": false,
  "message": "Category is required",
  "error": "Validation failed"
}
```

## 🎓 Example Workflows

### Workflow 1: Add Policy Document
```
1. Admin Dashboard → Upload
2. Category: "Company Policy"
3. File: 2024_handbook.pdf
4. Upload
5. See "policy-2024.pdf" in list
6. User can now ask policy questions
```

### Workflow 2: Multi-Doc Category
```
1. Upload "policy-2024.pdf" → Category "HR"
2. Upload "salary-guide.pdf" → Category "HR"
3. Upload "benefits.pdf" → Category "HR"
4. User selects "HR" category
5. Can ask about any HR topic
6. Bot searches all 3 docs
7. Returns answer with "📚 3 sources"
```

### Workflow 3: Delete & Re-upload
```
1. Found error in document
2. Admin: Click [Delete] next to wrong doc
3. Upload corrected version with same name
4. New doc has new docId
5. Old version completely removed
```

## ✅ Feature Checklist

Use this to verify system is working:

- [ ] Backend starts (`npm run server:admin-user`)
- [ ] Frontend loads (http://localhost:4200)
- [ ] Admin tab shows upload form
- [ ] Can upload a document
- [ ] Document appears in category list
- [ ] User tab shows categories
- [ ] Can select category
- [ ] Chat input enabled
- [ ] Can type question
- [ ] Bot responds with answer
- [ ] Can see number of sources
- [ ] Can delete documents
- [ ] No errors in console (F12)

## 🆘 When Things Break

1. **First**: Check browser console (F12) for errors
2. **Second**: Check backend terminal for error messages
3. **Third**: Restart: `Ctrl+C` then `npm run dev:admin-user`
4. **Fourth**: Check `.env` has `OPENAI_API_KEY`
5. **Fifth**: See [QUICK_START.md](QUICK_START.md) Troubleshooting section

## 📞 Getting Help

```
Error/Issue                  Where to Check
──────────────────────────────────────────────
Frontend not loading        Browser console (F12)
Backend not responding      Terminal logs
Upload fails                Browser console + Terminal
Chat returns error          Browser console + Terminal  
Wrong answers               Check sources + document content
Slow performance            Check OPENAI_API_KEY validity
```

---

**Remember**: 
- 🟢 Green = Working
- 🟡 Yellow = Slow/Warning
- 🔴 Red = Error/Check logs

**Quick Start**: `npm run dev:admin-user` then go to `http://localhost:4200`
