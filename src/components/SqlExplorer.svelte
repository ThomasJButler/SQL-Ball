<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '../lib/supabase';
  import { Code, Database, Play, Download, Save, History, Sparkles } from 'lucide-svelte';

  let query = '';
  let results: any[] = [];
  let error: string | null = null;
  let isLoading = false;
  let queryHistory: { query: string; timestamp: Date; rowCount: number }[] = [];
  let savedQueries: { name: string; query: string }[] = [];
  let showHistory = false;
  let showSaved = false;
  let executionTime = 0;

  const exampleQueries = [
    {
      name: 'Top Scorers',
      query: `SELECT 
  home_team as team,
  SUM(home_goals) as goals_scored
FROM matches
WHERE home_goals IS NOT NULL
GROUP BY home_team
ORDER BY goals_scored DESC
LIMIT 10`
    },
    {
      name: 'Biggest Wins',
      query: `SELECT 
  date,
  home_team,
  away_team,
  home_goals,
  away_goals,
  (home_goals - away_goals) as goal_difference
FROM matches
WHERE home_goals > away_goals
ORDER BY goal_difference DESC
LIMIT 10`
    },
    {
      name: 'Red Card Analysis',
      query: `SELECT 
  referee,
  COUNT(*) as matches,
  SUM(home_reds + away_reds) as total_reds,
  ROUND(AVG(home_reds + away_reds), 2) as avg_reds_per_match
FROM matches
WHERE referee IS NOT NULL
GROUP BY referee
HAVING COUNT(*) >= 5
ORDER BY avg_reds_per_match DESC`
    },
    {
      name: 'Home vs Away Performance',
      query: `SELECT 
  COUNT(*) as total_matches,
  SUM(CASE WHEN result = 'H' THEN 1 ELSE 0 END) as home_wins,
  SUM(CASE WHEN result = 'D' THEN 1 ELSE 0 END) as draws,
  SUM(CASE WHEN result = 'A' THEN 1 ELSE 0 END) as away_wins,
  ROUND(100.0 * SUM(CASE WHEN result = 'H' THEN 1 ELSE 0 END) / COUNT(*), 1) as home_win_pct
FROM matches
WHERE result IS NOT NULL`
    }
  ];

  onMount(() => {
    loadQueryHistory();
    loadSavedQueries();
  });

  function loadQueryHistory() {
    const stored = localStorage.getItem('sql_query_history');
    if (stored) {
      queryHistory = JSON.parse(stored).map((q: any) => ({
        ...q,
        timestamp: new Date(q.timestamp)
      }));
    }
  }

  function loadSavedQueries() {
    const stored = localStorage.getItem('sql_saved_queries');
    if (stored) {
      savedQueries = JSON.parse(stored);
    }
  }

  async function executeQuery() {
    if (!query.trim()) return;

    isLoading = true;
    error = null;
    results = [];
    
    const startTime = performance.now();

    try {
      // For security, only allow SELECT queries
      if (!query.trim().toLowerCase().startsWith('select')) {
        throw new Error('Only SELECT queries are allowed for safety');
      }

      const { data, error: execError } = await supabase
        .rpc('execute_sql', { query_text: query })
        .single();

      if (execError) throw execError;

      results = data || [];
      executionTime = performance.now() - startTime;

      // Add to history
      const historyEntry = {
        query,
        timestamp: new Date(),
        rowCount: results.length
      };
      
      queryHistory = [historyEntry, ...queryHistory].slice(0, 20);
      localStorage.setItem('sql_query_history', JSON.stringify(queryHistory));

    } catch (err) {
      error = err instanceof Error ? err.message : 'Query execution failed';
      console.error('Query error:', err);
    } finally {
      isLoading = false;
    }
  }

  function useQuery(q: string) {
    query = q;
    executeQuery();
  }

  function saveQuery() {
    const name = prompt('Enter a name for this query:');
    if (name) {
      savedQueries = [...savedQueries, { name, query }];
      localStorage.setItem('sql_saved_queries', JSON.stringify(savedQueries));
    }
  }

  function deleteSavedQuery(index: number) {
    savedQueries = savedQueries.filter((_, i) => i !== index);
    localStorage.setItem('sql_saved_queries', JSON.stringify(savedQueries));
  }

  function exportResults() {
    if (results.length === 0) return;

    const csv = [
      Object.keys(results[0]).join(','),
      ...results.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query_results_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function formatSQL(sql: string): string {
    return sql
      .replace(/SELECT/gi, 'SELECT')
      .replace(/FROM/gi, '\nFROM')
      .replace(/WHERE/gi, '\nWHERE')
      .replace(/JOIN/gi, '\nJOIN')
      .replace(/GROUP BY/gi, '\nGROUP BY')
      .replace(/ORDER BY/gi, '\nORDER BY')
      .replace(/LIMIT/gi, '\nLIMIT');
  }
</script>

<div class="max-w-7xl mx-auto space-y-6">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-slate-900 dark:text-white mb-2">
      SQL Explorer
    </h1>
    <p class="text-slate-600 dark:text-slate-400">
      Write and execute SQL queries directly against the Premier League database
    </p>
  </div>

  <!-- Query Editor -->
  <div class="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-800">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-3">
        <Code class="w-5 h-5 text-green-500" />
        <h2 class="text-lg font-semibold text-slate-900 dark:text-white">Query Editor</h2>
      </div>
      <div class="flex items-center gap-2">
        <button
          on:click={() => showHistory = !showHistory}
          class="px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-2"
        >
          <History class="w-4 h-4" />
          History
        </button>
        <button
          on:click={() => showSaved = !showSaved}
          class="px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-2"
        >
          <Save class="w-4 h-4" />
          Saved
        </button>
      </div>
    </div>

    <!-- SQL Editor -->
    <div class="relative">
      <textarea
        bind:value={query}
        placeholder="SELECT * FROM matches WHERE ..."
        class="w-full h-48 px-4 py-3 bg-slate-900 text-green-400 font-mono text-sm rounded-lg border border-slate-700 focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
        disabled={isLoading}
      />
      
      <!-- Line numbers (decorative) -->
      <div class="absolute left-2 top-3 text-slate-600 font-mono text-sm pointer-events-none">
        {#each Array(8) as _, i}
          <div>{i + 1}</div>
        {/each}
      </div>
    </div>

    <!-- Action buttons -->
    <div class="flex items-center justify-between mt-4">
      <div class="flex items-center gap-2">
        <button
          on:click={executeQuery}
          disabled={isLoading || !query.trim()}
          class="px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium rounded-lg hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
        >
          {#if isLoading}
            <span class="animate-spin">⏳</span>
            Executing...
          {:else}
            <Play class="w-4 h-4" />
            Execute Query
          {/if}
        </button>
        
        {#if query.trim()}
          <button
            on:click={saveQuery}
            class="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-2"
          >
            <Save class="w-4 h-4" />
            Save
          </button>
        {/if}
      </div>

      {#if results.length > 0}
        <div class="flex items-center gap-4">
          <span class="text-sm text-slate-500">
            {results.length} rows • {executionTime.toFixed(0)}ms
          </span>
          <button
            on:click={exportResults}
            class="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-2"
          >
            <Download class="w-4 h-4" />
            Export CSV
          </button>
        </div>
      {/if}
    </div>
  </div>

  <!-- Example Queries -->
  <div class="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-800">
    <div class="flex items-center gap-3 mb-4">
      <Sparkles class="w-5 h-5 text-yellow-500" />
      <h2 class="text-lg font-semibold text-slate-900 dark:text-white">Example Queries</h2>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      {#each exampleQueries as example}
        <button
          on:click={() => useQuery(example.query)}
          class="text-left p-3 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-500 border border-slate-200 dark:border-slate-700 transition-all"
        >
          <h3 class="font-medium text-slate-900 dark:text-white mb-1">{example.name}</h3>
          <pre class="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap font-mono">
{formatSQL(example.query).slice(0, 100)}...
          </pre>
        </button>
      {/each}
    </div>
  </div>

  <!-- Query History -->
  {#if showHistory && queryHistory.length > 0}
    <div class="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-800">
      <h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Query History</h2>
      <div class="space-y-2 max-h-64 overflow-y-auto">
        {#each queryHistory as item}
          <button
            on:click={() => useQuery(item.query)}
            class="w-full text-left p-3 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
          >
            <div class="flex justify-between items-start mb-1">
              <span class="text-xs text-slate-500">
                {item.timestamp.toLocaleString()}
              </span>
              <span class="text-xs text-green-600 dark:text-green-400">
                {item.rowCount} rows
              </span>
            </div>
            <pre class="text-xs text-slate-600 dark:text-slate-400 font-mono truncate">
{item.query}
            </pre>
          </button>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Saved Queries -->
  {#if showSaved && savedQueries.length > 0}
    <div class="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-800">
      <h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Saved Queries</h2>
      <div class="space-y-2">
        {#each savedQueries as saved, i}
          <div class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <button
              on:click={() => useQuery(saved.query)}
              class="flex-1 text-left hover:text-green-600 dark:hover:text-green-400 transition-colors"
            >
              <h3 class="font-medium text-slate-900 dark:text-white">{saved.name}</h3>
              <pre class="text-xs text-slate-600 dark:text-slate-400 font-mono truncate mt-1">
{saved.query}
              </pre>
            </button>
            <button
              on:click={() => deleteSavedQuery(i)}
              class="ml-2 text-red-500 hover:text-red-700 transition-colors"
            >
              ✕
            </button>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Error Display -->
  {#if error}
    <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
      <p class="font-medium">Error:</p>
      <p class="text-sm mt-1">{error}</p>
    </div>
  {/if}

  <!-- Results Table -->
  {#if results.length > 0}
    <div class="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-800">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-slate-900 dark:text-white">
          Results ({results.length} rows)
        </h2>
        <Database class="w-5 h-5 text-emerald-500" />
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-slate-200 dark:border-slate-700">
              {#each Object.keys(results[0]) as column}
                <th class="text-left py-2 px-3 font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800">
                  {column}
                </th>
              {/each}
            </tr>
          </thead>
          <tbody>
            {#each results.slice(0, 100) as row, i}
              <tr class="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                {#each Object.values(row) as value}
                  <td class="py-2 px-3 text-slate-600 dark:text-slate-400">
                    {value ?? '-'}
                  </td>
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
        
        {#if results.length > 100}
          <p class="text-sm text-slate-500 mt-3 text-center">
            Showing first 100 rows of {results.length} total results
          </p>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  /* Matrix-style animations */
  @keyframes matrix-glow {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 1; }
  }
  
  textarea:focus {
    box-shadow: 0 0 20px rgba(34, 197, 94, 0.3);
  }
</style>