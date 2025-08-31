<script lang="ts">
  /**
   * @file FileUpload.svelte
   * @purpose Reusable file upload component with drag-and-drop
   * @phazzie-status working
   * @last-regenerated 2025-01-29 13:54:37 UTC
   * @dependencies file-upload.ts contract
   */
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
      uploadError = 'Unable to process the selected file. Please try a different audio file.';
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

  <!-- Enhanced Drop Zone with Spectacular Effects -->
  <div
    class="upload-zone-enhanced rounded-3xl p-16 text-center transition-all duration-500 backdrop-blur-xl 
           {isDragOver ? 'scale-105 shadow-neon-pink' : ''}
           {disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-neon-cyan'}"
    class:drag-over={isDragOver}
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
        <div class="relative">
          <div class="w-16 h-16 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin mb-6"></div>
          <div class="absolute inset-0 w-16 h-16 border-4 border-neon-pink border-b-transparent rounded-full animate-spin mb-6" style="animation-direction: reverse; animation-delay: 0.3s;"></div>
        </div>
        <p class="text-2xl font-bold text-glow-cyan animate-pulse">🔮 Processing your file...</p>
        <p class="text-lg text-white/70 mt-2">The magic is happening ✨</p>
      </div>
    {:else}
      <div class="flex flex-col items-center">
        <!-- Animated Cloud Icon with Glow -->
        <div class="relative mb-8">
          <svg class="w-24 h-24 text-neon-cyan animate-float drop-shadow-2xl" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
          </svg>
          <!-- Pulsing Ring Effect -->
          <div class="absolute inset-0 w-24 h-24 border-2 border-neon-cyan rounded-full animate-ping opacity-30"></div>
          <div class="absolute inset-2 w-20 h-20 border border-neon-pink rounded-full animate-ping opacity-40" style="animation-delay: 0.5s;"></div>
        </div>
        
        <p class="text-3xl font-bold text-glow-cyan mb-4 animate-neon-flicker">
          🎵 Drop Your Audio Here 🎵
        </p>
        
        <p class="text-xl text-white/90 mb-6">
          or <button type="button" class="text-neon-pink hover:text-neon-cyan underline font-bold transition-colors duration-300 animate-pulse">browse files</button>
        </p>
        
        <!-- Supported Formats with Style -->
        <div class="glass-morphism rounded-2xl p-4 border border-white/20">
          <p class="text-lg text-white/80 mb-2">
            <span class="text-neon-purple font-bold">Supported:</span>
          </p>
          <div class="flex flex-wrap justify-center gap-2 text-sm">
            {#each accept as format}
              <span class="bg-gradient-to-r from-neon-cyan/20 to-neon-purple/20 text-white px-3 py-1 rounded-full border border-neon-cyan/30 font-mono">
                {format}
              </span>
            {/each}
          </div>
          <p class="text-neon-cyan mt-2 font-bold">
            Max: {(maxSize / 1024 / 1024).toFixed(0)}MB
          </p>
        </div>
      </div>
    {/if}
  </div>

  <!-- Enhanced Error Message -->
  {#if uploadError}
    <div class="mt-6 glass-morphism rounded-2xl p-6 border-2 border-red-500/50 shadow-neon-pink animate-fade-in-up">
      <div class="flex items-center space-x-3">
        <div class="text-4xl animate-bounce">💥</div>
        <div>
          <strong class="text-red-400 text-xl">Upload Failed:</strong>
          <p class="text-red-300 text-lg mt-1">{uploadError}</p>
        </div>
      </div>
    </div>
  {/if}

  <!-- Enhanced Selected File Info -->
  {#if selectedFile}
    <div class="mt-6 glass-morphism rounded-2xl p-6 border-2 border-neon-green/50 shadow-neon-green animate-fade-in-up">
      <div class="flex items-center space-x-4">
        <div class="text-5xl animate-spin-slow">💾</div>
        <div>
          <strong class="text-neon-green text-xl">File Uploaded:</strong>
          <p class="text-green-300 text-lg mt-1">
            📁 {selectedFile.name} 
            <span class="text-neon-cyan">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
          </p>
        </div>
      </div>
    </div>
  {/if}
</div>

<!-- ========= REGENERATION BOUNDARY END: Component Template ========= -->
