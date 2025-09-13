<script lang="ts">
  import { Database, Plus, Trash2, Play, Code, Eye, Settings, Info } from 'lucide-svelte';
  import { supabase } from '../lib/supabase';
  
  interface Column {
    name: string;
    type: string;
    description: string;
  }
  
  interface Table {
    name: string;
    columns: Column[];
  }
  
  interface SelectedColumn {
    table: string;
    column: string;
    alias?: string;
  }
  
  interface WhereCondition {
    table: string;
    column: string;
    operator: string;
    value: string;
  }
  
  interface OrderBy {
    table: string;
    column: string;
    direction: 'ASC' | 'DESC';
  }

  // Available tables and their schema
  const tables: Table[] = [
    {
      name: 'matches',
      columns: [
        { name: 'id', type: 'uuid', description: 'Unique match identifier' },
        { name: 'date', type: 'timestamptz', description: 'Match date and time' },
        { name: 'home_team', type: 'text', description: 'Home team name' },
        { name: 'away_team', type: 'text', description: 'Away team name' },
        { name: 'home_goals', type: 'integer', description: 'Goals scored by home team' },
        { name: 'away_goals', type: 'integer', description: 'Goals scored by away team' },
        { name: 'result', type: 'char(1)', description: 'Match result: H/A/D' },
        { name: 'home_shots', type: 'integer', description: 'Total shots by home team' },
        { name: 'away_shots', type: 'integer', description: 'Total shots by away team' },
        { name: 'home_shots_target', type: 'integer', description: 'Shots on target by home team' },
        { name: 'away_shots_target', type: 'integer', description: 'Shots on target by away team' },
        { name: 'home_corners', type: 'integer', description: 'Corner kicks for home team' },
        { name: 'away_corners', type: 'integer', description: 'Corner kicks for away team' },
        { name: 'home_fouls', type: 'integer', description: 'Fouls by home team' },
        { name: 'away_fouls', type: 'integer', description: 'Fouls by away team' },
        { name: 'home_yellows', type: 'integer', description: 'Yellow cards for home team' },
        { name: 'away_yellows', type: 'integer', description: 'Yellow cards for away team' },
        { name: 'home_reds', type: 'integer', description: 'Red cards for home team' },
        { name: 'away_reds', type: 'integer', description: 'Red cards for away team' },
        { name: 'referee', type: 'text', description: 'Match referee name' }
      ]
    },
    {
      name: 'seasons',
      columns: [
        { name: 'id', type: 'uuid', description: 'Unique season identifier' },
        { name: 'name', type: 'text', description: 'Season name (e.g., "2023-2024")' },
        { name: 'start_date', type: 'date', description: 'Season start date' },
        { name: 'end_date', type: 'date', description: 'Season end date' },
        { name: 'is_current', type: 'boolean', description: 'Whether this is the current season' }
      ]
    }
  ];

  // Query builder state
  let selectedColumns: SelectedColumn[] = [];
  let whereConditions: WhereCondition[] = [];
  let orderBy: OrderBy[] = [];
  let limitValue: number = 100;
  let distinctMode: boolean = false;
  
  // UI state
  let generatedSQL: string = '';
  let results: any[] = [];
  let isExecuting: boolean = false;
  let error: string | null = null;
  let activeTab: 'builder' | 'sql' = 'builder';

  // Operators for different column types
  const operators = {
    'text': ['=', '!=', 'LIKE', 'ILIKE', 'NOT LIKE'],
    'integer': ['=', '!=', '>', '<', '>=', '<='],
    'timestamptz': ['=', '!=', '>', '<', '>=', '<='],
    'date': ['=', '!=', '>', '<', '>=', '<='],
    'boolean': ['=', '!='],
    'uuid': ['=', '!=']
  };

  function addColumn() {
    selectedColumns = [...selectedColumns, { table: 'matches', column: 'id' }];
    generateSQL();
  }

  function removeColumn(index: number) {
    selectedColumns = selectedColumns.filter((_, i) => i !== index);
    generateSQL();
  }

  function addWhereCondition() {
    whereConditions = [...whereConditions, { table: 'matches', column: 'id', operator: '=', value: '' }];
    generateSQL();
  }

  function removeWhereCondition(index: number) {
    whereConditions = whereConditions.filter((_, i) => i !== index);
    generateSQL();
  }

  function addOrderBy() {
    orderBy = [...orderBy, { table: 'matches', column: 'date', direction: 'DESC' }];
    generateSQL();
  }

  function removeOrderBy(index: number) {
    orderBy = orderBy.filter((_, i) => i !== index);
    generateSQL();
  }

  function generateSQL() {
    if (selectedColumns.length === 0) {
      generatedSQL = '';
      return;
    }

    // SELECT clause
    const selectClause = selectedColumns
      .map(col => {
        const fullColumn = `${col.table}.${col.column}`;
        return col.alias ? `${fullColumn} AS ${col.alias}` : fullColumn;
      })
      .join(', ');

    let sql = `SELECT ${distinctMode ? 'DISTINCT ' : ''}${selectClause}`;

    // FROM clause - determine which tables are needed
    const usedTables = new Set(selectedColumns.map(col => col.table));
    whereConditions.forEach(cond => usedTables.add(cond.table));
    orderBy.forEach(ord => usedTables.add(ord.table));

    const tableList = Array.from(usedTables);
    sql += `\nFROM ${tableList.join(', ')}`;

    // JOIN clause (if using multiple tables)
    if (tableList.includes('matches') && tableList.includes('seasons')) {
      sql += `\nJOIN seasons ON matches.season_id = seasons.id`;
    }

    // WHERE clause
    if (whereConditions.length > 0) {
      const whereClause = whereConditions
        .filter(cond => cond.value.trim() !== '')
        .map(cond => {
          const fullColumn = `${cond.table}.${cond.column}`;
          let value = cond.value;
          
          // Handle different operators and value formatting
          if (cond.operator === 'LIKE' || cond.operator === 'ILIKE' || cond.operator === 'NOT LIKE') {
            value = `'%${value}%'`;
          } else if (isNaN(Number(value))) {
            value = `'${value}'`;
          }
          
          return `${fullColumn} ${cond.operator} ${value}`;
        })
        .join(' AND ');
      
      if (whereClause) {
        sql += `\nWHERE ${whereClause}`;
      }
    }

    // ORDER BY clause
    if (orderBy.length > 0) {
      const orderClause = orderBy
        .map(ord => `${ord.table}.${ord.column} ${ord.direction}`)
        .join(', ');
      sql += `\nORDER BY ${orderClause}`;
    }

    // LIMIT clause
    if (limitValue > 0) {
      sql += `\nLIMIT ${limitValue}`;
    }

    generatedSQL = sql;
  }

  async function executeQuery() {
    if (!generatedSQL) return;

    isExecuting = true;
    error = null;
    results = [];

    try {
      // For now, execute a simplified version using Supabase client
      // This is a basic implementation - a full version would parse the SQL properly
      let query: any;

      if (selectedColumns.length > 0 && !selectedColumns.some(col => col.column === '*')) {
        const columns = selectedColumns
          .filter(col => col.table === 'matches')
          .map(col => col.column)
          .join(',');
        query = supabase.from('matches').select(columns);
      } else {
        query = supabase.from('matches').select('*');
      }

      // Apply WHERE conditions (simplified)
      whereConditions.forEach(cond => {
        if (cond.table === 'matches' && cond.value.trim()) {
          const value = isNaN(Number(cond.value)) ? cond.value : Number(cond.value);
          if (cond.operator === '=') {
            query = query.eq(cond.column, value);
          } else if (cond.operator === '>') {
            query = query.gt(cond.column, value);
          } else if (cond.operator === '<') {
            query = query.lt(cond.column, value);
          }
          // Add more operators as needed
        }
      });

      // Apply ORDER BY
      if (orderBy.length > 0) {
        const firstOrder = orderBy[0];
        if (firstOrder.table === 'matches') {
          query = query.order(firstOrder.column, { ascending: firstOrder.direction === 'ASC' });
        }
      }

      // Apply LIMIT
      query = query.limit(limitValue);

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;
      results = data || [];

    } catch (err) {
      error = err instanceof Error ? err.message : 'An error occurred';
      console.error('Query execution error:', err);
    } finally {
      isExecuting = false;
    }
  }

  function getColumnType(tableName: string, columnName: string): string {
    const table = tables.find(t => t.name === tableName);
    const column = table?.columns.find(c => c.name === columnName);
    return column?.type || 'text';
  }

  function getAvailableOperators(tableName: string, columnName: string): string[] {
    const type = getColumnType(tableName, columnName);
    return operators[type as keyof typeof operators] || operators.text;
  }

  // Initialize with a basic query
  selectedColumns = [
    { table: 'matches', column: 'home_team' },
    { table: 'matches', column: 'away_team' },
    { table: 'matches', column: 'home_goals' },
    { table: 'matches', column: 'away_goals' },
    { table: 'matches', column: 'date' }
  ];
  generateSQL();
</script>

<div class="max-w-7xl mx-auto">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-slate-900 dark:text-white mb-2">
      Visual Query Builder
    </h1>
    <p class="text-slate-600 dark:text-slate-400">
      Build SQL queries visually with drag & drop interface
    </p>
  </div>

  <!-- Tab Navigation -->
  <div class="mb-6">
    <div class="border-b border-slate-200 dark:border-slate-700">
      <nav class="-mb-px flex space-x-8">
        <button
          class="py-2 px-1 border-b-2 font-medium text-sm transition-colors"
          class:border-green-500={activeTab === 'builder'}
          class:text-green-600={activeTab === 'builder'}
          class:border-transparent={activeTab !== 'builder'}
          class:text-slate-500={activeTab !== 'builder'}
          on:click={() => activeTab = 'builder'}
        >
          <Database class="w-4 h-4 inline mr-2" />
          Visual Builder
        </button>
        <button
          class="py-2 px-1 border-b-2 font-medium text-sm transition-colors"
          class:border-green-500={activeTab === 'sql'}
          class:text-green-600={activeTab === 'sql'}
          class:border-transparent={activeTab !== 'sql'}
          class:text-slate-500={activeTab !== 'sql'}
          on:click={() => activeTab = 'sql'}
        >
          <Code class="w-4 h-4 inline mr-2" />
          Generated SQL
        </button>
      </nav>
    </div>
  </div>

  {#if activeTab === 'builder'}
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Query Builder Panel -->
      <div class="space-y-6">
        <!-- SELECT Columns -->
        <div class="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-800">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-slate-900 dark:text-white">Select Columns</h2>
            <button
              on:click={addColumn}
              class="px-3 py-1.5 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors flex items-center gap-1"
            >
              <Plus class="w-4 h-4" />
              Add Column
            </button>
          </div>

          <div class="space-y-3">
            {#each selectedColumns as col, i}
              <div class="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <select
                  bind:value={col.table}
                  on:change={generateSQL}
                  class="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm"
                >
                  {#each tables as table}
                    <option value={table.name}>{table.name}</option>
                  {/each}
                </select>

                <select
                  bind:value={col.column}
                  on:change={generateSQL}
                  class="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm flex-1"
                >
                  {#each tables.find(t => t.name === col.table)?.columns || [] as column}
                    <option value={column.name}>{column.name} ({column.type})</option>
                  {/each}
                </select>

                <input
                  type="text"
                  bind:value={col.alias}
                  on:input={generateSQL}
                  placeholder="Alias (optional)"
                  class="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm w-32"
                />

                <button
                  on:click={() => removeColumn(i)}
                  class="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            {/each}
          </div>

          <!-- DISTINCT option -->
          <div class="mt-4 flex items-center gap-2">
            <input
              type="checkbox"
              id="distinct"
              bind:checked={distinctMode}
              on:change={generateSQL}
              class="w-4 h-4 text-green-600 border-slate-300 dark:border-slate-600 rounded focus:ring-green-500"
            />
            <label for="distinct" class="text-sm text-slate-700 dark:text-slate-300">
              SELECT DISTINCT
            </label>
          </div>
        </div>

        <!-- WHERE Conditions -->
        <div class="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-800">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-slate-900 dark:text-white">WHERE Conditions</h2>
            <button
              on:click={addWhereCondition}
              class="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1"
            >
              <Plus class="w-4 h-4" />
              Add Condition
            </button>
          </div>

          <div class="space-y-3">
            {#each whereConditions as cond, i}
              <div class="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <select
                  bind:value={cond.table}
                  on:change={generateSQL}
                  class="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm"
                >
                  {#each tables as table}
                    <option value={table.name}>{table.name}</option>
                  {/each}
                </select>

                <select
                  bind:value={cond.column}
                  on:change={generateSQL}
                  class="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm flex-1"
                >
                  {#each tables.find(t => t.name === cond.table)?.columns || [] as column}
                    <option value={column.name}>{column.name}</option>
                  {/each}
                </select>

                <select
                  bind:value={cond.operator}
                  on:change={generateSQL}
                  class="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm"
                >
                  {#each getAvailableOperators(cond.table, cond.column) as operator}
                    <option value={operator}>{operator}</option>
                  {/each}
                </select>

                <input
                  type="text"
                  bind:value={cond.value}
                  on:input={generateSQL}
                  placeholder="Value"
                  class="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm w-32"
                />

                <button
                  on:click={() => removeWhereCondition(i)}
                  class="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            {/each}
          </div>
        </div>

        <!-- ORDER BY -->
        <div class="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-800">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-slate-900 dark:text-white">ORDER BY</h2>
            <button
              on:click={addOrderBy}
              class="px-3 py-1.5 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-1"
            >
              <Plus class="w-4 h-4" />
              Add Order
            </button>
          </div>

          <div class="space-y-3">
            {#each orderBy as ord, i}
              <div class="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <select
                  bind:value={ord.table}
                  on:change={generateSQL}
                  class="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm"
                >
                  {#each tables as table}
                    <option value={table.name}>{table.name}</option>
                  {/each}
                </select>

                <select
                  bind:value={ord.column}
                  on:change={generateSQL}
                  class="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm flex-1"
                >
                  {#each tables.find(t => t.name === ord.table)?.columns || [] as column}
                    <option value={column.name}>{column.name}</option>
                  {/each}
                </select>

                <select
                  bind:value={ord.direction}
                  on:change={generateSQL}
                  class="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm"
                >
                  <option value="ASC">ASC</option>
                  <option value="DESC">DESC</option>
                </select>

                <button
                  on:click={() => removeOrderBy(i)}
                  class="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            {/each}
          </div>
        </div>

        <!-- LIMIT -->
        <div class="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-800">
          <h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">LIMIT</h2>
          <input
            type="number"
            bind:value={limitValue}
            on:input={generateSQL}
            min="1"
            max="1000"
            class="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm w-32"
          />
        </div>
      </div>

      <!-- Preview Panel -->
      <div class="space-y-6">
        <!-- Generated SQL Preview -->
        <div class="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-800">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-slate-900 dark:text-white">Generated SQL</h2>
            <button
              on:click={executeQuery}
              disabled={isExecuting || !generatedSQL}
              class="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium rounded-lg hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {#if isExecuting}
                <span class="animate-spin">⏳</span>
                Executing...
              {:else}
                <Play class="w-4 h-4" />
                Execute Query
              {/if}
            </button>
          </div>
          
          <pre class="bg-slate-900 text-green-400 p-4 rounded-lg overflow-x-auto font-mono text-sm max-h-64">
{generatedSQL || 'Build your query using the controls on the left'}
          </pre>
        </div>

        <!-- Error Display -->
        {#if error}
          <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-4 rounded-lg">
            <p class="font-medium">Error:</p>
            <p class="text-sm mt-1">{error}</p>
          </div>
        {/if}

        <!-- Results -->
        {#if results.length > 0}
          <div class="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-800">
            <h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Results ({results.length} rows)
            </h2>
            
            <div class="overflow-x-auto max-h-96">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-slate-200 dark:border-slate-700">
                    {#each Object.keys(results[0]) as column}
                      <th class="text-left py-2 px-3 font-medium text-slate-700 dark:text-slate-300">
                        {column}
                      </th>
                    {/each}
                  </tr>
                </thead>
                <tbody>
                  {#each results.slice(0, 50) as row, i}
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
              
              {#if results.length > 50}
                <p class="text-sm text-slate-500 mt-3">
                  Showing first 50 rows of {results.length} total results
                </p>
              {/if}
            </div>
          </div>
        {/if}
      </div>
    </div>
  {:else}
    <!-- SQL Tab -->
    <div class="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-800">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-slate-900 dark:text-white">SQL Query</h2>
        <div class="flex gap-2">
          <button
            on:click={() => navigator.clipboard.writeText(generatedSQL)}
            class="px-3 py-1.5 bg-slate-500 text-white text-sm rounded-lg hover:bg-slate-600 transition-colors"
          >
            Copy SQL
          </button>
          <button
            on:click={executeQuery}
            disabled={isExecuting || !generatedSQL}
            class="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium rounded-lg hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            {#if isExecuting}
              <span class="animate-spin">⏳</span>
              Executing...
            {:else}
              <Play class="w-4 h-4" />
              Execute
            {/if}
          </button>
        </div>
      </div>
      
      <pre class="bg-slate-900 text-green-400 p-4 rounded-lg overflow-x-auto font-mono text-sm">
{generatedSQL || '-- No query generated yet'}
      </pre>
      
      {#if results.length > 0}
        <div class="mt-6">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Query Results ({results.length} rows)
          </h3>
          
          <div class="overflow-x-auto max-h-96 border border-slate-200 dark:border-slate-700 rounded-lg">
            <table class="w-full text-sm">
              <thead class="bg-slate-50 dark:bg-slate-800">
                <tr>
                  {#each Object.keys(results[0]) as column}
                    <th class="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                      {column}
                    </th>
                  {/each}
                </tr>
              </thead>
              <tbody>
                {#each results as row, i}
                  <tr class="border-t border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    {#each Object.values(row) as value}
                      <td class="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {value ?? '-'}
                      </td>
                    {/each}
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  /* Matrix-style glow effects */
  .bg-slate-900 pre {
    box-shadow: 0 0 20px rgba(34, 197, 94, 0.1);
  }
  
  /* Smooth transitions */
  select, input, button {
    transition: all 0.2s ease;
  }
  
  /* Hover effects */
  .hover\:bg-slate-50:hover {
    background-color: rgb(248 250 252 / 0.8);
  }
  
  .dark .hover\:bg-slate-800\/50:hover {
    background-color: rgb(30 41 59 / 0.5);
  }
</style>