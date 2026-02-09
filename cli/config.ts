import fs from "fs/promises";
import path from "path";
import os from "os";

export interface TidyAIConfig {
  uiPort: number;
  ollamaBaseUrl: string;
  preferredModel: string;
}

export const DEFAULT_CONFIG: TidyAIConfig = {
  uiPort: 3210,
  ollamaBaseUrl: "http://127.0.0.1:11434",
  preferredModel: "llama3.1",
};

/**
 * Get the Tidy AI data directory based on OS
 * - macOS: ~/Library/Application Support/tidyai
 * - Linux: ~/.local/share/tidyai
 * - Windows: %APPDATA%/tidyai
 * - Fallback: ~/.tidyai
 */
export function getDataDir(): string {
  const platform = os.platform();
  const homeDir = os.homedir();

  switch (platform) {
    case "darwin": // macOS
      return path.join(homeDir, "Library", "Application Support", "tidyai");
    case "win32": // Windows
      const appData = process.env.APPDATA;
      return appData
        ? path.join(appData, "tidyai")
        : path.join(homeDir, ".tidyai");
    case "linux": // Linux
      const xdgDataHome = process.env.XDG_DATA_HOME;
      return xdgDataHome
        ? path.join(xdgDataHome, "tidyai")
        : path.join(homeDir, ".local", "share", "tidyai");
    default: // Fallback for other platforms
      return path.join(homeDir, ".tidyai");
  }
}

export function getConfigPath(): string {
  return path.join(getDataDir(), "config.json");
}

export function getPidPath(): string {
  return path.join(getDataDir(), "tidyai.pid");
}

export function getMemoryDbPath(): string {
  return path.join(getDataDir(), "memory.db");
}

/**
 * Ensure the data directory exists
 */
export async function ensureDataDir(): Promise<void> {
  const dataDir = getDataDir();
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch (error) {
    throw new Error(`Failed to create data directory: ${error}`);
  }
}

/**
 * Load configuration from disk
 */
export async function loadConfig(): Promise<TidyAIConfig> {
  const configPath = getConfigPath();

  try {
    const content = await fs.readFile(configPath, "utf-8");
    const config = JSON.parse(content);

    // Validate and merge with defaults
    return {
      ...DEFAULT_CONFIG,
      ...config,
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      // Config doesn't exist, return defaults
      return { ...DEFAULT_CONFIG };
    }
    throw new Error(`Failed to load config: ${error}`);
  }
}

/**
 * Save configuration to disk (atomic write)
 */
export async function saveConfig(config: TidyAIConfig): Promise<void> {
  await ensureDataDir();

  const configPath = getConfigPath();
  const tempPath = `${configPath}.tmp`;

  try {
    // Validate config
    validateConfig(config);

    // Write to temp file first
    await fs.writeFile(tempPath, JSON.stringify(config, null, 2), "utf-8");

    // Atomic rename
    await fs.rename(tempPath, configPath);
  } catch (error) {
    // Clean up temp file if it exists
    try {
      await fs.unlink(tempPath);
    } catch {}

    throw new Error(`Failed to save config: ${error}`);
  }
}

/**
 * Validate configuration
 */
export function validateConfig(config: TidyAIConfig): void {
  if (!config.uiPort || config.uiPort < 1 || config.uiPort > 65535) {
    throw new Error("Invalid uiPort: must be between 1 and 65535");
  }

  if (!config.ollamaBaseUrl || !config.ollamaBaseUrl.startsWith("http")) {
    throw new Error(
      "Invalid ollamaBaseUrl: must start with http:// or https://"
    );
  }

  if (typeof config.preferredModel !== "string") {
    throw new Error("Invalid preferredModel: must be a string");
  }
}

/**
 * Initialize configuration with defaults
 */
export async function initConfig(): Promise<TidyAIConfig> {
  await ensureDataDir();

  const existingConfig = await loadConfig();
  await saveConfig(existingConfig);

  return existingConfig;
}

/**
 * Get a specific config value
 */
export async function getConfigValue(
  key: keyof TidyAIConfig
): Promise<string | number> {
  const config = await loadConfig();
  return config[key];
}

/**
 * Set a specific config value
 */
export async function setConfigValue(
  key: keyof TidyAIConfig,
  value: string | number
): Promise<void> {
  const config = await loadConfig();

  // Type coercion based on key
  if (key === "uiPort") {
    config[key] = typeof value === "string" ? parseInt(value, 10) : value;
  } else {
    config[key] = value as any;
  }

  await saveConfig(config);
}

/**
 * Write PID file
 */
export async function writePidFile(pid: number): Promise<void> {
  await ensureDataDir();
  const pidPath = getPidPath();
  await fs.writeFile(pidPath, pid.toString(), "utf-8");
}

/**
 * Read PID file
 */
export async function readPidFile(): Promise<number | null> {
  const pidPath = getPidPath();

  try {
    const content = await fs.readFile(pidPath, "utf-8");
    const pid = parseInt(content.trim(), 10);
    return isNaN(pid) ? null : pid;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

/**
 * Remove PID file
 */
export async function removePidFile(): Promise<void> {
  const pidPath = getPidPath();

  try {
    await fs.unlink(pidPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}

/**
 * Check if a process is running
 */
export function isProcessRunning(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return false;
  }
}
