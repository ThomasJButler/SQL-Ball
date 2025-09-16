<script lang="ts">
  import { Play, Copy, Download, AlertCircle, CheckCircle } from 'lucide-svelte';
  import { supabase } from '../lib/supabase';
  import { onMount } from 'svelte';

  let sqlQuery = '';
  let results: any[] = [];
  let error: string | null = null;
  let isLoading = false;
  let executionTime = 0;
  let copied = false;

  onMount(() => {
    // Load saved query from localStorage if exists
    const savedQuery = localStorage.getItem('last_sql_query');
    if (savedQuery) {
      sqlQuery = savedQuery;
    }
  });

  async function executeQuery() {
    if (!sqlQuery.trim()) {
      error = 'Please enter a SQL query';
      return;
    }

    isLoading = true;
    error = null;
    results = [];

    const startTime = performance.now();

    try {
      // Save query to localStorage
      localStorage.setItem('last_sql_query', sqlQuery);

      // Parse the SQL query to determine what table/operation
      const cleanQuery = sqlQuery.trim().toLowerCase();

      if (cleanQuery.startsWith('select')) {
        // For SELECT queries, try to parse and execute via Supabase client
        const fromMatch = cleanQuery.match(/from\s+(\w+)/);
        if (!fromMatch) {
          throw new Error('Could not identify table in query');
        }

        const table = fromMatch[1];

        // For simple queries, use Supabase client
        if (!cleanQuery.includes('join') && !cleanQuery.includes('group by')) {
          let query = supabase.from(table).select('*');

          // Handle WHERE clause
          const whereMatch = cleanQuery.match(/where\s+(.+?)(?:\s+order\s+by|\s+limit|$)/);
          if (whereMatch) {
            // Parse simple WHERE conditions
            const conditions = whereMatch[1];
            // Handle simple equality conditions
            const eqMatch = conditions.match(/(\w+)\s*=\s*['"]?([^'"]+)['"]?/);
            if (eqMatch) {
              query = query.eq(eqMatch[1], eqMatch[2]);
            }
            // Handle LIKE conditions
            const likeMatch = conditions.match(/(\w+)\s+(?:i)?like\s+['"]?([^'"]+)['"]?/i);
            if (likeMatch) {
              query = query.ilike(likeMatch[1], likeMatch[2]);
            }
          }

          // Handle ORDER BY
          const orderMatch = cleanQuery.match(/order\s+by\s+(\w+)(?:\s+(asc|desc))?/);
          if (orderMatch) {
            query = query.order(orderMatch[1], { ascending: orderMatch[2] !== 'desc' });
          }

          // Handle LIMIT
          const limitMatch = cleanQuery.match(/limit\s+(\d+)/);
          if (limitMatch) {
            query = query.limit(parseInt(limitMatch[1]));
          }

          const { data, error: queryError } = await query;
          if (queryError) throw queryError;
          results = data || [];
        } else {
          // For complex queries, we need RPC or raw SQL support
          // Since RPC might not exist, show an informative error
          error = 'Complex queries with JOINs or GROUP BY require direct database access. Please use simpler queries or check if the execute_sql RPC function exists in your Supabase database.';

          // Try the RPC anyway in case it exists
          try {
            const { data, error: rpcError } = await supabase.rpc('execute_sql', {
              query_text: sqlQuery
            });
            if (!rpcError && data) {
              results = data;
              error = null; // Clear the error if RPC worked
            }
          } catch (rpcErr) {
            // RPC doesn't exist, keep the informative error message
            console.log('RPC not available, using fallback message');
          }
        }
      } else {
        error = 'Only SELECT queries are supported in this interface';
      }

      executionTime = Math.round(performance.now() - startTime);
    } catch (err: any) {
      error = err.message || 'Failed to execute query';
      console.error('Query execution error:', err);
    } finally {
      isLoading = false;
    }
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(sqlQuery);
    copied = true;
    setTimeout(() => copied = false, 2000);
  }

  function downloadResults() {
    if (results.length === 0) return;

    const csv = [
      Object.keys(results[0]).join(','),
      ...results.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query_results_${new Date().getTime()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function clearQuery() {
    sqlQuery = '';
    results = [];
    error = null;
    localStorage.removeItem('last_sql_query');
  }

  // Example queries for users
  const exampleQueries = [
    {
      title: "Recent Liverpool matches",
      query: "SELECT * FROM matches WHERE home_team = 'Liverpool' OR away_team = 'Liverpool' ORDER BY date DESC LIMIT 10"
    },
    {
      title: "High scoring games",
      query: "SELECT * FROM matches WHERE (home_score + away_score) > 5 ORDER BY date DESC LIMIT 20"
    },
    {
      title: "Arsenal home games",
      query: "SELECT * FROM matches WHERE home_team = 'Arsenal' AND season_id = '2024-25' ORDER BY date DESC"
    },
    {
      title: "Top scorers",
      query: "SELECT * FROM player_stats WHERE season_id = '2024-25' ORDER BY goals DESC LIMIT 20"
    },
    {
      title: "Clean sheets",
      query: "SELECT * FROM matches WHERE home_score = 0 OR away_score = 0 ORDER BY date DESC LIMIT 15"
    }
  ];

  function useExample(query: string) {
    sqlQuery = query;
  }
</script>

<div class="max-w-7xl mx-auto">
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-slate-900 dark:text-white mb-2">Submit Query</h1>
    <p class="text-slate-600 dark:text-slate-400">
      Paste your generated SQL query here and execute it against the database
    </p>
  </div>

  <!-- Example Queries -->
  <div class="mb-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
    <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Example Queries</h3>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
      {#each exampleQueries as example}
        <button
          on:click={() => useExample(example.query)}
          class="text-left px-3 py-2 bg-white dark:bg-slate-800 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-700 dark:hover:text-green-400 transition-colors text-sm border border-slate-200 dark:border-slate-700"
        >
          {example.title}
        </button>
      {/each}
    </div>
  </div>

  <div class="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 p-6">
    <!-- Query Input Section -->
    <div class="mb-6">
      <div class="flex items-center justify-between mb-3">
        <label for="sql-query" class="text-sm font-medium text-slate-700 dark:text-slate-300">
          SQL Query
        </label>
        <div class="flex gap-2">
          <button
            on:click={copyToClipboard}
            class="px-3 py-1 text-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
            disabled={!sqlQuery}
          >
            {#if copied}
              <CheckCircle class="w-4 h-4 text-green-500" />
              Copied!
            {:else}
              <Copy class="w-4 h-4" />
              Copy
            {/if}
          </button>
          <button
            on:click={clearQuery}
            class="px-3 py-1 text-sm bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors"
            disabled={!sqlQuery}
          >
            Clear
          </button>
        </div>
      </div>

      <textarea
        id="sql-query"
        bind:value={sqlQuery}
        placeholder="SELECT * FROM matches WHERE home_team = 'Arsenal' ORDER BY date DESC LIMIT 10;"
        class="w-full h-48 px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-sm text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-y"
      />
    </div>

    <!-- Execute Button -->
    <div class="flex justify-between items-center mb-6">
      <button
        on:click={executeQuery}
        disabled={isLoading || !sqlQuery.trim()}
        class="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
      >
        {#if isLoading}
          <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          Executing...
        {:else}
          <Play class="w-5 h-5" />
          Execute Query
        {/if}
      </button>

      {#if executionTime > 0}
        <span class="text-sm text-slate-600 dark:text-slate-400">
          Executed in {executionTime}ms
        </span>
      {/if}
    </div>

    <!-- Error Display -->
    {#if error}
      <div class="mb-6 p-4 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <div class="flex items-start gap-3">
          <AlertCircle class="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p class="font-semibold text-red-800 dark:text-red-300 mb-1">Query Error</p>
            <p class="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        </div>
      </div>
    {/if}

    <!-- Results Display -->
    {#if results.length > 0}
      <div class="border-t border-slate-200 dark:border-slate-800 pt-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
            Results ({results.length} rows)
          </h3>
          <button
            on:click={downloadResults}
            class="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
          >
            <Download class="w-4 h-4" />
            Download CSV
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-slate-200 dark:border-slate-700">
                {#each Object.keys(results[0]) as column}
                  <th class="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                    {column}
                  </th>
                {/each}
              </tr>
            </thead>
            <tbody>
              {#each results as row, i}
                <tr class="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                  {#each Object.values(row) as value}
                    <td class="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {value !== null ? value : '-'}
                    </td>
                  {/each}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {:else if !isLoading && !error && sqlQuery}
      <div class="text-center py-8 text-slate-500 dark:text-slate-400">
        No results returned from query
      </div>
    {/if}
  </div>

  <!-- Example Queries -->
  <div class="mt-8 bg-slate-50 dark:bg-slate-900/50 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
    <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Example Queries</h3>
    <div class="space-y-3">
      <button
        on:click={() => sqlQuery = "SELECT home_team, away_team, home_goals, away_goals, date\nFROM matches\nWHERE home_goals + away_goals > 5\nORDER BY date DESC\nLIMIT 10;"}
        class="w-full text-left p-3 bg-white dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
      >
        <p class="font-mono text-sm text-slate-700 dark:text-slate-300">High-scoring matches (6+ goals)</p>
      </button>
      <button
        on:click={() => sqlQuery = "SELECT home_team, COUNT(*) as wins, AVG(home_goals) as avg_goals\nFROM matches\nWHERE result = 'H'\nGROUP BY home_team\nORDER BY wins DESC;"}
        class="w-full text-left p-3 bg-white dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
      >
        <p class="font-mono text-sm text-slate-700 dark:text-slate-300">Home win statistics by team</p>
      </button>
      <button
        on:click={() => sqlQuery = "SELECT date, home_team, away_team,\n       home_goals, away_goals,\n       home_shots, away_shots\nFROM matches\nWHERE season_id = (SELECT id FROM seasons ORDER BY year DESC LIMIT 1)\nORDER BY date DESC;"}
        class="w-full text-left p-3 bg-white dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
      >
        <p class="font-mono text-sm text-slate-700 dark:text-slate-300">Latest season matches</p>
      </button>
    </div>
  </div>
</div>