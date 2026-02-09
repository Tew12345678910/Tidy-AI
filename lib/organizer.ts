import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import os from "os";
import {
  getCategoryFromExtension,
  isGenericFilename,
  CATEGORY_MAP,
} from "./categories";
import { categorizeWithOllama } from "./ollama";

export interface OrganizationOptions {
  sourceFolder: string;
  destFolder: string;
  useOllama: boolean;
  ollamaModel: string;
  detectDuplicates: boolean;
}

export interface FileOperation {
  src: string;
  dst: string;
  category: string;
  reason: string;
}

export interface OrganizationPlan {
  source: string;
  dest: string;
  createdAt: string;
  count: number;
  operations: FileOperation[];
}

export interface PlanResult {
  plan: OrganizationPlan;
  filesWritten: {
    planJson: string;
    planCsv: string;
    summaryTxt: string;
  };
  stats: {
    totalFiles: number;
    categoryCounts: Record<string, number>;
    unknownCount: number;
    duplicateCount: number;
  };
}

export interface ApplyResult {
  result: {
    appliedCount: number;
    errors: string[];
  };
  logPath: string;
}

function expandTilde(filepath: string): string {
  if (filepath.startsWith("~/")) {
    return path.join(os.homedir(), filepath.slice(2));
  }
  return filepath;
}

async function getFileHash(filepath: string): Promise<string> {
  const buffer = await fs.readFile(filepath);
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

async function fileExists(filepath: string): Promise<boolean> {
  try {
    await fs.access(filepath);
    return true;
  } catch {
    return false;
  }
}

function getUniqueFilePath(destPath: string): string {
  let counter = 2;
  let uniquePath = destPath;
  const ext = path.extname(destPath);
  const base = destPath.slice(0, -ext.length);

  while (true) {
    try {
      require("fs").accessSync(uniquePath);
      uniquePath = `${base} (${counter})${ext}`;
      counter++;
    } catch {
      break;
    }
  }

  return uniquePath;
}

async function getAllFiles(
  dir: string,
  destFolder: string,
  fileList: string[] = []
): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    // Skip .DS_Store
    if (entry.name === ".DS_Store") continue;

    // Skip if already under destination
    if (fullPath.startsWith(destFolder)) continue;

    if (entry.isDirectory()) {
      // Recursively scan subdirectories
      await getAllFiles(fullPath, destFolder, fileList);
    } else if (entry.isFile()) {
      fileList.push(fullPath);
    }
  }

  return fileList;
}

export async function generatePlan(
  options: OrganizationOptions
): Promise<PlanResult> {
  const sourceFolder = expandTilde(options.sourceFolder);
  const destFolder = expandTilde(options.destFolder);

  // Ensure source exists
  await fs.access(sourceFolder);

  // Recursively get all files
  const allFilePaths = await getAllFiles(sourceFolder, destFolder);

  const operations: FileOperation[] = [];
  const fileHashes = new Map<string, string[]>(); // hash -> [filenames]
  const categoryCounts: Record<string, number> = {};
  let unknownCount = 0;
  let duplicateCount = 0;

  for (const filePath of allFilePaths) {
    const stats = await fs.stat(filePath);
    const modifiedDate = new Date(stats.mtime);
    const year = modifiedDate.getFullYear();
    const month = String(modifiedDate.getMonth() + 1).padStart(2, "0");

    const fileName = path.basename(filePath);
    const ext = path.extname(fileName);
    const basename = path.basename(fileName, ext);

    let category = getCategoryFromExtension(ext);
    let reason = "Extension match";

    // Check if unknown or generic
    const isUnknown = !category || isGenericFilename(basename);

    if (isUnknown && options.useOllama) {
      unknownCount++;
      try {
        category = await categorizeWithOllama(
          fileName,
          ext,
          options.ollamaModel
        );
        reason = "Ollama categorization";
      } catch (error) {
        category = "Other";
        reason = "Ollama failed, defaulted to Other";
      }
    } else if (!category) {
      category = "Other";
      reason = "Unknown extension";
    }

    // Check for duplicates
    if (options.detectDuplicates) {
      const fileSize = stats.size;
      const hash = await getFileHash(filePath);
      const hashKey = `${fileSize}-${hash}`;

      if (fileHashes.has(hashKey)) {
        category = "Duplicates";
        reason = "Duplicate file detected";
        duplicateCount++;
      } else {
        fileHashes.set(hashKey, [fileName]);
      }
    }

    // Build destination path
    const categoryFolder = `${year}/${month} - ${category}`;
    const destPath = path.join(destFolder, categoryFolder, fileName);

    operations.push({
      src: filePath,
      dst: destPath,
      category,
      reason,
    });

    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  }

  const plan: OrganizationPlan = {
    source: sourceFolder,
    dest: destFolder,
    createdAt: new Date().toISOString(),
    count: operations.length,
    operations,
  };

  // Write plan files
  const plansDir = path.join(destFolder, "_plans");
  await fs.mkdir(plansDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const planJsonPath = path.join(plansDir, `plan-${timestamp}.json`);
  const planCsvPath = path.join(plansDir, `plan-${timestamp}.csv`);
  const summaryTxtPath = path.join(plansDir, `summary-${timestamp}.txt`);

  await fs.writeFile(planJsonPath, JSON.stringify(plan, null, 2));

  // CSV
  const csvLines = [
    "Source,Destination,Category,Reason",
    ...operations.map(
      (op) => `"${op.src}","${op.dst}","${op.category}","${op.reason}"`
    ),
  ];
  await fs.writeFile(planCsvPath, csvLines.join("\n"));

  // Summary
  const summaryLines = [
    `Organization Plan Summary`,
    `Generated: ${plan.createdAt}`,
    `Source: ${plan.source}`,
    `Destination: ${plan.dest}`,
    `Total Files: ${plan.count}`,
    ``,
    `Category Breakdown:`,
    ...Object.entries(categoryCounts).map(
      ([cat, count]) => `  ${cat}: ${count}`
    ),
    ``,
    `Unknown Files (Ollama used): ${unknownCount}`,
    `Duplicates Found: ${duplicateCount}`,
  ];
  await fs.writeFile(summaryTxtPath, summaryLines.join("\n"));

  return {
    plan,
    filesWritten: {
      planJson: planJsonPath,
      planCsv: planCsvPath,
      summaryTxt: summaryTxtPath,
    },
    stats: {
      totalFiles: operations.length,
      categoryCounts,
      unknownCount,
      duplicateCount,
    },
  };
}

export async function applyPlan(plan: OrganizationPlan): Promise<ApplyResult> {
  const errors: string[] = [];
  let appliedCount = 0;

  const appliedOperations: FileOperation[] = [];

  for (const operation of plan.operations) {
    try {
      const destDir = path.dirname(operation.dst);
      await fs.mkdir(destDir, { recursive: true });

      // Check for collision
      let finalDest = operation.dst;
      if (await fileExists(operation.dst)) {
        finalDest = getUniqueFilePath(operation.dst);
      }

      // Move file
      await fs.rename(operation.src, finalDest);
      appliedCount++;

      appliedOperations.push({
        ...operation,
        dst: finalDest,
      });
    } catch (error) {
      const errorMsg = `Failed to move ${operation.src}: ${
        error instanceof Error ? error.message : String(error)
      }`;
      errors.push(errorMsg);
      console.error(errorMsg);
    }
  }

  // Write logs
  const plansDir = path.join(plan.dest, "_plans");
  await fs.mkdir(plansDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const actionsLogPath = path.join(plansDir, `actions-${timestamp}.log`);
  const appliedJsonPath = path.join(plansDir, `applied-${timestamp}.json`);

  const logLines = [
    `=== File Organization Applied ===`,
    `Timestamp: ${new Date().toISOString()}`,
    `Applied: ${appliedCount}/${plan.count}`,
    `Errors: ${errors.length}`,
    ``,
    ...appliedOperations.map(
      (op) => `MOVED: ${op.src} -> ${op.dst} [${op.category}]`
    ),
  ];

  if (errors.length > 0) {
    logLines.push(``, `=== ERRORS ===`, ...errors);
  }

  await fs.writeFile(actionsLogPath, logLines.join("\n"));
  await fs.writeFile(
    appliedJsonPath,
    JSON.stringify({ appliedOperations, errors }, null, 2)
  );

  return {
    result: {
      appliedCount,
      errors,
    },
    logPath: actionsLogPath,
  };
}
