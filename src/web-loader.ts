import fetch from "node-fetch";
import * as cheerio from "cheerio";

/**
 * Fetches and extracts text content from a website URL
 * @param url - The website URL to fetch
 * @returns Extracted text content from the webpage
 */
export async function loadWebContent(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove script and style elements
    $("script").remove();
    $("style").remove();
    $("noscript").remove();

    // Extract text from body or entire document
    const text = $("body").text() || $.text();

    // Clean up whitespace
    const cleanedText = text
      .replace(/\s+/g, " ")
      .replace(/\n+/g, "\n")
      .trim();

    return cleanedText;
  } catch (error) {
    throw new Error(
      `Error loading web content: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Chunks text into smaller segments for LLM processing
 * @param text - The text to chunk
 * @param chunkSize - Maximum characters per chunk
 * @param overlap - Character overlap between chunks
 * @returns Array of text chunks
 */
export function chunkText(
  text: string,
  chunkSize: number = 1500,
  overlap: number = 200
): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start += chunkSize - overlap;
  }

  return chunks;
}
