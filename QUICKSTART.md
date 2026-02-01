# Quick Start Guide

## 🚀 Get Running in 5 Minutes

### Step 1: Setup (30 seconds)
```bash
cd d:\Projects\AI_ML\langchain
npm run setup
```

### Step 2: Install Dependencies (2-3 minutes)
```bash
npm install
cd frontend && npm install && cd ..
```

### Step 3: Start the Application (30 seconds)
```bash
npm run dev
```

This opens two terminals:
- **Backend:** http://localhost:5000 (API server)
- **Frontend:** http://localhost:4200 (Angular UI)

### Step 4: Use the Chat App 🎉
1. Open http://localhost:4200 in your browser
2. Load a website: `https://en.wikipedia.org/wiki/Artificial_intelligence`
3. Ask a question: "What is artificial intelligence?"
4. Get instant answers!

---

## 📋 Individual Commands

### Run only backend:
```bash
npm run server
```

### Run only frontend:
```bash
npm run frontend
```

### Run CLI chat (no UI):
```bash
npm start
```

### Run tool agent:
```bash
npm run agent
```

---

## 🔧 Troubleshooting

**Backend won't start?**
```bash
npm run setup  # Reload API key
npm install    # Reinstall dependencies
```

**Frontend won't load?**
```bash
cd frontend
npm install
cd ..
npm run frontend
```

**Can't connect backend to frontend?**
- Check backend is running on port 5000
- Check CORS is enabled (should be automatic)
- Check browser console for errors

---

## 💡 Example Websites to Try

- https://en.wikipedia.org/wiki/Artificial_intelligence
- https://www.wikipedia.org/wiki/Python_(programming_language)
- https://en.wikipedia.org/wiki/Machine_learning
- https://docs.python.org/ (for technical docs)

---

## ✨ Features

✅ Load any website  
✅ Ask unlimited questions  
✅ Get AI-powered answers  
✅ Modern web interface  
✅ Real-time chat  
✅ Session management  
✅ Mobile responsive  

---

## 📞 Need Help?

- Check README.md for detailed documentation
- Look at .github/copilot-instructions.md for code patterns
- Run with `npm run setup` if API key issues
- Use `npm run dev` to run both services
