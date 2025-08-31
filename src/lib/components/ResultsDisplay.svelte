<script lang="ts">
  /**
   * @file ResultsDisplay.svelte
   * @purpose Component to display transcription results and consensus
   * @phazzie-status working
   * @last-regenerated 2025-01-29 13:54:37 UTC
   * @dependencies transcription.ts contract
   */
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
    if (confidence >= 0.9) return 'text-neon-green';
    if (confidence >= 0.7) return 'text-neon-yellow';
    return 'text-neon-pink';
  }

  // ========= REGENERATION BOUNDARY END: Helper Functions =========
</script>

<!-- ========= REGENERATION BOUNDARY START: Component Template ========= -->
<!-- @phazzie: This section can be regenerated independently -->
<!-- @contract: Must render the results display UI -->
<!-- @dependencies: State variables and helper functions -->

{#if hasResults}
  <div class="space-y-8">

    <!-- Spectacular Summary Statistics -->
    <div class="glass-morphism holographic rounded-3xl p-8 border-2 border-neon-cyan/30 shadow-neon-cyan animate-fade-in-up">
      <h3 class="text-3xl font-bold text-glow-cyan mb-6 text-center animate-neon-flicker">
        🎯 Processing Summary
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="text-center glass-morphism rounded-2xl p-6 border border-neon-cyan/20">
          <div class="text-5xl font-black text-glow-cyan animate-bounce-slow">{results.length}</div>
          <div class="text-lg text-cyan-300 font-semibold mt-2">🤖 AI Services</div>
        </div>
        <div class="text-center glass-morphism rounded-2xl p-6 border border-neon-pink/20">
          <div class="text-5xl font-black text-glow-pink animate-pulse">
            {formatConfidence(averageConfidence)}
          </div>
          <div class="text-lg text-pink-300 font-semibold mt-2">🎯 Avg Confidence</div>
        </div>
        <div class="text-center glass-morphism rounded-2xl p-6 border border-neon-purple/20">
          <div class="text-5xl font-black text-glow-purple animate-float">{formatTime(totalProcessingTime)}</div>
          <div class="text-lg text-purple-300 font-semibold mt-2">⚡ Processing Time</div>
        </div>
      </div>
    </div>

    <!-- Enhanced Tab Navigation -->
    <div class="flex space-x-2 glass-morphism rounded-2xl p-2 border border-white/20">
      <button 
        class="flex-1 py-4 px-6 rounded-xl text-lg font-bold transition-all duration-300 {activeTab === 'overview' ? 'bg-gradient-to-r from-neon-cyan/20 to-neon-purple/20 text-glow-cyan border-2 border-neon-cyan/50 shadow-neon-cyan' : 'text-white/70 hover:text-white hover:bg-white/10'}" 
        on:click={() => activeTab = 'overview'}
      >
        🌟 Overview
      </button>
      <button 
        class="flex-1 py-4 px-6 rounded-xl text-lg font-bold transition-all duration-300 {activeTab === 'detailed' ? 'bg-gradient-to-r from-neon-pink/20 to-neon-purple/20 text-glow-pink border-2 border-neon-pink/50 shadow-neon-pink' : 'text-white/70 hover:text-white hover:bg-white/10'}" 
        on:click={() => activeTab = 'detailed'}
      >
        🔍 Detailed
      </button>
    </div>

    {#if activeTab === "overview"}
      <!-- Consensus Result with Spectacular Design -->
      {#if consensus}
        <div class="glass-morphism holographic rounded-3xl p-8 border-2 border-neon-green/50 shadow-neon-green animate-slide-in-left">
          <div class="text-center mb-8">
            <div class="text-8xl mb-4 animate-bounce-slow">🏆</div>
            <h3 class="text-4xl font-bold text-glow-green animate-neon-flicker">Consensus Transcription</h3>
          </div>
          
          <div class="glass-morphism rounded-2xl p-6 border border-white/20 bg-black/20">
            <p class="text-xl text-white leading-relaxed font-medium">{consensus.finalText}</p>
          </div>
          
          <div class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="glass-morphism rounded-xl p-4 text-center border border-neon-green/30">
              <div class="text-2xl font-bold text-glow-green">{formatConfidence(consensus.consensusConfidence)}</div>
              <div class="text-green-300">Confidence</div>
            </div>
            <div class="glass-morphism rounded-xl p-4 text-center border border-neon-cyan/30">
              <div class="text-2xl font-bold text-glow-cyan">{consensus.stats.servicesUsed}</div>
              <div class="text-cyan-300">Services</div>
            </div>
            <div class="glass-morphism rounded-xl p-4 text-center border border-neon-pink/30">
              <div class="text-2xl font-bold text-glow-pink">{consensus.stats.disagreementCount}</div>
              <div class="text-pink-300">Disagreements</div>
            </div>
          </div>
        </div>
      {:else}
        <div class="text-center py-16 glass-morphism rounded-3xl border-2 border-white/20 animate-fade-in-up">
          <div class="text-8xl mb-6 animate-float">🔮</div>
          <h3 class="text-3xl font-bold text-glow-purple mb-4 animate-neon-flicker">
            Building Consensus...
          </h3>
          <p class="text-xl text-white/80">
            AI services are analyzing and comparing results ✨
          </p>
        </div>
      {/if}
    {/if}

    {#if activeTab === "detailed"}
      <!-- Individual Results with Cyber Styling -->
      <div class="space-y-6">
        <h3 class="text-3xl font-bold text-glow-cyan text-center animate-neon-flicker">
          🤖 Individual AI Results
        </h3>

        {#each results as result, index (result.id)}
          <div class="glass-morphism holographic rounded-3xl p-8 border-2 border-white/20 hover:border-neon-cyan/50 shadow-xl hover:shadow-neon-cyan transition-all duration-500 animate-fade-in-up" style="animation-delay: {index * 0.2}s;">
            <div class="flex items-center justify-between mb-6">
              <div class="flex items-center space-x-4">
                <div class="text-4xl animate-spin-slow">
                  {result.serviceName === 'Whisper' ? '🎧' : result.serviceName === 'AssemblyAI' ? '🧠' : '⚡'}
                </div>
                <h4 class="text-2xl font-bold text-glow-cyan">{result.serviceName}</h4>
              </div>
              <div class="flex items-center space-x-4">
                <div class="glass-morphism rounded-xl px-4 py-2 border border-neon-green/30">
                  <span class="text-lg font-bold {getConfidenceColor(result.confidence)}">
                    {formatConfidence(result.confidence)}
                  </span>
                </div>
                <div class="glass-morphism rounded-xl px-4 py-2 border border-neon-purple/30">
                  <span class="text-lg font-bold text-glow-purple">
                    {formatTime(result.processingTimeMs)}
                  </span>
                </div>
              </div>
            </div>

            <div class="glass-morphism rounded-2xl p-6 border border-white/20 bg-black/30">
              <p class="text-xl text-white leading-relaxed">{result.text}</p>
            </div>

            {#if result.metadata}
              <div class="mt-4 glass-morphism rounded-xl p-3 border border-white/10">
                <p class="text-sm text-neon-yellow">
                  🔧 Model: <span class="font-mono text-white">{result.metadata.model || 'Unknown'}</span>
                </p>
              </div>
            {/if}
          </div>
        {/each}
      </div>

      <!-- Enhanced Export Options -->
      <div class="glass-morphism holographic rounded-3xl p-8 border-2 border-neon-purple/30 shadow-neon-purple animate-slide-in-right">
        <h3 class="text-3xl font-bold text-glow-purple mb-6 text-center animate-neon-flicker">
          💾 Export Your Results
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button class="btn-cyber text-white px-8 py-4 rounded-2xl text-lg font-bold relative overflow-hidden group">
            <span class="relative z-10">📄 Download Text</span>
          </button>
          <button class="btn-cyber text-white px-8 py-4 rounded-2xl text-lg font-bold relative overflow-hidden group">
            <span class="relative z-10">📊 Download JSON</span>
          </button>
          <button class="btn-cyber text-white px-8 py-4 rounded-2xl text-lg font-bold relative overflow-hidden group">
            <span class="relative z-10">📋 Copy Results</span>
          </button>
        </div>
      </div>
    {/if}

  </div>
{:else}
  <div class="text-center py-16 glass-morphism rounded-3xl border-2 border-white/20 animate-fade-in-up">
    <div class="text-8xl mb-6 animate-float">🎵</div>
    <h3 class="text-3xl font-bold text-glow-cyan mb-4 animate-neon-flicker">
      Ready for Audio Magic
    </h3>
    <p class="text-xl text-white/80">
      Upload an audio file above to see the AI transcription results here ✨
    </p>
  </div>
{/if}

<!-- ========= REGENERATION BOUNDARY END: Component Template ========= -->