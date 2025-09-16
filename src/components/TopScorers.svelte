<script lang="ts">
  import { onMount } from 'svelte';
  import { getTopScorers } from '../lib/supabase';
  import { Trophy, Target, TrendingUp } from 'lucide-svelte';

  let topScorers: any[] = [];
  let loading = true;
  let selectedSeason = '2024-2025';

  async function loadTopScorers() {
    loading = true;
    try {
      topScorers = await getTopScorers(selectedSeason, 20);
    } catch (error) {
      console.error('Error loading top scorers:', error);
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    loadTopScorers();
  });
</script>

<div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
  <div class="flex items-center justify-between mb-6">
    <div class="flex items-center gap-3">
      <div class="p-2 bg-amber-500/10 dark:bg-amber-500/20 rounded-lg">
        <Trophy class="w-6 h-6 text-amber-500" />
      </div>
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Top Scorers</h2>
    </div>
    <select
      bind:value={selectedSeason}
      on:change={loadTopScorers}
      class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
    >
      <option value="2024-2025">2024-25</option>
      <option value="2025-2026">2025-26</option>
    </select>
  </div>

  {#if loading}
    <div class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
    </div>
  {:else if topScorers.length === 0}
    <div class="text-center py-8 text-gray-500 dark:text-gray-400">
      No player data available. Run the update script to populate data.
    </div>
  {:else}
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="border-b dark:border-gray-700">
          <tr>
            <th class="text-left px-2 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Rank
            </th>
            <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Player
            </th>
            <th class="text-center px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Goals
            </th>
            <th class="text-center px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Assists
            </th>
            <th class="text-center px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              xG
            </th>
            <th class="text-center px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Minutes
            </th>
            <th class="text-center px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              G/90
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
          {#each topScorers as player, index}
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <td class="px-2 py-4">
                <div class="flex items-center justify-center w-8 h-8 rounded-full {index < 3 ? 'bg-amber-500/20 text-amber-500 font-bold' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}">
                  {index + 1}
                </div>
              </td>
              <td class="px-4 py-4">
                <div>
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    {player.players?.web_name || 'Unknown'}
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">
                    {player.players?.position || ''}
                  </div>
                </div>
              </td>
              <td class="text-center px-4 py-4">
                <span class="text-lg font-bold text-gray-900 dark:text-white">
                  {player.goals_scored || 0}
                </span>
              </td>
              <td class="text-center px-4 py-4">
                <span class="text-sm text-gray-600 dark:text-gray-300">
                  {player.assists || 0}
                </span>
              </td>
              <td class="text-center px-4 py-4">
                <span class="text-sm text-gray-600 dark:text-gray-300">
                  {player.expected_goals ? player.expected_goals.toFixed(1) : '0.0'}
                </span>
              </td>
              <td class="text-center px-4 py-4">
                <span class="text-sm text-gray-600 dark:text-gray-300">
                  {player.minutes || 0}
                </span>
              </td>
              <td class="text-center px-4 py-4">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {player.minutes > 0 ? ((player.goals_scored / player.minutes) * 90).toFixed(2) : '0.00'}
                </span>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    {#if topScorers.length > 0 && topScorers[0].goals_scored > 0}
      <div class="mt-6 p-4 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-lg">
        <div class="flex items-center gap-3">
          <Target class="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <p class="text-sm text-amber-800 dark:text-amber-300">
            <strong>{topScorers[0].players?.web_name}</strong> leads with {topScorers[0].goals_scored} goals
            {#if topScorers[0].expected_goals}
              ({topScorers[0].goals_scored > topScorers[0].expected_goals ? '+' : ''}{(topScorers[0].goals_scored - topScorers[0].expected_goals).toFixed(1)} vs xG)
            {/if}
          </p>
        </div>
      </div>
    {/if}
  {/if}
</div>