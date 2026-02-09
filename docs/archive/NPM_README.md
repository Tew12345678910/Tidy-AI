# Quick Start - npm Installation

## Install from npm

```bash
npm install -g tidy-ai
```

That's it! Tidy AI is now installed globally on your system.

## First Run

```bash
# Initialize configuration
tidyai init

# Start the server
tidyai run
```

Open your browser to `http://localhost:3210`

## All Commands

```bash
tidyai init                          # Initialize config (first-time only)
tidyai run                           # Start server (foreground)
tidyai run -d                        # Start server (background)
tidyai status                        # Check if running
tidyai stop                          # Stop server
tidyai config list                   # Show all settings
tidyai config get <key>              # Get a setting
tidyai config set <key> <value>      # Change a setting
tidyai --help                        # Show help
tidyai --version                     # Show version
```

## Configuration

Settings are stored in:

- **macOS/Linux**: `~/.tidyai/config.json`
- **Windows**: `%APPDATA%/tidyai/config.json`

Default settings:

```json
{
  "uiPort": 3210,
  "ollamaBaseUrl": "http://127.0.0.1:11434",
  "preferredModel": "llama3.1"
}
```

## Optional: Install Ollama

For AI-powered file categorization:

1. Download Ollama from [ollama.ai](https://ollama.ai)
2. Install and run: `ollama serve`
3. Pull a model: `ollama pull llama3.1`

## Usage

1. Start Tidy AI: `tidyai run`
2. Open browser: `http://localhost:3210`
3. Set your source folder (e.g., `~/Downloads`)
4. Set destination folder (e.g., `~/Downloads/Organized`)
5. Click "Scan & Generate Plan"
6. Review the plan
7. Click "Apply Plan" to organize your files

## Customize Settings

```bash
# Change port
tidyai config set uiPort 8080

# Use remote Ollama instance
tidyai config set ollamaBaseUrl http://192.168.1.100:11434

# Set preferred model
tidyai config set preferredModel llama3.1

# Restart to apply changes
tidyai stop && tidyai run
```

## Uninstall

```bash
# Remove package
npm uninstall -g tidy-ai

# Remove configuration (optional)
rm -rf ~/.tidyai
```

## Troubleshooting

**Port already in use?**

```bash
tidyai config set uiPort 3211
tidyai run
```

**Ollama not connecting?**

```bash
# Check Ollama is running
curl http://localhost:11434/api/version

# Or disable Ollama in the UI
```

**Command not found?**

```bash
# Check npm global path
npm config get prefix

# Add to PATH if needed
export PATH="$PATH:$(npm config get prefix)/bin"
```

## Get Help

- Documentation: [GitHub README](https://github.com/Tew12345678910/Ai-file-management)
- Issues: [GitHub Issues](https://github.com/Tew12345678910/Ai-file-management/issues)
- Quick Start: [QUICKSTART.md](https://github.com/Tew12345678910/Ai-file-management/blob/main/QUICKSTART.md)

Enjoy organizing your files! 🎉
