const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_TIMEOUT = 30000; // 30 seconds

export interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  stream: boolean;
  options?: {
    temperature?: number;
  };
}

export interface OllamaGenerateResponse {
  response: string;
  done: boolean;
}

export interface OllamaVersionResponse {
  version: string;
}

export interface OllamaConnectionStatus {
  connected: boolean;
  version?: string;
  error?: string;
}

/**
 * Check if Ollama is running and accessible
 */
export async function checkOllamaConnection(): Promise<OllamaConnectionStatus> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(`${OLLAMA_BASE_URL}/api/version`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        connected: false,
        error: `Ollama responded with status ${response.status}`,
      };
    }

    const data: OllamaVersionResponse = await response.json();
    return {
      connected: true,
      version: data.version,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return {
          connected: false,
          error: "Connection timeout - Ollama may not be running",
        };
      }
      return {
        connected: false,
        error: error.message,
      };
    }
    return {
      connected: false,
      error: "Failed to connect to Ollama",
    };
  }
}

export async function generateWithOllama(
  model: string,
  prompt: string
): Promise<string> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT);

    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: {
          temperature: 0,
        },
      } as OllamaGenerateRequest),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Ollama request failed: ${response.statusText}`);
    }

    const data: OllamaGenerateResponse = await response.json();
    return data.response.trim();
  } catch (error) {
    console.error("Ollama error:", error);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Ollama request timeout - model may be too slow or not loaded");
    }
    throw error;
  }
}

export function buildCategorizationPrompt(
  filename: string,
  extension: string
): string {
  const categories = [
    "Images",
    "Docs",
    "Spreadsheets",
    "Audio",
    "Video",
    "Apps",
    "Archives",
    "Code",
    "Other",
  ];

  return `You are a file categorization assistant. Given a filename and extension, output ONLY the category name from this list: ${categories.join(
    ", "
  )}.

Filename: ${filename}
Extension: ${extension}

Output ONLY ONE category name from the list above, nothing else.`;
}

export async function categorizeWithOllama(
  filename: string,
  extension: string,
  model: string
): Promise<string> {
  const prompt = buildCategorizationPrompt(filename, extension);
  try {
    const response = await generateWithOllama(model, prompt);

    // Extract category from response
    const validCategories = [
      "Images",
      "Docs",
      "Spreadsheets",
      "Audio",
      "Video",
      "Apps",
      "Archives",
      "Code",
      "Other",
    ];

    for (const cat of validCategories) {
      if (response.toLowerCase().includes(cat.toLowerCase())) {
        return cat;
      }
    }

    return "Other";
  } catch (error) {
    console.error("Categorization failed, defaulting to Other:", error);
    return "Other";
  }
}
