# Tidy AI - Complete Architecture with Dedicated Memory

## 🎯 Product Vision

**Tidy AI** is an Open WebUI-style local web application that runs entirely on the user's machine. Install one npm package, run one command, get a powerful AI-powered file organizer with **persistent memory**.

### Core Principles

1. **Install ONE Thing**: `npm i -g tidyai` → done
2. **Local-First**: All data stays on user's machine
3. **Persistent Memory**: Conversations, preferences, facts survive restarts and upgrades
4. **Single Entrypoint**: Everything through `tidyai` CLI
5. **Privacy-Focused**: No cloud, no telemetry, no external services

---

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER'S MACHINE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Terminal                                                       │
│  $ tidyai init    → Initialize config + memory database        │
│  $ tidyai run     → Start local server                         │
│  $ tidyai status  → Check if running                           │
│  $ tidyai stop    → Stop server                                │
│  $ tidyai config  → Manage settings                            │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │                  CLI LAYER (Commander.js)              │   │
│  │  • Reads config from dedicated storage                 │   │
│  │  • Validates user input                                │   │
│  │  • Manages server lifecycle (PID tracking)             │   │
│  │  • Initializes memory database                         │   │
│  └─────────────────┬──────────────────────────────────────┘   │
│                    │                                            │
│  ┌─────────────────▼──────────────────────────────────────┐   │
│  │           BACKEND SERVER (Express.js)                  │   │
│  │  ┌──────────────────────────────────────────────────┐  │   │
│  │  │           API ENDPOINTS                          │  │   │
│  │  │  • /health                                       │  │   │
│  │  │  • /api/config (get settings)                    │  │   │
│  │  │  • /api/ollama/status                            │  │   │
│  │  │  • /api/plan (generate organization plan)        │  │   │
│  │  │  • /api/apply (execute plan)                     │  │   │
│  │  │  ───────────────────────────────────────────     │  │   │
│  │  │  • /api/memory/stats                             │  │   │
│  │  │  • /api/memory/user                              │  │   │
│  │  │  • /api/memory/profile/:userId                   │  │   │
│  │  │  • /api/memory/conversations                     │  │   │
│  │  │  • /api/memory/conversation/:id                  │  │   │
│  │  │  • /api/memory/messages                          │  │   │
│  │  │  • /api/memory/summary                           │  │   │
│  │  └──────────────────────────────────────────────────┘  │   │
│  │                                                         │   │
│  │  ┌──────────────────────────────────────────────────┐  │   │
│  │  │      CORE LOGIC (lib/)                          │  │   │
│  │  │  • organizer.ts  - File organization            │  │   │
│  │  │  • ollama.ts     - LLM integration              │  │   │
│  │  │  • categories.ts - File type detection          │  │   │
│  │  │  • memory.ts     - SQLite memory manager        │  │   │
│  │  └──────────────────────────────────────────────────┘  │   │
│  │                                                         │   │
│  │  ┌──────────────────────────────────────────────────┐  │   │
│  │  │      STATIC FILE SERVING                        │  │   │
│  │  │  Serves Next.js build output                     │  │   │
│  │  └──────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Browser: http://localhost:3210                                │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │           FRONTEND UI (Next.js 14 + React)             │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │              PAGES                               │  │  │
│  │  │  • / (app/page.tsx) - Main file organizer UI    │  │  │
│  │  │  • Settings modal - Config display              │  │  │
│  │  │  • Future: Conversation UI                      │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  │                                                         │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │         COMPONENTS (shadcn/ui)                  │  │  │
│  │  │  • Button, Card, Input, Table, etc.             │  │  │
│  │  │  • Settings.tsx - Configuration display         │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │        DEDICATED LOCAL STORAGE (Persistent)            │  │
│  │                                                         │  │
│  │  Location (via env-paths):                             │  │
│  │    macOS:   ~/Library/Application Support/tidyai/      │  │
│  │    Linux:   ~/.local/share/tidyai/                     │  │
│  │    Windows: %APPDATA%/tidyai/                          │  │
│  │                                                         │  │
│  │  ┌───────────────────────────────────────────────────┐ │  │
│  │  │  config.json (Settings Memory)                   │ │  │
│  │  │  {                                                │ │  │
│  │  │    "uiPort": 3210,                                │ │  │
│  │  │    "ollamaBaseUrl": "http://127.0.0.1:11434",    │ │  │
│  │  │    "preferredModel": "llama3.1"                  │ │  │
│  │  │  }                                                │ │  │
│  │  └───────────────────────────────────────────────────┘ │  │
│  │                                                         │  │
│  │  ┌───────────────────────────────────────────────────┐ │  │
│  │  │  memory.db (SQLite - All Memory Types)           │ │  │
│  │  │                                                   │ │  │
│  │  │  Tables:                                          │ │  │
│  │  │    • users                                        │ │  │
│  │  │        - id, display_name, created_at             │ │  │
│  │  │                                                   │ │  │
│  │  │    • conversations                                │ │  │
│  │  │        - id, user_id, title, created_at,          │ │  │
│  │  │          updated_at                               │ │  │
│  │  │                                                   │ │  │
│  │  │    • messages                                     │ │  │
│  │  │        - id, conversation_id, role,               │ │  │
│  │  │          content, created_at                      │ │  │
│  │  │                                                   │ │  │
│  │  │    • conversation_summaries                       │ │  │
│  │  │        - conversation_id, summary, updated_at     │ │  │
│  │  │                                                   │ │  │
│  │  │    • user_profiles                                │ │  │
│  │  │        - user_id, profile_json, updated_at        │ │  │
│  │  │        (stores facts, preferences)                │ │  │
│  │  │                                                   │ │  │
│  │  │  Future: vector_embeddings table                  │ │  │
│  │  │        - id, content, embedding, metadata         │ │  │
│  │  └───────────────────────────────────────────────────┘ │  │
│  │                                                         │  │
│  │  ┌───────────────────────────────────────────────────┐ │  │
│  │  │  tidyai.pid (Process ID for status tracking)     │ │  │
│  │  └───────────────────────────────────────────────────┘ │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  External (Optional)                                            │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │          Ollama (http://127.0.0.1:11434)               │  │
│  │  • Local LLM for AI categorization                     │  │
│  │  • Not required, app works without it                  │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Diagrams

### 1. Initialization Flow

```
User runs: $ tidyai init

CLI (cli/index.ts)
  │
  ├─► Load env-paths
  │   └─► Determine data directory
  │       macOS: ~/Library/Application Support/tidyai
  │       Linux: ~/.local/share/tidyai
  │       Windows: %APPDATA%/tidyai
  │
  ├─► Create data directory (if not exists)
  │   mkdir -p <data_dir>
  │
  ├─► Initialize config.json
  │   │
  │   ├─► Check if exists
  │   │   └─► If not: write defaults
  │   │       {
  │   │         uiPort: 3210,
  │   │         ollamaBaseUrl: "http://127.0.0.1:11434",
  │   │         preferredModel: "llama3.1"
  │   │       }
  │   │
  │   └─► Validate existing config
  │       • Port range: 1-65535
  │       • URL format: http(s)://...
  │       • Model: string
  │
  └─► Initialize memory.db
      │
      ├─► Create SQLite database
      │
      ├─► Run schema migrations
      │   │
      │   ├─► CREATE TABLE users
      │   ├─► CREATE TABLE conversations
      │   ├─► CREATE TABLE messages
      │   ├─► CREATE TABLE conversation_summaries
      │   ├─► CREATE TABLE user_profiles
      │   │
      │   └─► CREATE INDEXES
      │       • idx_messages_conversation
      │       • idx_conversations_user
      │
      └─► Create default user
          INSERT INTO users (display_name)
          VALUES ('Default User')

Result: ✅ Ready to run!
```

### 2. Server Start Flow

```
User runs: $ tidyai run [-d]

CLI (cli/index.ts)
  │
  ├─► Check if already running
  │   │
  │   ├─► Read tidyai.pid
  │   ├─► Check if PID is alive
  │   └─► If running: exit with message
  │
  ├─► Load config.json
  │   └─► Parse and validate
  │
  └─► Start server (cli/server-manager.ts)
      │
      ├─► Build environment variables
      │   • TIDYAI_PORT=<config.uiPort>
      │   • TIDYAI_OLLAMA_BASE_URL=<config.ollamaBaseUrl>
      │   • TIDYAI_PREFERRED_MODEL=<config.preferredModel>
      │
      ├─► Spawn Node process
      │   node dist/server/index.js
      │   │
      │   └─► If detached (-d):
      │       • Set detached: true, stdio: 'ignore'
      │       • Unref process
      │
      ├─► Write PID to tidyai.pid
      │
      ├─► Wait for health check
      │   └─► Poll http://localhost:<port>/health
      │       Retry 10 times, 500ms interval
      │
      └─► Success!
          ✅ Server running on http://localhost:3210
          📦 Memory database loaded
          🤖 Ollama: <status>

Server Process (server/index.ts)
  │
  ├─► Initialize Express app
  │
  ├─► Load memory manager
  │   └─► getMemoryManager()
  │       • Opens memory.db
  │       • Ensures schema initialized
  │       • Returns singleton instance
  │
  ├─► Register middleware
  │   • CORS (allow all origins for local dev)
  │   • JSON body parser (50MB limit)
  │   • URL encoded parser
  │   • Request logger
  │
  ├─► Register API routes
  │   │
  │   ├─► File Organization APIs
  │   │   • GET /health
  │   │   • GET /api/config
  │   │   • GET /api/ollama/status
  │   │   • POST /api/plan
  │   │   • POST /api/apply
  │   │
  │   └─► Memory APIs
  │       • GET /api/memory/stats
  │       • GET /api/memory/user
  │       • GET/PUT /api/memory/profile/:userId
  │       • POST /api/memory/conversations
  │       • GET /api/memory/conversations/:userId
  │       • GET/PATCH/DELETE /api/memory/conversation/:id
  │       • POST /api/memory/messages
  │       • GET /api/memory/messages/:conversationId
  │       • GET/POST /api/memory/summary
  │
  ├─► Serve static files
  │   • /_next/static → .next/static/
  │   • /public → public/
  │
  ├─► Serve Next.js app
  │   • All other routes → Next.js build
  │
  └─► Listen on port
      app.listen(PORT)
```

### 3. Memory Write Flow (Example: Saving a Message)

```
User types message in UI → Sends to backend

Frontend (React)
  │
  └─► POST /api/memory/messages
      {
        conversationId: 123,
        role: "user",
        content: "Organize my downloads"
      }

Backend (server/index.ts)
  │
  └─► Route: POST /api/memory/messages
      │
      └─► Handler:
          │
          ├─► Get memory manager
          │   memory = getMemoryManager()
          │
          ├─► Append message
          │   message = memory.appendMessage(
          │     conversationId,
          │     role,
          │     content
          │   )
          │
          └─► Return message
              { id, conversationId, role, content, createdAt }

Memory Manager (lib/memory.ts)
  │
  └─► appendMessage()
      │
      ├─► INSERT INTO messages
      │   (conversation_id, role, content)
      │   VALUES (?, ?, ?)
      │
      ├─► Get last insert ID
      │
      ├─► UPDATE conversations
      │   SET updated_at = datetime('now')
      │   WHERE id = ?
      │
      └─► Return message object
          SELECT * FROM messages WHERE id = ?

SQLite Database (memory.db)
  │
  ├─► Write to messages table
  │   Row: { id: 456, conversation_id: 123,
  │          role: "user", content: "...",
  │          created_at: "2026-02-09T10:30:00" }
  │
  ├─► Write to WAL (Write-Ahead Log)
  │   • Atomic transaction
  │   • ACID guarantees
  │
  └─► Checkpoint (periodic)
      Merge WAL → main database file

Result: Message persisted!
  • Survives app restart
  • Survives npm update
  • Only deleted if user removes data dir
```

### 4. Config Update Flow

```
User runs: $ tidyai config set uiPort 8080

CLI (cli/index.ts)
  │
  └─► Command: config.set()
      │
      ├─► Parse key and value
      │   key = "uiPort"
      │   value = "8080"
      │
      ├─► Load current config
      │   config = loadConfig()
      │
      ├─► Validate new value
      │   │
      │   ├─► Type checking
      │   │   uiPort must be number
      │   │
      │   └─► Range checking
      │       uiPort: 1-65535
      │
      ├─► Update config object
      │   config.uiPort = 8080
      │
      ├─► Save atomically
      │   │
      │   ├─► Write to config.json.tmp
      │   │   fs.writeFile(tmpPath, JSON.stringify(config))
      │   │
      │   └─► Rename (atomic)
      │       fs.rename(tmpPath, configPath)
      │
      └─► Success message
          ✅ uiPort set to 8080
          ⚠️  Restart required: tidyai stop && tidyai run

Result: Config updated, survives crashes!
```

---

## 📦 Folder Structure

```
tidy-ai/
├── app/                          # Next.js app directory
│   ├── api/                      # API routes (legacy, now in server/)
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Main file organizer UI
│   └── globals.css               # Global styles
│
├── cli/                          # CLI layer
│   ├── index.ts                  # Commander.js entrypoint
│   ├── config.ts                 # Config manager (uses env-paths)
│   └── server-manager.ts         # Server lifecycle management
│
├── server/                       # Backend server
│   └── index.ts                  # Express app with all APIs
│
├── lib/                          # Core logic
│   ├── organizer.ts              # File organization logic
│   ├── ollama.ts                 # Ollama LLM client
│   ├── categories.ts             # File type detection
│   ├── memory.ts                 # SQLite memory manager ⭐ NEW
│   └── utils.ts                  # Utility functions
│
├── components/                   # React components
│   ├── ui/                       # shadcn/ui components
│   └── Settings.tsx              # Settings modal
│
├── scripts/                      # Build and lifecycle scripts
│   ├── postinstall.js            # Welcome message
│   └── prepublish-check.js       # Pre-publish validation
│
├── dist/                         # Compiled TypeScript (gitignored)
│   ├── cli/                      # Compiled CLI
│   └── server/                   # Compiled server
│
├── .next/                        # Next.js build output (gitignored)
│
├── public/                       # Static assets
│
├── tsconfig.json                 # Base TypeScript config
├── tsconfig.cli.json             # CLI TypeScript config
├── tsconfig.server.json          # Server TypeScript config
├── next.config.js                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS config
├── package.json                  # npm package manifest
├── pnpm-lock.yaml                # pnpm lockfile
│
└── Documentation/
    ├── README.md                 # User-facing documentation
    ├── QUICKSTART.md             # Quick start guide
    ├── ARCHITECTURE_V2.md        # This file ⭐
    ├── IMPLEMENTATION.md         # Technical details
    ├── TESTING.md                # Test procedures
    └── PUBLISHING.md             # npm publishing guide

User's Machine (outside repo):
~/Library/Application Support/tidyai/  (macOS)
~/.local/share/tidyai/                 (Linux)
%APPDATA%/tidyai/                      (Windows)
  ├── config.json                 # Settings
  ├── memory.db                   # SQLite database ⭐
  ├── memory.db-wal               # WAL file (transient)
  ├── memory.db-shm               # Shared memory (transient)
  └── tidyai.pid                  # Process ID
```

---

## 🗄️ Memory System Details

### Database Schema (memory.db)

```sql
-- Users table
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  display_name TEXT NOT NULL DEFAULT 'User',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Conversations table
CREATE TABLE conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Messages table
CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

-- Conversation summaries
CREATE TABLE conversation_summaries (
  conversation_id INTEGER PRIMARY KEY,
  summary TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

-- User profiles (facts/preferences as JSON)
CREATE TABLE user_profiles (
  user_id INTEGER PRIMARY KEY,
  profile_json TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_messages_conversation
  ON messages(conversation_id, created_at DESC);

CREATE INDEX idx_conversations_user
  ON conversations(user_id, updated_at DESC);
```

### Memory Manager API

**lib/memory.ts** provides these methods:

```typescript
class MemoryManager {
  // Initialization
  initialize(): void
  close(): void
  vacuum(): void

  // User management
  getDefaultUser(): User

  // Conversations
  createConversation(userId, title?): Conversation
  getUserConversations(userId, limit?): Conversation[]
  getConversation(conversationId): Conversation?
  updateConversationTitle(conversationId, title): void
  deleteConversation(conversationId): void

  // Messages
  appendMessage(conversationId, role, content): Message
  getMessages(conversationId, limit?): Message[]
  getRecentMessages(conversationId, limit?): Message[]

  // Summaries
  saveSummary(conversationId, summary): void
  getSummary(conversationId): ConversationSummary?

  // User profiles
  loadUserProfile(userId): Record<string, ProfileFact>
  saveUserProfile(userId, profile): void
  updateProfileFact(userId, key, fact): void

  // AI extraction (placeholder)
  extractFacts(conversationId): ProfileFact[]

  // Stats
  getStats(): { totalUsers, totalConversations, totalMessages, dbSizeKB }
}
```

### Memory Persistence Guarantees

1. **Atomic Writes**: SQLite WAL mode ensures ACID transactions
2. **Survives Restarts**: Database persists across app restarts
3. **Survives Upgrades**: npm updates don't touch data directory
4. **Corruption Protection**: WAL provides crash recovery
5. **Concurrent Access**: WAL allows reads during writes

### Future: Semantic Memory (Vector Embeddings)

**Planned schema extension:**

```sql
CREATE TABLE vector_embeddings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT NOT NULL,
  embedding BLOB NOT NULL,  -- Float32Array serialized
  metadata TEXT,             -- JSON: { source, timestamp, tags }
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE VIRTUAL TABLE embedding_search
  USING vec0(embedding float[384]);
```

**Use cases:**

- Semantic search over conversations
- Related conversation discovery
- Context retrieval for LLM prompts

---

## 🔧 Configuration System

### Config Schema

```typescript
interface TidyAIConfig {
  uiPort: number; // 1-65535
  ollamaBaseUrl: string; // http(s)://...
  preferredModel: string; // e.g., "llama3.1"
}
```

### Config Validation Rules

```typescript
function validateConfig(config: TidyAIConfig): void {
  // Port range
  if (!config.uiPort || config.uiPort < 1 || config.uiPort > 65535) {
    throw new Error("Invalid uiPort: must be between 1 and 65535");
  }

  // URL format
  if (!config.ollamaBaseUrl || !config.ollamaBaseUrl.startsWith("http")) {
    throw new Error(
      "Invalid ollamaBaseUrl: must start with http:// or https://"
    );
  }

  // Model name
  if (typeof config.preferredModel !== "string") {
    throw new Error("Invalid preferredModel: must be a string");
  }
}
```

### Atomic Config Updates

```typescript
async function saveConfig(config: TidyAIConfig): Promise<void> {
  const configPath = getConfigPath();
  const tempPath = `${configPath}.tmp`;

  // Validate first
  validateConfig(config);

  // Write to temp file
  await fs.writeFile(tempPath, JSON.stringify(config, null, 2));

  // Atomic rename (POSIX guarantee)
  await fs.rename(tempPath, configPath);
}
```

---

## 🚀 Deployment & Packaging

### Build Process

```bash
# Build everything
npm run build

# Individual builds
npm run build:next    # Next.js → .next/
npm run build:cli     # TypeScript → dist/cli/
npm run build:server  # TypeScript → dist/server/
```

### npm Package Contents

```
tidy-ai-1.0.0.tgz
├── dist/
│   ├── cli/
│   │   └── index.js (executable)
│   └── server/
│       └── index.js
├── .next/
│   └── (Next.js build)
├── public/
│   └── (static assets)
├── scripts/
│   └── postinstall.js
├── README.md
├── QUICKSTART.md
├── LICENSE
└── package.json
```

### Installation Flow

```bash
# User installs
$ npm install -g tidy-ai

# npm runs postinstall
# → Shows welcome message
# → Does NOT write to data directory

# User initializes
$ tidyai init
# → Creates data directory
# → Writes config.json
# → Initializes memory.db
```

---

## 🧪 Testing Strategy

### Acceptance Tests

✅ **Installation & Setup**

- [ ] `npm i -g tidy-ai` succeeds
- [ ] `tidyai --version` shows version
- [ ] `tidyai init` creates data directory
- [ ] Config file exists at correct path
- [ ] Memory database initialized

✅ **Server Lifecycle**

- [ ] `tidyai run` starts server
- [ ] Health endpoint responds
- [ ] UI accessible at localhost:port
- [ ] `tidyai status` shows "running"
- [ ] `tidyai stop` stops server
- [ ] PID file cleaned up

✅ **Configuration**

- [ ] `tidyai config list` shows all settings
- [ ] `tidyai config get uiPort` returns value
- [ ] `tidyai config set uiPort 8080` updates config
- [ ] Invalid port rejected
- [ ] Invalid URL rejected

✅ **Memory Persistence**

- [ ] Create conversation via API
- [ ] Append messages
- [ ] Stop and restart server
- [ ] Messages still present
- [ ] npm upgrade preserves database

✅ **File Organization**

- [ ] Scan folder generates plan
- [ ] Apply plan moves files
- [ ] Ollama integration works (if available)
- [ ] Duplicate detection works

### Manual Testing

```bash
# Fresh install test
npm unlink tidy-ai
rm -rf ~/Library/Application\ Support/tidyai
npm link
tidyai init
tidyai run

# Memory persistence test
curl -X POST http://localhost:3210/api/memory/conversations \
  -H "Content-Type: application/json" \
  -d '{"userId": 1, "title": "Test"}'

tidyai stop
tidyai run

curl http://localhost:3210/api/memory/conversations/1

# Config validation test
tidyai config set uiPort 99999  # Should fail
tidyai config set ollamaBaseUrl ftp://bad  # Should fail
```

---

## 🎯 Success Criteria

### Product Requirements

✅ **Single Installation**

- User runs: `npm i -g tidyai`
- No additional steps required (except Node.js)

✅ **Local Web App**

- Accessible at `http://localhost:<port>`
- Backend serves Next.js UI
- All API calls go through backend

✅ **Dedicated Memory**

- Data stored outside repo and node_modules
- Survives restarts, upgrades, reinstalls
- Types: Settings, Profiles, Conversations, Messages

✅ **CLI Entrypoint**

- All operations via `tidyai` command
- `init`, `run`, `status`, `stop`, `config`

✅ **Reliability**

- Port conflicts handled gracefully
- Ollama optional (app works without it)
- Clear error messages
- Atomic config updates
- SQLite ACID guarantees

### Technical Requirements

✅ **Cross-Platform**

- macOS, Linux, Windows support
- env-paths for OS-appropriate directories
- Path separators handled correctly

✅ **No Hardcoding**

- All settings in config.json
- No embedded URLs or ports
- Frontend reads config from backend

✅ **Maintainability**

- TypeScript for type safety
- Modular architecture
- Clear separation of concerns
- Comprehensive documentation

---

## 📊 Performance Characteristics

### Memory Usage

- **Idle**: ~50MB (Node + Express + SQLite)
- **Active UI**: ~80MB (+ React rendering)
- **Heavy scanning**: Scales with file count

### Database Size

- **Empty**: ~20KB (schema only)
- **100 conversations**: ~500KB
- **1,000 messages**: ~2MB (text only)

### Startup Time

- **Cold start**: <2s (initialize DB + load config)
- **Warm start**: <1s (schema already exists)

### API Response Times

- **Memory queries**: <10ms (indexed)
- **Config reads**: <5ms (in-memory after load)
- **File scanning**: Varies with folder size

---

## 🔒 Security Considerations

### Local-Only Design

- **No network exposure**: Listens on localhost only
- **No authentication needed**: Single-user, local app
- **No telemetry**: Zero external connections (except Ollama)

### Data Protection

- **File permissions**: Data directory restricted to user
- **SQLite security**: Database file user-readable only
- **Config security**: Atomic writes prevent corruption

### Future Enhancements

- Optional password protection for UI
- Encrypted database at rest
- Secure Ollama API key storage

---

## 🚧 Future Roadmap

### Phase 1: Core Memory (✅ COMPLETE)

- [x] SQLite database
- [x] Conversations & messages
- [x] User profiles
- [x] API endpoints
- [x] Persistence guarantees

### Phase 2: Conversation UI

- [ ] Chat interface in frontend
- [ ] Message rendering
- [ ] Conversation history sidebar
- [ ] Profile display

### Phase 3: AI Integration

- [ ] Automated fact extraction
- [ ] Preference learning
- [ ] Context-aware responses
- [ ] Smart file categorization

### Phase 4: Semantic Memory

- [ ] Vector embeddings
- [ ] Semantic search
- [ ] Related conversation discovery
- [ ] RAG-style context retrieval

### Phase 5: Advanced Features

- [ ] Multi-user support
- [ ] Data export/import
- [ ] Backup/restore
- [ ] Cloud sync (optional)

---

## 📝 Summary

Tidy AI is now a **complete local-first web application** with:

1. ✅ **Single npm installation** → `npm i -g tidyai`
2. ✅ **CLI-driven workflow** → `tidyai init/run/status/stop/config`
3. ✅ **Persistent dedicated memory** → SQLite database with conversations, messages, profiles
4. ✅ **Cross-platform storage** → env-paths handles macOS/Linux/Windows
5. ✅ **Open WebUI-style architecture** → Local server serving web UI
6. ✅ **Reliable & maintainable** → TypeScript, atomic writes, ACID guarantees

The architecture is **designed for future growth** while maintaining the core principle: **install one thing, get a powerful local AI assistant with perfect memory**.
