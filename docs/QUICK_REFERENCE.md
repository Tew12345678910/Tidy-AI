# Tidy AI - Quick Reference

## 🚀 Installation

```bash
npm install -g tidy-ai
tidyai init
tidyai run
```

Open: http://localhost:3210

---

## 🖥️ CLI Commands

```bash
# Setup
tidyai init                              # Initialize config + database

# Server Management
tidyai run                               # Start (foreground)
tidyai run -d                            # Start (background)
tidyai status                            # Check status
tidyai stop                              # Stop server

# Configuration
tidyai config list                       # Show all settings
tidyai config get uiPort                 # Get specific value
tidyai config set uiPort 8080            # Set value
tidyai config set ollamaBaseUrl http://localhost:11434
tidyai config set preferredModel llama3.1
```

---

## 📁 Data Storage

### Location (env-paths):

- **macOS**: `~/Library/Application Support/tidyai/`
- **Linux**: `~/.local/share/tidyai/`
- **Windows**: `%APPDATA%/tidyai/`

### Files:

- `config.json` - Settings
- `memory.db` - Conversations, messages, profiles
- `tidyai.pid` - Process ID (temporary)

---

## 🧠 Memory API

Base URL: `http://localhost:3210/api/memory`

### Statistics

```bash
curl http://localhost:3210/api/memory/stats
```

### User

```bash
curl http://localhost:3210/api/memory/user
```

### Profile

```bash
# Get profile
curl http://localhost:3210/api/memory/profile/1

# Update profile
curl -X PUT http://localhost:3210/api/memory/profile/1 \
  -H "Content-Type: application/json" \
  -d '{"profile": {"name": {"value": "John", "confidence": 1.0}}}'
```

### Conversations

```bash
# Create conversation
curl -X POST http://localhost:3210/api/memory/conversations \
  -H "Content-Type: application/json" \
  -d '{"userId": 1, "title": "My Chat"}'

# List conversations
curl http://localhost:3210/api/memory/conversations/1

# Get specific conversation
curl http://localhost:3210/api/memory/conversation/1

# Update title
curl -X PATCH http://localhost:3210/api/memory/conversation/1 \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Title"}'

# Delete conversation
curl -X DELETE http://localhost:3210/api/memory/conversation/1
```

### Messages

```bash
# Append message
curl -X POST http://localhost:3210/api/memory/messages \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": 1,
    "role": "user",
    "content": "Hello!"
  }'

# Get messages
curl http://localhost:3210/api/memory/messages/1

# Get messages (limited)
curl http://localhost:3210/api/memory/messages/1?limit=20
```

### Summaries

```bash
# Get summary
curl http://localhost:3210/api/memory/summary/1

# Save summary
curl -X POST http://localhost:3210/api/memory/summary \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": 1,
    "summary": "User asked about file organization..."
  }'
```

---

## 🛠️ Development

### Build

```bash
pnpm install                    # Install dependencies
pnpm run build                  # Build everything
pnpm run build:next             # Build Next.js only
pnpm run build:cli              # Build CLI only
pnpm run build:server           # Build server only
```

### Test Locally

```bash
npm link                        # Link for local testing
tidyai init
tidyai run
```

### Publish

```bash
npm run prepublish-check        # Validate before publishing
npm login
npm publish
```

---

## 📊 Architecture

```
CLI → Config Manager → Express Server → Next.js UI
                    ↓
                Memory Manager (SQLite)
                    ↓
                memory.db
                 ├── users
                 ├── conversations
                 ├── messages
                 ├── conversation_summaries
                 └── user_profiles
```

---

## 🔧 Configuration Options

| Key              | Type   | Range          | Default                |
| ---------------- | ------ | -------------- | ---------------------- |
| `uiPort`         | number | 1-65535        | 3210                   |
| `ollamaBaseUrl`  | string | http(s):// URL | http://127.0.0.1:11434 |
| `preferredModel` | string | any            | llama3.1               |

---

## 📁 File Organization

### Directory Structure

```
{Destination}/
├── YYYY/
│   ├── MM - Images/
│   ├── MM - Docs/
│   ├── MM - Videos/
│   └── MM - Duplicates/
└── _plans/
    ├── plan-{timestamp}.json
    ├── plan-{timestamp}.csv
    └── summary-{timestamp}.txt
```

### Categories

- **Images**: jpg, jpeg, png, gif, bmp, svg, webp, ico, heic
- **Docs**: pdf, doc, docx, txt, rtf, odt, pages
- **Videos**: mp4, mov, avi, mkv, flv, wmv, webm
- **Audio**: mp3, wav, flac, aac, ogg, m4a, wma
- **Archives**: zip, rar, 7z, tar, gz, bz2
- **Code**: js, ts, py, java, cpp, c, h, css, html, json, xml, yml, yaml, sh, bash
- **Spreadsheets**: xls, xlsx, csv, ods, numbers
- **Presentations**: ppt, pptx, key, odp
- **EBooks**: epub, mobi, azw, azw3

---

## 🔍 Common Tasks

### Check if Ollama is Running

```bash
curl http://localhost:11434/api/version
```

### View Memory Database

```bash
# macOS
sqlite3 ~/Library/Application\ Support/tidyai/memory.db ".tables"

# Linux
sqlite3 ~/.local/share/tidyai/memory.db ".tables"
```

### Clear Memory (Fresh Start)

```bash
# macOS
rm -rf ~/Library/Application\ Support/tidyai/memory.db

# Linux
rm -rf ~/.local/share/tidyai/memory.db

# Then re-initialize
tidyai init
```

### Check Server Logs

```bash
# If running in foreground: see terminal output

# If running in background: check system logs
# macOS
log show --predicate 'process == "node"' --last 5m

# Linux
journalctl -u tidyai --since "5 minutes ago"
```

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Find process using port 3210
lsof -i :3210

# Kill process
kill -9 <PID>

# Or change port
tidyai config set uiPort 8080
tidyai run
```

### Ollama Not Connecting

```bash
# Check if Ollama is running
curl http://localhost:11434/api/version

# Start Ollama
ollama serve

# Or disable Ollama in UI
# (uncheck "Use Ollama for unknown files")
```

### Database Locked

```bash
# Stop server
tidyai stop

# Check for stale PIDs
cat ~/Library/Application\ Support/tidyai/tidyai.pid

# Remove PID file if stale
rm ~/Library/Application\ Support/tidyai/tidyai.pid

# Restart
tidyai run
```

### Build Fails

```bash
# Clean and rebuild
rm -rf dist .next node_modules
pnpm install
pnpm run build
```

---

## 📚 Documentation

- **README.md** - Main documentation
- **QUICKSTART.md** - Quick start guide
- **ARCHITECTURE_V2.md** - Complete system architecture
- **IMPLEMENTATION.md** - Technical implementation details
- **TESTING.md** - Testing procedures
- **PUBLISHING.md** - npm publishing guide
- **MEMORY_IMPLEMENTATION_COMPLETE.md** - Memory system summary

---

## 🎯 Key Features

### File Organization

- ✅ AI-powered categorization (with Ollama)
- ✅ Rule-based categorization (without Ollama)
- ✅ Duplicate detection
- ✅ Safe file moves (never deletes)
- ✅ Detailed logging
- ✅ Plan preview before applying

### Memory System ⭐ NEW

- ✅ Persistent conversations
- ✅ Message history
- ✅ User profiles with facts/preferences
- ✅ Conversation summaries
- ✅ Survives restarts and upgrades
- ✅ ACID transaction guarantees

### UI

- ✅ Modern shadcn/ui components
- ✅ Real-time status updates
- ✅ Search and filter operations
- ✅ Statistics dashboard
- ✅ Settings modal

---

## 💡 Tips

1. **First Time**: Always run `tidyai init` before starting
2. **Ollama**: Optional but recommended for better categorization
3. **Background Mode**: Use `-d` flag for daemon mode
4. **Port Conflicts**: Change port with `tidyai config set uiPort <port>`
5. **Memory**: Database grows over time, monitor with `/api/memory/stats`
6. **Backups**: Manually backup data directory periodically
7. **Updates**: `npm update -g tidy-ai` preserves all data

---

## 🔗 Links

- **Repository**: https://github.com/Tew12345678910/Ai-file-management
- **npm Package**: https://www.npmjs.com/package/tidy-ai
- **Issues**: https://github.com/Tew12345678910/Ai-file-management/issues
- **Ollama**: https://ollama.ai

---

**Version**: 1.0.0  
**License**: MIT  
**Node.js**: >=18.0.0
