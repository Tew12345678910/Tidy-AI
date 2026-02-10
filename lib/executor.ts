/**
 * PHASE 3: EXECUTE Engine
 *
 * Executes approved plan actions:
 * - Atomic file operations (move/rename)
 * - Progress tracking
 * - Error handling
 * - Execution log generation
 * - Rollback file writing
 */

import fs from "fs/promises";
import path from "path";
import {
  Plan,
  PlanAction,
  ExecutionReport,
  ExecutionResult,
  ExecutionStatus,
  Rollback,
  RollbackEntry,
} from "./types";

export interface ExecuteOptions {
  dryRun?: boolean;
  selectedActionIds?: string[];
  onProgress?: (current: number, total: number, action: PlanAction) => void;
}

/**
 * Execute a plan
 */
export async function executePlan(
  plan: Plan,
  options: ExecuteOptions = {}
): Promise<ExecutionReport> {
  console.log(`[EXECUTE] Starting execution of plan ${plan.id}`);
  console.log(`[EXECUTE] Dry run: ${options.dryRun ? "YES" : "NO"}`);

  // Filter actions to execute
  let actionsToExecute = plan.actions.filter((a) => a.actionType !== "skip");

  if (options.selectedActionIds && options.selectedActionIds.length > 0) {
    actionsToExecute = actionsToExecute.filter((a) =>
      options.selectedActionIds!.includes(a.id)
    );
  } else {
    // Execute only approved actions if no selection provided
    actionsToExecute = actionsToExecute.filter((a) => a.approved);
  }

  console.log(`[EXECUTE] Executing ${actionsToExecute.length} actions`);

  const results: ExecutionResult[] = [];
  const rollbackEntries: RollbackEntry[] = [];

  let completed = 0;
  let failed = 0;
  let skipped = 0;

  // Execute actions
  for (let i = 0; i < actionsToExecute.length; i++) {
    const action = actionsToExecute[i];

    // Progress callback
    if (options.onProgress) {
      options.onProgress(i + 1, actionsToExecute.length, action);
    }

    console.log(
      `[EXECUTE] [${i + 1}/${actionsToExecute.length}] ${action.from} -> ${
        action.to
      }`
    );

    try {
      let actualDestination = action.to;

      if (!options.dryRun) {
        actualDestination = await executeAction(action);

        // Add to rollback
        rollbackEntries.push({
          from: actualDestination,
          to: action.from,
          actionId: action.id,
          timestamp: new Date().toISOString(),
        });
      }

      results.push({
        actionId: action.id,
        status: "completed",
        actualDestination,
        timestamp: new Date().toISOString(),
      });

      completed++;
    } catch (error) {
      console.error(`[EXECUTE] Failed: ${error}`);

      results.push({
        actionId: action.id,
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      });

      failed++;
    }
  }

  // Add skipped actions
  const skippedActions = plan.actions.filter((a) => a.actionType === "skip");
  for (const action of skippedActions) {
    results.push({
      actionId: action.id,
      status: "skipped",
      timestamp: new Date().toISOString(),
    });
    skipped++;
  }

  const rollback: Rollback = {
    planId: plan.id,
    createdAt: new Date().toISOString(),
    entries: rollbackEntries,
  };

  const report: ExecutionReport = {
    planId: plan.id,
    executedAt: new Date().toISOString(),
    results,
    summary: {
      total: actionsToExecute.length,
      completed,
      failed,
      skipped,
    },
    rollback,
  };

  console.log(`[EXECUTE] Execution complete`);
  console.log(`  - Completed: ${completed}`);
  console.log(`  - Failed: ${failed}`);
  console.log(`  - Skipped: ${skipped}`);

  return report;
}

/**
 * Execute a single action
 */
async function executeAction(action: PlanAction): Promise<string> {
  const { from, to, actionType } = action;

  // Ensure destination directory exists
  const destDir = path.dirname(to);
  await fs.mkdir(destDir, { recursive: true });

  // Check if destination already exists
  let finalDestination = to;
  try {
    await fs.access(finalDestination);
    // File exists, need to find unique name
    finalDestination = await findUniqueDestination(to);
  } catch {
    // File doesn't exist, proceed
  }

  // Perform the move/rename
  switch (actionType) {
    case "move":
    case "rename":
    case "move-rename":
      await fs.rename(from, finalDestination);
      break;

    default:
      throw new Error(`Unknown action type: ${actionType}`);
  }

  return finalDestination;
}

/**
 * Find unique destination if file exists
 */
async function findUniqueDestination(destPath: string): Promise<string> {
  let counter = 1;
  const ext = path.extname(destPath);
  const base = destPath.slice(0, -ext.length);

  while (true) {
    const newPath = `${base} (${counter})${ext}`;
    try {
      await fs.access(newPath);
      counter++;
    } catch {
      return newPath;
    }
  }
}

/**
 * Execute rollback (undo executed actions)
 */
export async function executeRollback(
  rollback: Rollback,
  options: ExecuteOptions = {}
): Promise<ExecutionReport> {
  console.log(`[ROLLBACK] Starting rollback for plan ${rollback.planId}`);
  console.log(`[ROLLBACK] Rolling back ${rollback.entries.length} actions`);

  const results: ExecutionResult[] = [];
  let completed = 0;
  let failed = 0;

  // Execute rollback in reverse order
  const entries = [...rollback.entries].reverse();

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    if (options.onProgress) {
      options.onProgress(i + 1, entries.length, {
        id: entry.actionId,
        from: entry.from,
        to: entry.to,
        fromRelative: "",
        toRelative: "",
        actionType: "move",
        reason: "Rollback",
        confidence: 1.0,
      });
    }

    console.log(
      `[ROLLBACK] [${i + 1}/${entries.length}] ${entry.from} -> ${entry.to}`
    );

    try {
      if (!options.dryRun) {
        // Check if source file exists
        try {
          await fs.access(entry.from);
        } catch {
          throw new Error(`Source file not found: ${entry.from}`);
        }

        // Ensure destination directory exists
        const destDir = path.dirname(entry.to);
        await fs.mkdir(destDir, { recursive: true });

        // Move file back
        await fs.rename(entry.from, entry.to);
      }

      results.push({
        actionId: entry.actionId,
        status: "completed",
        timestamp: new Date().toISOString(),
      });

      completed++;
    } catch (error) {
      console.error(`[ROLLBACK] Failed: ${error}`);

      results.push({
        actionId: entry.actionId,
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      });

      failed++;
    }
  }

  const report: ExecutionReport = {
    planId: rollback.planId,
    executedAt: new Date().toISOString(),
    results,
    summary: {
      total: entries.length,
      completed,
      failed,
      skipped: 0,
    },
    rollback: {
      planId: rollback.planId,
      createdAt: rollback.createdAt,
      entries: [],
    },
  };

  console.log(`[ROLLBACK] Rollback complete`);
  console.log(`  - Completed: ${completed}`);
  console.log(`  - Failed: ${failed}`);

  return report;
}

/**
 * Save execution report to disk
 */
export async function saveExecutionReport(
  report: ExecutionReport,
  outputDir: string
): Promise<string> {
  await fs.mkdir(outputDir, { recursive: true });

  const filename = `execution-${report.planId}.json`;
  const filepath = path.join(outputDir, filename);

  await fs.writeFile(filepath, JSON.stringify(report, null, 2));

  console.log(`[EXECUTE] Report saved to ${filepath}`);
  return filepath;
}

/**
 * Save execution log as human-readable text
 */
export async function saveExecutionLog(
  report: ExecutionReport,
  plan: Plan,
  outputDir: string
): Promise<string> {
  await fs.mkdir(outputDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `execution-log-${timestamp}.txt`;
  const filepath = path.join(outputDir, filename);

  const lines: string[] = [
    "=".repeat(80),
    "FILE ORGANIZATION EXECUTION LOG",
    "=".repeat(80),
    "",
    `Plan ID: ${report.planId}`,
    `Executed: ${report.executedAt}`,
    "",
    `Summary:`,
    `  Total actions: ${report.summary.total}`,
    `  Completed: ${report.summary.completed}`,
    `  Failed: ${report.summary.failed}`,
    `  Skipped: ${report.summary.skipped}`,
    "",
    "=".repeat(80),
    "ACTIONS",
    "=".repeat(80),
    "",
  ];

  for (const result of report.results) {
    const action = plan.actions.find((a) => a.id === result.actionId);
    if (!action) continue;

    const statusSymbol =
      result.status === "completed"
        ? "✓"
        : result.status === "failed"
        ? "✗"
        : "-";

    lines.push(
      `${statusSymbol} [${result.status.toUpperCase()}] ${action.actionType}`
    );
    lines.push(`  From: ${action.from}`);
    lines.push(`  To:   ${result.actualDestination || action.to}`);
    lines.push(`  Reason: ${action.reason}`);
    lines.push(`  Confidence: ${(action.confidence * 100).toFixed(0)}%`);

    if (result.error) {
      lines.push(`  ERROR: ${result.error}`);
    }

    lines.push("");
  }

  if (report.rollback.entries.length > 0) {
    lines.push("=".repeat(80));
    lines.push("ROLLBACK INFORMATION");
    lines.push("=".repeat(80));
    lines.push("");
    lines.push(`To undo these changes, use the rollback file:`);
    lines.push(`  rollback-${report.planId}.json`);
    lines.push("");
  }

  await fs.writeFile(filepath, lines.join("\n"));

  console.log(`[EXECUTE] Log saved to ${filepath}`);
  return filepath;
}

/**
 * Save rollback file
 */
export async function saveRollbackFile(
  rollback: Rollback,
  outputDir: string
): Promise<string> {
  await fs.mkdir(outputDir, { recursive: true });

  const filename = `rollback-${rollback.planId}.json`;
  const filepath = path.join(outputDir, filename);

  await fs.writeFile(filepath, JSON.stringify(rollback, null, 2));

  console.log(`[ROLLBACK] File saved to ${filepath}`);
  return filepath;
}
