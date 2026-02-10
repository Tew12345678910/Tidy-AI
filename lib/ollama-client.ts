/**
 * Enhanced Ollama Client for AI-Native File Organizer
 *
 * Supports:
 * - Structured JSON responses with validation
 * - Retries and timeouts
 * - Connection checking
 * - Model listing
 */

import {
  ClassificationRequest,
  ClassificationResponse,
  PlanAction,
  UserPreferences,
  DocumentMetadata,
} from "./types";

export interface OllamaConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
}

export const DEFAULT_OLLAMA_CONFIG: OllamaConfig = {
  baseUrl: process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434",
  timeout: 60000, // 60 seconds
  retries: 2,
};

export interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
}

export interface OllamaTagsResponse {
  models: OllamaModel[];
}

export interface OllamaGenerateOptions {
  temperature?: number;
  top_p?: number;
  top_k?: number;
}

/**
 * Enhanced Ollama Client
 */
export class OllamaClient {
  private config: OllamaConfig;

  constructor(config: Partial<OllamaConfig> = {}) {
    this.config = { ...DEFAULT_OLLAMA_CONFIG, ...config };
  }

  /**
   * Update base URL
   */
  setBaseUrl(baseUrl: string): void {
    this.config.baseUrl = baseUrl;
  }

  /**
   * Check Ollama connection and version
   */
  async checkConnection(): Promise<{
    connected: boolean;
    version?: string;
    error?: string;
  }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.config.baseUrl}/api/version`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          connected: false,
          error: `Ollama responded with status ${response.status}`,
        };
      }

      const data = await response.json();
      return {
        connected: true,
        version: data.version,
      };
    } catch (error) {
      if (error instanceof Error) {
        return {
          connected: false,
          error:
            error.name === "AbortError"
              ? "Connection timeout - Ollama may not be running"
              : error.message,
        };
      }
      return {
        connected: false,
        error: "Unknown error",
      };
    }
  }

  /**
   * List available models
   */
  async listModels(): Promise<OllamaModel[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/tags`);

      if (!response.ok) {
        throw new Error(`Failed to list models: ${response.statusText}`);
      }

      const data: OllamaTagsResponse = await response.json();
      return data.models || [];
    } catch (error) {
      console.error("Failed to list Ollama models:", error);
      return [];
    }
  }

  /**
   * Generate response with structured JSON output
   */
  async generateJSON<T>(
    model: string,
    prompt: string,
    systemPrompt?: string,
    options: OllamaGenerateOptions = {}
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.config.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          this.config.timeout
        );

        const messages = [
          ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
          { role: "user", content: prompt },
        ];

        const response = await fetch(`${this.config.baseUrl}/api/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages,
            stream: false,
            format: "json",
            options: {
              temperature: options.temperature ?? 0.3,
              top_p: options.top_p ?? 0.9,
              ...options,
            },
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(
            `Ollama request failed: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();
        const content = data.message?.content;

        if (!content) {
          throw new Error("No content in Ollama response");
        }

        // Parse JSON response
        const parsed = JSON.parse(content);
        return parsed as T;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (error instanceof Error && error.name === "AbortError") {
          console.warn(
            `Ollama request timeout (attempt ${attempt + 1}/${
              this.config.retries + 1
            })`
          );
        } else {
          console.warn(
            `Ollama request failed (attempt ${attempt + 1}/${
              this.config.retries + 1
            }):`,
            error
          );
        }

        // Don't retry if it's a parse error
        if (error instanceof SyntaxError) {
          throw new Error("Failed to parse JSON response from Ollama");
        }

        // Wait before retry (exponential backoff)
        if (attempt < this.config.retries) {
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * (attempt + 1))
          );
        }
      }
    }

    throw lastError || new Error("Ollama request failed after retries");
  }

  /**
   * Classify a document using AI
   */
  async classifyDocument(
    model: string,
    request: ClassificationRequest
  ): Promise<ClassificationResponse> {
    const systemPrompt = `You are a file classification assistant. Analyze the provided information and classify the document.

Return a JSON object with:
- category: string (e.g., "Chemistry Notes", "Personal Finance", "Work Documents")
- subject: string (broader subject area)
- title: string (clean, descriptive title)
- confidence: number (0.0 to 1.0)
- reasoning: string (brief explanation)

Be specific with categories. For academic documents, include the subject (e.g., "Chemistry Notes" not just "Notes").
For personal documents, be descriptive (e.g., "Tax Documents 2024" not just "Documents").`;

    const prompt = this.buildClassificationPrompt(request);

    try {
      const response = await this.generateJSON<ClassificationResponse>(
        model,
        prompt,
        systemPrompt
      );

      // Validate response
      if (!response.category || typeof response.confidence !== "number") {
        throw new Error("Invalid classification response structure");
      }

      // Clamp confidence
      response.confidence = Math.max(0, Math.min(1, response.confidence));

      return response;
    } catch (error) {
      console.error("Document classification failed:", error);
      // Return a default low-confidence response
      return {
        category: "Unknown",
        confidence: 0.1,
        reasoning: `Classification failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }

  /**
   * Build classification prompt from request
   */
  private buildClassificationPrompt(request: ClassificationRequest): string {
    const parts: string[] = [
      `Filename: ${request.filename}`,
      `Extension: ${request.extension}`,
      `Size: ${this.formatFileSize(request.size)}`,
    ];

    if (request.folderContext) {
      parts.push(`Folder context: ${request.folderContext}`);
    }

    if (request.metadata) {
      const meta = request.metadata;
      if (meta.title) parts.push(`PDF Title: ${meta.title}`);
      if (meta.author) parts.push(`Author: ${meta.author}`);
      if (meta.subject) parts.push(`Subject: ${meta.subject}`);
      if (meta.keywords && meta.keywords.length > 0) {
        parts.push(`Keywords: ${meta.keywords.join(", ")}`);
      }
      if (meta.firstPageSnippet) {
        parts.push(
          `\nFirst page text:\n${meta.firstPageSnippet.slice(0, 300)}`
        );
      }
    }

    return parts.join("\n");
  }

  /**
   * Generate organization plan actions using AI
   */
  async generatePlanActions(
    model: string,
    entries: Array<{
      path: string;
      name: string;
      category?: string;
      metadata?: DocumentMetadata;
    }>,
    destRoot: string,
    preferences: UserPreferences
  ): Promise<Array<Omit<PlanAction, "id">>> {
    const systemPrompt = `You are a file organization assistant. Generate a plan to organize files based on user preferences.

Rules:
1. Group similar documents together by subject/topic
2. Use clean, descriptive folder names
3. Respect user's naming preferences
4. Never move files inside project roots
5. Provide clear reasoning for each action

Return a JSON array of actions with:
- from: string (source path)
- to: string (destination path)
- actionType: "move" | "rename" | "move-rename" | "skip"
- reason: string
- confidence: number (0.0 to 1.0)
- category: string (optional)
- tags: string[] (optional)`;

    const prompt = this.buildPlanPrompt(entries, destRoot, preferences);

    try {
      const actions = await this.generateJSON<Array<Omit<PlanAction, "id">>>(
        model,
        prompt,
        systemPrompt,
        { temperature: 0.2 } // Lower temperature for more consistent planning
      );

      return actions;
    } catch (error) {
      console.error("Plan generation failed:", error);
      return [];
    }
  }

  /**
   * Build plan generation prompt
   */
  private buildPlanPrompt(
    entries: Array<{
      path: string;
      name: string;
      category?: string;
      metadata?: DocumentMetadata;
    }>,
    destRoot: string,
    preferences: UserPreferences
  ): string {
    const parts: string[] = [
      `Destination root: ${destRoot}`,
      `\nUser preferences:`,
      `- Naming style: ${preferences.naming.style}`,
      `- Remove special chars: ${preferences.naming.removeSpecialChars}`,
      `- Auto-approve threshold: ${preferences.confidenceThresholds.autoApprove}`,
      `\nFiles to organize (showing first 50):`,
    ];

    // Include first 50 entries to avoid overwhelming the model
    const entriesToShow = entries.slice(0, 50);

    for (const entry of entriesToShow) {
      let entryDesc = `\n- ${entry.name}`;
      if (entry.category) entryDesc += ` [Category: ${entry.category}]`;
      if (entry.metadata?.title)
        entryDesc += ` [Title: ${entry.metadata.title}]`;
      if (entry.metadata?.subject)
        entryDesc += ` [Subject: ${entry.metadata.subject}]`;
      parts.push(entryDesc);
    }

    if (entries.length > 50) {
      parts.push(`\n... and ${entries.length - 50} more files`);
    }

    return parts.join("\n");
  }

  /**
   * Format file size for display
   */
  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024)
      return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
  }
}

/**
 * Global Ollama client instance
 */
let globalClient: OllamaClient | null = null;

/**
 * Get or create global Ollama client
 */
export function getOllamaClient(config?: Partial<OllamaConfig>): OllamaClient {
  if (!globalClient || config) {
    globalClient = new OllamaClient(config);
  }
  return globalClient;
}

/**
 * Update global client base URL
 */
export function setOllamaBaseUrl(baseUrl: string): void {
  getOllamaClient().setBaseUrl(baseUrl);
}
