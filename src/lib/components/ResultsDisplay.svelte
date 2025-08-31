<!--
/**
 * @file ResultsDisplay.svelte
 * @purpose Component to display transcription results and consensus
 * @phazzie-status working
 * @last-regenerated 2025-01-29 13:54:37 UTC
 * @dependencies transcription.ts contract
 */
-->

<script lang="ts">
  // ========= REGENERATION BOUNDARY START: Imports and Types =========
  // @phazzie: This section can be regenerated independently
  // @contract: Must import required types
  // @dependencies: transcription contract

  import type { TranscriptionResult, ConsensusResult } from '../../contracts/transcription.js';

  // ========= REGENERATION BOUNDARY END: Imports and Types =========

  // ========= REGENERATION BOUNDARY START: Component Props =========
  // @phazzie: This section can be regenerated independently
  // @contract: Must define component interface
  // @dependencies: None

  export let results: TranscriptionResult[] = [];
  export let consensus: ConsensusResult | null = null;

let activeTab = 'overview';

  // ========= REGENERATION BOUNDARY END: Component Props =========

  // ========= REGENERATION BOUNDARY START: Computed Values =========
  // @phazzie: This section can be regenerated independently
  // @contract: Must calculate display values from props
  // @dependencies: Component props

  $: hasResults = results.length > 0;
  $: averageConfidence = hasResults
    ? results.reduce((sum, r) => sum + r.confidence, 0) / results.length
    : 0;
  $: totalProcessingTime = hasResults
    ? results.reduce((sum, r) => sum + r.processingTimeMs, 0)
    : 0;

  // ========= REGENERATION BOUNDARY END: Computed Values =========

  // ========= REGENERATION BOUNDARY START: Helper Functions =========
  // @phazzie: This section can be regenerated independently
  // @contract: Must provide utility functions for display
  // @dependencies: None

  function formatConfidence(confidence: number): string {
    return `${(confidence * 100).toFixed(1)}%`;
  }

  function formatTime(milliseconds: number): string {
    if (milliseconds < 1000) {
      return `${milliseconds}ms`;
    }
    return `${(milliseconds / 1000).toFixed(1)}s`;
  }

  function getConfidenceColor(confidence: number): string {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  }

  // ========= REGENERATION BOUNDARY END: Helper Functions =========
</script>

<!-- ========= REGENERATION BOUNDARY START: Component Template ========= -->
<!-- @phazzie: This section can be regenerated independently -->
<!-- @contract: Must render the results display UI -->
<!-- @dependencies: State variables and helper functions -->

{#if hasResults}
  <div class="space-y-6">

    <!-- Summary Statistics -->
    <div class="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 shadow-xl">
      <h3 class="text-lg font-semibold mb-3">Processing Summary</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="text-center">
          <div class="text-2xl font-bold text-blue-600">{results.length}</div>
          <div class="text-sm text-gray-600">AI Services Used</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold {getConfidenceColor(averageConfidence)}">
            {formatConfidence(averageConfidence)}
          </div>
          <div class="text-sm text-gray-600">Average Confidence</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-purple-600">{formatTime(totalProcessingTime)}</div>
          <div class="text-sm text-gray-600">Total Processing Time</div>
        </div>
      </div>
    </div>

    <!-- Tab Navigation -->
    <div class='flex space-x-1 bg-white/5 backdrop-blur-lg rounded-lg p-1 border border-white/10'>
      <button class='flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 {activeTab === "overview" ? "bg-white/20 text-white shadow-lg" : "text-gray-300 hover:text-white hover:bg-white/10"}' on:click={() => activeTab = 'overview'}>� Overview</button>
      <button class='flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 {activeTab === "detailed" ? "bg-white/20 text-white shadow-lg" : "text-gray-300 hover:text-white hover:bg-white/10"}' on:click={() => activeTab = 'detailed'}>� Detailed</button>
    </div>

    {#if activeTab === "overview"}
      <!-- Consensus Result -->
    {#if consensus}
      <div class="bg-green-500/20 backdrop-blur-lg border border-green-400/50 rounded-xl p-6 shadow-lg shadow-green-500/30">
        <h3 class="text-lg font-semibold text-green-800 mb-3">🎯 Consensus Transcription</h3>
        <div class="bg-white p-4 rounded border">
          <p class="text-gray-800 leading-relaxed">{consensus.finalText}</p>
        </div>
        <div class="mt-3 flex items-center space-x-4 text-sm text-green-700">
          <span>Confidence: <strong>{formatConfidence(consensus.consensusConfidence)}</strong></span>
          <span>Services: <strong>{consensus.stats.servicesUsed}</strong></span>
          <span>Disagreements: <strong>{consensus.stats.disagreementCount}</strong></span>
        </div>
      </div>
    {/if}
    {/if}

    {#if activeTab === "detailed"}
      <!-- Individual Results -->
    <div class="space-y-4">
      <h3 class="text-lg font-semibold">Individual AI Results</h3>

      {#each results as result (result.id)}
        <div class="bg-white/10 backdrop-blur-lg border border-white/30 rounded-xl p-6 shadow-lg hover:shadow-purple-500/25 transition-all duration-300">
          <div class="flex items-center justify-between mb-3">
            <h4 class="font-medium text-gray-900">{result.serviceName}</h4>
            <div class="flex items-center space-x-2">
              <span class="text-sm {getConfidenceColor(result.confidence)}">
                {formatConfidence(result.confidence)}
              </span>
              <span class="text-sm text-gray-500">
                {formatTime(result.processingTimeMs)}
              </span>
            </div>
          </div>

          <div class="bg-gray-50 p-3 rounded">
            <p class="text-gray-800 leading-relaxed">{result.text}</p>
          </div>

          {#if result.metadata}
            <div class="mt-2 text-xs text-gray-500">
              Model: {result.metadata.model || 'Unknown'}
            </div>
          {/if}
        </div>
      {/each}
    </div>

    <!-- Export Options -->
    <div class="bg-blue-500/20 backdrop-blur-lg border border-blue-400/50 rounded-xl p-6 shadow-lg shadow-blue-500/30">
      <h3 class="text-lg font-semibold text-blue-800 mb-3">Export Options</h3>
      <div class="flex flex-wrap gap-2">
        <button class="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg text-sm font-semibold shadow-lg hover:shadow-blue-500/50 transition-all duration-300 transform hover:scale-105">
          📄 Download as Text
        </button>
        <button class="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg text-sm font-semibold shadow-lg hover:shadow-blue-500/50 transition-all duration-300 transform hover:scale-105">
          📊 Download as JSON
        </button>
        <button class="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg text-sm font-semibold shadow-lg hover:shadow-blue-500/50 transition-all duration-300 transform hover:scale-105">
          📋 Copy to Clipboard
        </button>
      </div>
    </div>

    {/if}

  </div>
{:else}
  <div class="text-center py-8 text-gray-500">
    <p>No transcription results yet. Upload an audio file and start processing.</p>
  </div>
{/if}

<!-- ========= REGENERATION BOUNDARY END: Component Template ========= -->
