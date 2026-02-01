# LangChain Agent Project - AI Coding Agent Instructions

## Project Overview

This TypeScript project contains two LangChain applications:
1. **Chat Application** ([src/chat.ts](src/chat.ts)): Interactive Q&A tool for website content using LLMChain
2. **Tool Agent** ([src/agent.ts](src/agent.ts)): Minimal agent with tool calling capabilities

**Key Dependencies:**
- `langchain` + `@langchain/core` + `@langchain/openai` - AI framework
- `node-fetch`, `cheerio` - Web scraping for content loading
- `zod` - Schema validation (agent tools)
- `dotenv` - Environment variable loading

## Core Architecture

### Website Q&A Chat (src/chat.ts)
Interactive CLI that loads websites and answers questions about their content:
- **Web Loading** ([src/web-loader.ts](src/web-loader.ts)): `loadWebContent()` fetches and extracts HTML text, `chunkText()` splits into overlapping segments
- **LLMChain**: Combines `PromptTemplate` with OpenAI's GPT-4o-mini for QA
- **Context Management**: Uses first 3 content chunks to stay within token limits
- **State**: `currentWebsite` object holds URL, raw content, and chunked segments

**Flow**: `load <url>` → `loadWebContent()` → `chunkText()` → Answer questions using context

### Tool-Based Agent (src/agent.ts)
Demonstrates LangChain agent with tool calling:
- **Agent Factory**: `createAgent()` creates GPT-4o orchestrator
- **Tool Definition**: `tool()` wrapper requires name, description, and Zod schema
- **Tool Example**: `getWeather` shows schema pattern

## Critical Environment Setup

**Required:**
- `OPENAI_API_KEY` environment variable (enforced in both apps with `process.exit(1)` on missing key)
- Store in `.env` file (auto-loaded by dotenv) or system environment

## Running Applications

**Website Q&A Chat:**
```bash
npm start
# Commands: load <url>, exit, or ask any question
```

**Tool Agent:**
```bash
npm run agent
```

## Key Conventions

### Chat Application Patterns
- **Content Processing**: Extract text (remove scripts/styles), chunk with 200-char overlap for context windows
- **Prompt Design**: System prompt establishes context authority ("Use the provided website content...")
- **Error Handling**: Try-catch with user-friendly messages, no silent failures
- **CLI State**: Store loaded website in `currentWebsite` object, show hostname in prompt

### Tool Agent Patterns
- **Async-first**: IIFE wraps main execution
- **Schema-driven**: Tool inputs validated via Zod - use `schema.describe()` for LLM parameter docs
- **Pure Functions**: Tools have no state or side effects

## Web Content Handling

**Extraction Process** ([src/web-loader.ts](src/web-loader.ts)):
1. Fetch HTML via `node-fetch`
2. Parse with `cheerio`, remove `<script>`, `<style>`, `<noscript>` tags
3. Extract body text, clean whitespace (collapse multiple spaces, preserve line breaks)
4. Split into overlapping chunks (1500 chars default, 200 overlap)

**Why chunking matters**: Prevents token limit errors by splitting content into manageable segments that fit in LLM context window.

## Adding Features

**New Website Content Tool:**
1. Extend `web-loader.ts` with new extraction function
2. Call `loadWebContent()` and `chunkText()` in chat flow
3. Example: Add `extractLinks()` to return all URLs on page

**New Tool in Agent:**
1. Create function returning string output
2. Define with `tool(implementation, {name, description, schema: z.object({...})})`
3. Add to `createAgent()` tools array
4. Include schema.describe() for each parameter so LLM understands inputs
