# OpenAI Integration Guide

TidyAI now supports **both local and cloud AI providers**:

- **Ollama** (local, free, private)
- **OpenAI** (cloud, paid, powerful)

## Quick Start

### Option 1: Ollama (Local - Recommended for Privacy)

```bash
# Install Ollama
brew install ollama  # macOS
# or download from https://ollama.ai

# Start Ollama and pull a model
ollama serve
ollama pull llama3.1

# Use default settings (already configured for Ollama)
npm run dev
```

### Option 2: OpenAI (Cloud - Better Classification)

```bash
# Set your OpenAI API key
export OPENAI_API_KEY="sk-..."

# Or configure via API
curl -X POST http://localhost:3210/api/settings \
  -H "Content-Type: application/json" \
  -d '{
    "aiProvider": "openai",
    "openaiApiKey": "sk-...",
    "openaiModel": "gpt-4o-mini"
  }'
```

## Configuration

### Via API

```typescript
// Switch to OpenAI
await fetch("http://localhost:3210/api/settings", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    aiProvider: "openai",
    openaiApiKey: "sk-...",
    openaiModel: "gpt-4o-mini", // or 'gpt-4o', 'gpt-4-turbo'
  }),
});

// Switch back to Ollama
await fetch("http://localhost:3210/api/settings", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    aiProvider: "ollama",
    ollamaModel: "llama3.1",
    ollamaBaseUrl: "http://127.0.0.1:11434",
  }),
});
```

### Via Settings File

Edit `~/Library/Application Support/tidyai/settings.json`:

```json
{
  "aiProvider": "openai",
  "openaiApiKey": "sk-...",
  "openaiModel": "gpt-4o-mini",
  "openaiBaseUrl": null,
  "preferences": { ... }
}
```

## API Endpoints

### Check AI Status

```bash
# Check which provider is active and connection status
curl http://localhost:3210/api/ai/status

# Response
{
  "provider": "openai",
  "ok": true,
  "version": "OpenAI API"
}
```

### List Available Models

```bash
# List models from current provider
curl http://localhost:3210/api/ai/models

# Response
{
  "provider": "openai",
  "models": [
    "gpt-4o",
    "gpt-4o-mini",
    "gpt-4-turbo",
    "gpt-4",
    "gpt-3.5-turbo"
  ]
}
```

## Model Comparison

### Ollama Models (Local)

| Model        | Size  | Speed     | Quality   | RAM Required |
| ------------ | ----- | --------- | --------- | ------------ |
| llama3.1     | 4.7GB | Fast      | Good      | 8GB          |
| llama3.1:70b | 40GB  | Slow      | Excellent | 64GB         |
| mistral      | 4.1GB | Very Fast | Good      | 8GB          |
| mixtral      | 26GB  | Medium    | Excellent | 32GB         |

**Pros:**

- ✅ Free
- ✅ Private (data never leaves your machine)
- ✅ No API key required
- ✅ Works offline

**Cons:**

- ❌ Requires powerful hardware
- ❌ Slower than cloud APIs
- ❌ May have lower accuracy

### OpenAI Models (Cloud)

| Model       | Speed     | Quality   | Cost (per 1M tokens) |
| ----------- | --------- | --------- | -------------------- |
| gpt-4o-mini | Very Fast | Great     | $0.15 / $0.60        |
| gpt-4o      | Fast      | Excellent | $2.50 / $10.00       |
| gpt-4-turbo | Fast      | Excellent | $10.00 / $30.00      |

**Pros:**

- ✅ Faster than local models
- ✅ Better classification accuracy
- ✅ No hardware requirements
- ✅ Always available

**Cons:**

- ❌ Costs money (pay per use)
- ❌ Requires API key
- ❌ Data sent to OpenAI servers
- ❌ Requires internet connection

## Usage Examples

### Scan with OpenAI

```typescript
const response = await fetch("http://localhost:3210/api/scan", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    rootPath: "/Users/you/Downloads",
    options: {
      useAI: true,
      aiProvider: "openai",
      openaiApiKey: "sk-...",
      openaiModel: "gpt-4o-mini",
    },
  }),
});

const { manifest } = await response.json();
```

### Scan with Ollama

```typescript
const response = await fetch("http://localhost:3210/api/scan", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    rootPath: "/Users/you/Downloads",
    options: {
      useAI: true,
      aiProvider: "ollama",
      ollamaModel: "llama3.1",
      ollamaBaseUrl: "http://127.0.0.1:11434",
    },
  }),
});

const { manifest } = await response.json();
```

### Disable AI Classification

```typescript
const response = await fetch("http://localhost:3210/api/scan", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    rootPath: "/Users/you/Downloads",
    options: {
      useAI: false, // Use extension-based classification only
    },
  }),
});
```

## Custom OpenAI Endpoints

You can use OpenAI-compatible APIs (Azure, LocalAI, etc.):

```json
{
  "aiProvider": "openai",
  "openaiApiKey": "your-key",
  "openaiModel": "gpt-4",
  "openaiBaseUrl": "https://your-azure-endpoint.openai.azure.com/"
}
```

## Cost Estimation

### OpenAI Costs

For a typical scan of 100 files with PDFs:

- Average tokens per classification: ~500 tokens
- Total tokens: 100 × 500 = 50,000 tokens
- Cost with gpt-4o-mini: ~$0.01 (essentially free)
- Cost with gpt-4o: ~$0.13

**Batch scans are very cheap with gpt-4o-mini!**

### When to Use Which

**Use Ollama if:**

- 🔒 Privacy is critical
- 💰 You want zero ongoing costs
- 📡 You work offline often
- 💻 You have powerful hardware (16GB+ RAM)

**Use OpenAI if:**

- ⚡ You want the fastest results
- 🎯 You need the best classification accuracy
- 💻 You have limited hardware
- 🌐 You always have internet access

## Security Best Practices

### Storing API Keys

**Never commit API keys to git!**

```bash
# .gitignore (already included)
settings.json
.env
.env.local
```

**Use environment variables:**

```bash
# .env.local
OPENAI_API_KEY=sk-...
```

**Or store in OS keychain:**

```bash
# macOS
security add-generic-password \
  -s "tidyai-openai" \
  -a "$USER" \
  -w "sk-..."

# Retrieve
security find-generic-password \
  -s "tidyai-openai" \
  -a "$USER" \
  -w
```

## Troubleshooting

### OpenAI Connection Issues

```bash
# Test API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer sk-..."

# Common errors:
# - "Invalid API key" → Check your key
# - "Rate limit exceeded" → Wait or upgrade plan
# - "Insufficient quota" → Add billing info to OpenAI account
```

### Ollama Connection Issues

```bash
# Check if Ollama is running
curl http://127.0.0.1:11434/api/version

# Start Ollama
ollama serve

# List installed models
ollama list

# Pull a model if missing
ollama pull llama3.1
```

## Migration Guide

### Switching from Ollama to OpenAI

1. Get an OpenAI API key from https://platform.openai.com/api-keys
2. Update settings via API or settings file
3. Test connection: `curl http://localhost:3210/api/ai/status`
4. Run a scan to verify

### Switching from OpenAI to Ollama

1. Install Ollama: `brew install ollama`
2. Pull a model: `ollama pull llama3.1`
3. Update settings to use Ollama
4. Test connection: `curl http://localhost:3210/api/ai/status`

## FAQ

**Q: Can I use both providers?**  
A: You can switch between them, but only one is active at a time.

**Q: Which is more accurate?**  
A: OpenAI's gpt-4o typically provides better classification, but Ollama's llama3.1:70b is comparable.

**Q: Is my data sent to OpenAI?**  
A: Yes, when using OpenAI, file metadata and snippets are sent for classification. Use Ollama for complete privacy.

**Q: How much does OpenAI cost?**  
A: Very little! Scanning 1000 files costs ~$0.10 with gpt-4o-mini.

**Q: Can I run both simultaneously?**  
A: No, but you can switch providers instantly via settings.

**Q: What about other providers (Anthropic, Cohere, etc.)?**  
A: Currently only Ollama and OpenAI are supported. Other providers can be added in the future.

## Architecture

The unified AI client (`lib/ai-client.ts`) provides a consistent interface:

```typescript
interface AIClient {
  checkConnection(): Promise<{ ok: boolean; error?: string }>;
  listModels(): Promise<string[]>;
  classifyDocument(
    request: ClassificationRequest
  ): Promise<ClassificationResponse>;
}
```

Both Ollama and OpenAI implement the same interface, making it easy to switch providers without changing your code.

## Next Steps

1. Choose your provider (Ollama or OpenAI)
2. Configure settings via API or file
3. Test connection: `GET /api/ai/status`
4. Run a scan: `POST /api/scan`
5. Check classification quality in manifest

For more details, see:

- `docs/AI_NATIVE_IMPLEMENTATION.md` - Complete architecture
- `lib/ai-client.ts` - Client implementation
- `app/api/ai/` - API endpoints
