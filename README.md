# Multi-AI Transcription Consensus Engine

🚀 **@Phazzie Contract-Driven Development Mode ACTIVATED!**

A SvelteKit application that processes audio files through multiple AI transcription services (Whisper, AssemblyAI, Deepgram) and generates consensus transcriptions for improved accuracy. This project has been refactored to use a robust, asynchronous architecture suitable for serverless deployment on Vercel.

## 🏗️ Asynchronous Architecture

The application now uses an asynchronous, job-based architecture to handle long-running transcription tasks without timing out.

1.  **Client-Side Upload**: The user selects a file, and the frontend requests a secure upload URL from the SvelteKit backend.
2.  **Direct Blob Storage**: The client uploads the file directly to Vercel Blob storage, bypassing serverless function payload limits.
3.  **Background Job**: After the upload, the client triggers a Vercel Background Function to process the file.
4.  **Polling for Results**: The client polls a status endpoint to check the job's progress and retrieve the final transcription results once they are stored in Vercel KV.

This design ensures scalability and reliability.

### Project Structure
```
src/
├── contracts/           # 📋 Interfaces that DON'T change
│   ├── transcription.ts
│   └── processors.ts
│
├── implementations/     # 🔄 Can be regenerated freely
│   ├── whisper.ts
│   └── assembly.ts
│
├── routes/
│   ├── +page.svelte     # Main UI with polling logic
│   ├── +page.server.ts  # Generates signed URLs for Vercel Blob
│   └── api/
│       ├── process-transcription/ # Vercel Background Function
│       │   └── +server.ts
│       └── status/[jobId]/        # Polling endpoint for job status
│           └── +server.ts
│
└── lib/components/      # Reusable UI components
    ├── FileUpload.svelte
    ├── ResultsDisplay.svelte
    └── ProgressBar.svelte
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Vercel account with Blob and KV stores configured.

### Environment Variables
Create a `.env` file and populate it with the required Vercel storage credentials and AI service API keys:
```
# Vercel Storage
BLOB_READ_WRITE_TOKEN=
KV_URL=
KV_REST_API_URL=
KV_REST_API_TOKEN=
KV_REST_API_READ_ONLY_TOKEN=

# AI Services (at least one is required)
OPENAI_API_KEY=
ASSEMBLYAI_API_KEY=
DEEPGRAM_API_KEY=
GEMINI_API_KEY=
ELEVENLABS_API_KEY=
```

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

## 🔄 Current Status
- **Architecture**: ✅ Asynchronous, scalable, and ready for Vercel.
- **Contracts**: ✅ Defined and stable.
- **UI Components**: ✅ Working with polling and displays async results.
- **File Upload**: ✅ Using Vercel Blob for large file uploads.
- **AI Implementations**: ✅ Fully integrated into the background processing pipeline.
- **Consensus Algorithm**: ✅ Refactored to use Levenshtein distance for robust results.

## 🚀 Deployment
This project is architected for Vercel.

1.  **Configure Project**: Set up the environment variables listed above in your Vercel project settings. Ensure Vercel Blob and KV stores are linked.
2.  **Deploy**: Connect your Git repository to Vercel for automatic deployments.

```bash
npm run build
# Deploy to Vercel
```

## 📝 Adding New AI Services
1.  Create a new implementation file in `src/implementations/` that adheres to the `AudioProcessor` interface in `src/contracts/processors.ts`.
2.  Add the new service to the processing pipeline in `src/routes/api/process-transcription/+server.ts`.
3.  Add the corresponding API key to your environment variables.

---

**Built with ❤️ for @Phazzie's regeneration-over-debug workflow**

*Time: 2025-08-30 | Status: Refactored for Asynchronous Vercel Deployment*