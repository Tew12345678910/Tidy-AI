/**
 * API Route: /api/ai/status
 *
 * Check AI service connection (Ollama or OpenAI)
 */

import { NextRequest, NextResponse } from "next/server";
import { getAIClient } from "@/lib/ai-client";
import { getSettingsManager } from "@/lib/settings-manager";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const settingsManager = getSettingsManager();
    const settings = await settingsManager.get();

    const client = getAIClient({
      provider: settings.aiProvider,
      ollamaBaseUrl: settings.ollamaBaseUrl,
      ollamaModel: settings.ollamaModel,
      openaiApiKey: settings.openaiApiKey,
      openaiModel: settings.openaiModel,
      openaiBaseUrl: settings.openaiBaseUrl,
    });

    const status = await client.checkConnection();

    return NextResponse.json({
      provider: settings.aiProvider,
      ...status,
    });
  } catch (error) {
    console.error("[API /api/ai/status] Error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
