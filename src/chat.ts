import * as readline from "readline";
import * as dotenv from "dotenv";
import { loadWebContent, chunkText } from "./web-loader";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";

// Load environment variables
dotenv.config({ path: require("path").join(__dirname, "..", ".env") });

// Validate API key
if (!process.env.OPENAI_API_KEY) {
  console.error("ERROR: OPENAI_API_KEY environment variable is NOT set");
  process.exit(1);
}

const llm = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  temperature: 0.7,
});

// System prompt for context-aware QA
const qaTemplate = `You are a helpful assistant that answers questions about website content.
Use the provided website content to answer the user's question accurately and concisely.

Website Content:
{context}

User Question: {question}

Answer: `;

const qaPrompt = PromptTemplate.fromTemplate(qaTemplate);

interface WebsiteChat {
  url: string;
  content: string;
  chunks: string[];
}

let currentWebsite: WebsiteChat | null = null;

/**
 * Loads a website and prepares it for Q&A
 */
async function loadWebsite(url: string): Promise<void> {
  console.log(`\n📡 Loading website: ${url}...`);
  try {
    const content = await loadWebContent(url);
    const chunks = chunkText(content);

    currentWebsite = {
      url,
      content,
      chunks,
    };

    console.log(`✓ Website loaded successfully!`);
    console.log(`   Content size: ${content.length} characters`);
    console.log(`   Split into ${chunks.length} chunks for processing\n`);
  } catch (error) {
    console.error(
      `✗ Failed to load website: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Answers a question about the loaded website
 */
async function answerQuestion(question: string): Promise<void> {
  if (!currentWebsite) {
    console.log(
      "⚠ No website loaded. Use 'load <url>' to load a website first.\n"
    );
    return;
  }

  if (question.trim().length === 0) {
    return;
  }

  console.log("\n🤔 Thinking...\n");

  try {
    // Use the first few chunks as context to avoid token limits
    const contextChunks = currentWebsite.chunks.slice(0, 3).join("\n\n");

    // Format the prompt
    const formattedPrompt = await qaPrompt.format({
      context: contextChunks,
      question: question,
    });

    // Call the LLM
    const result = await llm.invoke(formattedPrompt);

    console.log("💬 Answer:\n");
    console.log(result);
    console.log();
  } catch (error) {
    console.error(
      `✗ Error processing question: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Interactive CLI for website QA
 */
async function main(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("🌐 LLM-Powered Website Q&A Chat");
  console.log("================================\n");
  console.log("Commands:");
  console.log("  load <url>  - Load a website for Q&A");
  console.log("  exit        - Exit the application");
  console.log("  Or type any question about the loaded website\n");

  const prompt = (): void => {
    const promptText =
      currentWebsite ?
        `[${new URL(currentWebsite.url).hostname}] > `
        : "> ";

    rl.question(promptText, async (input) => {
      const trimmedInput = input.trim();

      if (trimmedInput.toLowerCase() === "exit") {
        console.log("\nGoodbye! 👋\n");
        rl.close();
        return;
      }

      if (trimmedInput.toLowerCase().startsWith("load ")) {
        const url = trimmedInput.slice(5).trim();
        if (url) {
          await loadWebsite(url);
        } else {
          console.log("⚠ Please provide a valid URL\n");
        }
      } else if (trimmedInput) {
        await answerQuestion(trimmedInput);
      }

      prompt();
    });
  };

  prompt();
}

main().catch(console.error);
