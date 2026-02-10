/**
 * PDF Metadata Extraction Module
 *
 * Extracts metadata from PDFs including:
 * - Title, author, subject, keywords from PDF metadata
 * - First page text snippet
 * - Page count
 */

import fs from "fs/promises";
import { DocumentMetadata } from "./types";

/**
 * Extract metadata from a PDF file
 *
 * Note: This is a basic implementation that reads PDF metadata.
 * For production use, consider libraries like:
 * - pdf-parse (npm install pdf-parse)
 * - pdf-lib (npm install pdf-lib)
 */
export async function extractPdfMetadata(
  pdfPath: string
): Promise<DocumentMetadata> {
  try {
    const stats = await fs.stat(pdfPath);

    // Basic metadata from file system
    const metadata: DocumentMetadata = {
      modificationDate: stats.mtime.toISOString(),
      extractionMethod: "none",
    };

    // Try to extract PDF-specific metadata
    const buffer = await fs.readFile(pdfPath);
    const pdfMetadata = extractPdfInfoFromBuffer(buffer);

    return {
      ...metadata,
      ...pdfMetadata,
      extractionMethod: pdfMetadata.title ? "pdf-parse" : "filename",
    };
  } catch (error) {
    console.error(`Failed to extract PDF metadata from ${pdfPath}:`, error);
    return {
      extractionMethod: "none",
    };
  }
}

/**
 * Extract PDF info dictionary from buffer
 * This is a simplified parser - for production use a proper PDF library
 */
function extractPdfInfoFromBuffer(buffer: Buffer): Partial<DocumentMetadata> {
  const metadata: Partial<DocumentMetadata> = {};

  try {
    // Convert buffer to string (first 50KB should contain metadata)
    const pdfString = buffer.slice(0, 50000).toString("latin1");

    // Extract title
    const titleMatch = pdfString.match(/\/Title\s*\(([^)]+)\)/);
    if (titleMatch && titleMatch[1]) {
      metadata.title = cleanPdfString(titleMatch[1]);
    }

    // Extract author
    const authorMatch = pdfString.match(/\/Author\s*\(([^)]+)\)/);
    if (authorMatch && authorMatch[1]) {
      metadata.author = cleanPdfString(authorMatch[1]);
    }

    // Extract subject
    const subjectMatch = pdfString.match(/\/Subject\s*\(([^)]+)\)/);
    if (subjectMatch && subjectMatch[1]) {
      metadata.subject = cleanPdfString(subjectMatch[1]);
    }

    // Extract keywords
    const keywordsMatch = pdfString.match(/\/Keywords\s*\(([^)]+)\)/);
    if (keywordsMatch && keywordsMatch[1]) {
      const keywordsStr = cleanPdfString(keywordsMatch[1]);
      metadata.keywords = keywordsStr
        .split(/[,;]/)
        .map((k) => k.trim())
        .filter((k) => k);
    }

    // Extract creation date
    const creationDateMatch = pdfString.match(/\/CreationDate\s*\(([^)]+)\)/);
    if (creationDateMatch && creationDateMatch[1]) {
      metadata.creationDate = parsePdfDate(creationDateMatch[1]);
    }

    // Extract page count (count /Type /Page occurrences)
    const pageMatches = pdfString.match(/\/Type\s*\/Page[^s]/g);
    if (pageMatches) {
      metadata.pageCount = pageMatches.length;
    }

    // Try to extract first page text (very basic)
    const textContent = extractBasicTextFromPdf(pdfString);
    if (textContent) {
      metadata.firstPageSnippet = textContent.slice(0, 500);
    }
  } catch (error) {
    console.error("Error parsing PDF metadata:", error);
  }

  return metadata;
}

/**
 * Clean PDF string (remove escape sequences, etc.)
 */
function cleanPdfString(str: string): string {
  return str
    .replace(/\\([nrtbf\\()])/g, (_, char) => {
      const escapes: Record<string, string> = {
        n: "\n",
        r: "\r",
        t: "\t",
        b: "\b",
        f: "\f",
        "\\": "\\",
        "(": "(",
        ")": ")",
      };
      return escapes[char] || char;
    })
    .trim();
}

/**
 * Parse PDF date format (D:YYYYMMDDHHmmSSOHH'mm')
 */
function parsePdfDate(pdfDate: string): string {
  try {
    // Remove D: prefix if present
    const dateStr = pdfDate.replace(/^D:/, "");

    // Extract date parts
    const year = dateStr.slice(0, 4);
    const month = dateStr.slice(4, 6);
    const day = dateStr.slice(6, 8);
    const hour = dateStr.slice(8, 10) || "00";
    const minute = dateStr.slice(10, 12) || "00";
    const second = dateStr.slice(12, 14) || "00";

    return new Date(
      `${year}-${month}-${day}T${hour}:${minute}:${second}`
    ).toISOString();
  } catch {
    return pdfDate;
  }
}

/**
 * Extract basic text content from PDF
 * This is very simplistic - looks for text between parentheses
 */
function extractBasicTextFromPdf(pdfString: string): string {
  const textMatches: string[] = [];

  // Look for text in the format [(text)]TJ or (text)Tj
  const regex = /\(([^)]+)\)\s*T[Jj]/g;
  let match;

  while ((match = regex.exec(pdfString)) !== null) {
    if (match[1]) {
      textMatches.push(cleanPdfString(match[1]));
    }
  }

  return textMatches.join(" ").slice(0, 1000);
}

/**
 * Extract metadata from document filename
 * Tries to infer title, subject, etc. from filename patterns
 */
export function extractMetadataFromFilename(
  filename: string
): Partial<DocumentMetadata> {
  const metadata: Partial<DocumentMetadata> = {};

  // Remove extension
  const nameWithoutExt = filename.replace(/\.[^.]+$/, "");

  // Common patterns
  const patterns = [
    // "Subject - Title.pdf"
    /^([^-]+)\s*-\s*(.+)$/,
    // "Title (Author).pdf"
    /^(.+?)\s*\(([^)]+)\)$/,
    // "YYYY-MM-DD Title.pdf"
    /^(\d{4}-\d{2}-\d{2})\s+(.+)$/,
  ];

  for (const pattern of patterns) {
    const match = nameWithoutExt.match(pattern);
    if (match) {
      // Pattern 1: Subject - Title
      if (pattern === patterns[0]) {
        metadata.subject = match[1].trim();
        metadata.title = match[2].trim();
      }
      // Pattern 2: Title (Author)
      else if (pattern === patterns[1]) {
        metadata.title = match[1].trim();
        metadata.author = match[2].trim();
      }
      // Pattern 3: Date Title
      else if (pattern === patterns[2]) {
        metadata.title = match[2].trim();
        metadata.creationDate = new Date(match[1]).toISOString();
      }
      break;
    }
  }

  // If no pattern matched, use filename as title
  if (!metadata.title) {
    metadata.title = nameWithoutExt
      .replace(/[_-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  return metadata;
}

/**
 * Generate a clean title from metadata
 */
export function generateCleanTitle(
  metadata: DocumentMetadata,
  filename: string
): string {
  // Priority: PDF title > extracted from filename > filename itself
  if (metadata.title && metadata.title.length > 3) {
    return cleanTitle(metadata.title);
  }

  const filenameMetadata = extractMetadataFromFilename(filename);
  if (filenameMetadata.title) {
    return cleanTitle(filenameMetadata.title);
  }

  return cleanTitle(filename.replace(/\.[^.]+$/, ""));
}

/**
 * Clean and normalize a title
 */
function cleanTitle(title: string): string {
  return title
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase()); // Title case
}

/**
 * Extract folder context to help with classification
 */
export function extractFolderContext(filePath: string): string {
  const parts = filePath.split("/");
  // Get the last 2-3 folder names
  const relevantParts = parts.slice(-4, -1).filter((p) => {
    // Filter out generic folder names
    const generic = ["downloads", "documents", "files", "desktop", "home"];
    return !generic.includes(p.toLowerCase());
  });

  return relevantParts.join(" / ");
}
