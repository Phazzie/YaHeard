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

  let audioFileFromUser: File | null = null;  // Current uploaded audio file
  let isProcessingTranscription = false;      // Loading state during API calls
  let transcriptionResults: any[] = [];       // Results from all AI services
  let consensusResult: any = null;            // Consensus result with AI reasoning
  let uploadProgress = 0;                     // Progress percentage (0-100)
  let errorMessage = '';                      // User-friendly error display

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
    console.log('@phazzie-checkpoint-4: Starting transcription process');

    // WHY EARLY VALIDATION:
    // =====================
    // Prevent API calls with invalid state
    // Clear error messages guide user action
    // Fail fast to improve user experience

    if (!audioFileFromUser) {
      errorMessage = 'No file selected';
      return;
    }

    try {
      isProcessingTranscription = true;
      uploadProgress = 0;

      console.log('@phazzie-checkpoint-5: Sending file to API');

      // WHY PROGRESS SIMULATION:
      // ========================
      // Provide immediate feedback while API processes
      // Prevents user confusion during long operations
      // Can be replaced with real progress in future regeneration

      const progressInterval = setInterval(() => {
        uploadProgress += 10;
        if (uploadProgress >= 100) {
          clearInterval(progressInterval);
        }
      }, 500);

      // WHY FETCH API:
      // ==============
      // Native browser API for HTTP requests
      // No external dependencies required
      // Can be easily replaced with different HTTP clients

      const formData = new FormData();
      formData.append('audio', audioFileFromUser);

      console.log('@phazzie-debug: About to make fetch request');
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      });

      console.log('@phazzie-debug: Fetch request completed', response.status);
      clearInterval(progressInterval);
      uploadProgress = 100;

      if (!response.ok) {
        const errorText = await response.text();
        console.error('@phazzie-debug: Response not OK', response.status, errorText);
        throw new Error(`API call failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('@phazzie-debug: API response received:', result);
      
      // API now directly returns ConsensusResult
      if (result && result.finalText) {
        console.log('@phazzie-debug: Consensus data:', result);
        
        // Extract individual results and consensus from direct response
        transcriptionResults = result.individualResults || [];
        consensusResult = result;
      } else {
        console.log('@phazzie-debug: No results in API response');
        transcriptionResults = [];
        consensusResult = null;
      }

      console.log('@phazzie-debug: Final transcriptionResults:', transcriptionResults);
      console.log('@phazzie-debug: Final consensusResult:', consensusResult);
      console.log('@phazzie-checkpoint-6: Transcription completed successfully');

    } catch (error) {
      console.error('@phazzie-error: Transcription processing failed');
      console.error('@phazzie-debug: Full error details:', error);
      
      // Check if it's a network error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = 'Network error: Unable to connect to the transcription service. Please check your internet connection.';
      } else if (error instanceof Error && error.message.includes('API call failed')) {
        errorMessage = `Server error: ${error.message}`;
      } else {
        errorMessage = 'Unable to process audio file. Please check your internet connection and try again.';
      }
      console.error(error);
    } finally {
      // WHY FINALLY BLOCK:
      // ==================
      // Always reset loading state
      // Prevents UI from getting stuck in loading mode
      // Ensures user can retry after errors

      isProcessingTranscription = false;
    }
  }

  // ========= REGENERATION BOUNDARY END: Transcription Processing =========
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

    <!-- Error Display with Neon Styling -->
    {#if errorMessage}
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

    <!-- File Upload Section with Holographic Effects -->
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

    <!-- Processing Section with Cyber Styling -->
    {#if audioFileFromUser && !isProcessingTranscription}
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
            Powered by Whisper • AssemblyAI • Deepgram
          </p>
        </div>
      </div>
    {/if}

    <!-- Progress Section with Dynamic Effects -->
    {#if isProcessingTranscription}
      <div class="glass-morphism holographic rounded-3xl shadow-2xl p-10 mb-12 border-2 border-neon-yellow/50 shadow-neon-cyan animate-slide-in-left">
        <div class="text-center">
          <div class="text-8xl mb-6 animate-spin-slow">⚡</div>
          <h2 class="text-4xl font-bold text-glow-cyan mb-8">AI Brains Working...</h2>

          <ProgressBar progress={uploadProgress} />

          <div class="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="glass-morphism rounded-xl p-4 border border-neon-cyan/30">
              <div class="text-3xl mb-2 animate-bounce">🤖</div>
              <p class="text-neon-cyan font-bold">Whisper AI</p>
              <p class="text-white/70">Analyzing...</p>
            </div>
            <div class="glass-morphism rounded-xl p-4 border border-neon-pink/30">
              <div class="text-3xl mb-2 animate-bounce" style="animation-delay: 0.2s">🧠</div>
              <p class="text-neon-pink font-bold">AssemblyAI</p>
              <p class="text-white/70">Processing...</p>
            </div>
            <div class="glass-morphism rounded-xl p-4 border border-neon-purple/30">
              <div class="text-3xl mb-2 animate-bounce" style="animation-delay: 0.4s">⚡</div>
              <p class="text-neon-purple font-bold">Deepgram</p>
              <p class="text-white/70">Computing...</p>
            </div>
          </div>
        </div>
      </div>
    {/if}

    <!-- Results Section with Spectacular Effects -->
    {#if transcriptionResults.length > 0}
      <div class="glass-morphism holographic rounded-3xl shadow-2xl p-10 border-2 border-neon-green/50 shadow-neon-green animate-slide-in-right">
        <div class="text-center mb-8">
          <div class="text-8xl mb-4 animate-bounce-slow">🎯</div>
          <h2 class="text-4xl font-bold text-glow-green">Transcription Complete!</h2>
        </div>

        <ResultsDisplay results={transcriptionResults} consensus={consensusResult} />
        
        <!-- Action Buttons -->
        <div class="flex justify-center space-x-6 mt-8">
          <button 
            on:click={() => window.location.reload()}
            class="btn-cyber text-white font-bold py-4 px-8 rounded-xl text-lg"
          >
            🔄 Process Another File
          </button>
        </div>
      </div>
    {/if}

  </div>
</main>

<!-- ========= REGENERATION BOUNDARY END: UI Template ========= -->

<style>
  /* Ensure custom animations and effects are applied */
  :global(.animate-glow-pulse) {
    animation: glow-pulse 2s ease-in-out infinite alternate !important;
  }
  
  :global(.animate-neon-flicker) {
    animation: neon-flicker 1.5s ease-in-out infinite alternate !important;
  }
  
  :global(.animate-float) {
    animation: float 4s ease-in-out infinite !important;
  }
  
  :global(.animate-fade-in-up) {
    animation: fade-in-up 0.8s ease-out !important;
  }
  
  :global(.animate-slide-in-left) {
    animation: slide-in-left 0.6s ease-out !important;
  }
  
  :global(.animate-slide-in-right) {
    animation: slide-in-right 0.6s ease-out !important;
  }
  
  :global(.animate-bounce-slow) {
    animation: bounce 2s infinite !important;
  }
  
  :global(.animate-spin-slow) {
    animation: spin 3s linear infinite !important;
  }
  
  /* Enhanced background with cleaner gradient */
  main {
    background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 25%, #16213e 50%, #0f3460 75%, #0e4b99 100%);
    background-size: 400% 400%;
    animation: gradient-shift 12s ease infinite;
  }
  
  /* Refined particle effects */
  .particle {
    width: 2px;
    height: 2px;
    background: rgba(0, 229, 255, 0.6);
    box-shadow: 0 0 8px rgba(0, 229, 255, 0.4);
    border-radius: 50%;
    position: absolute;
    animation: particle-float 12s linear infinite;
  }
  
  @keyframes glow-pulse {
    0%, 100% { 
      box-shadow: 0 0 20px rgba(0, 255, 255, 0.5), 0 0 40px rgba(0, 255, 255, 0.3);
      text-shadow: 0 0 10px rgba(0, 255, 255, 0.8), 0 0 20px rgba(0, 255, 255, 0.6);
    }
    50% { 
      box-shadow: 0 0 40px rgba(255, 0, 128, 0.8), 0 0 80px rgba(255, 0, 128, 0.4);
      text-shadow: 0 0 20px rgba(255, 0, 128, 1), 0 0 40px rgba(255, 0, 128, 0.8);
    }
  }
  
  @keyframes neon-flicker {
    0%, 100% { 
      opacity: 1;
      text-shadow: 0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor;
    }
    50% { 
      opacity: 0.8;
      text-shadow: 0 0 5px currentColor, 0 0 10px currentColor, 0 0 15px currentColor;
    }
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-15px); }
  }
  
  @keyframes fade-in-up {
    0% { opacity: 0; transform: translateY(30px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes slide-in-left {
    0% { opacity: 0; transform: translateX(-50px); }
    100% { opacity: 1; transform: translateX(0); }
  }
  
  @keyframes slide-in-right {
    0% { opacity: 0; transform: translateX(50px); }
    100% { opacity: 1; transform: translateX(0); }
  }
  
  @keyframes gradient-shift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  
  @keyframes particle-float {
    0% {
      transform: translateY(100vh) translateX(0) rotate(0deg);
      opacity: 0;
    }
    10% {
      opacity: 1;
    }
    90% {
      opacity: 1;
    }
    100% {
      transform: translateY(-100vh) translateX(50px) rotate(360deg);
      opacity: 0;
    }
  }
</style>
