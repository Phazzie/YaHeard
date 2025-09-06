# YaHeard Multi-AI Transcription Engine

🎯 **A SvelteKit application that processes audio files through multiple AI transcription services and generates consensus transcriptions for improved accuracy.**

⚠️ **Current Status**: Core functional with known issues. See [PROJECT_STATUS.md](PROJECT_STATUS.md) for details.

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- At least one AI service API key (required for functionality)

### Installation & Setup
```bash
# Clone and install
git clone https://github.com/Phazzie/YaHeard.git
cd YaHeard
npm install

# Configure API keys (REQUIRED)
cp .env.example .env
# Edit .env and add at least one API key
```

### Environment Configuration

**⚠️ CRITICAL**: At least one API key is required. The application will return errors if none are configured.

| Service | Get API Key From | Cost | Notes |
|---------|------------------|------|--------|
| **OpenAI Whisper** | [platform.openai.com](https://platform.openai.com/api-keys) | $0.006/min | General-purpose, reliable |
| **AssemblyAI** | [assemblyai.com](https://www.assemblyai.com/dashboard/signup) | $0.025/min | Free tier available |
| **Deepgram** | [console.deepgram.com](https://console.deepgram.com/) | Variable | Fast processing |
| **ElevenLabs** | [elevenlabs.io](https://elevenlabs.io/app/profile) | Variable | Premium quality |
| **Google Gemini** | [aistudio.google.com](https://aistudio.google.com/app/apikey) | $0.0018/min | Multimodal AI |

### Development & Deployment
```bash
# Development
npm run dev

# Production build
npm run build
npm run preview

# Deploy to Vercel (zero-config)
npm run build  # Then connect to Vercel
```

## 🏗️ Architecture Overview

### Core Design Principle
**Contract-First Development**: Interfaces defined before implementations, enabling independent component development and testing.

### Project Structure
```
src/
├── contracts/           # 📋 Interface definitions (stable)
│   ├── transcription.ts # Core data structures  
│   ├── processors.ts    # AI service interfaces
│   └── file-upload.ts   # Upload validation contracts
│
├── implementations/     # 🔄 AI service implementations
│   ├── whisper.ts       # OpenAI Whisper
│   ├── assembly.ts      # AssemblyAI  
│   ├── deepgram.ts      # Deepgram
│   ├── elevenlabs.ts    # ElevenLabs
│   ├── gemini.ts        # Google Gemini
│   └── comparison.ts    # Consensus engine
│
├── routes/              # 🌐 SvelteKit routes
│   ├── +page.svelte     # Main UI
│   └── api/transcribe/  # Processing endpoint
│
└── lib/                 # 🛠️ Shared utilities
    ├── config.ts        # Centralized configuration
    ├── ui-utils.ts      # UI helper functions
    └── components/      # Reusable UI components
```

## 🧮 How the Consensus Algorithm Works

### Similarity-First Approach
1. **Text Similarity Analysis**: Uses Levenshtein distance to compare transcriptions
2. **Weighted Scoring**: 70% text similarity + 20% confidence + 10% processing speed  
3. **Winner Selection**: Highest combined score becomes consensus result
4. **Quality Assessment**: Individual service performance analysis

### Example Consensus Process
```
Input: 3 AI services process "Hello world" audio

Service A: "Hello world" (confidence: 0.95, 2.1s)
Service B: "Hello word"  (confidence: 0.87, 1.8s)  
Service C: "Hello world" (confidence: 0.91, 3.2s)

Algorithm:
1. Calculate similarities: A vs B=0.91, A vs C=1.0, B vs C=0.91
2. Average similarities: A=0.955, B=0.91, C=0.955  
3. Apply weights: A=0.955×0.7 + 0.95×0.2 + 0.9×0.1 = 0.948
4. Result: Service A wins → "Hello world"
```

## 🛠️ API Usage

### Basic Transcription Request
```javascript
const formData = new FormData();
formData.append('audio', audioFile);

const response = await fetch('/api/transcribe', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log(result.finalText);        // Consensus transcription
console.log(result.consensusConfidence); // Quality score (0-1)
console.log(result.individualResults);   // All AI results
```

### Response Format
```typescript
{
  finalText: string;                    // Consensus transcription
  consensusConfidence: number;          // Quality score (0-1)
  individualResults: TranscriptionResult[]; // Individual AI results
  stats: {
    totalProcessingTimeMs: number;
    servicesUsed: number;
    averageConfidence: number;
    disagreementCount: number;
  };
  reasoning: {                          // Algorithm explanation
    finalReasoning: string;
    steps: ReasoningStep[];
  };
}
```

## 🧪 Testing & Development

### Manual Testing
```bash
# Test build process
npm run build

# Test with sample audio file
# Upload .mp3/.wav file via UI at http://localhost:5173
```

### Smoke Test
- Ensure at least one API key is set in .env and server restarted
- Start dev server: npm run dev
- Upload a small .wav file via the UI
- Observe /api/transcribe response in the Network tab
- Expected: finalText is non-empty; consensusConfidence is 0–1; individualResults length ≥ 1

### Code Quality
- **TypeScript**: Strict mode enabled with comprehensive type checking
- **Build Status**: ✅ Successful compilation with minor warnings
- **Architecture**: Contract-driven development with clear interfaces

## Known Issues

### Critical Bugs (Fix Before Production)
- Confidence inconsistency: different undefined handling across components
- Performance issue: quadratic similarity calculations

See [LESSONS_LEARNED.md](LESSONS_LEARNED.md) for detailed analysis and [PROJECT_STATUS.md](PROJECT_STATUS.md) for current status.

## 📚 Documentation

- **[PROJECT_STATUS.md](PROJECT_STATUS.md)** - Current implementation status and bug tracking
- **[LESSONS_LEARNED.md](LESSONS_LEARNED.md)** - Architectural insights and development lessons  
- **[CHANGELOG.md](CHANGELOG.md)** - Detailed development history and changes

## 🤝 Contributing

1. Review [LESSONS_LEARNED.md](LESSONS_LEARNED.md) for architectural guidelines
2. Check [PROJECT_STATUS.md](PROJECT_STATUS.md) for current priorities
3. Focus on critical bug fixes before adding new features
4. Maintain contract-driven development patterns

## 📄 License

MIT License - see LICENSE file for details

---

**Built with**: SvelteKit + TypeScript + Tailwind CSS  
**Architecture**: Contract-driven development for maintainable AI integrations  
**Status**: Core functional, production-ready after bug fixes