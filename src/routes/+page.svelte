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
  // @dependencies: SvelteKit form handling

  import { enhance } from '$app/forms';
  import { page } from '$app/stores';
  import { onDestroy } from 'svelte';
  import FileUpload from '$lib/components/FileUpload.svelte';
  import ResultsDisplay from '$lib/components/ResultsDisplay.svelte';
  import ProgressBar from '$lib/components/ProgressBar.svelte';

  // ========= REGENERATION BOUNDARY END: Imports =========

  onDestroy(() => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
  });

  // ========= REGENERATION BOUNDARY START: State Management =========
  // @phazzie: This section can be regenerated independently
  // @contract: Must maintain application state
  // @dependencies: SvelteKit's page store

  let audioFile: File | null = null;
  let isProcessing = false;
  let uploadStatus: 'idle' | 'uploading' | 'processing' | 'success' | 'error' = 'idle';
  let jobId: string | null = null;

  // Reactive statement to handle form submission state
  $: formError = $page.form?.error || jobStatus?.error;
  $: formResults = jobStatus?.allResults;
  $: consensus = jobStatus?.consensus;

  let jobStatus: any = null;
  let pollingInterval: number | null = null;
  const POLLING_TIMEOUT_MS = 300000; // 5 minutes

  // Reactive block to control polling based on application state
  $: {
    if (uploadStatus === 'processing' && jobId && !pollingInterval) {
      const startTime = Date.now();
      pollingInterval = setInterval(async () => {
        if (Date.now() - startTime > POLLING_TIMEOUT_MS) {
          clearInterval(pollingInterval);
          pollingInterval = null;
          uploadStatus = 'error';
          jobStatus = { error: 'Polling timed out after 5 minutes.' };
          isProcessing = false;
          return;
        }

        const response = await fetch(`/api/status/${encodeURIComponent(jobId)}`);
        const data = await response.json();

        if (data.status === 'completed' || data.status === 'failed') {
          clearInterval(pollingInterval);
          pollingInterval = null;
          jobStatus = data;
          uploadStatus = data.status === 'completed' ? 'success' : 'error';
          isProcessing = false;
        }
      }, 3000);
    } else if (uploadStatus !== 'processing' && pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
  }

  // ========= REGENERATION BOUNDARY END: State Management =========

  onDestroy(() => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
  });

  // ========= REGENERATION BOUNDARY START: File Upload Handler =========
  // @phazzie: This section can be regenerated independently
  // @contract: Must handle file upload and update state
  // @dependencies: FileUpload component

  function handleFileUploaded(event: CustomEvent) {
    try {
      audioFile = event.detail.file;
      uploadStatus = 'idle';
      jobId = null;
    } catch (error) {
      uploadStatus = 'error';
    }
  }

  // ========= REGENERATION BOUNDARY END: File Upload Handler =========
</script>

<!-- ========= REGENERATION BOUNDARY START: UI Template ========= -->
<!-- @phazzie: This section can be regenerated independently -->
<!-- @contract: Must render the main application UI -->
<!-- @dependencies: State variables and SvelteKit form handling -->

<main class="min-h-screen bg-gray-50 py-8">
  <div class="max-w-4xl mx-auto px-4">

    <!-- Header Section -->
    <div class="text-center mb-8">
      <h1 class="text-4xl font-bold text-gray-900 mb-2">
        Multi-AI Transcription Engine
      </h1>
      <p class="text-lg text-gray-600">
        Upload an audio file to get a consensus transcription from multiple AI services.
      </p>
    </div>

    <!-- Error Display -->
    {#if formError || uploadStatus === 'error'}
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
        <strong>Error:</strong> {formError || 'An unknown error occurred during upload.'}
      </div>
    {/if}

    <!-- Form for Transcription -->
    <form
      method="POST"
      action="?/default"
      enctype="multipart/form-data"
      use:enhance={({ form, data, action, cancel }) => {
        isProcessing = true;
        uploadStatus = 'uploading';

        return async ({ result, update }) => {
          if (result.type === 'success' && result.data?.uploadUrl) {
            try {
              // 1. Upload the file directly to blob storage
              const uploadResponse = await fetch(result.data.uploadUrl, {
                method: 'PUT',
                body: audioFile
              });

              if (!uploadResponse.ok) {
                throw new Error('Direct blob upload failed.');
              }

              jobId = result.data.pathname;
              uploadStatus = 'processing';

              // 2. Trigger the background processing job
              const triggerResponse = await fetch('/api/process-transcription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pathname: jobId })
              });

              if (!triggerResponse.ok) {
                throw new Error('Failed to start the background processing job.');
              }

            } catch (err) {
              // This catch block now handles failures from either the blob upload or the job trigger.
              uploadStatus = 'error';
              // Optionally set a more specific error message for the user
              jobStatus = { error: err instanceof Error ? err.message : 'An unknown error occurred.' };
            }
          } else {
             // Handle failure from the initial SvelteKit action
             uploadStatus = 'error';
          }
          await update();
          isProcessing = false;
        };
      }}
    >
      <!-- File Upload Section -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-2xl font-semibold mb-4">1. Upload Audio File</h2>
        <FileUpload on:fileUploaded={handleFileUploaded} disabled={isProcessing} name="audio" />
        {#if audioFile}
          <div class="mt-4 p-4 bg-green-50 rounded">
            <p class="text-green-800">
              ✅ File ready: {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          </div>
        {/if}
      </div>

      <!-- Processing Section -->
      {#if audioFile}
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 class="text-2xl font-semibold mb-4">2. Start Transcription</h2>
          <button
            type="submit"
            class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200 disabled:bg-gray-400"
            disabled={isProcessing || !audioFile}
          >
            {#if isProcessing}
              <span>⏳ {#if uploadStatus === 'uploading'}Uploading...{:else}Processing...{/if}</span>
            {:else}
              <span>🚀 Get Upload Link & Process</span>
            {/if}
          </button>
        </div>
      {/if}
    </form>

    <!-- Progress Section -->
    {#if isProcessing}
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-2xl font-semibold mb-4">
          {#if uploadStatus === 'uploading'}
            Uploading File...
          {:else if uploadStatus === 'processing'}
            File Uploaded! Starting AI processing...
          {:else}
            Processing...
          {/if}
        </h2>
        <ProgressBar progress={uploadStatus === 'uploading' ? 50 : 100} />
        <p class="text-gray-600 mt-2">
           {#if uploadStatus === 'uploading'}
            Your file is being uploaded directly to secure storage.
          {:else if uploadStatus === 'processing'}
            The file has been received. A background job will now start to process it with multiple AI services. You can safely close this window; we will implement status checking next.
            <br><strong>Job ID:</strong> {jobId}
          {:else}
            Please wait.
          {/if}
        </p>
      </div>
    {/if}

    <!-- Results Section -->
    {#if uploadStatus === 'success' && formResults}
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-2xl font-semibold mb-4">Transcription Results</h2>
        <ResultsDisplay results={formResults} {consensus} />
      </div>
    {/if}

  </div>
</main>

<!-- ========= REGENERATION BOUNDARY END: UI Template ========= -->