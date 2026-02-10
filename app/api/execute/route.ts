/**
 * API Route: /api/execute
 *
 * Executes an approved plan (PHASE 3)
 */

import { NextRequest, NextResponse } from "next/server";
import path from "path";
import {
  executePlan,
  saveExecutionReport,
  saveExecutionLog,
  saveRollbackFile,
} from "@/lib/executor";
import { ExecuteRequest, ExecuteResponse, Plan } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 600; // 10 minutes for large executions

export async function POST(request: NextRequest) {
  try {
    const body: ExecuteRequest = await request.json();

    const { planId, selectedActionIds, dryRun = false } = body;

    if (!planId) {
      return NextResponse.json(
        { error: "planId is required" },
        { status: 400 }
      );
    }

    // For now, expect plan to be passed in body
    // In production, you might load it from disk by ID
    const plan = (body as any).plan as Plan;

    if (!plan) {
      return NextResponse.json(
        { error: "plan data is required" },
        { status: 400 }
      );
    }

    console.log("[API /api/execute] Executing plan:", planId);
    console.log("[API /api/execute] Dry run:", dryRun);

    // Execute plan
    const report = await executePlan(plan, {
      dryRun,
      selectedActionIds,
    });

    // Save report and log
    const outputDir = path.join(plan.destRoot, "_tidyai");
    await saveExecutionReport(report, outputDir);
    const logFilePath = await saveExecutionLog(report, plan, outputDir);

    // Save rollback file if not dry run
    if (!dryRun && report.rollback.entries.length > 0) {
      await saveRollbackFile(report.rollback, outputDir);
    }

    const response: ExecuteResponse = {
      report,
      logFilePath,
    };

    console.log("[API /api/execute] Execution complete");
    console.log(`  - Completed: ${report.summary.completed}`);
    console.log(`  - Failed: ${report.summary.failed}`);

    return NextResponse.json(response);
  } catch (error) {
    console.error("[API /api/execute] Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to execute plan",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
