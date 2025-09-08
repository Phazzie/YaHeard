import { g as getClientIP, c as checkRateLimit, a as validateCsrfFromForm, P as PERFORMANCE_CONFIG, C as ConsensusComparisonEngine } from "../../../../chunks/security.js";
import { j as json } from "../../../../chunks/index.js";
const UPLOAD_ENDPOINT = "https://api.assemblyai.com/v2/upload";
const TRANSCRIPT_ENDPOINT = "https://api.assemblyai.com/v2/transcript";
class AssemblyAIProcessor {
  constructor(config = {}) {
    this.serviceName = "AssemblyAI";
    this.config = config;
  }
  async isAvailable() {
    return !!this.config.apiKey;
  }
  async processFile(file) {
    if (!this.config.apiKey) {
      throw new Error("AssemblyAI API key not configured.");
    }
    try {
      const startTime = Date.now();
      const uploadUrl = await this.uploadFile(file);
      const transcriptId = await this.requestTranscription(uploadUrl);
      const result = await this.pollForResult(transcriptId);
      const processingTime = Date.now() - startTime;
      return {
        id: `assembly-${Date.now()}`,
        serviceName: this.serviceName,
        text: result.text,
        confidence: result.confidence,
        processingTimeMs: processingTime,
        timestamp: /* @__PURE__ */ new Date(),
        metadata: {
          model: "assembly-ai-best",
          // AssemblyAI doesn't specify model versions in the response
          language: result.language_code,
          wordCount: result.words.length,
          rawResponse: result
          // Include the raw response for more details if needed
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      console.error(`AssemblyAI processor error: ${errorMessage}`);
      throw new Error(`AssemblyAI processor failed: ${errorMessage}`);
    }
  }
  async uploadFile(file) {
    const response = await fetch(UPLOAD_ENDPOINT, {
      method: "POST",
      headers: {
        "authorization": this.config.apiKey,
        "content-type": "application/octet-stream"
      },
      body: await file.arrayBuffer()
    });
    if (!response.ok) {
      throw new Error(`Upload failed with status ${response.status}`);
    }
    const { upload_url } = await response.json();
    return upload_url;
  }
  async requestTranscription(audioUrl) {
    const response = await fetch(TRANSCRIPT_ENDPOINT, {
      method: "POST",
      headers: {
        "authorization": this.config.apiKey,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        audio_url: audioUrl,
        language_code: this.config.options?.language || "en"
      })
    });
    if (!response.ok) {
      throw new Error(`Transcription request failed with status ${response.status}`);
    }
    const { id } = await response.json();
    return id;
  }
  async pollForResult(transcriptId) {
    const pollingEndpoint = `${TRANSCRIPT_ENDPOINT}/${transcriptId}`;
    const maxAttempts = 30;
    const delay = 1e3;
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      const response = await fetch(pollingEndpoint, {
        headers: { "authorization": this.config.apiKey }
      });
      const result = await response.json();
      if (result.status === "completed") {
        return result;
      }
      if (result.status === "error") {
        throw new Error(`Transcription failed: ${result.error}`);
      }
    }
    throw new Error("Transcription polling timed out after 30 seconds.");
  }
  async getCostPerMinute() {
    return 0.025;
  }
  getSupportedFormats() {
    return [".mp3", ".wav", ".m4a", ".webm", ".flac"];
  }
}
const API_ENDPOINT$1 = "https://api.deepgram.com/v1/listen";
class DeepgramProcessor {
  constructor(config = {}) {
    this.serviceName = "Deepgram";
    this.config = config;
  }
  async isAvailable() {
    return !!this.config.apiKey;
  }
  async processFile(file) {
    if (!this.config.apiKey) {
      throw new Error("Deepgram API key not configured.");
    }
    try {
      const arrayBuffer = await file.arrayBuffer();
      const base64Audio = this.arrayBufferToBase64(arrayBuffer);
      const startTime = Date.now();
      const options = {
        model: this.config.options?.model || "nova-2",
        smart_format: this.config.options?.smart_format ?? true,
        punctuate: this.config.options?.punctuate ?? true,
        utterances: this.config.options?.utterances ?? true,
        language: this.config.options?.language || "en-US"
      };
      const response = await fetch(API_ENDPOINT$1, {
        method: "POST",
        headers: {
          "Authorization": `Token ${this.config.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          audio: base64Audio,
          ...options
        })
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Deepgram API error (${response.status}): ${errorText}`);
      }
      const data = await response.json();
      const processingTime = Date.now() - startTime;
      const alternative = data.results?.channels?.[0]?.alternatives?.[0];
      return {
        id: `deepgram-${Date.now()}`,
        serviceName: this.serviceName,
        text: alternative?.transcript || "",
        confidence: alternative?.confidence,
        processingTimeMs: processingTime,
        timestamp: /* @__PURE__ */ new Date(),
        metadata: {
          model: options.model,
          language: options.language,
          wordCount: alternative?.words?.length || 0,
          rawResponse: data
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      console.error(`Deepgram processor error: ${errorMessage}`);
      throw new Error(`Deepgram processor failed: ${errorMessage}`);
    }
  }
  arrayBufferToBase64(buffer) {
    const nodeBuffer = Buffer.from(buffer);
    return nodeBuffer.toString("base64");
  }
  async getCostPerMinute() {
    return 43e-4;
  }
  getSupportedFormats() {
    return [".mp3", ".wav", ".m4a", ".webm", ".flac", ".ogg", ".aac", ".wma"];
  }
}
const API_ENDPOINT = "https://api.elevenlabs.io/v1/speech-to-text";
class ElevenLabsProcessor {
  constructor(config = {}) {
    this.serviceName = "ElevenLabs";
    this.config = config;
  }
  async isAvailable() {
    return !!this.config.apiKey;
  }
  async processFile(file) {
    if (!this.config.apiKey) {
      throw new Error("ElevenLabs API key not configured.");
    }
    try {
      const formData = new FormData();
      formData.append("file", file, file.name);
      const model = this.config.options?.model || "scribe_v1";
      const language = this.config.options?.language;
      formData.append("model_id", model);
      if (language) {
        formData.append("language_code", language);
      }
      const startTime = Date.now();
      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
          "xi-api-key": this.config.apiKey
        },
        body: formData
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs API error (${response.status}): ${errorText}`);
      }
      const data = await response.json();
      const processingTime = Date.now() - startTime;
      return {
        id: `elevenlabs-${Date.now()}`,
        serviceName: this.serviceName,
        text: data.text || "",
        confidence: data.confidence,
        processingTimeMs: processingTime,
        timestamp: /* @__PURE__ */ new Date(),
        metadata: {
          model,
          language: data.language_code,
          wordCount: data.text ? data.text.split(" ").length : 0,
          apiVersion: "v1"
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      console.error(`ElevenLabs processor error: ${errorMessage}`);
      throw new Error(`ElevenLabs processor failed: ${errorMessage}`);
    }
  }
  async getCostPerMinute() {
    return 2e-3;
  }
  getSupportedFormats() {
    return [".mp3", ".wav", ".m4a", ".webm", ".flac", ".ogg", ".aac"];
  }
}
const API_ENDPOINT_BASE = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";
const TRANSCRIPTION_PROMPT = "Please transcribe this audio file. Provide only the transcribed text without any additional commentary or formatting.";
class GeminiProcessor {
  constructor(config = {}) {
    this.serviceName = "Google Gemini";
    this.config = config;
  }
  async isAvailable() {
    return !!this.config.apiKey;
  }
  async processFile(file) {
    if (!this.config.apiKey) {
      throw new Error("Gemini API key not configured.");
    }
    try {
      const base64Audio = await this.arrayBufferToBase64(file);
      const startTime = Date.now();
      const requestBody = {
        contents: [{
          parts: [
            { text: TRANSCRIPTION_PROMPT },
            { inlineData: { mimeType: file.type || "audio/wav", data: base64Audio } }
          ]
        }],
        generationConfig: {
          temperature: this.config.options?.temperature || 0.1,
          topK: this.config.options?.topK || 1,
          topP: this.config.options?.topP || 1,
          maxOutputTokens: this.config.options?.maxOutputTokens || 2048
        }
      };
      const response = await fetch(API_ENDPOINT_BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": this.config.apiKey
        },
        body: JSON.stringify(requestBody)
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error (${response.status}): ${errorText}`);
      }
      const data = await response.json();
      const processingTime = Date.now() - startTime;
      const candidate = data.candidates?.[0];
      const transcribedText = candidate?.content?.parts?.[0]?.text || "";
      if (!candidate) {
        throw new Error("Gemini returned no candidates in response.");
      }
      return {
        id: `gemini-${Date.now()}`,
        serviceName: this.serviceName,
        text: transcribedText.trim(),
        confidence: void 0,
        // Gemini does not provide a confidence score.
        processingTimeMs: processingTime,
        timestamp: /* @__PURE__ */ new Date(),
        metadata: {
          model: this.config.options?.model || "gemini-2.0-flash-exp",
          apiVersion: "v1beta",
          rawResponse: data
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      console.error(`Gemini processor error: ${errorMessage}`);
      throw new Error(`Gemini processor failed: ${errorMessage}`);
    }
  }
  async arrayBufferToBase64(file) {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return buffer.toString("base64");
  }
  async getCostPerMinute() {
    return 18e-4;
  }
  getSupportedFormats() {
    return [".wav", ".mp3", ".mp4", ".m4a", ".ogg", ".webm", ".flac"];
  }
}
class WhisperProcessor {
  constructor(config = {}) {
    this.serviceName = "Whisper";
    this.API_ENDPOINT = "https://api.openai.com/v1/audio/transcriptions";
    this.config = config;
  }
  async isAvailable() {
    return !!this.config.apiKey;
  }
  async processFile(file) {
    if (!this.config.apiKey) {
      throw new Error("Whisper API key not configured.");
    }
    try {
      const formData = new FormData();
      formData.append("file", file, file.name);
      const model = this.config.options?.model || "whisper-1";
      const language = this.config.options?.language;
      formData.append("model", model);
      if (language) {
        formData.append("language", language);
      }
      const startTime = Date.now();
      const response = await fetch(this.API_ENDPOINT, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.config.apiKey}`
        },
        body: formData
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Whisper API error (${response.status}): ${errorText}`);
      }
      const data = await response.json();
      const processingTime = Date.now() - startTime;
      return {
        id: `whisper-${Date.now()}`,
        serviceName: this.serviceName,
        text: data.text,
        processingTimeMs: processingTime,
        timestamp: /* @__PURE__ */ new Date(),
        metadata: {
          model,
          language: data.language,
          apiVersion: "v1",
          wordCount: data.text.split(" ").length
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      console.error(`Whisper processor error: ${errorMessage}`);
      throw new Error(`Whisper processor failed: ${errorMessage}`);
    }
  }
  async getCostPerMinute() {
    return 6e-3;
  }
  getSupportedFormats() {
    return [".mp3", ".wav", ".m4a", ".webm", ".flac", ".ogg"];
  }
}
const comparisonEngine = new ConsensusComparisonEngine();
const POST = async ({ request, cookies, fetch: fetch2 }) => {
  try {
    const clientIP = getClientIP(request);
    const rateLimitResult = checkRateLimit(clientIP);
    if (!rateLimitResult.allowed) {
      return json(
        {
          error: rateLimitResult.error || "Rate limit exceeded. Too many requests.",
          retryAfter: rateLimitResult.retryAfter
        },
        {
          status: rateLimitResult.error ? 400 : 429,
          headers: rateLimitResult.retryAfter ? {
            "Retry-After": rateLimitResult.retryAfter?.toString() || "900"
          } : {}
        }
      );
    }
    const formData = await request.formData();
    const csrfCookie = cookies.get("csrfToken");
    if (!validateCsrfFromForm(formData, csrfCookie)) {
      return json(
        { error: "Request could not be processed. Please try again." },
        { status: 403 }
      );
    }
    const audioFile = formData.get("audio");
    const audioUrl = formData.get("audioUrl")?.trim() || "";
    let fileForProcessing = null;
    if (audioFile) {
      fileForProcessing = audioFile;
    } else if (audioUrl) {
      try {
        const resp = await fetch2(audioUrl);
        if (!resp.ok) {
          return json({ error: `Failed to fetch audio from URL (${resp.status})` }, { status: 400 });
        }
        const contentType = resp.headers.get("content-type") || "application/octet-stream";
        const arrayBuf = await resp.arrayBuffer();
        const sizeBytes = arrayBuf.byteLength;
        if (sizeBytes > PERFORMANCE_CONFIG.MAX_FILE_SIZE_BYTES) {
          return json({ error: `Remote file too large: ${(sizeBytes / 1024 / 1024).toFixed(1)}MB (max ${(PERFORMANCE_CONFIG.MAX_FILE_SIZE_BYTES / 1024 / 1024).toFixed(1)}MB)` }, { status: 400 });
        }
        fileForProcessing = new File([new Uint8Array(arrayBuf)], "remote-audio", { type: contentType });
      } catch (e) {
        return json({ error: `Could not download audio from URL: ${e instanceof Error ? e.message : "Unknown error"}` }, { status: 400 });
      }
    } else {
      return json({ error: "No audio file or URL provided." }, { status: 400 });
    }
    const processors = initializeProcessors();
    if (processors.length === 0) {
      return json({ error: "No AI services are configured on the server." }, { status: 500 });
    }
    const results = await processWithAllAIs(processors, fileForProcessing);
    const successfulResults = results.filter((r) => r !== null);
    if (successfulResults.length === 0) {
      return json({ error: "All AI services failed to process the audio file." }, { status: 500 });
    }
    let consensusResult;
    try {
      consensusResult = comparisonEngine.compareTranscriptions(successfulResults);
    } catch (consensusError) {
      console.warn("Consensus engine failed, using fallback.", consensusError);
      const bestResult = successfulResults.reduce(
        (best, cur) => (cur.processingTimeMs || Infinity) < (best.processingTimeMs || Infinity) ? cur : best
      );
      const withConf = successfulResults.filter((r) => r.confidence !== void 0);
      const averageConfidence = withConf.length ? withConf.reduce((s, r) => s + (r.confidence ?? 0), 0) / withConf.length : 0;
      consensusResult = {
        finalText: bestResult.text,
        consensusConfidence: bestResult.confidence ?? 0,
        individualResults: successfulResults,
        disagreements: [],
        stats: {
          totalProcessingTimeMs: Math.max(...successfulResults.map((r) => r.processingTimeMs || 0)),
          servicesUsed: successfulResults.length,
          averageConfidence,
          disagreementCount: 0
        },
        reasoning: {
          finalReasoning: `Consensus algorithm failed. Fallback to fastest provider: ${bestResult.serviceName}.`,
          steps: [{
            stepNumber: 1,
            description: "The main consensus engine failed. Using fallback logic.",
            data: {
              selectedService: bestResult.serviceName,
              error: consensusError instanceof Error ? consensusError.message : String(consensusError)
            }
          }]
        }
      };
    }
    return json(consensusResult);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error(`Transcription API Error: ${errorMessage}`);
    const response = process.env.NODE_ENV === "production" ? { error: "Failed to process audio file." } : { error: "Failed to process audio file.", details: errorMessage };
    return json(response, { status: 500 });
  }
};
function initializeProcessors() {
  const processors = [];
  if (process.env.OPENAI_API_KEY) processors.push(new WhisperProcessor({ apiKey: process.env.OPENAI_API_KEY }));
  if (process.env.ASSEMBLYAI_API_KEY) processors.push(new AssemblyAIProcessor({ apiKey: process.env.ASSEMBLYAI_API_KEY }));
  if (process.env.DEEPGRAM_API_KEY) processors.push(new DeepgramProcessor({ apiKey: process.env.DEEPGRAM_API_KEY }));
  if (process.env.ELEVENLABS_API_KEY) processors.push(new ElevenLabsProcessor({ apiKey: process.env.ELEVENLABS_API_KEY }));
  if (process.env.GEMINI_API_KEY) processors.push(new GeminiProcessor({ apiKey: process.env.GEMINI_API_KEY }));
  return processors;
}
async function processWithAllAIs(processors, file) {
  const promises = processors.map((processor) => processWithTimeout(processor, file));
  return Promise.all(promises);
}
async function processWithTimeout(processor, file) {
  try {
    return await Promise.race([
      processor.processFile(file),
      new Promise(
        (_, reject) => setTimeout(() => reject(new Error("Timeout")), PERFORMANCE_CONFIG.SERVICE_TIMEOUT_MS)
      )
    ]);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`${processor.serviceName} failed: ${errorMessage}`);
    return null;
  }
}
export {
  POST
};
