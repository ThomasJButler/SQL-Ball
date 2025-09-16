<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '../lib/supabase';
  import { Search, User, Trophy, Target, TrendingUp, Activity, Shield, Award } from 'lucide-svelte';

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

  let searchQuery = '';
  let selectedPlayer: PlayerStats | null = null;
  let loading = false;
  let searchResults: PlayerStats[] = [];
  let showDropdown = false;
  let selectedSeason = '2024-25';
  let playerHistory: PlayerStats[] = [];

  async function searchPlayers() {
    if (searchQuery.length < 2) {
      searchResults = [];
      showDropdown = false;
      return;
    }

    loading = true;
    try {
      const { data, error } = await supabase
        .from('player_stats')
        .select('*')
        .eq('season_id', selectedSeason)
        .ilike('player_name', `%${searchQuery}%`)
        .limit(10);

      if (!error && data) {
        searchResults = data;
        showDropdown = true;
      } else {
        searchResults = [];
      }
    } catch (err) {
      console.error('Search error:', err);
      searchResults = [];
    } finally {
      loading = false;
    }
  }

  async function selectPlayer(player: PlayerStats) {
    selectedPlayer = player;
    searchQuery = player.player_name;
    showDropdown = false;

    // Load player's history across all seasons
    try {
      const { data, error } = await supabase
        .from('player_stats')
        .select('*')
        .eq('player_name', player.player_name)
        .order('season_id', { ascending: false });

      if (!error && data) {
        playerHistory = data;
      }
    } catch (err) {
      console.error('Error loading player history:', err);
      playerHistory = [player];
    }
  }

  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.search-container')) {
      showDropdown = false;
    }
  }

  function getPositionColor(position: string): string {
    switch (position?.toUpperCase()) {
      case 'FWD':
      case 'FORWARD':
        return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300';
      case 'MID':
      case 'MIDFIELDER':
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300';
      case 'DEF':
      case 'DEFENDER':
        return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300';
      case 'GK':
      case 'GOALKEEPER':
        return 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300';
      default:
        return 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-300';
    }
  }

  function calculatePercentile(value: number, max: number): number {
    return max > 0 ? (value / max) * 100 : 0;
  }

  onMount(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  });
</script>

<div class="max-w-7xl mx-auto">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-slate-900 dark:text-white mb-2">Player Profile</h1>
    <p class="text-slate-600 dark:text-slate-400">Search and view detailed player statistics</p>
  </div>

  <!-- Search Bar -->
  <div class="mb-8 relative search-container">
    <div class="flex gap-4">
      <div class="relative flex-1">
        <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          bind:value={searchQuery}
          on:input={searchPlayers}
          placeholder="Search for a player..."
          class="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        {#if loading}
          <div class="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-green-500"></div>
          </div>
        {/if}
      </div>
      <select
        bind:value={selectedSeason}
        on:change={() => {
          selectedPlayer = null;
          searchQuery = '';
        }}
        class="px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
      >
        <option value="2024-25">2024-25</option>
        <option value="2025-26">2025-26</option>
      </select>
    </div>

    <!-- Search Results Dropdown -->
    {#if showDropdown && searchResults.length > 0}
      <div class="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 max-h-64 overflow-y-auto z-50">
        {#each searchResults as player}
          <button
            on:click={() => selectPlayer(player)}
            class="w-full px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-between transition-colors text-left"
          >
            <div>
              <div class="font-medium text-slate-900 dark:text-white">{player.player_name}</div>
              <div class="text-sm text-slate-500 dark:text-slate-400">
                {player.team} • {player.position}
              </div>
            </div>
            <div class="text-sm text-slate-600 dark:text-slate-300">
              {player.goals} goals • {player.assists} assists
            </div>
          </button>
        {/each}
      </div>
    {:else if showDropdown && searchQuery.length >= 2}
      <div class="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 p-4">
        <p class="text-center text-slate-500 dark:text-slate-400">No players found</p>
      </div>
    {/if}
  </div>

  <!-- Player Details -->
  {#if selectedPlayer}
    <div class="space-y-6">
      <!-- Player Header Card -->
      <div class="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl shadow-lg p-8 text-white">
        <div class="flex items-start justify-between">
          <div>
            <h2 class="text-3xl font-bold mb-2">
              {selectedPlayer.player_name}
            </h2>
            <div class="flex items-center gap-4 mb-4">
              <span class="text-xl opacity-90">{selectedPlayer.team}</span>
              <span class="px-3 py-1 rounded-full text-sm font-medium bg-white/20 backdrop-blur">
                {selectedPlayer.position}
              </span>
            </div>
            <p class="text-sm opacity-90">
              Season: {selectedPlayer.season_id}
            </p>
          </div>
          <div class="text-right">
            <div class="text-4xl font-bold">{selectedPlayer.goals + selectedPlayer.assists}</div>
            <div class="text-sm opacity-90">Goal Contributions</div>
          </div>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-800">
          <div class="flex items-center gap-2 mb-3">
            <Trophy class="w-5 h-5 text-amber-500" />
            <span class="text-sm text-slate-600 dark:text-slate-400">Goals</span>
          </div>
          <p class="text-3xl font-bold text-slate-900 dark:text-white">
            {selectedPlayer.goals}
          </p>
          {#if selectedPlayer.xg}
            <p class="text-sm mt-2 {selectedPlayer.goals > selectedPlayer.xg ? 'text-green-600' : 'text-red-600'}">
              xG: {selectedPlayer.xg.toFixed(1)} ({selectedPlayer.goals > selectedPlayer.xg ? '+' : ''}{(selectedPlayer.goals - selectedPlayer.xg).toFixed(1)})
            </p>
          {/if}
        </div>

        <div class="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-800">
          <div class="flex items-center gap-2 mb-3">
            <Target class="w-5 h-5 text-blue-500" />
            <span class="text-sm text-slate-600 dark:text-slate-400">Assists</span>
          </div>
          <p class="text-3xl font-bold text-slate-900 dark:text-white">
            {selectedPlayer.assists}
          </p>
          {#if selectedPlayer.xa}
            <p class="text-sm mt-2 {selectedPlayer.assists > selectedPlayer.xa ? 'text-green-600' : 'text-red-600'}">
              xA: {selectedPlayer.xa.toFixed(1)} ({selectedPlayer.assists > selectedPlayer.xa ? '+' : ''}{(selectedPlayer.assists - selectedPlayer.xa).toFixed(1)})
            </p>
          {/if}
        </div>

        <div class="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-800">
          <div class="flex items-center gap-2 mb-3">
            <Activity class="w-5 h-5 text-green-500" />
            <span class="text-sm text-slate-600 dark:text-slate-400">Appearances</span>
          </div>
          <p class="text-3xl font-bold text-slate-900 dark:text-white">
            {selectedPlayer.appearances}
          </p>
          <p class="text-sm text-slate-500 mt-2">
            {selectedPlayer.minutes_played.toLocaleString()} mins
          </p>
        </div>

        <div class="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-800">
          <div class="flex items-center gap-2 mb-3">
            <TrendingUp class="w-5 h-5 text-purple-500" />
            <span class="text-sm text-slate-600 dark:text-slate-400">Per 90</span>
          </div>
          <p class="text-3xl font-bold text-slate-900 dark:text-white">
            {selectedPlayer.minutes_played > 0
              ? ((selectedPlayer.goals / selectedPlayer.minutes_played) * 90).toFixed(2)
              : '0.00'}
          </p>
          <p class="text-sm text-slate-500 mt-2">Goals/90</p>
        </div>
      </div>

      <!-- Detailed Stats -->
      <div class="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 p-6">
        <h3 class="text-xl font-semibold text-slate-900 dark:text-white mb-4">Performance Metrics</h3>

        <div class="space-y-4">
          <!-- Goals per Game -->
          <div>
            <div class="flex justify-between mb-2">
              <span class="text-sm text-slate-600 dark:text-slate-400">Goals per Game</span>
              <span class="text-sm font-medium text-slate-900 dark:text-white">
                {selectedPlayer.appearances > 0 ? (selectedPlayer.goals / selectedPlayer.appearances).toFixed(2) : '0.00'}
              </span>
            </div>
            <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div
                class="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
                style="width: {calculatePercentile(selectedPlayer.goals / Math.max(selectedPlayer.appearances, 1), 2)}%"
              ></div>
            </div>
          </div>

          <!-- Assists per Game -->
          <div>
            <div class="flex justify-between mb-2">
              <span class="text-sm text-slate-600 dark:text-slate-400">Assists per Game</span>
              <span class="text-sm font-medium text-slate-900 dark:text-white">
                {selectedPlayer.appearances > 0 ? (selectedPlayer.assists / selectedPlayer.appearances).toFixed(2) : '0.00'}
              </span>
            </div>
            <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div
                class="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full"
                style="width: {calculatePercentile(selectedPlayer.assists / Math.max(selectedPlayer.appearances, 1), 1)}%"
              ></div>
            </div>
          </div>

          <!-- Minutes per Goal -->
          {#if selectedPlayer.goals > 0}
            <div>
              <div class="flex justify-between mb-2">
                <span class="text-sm text-slate-600 dark:text-slate-400">Minutes per Goal</span>
                <span class="text-sm font-medium text-slate-900 dark:text-white">
                  {Math.round(selectedPlayer.minutes_played / selectedPlayer.goals)}
                </span>
              </div>
              <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div
                  class="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                  style="width: {calculatePercentile(200 - (selectedPlayer.minutes_played / selectedPlayer.goals), 200)}%"
                ></div>
              </div>
            </div>
          {/if}
        </div>
      </div>

      <!-- Season History -->
      {#if playerHistory.length > 1}
        <div class="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 p-6">
          <h3 class="text-xl font-semibold text-slate-900 dark:text-white mb-4">Season History</h3>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="text-xs text-slate-500 dark:text-slate-400 uppercase border-b dark:border-slate-700">
                <tr>
                  <th class="text-left pb-2">Season</th>
                  <th class="text-left pb-2">Team</th>
                  <th class="text-center pb-2">Apps</th>
                  <th class="text-center pb-2">Goals</th>
                  <th class="text-center pb-2">Assists</th>
                  <th class="text-center pb-2">Mins</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200 dark:divide-slate-800">
                {#each playerHistory as season}
                  <tr class="text-sm">
                    <td class="py-3 text-slate-900 dark:text-white font-medium">{season.season_id}</td>
                    <td class="py-3 text-slate-600 dark:text-slate-400">{season.team}</td>
                    <td class="py-3 text-center text-slate-600 dark:text-slate-400">{season.appearances}</td>
                    <td class="py-3 text-center font-medium text-slate-900 dark:text-white">{season.goals}</td>
                    <td class="py-3 text-center text-slate-600 dark:text-slate-400">{season.assists}</td>
                    <td class="py-3 text-center text-slate-600 dark:text-slate-400">{season.minutes_played.toLocaleString()}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      {/if}
    </div>
  {:else}
    <!-- Empty State -->
    <div class="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 p-12">
      <div class="text-center">
        <User class="w-16 h-16 text-slate-400 mx-auto mb-4" />
        <h3 class="text-xl font-semibold text-slate-900 dark:text-white mb-2">Search for a Player</h3>
        <p class="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
          Start typing a player's name above to view their detailed statistics and performance metrics
        </p>
      </div>
    </div>
  {/if}
</div>