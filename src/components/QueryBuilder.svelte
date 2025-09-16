<script lang="ts">
  import { Search, Sparkles, Database, Zap, Info, RefreshCw, Cpu, Copy, PlayCircle, Check, Key, AlertCircle } from 'lucide-svelte';
  import { onMount } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  import { supabase } from '../lib/supabase';
  import { apiService } from '../services/apiService';

  const dispatch = createEventDispatcher();

  interface QueryResponse {
    sql: string;
    explanation?: string;
    confidence?: number;
    optimizationSuggestions?: string[];
    performanceEstimate?: string;
  }

  let naturalQuery = '';
  let isLoading = false;
  let queryResult: QueryResponse | null = null;
  let executionResult: any[] = [];
  let error: string | null = null;
  let hasApiKey = false;
  let showExamples = false;
  let selectedSeason = '2024-2025';
  let showOptimizations = false;
  let copySuccess = false;
  let isExecuting = false;
  let useBackendAPI = true;
  let backendAvailable = false;
  let autoExecute = false; // Added missing variable
  // Removed auto-execute functionality for deployment simplicity

  // Natural language examples for the AI-powered query system
  const exampleQueries = [
    "Show me Liverpool's recent matches",
    "Find matches between Arsenal and Chelsea",
    "Show me all Premier League matches",
    "Find matches with more than 4 total goals",
    "Show matches where home team won",
    "Find all Manchester City home matches",
    "Show recent high-scoring games",
    "Find all draws in the Premier League"
  ];

  onMount(async () => {
    // Check if backend API is available
    backendAvailable = await apiService.isAvailable();

    if (!backendAvailable) {
      // Fallback to checking for OpenAI API key for direct use
      const apiKey = localStorage.getItem('openai_api_key');
      hasApiKey = !!apiKey;
      useBackendAPI = false;
    } else {
      // Backend is available, no need for direct API key
      hasApiKey = true;
      useBackendAPI = true;
    }

    // Auto-execute functionality removed
  });

  function navigateToSettings() {
    dispatch('navigate', { view: 'Settings' });
  }

  async function handleSubmit() {
    if (!naturalQuery.trim()) return;

    if (!useBackendAPI && !hasApiKey) {
      error = 'Please add your OpenAI API key in Settings or ensure the backend API is running.';
      return;
    }

    isLoading = true;
    error = null;
    queryResult = null;
    executionResult = [];
    showOptimizations = false;

    try {
      if (useBackendAPI) {
        // Get API key from localStorage for backend request
        const apiKey = localStorage.getItem('openai_api_key');
        
        if (!apiKey) {
          error = 'Please add your OpenAI API key in Settings to use the backend RAG service.';
          return;
        }

        // Use backend API service with API key
        const response = await apiService.convertToSQL({
          question: naturalQuery,
          season: selectedSeason,
          include_explanation: true,
          api_key: apiKey
        });

        queryResult = {
          sql: response.sql,
          explanation: response.explanation || 'Query generated successfully',
          confidence: 0.95,
          optimizationSuggestions: response.optimizations || [],
          performanceEstimate: response.execution_time_ms 
            ? `${response.execution_time_ms}ms` 
            : 'Fast'
        };

        // If backend already executed the query
        if (response.results) {
          executionResult = response.results;
        }
        // Auto-execute removed - user must click Execute button
      } else {
        // Fallback to direct OpenAI API call
        const apiKey = localStorage.getItem('openai_api_key');
        if (!apiKey) {
          throw new Error('OpenAI API key not found');
        }

        // Make direct call to OpenAI API
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4-turbo-preview',
            messages: [
              {
                role: 'system',
                content: `You are an SQL expert for SQL-Ball, a football analytics platform. Convert natural language queries to PostgreSQL queries.

Database Schema:
- matches table: id, match_date, home_team, away_team, home_score, away_score, result (H=home win, A=away win, D=draw), div (league code: E0=Premier League, SP1=La Liga, I1=Serie A, D1=Bundesliga, F1=Ligue 1)

Rules:
1. Return ONLY the SQL query, no explanations or markdown
2. Always limit results to prevent huge queries (default LIMIT 20)
3. Use proper PostgreSQL syntax
4. For team names, use ILIKE for case-insensitive matching
5. Order by match_date DESC for recent matches

Examples:
Input: "Show me Liverpool's recent matches"
Output: SELECT match_date, home_team, away_team, home_score, away_score FROM matches WHERE (home_team ILIKE '%Liverpool%' OR away_team ILIKE '%Liverpool%') ORDER BY match_date DESC LIMIT 20

Input: "Find matches with more than 4 goals"
Output: SELECT match_date, home_team, away_team, home_score, away_score FROM matches WHERE (home_score + away_score) > 4 ORDER BY match_date DESC LIMIT 20

Input: "Show Premier League matches"
Output: SELECT match_date, home_team, away_team, home_score, away_score FROM matches WHERE div = 'E0' ORDER BY match_date DESC LIMIT 20`
              },
              { role: 'user', content: naturalQuery }
            ],
            temperature: 0.2,
            max_tokens: 500
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'Failed to generate SQL');
        }

        const data = await response.json();
        const generatedSQL = data.choices[0].message.content;

        // Store the response
        queryResult = {
          sql: generatedSQL.trim(),
          explanation: 'Query generated successfully',
          confidence: 0.95,
          optimizationSuggestions: [],
          performanceEstimate: 'Fast'
        };

        // Auto-execute removed - user must click Execute button
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'An error occurred';
      console.error('Query error:', err);
      
      // If backend fails, try to fallback
      if (useBackendAPI && err.message.includes('fetch')) {
        error = 'Backend API is not available. Please ensure the backend server is running or add your OpenAI API key in Settings.';
      }
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

  async function copyToClipboard() {
    if (!queryResult?.sql) return;

    try {
      await navigator.clipboard.writeText(queryResult.sql);
      copySuccess = true;
      setTimeout(() => copySuccess = false, 2000);
    } catch (err) {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = queryResult.sql;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      copySuccess = true;
      setTimeout(() => copySuccess = false, 2000);
    }
  }

  async function executeSQL() {
    if (!queryResult?.sql) return;

    isExecuting = true;
    error = null;
    executionResult = [];

    try {
      // Use backend API service to execute SQL
      const results = await apiService.executeSQL(queryResult.sql);
      
      // Handle the response
      if (results && results.length > 0) {
        executionResult = results;
      } else {
        error = 'Query executed successfully but returned no results';
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to execute query';
      console.error('Execution error:', err);
    } finally {
      isExecuting = false;
    }
  }

  async function executeSimpleQuery(sql: string) {
    // Simple query execution for basic SELECT statements
    const cleanSql = sql.toLowerCase().trim();

    // Extract table name
    const fromMatch = cleanSql.match(/from\s+(\w+)/);
    if (!fromMatch) throw new Error('Could not identify table');

    const table = fromMatch[1];
    let query = supabase.from(table);

    // Handle SELECT columns
    const selectMatch = sql.match(/select\s+(.*?)\s+from/i);
    if (selectMatch && selectMatch[1].trim() !== '*') {
      // For aggregates, we need different handling
      if (selectMatch[1].includes('sum(') || selectMatch[1].includes('count(')) {
        // This needs server-side execution
        throw new Error('Aggregate functions require server-side execution. Please run this query in Supabase SQL Editor.');
      }
      const columns = selectMatch[1].split(',').map(c => c.trim());
      query = query.select(columns.join(','));
    } else {
      query = query.select('*');
    }

    // Handle WHERE conditions
    const whereMatch = cleanSql.match(/where\s+(.*?)(?:\s+group\s+by|\s+order\s+by|\s+limit|$)/);
    if (whereMatch) {
      const conditions = whereMatch[1];
      // Parse simple conditions
      const condParts = conditions.match(/(\w+)\s*=\s*['"]?([^'"]+)['"]?/g);
      if (condParts) {
        for (const cond of condParts) {
          const [col, val] = cond.split('=').map(s => s.trim().replace(/['"]/g, ''));
          query = query.eq(col, val);
        }
      }
    }

    // Handle ORDER BY
    const orderMatch = cleanSql.match(/order\s+by\s+(\w+)(?:\s+(asc|desc))?/);
    if (orderMatch) {
      query = query.order(orderMatch[1], { ascending: orderMatch[2] !== 'desc' });
    }

    // Handle LIMIT
    const limitMatch = cleanSql.match(/limit\s+(\d+)/);
    if (limitMatch) {
      query = query.limit(parseInt(limitMatch[1]));
    } else {
      query = query.limit(100);
    }

    const { data, error: execError } = await query;
    if (execError) throw execError;
    executionResult = data || [];
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

  <!-- Setup Required Banner -->
  {#if !hasApiKey}
    <div class="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-6 mb-6">
      <div class="flex items-start justify-between">
        <div class="flex items-start gap-4">
          <AlertCircle class="w-8 h-8 text-red-600 dark:text-red-400 mt-1 flex-shrink-0" />
          <div>
            <h3 class="text-xl font-bold text-red-900 dark:text-red-100 mb-2">⚡ OpenAI API Key Required</h3>
            <div class="space-y-2 text-sm text-red-800 dark:text-red-200">
              <p><strong>To use SQL-Ball, you need an OpenAI API key for:</strong></p>
              <ul class="list-disc list-inside ml-4 space-y-1">
                <li>Converting natural language to SQL queries</li>
                <li>Executing generated SQL statements</li>
                <li>Getting AI-powered explanations</li>
              </ul>
              <p class="mt-3"><strong>💡 New to OpenAI?</strong> They offer $5 in free credits to get started!</p>
            </div>
          </div>
        </div>
        <div class="flex flex-col gap-2">
          <button
            on:click={navigateToSettings}
            class="px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold rounded-lg transition-all flex items-center gap-2 shadow-lg"
          >
            <Key class="w-5 h-5" />
            Quick Setup
          </button>
          <p class="text-xs text-red-600 dark:text-red-400 text-center">Includes tutorial wizard!</p>
        </div>
      </div>
    </div>
  {:else if useBackendAPI && backendAvailable}
    <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-6">
      <div class="flex items-center gap-3">
        <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <p class="text-sm text-green-700 dark:text-green-400">
          ✅ Connected to backend RAG service with OpenAI API key
        </p>
      </div>
    </div>
  {:else if hasApiKey}
    <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
      <div class="flex items-center gap-3">
        <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
        <p class="text-sm text-blue-700 dark:text-blue-400">
          ✅ OpenAI API key configured - Ready to generate and execute SQL!
        </p>
      </div>
    </div>
  {/if}

  <!-- Query Input -->
  <div class="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 mb-6 border border-slate-200 dark:border-slate-800">
    <div class="flex items-center gap-3 mb-4">
      <Search class="w-5 h-5 text-green-500" />
      <h2 class="text-lg font-semibold text-slate-900 dark:text-white">Natural Language Query</h2>
    </div>
    
    <form on:submit|preventDefault={handleSubmit} class="space-y-4">
      <div class="relative">
        <textarea
          bind:value={naturalQuery}
          placeholder="Enter your question in plain English (e.g., 'Show me Liverpool's total goals for 2025')"
          class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-slate-900 dark:text-white placeholder-slate-500 resize-none"
          rows="3"
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

        <!-- Auto-execute toggle removed for deployment simplicity -->

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
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <span class="text-sm text-slate-500">Confidence:</span>
              <span class="text-sm font-medium text-green-600 dark:text-green-400">
                {Math.round((queryResult.confidence || 0) * 100)}%
              </span>
            </div>
            <button
              on:click={copyToClipboard}
              class="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-2 text-sm"
              title="Copy SQL to clipboard"
            >
              {#if copySuccess}
                <Check class="w-4 h-4 text-green-500" />
                <span class="text-green-600 dark:text-green-400">Copied!</span>
              {:else}
                <Copy class="w-4 h-4" />
                <span>Copy SQL</span>
              {/if}
            </button>
          </div>
        </div>

        <pre class="bg-slate-900 text-green-400 p-4 rounded-lg overflow-x-auto font-mono text-sm mb-4">
{formatSQL(queryResult.sql)}
        </pre>

        <!-- Execute Button - Show when auto-execute is disabled -->
        {#if !autoExecute || executionResult.length === 0}
        <div class="flex justify-end">
          <button
            on:click={executeSQL}
            disabled={isExecuting}
            class="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-medium rounded-lg hover:from-blue-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            {#if isExecuting}
              <span class="animate-spin">⏳</span>
              Executing...
            {:else}
              <PlayCircle class="w-4 h-4" />
              Execute Query
            {/if}
          </button>
        </div>
        {/if}

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
