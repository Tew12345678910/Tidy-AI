# Tidy AI - Quick Start Guide

## Installation

### Option 1: Install via npm (Recommended)

```bash
npm install -g tidyai
```

### Option 2: Build from Source

```bash
# Clone the repository
git clone https://github.com/yourusername/tidy-ai.git
cd tidy-ai

# Install dependencies
npm install

# Build the project
npm run build

# Link locally for testing
npm link
```

### Option 3: Download Pre-built Binary (Coming Soon)

Download the binary for your platform from the releases page and add it to your PATH.

## Initial Setup

1. **Initialize Tidy AI**:

   ```bash
   tidyai init
   ```

   This creates `~/.tidyai/config.json` with default settings.

2. **Install Ollama** (Optional but recommended):

   - Download from [ollama.ai](https://ollama.ai)
   - Pull a model: `ollama pull llama3.1`

3. **Start Tidy AI**:

   ```bash
   tidyai run
   ```

4. **Open your browser**:
   Navigate to `http://localhost:3210`

## CLI Commands

### `tidyai init`

Initialize configuration with defaults.

### `tidyai run`

Start the Tidy AI server in foreground mode.

Options:

- `-d, --detach`: Run in background (detached mode)

### `tidyai status`

Check if Tidy AI is running.

### `tidyai stop`

Stop the Tidy AI server.

### `tidyai config list`

Display all configuration values.

### `tidyai config get <key>`

Get a specific configuration value.

Example:

```bash
tidyai config get uiPort
```

### `tidyai config set <key> <value>`

Set a configuration value.

Examples:

```bash
tidyai config set uiPort 8080
tidyai config set ollamaBaseUrl http://192.168.1.100:11434
tidyai config set preferredModel llama3.1
```

**Note**: Port changes require a restart.

## Configuration

Configuration is stored in:

- **macOS/Linux**: `~/.tidyai/config.json`
- **Windows**: `%APPDATA%/tidyai/config.json`

### Default Configuration

```json
{
  "uiPort": 3210,
  "ollamaBaseUrl": "http://127.0.0.1:11434",
  "preferredModel": "llama3.1"
}
```

## Usage

1. **Start the server**:

   ```bash
   tidyai run
   ```

2. **Open the UI**: Navigate to `http://localhost:3210`

3. **Configure folders**:

   - Source: Your Downloads folder (default: `~/Downloads`)
   - Destination: Where to organize files (default: `~/Downloads/Organized`)

4. **Generate a plan**: Click "Scan & Generate Plan"

5. **Review the plan**: See what files will be moved

6. **Apply the plan**: Click "Apply Plan" to organize files

## Troubleshooting

### Port Already in Use

```bash
# Change the port
tidyai config set uiPort 3211

# Restart
tidyai stop
tidyai run
```

### Ollama Not Connected

1. Make sure Ollama is running: `ollama serve`
2. Check the connection in UI or test with CLI:
   ```bash
   curl http://localhost:11434/api/version
   ```
3. If Ollama is on a different machine:
   ```bash
   tidyai config set ollamaBaseUrl http://<ip>:11434
   tidyai run
   ```

### Stale PID File

If you see "stale PID file" warnings:

```bash
rm ~/.tidyai/tidyai.pid
tidyai run
```

## Uninstallation

### If installed via npm:

```bash
npm uninstall -g tidyai
rm -rf ~/.tidyai
```

### If installed via binary:

```bash
rm /usr/local/bin/tidyai  # or wherever you placed it
rm -rf ~/.tidyai
```

## Next Steps

- Explore the settings UI (gear icon in bottom-right)
- Try different Ollama models
- Customize file categorization rules
- Check the logs in `~/.tidyai/logs/` (if implemented)

For more information, see the full README.md
