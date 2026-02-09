import { spawn, ChildProcess } from "child_process";
import path from "path";
import { TidyAIConfig, writePidFile, removePidFile } from "./config";

let serverProcess: ChildProcess | null = null;

/**
 * Start the Tidy AI server
 */
export async function startServer(
  config: TidyAIConfig,
  detached: boolean = false
): Promise<void> {
  return new Promise((resolve, reject) => {
    // Path to the server entry point (accounts for nested dist structure)
    // From dist/cli/cli -> go up to dist -> then to server/server/index.js
    const serverPath = path.join(
      __dirname,
      "..",
      "..",
      "server",
      "server",
      "index.js"
    );

    // Set environment variables for server
    const env = {
      ...process.env,
      TIDYAI_PORT: config.uiPort.toString(),
      TIDYAI_OLLAMA_BASE_URL: config.ollamaBaseUrl,
      TIDYAI_PREFERRED_MODEL: config.preferredModel,
    };

    try {
      if (detached) {
        // Run in detached mode
        serverProcess = spawn("node", [serverPath], {
          detached: true,
          stdio: "ignore",
          env,
        });

        if (serverProcess.pid) {
          writePidFile(serverProcess.pid);
        }

        serverProcess.unref();
        console.log(
          `✅ Server started in background (PID: ${serverProcess.pid})`
        );
        console.log(
          `🌐 Open http://localhost:${config.uiPort} in your browser.`
        );
        resolve();
      } else {
        // Run in foreground
        serverProcess = spawn("node", [serverPath], {
          stdio: "inherit",
          env,
        });

        if (serverProcess.pid) {
          writePidFile(serverProcess.pid);
        }

        serverProcess.on("error", (error) => {
          reject(new Error(`Failed to start server: ${error.message}`));
        });

        serverProcess.on("exit", async (code) => {
          await removePidFile();
          if (code !== 0 && code !== null) {
            reject(new Error(`Server exited with code ${code}`));
          }
        });

        // Handle graceful shutdown
        process.on("SIGINT", async () => {
          console.log("\n🛑 Shutting down gracefully...");
          if (serverProcess) {
            serverProcess.kill("SIGTERM");
            await removePidFile();
          }
          process.exit(0);
        });

        process.on("SIGTERM", async () => {
          if (serverProcess) {
            serverProcess.kill("SIGTERM");
            await removePidFile();
          }
          process.exit(0);
        });

        // Wait a bit for server to start
        setTimeout(() => resolve(), 1000);
      }
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Check if server is healthy
 */
export async function checkHealth(port: number): Promise<boolean> {
  try {
    const response = await fetch(`http://localhost:${port}/health`, {
      method: "GET",
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}
