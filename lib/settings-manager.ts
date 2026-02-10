/**
 * Settings Manager
 *
 * Manages persistent settings including:
 * - Ollama configuration
 * - User preferences
 * - Taxonomy rules
 * - Memory/learning
 */

import fs from "fs/promises";
import path from "path";
import { getDataDir, ensureDataDir } from "../cli/config";
import { Settings, UserPreferences, TaxonomyRule, UserOverride } from "./types";

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  taxonomy: [
    {
      pattern: "chemistry|chem|chemical",
      category: "Chemistry Notes",
      confidence: 0.9,
      source: "default",
    },
    {
      pattern: "physics|phys",
      category: "Physics Notes",
      confidence: 0.9,
      source: "default",
    },
    {
      pattern: "math|calculus|algebra",
      category: "Math Notes",
      confidence: 0.9,
      source: "default",
    },
    {
      pattern: "biology|bio",
      category: "Biology Notes",
      confidence: 0.9,
      source: "default",
    },
    {
      pattern: "tax|taxes|irs|1040",
      category: "Tax Documents",
      confidence: 0.95,
      source: "default",
    },
    {
      pattern: "invoice|receipt|bill",
      category: "Invoices & Receipts",
      confidence: 0.9,
      source: "default",
    },
    {
      pattern: "contract|agreement",
      category: "Contracts",
      confidence: 0.9,
      source: "default",
    },
    {
      pattern: "resume|cv|curriculum",
      category: "Career",
      confidence: 0.9,
      source: "default",
    },
  ],

  defaultFolders: {
    Documents: "Documents",
    Images: "Images",
    Videos: "Videos",
    Audio: "Audio",
    Archives: "Archives",
    Code: "Code",
    Projects: "Projects",
    Unknown: "Inbox",
  },

  naming: {
    style: "original",
    removeSpecialChars: false,
    dateFormat: "none",
  },

  ignorePaths: [
    "*.tmp",
    "*.temp",
    ".DS_Store",
    "Thumbs.db",
    "desktop.ini",
    "node_modules/**",
    ".git/**",
    ".next/**",
    "dist/**",
    "build/**",
  ],

  confidenceThresholds: {
    autoApprove: 0.8,
    requireReview: 0.5,
  },
};

export const DEFAULT_SETTINGS: Settings = {
  // AI Provider Configuration
  aiProvider: "ollama",

  // Ollama settings (local)
  ollamaBaseUrl: "http://127.0.0.1:11434",
  ollamaModel: "llama3.1",

  // OpenAI settings (cloud)
  openaiApiKey: undefined,
  openaiModel: "gpt-4o-mini",
  openaiBaseUrl: undefined, // Use default unless custom endpoint

  uiPort: 3210,
  preferences: DEFAULT_USER_PREFERENCES,
  updatedAt: new Date().toISOString(),
};

/**
 * Settings Manager Class
 */
export class SettingsManager {
  private settingsPath: string;
  private overridesPath: string;
  private settings: Settings | null = null;

  constructor() {
    const dataDir = getDataDir();
    this.settingsPath = path.join(dataDir, "settings.json");
    this.overridesPath = path.join(dataDir, "overrides.json");
  }

  /**
   * Load settings from disk
   */
  async load(): Promise<Settings> {
    if (this.settings) {
      return this.settings;
    }

    try {
      await ensureDataDir();
      const content = await fs.readFile(this.settingsPath, "utf-8");
      const loadedSettings = JSON.parse(content) as Settings;

      // Merge with defaults to ensure new fields exist
      this.settings = {
        ...DEFAULT_SETTINGS,
        ...loadedSettings,
        preferences: {
          ...DEFAULT_USER_PREFERENCES,
          ...(loadedSettings.preferences || {}),
        },
      };

      return this.settings;
    } catch (error) {
      // File doesn't exist, return defaults
      this.settings = { ...DEFAULT_SETTINGS };
      await this.save();
      return this.settings;
    }
  }

  /**
   * Save settings to disk
   */
  async save(): Promise<void> {
    if (!this.settings) {
      return;
    }

    await ensureDataDir();
    this.settings.updatedAt = new Date().toISOString();
    await fs.writeFile(
      this.settingsPath,
      JSON.stringify(this.settings, null, 2)
    );
  }

  /**
   * Get current settings
   */
  async get(): Promise<Settings> {
    return await this.load();
  }

  /**
   * Update settings
   */
  async update(updates: Partial<Settings>): Promise<Settings> {
    const current = await this.load();

    // Deep merge preferences
    if (updates.preferences) {
      current.preferences = {
        ...current.preferences,
        ...updates.preferences,
      };
      delete updates.preferences;
    }

    this.settings = {
      ...current,
      ...updates,
    };

    await this.save();
    return this.settings;
  }

  /**
   * Update Ollama configuration
   */
  async updateOllama(baseUrl: string, model: string): Promise<void> {
    await this.update({
      ollamaBaseUrl: baseUrl,
      ollamaModel: model,
    });
  }

  /**
   * Add a taxonomy rule
   */
  async addTaxonomyRule(rule: TaxonomyRule): Promise<void> {
    const settings = await this.load();
    settings.preferences.taxonomy.push(rule);
    this.settings = settings;
    await this.save();
  }

  /**
   * Remove a taxonomy rule
   */
  async removeTaxonomyRule(pattern: string): Promise<void> {
    const settings = await this.load();
    settings.preferences.taxonomy = settings.preferences.taxonomy.filter(
      (r) => r.pattern !== pattern
    );
    this.settings = settings;
    await this.save();
  }

  /**
   * Add ignore pattern
   */
  async addIgnorePattern(pattern: string): Promise<void> {
    const settings = await this.load();
    if (!settings.preferences.ignorePaths.includes(pattern)) {
      settings.preferences.ignorePaths.push(pattern);
      this.settings = settings;
      await this.save();
    }
  }

  /**
   * Remove ignore pattern
   */
  async removeIgnorePattern(pattern: string): Promise<void> {
    const settings = await this.load();
    settings.preferences.ignorePaths = settings.preferences.ignorePaths.filter(
      (p) => p !== pattern
    );
    this.settings = settings;
    await this.save();
  }

  /**
   * Update confidence thresholds
   */
  async updateThresholds(
    autoApprove: number,
    requireReview: number
  ): Promise<void> {
    const settings = await this.load();
    settings.preferences.confidenceThresholds = {
      autoApprove,
      requireReview,
    };
    this.settings = settings;
    await this.save();
  }

  /**
   * Reset to defaults
   */
  async reset(): Promise<Settings> {
    this.settings = { ...DEFAULT_SETTINGS };
    await this.save();
    return this.settings;
  }

  /**
   * Record a user override (for learning)
   */
  async recordOverride(override: UserOverride): Promise<void> {
    await ensureDataDir();

    try {
      const content = await fs.readFile(this.overridesPath, "utf-8");
      const overrides: UserOverride[] = JSON.parse(content);
      overrides.push(override);
      await fs.writeFile(
        this.overridesPath,
        JSON.stringify(overrides, null, 2)
      );
    } catch {
      // File doesn't exist, create it
      await fs.writeFile(
        this.overridesPath,
        JSON.stringify([override], null, 2)
      );
    }

    // If override has a learning signal, try to add it as a taxonomy rule
    if (override.learningSignal && override.userDecision === "modify") {
      const settings = await this.load();
      const existingRule = settings.preferences.taxonomy.find(
        (r) => r.pattern === override.learningSignal!.pattern
      );

      if (!existingRule) {
        await this.addTaxonomyRule({
          pattern: override.learningSignal.pattern,
          category: override.learningSignal.shouldBe,
          confidence: 0.7,
          source: "learned",
        });
      }
    }
  }

  /**
   * Get all overrides
   */
  async getOverrides(): Promise<UserOverride[]> {
    try {
      const content = await fs.readFile(this.overridesPath, "utf-8");
      return JSON.parse(content);
    } catch {
      return [];
    }
  }

  /**
   * Clear all overrides
   */
  async clearOverrides(): Promise<void> {
    try {
      await fs.unlink(this.overridesPath);
    } catch {
      // File doesn't exist, no problem
    }
  }

  /**
   * Export settings
   */
  async export(): Promise<string> {
    const settings = await this.load();
    return JSON.stringify(settings, null, 2);
  }

  /**
   * Import settings
   */
  async import(settingsJson: string): Promise<Settings> {
    const imported = JSON.parse(settingsJson) as Settings;
    this.settings = {
      ...DEFAULT_SETTINGS,
      ...imported,
    };
    await this.save();
    return this.settings;
  }
}

/**
 * Global settings manager instance
 */
let globalManager: SettingsManager | null = null;

/**
 * Get or create global settings manager
 */
export function getSettingsManager(): SettingsManager {
  if (!globalManager) {
    globalManager = new SettingsManager();
  }
  return globalManager;
}
