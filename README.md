# 🤖 AI File Management

<div align="center">

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![Platform](https://img.shields.io/badge/Platform-macOS-lightgrey)

**A smart, safe, and beautiful web application for organizing your macOS Downloads folder using AI-powered categorization and a "plan-then-apply" workflow.**

[Features](#features) • [Installation](#installation) • [Usage](#usage) • [Documentation](#documentation) • [Contributing](#contributing)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage Guide](#usage-guide)
- [File Organization](#file-organization)
- [Configuration](#configuration)
- [Safety Features](#safety-features)
- [AI Integration](#ai-integration)
- [API Documentation](#api-documentation)
- [Tech Stack](#tech-stack)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## 🌟 Overview

AI File Management is a localhost web application designed specifically for macOS users who want to automatically organize their cluttered Downloads folder. Unlike traditional file organizers that immediately move files, this application follows a **safe "plan-then-apply" workflow** that lets you review all changes before they happen.

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
- **macOS**: This application is designed specifically for macOS
- **Ollama** (Optional): For AI-powered categorization ([Download](https://ollama.ai))

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/ai-file-management.git
cd ai-file-management
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Set Up Ollama (Optional)

If you want AI-powered categorization:

```bash
# Install Ollama from https://ollama.ai
# Then pull a model:
ollama pull llama3.1

# Verify it's running:
curl http://localhost:11434/api/version
```

---

## 🎯 Quick Start

### 1. Start the Development Server

```bash
npm run dev
```

### 2. Open Your Browser

Navigate to [http://localhost:3000](http://localhost:3000)

### 3. Test Safely

Create a test directory first:

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

| Option | Description | Default |
|--------|-------------|---------|
| **Source Folder** | Directory to scan for files | `~/Downloads` |
| **Destination Folder** | Where organized files go | `~/Downloads/Organized` |
| **Use Ollama** | Enable AI categorization | `false` |
| **Ollama Model** | Model name for AI | `llama3.1` |
| **Detect Duplicates** | Find duplicate files | `false` |

### Understanding the Plan

After scanning, you'll see:

- **Total Files**: Number of files found
- **Categories**: How many category types
- **Unknown**: Files that needed AI categorization
- **Duplicates**: Files identified as duplicates

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

| Category | Extensions |
|----------|-----------|
| **Images** | `png`, `jpg`, `jpeg`, `heic`, `gif`, `webp` |
| **Docs** | `pdf`, `doc`, `docx`, `ppt`, `pptx`, `txt`, `md` |
| **Spreadsheets** | `xls`, `xlsx`, `csv` |
| **Audio** | `mp3`, `wav`, `m4a`, `flac` |
| **Video** | `mp4`, `mov`, `mkv` |
| **Apps** | `dmg`, `pkg` |
| **Archives** | `zip`, `rar`, `7z`, `tar`, `gz` |
| **Code** | `py`, `js`, `ts`, `json`, `html`, `css`, `ipynb` |
| **Other** | All other extensions |
| **Duplicates** | Files matching existing hash+size |

### Date-Based Organization

Files are organized by their **last modified date**:
- **Year**: 4-digit year (e.g., `2026`)
- **Month**: 2-digit month (e.g., `02`)
- **Category**: Determined by extension or AI

---

## ⚙️ Configuration

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

```
You are a file categorization assistant. Given a filename 
and extension, output ONLY the category name from this list:
Images, Docs, Spreadsheets, Audio, Video, Apps, Archives, 
Code, Other.

Filename: example-file.xyz
Extension: .xyz

Output ONLY ONE category name, nothing else.
```

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
  "plan": { /* OrganizationPlan */ },
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
  "plan": { /* OrganizationPlan */ }
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
ai-file-management/
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

---

## 🔧 Troubleshooting

### Permission Errors

**Problem**: "Permission denied" when accessing Downloads

**Solution**:
1. Go to **System Settings → Privacy & Security → Full Disk Access**
2. Click the **+** button
3. Add **Terminal** or your IDE

### Ollama Not Working

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

Copyright (c) 2026 AI File Management Contributors

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

[Report Bug](https://github.com/yourusername/ai-file-management/issues) • [Request Feature](https://github.com/yourusername/ai-file-management/issues)

</div>
