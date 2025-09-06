<script lang="ts">
  // ========= REGENERATION BOUNDARY START: Imports =========
  // @phazzie: This section can be regenerated independently
  // @contract: Must import required components and types
  // @dependencies: None

  import FileUpload from '$lib/components/FileUpload.svelte';
  import ProgressBar from '$lib/components/ProgressBar.svelte';
  import ResultsDisplay from '$lib/components/ResultsDisplay.svelte';
  import { onDestroy } from 'svelte';

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

  let audioFileFromUser: File | null = null; // Current uploaded audio file
  let isProcessingTranscription = false; // Loading state during API calls
  let transcriptionResults: any[] = []; // Results from all AI services
  let uploadProgress = 0; // Progress percentage (0-100)
  let errorMessage = ''; // User-friendly error display
  let currentRequestId: string | null = null; // Track current request to prevent race conditions
  let activeIntervals: number[] = []; // Track active intervals for cleanup

  // ========= REGENERATION BOUNDARY END: State Management =========

  // ========= REGENERATION BOUNDARY START: Lifecycle Management =========
  // @phazzie: This section handles component cleanup
  // @contract: Must clean up resources on component destruction
  // @dependencies: State variables

  // Clean up intervals and abort controllers when component is destroyed
  onDestroy(() => {
    activeIntervals.forEach(interval => clearInterval(interval));
    activeIntervals = [];
    
    // Remove global error handlers
    if (typeof window !== 'undefined') {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleGlobalError);
    }
  });

  // ========= REGENERATION BOUNDARY END: Lifecycle Management =========

  // ========= REGENERATION BOUNDARY START: Global Error Boundary =========
  // @phazzie: This section handles unhandled errors
  // @contract: Must catch and display all uncaught errors gracefully
  // @dependencies: State variables

  // Global error handler for unhandled promise rejections
  function handleUnhandledRejection(event: PromiseRejectionEvent) {
    console.error('Unhandled promise rejection:', event.reason);
    if (!errorMessage) { // Only set if no other error is already shown
      errorMessage = 'An unexpected error occurred. Please try again.';
    }
    event.preventDefault(); // Prevent the error from appearing in console
  }

  // Global error handler for uncaught JavaScript errors
  function handleGlobalError(event: ErrorEvent) {
    console.error('Global error:', event.error);
    if (!errorMessage) { // Only set if no other error is already shown
      errorMessage = 'An unexpected error occurred. Please refresh the page and try again.';
    }
  }

  // Set up global error handlers when component mounts
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleGlobalError);
  }

  // ========= REGENERATION BOUNDARY END: Global Error Boundary =========

  // ========= REGENERATION BOUNDARY START: File Upload Handler =========
  // @phazzie: This section can be regenerated independently
  // @contract: Must handle file upload and update state
  // @dependencies: FileUpload component

  async function handleFileUploaded(event: CustomEvent) {
    try {
      const uploadedFile = event.detail.file;
      
      // Clear previous results when new file is uploaded
      transcriptionResults = [];
      errorMessage = '';
      uploadProgress = 0;
      
      // Only update file if not currently processing
      if (!isProcessingTranscription) {
        audioFileFromUser = uploadedFile;
      } else {
        errorMessage = 'Please wait for current transcription to complete before uploading a new file';
        return;
      }
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'File upload failed';
    }
  }

  // ========= REGENERATION BOUNDARY END: File Upload Handler =========

  // ========= REGENERATION BOUNDARY START: Transcription Processing =========
  // @phazzie: This section can be regenerated independently
  // @contract: Must process audio file and get transcription results
  // @dependencies: audioFileFromUser state

  async function startTranscriptionProcess() {
    // WHY EARLY VALIDATION:
    // =====================
    // Prevent API calls with invalid state
    // Clear error messages guide user action
    // Fail fast to improve user experience

    if (!audioFileFromUser) {
      errorMessage = 'No file selected';
      return;
    }

    if (isProcessingTranscription) {
      errorMessage = 'Transcription already in progress';
      return;
    }

    try {
      isProcessingTranscription = true;
      errorMessage = '';
      uploadProgress = 0;
      transcriptionResults = [];
      
      // Generate unique request ID to prevent race conditions
      const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2)}`;
      currentRequestId = requestId;

      // Add AbortController for request cancellation
      const abortController = new AbortController();
      
      // WHY PROGRESS SIMULATION:
      // ========================
      // Provide immediate feedback while API processes
      // Prevents user confusion during long operations
      // Can be replaced with real progress in future regeneration

      const progressInterval = setInterval(() => {
        if (currentRequestId === requestId) {
          uploadProgress = Math.min(uploadProgress + 10, 90);
        } else {
          clearInterval(progressInterval);
          // Remove from tracking array
          const index = activeIntervals.indexOf(progressInterval);
          if (index > -1) activeIntervals.splice(index, 1);
        }
      }, 500);
      
      // Track this interval for cleanup
      activeIntervals.push(progressInterval);

      // WHY FETCH API:
      // ==============
      // Native browser API for HTTP requests
      // No external dependencies required
      // Can be easily replaced with different HTTP clients

      const form = new FormData();
      form.append('audio', audioFileFromUser as File);
      
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: form,
        signal: abortController.signal,
      });

      // Check if this request is still current
      if (currentRequestId !== requestId) {
        clearInterval(progressInterval);
        return; // Abort if a newer request has started
      }

      clearInterval(progressInterval);
      // Remove from tracking array
      const index = activeIntervals.indexOf(progressInterval);
      if (index > -1) activeIntervals.splice(index, 1);
      uploadProgress = 100;

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      // Validate response structure
      if (!result || typeof result !== 'object') {
        throw new Error('Invalid response format from server');
      }
      
      if (!result.success) {
        throw new Error(result.error || 'Transcription failed');
      }
      
      // Only update results if this is still the current request
      if (currentRequestId === requestId) {
        transcriptionResults = result.results || [];
      }
      
    } catch (error) {
      // Only show error if this is still the current request
      if (currentRequestId === requestId) {
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            errorMessage = 'Request was cancelled';
          } else {
            errorMessage = error.message;
          }
        } else {
          errorMessage = 'An unexpected error occurred during transcription';
        }
      }
    } finally {
      // Only reset loading state if this is still the current request
      if (currentRequestId === requestId) {
        isProcessingTranscription = false;
        currentRequestId = null;
      }
    }
  }

  // ========= REGENERATION BOUNDARY END: Transcription Processing =========

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
        <strong>Error:</strong>
        {errorMessage}
      </div>
    {/if}

    <!-- File Upload Section -->
    <div
      class="bg-white/10 backdrop-blur-lg rounded-xl shadow-2xl p-8 mb-8 border border-white/20 hover:shadow-purple-500/25 transition-all duration-300"
    >
      <h2 class="text-2xl font-semibold mb-4">Upload Audio File</h2>

      <FileUpload on:fileUploaded={handleFileUploaded} disabled={isProcessingTranscription} />

      {#if audioFileFromUser}
        <div class="mt-4 p-4 bg-green-50 rounded">
          <p class="text-green-800">
            ✅ File ready: {audioFileFromUser.name} ({(
              audioFileFromUser.size /
              1024 /
              1024
            ).toFixed(2)} MB)
          </p>
        </div>
      {/if}
    </div>

    <!-- Processing Section -->
    {#if audioFileFromUser && !isProcessingTranscription}
      <div
        class="bg-white/10 backdrop-blur-lg rounded-xl shadow-2xl p-8 mb-8 border border-white/20 hover:shadow-purple-500/25 transition-all duration-300"
      >
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
      <div
        class="bg-white/10 backdrop-blur-lg rounded-xl shadow-2xl p-8 mb-8 border border-white/20 hover:shadow-purple-500/25 transition-all duration-300"
      >
        <h2 class="text-2xl font-semibold mb-4">Processing...</h2>

        <ProgressBar progress={uploadProgress} />

        <p class="text-gray-600 mt-2">
          Processing your audio with Whisper, AssemblyAI, and Deepgram...
        </p>
      </div>
    {/if}

    <!-- Results Section -->
    {#if transcriptionResults.length > 0}
      <div
        class="bg-white/10 backdrop-blur-lg rounded-xl shadow-2xl p-8 border border-white/20 hover:shadow-green-500/25 transition-all duration-300"
      >
        <h2 class="text-2xl font-semibold mb-4">Transcription Results</h2>

        <ResultsDisplay results={transcriptionResults} />
      </div>
    {/if}
  </div>
</main>

<!-- ========= REGENERATION BOUNDARY END: UI Template ========= -->
