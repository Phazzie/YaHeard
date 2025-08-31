/**
 * @file FileUpload.svelte
 * @purpose Reusable file upload component with drag-and-drop
 * @phazzie-status working
 * @last-regenerated 2025-01-29 13:54:37 UTC
 * @dependencies file-upload.ts contract
 */

<script lang="ts">
  // ========= REGENERATION BOUNDARY START: Imports and Types =========
  // @phazzie: This section can be regenerated independently
  // @contract: Must import required types and utilities
  // @dependencies: file-upload contract

  import { createEventDispatcher } from 'svelte';
  import type { FileUploadContract, UploadResult } from '../../contracts/file-upload.js';
  import { SUPPORTED_AUDIO_FORMATS, MAX_FILE_SIZE_BYTES } from '../../contracts/transcription.js';

  // ========= REGENERATION BOUNDARY END: Imports and Types =========

  // ========= REGENERATION BOUNDARY START: Component Props =========
  // @phazzie: This section can be regenerated independently
  // @contract: Must define component interface
  // @dependencies: None

  export let disabled: boolean = false;
  export let accept: string[] = [...SUPPORTED_AUDIO_FORMATS];
  export let maxSize: number = MAX_FILE_SIZE_BYTES;

  // ========= REGENERATION BOUNDARY END: Component Props =========

  // ========= REGENERATION BOUNDARY START: State Management =========
  // @phazzie: This section can be regenerated independently
  // @contract: Must maintain component state
  // @dependencies: None

  const dispatch = createEventDispatcher<{ fileUploaded: { file: File; result: UploadResult } }>();

  let isDragOver = false;
  let selectedFile: File | null = null;
  let uploadError = '';
  let isUploading = false;

  // ========= REGENERATION BOUNDARY END: State Management =========

  // ========= REGENERATION BOUNDARY START: File Validation =========
  // @phazzie: This section can be regenerated independently
  // @contract: Must validate files according to contract
  // @dependencies: File upload contract

  function validateAudioFile(file: File): { isValid: boolean; error?: string } {
    console.log('@phazzie-checkpoint-validation-1: Validating file');

    // Check file size
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / 1024 / 1024).toFixed(1);
      const fileSizeMB = (file.size / 1024 / 1024).toFixed(1);
      return {
        isValid: false,
        error: `File too large: ${fileSizeMB}MB (max ${maxSizeMB}MB)`
      };
    }

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!accept.includes(fileExtension)) {
      return {
        isValid: false,
        error: `Unsupported format: ${fileExtension}. Supported: ${accept.join(', ')}`
      };
    }

    console.log('@phazzie-checkpoint-validation-2: File validation passed');
    return { isValid: true };
  }

  // ========= REGENERATION BOUNDARY END: File Validation =========

  // ========= REGENERATION BOUNDARY START: File Processing =========
  // @phazzie: This section can be regenerated independently
  // @contract: Must process selected/uploaded files
  // @dependencies: File validation, state management

  async function processSelectedFile(file: File) {
    console.log('@phazzie-checkpoint-upload-1: Processing selected file');

    const validation = validateAudioFile(file);
    if (!validation.isValid) {
      uploadError = validation.error || 'Invalid file';
      console.error('@phazzie-error: File validation failed');
      return;
    }

    try {
      selectedFile = file;
      uploadError = '';
      isUploading = true;

      console.log('@phazzie-checkpoint-upload-2: File validated, preparing upload');

      // Create upload result
      const uploadResult: UploadResult = {
        success: true,
        fileId: 'upload-' + Date.now(),
        readyForProcessing: true,
        metadata: {
          originalName: file.name,
          size: file.size,
          mimeType: file.type,
          extension: '.' + file.name.split('.').pop(),
          uploadedAt: new Date()
        }
      };

      console.log('@phazzie-checkpoint-upload-3: Upload result created');

      // Dispatch event to parent component
      dispatch('fileUploaded', { file, result: uploadResult });

      console.log('@phazzie-checkpoint-upload-4: File upload completed successfully');

    } catch (error) {
      console.error('@phazzie-error: File processing failed');
      uploadError = 'REGENERATE_NEEDED: File processing';
      console.error(error);
    } finally {
      isUploading = false;
    }
  }

  // ========= REGENERATION BOUNDARY END: File Processing =========

  // ========= REGENERATION BOUNDARY START: Event Handlers =========
  // @phazzie: This section can be regenerated independently
  // @contract: Must handle user interactions
  // @dependencies: File processing

  function handleFileInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (file) {
      processSelectedFile(file);
    }
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      processSelectedFile(files[0]);
    }
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    if (!disabled) {
      isDragOver = true;
    }
  }

  function handleDragLeave(event: DragEvent) {
    event.preventDefault();
    isDragOver = false;
  }

  function handleKeyDown(event: KeyboardEvent) {
    if ((event.key === 'Enter' || event.key === ' ') && !disabled && !isUploading) {
      event.preventDefault();
      document.getElementById('file-input')?.click();
    }
  }

  // ========= REGENERATION BOUNDARY END: Event Handlers =========
</script>

<!-- ========= REGENERATION BOUNDARY START: Component Template ========= -->
<!-- @phazzie: This section can be regenerated independently -->
<!-- @contract: Must render the file upload UI -->
<!-- @dependencies: State variables and event handlers -->

<div class="w-full">
  <!-- Hidden file input -->
  <input
    type="file"
    accept={accept.join(',')}
    on:change={handleFileInput}
    disabled={disabled || isUploading}
    class="hidden"
    id="file-input"
  />

  <!-- Drop zone -->
  <div
    class="border-2 border-dashed rounded-xl p-10 text-center transition-all duration-300 backdrop-blur-sm
           {isDragOver ? 'border-blue-400 bg-blue-50 shadow-lg shadow-blue-500/50' : 'border-gray-300'}
           {disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'}"
    role="button"
    tabindex="0"
    aria-label="Upload audio file - drag and drop or click to browse"
    on:drop={handleDrop}
    on:dragover={handleDragOver}
    on:dragleave={handleDragLeave}
    on:click={() => !disabled && !isUploading && document.getElementById('file-input')?.click()}
    on:keydown={handleKeyDown}
  >
    {#if isUploading}
      <div class="flex flex-col items-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
        <p class="text-gray-600">Processing file...</p>
      </div>
    {:else}
      <div class="flex flex-col items-center">
        <svg class="w-16 h-16 text-blue-300 mb-6 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
        </svg>
        <p class="text-xl font-semibold text-white mb-3 drop-shadow-lg">
          Drop your audio file here
        </p>
        <p class="text-gray-600 mb-4">
          or <button type="button" class="text-blue-600 hover:text-blue-800 underline">browse files</button>
        </p>
        <p class="text-sm text-gray-500">
          Supports: {accept.join(', ')} (max {(maxSize / 1024 / 1024).toFixed(0)}MB)
        </p>
      </div>
    {/if}
  </div>

  <!-- Error message -->
  {#if uploadError}
    <div class="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
      <strong>Upload Error:</strong> {uploadError}
    </div>
  {/if}

  <!-- Selected file info -->
  {#if selectedFile}
    <div class="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
      <strong>Selected:</strong> {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
    </div>
  {/if}
</div>

<!-- ========= REGENERATION BOUNDARY END: Component Template ========= -->
