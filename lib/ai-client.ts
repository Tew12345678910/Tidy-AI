/**
 * Unified AI Client for File Organizer
 *
 * Supports:
 * - Ollama (local models)
 * - OpenAI API (cloud models)
 * - Structured JSON responses
 * - Retries and error handling
 */

import OpenAI from "openai";
import {
  ClassificationRequest,
  ClassificationResponse,
  AIProvider,
  AIConfig,
} from "./types";

export interface AIClientConfig {
  provider: AIProvider;
  // Ollama settings
  ollamaBaseUrl?: string;
  ollamaModel?: string;
  // OpenAI settings
  openaiApiKey?: string;
  openaiModel?: string;
  openaiBaseUrl?: string;
  // Common settings
  timeout?: number;
  retries?: number;
}

export const DEFAULT_AI_CONFIG: AIClientConfig = {
  provider: "ollama",
  ollamaBaseUrl: "http://127.0.0.1:11434",
  ollamaModel: "llama3.1",
  openaiModel: "gpt-4o-mini",
  timeout: 60000,
  retries: 2,
};

/**
 * Unified AI Client
 */
export class AIClient {
  private config: AIClientConfig;
  private openaiClient?: OpenAI;

  constructor(config: Partial<AIClientConfig> = {}) {
    this.config = { ...DEFAULT_AI_CONFIG, ...config };

    // Initialize OpenAI client if using OpenAI
    if (this.config.provider === "openai" && this.config.openaiApiKey) {
      this.openaiClient = new OpenAI({
        apiKey: this.config.openaiApiKey,
        baseURL: this.config.openaiBaseUrl,
        timeout: this.config.timeout,
      });
    }
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<AIClientConfig>): void {
    this.config = { ...this.config, ...config };

    // Reinitialize OpenAI client if provider changed
    if (this.config.provider === "openai" && this.config.openaiApiKey) {
      this.openaiClient = new OpenAI({
        apiKey: this.config.openaiApiKey,
        baseURL: this.config.openaiBaseUrl,
        timeout: this.config.timeout,
      });
    }
  }

  /**
   * Check connection to AI service
   */
  async checkConnection(): Promise<{
    ok: boolean;
    error?: string;
    version?: string;
  }> {
    try {
      if (this.config.provider === "ollama") {
        return await this.checkOllamaConnection();
      } else {
        return await this.checkOpenAIConnection();
      }
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  }

  /**
   * List available models
   */
  async listModels(): Promise<string[]> {
    try {
      if (this.config.provider === "ollama") {
        return await this.listOllamaModels();
      } else {
        return await this.listOpenAIModels();
      }
    } catch (error) {
      console.error("Error listing models:", error);
      return [];
    }
  }

  /**
   * Classify a document using AI
   */
  async classifyDocument(
    request: ClassificationRequest
  ): Promise<ClassificationResponse> {
    try {
      if (this.config.provider === "ollama") {
        return await this.classifyWithOllama(request);
      } else {
        return await this.classifyWithOpenAI(request);
      }
    } catch (error: any) {
      console.error("Error classifying document:", error);
      // Return fallback classification
      return {
        category: "Unknown",
        subject: request.metadata?.subject || "General",
        title: request.filename,
        confidence: 0.3,
        reasoning: `Error: ${error.message}`,
      };
    }
  }

  // ============================================================================
  // OLLAMA METHODS
  // ============================================================================

  private async checkOllamaConnection(): Promise<{
    ok: boolean;
    error?: string;
    version?: string;
  }> {
    try {
      const response = await fetch(`${this.config.ollamaBaseUrl}/api/version`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        return { ok: false, error: `HTTP ${response.status}` };
      }

      const data = await response.json();
      return { ok: true, version: data.version };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  }

  private async listOllamaModels(): Promise<string[]> {
    const response = await fetch(`${this.config.ollamaBaseUrl}/api/tags`, {
      method: "GET",
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`Failed to list models: ${response.status}`);
    }

    const data = await response.json();
    return data.models?.map((m: any) => m.name) || [];
  }

  private async classifyWithOllama(
    request: ClassificationRequest
  ): Promise<ClassificationResponse> {
    const prompt = this.buildClassificationPrompt(request);
    const model = this.config.ollamaModel || "llama3.1";

    for (let attempt = 0; attempt <= (this.config.retries || 0); attempt++) {
      try {
        const response = await fetch(
          `${this.config.ollamaBaseUrl}/api/generate`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model,
              prompt,
              format: "json",
              stream: false,
              options: {
                temperature: 0.3,
                top_p: 0.9,
              },
            }),
            signal: AbortSignal.timeout(this.config.timeout || 60000),
          }
        );

        if (!response.ok) {
          throw new Error(`Ollama API error: ${response.status}`);
        }

        const data = await response.json();
        const result = JSON.parse(data.response);

        return {
          category: result.category || "Unknown",
          subject: result.subject || "General",
          title: result.title || request.filename,
          confidence: result.confidence || 0.5,
          reasoning: result.reasoning || "AI classification",
        };
      } catch (error: any) {
        if (attempt === this.config.retries) {
          throw error;
        }
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (attempt + 1))
        );
      }
    }

    throw new Error("Max retries exceeded");
  }

  // ============================================================================
  // OPENAI METHODS
  // ============================================================================

  private async checkOpenAIConnection(): Promise<{
    ok: boolean;
    error?: string;
    version?: string;
  }> {
    if (!this.openaiClient) {
      return { ok: false, error: "OpenAI API key not configured" };
    }

    try {
      // Try to list models as a connection check
      await this.openaiClient.models.list();
      return { ok: true, version: "OpenAI API" };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  }

  private async listOpenAIModels(): Promise<string[]> {
    if (!this.openaiClient) {
      throw new Error("OpenAI API key not configured");
    }

    const response = await this.openaiClient.models.list();
    return response.data
      .filter((m) => m.id.includes("gpt"))
      .map((m) => m.id)
      .sort();
  }

  private async classifyWithOpenAI(
    request: ClassificationRequest
  ): Promise<ClassificationResponse> {
    if (!this.openaiClient) {
      throw new Error("OpenAI API key not configured");
    }

    const prompt = this.buildClassificationPrompt(request);
    const model = this.config.openaiModel || "gpt-4o-mini";

    for (let attempt = 0; attempt <= (this.config.retries || 0); attempt++) {
      try {
        const response = await this.openaiClient.chat.completions.create({
          model,
          messages: [
            {
              role: "system",
              content:
                "You are a file classification assistant. Respond only with valid JSON matching the requested schema.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.3,
          response_format: { type: "json_object" },
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
          throw new Error("Empty response from OpenAI");
        }

        const result = JSON.parse(content);

        return {
          category: result.category || "Unknown",
          subject: result.subject || "General",
          title: result.title || request.filename,
          confidence: result.confidence || 0.5,
          reasoning: result.reasoning || "AI classification",
        };
      } catch (error: any) {
        if (attempt === this.config.retries) {
          throw error;
        }
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (attempt + 1))
        );
      }
    }

    throw new Error("Max retries exceeded");
  }

  // ============================================================================
  // SHARED METHODS
  // ============================================================================

  private buildClassificationPrompt(request: ClassificationRequest): string {
    const metadata = request.metadata;
    const folderContext = request.folderContext;

    return `Classify this file and return ONLY valid JSON with no additional text.

FILE: ${request.filename}
${metadata?.title ? `TITLE: ${metadata.title}` : ""}
${metadata?.author ? `AUTHOR: ${metadata.author}` : ""}
${metadata?.subject ? `SUBJECT: ${metadata.subject}` : ""}
${metadata?.keywords?.length ? `KEYWORDS: ${metadata.keywords.join(", ")}` : ""}
${folderContext ? `FOLDER PATH: ${folderContext}` : ""}
${
  metadata?.firstPageSnippet
    ? `\nCONTENT PREVIEW:\n${metadata.firstPageSnippet.slice(0, 500)}`
    : ""
}

Return JSON in this exact format:
{
  "category": "one of: Work Documents|Personal Documents|School|Chemistry Notes|Physics Notes|Math Notes|Biology Notes|Tax Documents|Invoices & Receipts|Contracts|Career|Images|Videos|Audio|Archives|Code|Unknown",
  "subject": "specific topic or subject (e.g., 'Organic Chemistry', 'Tax Year 2025', 'Project Alpha')",
  "title": "clean human-readable title",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation of classification"
}`;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let globalClient: AIClient | null = null;

export function getAIClient(config?: Partial<AIClientConfig>): AIClient {
  if (!globalClient || config) {
    globalClient = new AIClient(config);
  }
  return globalClient;
}

export function resetAIClient(): void {
  globalClient = null;
}
