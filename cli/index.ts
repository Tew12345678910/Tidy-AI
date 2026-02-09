#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import {
  initConfig,
  loadConfig,
  getConfigValue,
  setConfigValue,
  getDataDir,
  readPidFile,
  isProcessRunning,
  TidyAIConfig,
} from "./config";
import { startServer, checkHealth } from "./server-manager";

const program = new Command();

program
  .name("tidyai")
  .description("Tidy AI - Organize your Downloads folder with AI")
  .version("1.0.0");

// Init command
program
  .command("init")
  .description("Initialize Tidy AI configuration and database")
  .action(async () => {
    try {
      console.log(chalk.blue("🚀 Initializing Tidy AI..."));

      const config = await initConfig();
      const dataDir = getDataDir();

      // Initialize memory database
      console.log(chalk.gray("📦 Initializing memory database..."));
      try {
        const { MemoryManager } = await import("../lib/memory");
        const memory = new MemoryManager();
        memory.initialize();
        const stats = memory.getStats();
        memory.close();
        console.log(chalk.green("✅ Memory database initialized!"));
        console.log(chalk.gray(`  Users: ${stats.totalUsers}`));
      } catch (error) {
        console.log(
          chalk.yellow(
            "⚠️  Memory database initialization skipped (will initialize on first run)"
          )
        );
      }

      console.log(chalk.green("\n✅ Configuration initialized successfully!"));
      console.log(chalk.gray(`\nData directory: ${dataDir}`));
      console.log(chalk.gray("\nDefault settings:"));
      console.log(chalk.gray(`  UI Port: ${config.uiPort}`));
      console.log(chalk.gray(`  Ollama Base URL: ${config.ollamaBaseUrl}`));
      console.log(
        chalk.gray(`  Preferred Model: ${config.preferredModel || "(none)"}`)
      );
      console.log(chalk.cyan("\nRun 'tidyai run' to start the application."));
    } catch (error) {
      console.error(chalk.red("❌ Initialization failed:"), error);
      process.exit(1);
    }
  });

// Run command
program
  .command("run")
  .description("Start Tidy AI server")
  .option("-d, --detach", "Run in background (detached mode)")
  .action(async (options) => {
    try {
      console.log(chalk.blue("🚀 Starting Tidy AI..."));

      // Check if already running
      const pid = await readPidFile();
      if (pid && isProcessRunning(pid)) {
        console.log(chalk.yellow("⚠️  Tidy AI is already running!"));
        const config = await loadConfig();
        console.log(
          chalk.cyan(
            `\n🌐 Open http://localhost:${config.uiPort} in your browser.`
          )
        );
        process.exit(0);
      }

      // Load config
      const config = await loadConfig();
      console.log(chalk.gray(`Loading configuration from ${getDataDir()}`));
      console.log(chalk.gray(`  UI Port: ${config.uiPort}`));
      console.log(chalk.gray(`  Ollama Base URL: ${config.ollamaBaseUrl}`));

      // Start server
      await startServer(config, options.detach);

      if (!options.detach) {
        console.log(chalk.green(`\n✅ Tidy AI is running!`));
        console.log(
          chalk.cyan(
            `\n🌐 Open http://localhost:${config.uiPort} in your browser.`
          )
        );
        console.log(chalk.gray("\nPress Ctrl+C to stop the server."));
      }
    } catch (error) {
      console.error(chalk.red("❌ Failed to start server:"), error);
      process.exit(1);
    }
  });

// Status command
program
  .command("status")
  .description("Check if Tidy AI is running")
  .action(async () => {
    try {
      const pid = await readPidFile();

      if (!pid) {
        console.log(chalk.yellow("⚠️  Tidy AI is not running."));
        console.log(chalk.gray("\nRun 'tidyai run' to start the application."));
        process.exit(0);
      }

      if (!isProcessRunning(pid)) {
        console.log(
          chalk.yellow("⚠️  Tidy AI is not running (stale PID file).")
        );
        console.log(chalk.gray("\nRun 'tidyai run' to start the application."));
        process.exit(0);
      }

      // Check health endpoint
      const config = await loadConfig();
      const healthy = await checkHealth(config.uiPort);

      if (healthy) {
        console.log(chalk.green("✅ Tidy AI is running!"));
        console.log(chalk.gray(`\nPID: ${pid}`));
        console.log(chalk.cyan(`URL: http://localhost:${config.uiPort}`));
      } else {
        console.log(
          chalk.yellow("⚠️  Tidy AI process is running but not responding.")
        );
        console.log(chalk.gray(`\nPID: ${pid}`));
      }
    } catch (error) {
      console.error(chalk.red("❌ Error checking status:"), error);
      process.exit(1);
    }
  });

// Config command
const configCmd = program
  .command("config")
  .description("Manage Tidy AI configuration");

configCmd
  .command("get <key>")
  .description("Get a configuration value")
  .action(async (key: string) => {
    try {
      const validKeys = ["uiPort", "ollamaBaseUrl", "preferredModel"];

      if (!validKeys.includes(key)) {
        console.error(chalk.red(`❌ Invalid config key: ${key}`));
        console.log(chalk.gray(`\nValid keys: ${validKeys.join(", ")}`));
        process.exit(1);
      }

      const value = await getConfigValue(key as keyof TidyAIConfig);
      console.log(chalk.green(`${key}: ${value}`));
    } catch (error) {
      console.error(chalk.red("❌ Error getting config:"), error);
      process.exit(1);
    }
  });

configCmd
  .command("set <key> <value>")
  .description("Set a configuration value")
  .action(async (key: string, value: string) => {
    try {
      const validKeys = ["uiPort", "ollamaBaseUrl", "preferredModel"];

      if (!validKeys.includes(key)) {
        console.error(chalk.red(`❌ Invalid config key: ${key}`));
        console.log(chalk.gray(`\nValid keys: ${validKeys.join(", ")}`));
        process.exit(1);
      }

      await setConfigValue(key as keyof TidyAIConfig, value);
      console.log(chalk.green(`✅ Set ${key} = ${value}`));

      if (key === "uiPort") {
        console.log(chalk.yellow("\n⚠️  Port change requires restart."));
        console.log(chalk.gray("Run 'tidyai run' to apply changes."));
      }
    } catch (error) {
      console.error(chalk.red("❌ Error setting config:"), error);
      process.exit(1);
    }
  });

configCmd
  .command("list")
  .description("List all configuration values")
  .action(async () => {
    try {
      const config = await loadConfig();
      console.log(chalk.blue("📋 Current Configuration:"));
      console.log(chalk.gray(`\nData directory: ${getDataDir()}`));
      console.log(chalk.gray("\nSettings:"));
      console.log(chalk.green(`  uiPort: ${config.uiPort}`));
      console.log(chalk.green(`  ollamaBaseUrl: ${config.ollamaBaseUrl}`));
      console.log(
        chalk.green(`  preferredModel: ${config.preferredModel || "(none)"}`)
      );
    } catch (error) {
      console.error(chalk.red("❌ Error listing config:"), error);
      process.exit(1);
    }
  });

// Stop command
program
  .command("stop")
  .description("Stop Tidy AI server")
  .action(async () => {
    try {
      const pid = await readPidFile();

      if (!pid) {
        console.log(chalk.yellow("⚠️  Tidy AI is not running."));
        process.exit(0);
      }

      if (!isProcessRunning(pid)) {
        console.log(
          chalk.yellow("⚠️  Tidy AI is not running (stale PID file).")
        );
        process.exit(0);
      }

      console.log(chalk.blue(`🛑 Stopping Tidy AI (PID: ${pid})...`));
      process.kill(pid, "SIGTERM");

      // Wait for process to stop
      let attempts = 0;
      while (isProcessRunning(pid) && attempts < 30) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
      }

      if (isProcessRunning(pid)) {
        console.log(
          chalk.yellow("⚠️  Process did not stop gracefully, forcing...")
        );
        process.kill(pid, "SIGKILL");
      }

      console.log(chalk.green("✅ Tidy AI stopped successfully."));
    } catch (error) {
      console.error(chalk.red("❌ Error stopping server:"), error);
      process.exit(1);
    }
  });

program.parse();
