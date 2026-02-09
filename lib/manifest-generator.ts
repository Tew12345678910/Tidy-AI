/**
 * PHASE 1: MANIFEST Generator
 * 
 * Scans directory and generates a manifest with:
 * - Project root detection (deterministic)
 * - File classification (light AI for ambiguous cases)
 * - Document metadata extraction
 * - Safety checks
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import {
  Manifest,
  ManifestEntry,
  ScanOptions,
  ItemType,
  RecommendedHandling,
  DocumentMetadata,
} from './types';
import {
  detectProjectRoot,
  findProjectRoots,
  isInsideProjectRoot,
  isGeneratedFolder,
  describeProject,
} from './project-detector';
import {
  extractPdfMetadata,
  extractMetadataFromFilename,
  generateCleanTitle,
  extractFolderContext,
} from './pdf-extractor';
import { getOllamaClient } from './ollama-client';
import { getCategoryFromExtension } from './categories';

/**
 * Generate manifest from directory scan
 */
export async function generateManifest(options: ScanOptions): Promise<Manifest> {
  const manifestId = generateId();
  const startTime = Date.now();
  
  console.log(`[MANIFEST] Starting scan of ${options.rootPath}`);
  
  // Step 1: Find all project roots first
  console.log('[MANIFEST] Step 1: Detecting project roots...');
  const projectRoots = await findProjectRoots(
    options.rootPath,
    options.maxDepth || 10
  );
  
  console.log(`[MANIFEST] Found ${projectRoots.size} project roots`);
  for (const [rootPath, detection] of projectRoots) {
    console.log(`  - ${rootPath}: ${describeProject(detection)}`);
  }
  
  // Step 2: Scan all files and directories
  console.log('[MANIFEST] Step 2: Scanning files...');
  const entries: ManifestEntry[] = [];
  
  await scanDirectory(
    options.rootPath,
    options.rootPath,
    entries,
    projectRoots,
    options,
    0
  );
  
  console.log(`[MANIFEST] Scanned ${entries.length} items`);
  
  // Step 3: Generate summary
  const summary = generateSummary(entries);
  
  const manifest: Manifest = {
    id: manifestId,
    scanRoot: options.rootPath,
    createdAt: new Date().toISOString(),
    scanOptions: options,
    entries,
    summary,
  };
  
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`[MANIFEST] Completed in ${elapsed}s`);
  
  return manifest;
}

/**
 * Recursively scan directory
 */
async function scanDirectory(
  currentPath: string,
  rootPath: string,
  entries: ManifestEntry[],
  projectRoots: Map<string, any>,
  options: ScanOptions,
  depth: number
): Promise<void> {
  
  // Check depth limit
  if (options.maxDepth && depth > options.maxDepth) {
    return;
  }
  
  try {
    const dirEntries = await fs.readdir(currentPath, { withFileTypes: true });
    
    for (const dirent of dirEntries) {
      const fullPath = path.join(currentPath, dirent.name);
      const relativePath = path.relative(rootPath, fullPath);
      
      // Skip hidden files unless explicitly included
      if (!options.includeHidden && dirent.name.startsWith('.') && dirent.name !== '.git') {
        continue;
      }
      
      // Check ignore patterns
      if (shouldIgnore(relativePath, options.ignorePaths || [])) {
        continue;
      }
      
      if (dirent.isDirectory()) {
        // Check if this is a project root
        const isProjectRoot = projectRoots.has(fullPath);
        
        if (isProjectRoot) {
          // Add project root as a single entry
          const entry = await createProjectRootEntry(
            fullPath,
            relativePath,
            projectRoots.get(fullPath)!,
            options
          );
          entries.push(entry);
          // Don't scan inside project roots
          continue;
        }
        
        // Check if it's a generated folder
        if (isGeneratedFolder(dirent.name)) {
          const entry = await createGeneratedFolderEntry(fullPath, relativePath);
          entries.push(entry);
          // Don't scan inside generated folders
          continue;
        }
        
        // Recursively scan subdirectory
        await scanDirectory(
          fullPath,
          rootPath,
          entries,
          projectRoots,
          options,
          depth + 1
        );
      } else if (dirent.isFile()) {
        // Create file entry
        const entry = await createFileEntry(
          fullPath,
          relativePath,
          projectRoots,
          options
        );
        entries.push(entry);
      }
    }
  } catch (error) {
    console.error(`[MANIFEST] Error scanning ${currentPath}:`, error);
  }
}

/**
 * Create entry for a project root
 */
async function createProjectRootEntry(
  fullPath: string,
  relativePath: string,
  detection: any,
  options: ScanOptions
): Promise<ManifestEntry> {
  
  const stats = await fs.stat(fullPath);
  
  return {
    path: fullPath,
    relativePath,
    name: path.basename(fullPath),
    extension: '',
    size: stats.size,
    modifiedDate: stats.mtime.toISOString(),
    
    type: 'ProjectRoot',
    confidence: detection.confidence,
    signals: detection.signals.map((s: string) => `Project signal: ${s}`),
    
    projectRoot: detection,
    
    recommendedHandling: 'keep',
    suggestedCategory: 'Projects',
    suggestedTags: [detection.projectType || 'project'],
  };
}

/**
 * Create entry for a generated folder
 */
async function createGeneratedFolderEntry(
  fullPath: string,
  relativePath: string
): Promise<ManifestEntry> {
  
  const stats = await fs.stat(fullPath);
  
  return {
    path: fullPath,
    relativePath,
    name: path.basename(fullPath),
    extension: '',
    size: stats.size,
    modifiedDate: stats.mtime.toISOString(),
    
    type: 'Generated',
    confidence: 1.0,
    signals: ['Generated folder (node_modules, dist, etc.)'],
    
    recommendedHandling: 'keep',
  };
}

/**
 * Create entry for a file
 */
async function createFileEntry(
  fullPath: string,
  relativePath: string,
  projectRoots: Map<string, any>,
  options: ScanOptions
): Promise<ManifestEntry> {
  
  const stats = await fs.stat(fullPath);
  const name = path.basename(fullPath);
  const extension = path.extname(name).toLowerCase();
  
  // Check if file is inside a project root
  const projectCheck = isInsideProjectRoot(fullPath, projectRoots);
  
  // Base entry
  const entry: ManifestEntry = {
    path: fullPath,
    relativePath,
    name,
    extension,
    size: stats.size,
    modifiedDate: stats.mtime.toISOString(),
    
    type: 'Unknown',
    confidence: 0.5,
    signals: [],
    
    isInsideProjectRoot: projectCheck.inside,
    parentProjectRoot: projectCheck.projectRoot,
    
    recommendedHandling: 'review',
  };
  
  // Files inside project roots should not be moved
  if (projectCheck.inside) {
    entry.signals.push(`Inside project root: ${projectCheck.projectRoot}`);
    entry.recommendedHandling = 'keep';
    entry.confidence = 1.0;
    return entry;
  }
  
  // Classify file
  await classifyFile(entry, options);
  
  return entry;
}

/**
 * Classify a file and update its entry
 */
async function classifyFile(entry: ManifestEntry, options: ScanOptions): Promise<void> {
  
  // Step 1: Deterministic classification by extension
  const basicCategory = getCategoryFromExtension(entry.extension);
  
  if (basicCategory) {
    entry.signals.push(`Extension match: ${basicCategory}`);
  }
  
  // Step 2: Document-specific handling
  if (entry.extension === '.pdf' || 
      ['.doc', '.docx', '.txt', '.md'].includes(entry.extension)) {
    
    entry.type = 'Document';
    
    // Extract metadata if it's a PDF
    if (entry.extension === '.pdf' && options.extractPdfMetadata) {
      try {
        const metadata = await extractPdfMetadata(entry.path);
        entry.metadata = metadata;
        
        if (metadata.title) {
          entry.signals.push(`PDF title: ${metadata.title}`);
        }
        if (metadata.subject) {
          entry.signals.push(`PDF subject: ${metadata.subject}`);
        }
      } catch (error) {
        console.error(`Failed to extract PDF metadata: ${entry.path}`, error);
      }
    }
    
    // Try to extract metadata from filename
    if (!entry.metadata || !entry.metadata.title) {
      const filenameMetadata = extractMetadataFromFilename(entry.name);
      entry.metadata = { ...entry.metadata, ...filenameMetadata };
    }
    
    // Use AI for classification if enabled and we have metadata
    if (options.useAI && entry.metadata) {
      await classifyDocumentWithAI(entry, options);
    } else {
      // Fallback: basic classification
      entry.confidence = entry.metadata?.title ? 0.6 : 0.4;
      entry.suggestedCategory = basicCategory || 'Documents';
      entry.recommendedHandling = entry.confidence >= 0.6 ? 'group' : 'review';
    }
    
  } else if (['.jpg', '.jpeg', '.png', '.gif', '.heic', '.webp'].includes(entry.extension)) {
    entry.type = 'Media';
    entry.confidence = 0.8;
    entry.suggestedCategory = 'Images';
    entry.recommendedHandling = 'group';
    entry.signals.push('Image file');
    
  } else if (['.mp4', '.mov', '.avi', '.mkv'].includes(entry.extension)) {
    entry.type = 'Media';
    entry.confidence = 0.8;
    entry.suggestedCategory = 'Videos';
    entry.recommendedHandling = 'group';
    entry.signals.push('Video file');
    
  } else if (['.mp3', '.wav', '.m4a', '.flac'].includes(entry.extension)) {
    entry.type = 'Media';
    entry.confidence = 0.8;
    entry.suggestedCategory = 'Audio';
    entry.recommendedHandling = 'group';
    entry.signals.push('Audio file');
    
  } else if (['.zip', '.tar', '.gz', '.7z', '.rar'].includes(entry.extension)) {
    entry.type = 'Archive';
    entry.confidence = 0.9;
    entry.suggestedCategory = 'Archives';
    entry.recommendedHandling = 'group';
    entry.signals.push('Archive file');
    
  } else if (['.js', '.ts', '.py', '.java', '.cpp', '.c', '.h'].includes(entry.extension)) {
    entry.type = 'Code';
    entry.confidence = 0.7;
    entry.suggestedCategory = 'Code';
    entry.recommendedHandling = 'review'; // Code files need careful handling
    entry.signals.push('Source code file');
    
  } else {
    entry.type = 'Unknown';
    entry.confidence = 0.3;
    entry.recommendedHandling = 'review';
    entry.signals.push('Unknown file type');
  }
}

/**
 * Use AI to classify a document
 */
async function classifyDocumentWithAI(entry: ManifestEntry, options: ScanOptions): Promise<void> {
  if (!options.ollamaModel) {
    return;
  }
  
  try {
    const client = getOllamaClient({
      baseUrl: options.ollamaBaseUrl,
    });
    
    const folderContext = extractFolderContext(entry.path);
    
    const classification = await client.classifyDocument(options.ollamaModel, {
      filename: entry.name,
      extension: entry.extension,
      size: entry.size,
      metadata: entry.metadata,
      folderContext,
    });
    
    // Update entry with AI classification
    entry.suggestedCategory = classification.category;
    entry.confidence = classification.confidence;
    entry.signals.push(`AI classification: ${classification.reasoning}`);
    
    if (classification.subject) {
      if (!entry.metadata) entry.metadata = {};
      entry.metadata.subject = classification.subject;
    }
    
    if (classification.title) {
      if (!entry.metadata) entry.metadata = {};
      if (!entry.metadata.title) {
        entry.metadata.title = classification.title;
      }
    }
    
    // Determine handling based on confidence
    if (classification.confidence >= 0.7) {
      entry.recommendedHandling = 'group';
    } else if (classification.confidence >= 0.4) {
      entry.recommendedHandling = 'review';
    } else {
      entry.recommendedHandling = 'review';
    }
    
  } catch (error) {
    console.error(`AI classification failed for ${entry.name}:`, error);
    entry.signals.push('AI classification failed, using fallback');
  }
}

/**
 * Check if path should be ignored
 */
function shouldIgnore(relativePath: string, ignorePatterns: string[]): boolean {
  for (const pattern of ignorePatterns) {
    // Simple glob matching (supports * wildcard)
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    if (regex.test(relativePath)) {
      return true;
    }
  }
  return false;
}

/**
 * Generate summary statistics
 */
function generateSummary(entries: ManifestEntry[]) {
  const summary = {
    totalItems: entries.length,
    projectRoots: 0,
    documents: 0,
    media: 0,
    archives: 0,
    code: 0,
    unknown: 0,
    highConfidence: 0,
    mediumConfidence: 0,
    lowConfidence: 0,
  };
  
  for (const entry of entries) {
    // Count by type
    switch (entry.type) {
      case 'ProjectRoot':
        summary.projectRoots++;
        break;
      case 'Document':
        summary.documents++;
        break;
      case 'Media':
        summary.media++;
        break;
      case 'Archive':
        summary.archives++;
        break;
      case 'Code':
        summary.code++;
        break;
      default:
        summary.unknown++;
    }
    
    // Count by confidence
    if (entry.confidence >= 0.8) {
      summary.highConfidence++;
    } else if (entry.confidence >= 0.5) {
      summary.mediumConfidence++;
    } else {
      summary.lowConfidence++;
    }
  }
  
  return summary;
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Save manifest to disk
 */
export async function saveManifest(manifest: Manifest, outputDir: string): Promise<string> {
  await fs.mkdir(outputDir, { recursive: true });
  
  const filename = `manifest-${manifest.id}.json`;
  const filepath = path.join(outputDir, filename);
  
  await fs.writeFile(filepath, JSON.stringify(manifest, null, 2));
  
  console.log(`[MANIFEST] Saved to ${filepath}`);
  return filepath;
}
