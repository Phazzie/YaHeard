<script lang="ts">
  import type { AIReasoning, ReasoningStep } from '../../contracts/transcription';
  import { 
    formatJsonSafely,
    withErrorBoundary,
    isLargeObject
  } from '../ui-utils';

  export let reasoning: AIReasoning | null = null;

  let showAllSteps = false;
  $: if (reasoning) {
    showAllSteps = false;
  }

  const INITIAL_STEPS_SHOWN = 5;
</script>

{#if reasoning}
  <div class="space-y-8">
    
    <!-- Final Reasoning Summary -->
    <div class="glass-morphism rounded-2xl p-6 border-2 border-cyan-400/50 bg-gradient-to-r from-cyan-500/10 to-blue-500/10">
      <div class="flex items-center space-x-3 mb-4">
        <div class="text-4xl">🧠</div>
        <h3 class="text-2xl font-bold text-cyan-400">AI Decision Summary</h3>
      </div>
      <p class="text-lg text-white/90 leading-relaxed">{withErrorBoundary(() => reasoning.finalReasoning, 'Unable to display reasoning summary', console.warn)}</p>
    </div>

    <!-- Reasoning Steps Timeline -->
    <div class="glass-morphism rounded-2xl p-6 border border-white/20">
      <div class="flex items-center space-x-3 mb-6">
        <div class="text-3xl">⚡</div>
        <h3 class="text-xl font-bold text-white">Processing Timeline</h3>
      </div>
      
      <div class="space-y-4" role="list" aria-label="AI reasoning steps">
        {#each reasoning.steps.slice(0, showAllSteps ? reasoning.steps.length : INITIAL_STEPS_SHOWN) as step}
          <div class="flex items-start space-x-4 rounded-xl p-4 border border-white/10">
            <div class="text-2xl flex-shrink-0 mt-1" aria-hidden="true">
              {#if step.description.includes('Analyzed')}
                📊
              {:else if step.description.includes('Calculated')}
                🧮
              {:else if step.description.includes('Selected')}
                🏆
              {:else}
                ➡️
              {/if}
            </div>
            <div class="flex-1">
              <div class="flex items-center space-x-2 mb-2">
                <span class="text-sm font-mono text-gray-400">Step {step.stepNumber}</span>
              </div>
              <p class="text-white/90">{withErrorBoundary(() => step.description, 'Step description unavailable', console.warn)}</p>
              {#if step.data}
                <div class="mt-2 text-sm text-gray-300 font-mono" aria-label="Step data">
                  {#if isLargeObject(step.data)}
                    <details class="mt-1">
                      <summary class="cursor-pointer text-cyan-400 hover:text-cyan-300">
                        Show detailed data ({Object.keys(step.data).length} properties)
                      </summary>
                      <div class="mt-2 p-2 bg-black/20 rounded">
                        {withErrorBoundary(() => formatJsonSafely(step.data), 'Data unavailable', console.warn)}
                      </div>
                    </details>
                  {:else}
                    {withErrorBoundary(() => formatJsonSafely(step.data), 'Data unavailable', console.warn)}
                  {/if}
                </div>
              {/if}
            </div>
          </div>
        {/each}
        
        {#if reasoning.steps.length > INITIAL_STEPS_SHOWN && !showAllSteps}
          <button 
            class="w-full py-3 px-4 glass-morphism rounded-xl border border-cyan-400/30 text-cyan-400 hover:bg-cyan-500/10 transition-all duration-200"
            on:click={() => showAllSteps = true}
            aria-label="Show {reasoning.steps.length - INITIAL_STEPS_SHOWN} more reasoning steps">
            Show {reasoning.steps.length - INITIAL_STEPS_SHOWN} More Steps ▼
          </button>
        {/if}
      </div>
    </div>

  </div>
{:else}
  <div class="text-center py-16 glass-morphism rounded-2xl border border-white/20">
    <div class="text-6xl mb-4 animate-pulse">🤔</div>
    <h3 class="text-xl font-bold text-white/80 mb-2">AI Reasoning Unavailable</h3>
    <p class="text-white/60">
      Process an audio file to see the AI thought process and decision-making logic
    </p>
  </div>
{/if}

<style>
  /* Enhanced glass morphism for AI insights */
  :global(.ai-insights) .glass-morphism {
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(25px);
    border: 1px solid rgba(255, 255, 255, 0.15);
  }
</style>