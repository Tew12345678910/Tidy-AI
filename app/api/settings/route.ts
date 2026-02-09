/**
 * API Route: /api/settings
 * 
 * Manage application settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSettingsManager } from '@/lib/settings-manager';
import { Settings } from '@/lib/types';

export const runtime = 'nodejs';

/**
 * GET /api/settings
 * Retrieve current settings
 */
export async function GET(request: NextRequest) {
  try {
    const settingsManager = getSettingsManager();
    const settings = await settingsManager.get();
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('[API /api/settings] GET Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to load settings',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings
 * Update settings
 */
export async function POST(request: NextRequest) {
  try {
    const body: Partial<Settings> = await request.json();
    
    const settingsManager = getSettingsManager();
    const updated = await settingsManager.update(body);
    
    return NextResponse.json(updated);
  } catch (error) {
    console.error('[API /api/settings] POST Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to update settings',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/settings
 * Reset settings to defaults
 */
export async function DELETE(request: NextRequest) {
  try {
    const settingsManager = getSettingsManager();
    const settings = await settingsManager.reset();
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('[API /api/settings] DELETE Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to reset settings',
      },
      { status: 500 }
    );
  }
}
