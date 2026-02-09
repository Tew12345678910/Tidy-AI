import { NextRequest, NextResponse } from "next/server";
import { generatePlan } from "@/lib/organizer";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      sourceFolder,
      destFolder,
      useOllama,
      ollamaModel,
      ollamaBaseUrl,
      detectDuplicates,
    } = body;

    if (!sourceFolder || !destFolder) {
      return NextResponse.json(
        { error: "Missing sourceFolder or destFolder" },
        { status: 400 }
      );
    }

    // Set Ollama base URL if provided
    if (ollamaBaseUrl) {
      process.env.OLLAMA_BASE_URL = ollamaBaseUrl;
    }

    const result = await generatePlan({
      sourceFolder,
      destFolder,
      useOllama: useOllama ?? false,
      ollamaModel: ollamaModel || "llama3.1",
      detectDuplicates: detectDuplicates ?? false,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error generating plan:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to generate plan",
      },
      { status: 500 }
    );
  }
}
