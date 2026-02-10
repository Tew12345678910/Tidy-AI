/**
 * API Route: /api/ai/models
 * 
 * List available models from AI provider
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAIClient } from '@/lib/ai-client';
import { getSettingsManager } from '@/lib/settings-manager';

export const runtime = 'nodejs';

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
    
    const models = await client.listModels();
    
    return NextResponse.json({
      provider: settings.aiProvider,
      models,
    });
    
  } catch (error) {
    console.error('[API /api/ai/models] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to list models',
      },
      { status: 500 }
    );
  }
}
