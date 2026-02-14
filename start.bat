@echo off
REM 🚀 START THE DOCUMENT Q&A SYSTEM
REM Usage: start.bat

echo.
echo ╔════════════════════════════════════════════════════════════════════╗
echo ║     📚 Document Q&A System - Dual Admin/User Views                ║
echo ║                                                                    ║
echo ║     Status: ✅ READY TO RUN                                        ║
echo ╚════════════════════════════════════════════════════════════════════╝
echo.

REM Check for .env file
if not exist ".env" (
    echo ⚠️  .env file not found!
    echo.
    echo Create .env file with:
    echo   OPENAI_API_KEY=sk-your-openai-api-key
    echo.
    set /p continue="Continue anyway? (y/n): "
    if /i not "%continue%"=="y" (
        exit /b 1
    )
)

echo 📦 Installing dependencies...
call npm install --silent

if errorlevel 1 (
    echo ❌ Failed to install dependencies
    exit /b 1
)

cd frontend
call npm install --silent
cd ..

if errorlevel 1 (
    echo ❌ Failed to install frontend dependencies
    exit /b 1
)

echo.
echo ✅ Dependencies ready
echo.
echo ╔════════════════════════════════════════════════════════════════════╗
echo ║  🚀 STARTING SYSTEM...                                             ║
echo ║                                                                    ║
echo ║  📍 Backend: http://localhost:5000                                ║
echo ║  📍 Frontend: http://localhost:4200                               ║
echo ║                                                                    ║
echo ║  👤 Admin Dashboard: Upload documents by category                 ║
echo ║  💬 User Chat: Ask questions about category documents             ║
echo ║                                                                    ║
echo ║  📖 Documentation: See INDEX.md or QUICK_START.md                ║
echo ║                                                                    ║
echo ╚════════════════════════════════════════════════════════════════════╝
echo.
echo Press Ctrl+C to stop the server
echo.

REM Run the dev server
call npm run dev:admin-user

pause
