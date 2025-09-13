<script lang="ts">
  import { onMount } from 'svelte';
  import { Trophy, Target, User, Flag } from 'lucide-svelte';
  import { footballDataAPI, type FDScorer } from '../services/api/footballData';
  import { fade, fly } from 'svelte/transition';
  
  let scorers: FDScorer[] = [];
  let loading = true;
  let error = '';
  
  onMount(async () => {
    await loadTopScorers();
  });
  
  async function loadTopScorers() {
    try {
      loading = true;
      error = '';
      scorers = await footballDataAPI.getTopScorers(20);
    } catch (err) {
      error = 'Failed to load top scorers. Please try again later.';
      console.error('Error loading top scorers:', err);
    } finally {
      loading = false;
    }
  }
  
  function getPositionColor(position: number): string {
    if (position === 1) return 'from-yellow-400 to-amber-500';
    if (position === 2) return 'from-gray-300 to-gray-400';
    if (position === 3) return 'from-orange-400 to-orange-500';
    return 'from-slate-400 to-slate-500';
  }
  
  function getPositionIcon(position: number): string {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return '';
  }
</script>

<div class="max-w-7xl mx-auto">
  <!-- Header -->
  <div class="glass-card p-6 mb-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
          <Trophy class="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 class="text-2xl font-bold gradient-text">Top Scorers</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400">Premier League 2025/26 Season</p>
        </div>
      </div>
      <button 
        on:click={loadTopScorers}
        class="px-4 py-2 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
        disabled={loading}
      >
        {loading ? 'Refreshing...' : 'Refresh'}
      </button>
    </div>
  </div>
  
  {#if loading}
    <div class="flex items-center justify-center py-12">
      <div class="loading-spinner"></div>
    </div>
  {:else if error}
    <div class="glass-card p-6 text-center">
      <p class="text-red-500">{error}</p>
      <button 
        on:click={loadTopScorers}
        class="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
      >
        Try Again
      </button>
    </div>
  {:else if scorers.length > 0}
    <div class="grid gap-4">
      {#each scorers as scorer, index}
        <div 
          class="glass-card p-4 hover:shadow-xl transition-all duration-300 group"
          in:fly={{ y: 20, delay: index * 50, duration: 300 }}
        >
          <div class="flex items-center gap-4">
            <!-- Position -->
            <div class="flex-shrink-0">
              {#if index < 3}
                <div class="text-3xl">{getPositionIcon(index + 1)}</div>
              {:else}
                <div class="w-10 h-10 bg-gradient-to-br {getPositionColor(index + 1)} rounded-full flex items-center justify-center">
                  <span class="text-white font-bold">{index + 1}</span>
                </div>
              {/if}
            </div>
            
            <!-- Player Info -->
            <div class="flex-grow">
              <div class="flex items-center gap-2 mb-1">
                <h3 class="font-semibold text-lg group-hover:text-primary transition-colors">
                  {scorer.player.name}
                </h3>
                <span class="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full">
                  {scorer.player.position}
                </span>
              </div>
              <div class="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                <span class="flex items-center gap-1">
                  <img 
                    src={scorer.team.crest} 
                    alt={scorer.team.name}
                    class="w-4 h-4"
                    on:error={(e) => e.target.style.display = 'none'}
                  />
                  {scorer.team.name}
                </span>
                <span class="flex items-center gap-1">
                  <Flag class="w-3 h-3" />
                  {scorer.player.nationality}
                </span>
              </div>
            </div>
            
            <!-- Stats -->
            <div class="flex gap-6 text-center">
              <div>
                <div class="text-2xl font-bold text-primary">{scorer.goals}</div>
                <div class="text-xs text-slate-500 dark:text-slate-400">Goals</div>
              </div>
              {#if scorer.assists !== null}
                <div>
                  <div class="text-2xl font-bold text-blue-500">{scorer.assists}</div>
                  <div class="text-xs text-slate-500 dark:text-slate-400">Assists</div>
                </div>
              {/if}
              {#if scorer.penalties !== null && scorer.penalties > 0}
                <div>
                  <div class="text-2xl font-bold text-amber-500">{scorer.penalties}</div>
                  <div class="text-xs text-slate-500 dark:text-slate-400">Pens</div>
                </div>
              {/if}
            </div>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="glass-card p-8 text-center">
      <Trophy class="w-12 h-12 mx-auto mb-4 text-slate-400" />
      <p class="text-slate-500 dark:text-slate-400">No scorer data available</p>
    </div>
  {/if}
</div>

<style>
  .glass-card {
    @apply bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-xl shadow-lg border border-slate-200 dark:border-slate-700;
  }
  
  .gradient-text {
    @apply bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent;
  }
  
  .loading-spinner {
    @apply w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin;
  }
</style>