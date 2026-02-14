#!/usr/bin/env bash

# 🚀 START THE DOCUMENT Q&A SYSTEM
# Usage: ./start.sh

echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║     📚 Document Q&A System - Dual Admin/User Views                ║"
echo "║                                                                    ║"
echo "║     Status: ✅ READY TO RUN                                        ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""

# Check for OPENAI_API_KEY
if [ -z "$OPENAI_API_KEY" ] && [ ! -f ".env" ]; then
    echo "⚠️  OPENAI_API_KEY not found!"
    echo ""
    echo "Create .env file with:"
    echo "  OPENAI_API_KEY=sk-your-openai-api-key"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "📦 Installing dependencies..."
npm install --silent

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

cd frontend
npm install --silent
cd ..

if [ $? -ne 0 ]; then
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi

echo ""
echo "✅ Dependencies ready"
echo ""
echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║  🚀 STARTING SYSTEM...                                             ║"
echo "║                                                                    ║"
echo "║  📍 Backend: http://localhost:5000                                ║"
echo "║  📍 Frontend: http://localhost:4200                               ║"
echo "║                                                                    ║"
echo "║  👤 Admin Dashboard: Upload documents by category                 ║"
echo "║  💬 User Chat: Ask questions about category documents             ║"
echo "║                                                                    ║"
echo "║  📖 Documentation: See INDEX.md or QUICK_START.md                ║"
echo "║                                                                    ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Run the dev server
npm run dev:admin-user
