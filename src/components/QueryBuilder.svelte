<script lang="ts">
  import { Search, Sparkles, Database, Zap, Info } from 'lucide-svelte';
  import { onMount } from 'svelte';
  import { QueryGenerator, type QueryResult } from '../lib/rag/queryGenerator';
  import { supabase } from '../lib/supabase';

  let naturalQuery = '';
  let isLoading = false;
  let queryResult: QueryResult | null = null;
  let executionResult: any[] = [];
  let error: string | null = null;
  let queryGenerator: QueryGenerator;
  let showExamples = false;

  // SQL examples since we're in SQL-only mode for now
  const exampleQueries = [
    "SELECT * FROM matches LIMIT 10",
    "SELECT * FROM matches WHERE home_goals > 3 LIMIT 10",
    "SELECT home_team, away_team, home_goals, away_goals FROM matches LIMIT 20",
    "SELECT * FROM matches ORDER BY date DESC LIMIT 5"
  ];

  onMount(() => {
    // Only initialize query generator if we have an OpenAI API key
    const openAIKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (openAIKey && openAIKey !== '') {
      try {
        queryGenerator = new QueryGenerator(openAIKey);
      } catch (err) {
        console.warn('QueryGenerator initialization failed, will use SQL-only mode', err);
      }
    } else {
      console.log('📝 SQL-only mode: No OpenAI API key found. You can still write SQL queries directly.');
    }
  });

  async function handleSubmit() {
    if (!naturalQuery.trim()) return;
    
    isLoading = true;
    error = null;
    queryResult = null;
    executionResult = [];

    try {
      // Check if we have a query generator (requires OpenAI API key)
      if (!queryGenerator) {
        // Fallback to basic SQL mode
        queryResult = {
          sql: naturalQuery, // Assume user entered SQL directly
          explanation: 'Direct SQL query execution (RAG mode requires OpenAI API key)',
          confidence: 1,
          tables: []
        };
      } else {
        // Generate SQL from natural language
        queryResult = await queryGenerator.generateQuery(naturalQuery);
      }
      
      // Parse and execute SQL queries
      const sqlLower = queryResult.sql.toLowerCase().trim();
      
      if (!sqlLower.startsWith('select')) {
        throw new Error('Only SELECT queries are supported in demo mode');
      }
      
      // Extract table name
      const tableMatch = sqlLower.match(/from\s+(\w+)/);
      if (!tableMatch) {
        throw new Error('Could not identify table in query');
      }
      
      const tableName = tableMatch[1];
      
      // Build Supabase query based on SQL
      let query: any;

      // Extract columns (if not SELECT *)
      const selectMatch = queryResult.sql.match(/select\s+(.*?)\s+from/i);
      if (selectMatch && selectMatch[1].trim() !== '*') {
        const columns = selectMatch[1].split(',').map(c => c.trim());
        query = supabase.from(tableName).select(columns.join(','));
      } else {
        query = supabase.from(tableName).select('*');
      }
      
      // Handle WHERE clause
      const whereMatch = sqlLower.match(/where\s+(.*?)(?:\s+order\s+by|\s+limit|$)/);
      if (whereMatch) {
        const whereClause = whereMatch[1];
        
        // Parse simple WHERE conditions (column operator value)
        const conditionMatch = whereClause.match(/(\w+)\s*(=|>|<|>=|<=|!=)\s*(.+)/);
        if (conditionMatch) {
          const [, column, operator, value] = conditionMatch;
          const cleanValue = value.replace(/['"`]/g, '').trim();
          
          // Map SQL operators to Supabase filters
          if (operator === '=') {
            query = query.eq(column, isNaN(Number(cleanValue)) ? cleanValue : Number(cleanValue));
          } else if (operator === '>') {
            query = query.gt(column, Number(cleanValue));
          } else if (operator === '<') {
            query = query.lt(column, Number(cleanValue));
          } else if (operator === '>=') {
            query = query.gte(column, Number(cleanValue));
          } else if (operator === '<=') {
            query = query.lte(column, Number(cleanValue));
          } else if (operator === '!=') {
            query = query.neq(column, isNaN(Number(cleanValue)) ? cleanValue : Number(cleanValue));
          }
        }
      }
      
      // Handle ORDER BY
      const orderMatch = sqlLower.match(/order\s+by\s+(\w+)(?:\s+(asc|desc))?/);
      if (orderMatch) {
        const [, orderColumn, direction] = orderMatch;
        query = query.order(orderColumn, { ascending: direction !== 'desc' });
      }
      
      // Handle LIMIT
      const limitMatch = sqlLower.match(/limit\s+(\d+)/);
      if (limitMatch) {
        query = query.limit(parseInt(limitMatch[1]));
      } else {
        // Default limit for safety
        query = query.limit(100);
      }
      
      // Execute query
      const { data, error: execError } = await query;
      
      if (execError) throw execError;
      executionResult = data || [];
      
      // Add info about results
      if (executionResult.length === 0) {
        error = 'Query executed successfully but returned no results';
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'An error occurred';
      console.error('Query error:', err);
    } finally {
      isLoading = false;
    }
  }

  function useExample(example: string) {
    naturalQuery = example;
    showExamples = false;
    handleSubmit();
  }

  function formatSQL(sql: string): string {
    // Basic SQL formatting for display
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

<div class="max-w-7xl mx-auto">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-slate-900 dark:text-white mb-2">
      Query Builder
    </h1>
    <p class="text-slate-600 dark:text-slate-400">
      Convert natural language to SQL queries instantly
    </p>
  </div>

  <!-- Query Input -->
  <div class="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 mb-6 border border-slate-200 dark:border-slate-800">
    <div class="flex items-center gap-3 mb-4">
      <Search class="w-5 h-5 text-green-500" />
      <h2 class="text-lg font-semibold text-slate-900 dark:text-white">Natural Language Query</h2>
    </div>
    
    <form on:submit|preventDefault={handleSubmit} class="space-y-4">
      <div class="relative">
        <input
          type="text"
          bind:value={naturalQuery}
          placeholder="Enter SQL query (e.g., SELECT * FROM matches LIMIT 10)"
          class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-slate-900 dark:text-white placeholder-slate-500"
          disabled={isLoading}
        />
        {#if naturalQuery}
          <button
            type="button"
            on:click={() => naturalQuery = ''}
            class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            ✕
          </button>
        {/if}
      </div>
      
      <div class="flex items-center gap-3">
        <button
          type="submit"
          disabled={isLoading || !naturalQuery.trim()}
          class="px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium rounded-lg hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
        >
          {#if isLoading}
            <span class="animate-spin">⏳</span>
            Generating...
          {:else}
            <Zap class="w-4 h-4" />
            Generate SQL
          {/if}
        </button>
        
        <button
          type="button"
          on:click={() => showExamples = !showExamples}
          class="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-2"
        >
          <Sparkles class="w-4 h-4" />
          Examples
        </button>
      </div>
    </form>

    <!-- Example Queries -->
    {#if showExamples}
      <div class="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
        <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Try these examples:</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
          {#each exampleQueries as example}
            <button
              on:click={() => useExample(example)}
              class="text-left px-3 py-2 text-sm bg-white dark:bg-slate-900 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-700 dark:hover:text-green-400 transition-colors border border-slate-200 dark:border-slate-700"
            >
              {example}
            </button>
          {/each}
        </div>
      </div>
    {/if}
  </div>

  <!-- Error Display -->
  {#if error}
    <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6">
      <p class="font-medium">Error:</p>
      <p class="text-sm mt-1">{error}</p>
    </div>
  {/if}

  <!-- Query Result -->
  {#if queryResult}
    <div class="space-y-6">
      <!-- Generated SQL -->
      <div class="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-800">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <Database class="w-5 h-5 text-emerald-500" />
            <h2 class="text-lg font-semibold text-slate-900 dark:text-white">Generated SQL</h2>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm text-slate-500">Confidence:</span>
            <span class="text-sm font-medium text-green-600 dark:text-green-400">
              {Math.round(queryResult.confidence * 100)}%
            </span>
          </div>
        </div>
        
        <pre class="bg-slate-900 text-green-400 p-4 rounded-lg overflow-x-auto font-mono text-sm">
{formatSQL(queryResult.sql)}
        </pre>

        <!-- Explanation -->
        <div class="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div class="flex items-start gap-2">
            <Info class="w-5 h-5 text-blue-500 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-blue-700 dark:text-blue-400 mb-1">Explanation:</p>
              <p class="text-sm text-blue-600 dark:text-blue-300">{queryResult.explanation}</p>
            </div>
          </div>
        </div>

        <!-- Optimization Suggestions -->
        {#if queryResult.optimizationSuggestions && queryResult.optimizationSuggestions.length > 0}
          <div class="mt-4">
            <p class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Optimization Suggestions:</p>
            <ul class="space-y-1">
              {#each queryResult.optimizationSuggestions as suggestion}
                <li class="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                  <span class="text-yellow-500 mt-0.5">💡</span>
                  {suggestion}
                </li>
              {/each}
            </ul>
          </div>
        {/if}

        <!-- Performance Estimate -->
        {#if queryResult.performanceEstimate}
          <div class="mt-4 flex items-center gap-2">
            <span class="text-sm text-slate-500">Estimated Performance:</span>
            <span class="text-sm font-medium text-slate-700 dark:text-slate-300">
              {queryResult.performanceEstimate}
            </span>
          </div>
        {/if}
      </div>

      <!-- Query Results -->
      {#if executionResult.length > 0}
        <div class="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-800">
          <h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Results ({executionResult.length} rows)
          </h2>
          
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-slate-200 dark:border-slate-700">
                  {#each Object.keys(executionResult[0]) as column}
                    <th class="text-left py-2 px-3 font-medium text-slate-700 dark:text-slate-300">
                      {column}
                    </th>
                  {/each}
                </tr>
              </thead>
              <tbody>
                {#each executionResult.slice(0, 20) as row, i}
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
            
            {#if executionResult.length > 20}
              <p class="text-sm text-slate-500 mt-3">
                Showing first 20 rows of {executionResult.length} total results
              </p>
            {/if}
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  /* Matrix-style glow effect for focus */
  input:focus {
    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
  }
  
  /* Animated gradient for loading state */
  @keyframes gradient {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
</style>