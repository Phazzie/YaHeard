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
  import AIInsights from './AIInsights.svelte';

  // ========= REGENERATION BOUNDARY END: Imports and Types =========

  // ========= REGENERATION BOUNDARY START: Component Props =========
  // @phazzie: This section can be regenerated independently
  // @contract: Must define component interface
  // @dependencies: None

  export let results: TranscriptionResult[] = [];
  export let consensus: ConsensusResult | null = null;

let activeTab = 'overview';

  // Optional: disagreement highlighting toggle
  let showHighlights = true;
  let tokenAgreement: number[] = [];
  let highlightTokens: string[] = [];
  let consensusTokens: string[] = [];
  let perServiceTokens: string[][] = [];
  // True per-token confidence derived from services that provide word-level confidences (AssemblyAI, Deepgram)
  let trueTokenConfidence: number[] = [];
  let trueTokenConfidenceSources: number[] = [];
  type WordConf = { token: string; confidence?: number };
  let perServiceWordConfs: WordConf[][] = [];
  let agreementByService: { id: string; serviceName: string; agreement: number }[] = [];
  let contestedTokens: { token: string; score: number }[] = [];
  let showRawJson = false;
  let showServiceHighlights = true;
  let hideContestedInService = false;
  let maxProcessingMs = 0;

  // ========= REGENERATION BOUNDARY END: Component Props =========

  // ========= REGENERATION BOUNDARY START: Computed Values =========
  // @phazzie: This section can be regenerated independently
  // @contract: Must calculate display values from props
  // @dependencies: Component props

  $: hasResults = results.length > 0;
  $: resultsWithConfidence = results.filter(r => typeof r.confidence === 'number');
  $: averageConfidence = resultsWithConfidence.length > 0
    ? resultsWithConfidence.reduce((sum, r) => sum + (r.confidence ?? 0), 0) / resultsWithConfidence.length
    : 0;
  // Since services run in parallel, wall-clock processing time approximates the maximum of individual times
  $: totalProcessingTime = hasResults
    ? Math.max(...results.map(r => r.processingTimeMs || 0))
    : 0;

  // Token-level agreement computation for simple heatmap visualization
  // Split finalText by whitespace, then compute the percentage of services containing an exact token match at roughly the same position (lenient window)
  $: tokenAgreement = (() => {
    if (!consensus || !consensus.finalText || results.length === 0) return [];
    const tokens = consensus.finalText.split(/\s+/);
    perServiceTokens = results.map(r => r.text.split(/\s+/));
    const window = 2; // allow small positional drift
    const scores: number[] = new Array(tokens.length).fill(0);

    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      let agreeCount = 0;
      for (const service of perServiceTokens) {
        let matched = false;
        for (let j = Math.max(0, i - window); j <= Math.min(service.length - 1, i + window); j++) {
          if (service[j] === t) { matched = true; break; }
        }
        if (matched) agreeCount++;
      }
      scores[i] = agreeCount / perServiceTokens.length; // 0..1
    }
    return scores;
  })();

  $: highlightTokens = consensus?.finalText ? consensus.finalText.split(/\s+/) : [];
  $: consensusTokens = highlightTokens;

  // Extract per-service word-level confidences when available
  function normalizeToken(t: string): string {
    return t.toLowerCase().replace(/^[^\w']+|[^\w']+$/g, ''); // trim punctuation at ends
  }

  function extractWordConfs(r: TranscriptionResult): WordConf[] {
    const md: any = r.metadata || {};
    // AssemblyAI: words array with { text, confidence }
    const assemblyWords = md.rawResponse?.words;
    if (Array.isArray(assemblyWords) && assemblyWords.length > 0) {
      return assemblyWords.map((w: any) => ({ token: String(w.text ?? w.word ?? '').trim(), confidence: typeof w.confidence === 'number' ? w.confidence : undefined }));
    }
    // Deepgram: alternatives[0].words with { word, confidence }
    const dgAlt = md.rawResponse?.results?.channels?.[0]?.alternatives?.[0];
    const dgWords = dgAlt?.words;
    if (Array.isArray(dgWords) && dgWords.length > 0) {
      return dgWords.map((w: any) => ({ token: String(w.word ?? w.text ?? '').trim(), confidence: typeof w.confidence === 'number' ? w.confidence : undefined }));
    }
    // Fallback: split text, no confidences
    return (r.text || '').split(/\s+/).map((t) => ({ token: t }));
  }

  $: perServiceWordConfs = results.map(extractWordConfs);

  // Compute true per-token confidence for consensus tokens using available word confidences; fallback to agreement
  $: trueTokenConfidence = (() => {
    if (!consensus || consensusTokens.length === 0 || results.length === 0) return [];
    const window = 2;
    const scores: number[] = new Array(consensusTokens.length).fill(0);
    const sourceCounts: number[] = new Array(consensusTokens.length).fill(0);
    for (let i = 0; i < consensusTokens.length; i++) {
      const ctNorm = normalizeToken(consensusTokens[i]);
      const contribs: number[] = [];
      for (let s = 0; s < perServiceWordConfs.length; s++) {
        const svcWords = perServiceWordConfs[s];
        if (!svcWords || svcWords.length === 0) continue;
        // approximate position mapping from consensus index to service index
        const mapped = Math.floor((i * svcWords.length) / Math.max(1, consensusTokens.length));
        let found: number | undefined;
        for (let j = Math.max(0, mapped - window); j <= Math.min(svcWords.length - 1, mapped + window); j++) {
          const w = svcWords[j];
          if (normalizeToken(w.token) === ctNorm) {
            if (typeof w.confidence === 'number') {
              found = Math.max(0, Math.min(1, w.confidence));
            }
            break;
          }
        }
        if (typeof found === 'number') {
          contribs.push(found);
        }
      }
      if (contribs.length > 0) {
        const avg = contribs.reduce((a, b) => a + b, 0) / contribs.length;
        scores[i] = avg;
        sourceCounts[i] = contribs.length;
      } else {
        // fallback: use agreement score for this token if available
        scores[i] = tokenAgreement[i] ?? 0;
        sourceCounts[i] = 0;
      }
    }
    trueTokenConfidenceSources = sourceCounts;
    return scores;
  })();

  // Compute per-service agreement as the fraction of consensus tokens matched within a small window
  $: agreementByService = (() => {
    if (!consensus || !consensus.finalText || results.length === 0) return [];
    const window = 2;
    return results.map((r, idx) => {
      const service = perServiceTokens[idx] || [];
      let matches = 0;
      for (let i = 0; i < consensusTokens.length; i++) {
        const t = consensusTokens[i];
        let matched = false;
        for (let j = Math.max(0, i - window); j <= Math.min(service.length - 1, i + window); j++) {
          if (service[j] === t) { matched = true; break; }
        }
        if (matched) matches++;
      }
      const agreement = consensusTokens.length > 0 ? matches / consensusTokens.length : 0;
      return { id: r.id, serviceName: r.serviceName, agreement };
    });
  })();

  // List of most contested tokens (lowest true confidence)
  $: contestedTokens = (() => {
    if (!consensus || trueTokenConfidence.length === 0) return [];
    const pairs = consensusTokens.map((tok, i) => ({ token: tok, score: trueTokenConfidence[i] ?? 0 }));
    const filtered = pairs.filter(p => p.token && p.token.trim().length > 2);
    return filtered.sort((a, b) => a.score - b.score).slice(0, 10);
  })();

  $: maxProcessingMs = results.length ? Math.max(...results.map(r => r.processingTimeMs || 0)) : 0;

  function serviceTokenMatches(token: string, j: number, serviceTokens: string[]): boolean {
    if (!consensusTokens.length) return false;
    const window = 2;
    const mapped = Math.floor((j * consensusTokens.length) / Math.max(serviceTokens.length, 1));
    for (let i = Math.max(0, mapped - window); i <= Math.min(consensusTokens.length - 1, mapped + window); i++) {
      if (consensusTokens[i] === token) return true;
    }
    return false;
  }

  function tokenClass(score: number): string {
    if (!showHighlights) return '';
    if (score >= 0.8) return 'bg-green-600/20';
    if (score >= 0.5) return 'bg-yellow-600/20';
    return 'bg-pink-600/20';
  }

  // Export utilities
  function download(filename: string, content: string, type = 'text/plain') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function downloadText() {
    const text = consensus?.finalText ?? '';
    download('transcription.txt', text, 'text/plain');
  }

  function exportPayload() {
    return {
      finalText: consensus?.finalText ?? '',
      consensusConfidence: consensus?.consensusConfidence ?? 0,
      stats: consensus?.stats ?? {},
      disagreements: consensus?.disagreements ?? [],
      reasoning: consensus?.reasoning ?? null,
      individualResults: results
    };
  }

  function downloadJson() {
    const json = JSON.stringify(exportPayload(), null, 2);
    download('transcription.json', json, 'application/json');
  }

  async function copyResults() {
    try {
      const json = JSON.stringify(exportPayload(), null, 2);
      await navigator.clipboard.writeText(json);
    } catch (e) {
      console.warn('Clipboard write failed', e);
    }
  }

  // ========= REGENERATION BOUNDARY END: Computed Values =========

  // ========= REGENERATION BOUNDARY START: Helper Functions =========
  // @phazzie: This section can be regenerated independently
  // @contract: Must provide utility functions for display
  // @dependencies: None

  function formatConfidence(confidence: number | undefined): string {
    if (confidence === undefined) return 'N/A';
    return `${(confidence * 100).toFixed(1)}%`;
  }

  function formatTime(milliseconds: number): string {
    if (milliseconds < 1000) {
      return `${milliseconds}ms`;
    }
    return `${(milliseconds / 1000).toFixed(1)}s`;
  }

  function getConfidenceColor(confidence: number | undefined): string {
    if (confidence === undefined) return 'text-gray-500';
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

      <!-- Per-service agreement overview -->
      {#if agreementByService.length}
        <div class="mt-8">
          <h4 class="text-xl font-semibold text-white/90 mb-3">Per-service agreement with consensus</h4>
          <div class="space-y-2">
            {#each agreementByService as svc}
              <div class="flex items-center gap-3">
                <div class="w-32 text-white/80">{svc.serviceName}</div>
                <div class="flex-1 h-3 bg-white/10 rounded">
                  <div class="h-3 rounded bg-gradient-to-r from-neon-cyan to-neon-purple" style={`width: ${Math.round(svc.agreement*100)}%`}></div>
                </div>
                <div class="w-12 text-right text-white/70">{Math.round(svc.agreement*100)}%</div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>

    <!-- Enhanced Tab Navigation with AI Insights -->
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
      <button 
        class="flex-1 py-4 px-6 rounded-xl text-lg font-bold transition-all duration-300 {activeTab === 'insights' ? 'bg-gradient-to-r from-neon-purple/20 to-neon-cyan/20 text-glow-purple border-2 border-neon-purple/50 shadow-neon-purple' : 'text-white/70 hover:text-white hover:bg-white/10'}" 
        on:click={() => activeTab = 'insights'}
      >
        🧠 AI Insights
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
            <div class="flex items-center justify-between mb-3">
              <div class="text-sm text-white/70 flex items-center gap-3">
                <span class="inline-flex items-center gap-1"><span class="inline-block w-3 h-3 rounded bg-green-600/60"></span> high confidence</span>
                <span class="inline-flex items-center gap-1"><span class="inline-block w-3 h-3 rounded bg-yellow-600/60"></span> medium</span>
                <span class="inline-flex items-center gap-1"><span class="inline-block w-3 h-3 rounded bg-pink-600/60"></span> low/contested</span>
              </div>
              <label class="text-sm text-white/80 flex items-center gap-2">
                <input type="checkbox" bind:checked={showHighlights} /> Show highlights
              </label>
            </div>
            {#if showHighlights}
              <p class="text-xl text-white leading-relaxed font-medium">
                {#each highlightTokens as tok, idx}
                  {#if typeof trueTokenConfidence[idx] === 'number'}
                    <span class={tokenClass(trueTokenConfidence[idx])} title={`token confidence ${(trueTokenConfidence[idx]*100).toFixed(0)}%${trueTokenConfidenceSources[idx] > 0 ? '' : ' (from agreement)'}`}>{tok}</span>{idx < highlightTokens.length - 1 ? ' ' : ''}
                  {:else}
                    <span>{tok}</span>{idx < highlightTokens.length - 1 ? ' ' : ''}
                  {/if}
                {/each}
              </p>
            {:else}
              <p class="text-xl text-white leading-relaxed font-medium">{consensus.finalText}</p>
            {/if}
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

          <!-- Contested terms -->
          {#if contestedTokens.length}
            <div class="mt-6">
              <h4 class="text-lg font-semibold text-white/90 mb-2">Most contested terms</h4>
              <div class="flex flex-wrap gap-2">
                {#each contestedTokens as ct}
                  <span class="px-2 py-1 rounded bg-pink-700/30 text-white/90 text-sm">{ct.token} <span class="text-white/60">({Math.round((ct.score||0)*100)}%)</span></span>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Raw JSON toggle -->
          <div class="mt-6">
            <label class="text-sm text-white/80 flex items-center gap-2">
              <input type="checkbox" bind:checked={showRawJson} /> Show raw JSON
            </label>
            {#if showRawJson}
              <pre class="mt-2 p-3 bg-black/70 rounded text-white/80 text-xs overflow-auto max-h-64">{JSON.stringify(exportPayload(), null, 2)}</pre>
            {/if}
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

        <div class="flex items-center justify-center gap-6 mb-4 text-white/80 text-sm">
          <label class="flex items-center gap-2"><input type="checkbox" bind:checked={showServiceHighlights} /> Highlight tokens that align with consensus</label>
          <label class="flex items-center gap-2"><input type="checkbox" bind:checked={hideContestedInService} /> Hide contested tokens</label>
        </div>

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
              {#if showServiceHighlights}
                <p class="text-xl text-white leading-relaxed">
                  {#each (result.text.split(/\s+/)) as t, j}
                    {#if hideContestedInService}
                      {#if serviceTokenMatches(t, j, (perServiceTokens[results.findIndex(rr => rr.id===result.id)]||[]))}
                        <span class="bg-green-600/20">{t}</span>{' '}
                      {/if}
                    {:else}
                      {#if serviceTokenMatches(t, j, (perServiceTokens[results.findIndex(rr => rr.id===result.id)]||[]))}
                        <span class="bg-green-600/20">{t}</span>{' '}
                      {:else}
                        <span class="bg-pink-700/20">{t}</span>{' '}
                      {/if}
                    {/if}
                  {/each}
                </p>
              {:else}
                <p class="text-xl text-white leading-relaxed">{result.text}</p>
              {/if}
            </div>

            <div class="mt-4 flex flex-col gap-2">
              <div class="glass-morphism rounded-xl p-3 border border-white/10">
                <p class="text-sm text-neon-yellow">
                  🔧 Model: <span class="font-mono text-white">{result.metadata?.model || 'Unknown'}</span>
                </p>
              </div>
              <div class="glass-morphism rounded-xl p-3 border border-white/10">
                <div class="text-xs text-white/70 mb-1">Processing time</div>
                <div class="h-2 bg-white/10 rounded">
                  <div class="h-2 rounded bg-gradient-to-r from-neon-cyan to-neon-purple" style={`width: ${maxProcessingMs ? Math.round((result.processingTimeMs/maxProcessingMs)*100) : 0}%`}></div>
                </div>
              </div>
            </div>
          </div>
        {/each}
      </div>

      <!-- Enhanced Export Options -->
      <div class="glass-morphism holographic rounded-3xl p-8 border-2 border-neon-purple/30 shadow-neon-purple animate-slide-in-right">
        <h3 class="text-3xl font-bold text-glow-purple mb-6 text-center animate-neon-flicker">
          💾 Export Your Results
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button class="btn-cyber text-white px-8 py-4 rounded-2xl text-lg font-bold relative overflow-hidden group" on:click={downloadText}>
            <span class="relative z-10">📄 Download Text</span>
          </button>
          <button class="btn-cyber text-white px-8 py-4 rounded-2xl text-lg font-bold relative overflow-hidden group" on:click={downloadJson}>
            <span class="relative z-10">📊 Download JSON</span>
          </button>
          <button class="btn-cyber text-white px-8 py-4 rounded-2xl text-lg font-bold relative overflow-hidden group" on:click={copyResults}>
            <span class="relative z-10">📋 Copy Results</span>
          </button>
        </div>
      </div>
    {/if}

    {#if activeTab === "insights"}
      <!-- AI Insights and Thought Process -->
      <div class="ai-insights">
        <AIInsights reasoning={consensus?.reasoning || null} />
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