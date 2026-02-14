# 🌐 URLs & API Reference

## 🔗 Frontend URLs

After running both services (backend + frontend):

### Main Application
- **Main App**: http://localhost:4200
- **Admin Dashboard**: http://localhost:4200 (click Admin tab)
- **User Chat**: http://localhost:4200 (click User tab)

**Status**: ✅ Backend API verified working (port 5000)  |  ⏳ Frontend not yet tested running (port 4200)

---

## 🔌 Backend API Endpoints (VERIFIED ✅)

### Base URL
```
http://localhost:5000
```

### API Status
- ✅ Backend listening on port 5000
- ✅ /api/admin/categories endpoint tested (returns `{"categories":[]}`)
- ⏳ Other endpoints code verified, not yet tested with data
- ⏳ All endpoints ready for testing

### Admin Endpoints

#### 1. Upload Document
```
POST /api/admin/upload-document

Content-Type: multipart/form-data

Request Body:
  - file: File object
  - category: string (e.g., "Policy", "Technical")

Example Response:
{
  "success": true,
  "message": "Document added successfully",
  "docId": "doc_1234567890",
  "category": "Policy",
  "filename": "policy-2024.pdf",
  "contentSize": 1245000,
  "chunksCount": 12,
  "ragMode": true
}
```

**Usage (curl)**:
```bash
curl -F "file=@policy.pdf" \
     -F "category=Policy" \
     http://localhost:5000/api/admin/upload-document
```

**Usage (JavaScript)**:
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('category', 'Policy');

fetch('http://localhost:5000/api/admin/upload-document', {
  method: 'POST',
  body: formData
})
```

---

#### 2. Get Categories
```
GET /api/admin/categories

Example Response:
{
  "categories": ["Policy", "Technical", "Legal"]
}
```

**Usage (curl)**:
```bash
curl http://localhost:5000/api/admin/categories
```

---

#### 3. Get Documents by Category
```
GET /api/admin/documents?category=Policy

Query Parameters:
  - category: string (URL encoded)

Example Response:
{
  "category": "Policy",
  "documents": [
    {
      "id": "doc_1234567890",
      "filename": "policy-2024.pdf",
      "uploadedAt": "2024-01-15T10:30:00Z",
      "contentSize": 1245000,
      "chunksCount": 12,
      "ragMode": true
    },
    {
      "id": "doc_9876543210",
      "filename": "policy-2023.pdf",
      "uploadedAt": "2024-01-10T14:15:00Z",
      "contentSize": 987000,
      "chunksCount": 9,
      "ragMode": true
    }
  ]
}
```

**Usage (curl)**:
```bash
curl "http://localhost:5000/api/admin/documents?category=Policy"
```

---

#### 4. Delete Document
```
DELETE /api/admin/documents/:docId

Path Parameters:
  - docId: string (document ID from upload response)

Example Response:
{
  "success": true,
  "message": "Document deleted successfully"
}
```

**Usage (curl)**:
```bash
curl -X DELETE http://localhost:5000/api/admin/documents/doc_1234567890
```

---

### User Endpoints

#### 1. Get Categories
```
GET /api/user/categories

Example Response:
{
  "categories": ["Policy", "Technical", "Legal"]
}
```

**Usage (curl)**:
```bash
curl http://localhost:5000/api/user/categories
```

---

#### 2. Create Session
```
POST /api/user/session

Content-Type: application/json

Request Body:
{
  "userId": "user_123",
  "category": "Policy"
}

Example Response:
{
  "sessionId": "session_9876543210",
  "category": "Policy",
  "documentCount": 2,
  "message": "Session created with 2 documents"
}
```

**Usage (curl)**:
```bash
curl -X POST http://localhost:5000/api/user/session \
     -H "Content-Type: application/json" \
     -d '{
       "userId": "user_123",
       "category": "Policy"
     }'
```

---

#### 3. Send Question (Chat)
```
POST /api/user/chat

Content-Type: application/json

Request Body:
{
  "sessionId": "session_9876543210",
  "question": "What is the vacation policy?"
}

Example Response:
{
  "question": "What is the vacation policy?",
  "answer": "Based on the policy documents provided, employees are entitled to 20 days of paid vacation per calendar year. Vacation requests should be submitted at least 2 weeks in advance...",
  "category": "Policy",
  "ragMode": true,
  "sourcesUsed": 2
}
```

**Usage (curl)**:
```bash
curl -X POST http://localhost:5000/api/user/chat \
     -H "Content-Type: application/json" \
     -d '{
       "sessionId": "session_9876543210",
       "question": "What is the vacation policy?"
     }'
```

---

### Health Check

#### API Health
```
GET /api/health

Example Response:
{
  "status": "OK"
}
```

**Usage (curl)**:
```bash
curl http://localhost:5000/api/health
```

---

## 📊 Data Model Examples

### Document Info
```typescript
interface DocumentInfo {
  id: string;                  // Unique document ID
  filename: string;            // Original filename
  uploadedAt: string;          // ISO 8601 timestamp
  contentSize: number;         // Bytes
  chunksCount: number;         // Number of text chunks
  ragMode: boolean;            // True if >50KB (uses semantic search)
}
```

### Upload Response
```typescript
interface AdminUploadResponse {
  success: boolean;
  message: string;
  docId: string;
  category: string;
  filename: string;
  contentSize: number;
  chunksCount: number;
  ragMode: boolean;
}
```

### Chat Response
```typescript
interface UserChatResponse {
  question: string;
  answer: string;
  category: string;
  ragMode: boolean;
  sourcesUsed: number;          // Number of documents that contributed
}
```

### Session Response
```typescript
interface UserSessionResponse {
  sessionId: string;
  category: string;
  documentCount: number;
  message: string;
}
```

---

## 🧪 Testing with curl

### Test Upload
```bash
# Create a test file
echo "This is a test document about company policy." > test.txt

# Upload it
curl -F "file=@test.txt" \
     -F "category=Test" \
     http://localhost:5000/api/admin/upload-document
```

### Test Chat
```bash
# 1. Get categories
curl http://localhost:5000/api/user/categories

# 2. Create session (replace Test with actual category)
SESSION=$(curl -s -X POST http://localhost:5000/api/user/session \
  -H "Content-Type: application/json" \
  -d '{"userId":"test_user","category":"Test"}' | jq -r '.sessionId')

# 3. Ask question
curl -X POST http://localhost:5000/api/user/chat \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SESSION\",\"question\":\"What is the policy?\"}"
```

---

## 📲 API Clients

### JavaScript/TypeScript (Angular)
```typescript
// Import the services
import { AdminApiService, UserApiService } from './services/admin-user-api.service';

// Inject in component
constructor(private adminApi: AdminApiService, private userApi: UserApiService) {}

// Upload document
this.adminApi.uploadDocument(file, category).subscribe(response => {
  console.log('Uploaded:', response.docId);
});

// Get categories
this.userApi.getCategories().subscribe(response => {
  console.log('Categories:', response.categories);
});

// Create session
this.userApi.createSession('user_123', 'Policy').subscribe(response => {
  console.log('Session:', response.sessionId);
});

// Ask question
this.userApi.sendQuestion(sessionId, 'What is the policy?').subscribe(response => {
  console.log('Answer:', response.answer);
});
```

### Python
```python
import requests

base_url = 'http://localhost:5000'

# Upload document
files = {'file': open('policy.pdf', 'rb')}
data = {'category': 'Policy'}
response = requests.post(f'{base_url}/api/admin/upload-document', 
                        files=files, data=data)
print(response.json())

# Get categories
response = requests.get(f'{base_url}/api/user/categories')
print(response.json())

# Create session
response = requests.post(f'{base_url}/api/user/session',
                        json={'userId': 'user_123', 'category': 'Policy'})
session_id = response.json()['sessionId']

# Ask question
response = requests.post(f'{base_url}/api/user/chat',
                        json={'sessionId': session_id, 'question': 'What is the policy?'})
print(response.json())
```

---

## ⚙️ Request/Response Headers

### Request Headers
```
Content-Type: application/json  (for POST/PUT endpoints)
Content-Type: multipart/form-data  (for file uploads)
```

### Response Headers
```
Access-Control-Allow-Origin: *  (CORS enabled)
Content-Type: application/json
```

---

## 🔄 API Flow Diagram

```
┌─────────────────┐
│   Admin UI      │
└────────┬────────┘
         │
         ├─→ POST /api/admin/upload-document
         │   (Upload file + category)
         │   ↓ Response: { docId, ragMode, ... }
         │
         ├→ GET /api/admin/categories
         │  ↓ Response: { categories: [...] }
         │
         ├→ GET /api/admin/documents?category=X
         │  ↓ Response: { documents: [...] }
         │
         └→ DELETE /api/admin/documents/:docId
            ↓ Response: { success: true }

┌─────────────────┐
│   User UI       │
└────────┬────────┘
         │
         ├→ GET /api/user/categories
         │  ↓ Response: { categories: [...] }
         │
         ├→ POST /api/user/session
         │  (userId + category)
         │  ↓ Response: { sessionId, documentCount, ... }
         │
         └→ POST /api/user/chat
            (sessionId + question)
            ↓ Response: { answer, sourcesUsed, ragMode }
```

---

## 🔐 Authentication (Future)

Current implementation has no authentication. To add:

```bash
# Add Authorization header to requests
Authorization: Bearer <jwt_token>
```

Then modify endpoints to validate token:
```typescript
app.use((req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  // Validate token...
  next();
});
```

---

## 🧪 Postman Collection

Create a Postman collection with these endpoints:

```json
{
  "collection": {
    "name": "Document Q&A API",
    "item": [
      {
        "name": "Admin Upload",
        "request": {
          "method": "POST",
          "url": "{{base_url}}/api/admin/upload-document"
        }
      },
      {
        "name": "Get Categories",
        "request": {
          "method": "GET",
          "url": "{{base_url}}/api/user/categories"
        }
      },
      {
        "name": "Create Session",
        "request": {
          "method": "POST",
          "url": "{{base_url}}/api/user/session",
          "body": {
            "mode": "raw",
            "raw": "{\"userId\":\"user_123\",\"category\":\"Policy\"}"
          }
        }
      },
      {
        "name": "Chat",
        "request": {
          "method": "POST",
          "url": "{{base_url}}/api/user/chat",
          "body": {
            "mode": "raw",
            "raw": "{\"sessionId\":\"{{sessionId}}\",\"question\":\"What is the policy?\"}"
          }
        }
      }
    ],
    "variable": [
      {
        "name": "base_url",
        "value": "http://localhost:5000"
      }
    ]
  }
}
```

---

## 📚 Related Files

- Backend API: `src/server-admin-user.ts`
- Frontend Services: `frontend/src/app/services/admin-user-api.service.ts`
- Documentation: `DUAL_VIEW_ARCHITECTURE.md`

---

## 🚀 Quick Test (Updated)

```bash
# 1. Start backend (in Terminal 1)
node --require ts-node/register src/server-admin-user.ts
# Result: ✅ Listening on http://localhost:5000

# 2. Start frontend (in Terminal 2)
cd frontend && npm start
# Result: Should start on http://localhost:4200

# 3. Test API (in Terminal 3)
curl http://localhost:5000/api/health

# 4. Test categories endpoint (VERIFIED ✅)
curl http://localhost:5000/api/admin/categories
# Expected: {"categories":[]}

# 5. Create test file
echo "Test policy content" > test.txt

# 6. Test upload (when frontend is ready)
curl -F "file=@test.txt" -F "category=Test" \
  http://localhost:5000/api/admin/upload-document

# 7. Test user endpoints
curl http://localhost:5000/api/user/categories
```

**Note**: If `npm run dev:admin-user` fails on Windows, use the direct commands above instead.

---

**All endpoints are CORS-enabled and ready for testing. Backend API verified working and responding correctly. Frontend UI pending verification after startup.**

**Status**: ✅ Backend API operational  |  ⏳ Full integration testing pending
