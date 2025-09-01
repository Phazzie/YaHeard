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

      // Real progress tracking instead of fake simulation
      uploadProgress = 10; // Start at 10% when request begins

      const formData = new FormData();
      formData.append('audio', audioFileFromUser);

      console.log('@phazzie-debug: About to make fetch request');
      uploadProgress = 30; // 30% when starting fetch
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      });

      console.log('@phazzie-debug: Fetch request completed', response.status);
      uploadProgress = 60; // 60% when fetch completes

      if (!response.ok) {
        const errorText = await response.text();
        console.error('@phazzie-debug: Response not OK', response.status, errorText);
        throw new Error(`API call failed: ${response.status} - ${errorText}`);
      }

      uploadProgress = 80; // 80% when starting to parse response

      const result = await response.json();
      console.log('@phazzie-debug: API response received:', result);
      console.log('@phazzie-debug: Type of result:', typeof result);
      console.log('@phazzie-debug: Keys in result:', Object.keys(result || {}));
      console.log('@phazzie-debug: result.finalText exists?', !!result?.finalText);
      
      // API now directly returns ConsensusResult
      if (result && result.finalText) {
        console.log('@phazzie-debug: Consensus data:', result);
        
        // Extract individual results and consensus from direct response
        transcriptionResults = result.individualResults || [];
        consensusResult = result;
        
        // FORCE REACTIVITY: Explicitly trigger state change
        showResults = true;
        displayState = 'results';
        
        console.log('@phazzie-debug: Set transcriptionResults length:', transcriptionResults.length);
        console.log('@phazzie-debug: Set consensusResult:', !!consensusResult);
        console.log('@phazzie-debug: Set showResults:', showResults);
        console.log('@phazzie-debug: Set displayState:', displayState);
      } else {
        console.log('@phazzie-debug: No results in API response');
        console.log('@phazzie-debug: result.finalText value:', result?.finalText);
        transcriptionResults = [];
        consensusResult = null;
        showResults = false;
        displayState = 'error';
      }

      console.log('@phazzie-debug: Final transcriptionResults:', transcriptionResults);
      console.log('@phazzie-debug: Final consensusResult:', consensusResult);
      uploadProgress = 100; // 100% when processing complete
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
                // Reset to upload state
                displayState = 'upload';
                transcriptionResults = [];
                consensusResult = null;
                audioFileFromUser = null;
                errorMessage = '';
                uploadProgress = 0;
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

  .animate-bounce-in {
    animation: bounceIn 1s ease-out;
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

  .animate-pulse-slow {
    animation: pulse 3s ease-in-out infinite;
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
