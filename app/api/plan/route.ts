/**
 * API Route: /api/plan
 * 
 * Generates an organization plan from a manifest (PHASE 2)
 */

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { generatePlan, savePlan, saveRollback } from '@/lib/plan-generator';
import { PlanRequest, PlanResponse, Manifest } from '@/lib/types';
import { getSettingsManager } from '@/lib/settings-manager';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const body: PlanRequest = await request.json();
    
    const { manifestId, destRoot, preferences } = body;
    
    if (!manifestId || !destRoot) {
      return NextResponse.json(
        { error: 'manifestId and destRoot are required' },
        { status: 400 }
      );
    }
    
    // For now, expect manifest to be passed in body
    // In production, you might load it from disk by ID
    const manifest = (body as any).manifest as Manifest;
    
    if (!manifest) {
      return NextResponse.json(
        { error: 'manifest data is required' },
        { status: 400 }
      );
    }
    
    // Load settings and merge preferences
    const settingsManager = getSettingsManager();
    const settings = await settingsManager.get();
    
    const userPreferences = {
      ...settings.preferences,
      ...preferences,
    };
    
    console.log('[API /api/plan] Generating plan for manifest:', manifestId);
    
    // Generate plan
    const { plan, rollback } = await generatePlan(
      manifest,
      destRoot,
      userPreferences
    );
    
    // Save plan and rollback to disk
    const outputDir = path.join(destRoot, '_tidyai');
    const planFilePath = await savePlan(plan, outputDir);
    const rollbackFilePath = await saveRollback(rollback, outputDir);
    
    const response: PlanResponse = {
      plan,
      planFilePath,
      rollbackFilePath,
    };
    
    console.log('[API /api/plan] Plan complete:', plan.id);
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('[API /api/plan] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to generate plan',
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
