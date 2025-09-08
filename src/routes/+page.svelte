<script lang="ts">
  /**
   * @file +page.svelte
   * @purpose Main UI page for the Multi-AI Transcription Engine
   * @phazzie-status working
   * @last-regenerated 2025-01-29 13:54:37 UTC
   * @dependencies FileUpload.svelte, ResultsDisplay.svelte, ProgressBar.svelte
   *
   * PROGRESSIVE ENHANCEMENT PATTERN (FROM LESSONS LEARNED):
   * ======================================================
   * This UI implements progressive enhancement for maximum accessibility:
   * 1. HTML-ONLY: Core functionality works without JavaScript
   * 2. JAVASCRIPT ENHANCED: Drag-and-drop, progress indicators, dynamic updates
   * 3. AI-POWERED: Multi-service transcription with consensus algorithm
   *
   * WHY THIS ARCHITECTURE:
   * =====================
   * - Works without JavaScript (accessibility, performance, reliability)
   * - Graceful degradation when services fail
   * - Clear loading states prevent user confusion
   * - Error recovery options guide users through issues
   *
   * STATE MANAGEMENT LOGIC (FROM LESSONS LEARNED):
   * ==============================================
   * State variables follow clear naming conventions for regeneration:
   * - audioFileFromUser: Current uploaded file (null when no file)
   * - isProcessingTranscription: Loading state (true during API calls)
   * - transcriptionResults: Array of AI service results
   * - uploadProgress: Progress percentage (0-100)
   * - errorMessage: User-friendly error messages
   *
   * REGENERATION PATTERNS:
   * =====================
   * 1. UI Layout: Can be completely redesigned while maintaining state
   * 2. Event Handlers: Can be rewritten with different interaction patterns
   * 3. API Integration: Can switch to different endpoints or protocols
   * 4. Error Handling: Can implement different user feedback mechanisms
   */

  // ========= REGENERATION BOUNDARY START: Imports =========
  // @phazzie: This section can be regenerated independently
  // @contract: Must import required components and types
  // @dependencies: None

  import FileUpload from '$lib/components/FileUpload.svelte';
  import ResultsDisplay from '$lib/components/ResultsDisplay.svelte';
  import ProgressBar from '$lib/components/ProgressBar.svelte';

  // ========= REGENERATION BOUNDARY END: Imports =========

  // ========= REGENERATION BOUNDARY START: State Management =========
  // @phazzie: This section can be regenerated independently
  // @contract: Must maintain application state
  // @dependencies: None

  // WHY VERBOSE NAMING:
  // ===================
  // Self-documenting variable names enable instant understanding
  // No need to trace variable origins during regeneration
  // Clear intent makes code maintenance easier

  // Server-provided data (CSRF token)
  export let data: { csrfToken: string };

  let audioFileFromUser: File | null = null;  // Current uploaded audio file
  let audioUrlOverride: string = '';          // Optional public URL to audio (bypasses upload limits)
  let isProcessingTranscription = false;      // Loading state during API calls
  let transcriptionResults: any[] = [];       // Results from all AI services
  let consensusResult: any = null;            // Consensus result with AI reasoning
  let uploadProgress = 0;                     // Progress percentage (0-100)
  let errorMessage = '';                      // User-friendly error display
  let testApiResults: any[] | null = null;    // To store results from the API tests
  
  // Add explicit display state to force reactivity
  let showResults = false;                    // Controls main display state
  let displayState: 'upload' | 'processing' | 'results' | 'error' = 'upload';

  // Reactive statement to ensure UI updates
  $: {
    if (transcriptionResults.length > 0 && consensusResult) {
      showResults = true;
      displayState = 'results';
    } else if (isProcessingTranscription) {
      displayState = 'processing'; 
    } else if (errorMessage) {
      displayState = 'error';
    } else {
      showResults = false;
      displayState = 'upload';
    }
  }

  // ========= REGENERATION BOUNDARY END: State Management =========

  // ========= REGENERATION BOUNDARY START: File Upload Handler =========
  // @phazzie: This section can be regenerated independently
  // @contract: Must handle file upload and update state
  // @dependencies: FileUpload component

  async function handleFileUploaded(event: CustomEvent) {
    console.log('@phazzie-checkpoint-1: File upload event received');

    try {
      const uploadedFile = event.detail.file;
      audioFileFromUser = uploadedFile;

      console.log('@phazzie-checkpoint-2: File stored in state');
      console.log('@phazzie-checkpoint-3: Ready for transcription processing');

      // WHY ERROR RESET:
      // ================
      // Clear previous errors when new file is uploaded
      // Prevents stale error messages from confusing users
      // Fresh start for new transcription attempt

      errorMessage = '';

    } catch (error) {
      console.error('@phazzie-error: File upload handling failed');
      errorMessage = 'Unable to process the uploaded file. Please try uploading a different audio file.';
      console.error(error);
    }
  }

  // ========= REGENERATION BOUNDARY END: File Upload Handler =========

  // ========= REGENERATION BOUNDARY START: Transcription Processing =========
  // @phazzie: This section can be regenerated independently
  // @contract: Must process audio file and get transcription results
  // @dependencies: audioFileFromUser state

  async function startTranscriptionProcess() {
    if (!audioFileFromUser && !audioUrlOverride) {
      errorMessage = 'No file selected or URL provided';
      return;
    }

    isProcessingTranscription = true;
    errorMessage = '';
    let publicUrl = audioUrlOverride;

    try {
      // If a file is uploaded, use the direct-to-storage workflow
      if (audioFileFromUser && !publicUrl) {
        // Step 1: Get a presigned URL from our server
        console.log('Requesting presigned URL...');
        const presignedUrlResponse = await fetch('/api/generate-upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: audioFileFromUser.name,
            csrfToken: data.csrfToken
          })
        });

        if (!presignedUrlResponse.ok) {
          throw new Error('Could not get an upload URL from the server.');
        }
        const { signedUrl, publicUrl: returnedPublicUrl } = await presignedUrlResponse.json();
        publicUrl = returnedPublicUrl;
        console.log('Got presigned URL:', signedUrl);

        // Step 2: Upload the file directly to Spaces with progress tracking
        console.log('Uploading file to storage...');
        await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('PUT', signedUrl, true);
          xhr.setRequestHeader('Content-Type', audioFileFromUser?.type || 'application/octet-stream');

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percentage = Math.round((event.loaded / event.total) * 100);
              uploadProgress = percentage;
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              console.log('File upload to storage successful.');
              uploadProgress = 100;
              resolve(xhr.response);
            } else {
              reject(new Error(`File upload failed: ${xhr.statusText}`));
            }
          };

          xhr.onerror = () => reject(new Error('File upload failed due to a network error.'));
          xhr.send(audioFileFromUser);
        });
      }

      // Step 3: Trigger transcription processing on our server with the public URL
      console.log('Sending URL to transcription API:', publicUrl);
      const formData = new FormData();
      formData.append('audioUrl', publicUrl);
      formData.append('csrfToken', data.csrfToken);

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API call failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      if (result && result.finalText) {
        transcriptionResults = result.individualResults || [];
        consensusResult = result;
        displayState = 'results';
      } else {
        throw new Error('Processing completed, but no valid transcription was returned.');
      }

    } catch (error) {
      console.error('Transcription process failed:', error);
      errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      displayState = 'error';
    } finally {
      isProcessingTranscription = false;
      uploadProgress = 0; // Reset progress bar
    }
  }

  // ========= REGENERATION BOUNDARY END: Transcription Processing =========

  // ========= REGENERATION BOUNDARY START: API Test Function =========
  async function runApiTests() {
    testApiResults = []; // Reset previous results
    isProcessingTranscription = true; // Reuse processing state to show loading
    errorMessage = '';

    try {
      const response = await fetch('/api/test-apis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ csrfToken: data?.csrfToken ?? '' })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API test call failed: ${response.status} - ${errorText}`);
      }

      const results = await response.json();
      testApiResults = results.testResults;

    } catch (error) {
      if (error instanceof Error) {
        errorMessage = error.message;
      } else {
        errorMessage = 'An unknown error occurred during API tests.';
      }
      console.error(error);
    } finally {
      isProcessingTranscription = false;
    }
  }
  // ========= REGENERATION BOUNDARY END: API Test Function =========
</script>

<!-- ========= REGENERATION BOUNDARY START: UI Template ========= -->
<!-- @phazzie: This section can be regenerated independently -->
<!-- @contract: Must render the main application UI -->
<!-- @dependencies: State variables and event handlers -->

<!-- Subtle Animated Background Particles -->
<div class="particle-container">
  {#each Array(12) as _, i}
    <div 
      class="particle" 
      style="left: {Math.random() * 100}%; animation-delay: {Math.random() * 12}s; animation-duration: {12 + Math.random() * 6}s;"
    ></div>
  {/each}
</div>

<main class="min-h-screen relative cyber-grid-bg">
  <!-- Clean Gradient Overlay -->
  <div class="absolute inset-0 bg-gradient-to-br from-slate-900/40 via-blue-900/30 to-indigo-900/40"></div>
  
  <div class="relative z-10 max-w-6xl mx-auto px-4 py-12">

    <!-- Header Section with Massive Glow Effects -->
    <div class="text-center mb-16 animate-fade-in-up">
      <h1 class="text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan via-neon-pink to-neon-purple mb-6 animate-glow-pulse">
        🎵 YaHeard 🎵
      </h1>
      <h2 class="text-4xl lg:text-5xl font-bold text-glow-cyan mb-4 animate-neon-flicker">
        Multi-AI Transcription Engine
      </h2>
      <p class="text-2xl text-white/90 drop-shadow-2xl animate-float max-w-3xl mx-auto leading-relaxed">
        ✨ Upload audio files and get <span class="text-glow-pink font-bold">consensus transcriptions</span> from multiple AI services ✨
      </p>
      
      <!-- Decorative Elements -->
      <div class="flex justify-center space-x-8 mt-8">
        <div class="w-4 h-4 bg-neon-cyan rounded-full animate-ping shadow-neon-cyan"></div>
        <div class="w-4 h-4 bg-neon-pink rounded-full animate-ping shadow-neon-pink" style="animation-delay: 0.5s"></div>
        <div class="w-4 h-4 bg-neon-purple rounded-full animate-ping shadow-neon-purple" style="animation-delay: 1s"></div>
      </div>
    </div>
    
    <!-- Debug Info (remove in production) -->
        <!-- Debug Info - Always show for now to diagnose issue -->
        <!-- Debug Info - Shows current state for troubleshooting -->
    <div class="mb-4 p-4 bg-black/50 rounded text-sm text-white/70">
      Debug: displayState = {displayState}, 
      transcriptionResults.length = {transcriptionResults.length}, 
      consensusResult = {consensusResult ? 'exists' : 'null'}, 
      isProcessing = {isProcessingTranscription},
      audioFile = {audioFileFromUser ? audioFileFromUser.name : 'none'}
    </div>

    <!-- CLEAN STATE-DRIVEN UI DESIGN -->
    
    {#if displayState === 'upload'}
      <!-- UPLOAD STATE: File selection and ready-to-process -->
      <div class="space-y-8">
        <!-- File Upload Section -->
        <div class="glass-morphism holographic rounded-3xl shadow-2xl p-10 border-2 border-white/20 hover:border-neon-cyan/50 transition-all duration-500 transform hover:scale-[1.02] animate-slide-in-left">
          <div class="flex items-center space-x-4 mb-8">
            <div class="text-6xl animate-bounce-slow">🎤</div>
            <div>
              <h2 class="text-4xl font-bold text-glow-cyan mb-2">Upload Audio File</h2>
              <p class="text-xl text-white/80">Drag & drop or click to select your audio masterpiece</p>
            </div>
          </div>

          <FileUpload
            on:fileUploaded={handleFileUploaded}
            disabled={isProcessingTranscription}
          />

          {#if audioFileFromUser}
            <div class="mt-8 p-6 glass-morphism rounded-2xl border-2 border-neon-green/50 shadow-neon-green animate-fade-in-up">
              <div class="flex items-center space-x-4">
                <div class="text-4xl animate-spin-slow">💾</div>
                <div>
                  <p class="text-2xl font-bold text-glow-green">✅ File Locked & Loaded!</p>
                  <p class="text-lg text-green-300">
                    📁 {audioFileFromUser.name} 
                    <span class="text-neon-cyan">({(audioFileFromUser.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </p>
                </div>
              </div>
            </div>
          {/if}

          <!-- Optional: URL override to bypass upload limits on hosting providers -->
          <div class="mt-6 glass-morphism rounded-2xl p-6 border border-white/20">
            <label class="block text-white/80 text-sm mb-2" for="audio-url">Or paste a public audio URL (bypasses upload size limits)</label>
            <input
              id="audio-url"
              type="url"
              placeholder="https://example.com/path/to/your-audio-file.mp3"
              class="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-neon-cyan"
              bind:value={audioUrlOverride}
            />
            <p class="text-xs text-white/60 mt-2">Tip: Host the file on a public URL (S3, Dropbox direct link, etc.). We'll fetch it server-side. On serverless hosts (e.g., Vercel), uploads larger than ~4.5MB will fail—use this URL option for big files.</p>
          </div>
        </div>

        <!-- API Test Section -->
        <div class="glass-morphism holographic rounded-3xl shadow-2xl p-10 border-2 border-white/20 text-center">
            <h3 class="text-2xl font-bold text-glow-purple mb-4">Diagnose API Connections</h3>
            <button
              on:click={runApiTests}
              class="btn-cyber-secondary text-white font-bold py-3 px-6 rounded-lg text-lg"
              disabled={isProcessingTranscription}
            >
              <span class="relative z-10">🧪 Test APIs</span>
            </button>

            {#if testApiResults}
              <div class="mt-6 text-left space-y-2">
                <h4 class="text-xl font-bold text-white/90">API Test Results:</h4>
                <ul class="list-disc list-inside bg-black/30 p-4 rounded-lg">
                  {#each testApiResults as result}
                    <li class:text-green-400={result.success} class:text-red-400={!result.success}>
                      <strong>{result.serviceName}:</strong>
                      {#if result.success}
                        ✅ Success
                      {:else}
                        ❌ Failed - {result.error}
                      {/if}
                    </li>
                  {/each}
                </ul>
              </div>
            {/if}
        </div>

        <!-- Ready to Process Section -->
        {#if audioFileFromUser}
          <div class="glass-morphism holographic rounded-3xl shadow-2xl p-10 border-2 border-white/20 hover:border-neon-purple/50 transition-all duration-500 animate-slide-in-right">
            <div class="text-center">
              <div class="text-8xl mb-6 animate-float">🚀</div>
              <h2 class="text-4xl font-bold text-glow-purple mb-6">Ready for Liftoff!</h2>
              
              <button
                on:click={startTranscriptionProcess}
                class="btn-cyber text-white font-bold py-6 px-12 rounded-2xl text-2xl transform transition-all duration-300 shadow-2xl relative z-10"
                disabled={isProcessingTranscription}
              >
                <span class="relative z-10">🌟 PROCESS WITH AI MAGIC 🌟</span>
              </button>
              
              <p class="text-lg text-white/70 mt-4 animate-pulse">
                Powered by Whisper • AssemblyAI • Deepgram • Gemini • ElevenLabs
              </p>
            </div>
          </div>
        {/if}
      </div>

    {:else if displayState === 'processing'}
      <!-- PROCESSING STATE: Progress and AI status -->
      <div class="glass-morphism holographic rounded-3xl shadow-2xl p-10 border-2 border-neon-yellow/50 shadow-neon-cyan animate-slide-in-up">
        <div class="text-center">
          <div class="text-8xl mb-6 animate-spin-slow">⚡</div>
          <h2 class="text-4xl font-bold text-glow-cyan mb-8">AI Minds Collaborating...</h2>

          <ProgressBar progress={uploadProgress} />

          <div class="mt-8 space-y-4">
            <p class="text-xl text-white/90">Processing your audio with 5 AI services...</p>
            <div class="flex justify-center space-x-4 text-sm">
              <span class="px-3 py-1 bg-blue-500/20 rounded-full animate-pulse">🤖 Whisper</span>
              <span class="px-3 py-1 bg-green-500/20 rounded-full animate-pulse" style="animation-delay: 0.5s">🤖 AssemblyAI</span>
              <span class="px-3 py-1 bg-purple-500/20 rounded-full animate-pulse" style="animation-delay: 1s">🤖 Deepgram</span>
              <span class="px-3 py-1 bg-pink-500/20 rounded-full animate-pulse" style="animation-delay: 1.5s">🤖 Gemini</span>
              <span class="px-3 py-1 bg-orange-500/20 rounded-full animate-pulse" style="animation-delay: 2s">🤖 ElevenLabs</span>
            </div>
          </div>
        </div>
      </div>

    {:else if displayState === 'results'}
      <!-- RESULTS STATE: Clean transcription display -->
      <div class="space-y-8 animate-slide-in-up">
        <!-- Success Header -->
        <div class="text-center">
          <div class="text-8xl mb-4 animate-bounce-slow">🎯</div>
          <h2 class="text-4xl font-bold text-glow-green mb-4">Transcription Complete!</h2>
          <p class="text-xl text-white/80">
            AI Consensus: <span class="text-glow-cyan font-bold">{Math.round((consensusResult?.consensusConfidence || 0) * 100)}%</span>
          </p>
        </div>

        <!-- Main Results Display -->
        <div class="glass-morphism holographic rounded-3xl shadow-2xl p-10 border-2 border-neon-green/50 shadow-neon-green">
          <ResultsDisplay results={transcriptionResults} consensus={consensusResult} />
          
          <!-- Action Buttons -->
          <div class="flex justify-center space-x-6 mt-8">
            <button 
              on:click={() => {
                // Reload to obtain a fresh CSRF token for the next submission
                window.location.reload();
              }}
              class="btn-cyber text-white font-bold py-4 px-8 rounded-xl text-lg"
            >
              🔄 Process Another File
            </button>
            
            <button 
              on:click={() => {
                const text = consensusResult?.finalText || '';
                navigator.clipboard.writeText(text);
              }}
              class="btn-cyber-secondary text-white font-bold py-4 px-8 rounded-xl text-lg"
            >
              📋 Copy Text
            </button>
          </div>
        </div>
      </div>

    {:else if displayState === 'error'}
      <!-- ERROR STATE: Clear error message and retry -->
      <div class="glass-morphism neon-border rounded-3xl p-10 border-red-500 bg-red-500/10 animate-slide-in-up">
        <div class="text-center space-y-6">
          <div class="text-8xl animate-bounce">⚠️</div>
          <div>
            <h2 class="text-4xl font-bold text-red-400 mb-4">Processing Failed</h2>
            <p class="text-xl text-red-300">{errorMessage}</p>
          </div>
          
          <button 
            on:click={() => {
              // Reset to upload state
              displayState = 'upload';
              errorMessage = '';
              isProcessingTranscription = false;
            }}
            class="btn-cyber text-white font-bold py-4 px-8 rounded-xl text-lg"
          >
            🔄 Try Again
          </button>
        </div>
      </div>
    {/if}

    <!-- Error Display with Neon Styling -->
    {#if displayState === 'error' && errorMessage}
      <div class="glass-morphism neon-border rounded-2xl p-6 mb-8 border-red-500 bg-red-500/10 animate-slide-in-left">
        <div class="flex items-center space-x-3">
          <div class="text-4xl animate-bounce">⚠️</div>
          <div>
            <strong class="text-red-400 text-xl">System Alert:</strong>
            <p class="text-red-300 text-lg mt-1">{errorMessage}</p>
          </div>
        </div>
      </div>
    {/if}

    <!-- File Upload Section - Only show in upload state -->
    {#if displayState === 'upload'}
    <div class="glass-morphism holographic rounded-3xl shadow-2xl p-10 mb-12 border-2 border-white/20 hover:border-neon-cyan/50 transition-all duration-500 transform hover:scale-[1.02] animate-slide-in-left">
      <div class="flex items-center space-x-4 mb-8">
        <div class="text-6xl animate-bounce-slow">🎤</div>
        <div>
          <h2 class="text-4xl font-bold text-glow-cyan mb-2">Upload Audio File</h2>
          <p class="text-xl text-white/80">Drag & drop or click to select your audio masterpiece</p>
        </div>
      </div>

      <FileUpload
        on:fileUploaded={handleFileUploaded}
        disabled={isProcessingTranscription}
      />

      {#if audioFileFromUser}
        <div class="mt-8 p-6 glass-morphism rounded-2xl border-2 border-neon-green/50 shadow-neon-green animate-fade-in-up">
          <div class="flex items-center space-x-4">
            <div class="text-4xl animate-spin-slow">💾</div>
            <div>
              <p class="text-2xl font-bold text-glow-green">
                ✅ File Locked & Loaded!
              </p>
              <p class="text-lg text-green-300">
                📁 {audioFileFromUser.name} 
                <span class="text-neon-cyan">({(audioFileFromUser.size / 1024 / 1024).toFixed(2)} MB)</span>
              </p>
            </div>
          </div>
        </div>
      {/if}
    </div>
    {/if} <!-- End of upload section -->

    <!-- Ready to Process Section - Show when file uploaded but not processing -->
    {#if audioFileFromUser && displayState === 'upload'}
      <div class="glass-morphism holographic rounded-3xl shadow-2xl p-10 mb-12 border-2 border-white/20 hover:border-neon-purple/50 transition-all duration-500 animate-slide-in-right">
        <div class="text-center">
          <div class="text-8xl mb-6 animate-float">🚀</div>
          <h2 class="text-4xl font-bold text-glow-purple mb-6">Ready for Liftoff!</h2>
          
          <button
            on:click={startTranscriptionProcess}
            class="btn-cyber text-white font-bold py-6 px-12 rounded-2xl text-2xl transform transition-all duration-300 shadow-2xl relative z-10"
            disabled={isProcessingTranscription}
          >
            <span class="relative z-10">🌟 PROCESS WITH AI MAGIC 🌟</span>
          </button>
          
          <p class="text-lg text-white/70 mt-4 animate-pulse">
            Powered by Whisper • AssemblyAI • Deepgram • Gemini • ElevenLabs
          </p>
        </div>
      </div>
    {/if}

    <!-- Processing Section - Only show when processing -->
    {#if displayState === 'processing'}
      <div class="glass-morphism holographic rounded-3xl shadow-2xl p-10 mb-12 border-2 border-neon-yellow/50 shadow-neon-cyan animate-slide-in-left">
        <div class="text-center">
          <div class="text-8xl mb-6 animate-spin-slow">⚡</div>
          <h2 class="text-4xl font-bold text-glow-cyan mb-8">AI Brains Working...</h2>

          <ProgressBar progress={uploadProgress} />

          <p class="text-lg text-white/60 mt-6 animate-pulse">
            🤖 Whisper analyzing... 🤖 AssemblyAI thinking... 🤖 Multiple AI minds collaborating...
          </p>
        </div>
      </div>
    {/if}

    <!-- Results Section with Spectacular Effects -->
    {#if transcriptionResults.length > 0}
      <!-- Results Page Header -->
      <div class="text-center mb-12 animate-fade-in-up">
        <div class="text-9xl mb-6 animate-bounce-slow">🎯</div>
        <h1 class="text-6xl font-bold text-glow-green mb-4">AI Transcription Complete!</h1>
        <p class="text-2xl text-white/80 mb-2">Multi-AI Consensus Analysis</p>
        <p class="text-lg text-neon-cyan">
          📁 {audioFileFromUser?.name || 'Audio File'} 
          {#if audioFileFromUser}
            <span class="text-white/60">({(audioFileFromUser.size / 1024 / 1024).toFixed(2)} MB)</span>
          {/if}
        </p>
      </div>

      <!-- Main Results Display -->
      <div class="glass-morphism holographic rounded-3xl shadow-2xl p-10 border-2 border-neon-green/50 shadow-neon-green animate-slide-in-right">
        <ResultsDisplay results={transcriptionResults} consensus={consensusResult} />
        
        <!-- Action Buttons -->
        <div class="flex justify-center space-x-6 mt-8">
          <button 
            on:click={() => window.location.reload()}
            class="btn-cyber text-white font-bold py-4 px-8 rounded-xl text-lg"
          >
            🔄 Process Another File
          </button>
          
          <button 
            on:click={() => {
              const text = consensusResult?.finalText || '';
              navigator.clipboard.writeText(text);
            }}
            class="btn-cyber-secondary text-white font-bold py-4 px-8 rounded-xl text-lg"
          >
            📋 Copy Text
          </button>
        </div>
      </div>
    {/if}

  </div>
</main>

<style>
  /* Enhanced Cyber Theme Styles */
  .cyber-grid-bg {
    background-image: 
      linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px);
    background-size: 50px 50px;
    animation: grid-move 20s linear infinite;
  }

  @keyframes grid-move {
    0% { background-position: 0 0; }
    100% { background-position: 50px 50px; }
  }

  .glass-morphism {
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .holographic {
    position: relative;
    overflow: hidden;
  }

  .holographic::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(0, 255, 255, 0.2),
      transparent
    );
    animation: holographic-sweep 3s infinite;
  }

  @keyframes holographic-sweep {
    0% { left: -100%; }
    100% { left: 100%; }
  }

  .neon-border {
    border: 2px solid;
    border-image: linear-gradient(45deg, #00ffff, #ff00ff, #ffff00, #00ffff) 1;
    animation: border-glow 2s ease-in-out infinite alternate;
  }

  @keyframes border-glow {
    from { box-shadow: 0 0 10px rgba(0, 255, 255, 0.5); }
    to { box-shadow: 0 0 20px rgba(0, 255, 255, 0.8), 0 0 30px rgba(0, 255, 255, 0.6); }
  }

  .text-glow-cyan {
    color: #00ffff;
    text-shadow: 0 0 10px rgba(0, 255, 255, 0.8);
  }

  .text-glow-pink {
    color: #ff69b4;
    text-shadow: 0 0 10px rgba(255, 105, 180, 0.8);
  }

  .text-glow-purple {
    color: #8b5cf6;
    text-shadow: 0 0 10px rgba(139, 92, 246, 0.8);
  }

  .text-glow-green {
    color: #10b981;
    text-shadow: 0 0 10px rgba(16, 185, 129, 0.8);
  }

  .btn-cyber {
    background: linear-gradient(45deg, #00ffff, #ff00ff);
    border: 2px solid transparent;
    background-clip: padding-box;
    position: relative;
  }

  .btn-cyber:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 255, 255, 0.4);
  }

  .btn-cyber-secondary {
    background: linear-gradient(45deg, #8b5cf6, #ec4899);
    border: 2px solid transparent;
    background-clip: padding-box;
  }

  .btn-cyber-secondary:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(139, 92, 246, 0.4);
  }

  /* Animations */
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideInLeft {
    from {
      opacity: 0;
      transform: translateX(-50px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(50px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(50px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes bounceIn {
    0%, 20%, 40%, 60%, 80% {
      animation-timing-function: cubic-bezier(0.215, 0.610, 0.355, 1.000);
    }
    0% {
      opacity: 0;
      transform: scale3d(.3, .3, .3);
    }
    20% {
      transform: scale3d(1.1, 1.1, 1.1);
    }
    40% {
      transform: scale3d(.9, .9, .9);
    }
    60% {
      opacity: 1;
      transform: scale3d(1.03, 1.03, 1.03);
    }
    80% {
      transform: scale3d(.97, .97, .97);
    }
    100% {
      opacity: 1;
      transform: scale3d(1, 1, 1);
    }
  }

  .animate-fade-in-up {
    animation: fadeInUp 0.6s ease-out;
  }

  .animate-slide-in-left {
    animation: slideInLeft 0.8s ease-out;
  }

  .animate-slide-in-right {
    animation: slideInRight 0.8s ease-out;
  }

  .animate-slide-in-up {
    animation: slideInUp 0.6s ease-out;
  }


  .animate-glow-pulse {
    animation: glow-pulse 2s ease-in-out infinite alternate;
  }

  @keyframes glow-pulse {
    from {
      text-shadow: 0 0 20px rgba(0, 255, 255, 0.5), 0 0 30px rgba(255, 0, 255, 0.3), 0 0 40px rgba(255, 255, 0, 0.2);
    }
    to {
      text-shadow: 0 0 30px rgba(0, 255, 255, 0.8), 0 0 40px rgba(255, 0, 255, 0.6), 0 0 50px rgba(255, 255, 0, 0.4);
    }
  }

  .animate-float {
    animation: float 3s ease-in-out infinite;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }

  .animate-spin-slow {
    animation: spin 3s linear infinite;
  }

  .animate-bounce-slow {
    animation: bounce-slow 2s ease-in-out infinite;
  }

  @keyframes bounce-slow {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
  }


  .animate-neon-flicker {
    animation: neon-flicker 1.5s ease-in-out infinite alternate;
  }

  @keyframes neon-flicker {
    0%, 100% { 
      opacity: 1;
      text-shadow: 0 0 10px rgba(0, 255, 255, 0.8);
    }
    50% { 
      opacity: 0.8;
      text-shadow: 0 0 20px rgba(0, 255, 255, 1);
    }
  }
</style>
