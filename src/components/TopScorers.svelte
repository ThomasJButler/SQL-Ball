<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '../lib/supabase';
  import { Trophy, Target, TrendingUp, Award, Users } from 'lucide-svelte';

  interface PlayerStats {
    id: number;
    season_id: string;
    player_name: string;
    team: string;
    position: string;
    goals: number;
    assists: number;
    xg: number;
    xa: number;
    minutes_played: number;
    appearances: number;
  }

  let topScorers: PlayerStats[] = [];
  let loading = true;
  let selectedSeason = '2024-25';

  async function loadTopScorers() {
    loading = true;
    try {
      const { data, error } = await supabase
        .from('player_stats')
        .select('*')
        .eq('season_id', selectedSeason)
        .order('goals', { ascending: false })
        .limit(20);

      if (error) throw error;

      topScorers = data || [];
    } catch (error) {
      console.error('Error loading top scorers:', error);
      topScorers = [];
    } finally {
      loading = false;
    }
  }

  function getPositionColor(position: string): string {
    switch (position?.toUpperCase()) {
      case 'FWD':
      case 'FORWARD':
        return 'text-red-600 dark:text-red-400';
      case 'MID':
      case 'MIDFIELDER':
        return 'text-blue-600 dark:text-blue-400';
      case 'DEF':
      case 'DEFENDER':
        return 'text-green-600 dark:text-green-400';
      case 'GK':
      case 'GOALKEEPER':
        return 'text-purple-600 dark:text-purple-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  }

  function getPositionBadge(position: string): string {
    switch (position?.toUpperCase()) {
      case 'FWD':
      case 'FORWARD':
        return 'FWD';
      case 'MID':
      case 'MIDFIELDER':
        return 'MID';
      case 'DEF':
      case 'DEFENDER':
        return 'DEF';
      case 'GK':
      case 'GOALKEEPER':
        return 'GK';
      default:
        return position?.substring(0, 3).toUpperCase() || 'N/A';
    }
  }

  onMount(() => {
    loadTopScorers();
  });
</script>

<div class="max-w-7xl mx-auto">
  <!-- Header -->
  <div class="mb-8">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h1 class="text-3xl font-bold text-slate-900 dark:text-white mb-2">Top Scorers</h1>
        <p class="text-slate-600 dark:text-slate-400">
          Leading goalscorers in the Premier League
        </p>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm text-slate-500">Season:</span>
        <select
          bind:value={selectedSeason}
          on:change={loadTopScorers}
          class="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="2024-25">2024-25</option>
          <option value="2025-26">2025-26</option>
        </select>
      </div>
    </div>
  </div>

  <!-- Main Content -->
  <div class="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800">
    <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
      <div class="flex items-center gap-3">
        <div class="p-2 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-lg">
          <Trophy class="w-6 h-6 text-white" />
        </div>
        <h2 class="text-xl font-semibold text-slate-900 dark:text-white">Golden Boot Race</h2>
      </div>
    </div>

    {#if loading}
      <div class="p-8">
        <div class="flex justify-center">
          <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500"></div>
        </div>
      </div>
    {:else if topScorers.length === 0}
      <div class="p-8 text-center">
        <Trophy class="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <p class="text-slate-600 dark:text-slate-400">
          No player data available for the {selectedSeason} season
        </p>
        <p class="text-sm text-slate-500 dark:text-slate-500 mt-2">
          Data will be populated as matches are played
        </p>
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              <th class="text-left px-6 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Rank
              </th>
              <th class="text-left px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Player
              </th>
              <th class="text-left px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Team
              </th>
              <th class="text-center px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Position
              </th>
              <th class="text-center px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Goals
              </th>
              <th class="text-center px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Assists
              </th>
              <th class="text-center px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                xG
              </th>
              <th class="text-center px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Apps
              </th>
              <th class="text-center px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Mins
              </th>
              <th class="text-center px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                G/90
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200 dark:divide-slate-800">
            {#each topScorers as player, index}
              <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td class="px-6 py-4">
                  <div class="flex items-center justify-center w-10 h-10 rounded-full {
                    index === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white font-bold shadow-lg' :
                    index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white font-bold' :
                    index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white font-bold' :
                    'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }">
                    {#if index === 0}
                      <Trophy class="w-5 h-5" />
                    {:else}
                      {index + 1}
                    {/if}
                  </div>
                </td>
                <td class="px-4 py-4">
                  <div class="font-medium text-slate-900 dark:text-white">
                    {player.player_name}
                  </div>
                </td>
                <td class="px-4 py-4">
                  <div class="text-sm text-slate-600 dark:text-slate-400">
                    {player.team}
                  </div>
                </td>
                <td class="px-4 py-4 text-center">
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {getPositionColor(player.position)} bg-slate-100 dark:bg-slate-800">
                    {getPositionBadge(player.position)}
                  </span>
                </td>
                <td class="px-4 py-4 text-center">
                  <span class="text-xl font-bold text-slate-900 dark:text-white">
                    {player.goals}
                  </span>
                </td>
                <td class="px-4 py-4 text-center">
                  <span class="text-sm text-slate-600 dark:text-slate-300">
                    {player.assists}
                  </span>
                </td>
                <td class="px-4 py-4 text-center">
                  <div class="text-sm text-slate-600 dark:text-slate-300">
                    {player.xg?.toFixed(1) || '0.0'}
                  </div>
                  {#if player.xg}
                    <div class="text-xs {player.goals > player.xg ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">
                      {player.goals > player.xg ? '+' : ''}{(player.goals - player.xg).toFixed(1)}
                    </div>
                  {/if}
                </td>
                <td class="px-4 py-4 text-center">
                  <span class="text-sm text-slate-600 dark:text-slate-300">
                    {player.appearances}
                  </span>
                </td>
                <td class="px-4 py-4 text-center">
                  <span class="text-sm text-slate-600 dark:text-slate-300">
                    {player.minutes_played.toLocaleString()}
                  </span>
                </td>
                <td class="px-4 py-4 text-center">
                  <span class="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {player.minutes_played > 0 ? ((player.goals / player.minutes_played) * 90).toFixed(2) : '0.00'}
                  </span>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      {#if topScorers.length > 0 && topScorers[0].goals > 0}
        <!-- Leading Scorer Highlight -->
        <div class="p-6 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-t border-slate-200 dark:border-slate-800">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <Award class="w-8 h-8 text-amber-600 dark:text-amber-400" />
              <div>
                <p class="text-sm text-slate-600 dark:text-slate-400">Golden Boot Leader</p>
                <p class="text-lg font-bold text-slate-900 dark:text-white">
                  {topScorers[0].player_name}
                </p>
                <p class="text-sm text-slate-600 dark:text-slate-400">
                  {topScorers[0].team} • {topScorers[0].goals} goals
                  {#if topScorers[1]}
                    • {topScorers[0].goals - topScorers[1].goals} ahead
                  {/if}
                </p>
              </div>
            </div>
            {#if topScorers[0].xg}
              <div class="text-right">
                <p class="text-xs text-slate-500 dark:text-slate-400">Performance vs xG</p>
                <p class="text-2xl font-bold {topScorers[0].goals > topScorers[0].xg ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">
                  {topScorers[0].goals > topScorers[0].xg ? '+' : ''}{(topScorers[0].goals - topScorers[0].xg).toFixed(1)}
                </p>
              </div>
            {/if}
          </div>

          <!-- Quick Stats -->
          <div class="grid grid-cols-3 gap-4 mt-4">
            <div class="text-center">
              <p class="text-xs text-slate-500 dark:text-slate-400">Goals/Game</p>
              <p class="text-lg font-bold text-slate-900 dark:text-white">
                {topScorers[0].appearances > 0 ? (topScorers[0].goals / topScorers[0].appearances).toFixed(2) : '0.00'}
              </p>
            </div>
            <div class="text-center">
              <p class="text-xs text-slate-500 dark:text-slate-400">Total Contributions</p>
              <p class="text-lg font-bold text-slate-900 dark:text-white">
                {topScorers[0].goals + topScorers[0].assists}
              </p>
            </div>
            <div class="text-center">
              <p class="text-xs text-slate-500 dark:text-slate-400">Minutes/Goal</p>
              <p class="text-lg font-bold text-slate-900 dark:text-white">
                {topScorers[0].goals > 0 ? Math.round(topScorers[0].minutes_played / topScorers[0].goals) : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      {/if}
    {/if}
  </div>
</div>