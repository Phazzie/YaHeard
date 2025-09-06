# Multi-AI Transcription Consensus Engine

SvelteKit app that runs an uploaded audio file through multiple AI transcription services in parallel (Whisper, AssemblyAI, Deepgram, ElevenLabs, Gemini) and returns a consensus transcription with reasoning and per-service stats.

Built with a contract-driven architecture (interfaces in `src/contracts/`, implementations in `src/implementations/`) and regeneration seams to make refactors and fixes low-risk.

## 🛡️ Security notes

- CSRF protection (double-submit cookie): on page load, the server generates a token in `+page.server.ts`, sets it as a cookie, and also returns the token to the page. The client submits the token with the form; the API compares the submitted value against the cookie on every request. This is stateless and suitable for serverless deployments.
- Rate limiting: simple in-memory IP limit to prevent abuse during development. For production or serverless/multi-instance deployments, replace with Redis or another distributed store.
- Error handling: the API avoids leaking details in production; detailed messages are shown only in dev.

Important: The current controls are suitable for local/dev. For production, plan to externalize rate limit state, add content security policy headers, and structured logging/monitoring. See `DEPLOYMENT.md` for details.

## 🏗️ Architecture (contract-driven)

This project follows a contract-first approach:

### Core Principles
- **Contracts First**: Define interfaces before implementations
- **Regeneration Seams**: Clear boundaries for independent regeneration
- **Verbose Naming**: Self-documenting variable names
- **Error Boundaries**: Comprehensive error handling with regeneration hints

### Project Structure
```
src/
├── contracts/           # 📋 Interfaces that DON'T change
│   ├── transcription.ts # Core data structures
│   ├── processors.ts    # AI processor interfaces
│   └── file-upload.ts   # File upload contracts
│
├── implementations/     # 🔄 Can be regenerated freely
│   ├── whisper.ts       # Whisper AI implementation
│   ├── assembly.ts      # AssemblyAI implementation
│   └── comparison.ts    # Consensus engine
│
├── routes/
│   ├── +page.svelte     # Main UI with seam comments
│   ├── +page.server.ts  # Form handling
│   └── api/transcribe/+server.ts # API endpoint
│
└── lib/components/      # Reusable UI components
    ├── FileUpload.svelte
    ├── ResultsDisplay.svelte
    └── ProgressBar.svelte
```

## 🚀 Quick start

### Prerequisites
- Node.js 20+
- npm or yarn

### Installation
```bash
npm install
```

### Environment configuration

⚠️ At least one API key is required for the application to function. The server will return a 500 if no API keys are configured.

1. **Copy the environment template:**
```bash
cp .env.example .env
```

2. **Add your API keys to `.env`:**
```bash
# At least ONE of these is required:
OPENAI_API_KEY=your-openai-key-here
ASSEMBLYAI_API_KEY=your-assemblyai-key-here  
DEEPGRAM_API_KEY=your-deepgram-key-here
ELEVENLABS_API_KEY=your-elevenlabs-key-here
GEMINI_API_KEY=your-gemini-key-here
```

#### API key sources

| Service | Get API Key From | Status | Notes |
|---------|------------------|--------|--------|
| **OpenAI Whisper** | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) | Optional | High-quality transcription |
| **AssemblyAI** | [assemblyai.com/dashboard](https://www.assemblyai.com/dashboard/signup) | Optional | Free tier available |
| **Deepgram** | [console.deepgram.com](https://console.deepgram.com/) | Optional | Fast and accurate |
| **ElevenLabs** | [elevenlabs.io/app/profile](https://elevenlabs.io/app/profile) | Optional | Speech-to-text capabilities |
| **Google Gemini** | [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) | Optional | Multimodal AI |

**💡 Tip**: The more API keys you provide, the better the consensus results will be!

### Development
```bash
npm run dev
```

### Build for production
```bash
npm run build
npm run preview
```

## 🔧 Regeneration guide

### When Something Breaks
1. **Check Console Logs**: Look for `@phazzie-error` messages
2. **Identify the Seam**: Find the regeneration boundary comment
3. **Regenerate Section**: Replace only the broken section
4. **Test Independently**: Each section can be tested separately

### Regeneration boundaries
Each major function is wrapped with:
```javascript
// ========= REGENERATION BOUNDARY START: [Section Name] ==========
// @phazzie: This section can be regenerated independently
// @contract: Must [describe contract]
// @dependencies: [what must work before this]

// [CODE HERE]

// ========= REGENERATION BOUNDARY END: [Section Name] ==========
```

### Files that can be regenerated independently
- `src/implementations/whisper.ts` - Complete Whisper integration
- `src/implementations/assembly.ts` - Complete AssemblyAI integration
- `src/implementations/comparison.ts` - Consensus algorithm
- `src/routes/+page.svelte` sections - UI components
- `src/routes/api/transcribe/+server.ts` sections - API logic

## 📋 Contracts overview

### File upload contract
```typescript
interface FileUploadContract {
  accept: string[]        // ['.mp3', '.wav', '.m4a', '.webm']
  maxSize: number         // 10MB
  onUpload: (file: File) => Promise<UploadResult>
}
```

### AI processor contract
```typescript
interface AudioProcessor {
  serviceName: string
  isAvailable(): boolean
  processFile(file: File): Promise<TranscriptionResult>
  getCostPerMinute(): number
}
```

## 🎯 Success criteria
- [x] Project runs with `npm run dev`
- [x] File upload accepts audio files
- [x] Clear seam points marked with `@phazzie-regeneration-point`
- [x] Contracts defined separately from implementation
- [x] Console logs show `@phazzie-checkpoint-X` messages
- [x] Each major function can be regenerated independently

## 🔄 Current status
- Contracts: ✅ Defined and stable
- UI components: ✅ Working with Tailwind CSS
- File upload: ✅ Drag-and-drop with validation
- API route: ✅ Orchestrates real AI processors in parallel with timeouts
- AI implementations: ✅ Active when corresponding API keys are present

## 🚀 Deployment
Optimized for Vercel with the Vercel adapter. Notes:

- Local builds on Windows may encounter a symlink EPERM error during the final adapter output step. Development (`npm run dev`) and preview (`npm run preview`) still work. For production builds, use WSL or CI/Linux/macOS runners.

Adapter behavior
- On Windows local builds, the project uses the auto adapter to avoid the symlink EPERM during build.
- On CI/Vercel (when CI or VERCEL env is set), the Vercel adapter is used with maxDuration 300s.
- To force the Vercel adapter locally, set the environment variable VERCEL=1 (may hit the Windows symlink limitation).

```bash
npm run build
# Deploy to Vercel
```

See `DEPLOYMENT.md` for comprehensive deployment guidance (adapters, Windows notes, environment variables).

## 📝 Adding new AI services
1. Create new contract in `src/contracts/processors.ts`
2. Implement in `src/implementations/[service].ts`
3. Add to API endpoint processing pipeline
4. Update UI to show new service

## 🐛 Troubleshooting
- File too large: Check `PERFORMANCE_CONFIG.MAX_FILE_SIZE_BYTES`
- Unsupported format: See each processor's `getSupportedFormats()`
- API errors: In dev, refer to server logs. In prod, generic messages are returned by design.
- CSRF errors: Ensure the page was loaded before submitting. The app injects the CSRF token automatically; reloading the page refreshes it.

## � Large files

Two supported strategies to handle big audio without hitting client upload limits:

1) Server-side URL ingestion
- Provide a publicly accessible `audioUrl` instead of uploading the file. The server downloads the audio and processes it. Size is validated against `PERFORMANCE_CONFIG.MAX_FILE_SIZE_BYTES`.

2) Client-side chunking + server merge
- The UI can split the selected audio into ~4MB WAV chunks, send each chunk to `/api/transcribe`, then call `/api/merge-chunks` to assemble per-service texts and compute a final consensus.

Trade-offs: token-level word confidences aren’t preserved by the merge step. See `LARGE_FILES.md` for request/response details and examples.

## �📡 API

Endpoint: POST /api/transcribe

Request: multipart/form-data
- csrfToken: string (required; injected by the UI automatically)
- One of:
  - audio: File
  - audioUrl: string (public URL to audio; server downloads and processes)

Response: ConsensusResult (shape simplified)
```
{
  "finalText": string,
  "consensusConfidence": number, // 0..1
  "individualResults": [
    {
      "id": string,
      "serviceName": string,
      "text": string,
      "confidence": number | undefined,
      "processingTimeMs": number,
      "timestamp": string,
      "metadata": object
    }
  ],
  "disagreements": [...],
  "stats": {
    "totalProcessingTimeMs": number,
    "servicesUsed": number,
    "averageConfidence": number,
    "disagreementCount": number
  },
  "reasoning": { "finalReasoning": string, "steps": [...] }
}
```

Endpoint: POST /api/merge-chunks

Request: application/json
- chunkTexts: Array<{ index: number; textsByService: Record<string,string> }>

Notes
- Use this after uploading multiple chunks to `/api/transcribe` and collecting each chunk’s per-service texts.
- The endpoint concatenates per-service texts (with overlap-aware stitching) and runs the same consensus engine.

Response: ConsensusResult (same overall shape as above)

---
Built with ❤️ for a regeneration-over-debug workflow