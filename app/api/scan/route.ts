/**
 * API Route: /api/scan
 *
 * Generates a manifest from directory scan (PHASE 1)
 */

import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { generateManifest, saveManifest } from "@/lib/manifest-generator";
import { ScanRequest, ScanResponse } from "@/lib/types";
import { getSettingsManager } from "@/lib/settings-manager";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes for large scans

export async function POST(request: NextRequest) {
  try {
    const body: ScanRequest = await request.json();

    const { rootPath, options = {} } = body;

    if (!rootPath) {
      return NextResponse.json(
        { error: "rootPath is required" },
        { status: 400 }
      );
    }

    // Load settings
    const settingsManager = getSettingsManager();
    const settings = await settingsManager.get();

    // Merge options with settings
    const scanOptions = {
      rootPath,
      ignorePaths: options.ignorePaths || settings.preferences.ignorePaths,
      includeHidden: options.includeHidden ?? false,
      maxDepth: options.maxDepth ?? 10,
      useAI: options.useAI ?? true,
      aiProvider: options.aiProvider || settings.aiProvider,
      // Ollama settings
      ollamaModel: options.ollamaModel || settings.ollamaModel,
      ollamaBaseUrl: options.ollamaBaseUrl || settings.ollamaBaseUrl,
      // OpenAI settings
      openaiApiKey: options.openaiApiKey || settings.openaiApiKey,
      openaiModel: options.openaiModel || settings.openaiModel,
      openaiBaseUrl: options.openaiBaseUrl || settings.openaiBaseUrl,
      // Extraction options
      extractPdfMetadata: options.extractPdfMetadata ?? true,
      extractFirstPage: options.extractFirstPage ?? true,
    };

    console.log(
      "[API /api/scan] Starting scan with",
      scanOptions.aiProvider,
      "provider:",
      scanOptions.rootPath
    );

    // Generate manifest
    const manifest = await generateManifest(scanOptions);

    // Save manifest to disk
    const outputDir = path.join(rootPath, "_tidyai");
    const manifestFilePath = await saveManifest(manifest, outputDir);

    const response: ScanResponse = {
      manifest,
      manifestFilePath,
    };

    console.log("[API /api/scan] Scan complete:", manifest.id);

    return NextResponse.json(response);
  } catch (error) {
    console.error("[API /api/scan] Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to scan directory",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
