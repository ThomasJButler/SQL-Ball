<!--
@author Tom Butler
@date 2025-10-25
@description Demo query examples component. Provides categorised example natural language queries
             for player performance, team analysis, and match statistics.
-->
<script lang="ts">
  import { TrendingUp, Users, Trophy, Target, Activity, Star } from 'lucide-svelte';

  export let onSelectQuery: (query: string) => void;

  const demoCategories = [
    {
      title: 'Player Performance',
      icon: TrendingUp,
      queries: [
        'Show me the top 5 scorers this season',
        'Who has the most assists in the Premier League?',
        'Find strikers with over 10 goals',
        'List players with the best goal to xG ratio',
        'Show midfielders with most key passes'
      ]
    },
    {
      title: 'Team Analytics',
      icon: Users,
      queries: [
        'Which teams have the best home record?',
        'Show Arsenal\'s recent matches',
        'Find teams with highest average possession',
        'List big six teams\' performance',
        'Which team conceded the fewest goals?'
      ]
    },
    {
      title: 'Match Patterns',
      icon: Trophy,
      queries: [
        'Show matches with highest expected goals',
        'Find games where the underdog won',
        'List clean sheets by teams',
        'Show high-scoring matches over 5 goals',
        'Find matches with most cards'
      ]
    },
    {
      title: 'Advanced Stats',
      icon: Target,
      queries: [
        'Players overperforming their xG',
        'Goalkeepers with most clean sheets',
        'Teams with best xG difference',
        'Players from Manchester clubs',
        'Defenders with most goals'
      ]
    }
  ];
</script>

<div class="grid gap-6 md:grid-cols-2">
  {#each demoCategories as category}
    <div class="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
      <div class="flex items-center gap-3 mb-4">
        <div class="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
          <svelte:component this={category.icon} class="w-5 h-5 text-white" />
        </div>
        <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
          {category.title}
        </h3>
      </div>

      <div class="space-y-2">
        {#each category.queries as query}
          <button
            on:click={() => onSelectQuery(query)}
            class="w-full text-left px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-700 dark:hover:text-green-400 transition-colors"
          >
            {query}
          </button>
        {/each}
      </div>
    </div>
  {/each}
</div>

<style>
  button:hover {
    transform: translateX(2px);
  }
</style>