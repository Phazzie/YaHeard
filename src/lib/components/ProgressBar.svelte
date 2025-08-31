<script lang="ts">
  /**
   * @file ProgressBar.svelte
   * @purpose Reusable progress bar component
   * @phazzie-status working
   * @last-regenerated 2025-01-29 13:54:37 UTC
   * @dependencies None
   */
  // ========= REGENERATION BOUNDARY START: Component Props =========
  // @phazzie: This section can be regenerated independently
  // @contract: Must define component interface
  // @dependencies: None

  export let progress: number = 0; // 0-100
  export let showPercentage: boolean = true;
  export let color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' = 'blue';
  export let height: string = 'h-2';

  // ========= REGENERATION BOUNDARY END: Component Props =========

  // ========= REGENERATION BOUNDARY START: Computed Values =========
  // @phazzie: This section can be regenerated independently
  // @contract: Must calculate display values
  // @dependencies: Component props

  $: clampedProgress = Math.max(0, Math.min(100, progress));
  $: progressWidth = `${clampedProgress}%`;

  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    yellow: 'bg-yellow-600',
    red: 'bg-red-600',
    purple: 'bg-purple-600'
  };

  $: bgColorClass = colorClasses[color] || colorClasses.blue;

  // ========= REGENERATION BOUNDARY END: Computed Values =========

  // ========= REGENERATION BOUNDARY START: Helper Functions =========
  // @phazzie: This section can be regenerated independently
  // @contract: Must provide utility functions
  // @dependencies: None

  function getStatusText(progress: number): string {
    if (progress < 25) return 'Starting...';
    if (progress < 50) return 'Processing...';
    if (progress < 75) return 'Almost done...';
    if (progress < 100) return 'Finalizing...';
    return 'Complete!';
  }

  // ========= REGENERATION BOUNDARY END: Helper Functions =========
</script>

<!-- ========= REGENERATION BOUNDARY START: Component Template ========= -->
<!-- @phazzie: This section can be regenerated independently -->
<!-- @contract: Must render the progress bar UI -->
<!-- @dependencies: Computed values and helper functions -->

<div class="w-full">
  <!-- Enhanced Progress Bar with Neon Effects -->
  <div class="relative">
    <!-- Background Track with Glow -->
    <div class="w-full h-6 bg-black/50 rounded-full shadow-inner border-2 border-white/10 overflow-hidden">
      <!-- Animated Progress Fill -->
      <div
        class="h-full bg-gradient-to-r from-neon-cyan via-neon-pink to-neon-purple transition-all duration-500 ease-out rounded-full relative overflow-hidden"
        style="width: {progressWidth}"
      >
        <!-- Shimmer Effect -->
        <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
        
        <!-- Pulsing Glow -->
        <div class="absolute inset-0 bg-gradient-to-r from-neon-cyan/50 via-neon-pink/50 to-neon-purple/50 animate-glow-pulse rounded-full"></div>
      </div>
      
      <!-- Progress Indicator Dot -->
      <div 
        class="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-neon-cyan border-2 border-neon-cyan animate-bounce-slow"
        style="left: calc({progressWidth} - 8px); transition: left 0.5s ease-out;"
      ></div>
    </div>
    
    <!-- Floating Status Particles -->
    <div class="absolute -top-2 left-0 w-full h-full pointer-events-none">
      {#each Array(5) as _, i}
        <div 
          class="absolute w-1 h-1 bg-neon-cyan rounded-full animate-float opacity-60"
          style="left: {(clampedProgress / 100) * 80 + Math.random() * 20}%; animation-delay: {i * 0.3}s; animation-duration: {2 + Math.random()}s;"
        ></div>
      {/each}
    </div>
  </div>

  <!-- Enhanced Progress Text with Glowing Effects -->
  {#if showPercentage}
    <div class="flex justify-between items-center mt-6">
      <div class="glass-morphism rounded-xl px-4 py-2 border border-neon-cyan/30">
        <span class="text-xl font-bold text-glow-cyan animate-neon-flicker">
          {getStatusText(clampedProgress)}
        </span>
      </div>
      
      <div class="glass-morphism rounded-xl px-4 py-2 border border-neon-purple/30">
        <span class="text-2xl font-black text-glow-purple">
          {clampedProgress}%
        </span>
      </div>
    </div>
    
    <!-- Progress Milestones -->
    <div class="flex justify-between mt-4 text-sm">
      <span class="text-white/60 {clampedProgress >= 25 ? 'text-neon-green font-bold' : ''}">
        🚀 Starting
      </span>
      <span class="text-white/60 {clampedProgress >= 50 ? 'text-neon-cyan font-bold' : ''}">
        🧠 Processing
      </span>
      <span class="text-white/60 {clampedProgress >= 75 ? 'text-neon-pink font-bold' : ''}">
        ⚡ Finalizing
      </span>
      <span class="text-white/60 {clampedProgress >= 100 ? 'text-neon-purple font-bold animate-bounce' : ''}">
        ✨ Complete
      </span>
    </div>
  {/if}
</div>

<style>
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  
  .animate-shimmer {
    animation: shimmer 2s ease-in-out infinite;
  }
</style>

<!-- ========= REGENERATION BOUNDARY END: Component Template ========= -->
