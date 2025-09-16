<script lang="ts">
  import { onMount } from 'svelte';
  import { Sparkles, TrendingUp, AlertTriangle, Zap, Eye, Download } from 'lucide-svelte';
  import { PatternDiscovery, type Pattern } from '../lib/analytics/patternDiscovery';
  import { fade, fly } from 'svelte/transition';

  let patterns: Pattern[] = [];
  let loading = true;
  let error: string | null = null;
  let selectedType: string = 'all';
  let patternDiscovery: PatternDiscovery;

  const patternTypes = [
    { value: 'all', label: 'All Patterns', icon: Sparkles },
    { value: 'upset', label: 'Upsets', icon: AlertTriangle },
    { value: 'high-scoring', label: 'High Scoring', icon: TrendingUp },
    { value: 'inefficient', label: 'Inefficient', icon: Eye },
    { value: 'comeback', label: 'Comebacks', icon: Zap },
  ];

  onMount(async () => {
    patternDiscovery = new PatternDiscovery();
    await loadPatterns();
  });

  async function loadPatterns() {
    loading = true;
    error = null;
    
    try {
      patterns = await patternDiscovery.discoverPatterns();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load patterns';
      console.error('Error loading patterns:', err);
    } finally {
      loading = false;
    }
  }

  function filterPatterns(type: string) {
    selectedType = type;
  }

  $: filteredPatterns = selectedType === 'all' 
    ? patterns 
    : patterns.filter(p => p.type === selectedType);

  function getPatternIcon(type: string) {
    const icons: Record<string, string> = {
      upset: '😱',
      'high-scoring': '⚽',
      goalless: '😴',
      comeback: '🔄',
      dominant: '💪',
      inefficient: '🎯',
      'card-fest': '🟨',
      'clean-sheet-streak': '🛡️',
      'scoring-drought': '😔',
      'home-fortress': '🏰',
      'away-specialist': '✈️'
    };
    return icons[type] || '📊';
  }

  function getSignificanceColor(significance: string) {
    switch (significance) {
      case 'very-high': return 'text-red-500 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'high': return 'text-orange-500 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
      case 'medium': return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      default: return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
  }

  function exportPatterns() {
    const dataStr = JSON.stringify(filteredPatterns, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `patterns-${Date.now()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }
</script>

<div class="max-w-7xl mx-auto">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
      <Sparkles class="w-8 h-8 text-green-500" />
      Pattern Discovery
    </h1>
    <p class="text-slate-600 dark:text-slate-400">
      Uncover unusual statistics and hidden patterns in match data
    </p>
  </div>

  <!-- Filter Tabs -->
  <div class="flex flex-wrap gap-2 mb-6">
    {#each patternTypes as type}
      <button
        on:click={() => filterPatterns(type.value)}
        class="px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2
               {selectedType === type.value 
                 ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' 
                 : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'}"
      >
        <svelte:component this={type.icon} class="w-4 h-4" />
        {type.label}
        {#if selectedType === type.value}
          <span class="text-xs bg-white/20 px-2 py-0.5 rounded-full">
            {filteredPatterns.length}
          </span>
        {/if}
      </button>
    {/each}
    
    <button
      on:click={exportPatterns}
      class="ml-auto px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-2"
    >
      <Download class="w-4 h-4" />
      Export
    </button>
  </div>

  <!-- Loading State -->
  {#if loading}
    <div class="flex items-center justify-center py-20">
      <div class="text-center">
        <div class="animate-spin text-4xl mb-4">⚡</div>
        <p class="text-slate-600 dark:text-slate-400">Discovering patterns...</p>
      </div>
    </div>
  {/if}

  <!-- Error State -->
  {#if error}
    <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6">
      <p class="font-medium">Error loading patterns:</p>
      <p class="text-sm mt-1">{error}</p>
      <button
        on:click={loadPatterns}
        class="mt-2 text-sm underline hover:no-underline"
      >
        Try again
      </button>
    </div>
  {/if}

  <!-- Patterns Grid -->
  {#if !loading && filteredPatterns.length > 0}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each filteredPatterns as pattern, i}
        <div
          in:fly="{{ y: 50, duration: 300, delay: i * 50 }}"
          class="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1"
        >
          <!-- Pattern Header -->
          <div class="p-4 border-b border-slate-200 dark:border-slate-800">
            <div class="flex items-start justify-between mb-2">
              <span class="text-2xl">{getPatternIcon(pattern.type)}</span>
              <span class="text-xs px-2 py-1 rounded-full border {getSignificanceColor(pattern.significance)}">
                {pattern.significance}
              </span>
            </div>
            <h3 class="font-semibold text-slate-900 dark:text-white line-clamp-2">
              {pattern.title}
            </h3>
          </div>

          <!-- Pattern Content -->
          <div class="p-4">
            <p class="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-3">
              {pattern.description}
            </p>

            <!-- Pattern Data Preview -->
            {#if pattern.data}
              <div class="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 mb-3">
                {#if pattern.data.home_team && pattern.data.away_team}
                  <div class="flex justify-between items-center text-sm">
                    <span class="font-medium text-slate-700 dark:text-slate-300">
                      {pattern.data.home_team}
                    </span>
                    <span class="text-lg font-bold text-green-500">
                      {pattern.data.home_score ?? 0} - {pattern.data.away_score ?? 0}
                    </span>
                    <span class="font-medium text-slate-700 dark:text-slate-300">
                      {pattern.data.away_team}
                    </span>
                  </div>
                {:else if pattern.data.avgCards}
                  <div class="text-sm text-slate-600 dark:text-slate-400">
                    <p>Avg cards: <span class="font-bold text-yellow-500">{pattern.data.avgCards.toFixed(1)}</span></p>
                    <p>Matches: {pattern.data.matches}</p>
                  </div>
                {:else if pattern.data.team}
                  <div class="text-sm text-slate-600 dark:text-slate-400">
                    <p class="font-medium">{pattern.data.team}</p>
                  </div>
                {/if}
              </div>
            {/if}

            <!-- View SQL Query -->
            {#if pattern.query}
              <button
                class="w-full text-xs text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium py-2 px-3 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                on:click={() => navigator.clipboard.writeText(pattern.query || '')}
              >
                📋 Copy SQL Query
              </button>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {:else if !loading}
    <div class="text-center py-20">
      <Sparkles class="w-12 h-12 text-slate-400 mx-auto mb-4" />
      <p class="text-slate-600 dark:text-slate-400">No patterns found</p>
    </div>
  {/if}
</div>

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  /* Matrix glow effect for significance badges */
  .text-red-500 {
    text-shadow: 0 0 10px currentColor;
  }
  
  .text-orange-500 {
    text-shadow: 0 0 8px currentColor;
  }
  
  .text-yellow-500 {
    text-shadow: 0 0 6px currentColor;
  }
</style>