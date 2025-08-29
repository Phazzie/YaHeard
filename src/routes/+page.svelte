/**
 * @file +page.svelte
 * @purpose Main UI page for the Multi-AI Transcription Engine
 * @phazzie-status working
 * @last-regenerated 2025-01-29 13:54:37 UTC
 * @dependencies FileUpload.svelte, ResultsDisplay.svelte, ProgressBar.svelte
 */

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

  let audioFileFromUser: File | null = null;
  let isProcessingTranscription = false;
  let transcriptionResults: any[] = [];
  let uploadProgress = 0;
  let errorMessage = '';

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

      // Reset any previous errors
      errorMessage = '';

    } catch (error) {
      console.error('@phazzie-error: File upload handling failed');
      errorMessage = 'REGENERATE_NEEDED: File upload handler';
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

    if (!audioFileFromUser) {
      errorMessage = 'No file selected';
      return;
    }

    try {
      isProcessingTranscription = true;
      uploadProgress = 0;

      console.log('@phazzie-checkpoint-5: Sending file to API');

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        uploadProgress += 10;
        if (uploadProgress >= 100) {
          clearInterval(progressInterval);
        }
      }, 500);

      // Call the transcription API
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: new FormData([['audio', audioFileFromUser]])
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
      errorMessage = 'REGENERATE_NEEDED: Transcription processing';
      console.error(error);
    } finally {
      isProcessingTranscription = false;
    }
  }

  // ========= REGENERATION BOUNDARY END: Transcription Processing =========
</script>

<!-- ========= REGENERATION BOUNDARY START: UI Template ========= -->
<!-- @phazzie: This section can be regenerated independently -->
<!-- @contract: Must render the main application UI -->
<!-- @dependencies: State variables and event handlers -->

<main class="min-h-screen bg-gray-50 py-8">
  <div class="max-w-4xl mx-auto px-4">

    <!-- Header Section -->
    <div class="text-center mb-8">
      <h1 class="text-4xl font-bold text-gray-900 mb-2">
        Multi-AI Transcription Engine
      </h1>
      <p class="text-lg text-gray-600">
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
    <div class="bg-white rounded-lg shadow-md p-6 mb-6">
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
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-2xl font-semibold mb-4">Start Transcription</h2>

        <button
          on:click={startTranscriptionProcess}
          class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
          disabled={isProcessingTranscription}
        >
          🚀 Process with Multiple AI Services
        </button>
      </div>
    {/if}

    <!-- Progress Section -->
    {#if isProcessingTranscription}
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-2xl font-semibold mb-4">Processing...</h2>

        <ProgressBar progress={uploadProgress} />

        <p class="text-gray-600 mt-2">
          Processing your audio with Whisper, AssemblyAI, and Deepgram...
        </p>
      </div>
    {/if}

    <!-- Results Section -->
    {#if transcriptionResults.length > 0}
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-2xl font-semibold mb-4">Transcription Results</h2>

        <ResultsDisplay results={transcriptionResults} />
      </div>
    {/if}

  </div>
</main>

<!-- ========= REGENERATION BOUNDARY END: UI Template ========= -->