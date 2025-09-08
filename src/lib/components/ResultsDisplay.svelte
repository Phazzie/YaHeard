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
    if (confidence === undefined) return 'text-slate-400';
    if (confidence >= 0.9) return 'text-green-400';
    if (confidence >= 0.7) return 'text-yellow-400';
    return 'text-red-400';
  }

  function getServiceIcon(serviceName: string): string {
    if (serviceName.includes('Whisper')) return '🤫';
    if (serviceName.includes('Assembly')) return '🏗️';
    if (serviceName.includes('Deepgram')) return '🗣️';
    if (serviceName.includes('Gemini')) return '💎';
    if (serviceName.includes('ElevenLabs')) return '🧪';
    return '🤖';
  }

  function downloadAllRaw() {
    let allText = '';
    for (const result of results) {
      allText += `--- ${result.serviceName} ---\n`;
      allText += `${result.text}\n\n`;
    }
    download('all_raw_transcriptions.txt', allText, 'text/plain');
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
    <div class="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
      <h3 class="text-lg font-bold text-white mb-4 text-center">Summary</h3>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
        <div>
          <div class="text-3xl font-bold text-indigo-400">{results.length}</div>
          <div class="text-sm text-slate-400">AI Services</div>
        </div>
        <div>
          <div class="text-3xl font-bold text-indigo-400">{formatConfidence(averageConfidence)}</div>
          <div class="text-sm text-slate-400">Avg. Confidence</div>
        </div>
        <div>
          <div class="text-3xl font-bold text-indigo-400">{formatTime(totalProcessingTime)}</div>
          <div class="text-sm text-slate-400">Processing Time</div>
        </div>
      </div>
    </div>

  <!-- Tab Navigation -->
    <div class="flex space-x-1 bg-slate-700/50 rounded-lg p-1 border border-slate-600">
      {#each ['overview', 'detailed', 'raw', 'insights'] as tab}
        <button
          class="flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors capitalize"
          class:bg-indigo-600={activeTab === tab}
          class:text-white={activeTab === tab}
          class:text-slate-300={activeTab !== tab}
          class:hover:bg-slate-600={activeTab !== tab}
          on:click={() => activeTab = tab}
        >
          {tab}
        </button>
      {/each}
    </div>

    <div class="mt-6">
    {#if activeTab === "overview"}
      <!-- Consensus Result -->
      {#if consensus}
        <div class="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <h3 class="text-2xl font-bold text-white mb-4 text-center">Consensus Transcription</h3>

          <div class="bg-slate-900/70 rounded-lg p-4">
            <div class="flex items-center justify-between mb-3 text-xs text-slate-400">
              <div>
                <span class="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span> High
                <span class="inline-block w-2 h-2 rounded-full bg-yellow-500 mr-1 ml-2"></span> Med
                <span class="inline-block w-2 h-2 rounded-full bg-red-500 mr-1 ml-2"></span> Low
              </div>
              <label class="flex items-center gap-2">
                <input type="checkbox" bind:checked={showHighlights} class="form-checkbox bg-slate-700 border-slate-600" /> Show highlights
              </label>
            </div>
            {#if showHighlights}
              <p class="text-lg text-slate-200 leading-relaxed">
                {#each highlightTokens as tok, idx}
                  {#if typeof trueTokenConfidence[idx] === 'number'}
                    <span class={tokenClass(trueTokenConfidence[idx])} title={`Confidence: ${(trueTokenConfidence[idx]*100).toFixed(0)}%`}>{tok}</span>{idx < highlightTokens.length - 1 ? ' ' : ''}
                  {:else}
                    <span>{tok}</span>{idx < highlightTokens.length - 1 ? ' ' : ''}
                  {/if}
                {/each}
              </p>
            {:else}
              <p class="text-lg text-slate-200 leading-relaxed">{consensus.finalText}</p>
            {/if}
          </div>
        </div>
      {/if}
    {/if}

    {#if activeTab === "detailed"}
      <!-- Individual Results -->
      <div class="space-y-4">
        <h3 class="text-2xl font-bold text-white mb-4 text-center">Individual AI Results</h3>
        {#each results as result (result.id)}
          <div class="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center space-x-3">
                <div class="text-2xl">{getServiceIcon(result.serviceName)}</div>
                <h4 class="text-lg font-bold text-indigo-300">{result.serviceName}</h4>
              </div>
              {#if result.error}
                <div class="px-2 py-1 text-xs rounded-full bg-red-900/50 text-red-400">Failed</div>
              {:else}
                <div class="flex items-center space-x-4 text-sm">
                  <span class="font-medium {getConfidenceColor(result.confidence)}">
                    {formatConfidence(result.confidence)}
                  </span>
                  <span class="text-slate-400">{formatTime(result.processingTimeMs)}</span>
                </div>
              {/if}
            </div>
            <div class="bg-slate-900/70 rounded-lg p-4 text-slate-200">
              {#if result.error}
                <p class="font-mono text-sm text-red-400">{result.error}</p>
              {:else}
                <p>{result.text}</p>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/if}

    {#if activeTab === "raw"}
      <div class="space-y-4">
        <h3 class="text-2xl font-bold text-white mb-4 text-center">Raw Transcriptions</h3>
        <div class="bg-slate-900/70 rounded-lg p-4 font-mono text-sm text-slate-300 whitespace-pre-wrap">
          {#each results as result}
<span class="font-bold text-indigo-400">--- {result.serviceName} ---</span>
{result.text}

          {/each}
        </div>
      </div>
    {/if}

    {#if activeTab === "insights"}
      <!-- AI Insights -->
      <div class="ai-insights">
        <AIInsights reasoning={consensus?.reasoning || null} />
      </div>
    {/if}
    </div>

    <!-- Export Buttons -->
    <div class="mt-8 pt-6 border-t border-slate-700 flex justify-center flex-wrap gap-4">
      <button class="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg text-sm transition" on:click={downloadText}>
        📄 Download Consensus
      </button>
      <button class="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg text-sm transition" on:click={downloadJson}>
        📊 Download JSON
      </button>
       <button class="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg text-sm transition" on:click={downloadAllRaw}>
        📝 Download All Raw
      </button>
      <button class="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg text-sm transition" on:click={copyResults}>
        📋 Copy JSON
      </button>
    </div>

  </div>
{:else}
  <div class="text-center py-16">
    <div class="text-5xl mb-4">🎵</div>
    <h3 class="text-2xl font-bold text-white mb-2">Ready for Audio</h3>
    <p class="text-slate-400">Upload an audio file to begin.</p>
  </div>
{/if}

<!-- ========= REGENERATION BOUNDARY END: Component Template ========= -->