# AI-Native File Organizer - Quick Start Guide

## 🚀 What's New

Your file organizer now uses a **three-phase AI-native workflow** with local Ollama integration:

```
1. SCAN → Generate Manifest (understand context)
2. PLAN → AI proposes moves (with safety checks)
3. EXECUTE → Apply approved changes (with rollback)
```

## 🔥 Key Features

- ✅ **Project-Aware**: Never breaks code projects (detects `.git`, `package.json`, etc.)
- ✅ **AI Classification**: Uses Ollama to understand PDF content and file context
- ✅ **Safety First**: Collision detection, rollback files, dry-run mode
- ✅ **Local-First**: All AI runs locally via Ollama, no cloud dependencies
- ✅ **Learning System**: Remembers your preferences and improves over time

## 📦 Installation

```bash
# Install dependencies
npm install

# Build all components
npm run build

# Start development server
npm run dev
```

## 🔧 Setup Ollama

```bash
# Install Ollama
brew install ollama  # macOS
# or download from https://ollama.ai

# Pull a model
ollama pull llama3.1

# Verify it's running
curl http://localhost:11434/api/version
```

## 💻 API Usage

### Step 1: Scan Directory

```bash
curl -X POST http://localhost:3000/api/scan \
  -H "Content-Type: application/json" \
  -d '{
    "rootPath": "/Users/you/Downloads",
    "options": {
      "useAI": true,
      "ollamaModel": "llama3.1",
      "extractPdfMetadata": true
    }
  }'
```

**Returns:** Manifest with classified files, project roots detected, confidence scores

### Step 2: Generate Plan

```bash
curl -X POST http://localhost:3000/api/plan \
  -H "Content-Type: application/json" \
  -d '{
    "manifestId": "abc123",
    "manifest": { ... },
    "destRoot": "/Users/you/Downloads/Organized"
  }'
```

**Returns:** Organization plan with proposed moves, safety checks, rollback mapping

### Step 3: Execute Plan

```bash
curl -X POST http://localhost:3000/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "xyz789",
    "plan": { ... },
    "dryRun": false
  }'
```

**Returns:** Execution report with results, rollback file location

## 🎯 Example: Organize Downloads

```typescript
// 1. Scan
const scanResponse = await fetch('/api/scan', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    rootPath: '~/Downloads',
    options: { useAI: true }
  })
});
const { manifest } = await scanResponse.json();

// 2. Generate Plan
const planResponse = await fetch('/api/plan', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    manifestId: manifest.id,
    manifest,
    destRoot: '~/Downloads/Organized'
  })
});
const { plan } = await planResponse.json();

// 3. Review & Execute
if (plan.safetyCheck.passed) {
  const executeResponse = await fetch('/api/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      planId: plan.id,
      plan,
      dryRun: false
    })
  });
  const { report } = await executeResponse.json();
  console.log(`Moved ${report.summary.completed} files!`);
}
```

## 🛡️ Safety Guarantees

### What's Protected

- ✅ Project roots stay intact (entire folder moves only)
- ✅ Generated folders (`node_modules`, `.next`, `dist`) never touched individually
- ✅ `.git` directories protected
- ✅ Lock files (`package-lock.json`, `pnpm-lock.yaml`) safe

### Example: Safe Project Handling

```
Downloads/
├── MyReactApp/           ← Detected as project root
│   ├── package.json      ← Signal: project root
│   ├── .git/             ← Signal: version control
│   ├── node_modules/     ← Generated folder
│   └── src/
│       └── App.tsx       ← Inside project, won't move
└── Chemistry_Notes.pdf   ← Will organize
```

**Result:**
- `MyReactApp/` → Skipped (or moved as whole unit)
- `Chemistry_Notes.pdf` → Moved to `Chemistry Notes/`

## 📚 File Classification Examples

### PDF with Metadata

```
Input: chemistry_chapter1.pdf

Extraction:
- PDF Title: "Introduction to Organic Chemistry"
- PDF Subject: "Chemistry"
- Keywords: ["chemistry", "organic", "education"]
- First page text: "Chapter 1: Introduction..."

AI Classification:
- Category: "Chemistry Notes"
- Confidence: 0.92
- Reasoning: "Educational chemistry material based on title and content"

Output: Chemistry Notes/Introduction to Organic Chemistry.pdf
```

### Ambiguous File

```
Input: document_final_v2.pdf

Extraction:
- No PDF metadata
- Filename pattern: generic

AI Classification:
- Category: "Unknown"
- Confidence: 0.35
- Reasoning: "Insufficient information"

Output: Inbox/document_final_v2.pdf  ← Low confidence → Review
```

## ⚙️ Configuration

Settings are stored in:
- **macOS**: `~/Library/Application Support/tidyai/settings.json`
- **Linux**: `~/.local/share/tidyai/settings.json`
- **Windows**: `%APPDATA%/tidyai/settings.json`

### Update Settings

```bash
curl -X POST http://localhost:3000/api/settings \
  -H "Content-Type: application/json" \
  -d '{
    "ollamaBaseUrl": "http://localhost:11434",
    "ollamaModel": "llama3.1",
    "preferences": {
      "confidenceThresholds": {
        "autoApprove": 0.8,
        "requireReview": 0.5
      }
    }
  }'
```

## 🧪 Testing

### Test with Sample Directory

```bash
# Create test directory
mkdir -p ~/test-organize/{projects,documents,media}

# Add sample project
cd ~/test-organize/projects
git init sample-project
echo '{"name":"test"}' > sample-project/package.json

# Add sample files
curl -o ~/test-organize/documents/sample.pdf https://example.com/sample.pdf

# Run organizer
curl -X POST http://localhost:3000/api/scan \
  -H "Content-Type: application/json" \
  -d '{"rootPath": "/Users/you/test-organize"}'
```

### Verify Safety

```bash
# Check manifest - project should be detected
cat ~/test-organize/_tidyai/manifest-*.json | jq '.entries[] | select(.type == "ProjectRoot")'

# Check plan - project should be skipped
cat ~/test-organize/_tidyai/plan-*.json | jq '.safetyCheck'
```

## 🔄 Rollback

If something goes wrong:

```bash
# Find rollback file
ls ~/Downloads/Organized/_tidyai/rollback-*.json

# Rollback can be executed (future feature)
# For now, rollback file shows exact reverse mapping
```

## 📖 Documentation

- **Full Implementation**: [docs/AI_NATIVE_IMPLEMENTATION.md](./docs/AI_NATIVE_IMPLEMENTATION.md)
- **Architecture**: [docs/ARCHITECTURE_V2.md](./docs/ARCHITECTURE_V2.md)
- **Quick Reference**: [docs/QUICK_REFERENCE.md](./docs/QUICK_REFERENCE.md)

## 🐛 Troubleshooting

### Ollama Not Connected

```bash
# Start Ollama
ollama serve

# Or check if it's running
curl http://localhost:11434/api/version
```

### No Models Available

```bash
# Pull a model
ollama pull llama3.1

# List available models
ollama list
```

### Permission Denied

```bash
# Ensure app has access to directories
# On macOS: System Settings → Privacy & Security → Files and Folders
```

### Slow Scans

```bash
# For large directories, use depth limit
{
  "rootPath": "~/Downloads",
  "options": {
    "maxDepth": 5,
    "useAI": false  # Disable AI for speed
  }
}
```

## 🎓 Key Concepts

### Confidence Scores

- **0.8 - 1.0**: High confidence → Auto-approved
- **0.5 - 0.8**: Medium confidence → Requires review
- **0.0 - 0.5**: Low confidence → Sent to Inbox

### Action Types

- **move**: Different folder, same name
- **rename**: Same folder, different name
- **move-rename**: Both change
- **skip**: No action (project roots, keep in place)

### Handling Recommendations

- **keep**: Don't move (project roots, generated folders)
- **group**: Move with similar items (documents, media)
- **review**: Send to Inbox for manual review (low confidence)

## 🚦 Status Indicators

When viewing plans:

- 🟢 **Green**: High confidence, auto-approved
- 🟡 **Yellow**: Medium confidence, review recommended
- 🔴 **Red**: Low confidence, manual review required
- ⚫ **Gray**: Skipped (project root or keep in place)

## 💡 Tips

1. **Start with Dry Run**: Always test with `dryRun: true` first
2. **Review Low Confidence**: Check items with confidence < 0.5
3. **Back Up Important Data**: Before large operations
4. **Use Ignore Patterns**: Skip temporary files with `*.tmp`, `*.temp`
5. **Learn from Overrides**: When you correct AI decisions, they're remembered

## 🔮 Future Features

- [ ] **CLI Mode**: `tidyai organize ~/Downloads`
- [ ] **Automatic Rollback**: One-click undo
- [ ] **Batch Processing**: Handle 10,000+ files efficiently
- [ ] **Vector Search**: Semantic similarity for better grouping
- [ ] **Web UI**: Modern interface for the new workflow

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Tew12345678910/Ai-file-management/issues)
- **Documentation**: [docs/](./docs/)
- **Examples**: See `docs/AI_NATIVE_IMPLEMENTATION.md`

---

**Built with:** Next.js 14 • Ollama • TypeScript • Tailwind CSS

**License:** MIT
