<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Activity, Clock, AlertCircle, Tv } from 'lucide-svelte';
  import { footballDataAPI } from '../services/api/footballData';
  import type { Match } from '../types';
  import { fade, scale } from 'svelte/transition';
  
  let liveMatches: Match[] = [];
  let loading = true;
  let error = '';
  let refreshInterval: ReturnType<typeof setInterval>;
  let lastRefresh = new Date();
  
  onMount(async () => {
    await loadLiveMatches();
    // Refresh every 30 seconds for live matches
    refreshInterval = setInterval(loadLiveMatches, 30000);
  });
  
  onDestroy(() => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
  });
  
  async function loadLiveMatches() {
    try {
      error = '';
      const matches = await footballDataAPI.getLiveMatches();
      liveMatches = matches;
      lastRefresh = new Date();
    } catch (err) {
      error = 'Failed to load live matches';
      console.error('Error loading live matches:', err);
    } finally {
      loading = false;
    }
  }
  
  function getMinute(match: Match): string {
    // This would need actual minute data from the API
    // For now, return a placeholder
    return "45'";
  }
  
  function getStatusBadge(match: Match): { text: string; class: string } {
    if (!match.home_goals && !match.away_goals) {
      return { text: 'LIVE', class: 'bg-red-500 animate-pulse' };
    }
    return { text: 'IN PLAY', class: 'bg-green-500' };
  }
</script>

<div class="max-w-7xl mx-auto">
  <!-- Header -->
  <div class="glass-card p-6 mb-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center animate-pulse">
          <Tv class="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 class="text-2xl font-bold gradient-text">Live Matches</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400">
            Real-time Premier League action
          </p>
        </div>
      </div>
      <div class="flex items-center gap-4">
        <div class="text-sm text-slate-500 dark:text-slate-400">
          Last update: {lastRefresh.toLocaleTimeString()}
        </div>
        <button 
          on:click={loadLiveMatches}
          class="px-4 py-2 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
    </div>
  </div>
  
  {#if loading && liveMatches.length === 0}
    <div class="flex items-center justify-center py-12">
      <div class="loading-spinner"></div>
    </div>
  {:else if error}
    <div class="glass-card p-6 text-center">
      <AlertCircle class="w-12 h-12 mx-auto mb-4 text-red-500" />
      <p class="text-red-500">{error}</p>
      <button 
        on:click={loadLiveMatches}
        class="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
      >
        Try Again
      </button>
    </div>
  {:else if liveMatches.length > 0}
    <div class="grid gap-4">
      {#each liveMatches as match, index}
        <div 
          class="glass-card p-6 hover:shadow-xl transition-all duration-300"
          in:scale={{ delay: index * 100, duration: 300 }}
        >
          <!-- Live Badge -->
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <span class="{getStatusBadge(match).class} text-white text-xs px-2 py-1 rounded-full font-semibold">
                {getStatusBadge(match).text}
              </span>
              <span class="text-sm text-slate-600 dark:text-slate-400">
                {getMinute(match)}
              </span>
            </div>
            <Activity class="w-5 h-5 text-green-500 animate-pulse" />
          </div>
          
          <!-- Match Info -->
          <div class="grid grid-cols-3 gap-4 items-center">
            <!-- Home Team -->
            <div class="text-right">
              <div class="font-semibold text-lg">{match.home_team}</div>
              <div class="text-sm text-slate-500 dark:text-slate-400">Home</div>
            </div>
            
            <!-- Score -->
            <div class="text-center">
              <div class="text-3xl font-bold">
                <span class="text-primary">{match.home_goals ?? 0}</span>
                <span class="mx-2 text-slate-400">-</span>
                <span class="text-primary">{match.away_goals ?? 0}</span>
              </div>
            </div>
            
            <!-- Away Team -->
            <div class="text-left">
              <div class="font-semibold text-lg">{match.away_team}</div>
              <div class="text-sm text-slate-500 dark:text-slate-400">Away</div>
            </div>
          </div>
          
          <!-- Match Events (placeholder for future enhancement) -->
          <div class="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div class="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Clock class="w-4 h-4" />
              <span>Match in progress</span>
            </div>
          </div>
        </div>
      {/each}
    </div>
    
    <!-- Auto-refresh indicator -->
    <div class="mt-6 text-center">
      <p class="text-sm text-slate-500 dark:text-slate-400">
        Auto-refreshing every 30 seconds
      </p>
    </div>
  {:else}
    <div class="glass-card p-12 text-center">
      <Tv class="w-16 h-16 mx-auto mb-4 text-slate-400" />
      <h3 class="text-xl font-semibold mb-2">No Live Matches</h3>
      <p class="text-slate-500 dark:text-slate-400">
        There are no Premier League matches in play right now.
      </p>
      <p class="text-sm text-slate-400 dark:text-slate-500 mt-2">
        Check back during match times for live updates.
      </p>
    </div>
  {/if}
</div>

<style>
  .glass-card {
    @apply bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-xl shadow-lg border border-slate-200 dark:border-slate-700;
  }
  
  .gradient-text {
    @apply bg-gradient-to-r from-red-600 to-orange-600 dark:from-red-400 dark:to-orange-400 bg-clip-text text-transparent;
  }
  
  .loading-spinner {
    @apply w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin;
  }
</style>