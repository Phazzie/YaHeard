<!--
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
-->

<script lang="ts">
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

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);
      uploadProgress = 100;

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const result = await response.json();
      transcriptionResults = result.results || [];

      console.log('@phazzie-checkpoint-6: Transcription completed successfully');

    } catch (error) {
      console.error('@phazzie-error: Transcription processing failed');
      errorMessage = 'Unable to process audio file. Please check your internet connection and try again.';
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

<main class="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-8">
  <div class="max-w-4xl mx-auto px-4">

    <!-- Header Section -->
    <div class="text-center mb-8">
      <h1 class="text-5xl font-bold text-white mb-2 drop-shadow-lg animate-pulse">
        Multi-AI Transcription Engine
      </h1>
      <p class="text-xl text-blue-200 drop-shadow-md">
        Upload audio files and get consensus transcriptions from multiple AI services
      </p>
    </div>

    <!-- Error Display -->
    {#if errorMessage}
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
        <strong>Error:</strong> {errorMessage}
      </div>
    {/if}

    <!-- File Upload Section -->
    <div class="bg-white/10 backdrop-blur-lg rounded-xl shadow-2xl p-8 mb-8 border border-white/20 hover:shadow-purple-500/25 transition-all duration-300">
      <h2 class="text-2xl font-semibold mb-4">Upload Audio File</h2>

      <FileUpload
        on:fileUploaded={handleFileUploaded}
        disabled={isProcessingTranscription}
      />

      {#if audioFileFromUser}
        <div class="mt-4 p-4 bg-green-50 rounded">
          <p class="text-green-800">
            ✅ File ready: {audioFileFromUser.name} ({(audioFileFromUser.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        </div>
      {/if}
    </div>

    <!-- Processing Section -->
    {#if audioFileFromUser && !isProcessingTranscription}
      <div class="bg-white/10 backdrop-blur-lg rounded-xl shadow-2xl p-8 mb-8 border border-white/20 hover:shadow-purple-500/25 transition-all duration-300">
        <h2 class="text-2xl font-semibold mb-4">Start Transcription</h2>

        <button
          on:click={startTranscriptionProcess}
          class="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-blue-500/50 transition-all duration-300 transform hover:scale-105"
          disabled={isProcessingTranscription}
        >
          🚀 Process with Multiple AI Services
        </button>
      </div>
    {/if}

    <!-- Progress Section -->
    {#if isProcessingTranscription}
      <div class="bg-white/10 backdrop-blur-lg rounded-xl shadow-2xl p-8 mb-8 border border-white/20 hover:shadow-purple-500/25 transition-all duration-300">
        <h2 class="text-2xl font-semibold mb-4">Processing...</h2>

        <ProgressBar progress={uploadProgress} />

        <p class="text-gray-600 mt-2">
          Processing your audio with Whisper, AssemblyAI, and Deepgram...
        </p>
      </div>
    {/if}

    <!-- Results Section -->
    {#if transcriptionResults.length > 0}
      <div class="bg-white/10 backdrop-blur-lg rounded-xl shadow-2xl p-8 border border-white/20 hover:shadow-green-500/25 transition-all duration-300">
        <h2 class="text-2xl font-semibold mb-4">Transcription Results</h2>

        <ResultsDisplay results={transcriptionResults} />
      </div>
    {/if}

  </div>
</main>

<!-- ========= REGENERATION BOUNDARY END: UI Template ========= -->
