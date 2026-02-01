import * as fs from "fs";
import * as mammoth from "mammoth";

// Use require for libraries with missing types
const pdfParse: any = require("pdf-parse");

/**
 * Parse text file
 */
export async function parseTextFile(filePath: string): Promise<string> {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch (error) {
    throw new Error(`Error reading text file: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Parse PDF file
 */
export async function parsePdfFile(filePath: string): Promise<string> {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    throw new Error(`Error parsing PDF: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Parse DOCX file
 */
export async function parseDocxFile(filePath: string): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } catch (error) {
    throw new Error(`Error parsing DOCX: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Parse DOC file (basic support - try as text/other format)
 */
export async function parseDocFile(filePath: string): Promise<string> {
  try {
    // Try as DOCX first
    return await parseDocxFile(filePath);
  } catch {
    // Fallback: treat as text
    return parseTextFile(filePath);
  }
}

/**
 * Detect and parse document based on file extension
 */
export async function parseDocument(filePath: string, mimeType: string): Promise<string> {
  const ext = filePath.toLowerCase().split(".").pop();

  try {
    if (mimeType.includes("pdf") || ext === "pdf") {
      return await parsePdfFile(filePath);
    }

    if (
      mimeType.includes("officedocument.wordprocessingml") ||
      mimeType.includes("msword") ||
      ext === "docx"
    ) {
      return await parseDocxFile(filePath);
    }

    if (ext === "doc") {
      return await parseDocFile(filePath);
    }

    // Default to text parsing
    return await parseTextFile(filePath);
  } catch (error) {
    throw new Error(
      `Failed to parse document: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Clean and prepare document text
 */
export function cleanDocumentText(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\n+/g, "\n")
    .trim();
}
