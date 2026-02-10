/**
 * Project Root Detection Module
 *
 * Detects programming project roots using deterministic heuristics.
 * NEVER moves files inside project roots individually.
 */

import fs from "fs/promises";
import path from "path";
import {
  PROJECT_ROOT_SIGNALS,
  GENERATED_FOLDERS,
  ProjectRootDetection,
} from "./types";

/**
 * Check if a directory is a project root
 */
export async function detectProjectRoot(
  dirPath: string
): Promise<ProjectRootDetection> {
  const signals: string[] = [];
  let projectType: ProjectRootDetection["projectType"] = undefined;

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const entryNames = entries.map((e) => e.name);

    // Check for project root signals
    for (const signal of PROJECT_ROOT_SIGNALS) {
      if (entryNames.includes(signal)) {
        signals.push(signal);
      }
    }

    // No signals found
    if (signals.length === 0) {
      return {
        isProjectRoot: false,
        signals: [],
        confidence: 0,
      };
    }

    // Determine project type
    projectType = inferProjectType(signals);

    // Calculate confidence based on number and type of signals
    const confidence = calculateProjectConfidence(signals, projectType);

    return {
      isProjectRoot: true,
      signals,
      projectType,
      confidence,
    };
  } catch (error) {
    return {
      isProjectRoot: false,
      signals: [],
      confidence: 0,
    };
  }
}

/**
 * Infer project type from signals
 */
function inferProjectType(
  signals: string[]
): ProjectRootDetection["projectType"] {
  const signalSet = new Set(signals);

  // Node.js / JavaScript
  if (signalSet.has("package.json")) {
    return "node";
  }

  // Python
  if (
    signalSet.has("pyproject.toml") ||
    signalSet.has("requirements.txt") ||
    signalSet.has("Pipfile") ||
    signalSet.has("setup.py")
  ) {
    return "python";
  }

  // Rust
  if (signalSet.has("Cargo.toml")) {
    return "rust";
  }

  // Go
  if (signalSet.has("go.mod")) {
    return "go";
  }

  // Java
  if (
    signalSet.has("pom.xml") ||
    signalSet.has("build.gradle") ||
    signalSet.has("build.gradle.kts")
  ) {
    return "java";
  }

  // .NET
  if (signalSet.has(".sln") || signalSet.has(".csproj")) {
    return "dotnet";
  }

  // Ruby
  if (signalSet.has("Gemfile")) {
    return "ruby";
  }

  // PHP
  if (signalSet.has("composer.json")) {
    return "php";
  }

  // Git repo with multiple signals
  if (signalSet.has(".git") && signals.length > 1) {
    return "mixed";
  }

  return "mixed";
}

/**
 * Calculate confidence score for project detection
 */
function calculateProjectConfidence(
  signals: string[],
  projectType?: ProjectRootDetection["projectType"]
): number {
  // Base confidence from number of signals
  let confidence = Math.min(0.5 + signals.length * 0.1, 1.0);

  // Boost for strong signals
  const strongSignals = [
    ".git",
    "package.json",
    "Cargo.toml",
    "go.mod",
    "pom.xml",
    "pyproject.toml",
  ];

  const hasStrongSignal = signals.some((s) => strongSignals.includes(s));
  if (hasStrongSignal) {
    confidence = Math.min(confidence + 0.2, 1.0);
  }

  // Boost for clear project type
  if (projectType && projectType !== "mixed") {
    confidence = Math.min(confidence + 0.1, 1.0);
  }

  return Math.round(confidence * 100) / 100;
}

/**
 * Check if a path is a generated folder (should not be moved individually)
 */
export function isGeneratedFolder(dirName: string): boolean {
  return GENERATED_FOLDERS.includes(dirName as any);
}

/**
 * Find all project roots in a directory tree
 * Returns a map of project root paths to their detection info
 */
export async function findProjectRoots(
  rootPath: string,
  maxDepth: number = 10,
  currentDepth: number = 0,
  projectRoots: Map<string, ProjectRootDetection> = new Map()
): Promise<Map<string, ProjectRootDetection>> {
  if (currentDepth > maxDepth) {
    return projectRoots;
  }

  try {
    // Check if current directory is a project root
    const detection = await detectProjectRoot(rootPath);

    if (detection.isProjectRoot) {
      projectRoots.set(rootPath, detection);
      // Don't scan inside project roots
      return projectRoots;
    }

    // Scan subdirectories
    const entries = await fs.readdir(rootPath, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      // Skip hidden folders (except .git which we check)
      if (entry.name.startsWith(".") && entry.name !== ".git") continue;

      // Skip generated folders
      if (isGeneratedFolder(entry.name)) continue;

      // Skip common system folders
      if (entry.name === "Library" || entry.name === "System") continue;

      const subPath = path.join(rootPath, entry.name);
      await findProjectRoots(subPath, maxDepth, currentDepth + 1, projectRoots);
    }

    return projectRoots;
  } catch (error) {
    // Permission denied or other error, skip this directory
    return projectRoots;
  }
}

/**
 * Check if a file path is inside any project root
 */
export function isInsideProjectRoot(
  filePath: string,
  projectRoots: Map<string, ProjectRootDetection>
): { inside: boolean; projectRoot?: string } {
  for (const [projectRootPath] of projectRoots) {
    if (
      filePath.startsWith(projectRootPath + path.sep) ||
      filePath === projectRootPath
    ) {
      return { inside: true, projectRoot: projectRootPath };
    }
  }

  return { inside: false };
}

/**
 * Safety check: Ensure no files inside project roots are moved individually
 */
export function validateNoProjectRootViolations(
  sourcePath: string,
  destPath: string,
  projectRoots: Map<string, ProjectRootDetection>
): { valid: boolean; error?: string } {
  const sourceCheck = isInsideProjectRoot(sourcePath, projectRoots);
  const destCheck = isInsideProjectRoot(destPath, projectRoots);

  // Moving a file from inside a project root (not the root itself)
  if (sourceCheck.inside && sourcePath !== sourceCheck.projectRoot) {
    return {
      valid: false,
      error: `Cannot move file ${sourcePath} from inside project root ${sourceCheck.projectRoot}. Move the entire project instead.`,
    };
  }

  // Moving a file into a project root
  if (destCheck.inside) {
    return {
      valid: false,
      error: `Cannot move file into project root ${destCheck.projectRoot}.`,
    };
  }

  return { valid: true };
}

/**
 * Get a human-readable description of a project
 */
export function describeProject(detection: ProjectRootDetection): string {
  if (!detection.isProjectRoot) {
    return "Not a project";
  }

  const type = detection.projectType ? ` (${detection.projectType})` : "";
  const signals = detection.signals.slice(0, 3).join(", ");

  return `Project${type}: ${signals}${
    detection.signals.length > 3 ? "..." : ""
  }`;
}
