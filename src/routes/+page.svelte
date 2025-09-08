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

<!-- Simplified Background -->
<div class="fixed inset-0 bg-slate-900 -z-10"></div>
<div class="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 opacity-50 -z-10"></div>

<main class="min-h-screen relative">
  <div class="relative z-10 max-w-5xl mx-auto px-4 py-12">

    <!-- Simplified Header -->
    <div class="text-center mb-12">
      <h1 class="text-5xl md:text-6xl font-extrabold text-white mb-4">
        YaHeard
      </h1>
      <p class="text-lg md:text-xl text-indigo-300 max-w-2xl mx-auto">
        Upload an audio file to get a consensus transcription from multiple AI services.
      </p>
    </div>

    <!-- State-Driven UI -->
    <div class="bg-slate-800/50 backdrop-blur-md rounded-2xl shadow-lg p-6 md:p-10 border border-slate-700">
      {#if displayState === 'upload'}
        <!-- UPLOAD STATE -->
        <div class="space-y-6">
          <div>
            <h2 class="text-2xl font-bold text-white mb-2">1. Upload Audio</h2>
            <p class="text-slate-400">Select a file or paste a public URL.</p>
          </div>

          <FileUpload on:fileUploaded={handleFileUploaded} disabled={isProcessingTranscription} />

          {#if audioFileFromUser}
            <div class="mt-4 p-4 bg-green-900/30 rounded-lg border border-green-700 text-center">
              <p class="font-semibold text-green-300">
                ✅ Ready to process: {audioFileFromUser.name}
              </p>
            </div>
          {/if}

          <div class="text-center text-slate-500">OR</div>

          <div>
            <label class="block text-slate-400 text-sm mb-2" for="audio-url">
              Paste a public audio URL
            </label>
            <input
              id="audio-url"
              type="url"
              placeholder="https://..."
              class="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              bind:value={audioUrlOverride}
            />
             <p class="text-xs text-slate-500 mt-2">Useful for files larger than 4.5MB on serverless platforms.</p>
          </div>

          {#if audioFileFromUser || audioUrlOverride}
            <div class="text-center pt-4">
               <h2 class="text-2xl font-bold text-white mb-2">2. Transcribe</h2>
              <button
                on:click={startTranscriptionProcess}
                class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-all duration-300 shadow-lg disabled:bg-slate-600 disabled:cursor-not-allowed"
                disabled={isProcessingTranscription}
              >
                Start Processing
              </button>
            </div>
          {/if}
        </div>

      {:else if displayState === 'processing'}
        <!-- PROCESSING STATE -->
        <div class="text-center py-10">
          <div class="text-6xl mb-4 animate-spin">⚙️</div>
          <h2 class="text-3xl font-bold text-white mb-4">Processing...</h2>
          <p class="text-slate-400 mb-6">Uploading and transcribing your audio. Please wait.</p>
          <ProgressBar progress={uploadProgress} />
        </div>

      {:else if displayState === 'results'}
        <!-- RESULTS STATE -->
        <div>
          <div class="text-center mb-8">
            <h2 class="text-3xl font-bold text-green-400 mb-2">Transcription Complete</h2>
            <p class="text-slate-400">Review the consensus and individual AI results below.</p>
          </div>

          <ResultsDisplay results={transcriptionResults} consensus={consensusResult} />

          <div class="flex justify-center space-x-4 mt-8">
            <button 
              on:click={() => window.location.reload()}
              class="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-6 rounded-lg transition"
            >
              Process Another File
            </button>
          </div>
        </div>

      {:else if displayState === 'error'}
        <!-- ERROR STATE -->
        <div class="text-center py-10">
          <div class="text-6xl mb-4">⚠️</div>
          <h2 class="text-3xl font-bold text-red-400 mb-2">An Error Occurred</h2>
          <p class="text-red-300 bg-red-900/50 p-4 rounded-lg">{errorMessage}</p>
          <button 
            on:click={() => {
              displayState = 'upload';
              errorMessage = '';
              audioFileFromUser = null;
              audioUrlOverride = '';
            }}
            class="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition"
          >
            Try Again
          </button>
        </div>
      {/if}
    </div>

    <!-- API Test Section -->
    <div class="mt-8 bg-slate-800/50 backdrop-blur-md rounded-2xl shadow-lg p-6 md:p-8 border border-slate-700 text-center">
        <h3 class="text-xl font-bold text-white mb-4">API Status</h3>
        <button
          on:click={runApiTests}
          class="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-6 rounded-lg transition disabled:bg-slate-600 disabled:cursor-not-allowed"
          disabled={isProcessingTranscription}
        >
         🧪 Test Connections
        </button>

        {#if testApiResults}
          <div class="mt-4 text-left space-y-2 max-w-md mx-auto">
            <ul class="list-disc list-inside bg-slate-900/50 p-4 rounded-lg">
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
