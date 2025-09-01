<script lang="ts">
  /**
   * @file AIInsights.svelte
   * @purpose Component to display AI reasoning and thought process
   * @phazzie-status working
   * @last-regenerated 2025-09-01 12:09:00 UTC
   * @dependencies transcription.ts contract, ui-utils.ts
   */

  import type { AIReasoning, ReasoningStep, DecisionFactor, ConflictResolution, ServiceQualityAssessment } from '../../contracts/transcription.js';
  import { 
    getStepIcon, 
    getStepColor, 
    getQualityColor, 
    getRecommendationColor,
    formatJsonSafely,
    formatConfidence,
    formatProcessingTime,
    withErrorBoundary,
    getQualityLabel,
    isLargeObject
  } from '../ui-utils.js';

  export let reasoning: AIReasoning | null = null;

  // Progressive disclosure state
  let showAllSteps = false;
  let showAllAssessments = false;
  
  // Lazy loading thresholds
  const INITIAL_STEPS_SHOWN = 5;
  const INITIAL_ASSESSMENTS_SHOWN = 4;
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
        {#each reasoning.steps.slice(0, showAllSteps ? reasoning.steps.length : INITIAL_STEPS_SHOWN) as step, index}
          <div class="flex items-start space-x-4 {getStepColor(step.type)} rounded-xl p-4 border" 
               role="listitem" 
               aria-label="Step {step.stepNumber}: {step.type}">
            <div class="text-2xl flex-shrink-0 mt-1" aria-hidden="true">{getStepIcon(step.type)}</div>
            <div class="flex-1">
              <div class="flex items-center space-x-2 mb-2">
                <span class="text-sm font-mono text-gray-400">Step {step.stepNumber}</span>
                <span class="px-2 py-1 text-xs rounded-full bg-white/20 text-white/80 capitalize">{step.type}</span>
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
            <div class="text-xs text-gray-400 flex-shrink-0" aria-label="Step timestamp">
              {withErrorBoundary(() => new Date(step.timestamp).toLocaleTimeString(), 'Time unavailable', console.warn)}
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

    <!-- Decision Factors -->
    <div class="glass-morphism rounded-2xl p-6 border border-white/20">
      <div class="flex items-center space-x-3 mb-6">
        <div class="text-3xl">🎯</div>
        <h3 class="text-xl font-bold text-white">Decision Factors</h3>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4" role="list" aria-label="Decision factors">
        {#each reasoning.decisionFactors as factor}
          <div class="glass-morphism rounded-xl p-4 border border-white/10" 
               role="listitem"
               aria-label="Decision factor: {factor.factor}">
               aria-label="Decision factor: {factor.factor}">
            <div class="flex items-center justify-between mb-2">
              <h4 class="font-semibold text-white">{withErrorBoundary(() => factor.factor, 'Factor name unavailable', console.warn)}</h4>
              <div class="bg-white/20 rounded-full px-2 py-1 text-xs text-white" 
                   aria-label="Weight: {(factor.weight * 100).toFixed(0)} percent">
                Weight: {withErrorBoundary(() => (factor.weight * 100).toFixed(0), '0', console.warn)}%
              </div>
            </div>
            <p class="text-sm text-white/80 mb-3">{withErrorBoundary(() => factor.impact, 'Impact description unavailable', console.warn)}</p>
            <div class="flex flex-wrap gap-2" role="list" aria-label="Favored services">
              {#each factor.favoredServices as service}
                <span class="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400 border border-green-500/30"
                      role="listitem">
                  {service}
                </span>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Conflict Resolution -->
    {#if reasoning.conflictResolution.length > 0}
      <div class="glass-morphism rounded-2xl p-6 border border-orange-400/30 bg-orange-500/5">
        <div class="flex items-center space-x-3 mb-6">
          <div class="text-3xl">⚔️</div>
          <h3 class="text-xl font-bold text-orange-400">Conflict Resolution</h3>
        </div>
        
        <div class="space-y-4">
          {#each reasoning.conflictResolution as conflict}
            <div class="glass-morphism rounded-xl p-4 border border-orange-400/20">
              <div class="mb-3">
                <h4 class="font-semibold text-orange-400 mb-1">Services in Conflict:</h4>
                <div class="flex flex-wrap gap-2">
                  {#each conflict.conflictingServices as service}
                    <span class="px-2 py-1 text-xs rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
                      {service}
                    </span>
                  {/each}
                </div>
              </div>
              
              <div class="mb-3">
                <h5 class="text-sm font-semibold text-white/90 mb-1">Conflict:</h5>
                <p class="text-sm text-white/80">{conflict.conflictDescription}</p>
              </div>
              
              <div class="mb-3">
                <h5 class="text-sm font-semibold text-white/90 mb-1">Resolution:</h5>
                <p class="text-sm text-white/80">{conflict.resolutionMethod}</p>
              </div>
              
              <div class="flex items-center justify-between">
                <div>
                  <span class="text-xs text-gray-400">Chosen:</span>
                  <span class="text-sm text-green-400 font-mono">{conflict.chosenResult}</span>
                </div>
                <div class="text-xs">
                  <span class="text-gray-400">Confidence:</span>
                  <span class="text-cyan-400">{(conflict.resolutionConfidence * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Service Quality Assessment -->
    <div class="glass-morphism rounded-2xl p-6 border border-white/20">
      <div class="flex items-center space-x-3 mb-6">
        <div class="text-3xl">📈</div>
        <h3 class="text-xl font-bold text-white">Service Performance Analysis</h3>
      </div>
      
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {#each reasoning.qualityAssessment.slice(0, showAllAssessments ? reasoning.qualityAssessment.length : INITIAL_ASSESSMENTS_SHOWN) as assessment}
          <div class="glass-morphism rounded-xl p-5 border border-white/10" 
               role="article"
               aria-label="Quality assessment for {assessment.serviceName}">
               aria-label="Quality assessment for {assessment.serviceName}">
            <div class="flex items-center justify-between mb-4">
              <h4 class="text-lg font-bold text-white">{withErrorBoundary(() => assessment.serviceName, 'Service name unavailable', console.warn)}</h4>
              <div class="flex items-center space-x-2">
                <span class="text-2xl {getQualityColor(assessment.qualityScore)}" 
                      aria-label={getQualityLabel(assessment.qualityScore)}>
                  {withErrorBoundary(() => (assessment.qualityScore * 100).toFixed(0), '0', console.warn)}%
                </span>
                <span class="px-3 py-1 text-xs rounded-full {getRecommendationColor(assessment.recommendation)} border border-current">
                  {withErrorBoundary(() => assessment.recommendation.toUpperCase(), 'UNKNOWN', console.warn)}
                </span>
              </div>
            </div>
            
            <div class="mb-4">
              <h5 class="text-sm font-semibold text-green-400 mb-2">✅ Strengths:</h5>
              <ul class="text-sm text-white/80 space-y-1" role="list">
                {#each assessment.strengths as strength}
                  <li class="flex items-start space-x-2" role="listitem">
                    <span class="text-green-400 mt-0.5" aria-hidden="true">•</span>
                    <span>{withErrorBoundary(() => strength, 'Strength unavailable', console.warn)}</span>
                  </li>
                {/each}
              </ul>
            </div>
            
            {#if assessment.weaknesses.length > 0}
              <div class="mb-4">
                <h5 class="text-sm font-semibold text-orange-400 mb-2">⚠️ Areas for Improvement:</h5>
                <ul class="text-sm text-white/80 space-y-1" role="list">
                  {#each assessment.weaknesses as weakness}
                    <li class="flex items-start space-x-2" role="listitem">
                      <span class="text-orange-400 mt-0.5" aria-hidden="true">•</span>
                      <span>{withErrorBoundary(() => weakness, 'Weakness unavailable', console.warn)}</span>
                    </li>
                  {/each}
                </ul>
              </div>
            {/if}
            
            <div class="text-sm text-white/70 italic">
              {withErrorBoundary(() => assessment.analysisNotes, 'Analysis notes unavailable', console.warn)}
            </div>
          </div>
        {/each}
        
        {#if reasoning.qualityAssessment.length > INITIAL_ASSESSMENTS_SHOWN && !showAllAssessments}
          <div class="lg:col-span-2">
            <button 
              class="w-full py-3 px-4 glass-morphism rounded-xl border border-cyan-400/30 text-cyan-400 hover:bg-cyan-500/10 transition-all duration-200"
              on:click={() => showAllAssessments = true}
              aria-label="Show {reasoning.qualityAssessment.length - INITIAL_ASSESSMENTS_SHOWN} more service assessments">
              Show {reasoning.qualityAssessment.length - INITIAL_ASSESSMENTS_SHOWN} More Services ▼
            </button>
          </div>
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