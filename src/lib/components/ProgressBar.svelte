<!--
/**
 * @file ProgressBar.svelte
 * @purpose Reusable progress bar component
 * @phazzie-status working
 * @last-regenerated 2025-01-29 13:54:37 UTC
 * @dependencies None
 */
-->

<script lang="ts">
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
  <!-- Progress Bar -->
  <div class="w-full bg-gray-700/50 rounded-full shadow-inner {height} overflow-hidden">
    <div
      class="h-full {bgColorClass} transition-all duration-300 ease-out rounded-full shadow-lg shadow-blue-500/50"
      style="width: {progressWidth}"
    ></div>
  </div>

  <!-- Progress Text -->
  {#if showPercentage}
    <div class="flex justify-between items-center mt-2 text-sm text-gray-600">
      <span>{getStatusText(clampedProgress)}</span>
      <span class="font-medium">{clampedProgress}%</span>
    </div>
  {/if}
</div>

<!-- ========= REGENERATION BOUNDARY END: Component Template ========= -->
