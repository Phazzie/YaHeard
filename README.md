# Multi-AI Transcription Consensus Engine

🚀 **@Phazzie Contract-Driven Development Mode ACTIVATED!**

A SvelteKit application that processes audio files through multiple AI transcription services (Whisper, AssemblyAI, Deepgram) and generates consensus transcriptions for improved accuracy.

## 🏗️ @Phazzie Architecture

This project follows the **@Phazzie Contract-Driven Development** methodology:

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

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Build for Production
```bash
npm run build
npm run preview
```

## 🔧 @Phazzie Regeneration Guide

### When Something Breaks
1. **Check Console Logs**: Look for `@phazzie-error` messages
2. **Identify the Seam**: Find the regeneration boundary comment
3. **Regenerate Section**: Replace only the broken section
4. **Test Independently**: Each section can be tested separately

### Regeneration Boundaries
Each major function is wrapped with:
```javascript
// ========= REGENERATION BOUNDARY START: [Section Name] ==========
// @phazzie: This section can be regenerated independently
// @contract: Must [describe contract]
// @dependencies: [what must work before this]

// [CODE HERE]

// ========= REGENERATION BOUNDARY END: [Section Name] ==========
```

### Files That Can Be Regenerated Independently
- `src/implementations/whisper.ts` - Complete Whisper integration
- `src/implementations/assembly.ts` - Complete AssemblyAI integration
- `src/implementations/comparison.ts` - Consensus algorithm
- `src/routes/+page.svelte` sections - UI components
- `src/routes/api/transcribe/+server.ts` sections - API logic

## 📋 Contracts Overview

### File Upload Contract
```typescript
interface FileUploadContract {
  accept: string[]        // ['.mp3', '.wav', '.m4a', '.webm']
  maxSize: number         // 10MB
  onUpload: (file: File) => Promise<UploadResult>
}
```

### AI Processor Contract
```typescript
interface AudioProcessor {
  serviceName: string
  isAvailable(): boolean
  processFile(file: File): Promise<TranscriptionResult>
  getCostPerMinute(): number
}
```

## 🎯 Success Criteria
- [x] Project runs with `npm run dev`
- [x] File upload accepts audio files
- [x] Clear seam points marked with `@phazzie-regeneration-point`
- [x] Contracts defined separately from implementation
- [x] Console logs show `@phazzie-checkpoint-X` messages
- [x] Each major function can be regenerated independently

## 🔄 Current Status
- **Contracts**: ✅ Defined and stable
- **UI Components**: ✅ Working with Tailwind CSS
- **File Upload**: ✅ Drag-and-drop with validation
- **API Structure**: ✅ Ready for AI integrations
- **AI Implementations**: 🔄 Placeholder (needs real API keys)

## 🚀 Deployment
Ready for Vercel deployment with zero configuration:

```bash
npm run build
# Deploy to Vercel
```

## 📝 Adding New AI Services
1. Create new contract in `src/contracts/processors.ts`
2. Implement in `src/implementations/[service].ts`
3. Add to API endpoint processing pipeline
4. Update UI to show new service

## 🐛 Troubleshooting
- **File too large**: Check `MAX_FILE_SIZE_BYTES` in contracts
- **Unsupported format**: Check `SUPPORTED_AUDIO_FORMATS`
- **API errors**: Look for `@phazzie-error` in console
- **Regeneration needed**: Follow the boundary comments

---

**Built with ❤️ for @Phazzie's regeneration-over-debug workflow**

*Time: 2025-01-29 | Status: Ready for AI API Integration*