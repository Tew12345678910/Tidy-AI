/**
 * PHASE 2: PLAN Generator
 *
 * Generates an organization plan from a manifest:
 * - AI proposes moves based on classification
 * - Rules enforce safety (no moving inside project roots)
 * - Collision detection and resolution
 * - Rollback mapping generation
 */

import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import {
  Manifest,
  ManifestEntry,
  Plan,
  PlanAction,
  SafetyCheck,
  Rollback,
  RollbackEntry,
  UserPreferences,
  ActionType,
} from "./types";
import { validateNoProjectRootViolations } from "./project-detector";
import { getOllamaClient } from "./ollama-client";
import { generateCleanTitle } from "./pdf-extractor";

/**
 * Generate organization plan from manifest
 */
export async function generatePlan(
  manifest: Manifest,
  destRoot: string,
  preferences: UserPreferences
): Promise<{ plan: Plan; rollback: Rollback }> {
  const planId = generateId();
  console.log(`[PLAN] Generating plan ${planId} for manifest ${manifest.id}`);

  const actions: PlanAction[] = [];
  const projectRoots = extractProjectRootsFromManifest(manifest);

  // Step 1: Process each entry
  for (const entry of manifest.entries) {
    const action = await createAction(
      entry,
      destRoot,
      preferences,
      projectRoots,
      manifest
    );
    if (action) {
      actions.push(action);
    }
  }

  console.log(`[PLAN] Created ${actions.length} initial actions`);

  // Step 2: AI enhancement (for grouping and refinement)
  if (manifest.scanOptions.useAI && manifest.scanOptions.ollamaModel) {
    await enhanceActionsWithAI(actions, manifest, destRoot, preferences);
  }

  // Step 3: Collision detection and resolution
  console.log("[PLAN] Checking for collisions...");
  await resolveCollisions(actions, destRoot);

  // Step 4: Safety checks
  console.log("[PLAN] Running safety checks...");
  const safetyCheck = performSafetyCheck(actions, projectRoots);

  if (!safetyCheck.passed) {
    console.error("[PLAN] Safety check failed!");
    console.error("Errors:", safetyCheck.errors);
  }

  // Step 5: Generate summary
  const summary = generatePlanSummary(actions);

  const plan: Plan = {
    id: planId,
    manifestId: manifest.id,
    createdAt: new Date().toISOString(),
    destRoot,
    actions,
    safetyCheck,
    summary,
    userPreferences: preferences,
  };

  // Step 6: Generate rollback mapping
  const rollback = generateRollback(plan);

  console.log(`[PLAN] Plan complete: ${summary.totalActions} actions`);
  console.log(`  - High confidence: ${summary.highConfidence}`);
  console.log(`  - Medium confidence: ${summary.mediumConfidence}`);
  console.log(`  - Low confidence: ${summary.lowConfidence}`);

  return { plan, rollback };
}

/**
 * Create action for a manifest entry
 */
async function createAction(
  entry: ManifestEntry,
  destRoot: string,
  preferences: UserPreferences,
  projectRoots: Map<string, any>,
  manifest: Manifest
): Promise<PlanAction | null> {
  // Skip if recommended to keep
  if (entry.recommendedHandling === "keep") {
    return {
      id: generateId(),
      from: entry.path,
      fromRelative: entry.relativePath,
      to: entry.path,
      toRelative: entry.relativePath,
      actionType: "skip",
      reason: "Recommended to keep in place (project root or generated folder)",
      confidence: 1.0,
      isProjectRoot: entry.type === "ProjectRoot",
      approved: false,
    };
  }

  // Files inside project roots should never be moved
  if (entry.isInsideProjectRoot) {
    return {
      id: generateId(),
      from: entry.path,
      fromRelative: entry.relativePath,
      to: entry.path,
      toRelative: entry.relativePath,
      actionType: "skip",
      reason: `Inside project root: ${entry.parentProjectRoot}`,
      confidence: 1.0,
      movesInsideProjectRoot: true,
      approved: false,
    };
  }

  // Determine destination path
  const destPath = determinDestinationPath(entry, destRoot, preferences);
  const destRelative = path.relative(destRoot, destPath);

  // Validate against project root violations
  const validation = validateNoProjectRootViolations(
    entry.path,
    destPath,
    projectRoots
  );

  if (!validation.valid) {
    return {
      id: generateId(),
      from: entry.path,
      fromRelative: entry.relativePath,
      to: entry.path,
      toRelative: entry.relativePath,
      actionType: "skip",
      reason: `Safety violation: ${validation.error}`,
      confidence: 1.0,
      approved: false,
    };
  }

  // Determine action type
  const actionType = determineActionType(entry.path, destPath);

  // Build reason
  const reason = buildActionReason(entry, actionType);

  // Auto-approve based on confidence
  const approved =
    entry.confidence >= preferences.confidenceThresholds.autoApprove;

  return {
    id: generateId(),
    from: entry.path,
    fromRelative: entry.relativePath,
    to: destPath,
    toRelative: destRelative,
    actionType,
    reason,
    confidence: entry.confidence,
    category: entry.suggestedCategory,
    tags: entry.suggestedTags,
    approved,
  };
}

/**
 * Determine destination path for an entry
 */
function determinDestinationPath(
  entry: ManifestEntry,
  destRoot: string,
  preferences: UserPreferences
): string {
  // For documents with good metadata, use subject-based organization
  if (entry.type === "Document" && entry.metadata) {
    const cleanTitle = generateCleanTitle(entry.metadata, entry.name);
    const subject =
      entry.suggestedCategory || entry.metadata.subject || "Documents";

    // Apply naming preferences
    const filename = applyNamingPreferences(
      cleanTitle + entry.extension,
      preferences.naming
    );

    return path.join(destRoot, subject, filename);
  }

  // For media, organize by category
  if (entry.type === "Media") {
    const category = entry.suggestedCategory || "Media";
    const filename = applyNamingPreferences(entry.name, preferences.naming);
    return path.join(destRoot, category, filename);
  }

  // For archives, use Archives folder
  if (entry.type === "Archive") {
    const filename = applyNamingPreferences(entry.name, preferences.naming);
    return path.join(destRoot, "Archives", filename);
  }

  // For code files (loose, not in project), use Code folder
  if (entry.type === "Code") {
    const filename = applyNamingPreferences(entry.name, preferences.naming);
    return path.join(destRoot, "Code", filename);
  }

  // For unknown or low-confidence items, use Inbox/Review
  if (entry.confidence < preferences.confidenceThresholds.requireReview) {
    return path.join(destRoot, "Inbox", entry.name);
  }

  // Default: use suggested category or 'Other'
  const category = entry.suggestedCategory || "Other";
  const filename = applyNamingPreferences(entry.name, preferences.naming);
  return path.join(destRoot, category, filename);
}

/**
 * Apply naming preferences to a filename
 */
function applyNamingPreferences(
  filename: string,
  preferences: UserPreferences["naming"]
): string {
  const ext = path.extname(filename);
  let base = path.basename(filename, ext);

  // Remove special characters if requested
  if (preferences.removeSpecialChars) {
    base = base.replace(/[^\w\s-]/g, "");
  }

  // Apply naming style
  switch (preferences.style) {
    case "lowercase":
      base = base.toLowerCase();
      break;
    case "titlecase":
      base = base.replace(/\b\w/g, (c) => c.toUpperCase());
      break;
    case "camelcase":
      base = base.replace(/[\s-]+(.)/g, (_, c) => c.toUpperCase());
      break;
    // 'original' - keep as is
  }

  return base + ext;
}

/**
 * Determine action type based on source and destination
 */
function determineActionType(from: string, to: string): ActionType {
  if (from === to) {
    return "skip";
  }

  const fromDir = path.dirname(from);
  const toDir = path.dirname(to);
  const fromName = path.basename(from);
  const toName = path.basename(to);

  if (fromDir === toDir && fromName !== toName) {
    return "rename";
  }

  if (fromDir !== toDir && fromName === toName) {
    return "move";
  }

  return "move-rename";
}

/**
 * Build action reason string
 */
function buildActionReason(
  entry: ManifestEntry,
  actionType: ActionType
): string {
  const reasons: string[] = [];

  if (entry.suggestedCategory) {
    reasons.push(`Category: ${entry.suggestedCategory}`);
  }

  if (entry.metadata?.title) {
    reasons.push(`Title: ${entry.metadata.title}`);
  }

  if (entry.metadata?.subject) {
    reasons.push(`Subject: ${entry.metadata.subject}`);
  }

  if (entry.signals.length > 0) {
    reasons.push(entry.signals[0]); // Include first signal
  }

  return reasons.join(" | ");
}

/**
 * Enhance actions with AI suggestions
 */
async function enhanceActionsWithAI(
  actions: PlanAction[],
  manifest: Manifest,
  destRoot: string,
  preferences: UserPreferences
): Promise<void> {
  // For now, AI enhancement is limited to avoid overwhelming the model
  // In a production system, you might batch similar items or use AI for refinement

  console.log("[PLAN] AI enhancement would run here (skipped for performance)");

  // Future: Group similar documents, suggest better folder names, etc.
}

/**
 * Resolve collisions in action destinations
 */
async function resolveCollisions(
  actions: PlanAction[],
  destRoot: string
): Promise<void> {
  const destinationMap = new Map<string, PlanAction[]>();

  // Group actions by destination
  for (const action of actions) {
    if (action.actionType === "skip") continue;

    const dest = action.to;
    if (!destinationMap.has(dest)) {
      destinationMap.set(dest, []);
    }
    destinationMap.get(dest)!.push(action);
  }

  // Resolve collisions
  for (const [dest, conflictingActions] of destinationMap) {
    if (conflictingActions.length > 1) {
      // Multiple actions targeting same destination
      console.log(
        `[PLAN] Collision detected at ${dest}: ${conflictingActions.length} files`
      );

      // Keep first action as-is, add suffix to others
      for (let i = 1; i < conflictingActions.length; i++) {
        const action = conflictingActions[i];
        const newDest = getUniqueDestination(dest, i + 1);

        action.to = newDest;
        action.toRelative = path.relative(destRoot, newDest);
        action.hasCollision = true;
        action.collisionResolution = "suffix";
        action.reason += " | Collision resolved with suffix";
      }
    }

    // Also check if destination already exists on disk
    try {
      await fs.access(dest);
      // File exists
      const action = conflictingActions[0];
      action.hasCollision = true;
      action.collisionResolution = "suffix";

      const newDest = await findNextAvailableDestination(dest);
      action.to = newDest;
      action.toRelative = path.relative(destRoot, newDest);
      action.reason += " | Existing file, added suffix";
    } catch {
      // File doesn't exist, no problem
    }
  }
}

/**
 * Get unique destination by adding suffix
 */
function getUniqueDestination(destPath: string, counter: number): string {
  const ext = path.extname(destPath);
  const base = destPath.slice(0, -ext.length);
  return `${base} (${counter})${ext}`;
}

/**
 * Find next available destination that doesn't exist
 */
async function findNextAvailableDestination(destPath: string): Promise<string> {
  let counter = 1;
  let newPath = getUniqueDestination(destPath, counter);

  while (true) {
    try {
      await fs.access(newPath);
      // File exists, try next counter
      counter++;
      newPath = getUniqueDestination(destPath, counter);
    } catch {
      // File doesn't exist, use this path
      return newPath;
    }
  }
}

/**
 * Perform safety checks on the plan
 */
function performSafetyCheck(
  actions: PlanAction[],
  projectRoots: Map<string, any>
): SafetyCheck {
  const errors: string[] = [];
  const warnings: string[] = [];
  const overwrites: string[] = [];
  const collisionsResolved: string[] = [];
  let lowConfidenceActions = 0;
  let skippedItems = 0;
  let movedInsideProjectRoot = false;

  for (const action of actions) {
    // Check for project root violations
    if (action.movesInsideProjectRoot) {
      movedInsideProjectRoot = true;
      errors.push(
        `Action ${action.id} attempts to move file inside project root`
      );
    }

    // Check for low confidence
    if (action.confidence < 0.5 && action.actionType !== "skip") {
      lowConfidenceActions++;
      warnings.push(
        `Action ${action.id} has low confidence (${action.confidence})`
      );
    }

    // Track skipped items
    if (action.actionType === "skip") {
      skippedItems++;
    }

    // Track collisions
    if (action.hasCollision) {
      collisionsResolved.push(action.to);
    }
  }

  const passed = errors.length === 0 && !movedInsideProjectRoot;

  return {
    passed,
    errors,
    warnings,
    checks: {
      movedInsideProjectRoot,
      overwrites,
      collisionsResolved,
      lowConfidenceActions,
      skippedItems,
    },
  };
}

/**
 * Generate plan summary
 */
function generatePlanSummary(actions: PlanAction[]) {
  const summary = {
    totalActions: actions.length,
    moves: 0,
    renames: 0,
    skips: 0,
    categoryCounts: {} as Record<string, number>,
    highConfidence: 0,
    mediumConfidence: 0,
    lowConfidence: 0,
  };

  for (const action of actions) {
    // Count by action type
    switch (action.actionType) {
      case "move":
      case "move-rename":
        summary.moves++;
        break;
      case "rename":
        summary.renames++;
        break;
      case "skip":
        summary.skips++;
        break;
    }

    // Count by category
    if (action.category) {
      summary.categoryCounts[action.category] =
        (summary.categoryCounts[action.category] || 0) + 1;
    }

    // Count by confidence
    if (action.confidence >= 0.7) {
      summary.highConfidence++;
    } else if (action.confidence >= 0.4) {
      summary.mediumConfidence++;
    } else {
      summary.lowConfidence++;
    }
  }

  return summary;
}

/**
 * Generate rollback mapping
 */
function generateRollback(plan: Plan): Rollback {
  const entries: RollbackEntry[] = [];

  for (const action of plan.actions) {
    if (action.actionType !== "skip") {
      entries.push({
        from: action.to, // New location
        to: action.from, // Original location
        actionId: action.id,
        timestamp: plan.createdAt,
      });
    }
  }

  return {
    planId: plan.id,
    createdAt: plan.createdAt,
    entries,
  };
}

/**
 * Extract project roots from manifest
 */
function extractProjectRootsFromManifest(manifest: Manifest): Map<string, any> {
  const projectRoots = new Map();

  for (const entry of manifest.entries) {
    if (entry.type === "ProjectRoot" && entry.projectRoot) {
      projectRoots.set(entry.path, entry.projectRoot);
    }
  }

  return projectRoots;
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return crypto.randomBytes(16).toString("hex");
}

/**
 * Save plan to disk
 */
export async function savePlan(plan: Plan, outputDir: string): Promise<string> {
  await fs.mkdir(outputDir, { recursive: true });

  const filename = `plan-${plan.id}.json`;
  const filepath = path.join(outputDir, filename);

  await fs.writeFile(filepath, JSON.stringify(plan, null, 2));

  console.log(`[PLAN] Saved to ${filepath}`);
  return filepath;
}

/**
 * Save rollback to disk
 */
export async function saveRollback(
  rollback: Rollback,
  outputDir: string
): Promise<string> {
  await fs.mkdir(outputDir, { recursive: true });

  const filename = `rollback-${rollback.planId}.json`;
  const filepath = path.join(outputDir, filename);

  await fs.writeFile(filepath, JSON.stringify(rollback, null, 2));

  console.log(`[ROLLBACK] Saved to ${filepath}`);
  return filepath;
}
