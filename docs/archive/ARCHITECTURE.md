# Tidy AI - Complete System Diagram

## Installation Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    INSTALLATION FLOW                         │
└─────────────────────────────────────────────────────────────┘

User Terminal
    │
    ├─► npm install -g tidyai
    │   └─► Downloads from npm registry
    │       └─► Runs postinstall script
    │           └─► Shows welcome message
    │
    ├─► tidyai init
    │   └─► Creates ~/.tidyai/
    │       └─► Writes config.json with defaults
    │           └─► Returns success message
    │
    └─► tidyai run
        └─► Reads config.json
            └─► Spawns Express server
                └─► Server starts on port 3210
                    └─► Serves Next.js UI
```

## Runtime Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                        USER MACHINE                             │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                      USER LAYER                           │ │
│  │                                                           │ │
│  │  Terminal                        Browser                 │ │
│  │     │                               │                    │ │
│  │     │  $ tidyai init                │  localhost:3210    │ │
│  │     │  $ tidyai run                 │                    │ │
│  │     │  $ tidyai status              │                    │ │
│  │     │  $ tidyai config set          │                    │ │
│  │     │                               │                    │ │
│  └─────┼───────────────────────────────┼────────────────────┘ │
│        │                               │                      │
│  ┌─────▼───────────────────────────────▼────────────────────┐ │
│  │                      CLI LAYER                            │ │
│  │                                                           │ │
│  │  ┌──────────────────────────────────────────────────┐   │ │
│  │  │  Commander.js                                     │   │ │
│  │  │  - Parse commands                                 │   │ │
│  │  │  - Route to handlers                              │   │ │
│  │  │  - Format output                                  │   │ │
│  │  └──────────────────────────────────────────────────┘   │ │
│  │                          │                                │ │
│  │  ┌──────────────────────▼───────────────────────────┐   │ │
│  │  │  Config Manager                                   │   │ │
│  │  │  - Load/Save config.json                          │   │ │
│  │  │  - Validate settings                              │   │ │
│  │  │  - OS-appropriate paths                           │   │ │
│  │  │  - Atomic writes                                  │   │ │
│  │  └──────────────────────┬───────────────────────────┘   │ │
│  │                          │                                │ │
│  │  ┌──────────────────────▼───────────────────────────┐   │ │
│  │  │  Server Manager                                   │   │ │
│  │  │  - Spawn server process                           │   │ │
│  │  │  - Inject env vars                                │   │ │
│  │  │  - Manage PID file                                │   │ │
│  │  │  - Handle lifecycle                               │   │ │
│  │  └──────────────────────┬───────────────────────────┘   │ │
│  └─────────────────────────┼───────────────────────────────┘ │
│                            │                                  │
│  ┌─────────────────────────▼───────────────────────────────┐ │
│  │                   SERVER LAYER                           │ │
│  │                                                          │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │  Express.js Server                                │  │ │
│  │  │                                                   │  │ │
│  │  │  Environment Variables:                           │  │ │
│  │  │  • TIDYAI_PORT=3210                              │  │ │
│  │  │  • TIDYAI_OLLAMA_BASE_URL                        │  │ │
│  │  │  • TIDYAI_PREFERRED_MODEL                        │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  │           │              │              │               │ │
│  │  ┌────────▼──────┐  ┌───▼────────┐  ┌─▼──────────┐   │ │
│  │  │  Static Files │  │ API Routes │  │  Middleware│   │ │
│  │  │               │  │            │  │            │   │ │
│  │  │  • Next.js    │  │ /health    │  │ • CORS     │   │ │
│  │  │  • Public     │  │ /api/plan  │  │ • JSON     │   │ │
│  │  │  • Assets     │  │ /api/apply │  │ • Logging  │   │ │
│  │  │               │  │ /api/...   │  │            │   │ │
│  │  └───────────────┘  └────────────┘  └────────────┘   │ │
│  └──────────────────────────┬───────────────────────────┘ │
│                             │                              │
│  ┌──────────────────────────▼───────────────────────────┐ │
│  │                   BUSINESS LOGIC LAYER                │ │
│  │                                                        │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │ │
│  │  │  Organizer   │  │  Categories  │  │   Ollama   │ │ │
│  │  │              │  │              │  │   Client   │ │ │
│  │  │ • Scan files │  │ • Extension  │  │            │ │ │
│  │  │ • Generate   │  │   mapping    │  │ • Health   │ │ │
│  │  │   plan       │  │ • Generic    │  │   check    │ │ │
│  │  │ • Apply plan │  │   detection  │  │ • Generate │ │ │
│  │  │ • Hash files │  │              │  │   category │ │ │
│  │  └──────────────┘  └──────────────┘  └──────┬─────┘ │ │
│  └─────────────────────────────────────────────┼───────┘ │
│                                                 │         │
│  ┌──────────────────────────────────────────────▼───────┐ │
│  │                  EXTERNAL SERVICES                    │ │
│  │                                                       │ │
│  │  ┌─────────────────────────────────────────────────┐ │ │
│  │  │  Ollama Server (Optional)                       │ │ │
│  │  │                                                 │ │ │
│  │  │  http://localhost:11434                        │ │ │
│  │  │  • llama3.1 model                              │ │ │
│  │  │  • API: /api/generate                          │ │ │
│  │  │  • API: /api/version                           │ │ │
│  │  └─────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  FILE SYSTEM LAYER                   │   │
│  │                                                      │   │
│  │  ~/.tidyai/                  ~/Downloads/           │   │
│  │  ├── config.json            ├── file1.pdf           │   │
│  │  └── tidyai.pid             ├── photo.jpg           │   │
│  │                              └── song.mp3            │   │
│  │                                                      │   │
│  │  ~/Downloads/Organized/                             │   │
│  │  ├── 2026/                                          │   │
│  │  │   └── 02 - Docs/                                 │   │
│  │  │       └── file1.pdf                              │   │
│  │  ├── _plans/                                        │   │
│  │  │   ├── plan-xxx.json                              │   │
│  │  │   └── summary-xxx.txt                            │   │
│  │  └── ...                                            │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow - Plan Generation

```
┌────────────────────────────────────────────────────────────┐
│                  PLAN GENERATION FLOW                       │
└────────────────────────────────────────────────────────────┘

1. User clicks "Scan & Generate Plan" in UI
   │
   ├─► POST /api/plan
   │   {
   │     sourceFolder: "~/Downloads",
   │     destFolder: "~/Downloads/Organized",
   │     useOllama: true,
   │     ollamaModel: "llama3.1",
   │     detectDuplicates: true
   │   }
   │
   ├─► Server receives request
   │   │
   │   ├─► Calls lib/organizer.generatePlan()
   │   │   │
   │   │   ├─► Scan directory recursively
   │   │   │   └─► Find all files
   │   │   │
   │   │   ├─► For each file:
   │   │   │   │
   │   │   │   ├─► Get extension
   │   │   │   │   └─► lib/categories.getCategoryFromExtension()
   │   │   │   │
   │   │   │   ├─► If unknown:
   │   │   │   │   └─► lib/categories.isGenericFilename()
   │   │   │   │       │
   │   │   │   │       ├─► If generic or unknown:
   │   │   │   │       │   └─► lib/ollama.categorizeWithOllama()
   │   │   │   │       │       └─► HTTP POST to Ollama
   │   │   │   │       │           └─► Returns category
   │   │   │   │       │
   │   │   │   │       └─► Else: use extension category
   │   │   │   │
   │   │   │   ├─► If detectDuplicates:
   │   │   │   │   └─► Calculate SHA256 hash
   │   │   │   │       └─► Check for duplicates
   │   │   │   │
   │   │   │   └─► Create FileOperation
   │   │   │       {
   │   │   │         src: "/path/to/file.pdf",
   │   │   │         dst: "/organized/2026/02 - Docs/file.pdf",
   │   │   │         category: "Docs",
   │   │   │         reason: "Extension-based"
   │   │   │       }
   │   │   │
   │   │   ├─► Generate plan structure
   │   │   │   └─► Group operations by category
   │   │   │       └─► Calculate statistics
   │   │   │
   │   │   └─► Write plan files
   │   │       ├─► plan-<timestamp>.json
   │   │       ├─► plan-<timestamp>.csv
   │   │       └─► summary-<timestamp>.txt
   │   │
   │   └─► Return PlanResult
   │       {
   │         plan: { ... },
   │         filesWritten: { ... },
   │         stats: {
   │           totalFiles: 42,
   │           categoryCounts: { "Docs": 15, ... },
   │           unknownCount: 3,
   │           duplicateCount: 2
   │         }
   │       }
   │
   └─► UI receives response
       │
       ├─► Display statistics
       ├─► Populate operations table
       └─► Enable "Apply Plan" button
```

## Data Flow - Plan Application

```
┌────────────────────────────────────────────────────────────┐
│                  PLAN APPLICATION FLOW                      │
└────────────────────────────────────────────────────────────┘

1. User clicks "Apply Plan" → Confirms dialog
   │
   ├─► POST /api/apply
   │   {
   │     plan: {
   │       operations: [...],
   │       source: "~/Downloads",
   │       dest: "~/Downloads/Organized"
   │     }
   │   }
   │
   ├─► Server receives request
   │   │
   │   ├─► Calls lib/organizer.applyPlan()
   │   │   │
   │   │   ├─► For each operation:
   │   │   │   │
   │   │   │   ├─► Verify source file exists
   │   │   │   │
   │   │   │   ├─► Create destination directory
   │   │   │   │   └─► fs.mkdir(recursive: true)
   │   │   │   │
   │   │   │   ├─► Move file
   │   │   │   │   └─► fs.rename() or fs.copyFile() + fs.unlink()
   │   │   │   │
   │   │   │   └─► Track result
   │   │   │       └─► { success: true/false, error?: string }
   │   │   │
   │   │   └─► Return ApplyResult
   │   │       {
   │   │         success: true,
   │   │         movedCount: 40,
   │   │         failedCount: 2,
   │   │         details: [...]
   │   │       }
   │   │
   │   └─► Return response to UI
   │
   └─► UI receives response
       │
       ├─► Display success message
       ├─► Show moved count
       └─► Reset form
```

## Configuration Management Flow

```
┌────────────────────────────────────────────────────────────┐
│                CONFIGURATION MANAGEMENT                     │
└────────────────────────────────────────────────────────────┘

Terminal: $ tidyai config set uiPort 8080
   │
   ├─► CLI parses command
   │   └─► Commander.js routes to config.set()
   │
   ├─► cli/config.setConfigValue()
   │   │
   │   ├─► Load current config
   │   │   └─► Read ~/.tidyai/config.json
   │   │
   │   ├─► Validate new value
   │   │   └─► Check type and range
   │   │
   │   ├─► Update config object
   │   │   └─► config.uiPort = 8080
   │   │
   │   └─► Save atomically
   │       ├─► Write to config.json.tmp
   │       └─► Rename to config.json
   │
   └─► CLI shows success message
       └─► "✅ Set uiPort = 8080"

Next run: $ tidyai run
   │
   ├─► cli/config.loadConfig()
   │   └─► Read ~/.tidyai/config.json
   │       └─► { uiPort: 8080, ... }
   │
   ├─► Set environment variables
   │   └─► TIDYAI_PORT=8080
   │
   └─► Spawn server with new port
       └─► Server starts on port 8080
```

## Error Handling Flow

```
┌────────────────────────────────────────────────────────────┐
│                     ERROR SCENARIOS                         │
└────────────────────────────────────────────────────────────┘

Scenario 1: Port Already in Use
   tidyai run
   │
   ├─► Server tries to bind port 3210
   │   └─► EADDRINUSE error
   │
   ├─► CLI catches error
   │   └─► Shows friendly message:
   │       "❌ Port 3210 is already in use"
   │       "Change with: tidyai config set uiPort <port>"
   │
   └─► Exit gracefully

Scenario 2: Ollama Not Running
   UI: Click "Test Connection"
   │
   ├─► GET /api/ollama/status
   │   │
   │   ├─► lib/ollama.checkOllamaConnection()
   │   │   └─► fetch() with 5s timeout
   │   │       └─► Connection refused
   │   │
   │   └─► Return: { connected: false, error: "..." }
   │
   └─► UI displays error alert
       └─► "❌ Ollama is not connected: Connection refused"

Scenario 3: Invalid Config Value
   tidyai config set uiPort 99999
   │
   ├─► cli/config.validateConfig()
   │   └─► Port > 65535
   │       └─► throw Error("Invalid port")
   │
   ├─► CLI catches error
   │   └─► Shows: "❌ Invalid uiPort: must be between 1 and 65535"
   │
   └─► Exit with code 1

Scenario 4: Stale PID File
   tidyai status
   │
   ├─► Read ~/.tidyai/tidyai.pid
   │   └─► PID: 12345
   │
   ├─► Check if process running
   │   └─► process.kill(12345, 0)
   │       └─► ESRCH (no such process)
   │
   └─► Show: "⚠️  Tidy AI is not running (stale PID file)"
```

## Complete Lifecycle

```
┌────────────────────────────────────────────────────────────┐
│                    COMPLETE LIFECYCLE                       │
└────────────────────────────────────────────────────────────┘

Installation
   npm install -g tidyai
   └─► Packages installed to global node_modules
       └─► Symlink created: /usr/local/bin/tidyai

Initialization
   tidyai init
   └─► Creates ~/.tidyai/config.json

Startup
   tidyai run
   ├─► Loads config
   ├─► Spawns server process
   ├─► Writes PID file
   └─► Server ready

Usage
   Open http://localhost:3210
   ├─► User configures source/dest
   ├─► Scans files
   ├─► Generates plan
   ├─► Reviews operations
   ├─► Applies plan
   └─► Files organized

Configuration Change
   tidyai config set uiPort 8080
   └─► Updates ~/.tidyai/config.json

Restart
   tidyai stop
   └─► Sends SIGTERM to process
       └─► Removes PID file

   tidyai run
   └─► Starts with new config

Uninstall
   npm uninstall -g tidyai
   ├─► Removes global package
   └─► Removes symlink

   rm -rf ~/.tidyai
   └─► Removes config and data
```
