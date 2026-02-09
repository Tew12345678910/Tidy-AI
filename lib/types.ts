/**
 * Type definitions for AI-native file organizer
 * 
 * Three-phase workflow: MANIFEST → PLAN → EXECUTE
 */

// ============================================================================
// PHASE 0: PROJECT ROOT DETECTION
// ============================================================================

export const PROJECT_ROOT_SIGNALS = [
  // Version control
  '.git',
  '.svn',
  '.hg',
  
  // Node.js / JavaScript
  'package.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  'package-lock.json',
  'tsconfig.json',
  'next.config.js',
  'next.config.mjs',
  'vite.config.js',
  'webpack.config.js',
  
  // Python
  'pyproject.toml',
  'requirements.txt',
  'Pipfile',
  'setup.py',
  'poetry.lock',
  
  // Rust
  'Cargo.toml',
  'Cargo.lock',
  
  // Go
  'go.mod',
  'go.sum',
  
  // Java
  'pom.xml',
  'build.gradle',
  'build.gradle.kts',
  
  // .NET
  '.sln',
  '.csproj',
  
  // Ruby
  'Gemfile',
  'Gemfile.lock',
  
  // PHP
  'composer.json',
  'composer.lock',
] as const;

export const GENERATED_FOLDERS = [
  'node_modules',
  '.next',
  'dist',
  'build',
  'target',
  '__pycache__',
  '.venv',
  'venv',
  '.pytest_cache',
  '.gradle',
  'out',
] as const;

export interface ProjectRootDetection {
  isProjectRoot: boolean;
  signals: string[];
  projectType?: 'node' | 'python' | 'rust' | 'go' | 'java' | 'dotnet' | 'ruby' | 'php' | 'mixed';
  confidence: number;
}

// ============================================================================
// PHASE 1: MANIFEST
// ============================================================================

export type ItemType = 
  | 'ProjectRoot'
  | 'Document'
  | 'Media'
  | 'Archive'
  | 'Code'
  | 'Mixed'
  | 'Generated'
  | 'Unknown';

export type RecommendedHandling = 
  | 'keep'        // Keep in place (project roots, generated folders)
  | 'group'       // Group with similar items
  | 'review';     // Send to review/inbox (low confidence)

export interface DocumentMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  creationDate?: string;
  modificationDate?: string;
  pageCount?: number;
  firstPageSnippet?: string;  // First 500 chars of text
  extractionMethod?: 'pdf-parse' | 'filename' | 'none';
}

export interface ManifestEntry {
  // Identity
  path: string;
  relativePath: string;  // Relative to scan root
  name: string;
  extension: string;
  size: number;
  modifiedDate: string;
  
  // Classification
  type: ItemType;
  confidence: number;  // 0.0 to 1.0
  signals: string[];   // Human-readable reasons
  
  // Document-specific
  metadata?: DocumentMetadata;
  
  // Project-specific
  projectRoot?: ProjectRootDetection;
  isInsideProjectRoot?: boolean;
  parentProjectRoot?: string;
  
  // Recommendations
  recommendedHandling: RecommendedHandling;
  suggestedCategory?: string;  // e.g., "ChemistryNotes", "PersonalPhotos"
  suggestedTags?: string[];
}

export interface Manifest {
  id: string;  // UUID
  scanRoot: string;
  createdAt: string;
  scanOptions: ScanOptions;
  
  entries: ManifestEntry[];
  
  summary: {
    totalItems: number;
    projectRoots: number;
    documents: number;
    media: number;
    archives: number;
    code: number;
    unknown: number;
    
    highConfidence: number;  // >= 0.8
    mediumConfidence: number; // 0.5 - 0.8
    lowConfidence: number;   // < 0.5
  };
}

export interface ScanOptions {
  rootPath: string;
  ignorePaths?: string[];  // Glob patterns
  includeHidden?: boolean;
  maxDepth?: number;
  
  // AI options
  useAI?: boolean;
  ollamaModel?: string;
  ollamaBaseUrl?: string;
  
  // Extraction options
  extractPdfMetadata?: boolean;
  extractFirstPage?: boolean;
}

// ============================================================================
// PHASE 2: PLAN
// ============================================================================

export type ActionType = 
  | 'move'
  | 'rename'
  | 'move-rename'
  | 'skip';

export interface PlanAction {
  id: string;  // UUID
  
  // Source
  from: string;
  fromRelative: string;
  
  // Destination
  to: string;
  toRelative: string;
  
  // Action details
  actionType: ActionType;
  reason: string;
  confidence: number;
  
  // Classification
  category?: string;
  tags?: string[];
  
  // Safety
  isProjectRoot?: boolean;
  movesInsideProjectRoot?: boolean;
  hasCollision?: boolean;
  collisionResolution?: 'suffix' | 'skip' | 'manual';
  
  // User control
  approved?: boolean;
  userOverride?: boolean;
  userNote?: string;
}

export interface SafetyCheck {
  passed: boolean;
  errors: string[];
  warnings: string[];
  
  checks: {
    movedInsideProjectRoot: boolean;
    overwrites: string[];
    collisionsResolved: string[];
    lowConfidenceActions: number;
    skippedItems: number;
  };
}

export interface Plan {
  id: string;  // UUID
  manifestId: string;
  createdAt: string;
  
  destRoot: string;
  
  actions: PlanAction[];
  
  safetyCheck: SafetyCheck;
  
  summary: {
    totalActions: number;
    moves: number;
    renames: number;
    skips: number;
    
    categoryCounts: Record<string, number>;
    
    highConfidence: number;
    mediumConfidence: number;
    lowConfidence: number;
  };
  
  userPreferences?: UserPreferences;
}

export interface RollbackEntry {
  from: string;  // New location
  to: string;    // Original location
  actionId: string;
  timestamp: string;
}

export interface Rollback {
  planId: string;
  createdAt: string;
  entries: RollbackEntry[];
}

// ============================================================================
// PHASE 3: EXECUTE
// ============================================================================

export type ExecutionStatus = 
  | 'pending'
  | 'in-progress'
  | 'completed'
  | 'failed'
  | 'skipped';

export interface ExecutionResult {
  actionId: string;
  status: ExecutionStatus;
  error?: string;
  actualDestination?: string;  // If collision resolved
  timestamp: string;
}

export interface ExecutionReport {
  planId: string;
  executedAt: string;
  
  results: ExecutionResult[];
  
  summary: {
    total: number;
    completed: number;
    failed: number;
    skipped: number;
  };
  
  rollback: Rollback;
  rollbackFilePath?: string;
}

// ============================================================================
// SETTINGS & MEMORY
// ============================================================================

export interface TaxonomyRule {
  pattern: string;  // Regex or keyword
  category: string;
  confidence: number;
  source: 'user' | 'learned' | 'default';
}

export interface NamingPreference {
  style: 'original' | 'titlecase' | 'lowercase' | 'camelcase';
  removeSpecialChars: boolean;
  dateFormat?: 'YYYY-MM-DD' | 'YYYYMMDD' | 'none';
}

export interface UserPreferences {
  // Taxonomy
  taxonomy: TaxonomyRule[];
  defaultFolders: Record<string, string>;  // category -> folder
  
  // Naming
  naming: NamingPreference;
  
  // Ignore patterns
  ignorePaths: string[];
  
  // Thresholds
  confidenceThresholds: {
    autoApprove: number;  // >= this, auto-approve
    requireReview: number;  // < this, send to review
  };
}

export interface Settings {
  // Ollama
  ollamaBaseUrl: string;
  ollamaModel: string;
  
  // UI
  uiPort: number;
  
  // Preferences
  preferences: UserPreferences;
  
  // Last updated
  updatedAt: string;
}

export interface UserOverride {
  id: string;
  timestamp: string;
  
  originalAction: PlanAction;
  userDecision: 'approve' | 'reject' | 'modify';
  userCategory?: string;
  userNote?: string;
  
  // For learning
  learningSignal?: {
    pattern: string;
    shouldBe: string;
  };
}

// ============================================================================
// AI PROMPTS & RESPONSES
// ============================================================================

export interface ClassificationRequest {
  filename: string;
  extension: string;
  size: number;
  metadata?: DocumentMetadata;
  folderContext?: string;
}

export interface ClassificationResponse {
  category: string;
  subject?: string;
  title?: string;
  confidence: number;
  reasoning: string;
}

export interface PlanGenerationRequest {
  manifest: Manifest;
  destRoot: string;
  preferences: UserPreferences;
}

export interface PlanGenerationResponse {
  actions: Omit<PlanAction, 'id'>[];
  reasoning: string;
}

// ============================================================================
// API TYPES
// ============================================================================

export interface ScanRequest {
  rootPath: string;
  options?: Partial<ScanOptions>;
}

export interface ScanResponse {
  manifest: Manifest;
  manifestFilePath?: string;
}

export interface PlanRequest {
  manifestId: string;
  destRoot: string;
  preferences?: Partial<UserPreferences>;
}

export interface PlanResponse {
  plan: Plan;
  planFilePath?: string;
  rollbackFilePath?: string;
}

export interface ExecuteRequest {
  planId: string;
  selectedActionIds?: string[];  // If not provided, execute all approved
  dryRun?: boolean;
}

export interface ExecuteResponse {
  report: ExecutionReport;
  logFilePath?: string;
}
