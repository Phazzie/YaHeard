<script lang="ts">
  /**
   * @file AIInsights.svelte
   * @purpose Component to display AI reasoning and thought process
   * @phazzie-status working
   * @last-regenerated 2025-01-29 20:00:00 UTC
   * @dependencies transcription.ts contract
   */

  import type { AIReasoning, ReasoningStep, DecisionFactor, ConflictResolution, ServiceQualityAssessment } from '../../contracts/transcription.js';

  export let reasoning: AIReasoning | null = null;

  function getStepIcon(type: string): string {
    switch (type) {
      case 'analysis': return '🔍';
      case 'comparison': return '⚖️';
      case 'weighting': return '📊';
      case 'decision': return '🎯';
      case 'validation': return '✅';
      default: return '🤖';
    }
  }

  function getStepColor(type: string): string {
    switch (type) {
      case 'analysis': return 'border-blue-400/50 bg-blue-500/10';
      case 'comparison': return 'border-yellow-400/50 bg-yellow-500/10';
      case 'weighting': return 'border-purple-400/50 bg-purple-500/10';
      case 'decision': return 'border-green-400/50 bg-green-500/10';
      case 'validation': return 'border-cyan-400/50 bg-cyan-500/10';
      default: return 'border-white/30 bg-white/10';
    }
  }

  function getQualityColor(score: number): string {
    if (score >= 0.9) return 'text-green-400';
    if (score >= 0.7) return 'text-yellow-400';
    if (score >= 0.5) return 'text-orange-400';
    return 'text-red-400';
  }

  function getRecommendationColor(recommendation: string): string {
    switch (recommendation) {
      case 'preferred': return 'text-green-400 bg-green-500/20';
      case 'acceptable': return 'text-yellow-400 bg-yellow-500/20';
      case 'avoid': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  }
</script>

{#if reasoning}
  <div class="space-y-8">
    
    <!-- Final Reasoning Summary -->
    <div class="glass-morphism rounded-2xl p-6 border-2 border-cyan-400/50 bg-gradient-to-r from-cyan-500/10 to-blue-500/10">
      <div class="flex items-center space-x-3 mb-4">
        <div class="text-4xl">🧠</div>
        <h3 class="text-2xl font-bold text-cyan-400">AI Decision Summary</h3>
      </div>
      <p class="text-lg text-white/90 leading-relaxed">{reasoning.finalReasoning}</p>
    </div>

    <!-- Reasoning Steps Timeline -->
    <div class="glass-morphism rounded-2xl p-6 border border-white/20">
      <div class="flex items-center space-x-3 mb-6">
        <div class="text-3xl">⚡</div>
        <h3 class="text-xl font-bold text-white">Processing Timeline</h3>
      </div>
      
      <div class="space-y-4">
        {#each reasoning.steps as step, index}
          <div class="flex items-start space-x-4 {getStepColor(step.type)} rounded-xl p-4 border">
            <div class="text-2xl flex-shrink-0 mt-1">{getStepIcon(step.type)}</div>
            <div class="flex-1">
              <div class="flex items-center space-x-2 mb-2">
                <span class="text-sm font-mono text-gray-400">Step {step.stepNumber}</span>
                <span class="px-2 py-1 text-xs rounded-full bg-white/20 text-white/80 capitalize">{step.type}</span>
              </div>
              <p class="text-white/90">{step.description}</p>
              {#if step.data}
                <div class="mt-2 text-sm text-gray-300 font-mono">
                  {JSON.stringify(step.data, null, 2)}
                </div>
              {/if}
            </div>
            <div class="text-xs text-gray-400 flex-shrink-0">
              {new Date(step.timestamp).toLocaleTimeString()}
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Decision Factors -->
    <div class="glass-morphism rounded-2xl p-6 border border-white/20">
      <div class="flex items-center space-x-3 mb-6">
        <div class="text-3xl">🎯</div>
        <h3 class="text-xl font-bold text-white">Decision Factors</h3>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        {#each reasoning.decisionFactors as factor}
          <div class="glass-morphism rounded-xl p-4 border border-white/10">
            <div class="flex items-center justify-between mb-2">
              <h4 class="font-semibold text-white">{factor.factor}</h4>
              <div class="bg-white/20 rounded-full px-2 py-1 text-xs text-white">
                Weight: {(factor.weight * 100).toFixed(0)}%
              </div>
            </div>
            <p class="text-sm text-white/80 mb-3">{factor.impact}</p>
            <div class="flex flex-wrap gap-2">
              {#each factor.favoredServices as service}
                <span class="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
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
        {#each reasoning.qualityAssessment as assessment}
          <div class="glass-morphism rounded-xl p-5 border border-white/10">
            <div class="flex items-center justify-between mb-4">
              <h4 class="text-lg font-bold text-white">{assessment.serviceName}</h4>
              <div class="flex items-center space-x-2">
                <span class="text-2xl {getQualityColor(assessment.qualityScore)}">
                  {(assessment.qualityScore * 100).toFixed(0)}%
                </span>
                <span class="px-3 py-1 text-xs rounded-full {getRecommendationColor(assessment.recommendation)} border border-current">
                  {assessment.recommendation.toUpperCase()}
                </span>
              </div>
            </div>
            
            <div class="mb-4">
              <h5 class="text-sm font-semibold text-green-400 mb-2">✅ Strengths:</h5>
              <ul class="text-sm text-white/80 space-y-1">
                {#each assessment.strengths as strength}
                  <li class="flex items-start space-x-2">
                    <span class="text-green-400 mt-0.5">•</span>
                    <span>{strength}</span>
                  </li>
                {/each}
              </ul>
            </div>
            
            {#if assessment.weaknesses.length > 0}
              <div class="mb-4">
                <h5 class="text-sm font-semibold text-orange-400 mb-2">⚠️ Areas for Improvement:</h5>
                <ul class="text-sm text-white/80 space-y-1">
                  {#each assessment.weaknesses as weakness}
                    <li class="flex items-start space-x-2">
                      <span class="text-orange-400 mt-0.5">•</span>
                      <span>{weakness}</span>
                    </li>
                  {/each}
                </ul>
              </div>
            {/if}
            
            <div class="text-sm text-white/70 italic">
              {assessment.analysisNotes}
            </div>
          </div>
        {/each}
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