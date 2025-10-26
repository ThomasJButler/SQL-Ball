<!--
@author Tom Butler
@date 2025-10-26
@description Modal component for displaying SQL query results from chart insights. Shows generated
             SQL, execution results in table format, and AI-powered key insights.
-->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { X, Copy, CheckCircle, Sparkles, Database, TrendingUp } from 'lucide-svelte';

  const dispatch = createEventDispatcher();

  export let isOpen = false;
  export let chartName = '';
  export let sql = '';
  export let results: any[] = [];
  export let insights: string[] = [];
  export let isLoading = false;
  export let error: string | null = null;

  let copied = false;

  function handleClose() {
    dispatch('close');
    isOpen = false;
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      handleClose();
    }
  }

  async function copySQL() {
    try {
      await navigator.clipboard.writeText(sql);
      copied = true;
      setTimeout(() => (copied = false), 2000);
    } catch (err) {
      console.error('Failed to copy SQL:', err);
    }
  }

  // Get table columns from first result
  $: columns = results.length > 0 ? Object.keys(results[0]) : [];
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
  <!-- Modal Backdrop -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300"
    on:click={handleBackdropClick}
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
  >
    <!-- Modal Container -->
    <div
      class="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-green-500/20 m-4 transform transition-all duration-300"
    >
      <!-- Header -->
      <div class="sticky top-0 z-10 bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 rounded-t-2xl">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-white/20 rounded-lg">
              <Sparkles class="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 id="modal-title" class="text-xl font-bold text-white">
                Query Insights: {chartName}
              </h2>
              <p class="text-sm text-green-100">AI-powered SQL analysis</p>
            </div>
          </div>
          <button
            on:click={handleClose}
            class="p-2 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X class="w-6 h-6 text-white" />
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="p-6 space-y-6">
        {#if isLoading}
          <!-- Loading State -->
          <div class="flex flex-col items-center justify-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mb-4"></div>
            <p class="text-slate-600 dark:text-slate-400">Generating SQL query and fetching results...</p>
          </div>
        {:else if error}
          <!-- Error State -->
          <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/20 rounded-xl p-6">
            <div class="flex items-start gap-3">
              <div class="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <X class="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div class="flex-1">
                <h3 class="font-semibold text-red-900 dark:text-red-300 mb-1">Error</h3>
                <p class="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            </div>
          </div>
        {:else}
          <!-- SQL Section -->
          <div class="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-green-500/10">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2">
                <Database class="w-5 h-5 text-green-500" />
                <h3 class="font-semibold text-slate-800 dark:text-slate-200">Generated SQL Query</h3>
              </div>
              <button
                on:click={copySQL}
                class="flex items-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg transition-colors"
              >
                {#if copied}
                  <CheckCircle class="w-4 h-4" />
                  Copied!
                {:else}
                  <Copy class="w-4 h-4" />
                  Copy SQL
                {/if}
              </button>
            </div>
            <pre class="bg-slate-900 dark:bg-slate-950 text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono border border-slate-700"><code>{sql}</code></pre>
          </div>

          <!-- Results Table -->
          {#if results.length > 0}
            <div class="bg-white dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-green-500/10 overflow-hidden">
              <div class="px-6 py-4 border-b border-slate-200 dark:border-green-500/10">
                <div class="flex items-center gap-2">
                  <TrendingUp class="w-5 h-5 text-green-500" />
                  <h3 class="font-semibold text-slate-800 dark:text-slate-200">
                    Query Results ({results.length} rows)
                  </h3>
                </div>
              </div>
              <div class="overflow-x-auto max-h-96">
                <table class="w-full">
                  <thead class="bg-slate-100 dark:bg-slate-800/50 sticky top-0">
                    <tr>
                      {#each columns as column}
                        <th class="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          {column}
                        </th>
                      {/each}
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-200 dark:divide-slate-700">
                    {#each results as row, i}
                      <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        {#each columns as column}
                          <td class="px-4 py-3 text-sm text-slate-900 dark:text-slate-200 font-mono">
                            {row[column] ?? 'N/A'}
                          </td>
                        {/each}
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            </div>
          {:else}
            <div class="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-8 text-center border border-slate-200 dark:border-green-500/10">
              <p class="text-slate-600 dark:text-slate-400">No results found</p>
            </div>
          {/if}

          <!-- Key Insights -->
          {#if insights.length > 0}
            <div class="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-xl p-6 border border-green-200 dark:border-green-500/20">
              <div class="flex items-center gap-2 mb-4">
                <Sparkles class="w-5 h-5 text-green-600 dark:text-green-400" />
                <h3 class="font-semibold text-green-900 dark:text-green-300">Key Insights</h3>
              </div>
              <ul class="space-y-2">
                {#each insights as insight}
                  <li class="flex items-start gap-2 text-sm text-green-800 dark:text-green-200">
                    <span class="text-green-500 mt-0.5">•</span>
                    <span>{insight}</span>
                  </li>
                {/each}
              </ul>
            </div>
          {/if}
        {/if}
      </div>

      <!-- Footer -->
      <div class="sticky bottom-0 bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-t border-slate-200 dark:border-green-500/10 rounded-b-2xl">
        <div class="flex justify-end gap-3">
          <button
            on:click={handleClose}
            class="px-6 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-medium rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Smooth scrollbar styling */
  :global(.dark) pre {
    scrollbar-width: thin;
    scrollbar-color: rgba(16, 185, 129, 0.3) rgba(0, 0, 0, 0.2);
  }

  pre::-webkit-scrollbar {
    height: 8px;
  }

  pre::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 4px;
  }

  pre::-webkit-scrollbar-thumb {
    background: rgba(16, 185, 129, 0.3);
    border-radius: 4px;
  }

  pre::-webkit-scrollbar-thumb:hover {
    background: rgba(16, 185, 129, 0.5);
  }
</style>
