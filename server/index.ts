import express, { Request, Response, NextFunction } from "express";
import path from "path";
import cors from "cors";
import { createProxyMiddleware } from "http-proxy-middleware";
import next from "next";

// Import API handlers
import { generatePlan } from "../lib/organizer";
import { applyPlan, OrganizationPlan } from "../lib/organizer";
import { checkOllamaConnection } from "../lib/ollama";
import { getMemoryManager, closeMemoryManager } from "../lib/memory";

const app = express();

// Get config from environment variables
const PORT = parseInt(process.env.TIDYAI_PORT || "3210", 10);
const OLLAMA_BASE_URL =
  process.env.TIDYAI_OLLAMA_BASE_URL || "http://127.0.0.1:11434";
const PREFERRED_MODEL = process.env.TIDYAI_PREFERRED_MODEL || "llama3.1";

// Set Ollama base URL globally for lib/ollama.ts to use
process.env.OLLAMA_BASE_URL = OLLAMA_BASE_URL;

// Initialize Next.js
const projectRoot = path.join(__dirname, "..", "..", "..");
const nextApp = next({
  dev: false,
  dir: projectRoot,
});
const nextHandler = nextApp.getRequestHandler();

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    version: "1.0.0",
    config: {
      port: PORT,
      ollamaBaseUrl: OLLAMA_BASE_URL,
      preferredModel: PREFERRED_MODEL,
    },
  });
});

// Config endpoints
app.get("/api/config", (req: Request, res: Response) => {
  res.json({
    uiPort: PORT,
    ollamaBaseUrl: OLLAMA_BASE_URL,
    preferredModel: PREFERRED_MODEL,
  });
});

app.put("/api/config", async (req: Request, res: Response) => {
  try {
    // Note: Config updates require CLI restart to take effect
    // This endpoint is for UI display purposes
    res.json({
      success: true,
      message:
        "Config updates require restart. Use 'tidyai config set' command.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Ollama status endpoint
app.get("/api/ollama/status", async (req: Request, res: Response) => {
  try {
    const status = await checkOllamaConnection();
    res.json(status);
  } catch (error) {
    res.status(500).json({
      connected: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Plan generation endpoint
app.post("/api/plan", async (req: Request, res: Response) => {
  try {
    const {
      sourceFolder,
      destFolder,
      useOllama,
      ollamaModel,
      detectDuplicates,
    } = req.body;

    if (!sourceFolder || !destFolder) {
      return res
        .status(400)
        .json({ error: "Missing sourceFolder or destFolder" });
    }

    const result = await generatePlan({
      sourceFolder,
      destFolder,
      useOllama: useOllama ?? false,
      ollamaModel: ollamaModel || PREFERRED_MODEL,
      detectDuplicates: detectDuplicates ?? false,
    });

    res.json(result);
  } catch (error) {
    console.error("Error generating plan:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to generate plan",
    });
  }
});

// Plan application endpoint
app.post("/api/apply", async (req: Request, res: Response) => {
  try {
    const { plan } = req.body as { plan: OrganizationPlan };

    if (!plan || !plan.operations) {
      return res.status(400).json({ error: "Invalid plan data" });
    }

    const result = await applyPlan(plan);

    res.json(result);
  } catch (error) {
    console.error("Error applying plan:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to apply plan",
    });
  }
});

// ===== MEMORY API ENDPOINTS =====

// Get memory statistics
app.get("/api/memory/stats", (req: Request, res: Response) => {
  try {
    const memory = getMemoryManager();
    const stats = memory.getStats();
    res.json(stats);
  } catch (error) {
    console.error("Error getting memory stats:", error);
    res.status(500).json({
      error:
        error instanceof Error ? error.message : "Failed to get memory stats",
    });
  }
});

// Get or create default user
app.get("/api/memory/user", (req: Request, res: Response) => {
  try {
    const memory = getMemoryManager();
    const user = memory.getDefaultUser();
    res.json(user);
  } catch (error) {
    console.error("Error getting user:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to get user",
    });
  }
});

// Get user profile
app.get("/api/memory/profile/:userId", (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    const memory = getMemoryManager();
    const profile = memory.loadUserProfile(userId);
    res.json(profile);
  } catch (error) {
    console.error("Error loading profile:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to load profile",
    });
  }
});

// Update user profile
app.put("/api/memory/profile/:userId", (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    const { profile } = req.body;
    const memory = getMemoryManager();
    memory.saveUserProfile(userId, profile);
    res.json({ success: true });
  } catch (error) {
    console.error("Error saving profile:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to save profile",
    });
  }
});

// Create new conversation
app.post("/api/memory/conversations", (req: Request, res: Response) => {
  try {
    const { userId, title } = req.body;
    const memory = getMemoryManager();
    const conversation = memory.createConversation(userId, title);
    res.json(conversation);
  } catch (error) {
    console.error("Error creating conversation:", error);
    res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to create conversation",
    });
  }
});

// Get user conversations
app.get("/api/memory/conversations/:userId", (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const memory = getMemoryManager();
    const conversations = memory.getUserConversations(userId, limit);
    res.json(conversations);
  } catch (error) {
    console.error("Error getting conversations:", error);
    res.status(500).json({
      error:
        error instanceof Error ? error.message : "Failed to get conversations",
    });
  }
});

// Get specific conversation
app.get(
  "/api/memory/conversation/:conversationId",
  (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.conversationId, 10);
      const memory = getMemoryManager();
      const conversation = memory.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      res.json(conversation);
    } catch (error) {
      console.error("Error getting conversation:", error);
      res.status(500).json({
        error:
          error instanceof Error ? error.message : "Failed to get conversation",
      });
    }
  }
);

// Update conversation title
app.patch(
  "/api/memory/conversation/:conversationId",
  (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.conversationId, 10);
      const { title } = req.body;
      const memory = getMemoryManager();
      memory.updateConversationTitle(conversationId, title);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating conversation:", error);
      res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to update conversation",
      });
    }
  }
);

// Delete conversation
app.delete(
  "/api/memory/conversation/:conversationId",
  (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.conversationId, 10);
      const memory = getMemoryManager();
      memory.deleteConversation(conversationId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete conversation",
      });
    }
  }
);

// Append message to conversation
app.post("/api/memory/messages", (req: Request, res: Response) => {
  try {
    const { conversationId, role, content } = req.body;
    const memory = getMemoryManager();
    const message = memory.appendMessage(conversationId, role, content);
    res.json(message);
  } catch (error) {
    console.error("Error appending message:", error);
    res.status(500).json({
      error:
        error instanceof Error ? error.message : "Failed to append message",
    });
  }
});

// Get messages for conversation
app.get(
  "/api/memory/messages/:conversationId",
  (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.conversationId, 10);
      const limit = parseInt(req.query.limit as string, 10) || 100;
      const memory = getMemoryManager();
      const messages = memory.getMessages(conversationId, limit);
      res.json(messages);
    } catch (error) {
      console.error("Error getting messages:", error);
      res.status(500).json({
        error:
          error instanceof Error ? error.message : "Failed to get messages",
      });
    }
  }
);

// Get conversation summary
app.get(
  "/api/memory/summary/:conversationId",
  (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.conversationId, 10);
      const memory = getMemoryManager();
      const summary = memory.getSummary(conversationId);
      res.json(summary || { summary: null });
    } catch (error) {
      console.error("Error getting summary:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to get summary",
      });
    }
  }
);

// Save conversation summary
app.post("/api/memory/summary", (req: Request, res: Response) => {
  try {
    const { conversationId, summary } = req.body;
    const memory = getMemoryManager();
    memory.saveSummary(conversationId, summary);
    res.json({ success: true });
  } catch (error) {
    console.error("Error saving summary:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to save summary",
    });
  }
});

// Handle all other routes with Next.js
app.all("*", (req: Request, res: Response) => {
  return nextHandler(req, res);
});

// Start Next.js and then Express server
nextApp.prepare().then(() => {
  app.listen(PORT, () => {
    console.log(`\n✅ Tidy AI server running on http://localhost:${PORT}`);
    console.log(`📡 Ollama Base URL: ${OLLAMA_BASE_URL}`);
    console.log(`🤖 Preferred Model: ${PREFERRED_MODEL}\n`);
  });
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("\n🛑 Received SIGTERM, shutting down gracefully...");
  closeMemoryManager();
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("\n🛑 Received SIGINT, shutting down gracefully...");
  closeMemoryManager();
  process.exit(0);
});

export default app;
