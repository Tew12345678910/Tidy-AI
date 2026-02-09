# Testing Guide for Tidy AI

## Prerequisites

Before testing, ensure you have:

- Node.js 18+ installed
- npm or pnpm installed
- Ollama installed (optional, for AI features)

## Local Development Testing

### 1. Setup

```bash
# Clone the repository
cd /Users/tew/Documents/Project/GitHub/Ai-file-management

# Install dependencies
npm install

# Build the project
npm run build
```

### 2. Link Locally

```bash
# Create global symlink for testing
npm link

# Verify installation
which tidyai
# Should show: /usr/local/bin/tidyai or similar
```

### 3. Test CLI Commands

```bash
# Test init command
tidyai init

# Check config was created
cat ~/.tidyai/config.json

# Test config commands
tidyai config list
tidyai config get uiPort
tidyai config set preferredModel llama3.1
tidyai config list

# Test status (should show not running)
tidyai status
```

### 4. Test Server Startup

```bash
# Start in foreground
tidyai run

# In another terminal:
tidyai status

# Test health endpoint
curl http://localhost:3210/health

# Stop with Ctrl+C
```

### 5. Test Background Mode

```bash
# Start in background
tidyai run -d

# Check status
tidyai status

# Test in browser
open http://localhost:3210

# Stop server
tidyai stop

# Verify stopped
tidyai status
```

## UI Testing

### 1. Access Web Interface

```bash
# Start server
tidyai run

# Open browser
open http://localhost:3210
```

### 2. Test File Organization

Create test files:

```bash
mkdir -p ~/test-downloads/subfolder
touch ~/test-downloads/document.pdf
touch ~/test-downloads/image.jpg
touch ~/test-downloads/song.mp3
touch ~/test-downloads/subfolder/nested.txt
echo "test content" > ~/test-downloads/test.txt
```

In the UI:

1. Set Source: `~/test-downloads`
2. Set Destination: `~/test-downloads/organized`
3. Click "Scan & Generate Plan"
4. Review the plan
5. Click "Apply Plan"
6. Confirm

Verify:

```bash
ls -R ~/test-downloads/organized
cat ~/test-downloads/organized/_plans/summary-*.txt
```

### 3. Test Settings UI

1. Click the gear icon (bottom-right)
2. Verify config values are displayed
3. Note the CLI commands shown
4. Close settings

### 4. Test Ollama Integration

If Ollama is installed:

```bash
# Start Ollama
ollama serve

# Pull a model
ollama pull llama3.1
```

In the UI:

1. Enable "Use Ollama"
2. Click "Test Connection"
3. Should show "Connected" with version
4. Create a file with unknown extension:
   ```bash
   touch ~/test-downloads/mystery.xyz
   ```
5. Run scan - should use AI to categorize

## Configuration Testing

### Test Port Changes

```bash
# Change port
tidyai config set uiPort 8080

# Restart server
tidyai stop
tidyai run -d

# Verify new port
curl http://localhost:8080/health
open http://localhost:8080
```

### Test Ollama URL Changes

```bash
# Change to custom Ollama URL
tidyai config set ollamaBaseUrl http://localhost:11434

# Restart
tidyai stop
tidyai run -d

# Test in UI - click "Test Connection"
```

## Error Handling Testing

### Test Port Already in Use

```bash
# Start Tidy AI
tidyai run -d

# Try to start again (should fail gracefully)
tidyai run
# Should show: "Tidy AI is already running"
```

### Test Invalid Port

```bash
tidyai config set uiPort 99999
# Should fail validation

tidyai config set uiPort abc
# Should fail validation

tidyai config set uiPort 3210
# Should succeed
```

### Test Ollama Not Running

```bash
# Stop Ollama if running
pkill -f ollama

# Start Tidy AI
tidyai run

# In UI:
# 1. Enable "Use Ollama"
# 2. Click "Test Connection"
# 3. Should show clear error message
```

### Test Stale PID File

```bash
# Start server
tidyai run -d

# Manually kill process (simulate crash)
kill -9 $(cat ~/.tidyai/tidyai.pid)

# Check status (should detect stale PID)
tidyai status

# Restart (should auto-recover)
tidyai run
```

## Clean Up Test Data

```bash
# Remove test files
rm -rf ~/test-downloads

# Remove config (optional)
rm -rf ~/.tidyai

# Unlink global command
npm unlink -g tidyai
```

## Acceptance Tests Checklist

### Installation

- [ ] `npm install` completes successfully
- [ ] `npm run build` completes without errors
- [ ] `npm link` creates global command
- [ ] `tidyai --version` shows version
- [ ] `tidyai --help` shows help text

### Configuration

- [ ] `tidyai init` creates config file
- [ ] `tidyai config list` displays all values
- [ ] `tidyai config get uiPort` returns port number
- [ ] `tidyai config set uiPort 8080` updates config
- [ ] Config persists after restart
- [ ] Invalid values are rejected

### Server Lifecycle

- [ ] `tidyai run` starts server
- [ ] Server responds to HTTP requests
- [ ] `tidyai status` shows running status
- [ ] PID file is created
- [ ] `tidyai stop` stops server gracefully
- [ ] PID file is removed after stop
- [ ] `tidyai run -d` runs in background

### Web UI

- [ ] UI loads at configured port
- [ ] All buttons and inputs work
- [ ] File scan generates plan
- [ ] Plan can be reviewed
- [ ] Plan can be applied
- [ ] Files are moved correctly
- [ ] Settings modal opens
- [ ] Settings display correctly

### Ollama Integration

- [ ] Connection test works when Ollama running
- [ ] Shows error when Ollama not running
- [ ] AI categorization works for unknown files
- [ ] Custom Ollama URL can be configured

### Error Handling

- [ ] Port in use shows clear error
- [ ] Invalid config prevents startup
- [ ] Stale PID auto-recovers
- [ ] Missing directories are created
- [ ] Network errors are caught

### Cross-Platform (if testing)

- [ ] Works on macOS
- [ ] Works on Linux
- [ ] Works on Windows
- [ ] Config paths are OS-appropriate

## Performance Testing

### Large Directory

Create many test files:

```bash
mkdir -p ~/large-test
for i in {1..1000}; do
  touch ~/large-test/file-$i.txt
  touch ~/large-test/image-$i.jpg
  touch ~/large-test/doc-$i.pdf
done
```

Test:

1. Scan the directory
2. Verify all files are found
3. Check performance (should complete in <10 seconds)
4. Clean up: `rm -rf ~/large-test`

## Integration Testing

### Full Workflow Test

```bash
# 1. Fresh install
npm link

# 2. Initialize
tidyai init

# 3. Configure
tidyai config set preferredModel llama3.1

# 4. Create test data
mkdir -p ~/integration-test
touch ~/integration-test/{doc.pdf,img.jpg,song.mp3}

# 5. Start server
tidyai run -d

# 6. Use curl to test API
curl -X POST http://localhost:3210/api/plan \
  -H "Content-Type: application/json" \
  -d '{
    "sourceFolder": "'$HOME'/integration-test",
    "destFolder": "'$HOME'/integration-test/organized",
    "useOllama": false,
    "detectDuplicates": false
  }'

# 7. Stop server
tidyai stop

# 8. Clean up
rm -rf ~/integration-test
```

## Troubleshooting Common Issues

### Build Fails

```bash
# Clean and rebuild
rm -rf dist .next node_modules
npm install
npm run build
```

### CLI Not Found After Link

```bash
# Check npm global path
npm config get prefix

# Add to PATH if needed
export PATH="$PATH:$(npm config get prefix)/bin"
```

### Permission Denied

```bash
# Make CLI executable
chmod +x dist/cli/index.js
```

### TypeScript Errors

```bash
# Clean TypeScript cache
rm -rf dist
npx tsc --build --clean
npm run build
```

## Reporting Issues

When reporting issues, please include:

1. Output of `tidyai --version`
2. Output of `node --version`
3. OS and version
4. Config file contents: `cat ~/.tidyai/config.json`
5. Error messages or logs
6. Steps to reproduce

## Next Steps After Testing

If all tests pass:

1. Commit changes
2. Create git tag: `git tag v1.0.0`
3. Publish to npm: `npm publish`
4. Create GitHub release
5. Update documentation with actual npm package name
