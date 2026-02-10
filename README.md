# 🤖 Tidy AI

<div align="center">

[![npm version](https://badge.fury.io/js/tidy-ai.svg)](https://www.npmjs.com/package/tidy-ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![Platform](https://img.shields.io/badge/Platform-macOS%20%7C%20Linux%20%7C%20Windows-blue)

**A smart, safe, and beautiful CLI application for organizing your Downloads folder using AI-powered categorization and a "plan-then-apply" workflow.**

[Features](#features) • [Installation](#installation) • [Quick Start](#quick-start) • [Documentation](https://github.com/Tew12345678910/Tidy-AI/tree/main/docs)

> 📚 **Full Documentation**: See [docs/](https://github.com/Tew12345678910/Tidy-AI/tree/main/docs) for detailed guides, architecture, and API reference

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [CLI Commands](#cli-commands)
- [Usage Guide](#usage-guide)
- [File Organization](#file-organization)
- [Configuration](#configuration)
- [Architecture](#architecture)
- [AI Integration](#ai-integration)
- [API Documentation](#api-documentation)
- [Tech Stack](#tech-stack)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## 🌟 Overview

Tidy AI is a localhost web application designed specifically for macOS users who want to automatically organize their cluttered Downloads folder. Unlike traditional file organizers that immediately move files, this application follows a **safe "plan-then-apply" workflow** that lets you review all changes before they happen.

### Why This Project?

- 📁 **No more cluttered Downloads**: Automatically organize thousands of files in seconds
- 🛡️ **Safety first**: Review every operation before files are moved
- 🤖 **AI-powered**: Uses local Ollama models to categorize unknown file types
- 📊 **Smart organization**: Groups files by date and category for easy retrieval
- 🔍 **Duplicate detection**: Find and manage duplicate files
- 🌐 **Privacy-focused**: Runs entirely on localhost, no cloud services required

---

## ✨ Features

### Core Features

- 🔒 **Safe by Default**: Generates a detailed plan before moving any files
- 🤖 **AI-Powered Categorization**: Uses Ollama for intelligent file classification
- 📊 **Smart Organization**: Organizes files by `YYYY/MM - Category` structure
- 🔍 **Duplicate Detection**: Identifies duplicates using SHA256 hash + file size
- 📂 **Recursive Scanning**: Finds all files in folders and subfolders
- 🚫 **Never Deletes**: Only moves files, never removes them
- 📝 **Complete Logging**: Tracks all operations with detailed logs
- 💾 **Export Plans**: Download operation plans as JSON or CSV

### Memory & Persistence Features ⭐ NEW

- 🧠 **Dedicated Memory**: SQLite database stores conversations, messages, and user profiles
- 💬 **Conversation History**: All interactions persist across restarts and upgrades
- 👤 **User Profiles**: Learns facts and preferences over time
- 📊 **Memory Stats**: Track total conversations, messages, and database size
- 🔄 **Survives Upgrades**: Data stored outside npm package, never lost
- 🗂️ **Local-First**: Everything stored on your machine, no cloud required

### UI Features

- 🎨 **Modern Dashboard**: Beautiful, responsive interface built with shadcn/ui
- 🔎 **Search & Filter**: Quickly find files by name or category
- 📋 **Preview Operations**: See exactly what will happen before applying
- ⚠️ **Confirmation Dialogs**: Extra safety layer before moving files
- 📊 **Summary Statistics**: View file counts by category at a glance
- 🎯 **Category Badges**: Visual indicators for file types

---

## 🚀 Installation

### Prerequisites

- **Node.js**: Version 18 or higher ([Download](https://nodejs.org/))
- **Ollama** (Optional): For AI-powered categorization ([Download](https://ollama.ai))

### Install via npm (Recommended)

```bash
npm install -g tidy-ai
```

That's it! Tidy AI is now installed globally on your system.

### Alternative: Build from Source

```bash
# Clone the repository
git clone https://github.com/Tew12345678910/Tidy-AI.git
cd Tidy-AI

# Install dependencies
pnpm install

# Build the project
pnpm run build

# Link for local use
npm link
```

### First-Time Setup

1. **Initialize Tidy AI**:

   ```bash
   tidyai init
   ```

   This creates your configuration and memory database:

   - **macOS**: `~/Library/Application Support/tidyai/`
   - **Linux**: `~/.local/share/tidyai/`
   - **Windows**: `%APPDATA%/tidyai/`

2. **Set Up Ollama** (Optional but recommended):

   ```bash
   # Install Ollama from https://ollama.ai
   # Pull a model:
   ollama pull llama3.1

   # Verify it's running:
   curl http://localhost:11434/api/version
   ```

3. **Start Tidy AI**:

   ```bash
   tidyai run
   ```

4. **Open Your Browser**: Navigate to `http://localhost:3210`

---

## 🎯 Quick Start

### Basic Usage

```bash
# Initialize (first time only)
tidyai init

# Start the server
tidyai run

# In another terminal, check status
tidyai status

# Stop the server
tidyai stop
```

### Configuration

```bash
# List current configuration
tidyai config list

# Change UI port
tidyai config set uiPort 8080

# Change Ollama URL (e.g., remote instance)
tidyai config set ollamaBaseUrl http://192.168.1.100:11434

# Set preferred model
tidyai config set preferredModel llama3.1
```

### Using the Web UI

1. Open `http://localhost:3210` in your browser
2. Configure source and destination folders
3. Enable Ollama if you want AI categorization
4. Click "Scan & Generate Plan" to preview changes
5. Review the plan carefully
6. Click "Apply Plan" to organize files

### Test Safely First

Create a test directory to try it out:

```bash
# Create test folder with sample files
mkdir -p ~/test-downloads/subfolder
touch ~/test-downloads/document.pdf
touch ~/test-downloads/photo.jpg
touch ~/test-downloads/song.mp3
touch ~/test-downloads/subfolder/nested-file.txt
```

### 4. Run Your First Scan

1. Set **Source Folder** to `~/test-downloads`
2. Set **Destination Folder** to `~/test-downloads/organized`
3. Click **"Scan & Generate Plan"**
4. Review the operations in the table
5. Click **"Apply Plan"** and confirm

### 5. Check Results

```bash
# View organized files
ls -R ~/test-downloads/organized

# View plan files
cat ~/test-downloads/organized/_plans/summary-*.txt
```

---

## 📖 Usage Guide

### Basic Workflow

1. **Configure** → Set source and destination folders
2. **Scan** → Generate organization plan (dry run)
3. **Review** → Check the operations table
4. **Apply** → Move files after confirmation

### Configuration Options

| Option                 | Description                 | Default                 |
| ---------------------- | --------------------------- | ----------------------- |
| **Source Folder**      | Directory to scan for files | `~/Downloads`           |
| **Destination Folder** | Where organized files go    | `~/Downloads/Organized` |
| **Use Ollama**         | Enable AI categorization    | `false`                 |
| **Ollama Model**       | Model name for AI           | `llama3.1`              |
| **Test Connection**    | Check if Ollama is running  | Button to test          |
| **Detect Duplicates**  | Find duplicate files        | `false`                 |

### Understanding the Plan

After scanning, you'll see:

- **Total Files**: Number of files found
- **Categories**: How many category types
- **Unknown**: Files that needed AI categorization
- **Duplicates**: Files identified as duplicates

---

## 🖥️ CLI Commands

Tidy AI provides a powerful command-line interface for managing the application.

### Core Commands

#### `tidyai init`

Initialize Tidy AI configuration with defaults.

```bash
tidyai init
```

Creates `~/.tidyai/config.json` with default settings.

#### `tidyai run`

Start the Tidy AI server.

```bash
# Run in foreground (recommended for first-time)
tidyai run

# Run in background (detached mode)
tidyai run -d
```

#### `tidyai status`

Check if Tidy AI is currently running.

```bash
tidyai status
```

Displays:

- Running status
- Process ID (PID)
- Server URL
- Health check status

#### `tidyai stop`

Stop the Tidy AI server.

```bash
tidyai stop
```

Gracefully terminates the server process.

### Configuration Commands

#### `tidyai config list`

Display all configuration values.

```bash
tidyai config list
```

#### `tidyai config get <key>`

Get a specific configuration value.

```bash
tidyai config get uiPort
tidyai config get ollamaBaseUrl
tidyai config get preferredModel
```

#### `tidyai config set <key> <value>`

Set a configuration value.

```bash
# Change UI port (requires restart)
tidyai config set uiPort 8080

# Change Ollama URL for remote instance
tidyai config set ollamaBaseUrl http://192.168.1.100:11434

# Set preferred model
tidyai config set preferredModel llama3.1
```

**Valid configuration keys:**

- `uiPort` - Web UI port number (1-65535)
- `ollamaBaseUrl` - Ollama server URL (must start with http:// or https://)
- `preferredModel` - Default Ollama model name

### Configuration File Location

- **macOS**: `~/Library/Application Support/tidyai/`
- **Linux**: `~/.local/share/tidyai/`
- **Windows**: `%APPDATA%/tidyai/`

**Files stored:**

- `config.json` - Settings (port, Ollama URL, model)
- `memory.db` - SQLite database (conversations, messages, profiles)
- `tidyai.pid` - Process ID (temporary, for status tracking)

### Example Configuration Workflow

```bash
# First-time setup
tidyai init

# Customize settings
tidyai config set uiPort 3210
tidyai config set ollamaBaseUrl http://127.0.0.1:11434
tidyai config set preferredModel llama3.1

# Verify settings
tidyai config list

# Start server
tidyai run

# Check status in another terminal
tidyai status

# Stop when done
tidyai stop
```

---

## 🧠 Memory System

Tidy AI now includes a **persistent memory system** that stores conversations, messages, and user profiles in a local SQLite database.

### What Gets Remembered

- **Conversations**: Full history of all interactions
- **Messages**: Every message with role (user/assistant/system)
- **User Profiles**: Facts, preferences, and learned information
- **Summaries**: Condensed conversation summaries for context

### Memory API Endpoints

Tidy AI exposes REST APIs for memory management:

```bash
# Get memory statistics
GET /api/memory/stats

# User management
GET /api/memory/user

# Profile management
GET /api/memory/profile/:userId
PUT /api/memory/profile/:userId

# Conversations
POST /api/memory/conversations
GET /api/memory/conversations/:userId
GET /api/memory/conversation/:conversationId
PATCH /api/memory/conversation/:conversationId
DELETE /api/memory/conversation/:conversationId

# Messages
POST /api/memory/messages
GET /api/memory/messages/:conversationId

# Summaries
GET /api/memory/summary/:conversationId
POST /api/memory/summary
```

### Example: Using Memory API

```bash
# Get memory statistics
curl http://localhost:3210/api/memory/stats

# Response:
# {
#   "totalUsers": 1,
#   "totalConversations": 5,
#   "totalMessages": 234,
#   "dbSizeKB": 142
# }

# Create a conversation
curl -X POST http://localhost:3210/api/memory/conversations \
  -H "Content-Type: application/json" \
  -d '{"userId": 1, "title": "File Organization Chat"}'

# Append a message
curl -X POST http://localhost:3210/api/memory/messages \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": 1,
    "role": "user",
    "content": "Help me organize my downloads"
  }'

# Get conversation messages
curl http://localhost:3210/api/memory/messages/1
```

### Memory Persistence Guarantees

✅ **Survives Restarts**: All data persists when you stop and restart Tidy AI

✅ **Survives Upgrades**: npm updates don't touch your data directory

✅ **Survives Reinstalls**: Only deleted if you manually remove the data directory

✅ **ACID Transactions**: SQLite Write-Ahead Logging ensures data integrity

✅ **Atomic Updates**: Configuration changes are atomic (no partial writes)

### Database Schema

```sql
-- Users
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  display_name TEXT,
  created_at TEXT
);

-- Conversations
CREATE TABLE conversations (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  title TEXT,
  created_at TEXT,
  updated_at TEXT
);

-- Messages
CREATE TABLE messages (
  id INTEGER PRIMARY KEY,
  conversation_id INTEGER,
  role TEXT CHECK(role IN ('user', 'assistant', 'system')),
  content TEXT,
  created_at TEXT
);

-- Conversation summaries
CREATE TABLE conversation_summaries (
  conversation_id INTEGER PRIMARY KEY,
  summary TEXT,
  updated_at TEXT
);

-- User profiles (JSON storage)
CREATE TABLE user_profiles (
  user_id INTEGER PRIMARY KEY,
  profile_json TEXT,
  updated_at TEXT
);
```

---

## 📁 File Organization

### Directory Structure

Files are organized using this pattern:

```
{Destination}/
├── YYYY/
│   ├── MM - Images/
│   │   ├── photo1.jpg
│   │   └── photo2.png
│   ├── MM - Docs/
│   │   ├── document.pdf
│   │   └── report.docx
│   └── MM - Duplicates/
│       └── duplicate-file.jpg
└── _plans/
    ├── plan-2026-02-09T12-00-00.json
    ├── plan-2026-02-09T12-00-00.csv
    ├── summary-2026-02-09T12-00-00.txt
    ├── actions-2026-02-09T12-30-00.log
    └── applied-2026-02-09T12-30-00.json
```

### Categories

| Category         | Extensions                                       |
| ---------------- | ------------------------------------------------ |
| **Images**       | `png`, `jpg`, `jpeg`, `heic`, `gif`, `webp`      |
| **Docs**         | `pdf`, `doc`, `docx`, `ppt`, `pptx`, `txt`, `md` |
| **Spreadsheets** | `xls`, `xlsx`, `csv`                             |
| **Audio**        | `mp3`, `wav`, `m4a`, `flac`                      |
| **Video**        | `mp4`, `mov`, `mkv`                              |
| **Apps**         | `dmg`, `pkg`                                     |
| **Archives**     | `zip`, `rar`, `7z`, `tar`, `gz`                  |
| **Code**         | `py`, `js`, `ts`, `json`, `html`, `css`, `ipynb` |
| **Other**        | All other extensions                             |
| **Duplicates**   | Files matching existing hash+size                |

### Date-Based Organization

Files are organized by their **last modified date**:

- **Year**: 4-digit year (e.g., `2026`)
- **Month**: 2-digit month (e.g., `02`)
- **Category**: Determined by extension or AI

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```bash
# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
```

**Available Variables:**

- `OLLAMA_BASE_URL`: URL where Ollama is running (default: `http://localhost:11434`)

### Custom Categories

### Custom Categories

To add or modify categories, edit `lib/categories.ts`:

```typescript
export const CATEGORY_MAP: CategoryConfig = {
  Images: ["png", "jpg", "jpeg", "heic", "gif", "webp"],
  // Add your custom category:
  "3D Models": ["obj", "fbx", "blend", "stl"],
};
```

---

## 🛡️ Safety Features

### Core Safety Principles

1. ✅ **Never Deletes Files**: Only moves files, preserving all data
2. ✅ **Collision Handling**: Renames files automatically (`file (2).txt`)
3. ✅ **Detailed Logging**: Every operation is logged with timestamp
4. ✅ **Plan Preview**: Review all changes before applying
5. ✅ **Confirmation Dialog**: Extra confirmation before moving files
6. ✅ **Skips Destination**: Won't re-organize already organized files
7. ✅ **Rollback Info**: Logs contain original and final paths

### Plan Files

Before applying, these files are created:

- **`plan.json`**: Machine-readable operation list
- **`plan.csv`**: Spreadsheet-compatible format
- **`summary.txt`**: Human-readable summary

After applying:

- **`actions.log`**: Detailed operation log
- **`applied.json`**: Successfully applied operations

### Collision Handling

If `document.pdf` exists, new files are renamed:

- `document (2).pdf`
- `document (3).pdf`
- ... and so on

---

## 🏗️ Architecture

Tidy AI follows a local-first architecture inspired by Open WebUI, running entirely on your machine.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     User Machine                         │
│                                                          │
│  ┌────────────┐         ┌─────────────────┐            │
│  │  Terminal  │────────▶│   CLI (tidyai)  │            │
│  └────────────┘         └─────────────────┘            │
│                                │                         │
│                                ▼                         │
│                         ┌─────────────┐                 │
│                         │ Config Mgr  │                 │
│                         │ ~/.tidyai/  │                 │
│                         └─────────────┘                 │
│                                │                         │
│                                ▼                         │
│  ┌─────────────────────────────────────────┐           │
│  │         Express Server (Node.js)        │           │
│  │  - API Routes (/api/*)                  │           │
│  │  - Health Check (/health)               │           │
│  │  - Config Endpoints (/api/config)       │           │
│  │  - Serves Next.js Build                 │           │
│  └─────────────────────────────────────────┘           │
│                                │                         │
│                    ┌───────────┴───────────┐            │
│                    ▼                       ▼            │
│            ┌──────────────┐      ┌─────────────────┐   │
│            │  Next.js UI  │      │ File Organizer  │   │
│            │  (Browser)   │      │  + Categories   │   │
│            └──────────────┘      └─────────────────┘   │
│                    │                       │            │
│                    └───────────┬───────────┘            │
│                                ▼                         │
│                    ┌─────────────────────┐              │
│                    │   Ollama Client     │              │
│                    └─────────────────────┘              │
│                                │                         │
│                                ▼                         │
│                    ┌─────────────────────┐              │
│                    │  Ollama Server      │              │
│                    │  (localhost:11434)  │              │
│                    └─────────────────────┘              │
└─────────────────────────────────────────────────────────┘
```

### Component Overview

**CLI Layer** (`/cli`) - Commander.js based interface for `init`, `run`, `status`, `stop`, `config`

**Config Manager** (`/cli/config.ts`) - Persistent JSON storage with validation

**Server Layer** (`/server`) - Express.js serving Next.js build + API routes

**Frontend** (`/app`) - Next.js 14 with React and shadcn/ui components

**Core Logic** (`/lib`) - File organizer, categories, Ollama integration

### Data Flow

1. CLI reads config → Starts server with environment variables
2. Server loads Next.js build → Serves on configured port
3. UI makes API calls → Server processes with lib modules
4. Ollama integration → Backend-only, configurable URL

---

## 🤖 AI Integration

### How It Works

1. **Extension Check**: First tries to categorize by file extension
2. **Generic Filename Detection**: Checks if filename is too generic
3. **AI Categorization**: If unknown, sends to Ollama
4. **Fallback**: If AI fails, categorizes as "Other"

### Generic Filename Detection

These filenames trigger AI categorization:

- `download`, `file`, `document`, `untitled`
- `final`, `new`, `temp`, `copy`
- `image`, `photo`, `video`, `audio`

### Ollama Prompt

The system sends this prompt to Ollama:

````
You are a file categorization assistant. Given a filename
and extension, output ONLY the category name from this list:
Images, Docs, Spreadsheets, Audio, Video, Apps, Archives,
Code, Other.

Filename: example-file.xyz
Extension: .xyz

## 📡 API Documentation

Tidy AI provides a RESTful API for integration and automation.

### Health Check

#### GET `/health`

Check if the server is running.

**Response:**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "config": {
    "port": 3210,
    "ollamaBaseUrl": "http://127.0.0.1:11434",
    "preferredModel": "llama3.1"
  }
}
````

### Configuration

#### GET `/api/config`

Get current server configuration.

**Response:**

```json
{
  "uiPort": 3210,
  "ollamaBaseUrl": "http://127.0.0.1:11434",
  "preferredModel": "llama3.1"
}
```

### Ollama Integration

#### GET `/api/ollama/status`

Check Ollama connection status.

**Response:**

```json
{
  "connected": true,
  "version": "0.1.17"
}
```

**Error Response:**

```json
{
  "connected": false,
  "error": "Connection timeout - Ollama may not be running"
}
```

### File Organization

#### POST `/api/plan`

### Supported Models

Any Ollama model works, but recommended:

- `llama3.1` (default)
- `llama2`
- `mistral`
- `codellama`

---

## 📡 API Documentation

### POST `/api/plan`

Generate an organization plan.

**Request:**

```json
{
  "sourceFolder": "~/Downloads",
  "destFolder": "~/Downloads/Organized",
  "useOllama": true,
  "ollamaModel": "llama3.1",
  "detectDuplicates": true
}
```

**Response:**

```json
{
  "plan": {
    /* OrganizationPlan */
  },
  "filesWritten": {
    "planJson": "/path/to/plan.json",
    "planCsv": "/path/to/plan.csv",
    "summaryTxt": "/path/to/summary.txt"
  },
  "stats": {
    "totalFiles": 150,
    "categoryCounts": { "Images": 50, "Docs": 30 },
    "unknownCount": 5,
    "duplicateCount": 2
  }
}
```

### POST `/api/apply`

Apply a generated plan.

**Request:**

```json
{
  "plan": {
    /* OrganizationPlan */
  }
}
```

**Response:**

```json
{
  "result": {
    "appliedCount": 148,
    "errors": ["Failed to move file1.txt: Permission denied"]
  },
  "logPath": "/path/to/actions.log"
}
```

---

## 🛠️ Tech Stack

### Frontend

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Beautiful component library
- **Lucide React**: Icon system

### Backend

- **Next.js Route Handlers**: API endpoints
- **Node.js**: File system operations
- **Crypto**: SHA256 hashing for duplicates

### AI

- **Ollama**: Local LLM inference
- **REST API**: HTTP communication with Ollama

---

## 💻 Development

### Project Structure

```
tidy-ai/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── plan/         # Plan generation endpoint
│   │   └── apply/        # Plan application endpoint
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Main UI page
│   └── globals.css       # Global styles
├── components/            # React components
│   └── ui/               # shadcn/ui components
├── lib/                   # Core logic
│   ├── organizer.ts      # Main organization logic
│   ├── ollama.ts         # AI integration
│   ├── categories.ts     # Category definitions
│   └── utils.ts          # Utility functions
└── package.json          # Dependencies
```

### Build for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Linting

```bash
npm run lint
```

### Ollama Not Working

**Problem**: AI categorization fails or times out

**Solutions**:

1. **Test connection in the UI**: Click "Test Connection" button next to Ollama Model input

2. **Manual checks**:

```bash
# Check if Ollama is running
curl http://localhost:11434/api/version

# Start Ollama (if not running)
ollama serve

# Test model
ollama run llama3.1 "test"

# Pull model if not available
ollama pull llama3.1
```

3. **Check port**: Verify Ollama is running on port 11434 (default)

4. **Custom port**: If using a different port, update `.env`:

```bash
OLLAMA_BASE_URL=http://localhost:YOUR_PORT
```

**Problem**: AI categorization fails or times out

**Solutions**:

```bash
# Check if Ollama is running
curl http://localhost:11434/api/version

# Start Ollama
ollama serve

# Test model
ollama run llama3.1 "test"
```

### Port Already in Use

**Problem**: Port 3000 is already in use

**Solution**:

```bash
# Use a different port
PORT=3001 npm run dev
```

### Files Not Moving

**Problem**: Plan generates but files don't move

**Checklist**:

- ✅ Did you click "Apply Plan" (not just "Scan")?
- ✅ Did you confirm in the dialog?
- ✅ Check the console for errors
- ✅ Verify source files still exist
- ✅ Check destination folder permissions

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

### Reporting Bugs

1. Check if the issue already exists
2. Create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable

### Suggesting Features

1. Open an issue with the `enhancement` label
2. Describe the feature and use case
3. Explain why it would be useful

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Test thoroughly
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Development Guidelines

- Write TypeScript with proper types
- Follow existing code style
- Add comments for complex logic
- Test with real files before submitting
- Update README if adding features

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2026 Tidy AI Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🙏 Acknowledgments

- **[Next.js](https://nextjs.org/)** - The React framework for production
- **[shadcn/ui](https://ui.shadcn.com/)** - Beautiful component library
- **[Ollama](https://ollama.ai/)** - Local LLM inference
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Lucide](https://lucide.dev/)** - Beautiful icon set

---

<div align="center">

**Made with ❤️ for macOS users tired of messy Downloads folders**

⭐ Star this repo if you find it helpful!

[Report Bug](https://github.com/Tew12345678910/Tidy-AI/issues) • [Request Feature](https://github.com/Tew12345678910/Tidy-AI/issues)

</div>
