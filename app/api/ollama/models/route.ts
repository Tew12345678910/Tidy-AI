import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const ollamaBaseUrl =
      request.nextUrl.searchParams.get("baseUrl") ||
      process.env.OLLAMA_BASE_URL ||
      "http://127.0.0.1:11434";

    const response = await fetch(`${ollamaBaseUrl}/api/tags`, {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`Ollama API returned ${response.status}`);
    }

    const data = await response.json();
    
    // Extract model names from the response
    const models = data.models?.map((model: any) => ({
      name: model.name,
      size: model.size,
      modified: model.modified_at,
    })) || [];

    return NextResponse.json({ models });
  } catch (error) {
    console.error("Error fetching Ollama models:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch models from Ollama",
        models: [],
      },
      { status: 500 }
    );
  }
}
