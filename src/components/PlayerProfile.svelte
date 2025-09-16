<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '../lib/supabase';
  import { Search, User, Trophy, Target, TrendingUp, Activity } from 'lucide-svelte';

  let searchQuery = '';
  let selectedPlayer: any = null;
  let loading = false;
  let searchResults: any[] = [];
  let showDropdown = false;
  let selectedSeason = '2024-2025';

  async function searchPlayers() {
    if (searchQuery.length < 2) {
      searchResults = [];
      showDropdown = false;
      return;
    }

    loading = true;
    const { data, error } = await supabase
      .from('players')
      .select(`
        *,
        player_stats!inner(
          goals_scored,
          assists,
          expected_goals,
          expected_assists,
          minutes,
          clean_sheets,
          saves,
          goals_conceded
        )
      `)
      .eq('season', selectedSeason)
      .ilike('web_name', `%${searchQuery}%`)
      .limit(10);

    if (!error && data) {
      searchResults = data;
      showDropdown = true;
    }
    loading = false;
  }

  async function selectPlayer(player: any) {
    selectedPlayer = player;
    searchQuery = player.web_name;
    showDropdown = false;
  }

  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.search-container')) {
      showDropdown = false;
    }
  }

  onMount(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  });
</script>

<div class="max-w-7xl mx-auto">
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
      <User class="w-8 h-8 text-green-500" />
      Player Profile
    </h1>
    <p class="text-gray-600 dark:text-gray-400">Search and view detailed player statistics</p>
  </div>

  <!-- Search Bar -->
  <div class="mb-8 relative search-container">
    <div class="flex gap-4">
      <div class="relative flex-1">
        <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          bind:value={searchQuery}
          on:input={searchPlayers}
          placeholder="Search for a player..."
          class="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>
      <select
        bind:value={selectedSeason}
        on:change={() => selectedPlayer = null}
        class="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
      >
        <option value="2024-2025">2024-25</option>
        <option value="2025-2026">2025-26</option>
      </select>
    </div>

    <!-- Search Results Dropdown -->
    {#if showDropdown && searchResults.length > 0}
      <div class="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-h-64 overflow-y-auto z-50">
        {#each searchResults as player}
          <button
            on:click={() => selectPlayer(player)}
            class="w-full px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between transition-colors text-left"
          >
            <div>
              <div class="font-medium text-gray-900 dark:text-white">{player.web_name}</div>
              <div class="text-sm text-gray-500 dark:text-gray-400">{player.position || 'Unknown'}</div>
            </div>
            {#if player.player_stats?.[0]}
              <div class="text-sm text-gray-600 dark:text-gray-300">
                {player.player_stats[0].goals_scored || 0} goals
              </div>
            {/if}
          </button>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Player Details -->
  {#if selectedPlayer}
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {selectedPlayer.web_name}
        </h2>
        <p class="text-gray-600 dark:text-gray-400">
          {selectedPlayer.first_name} {selectedPlayer.second_name}
        </p>
        <span class="inline-block mt-2 px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-full text-sm">
          {selectedPlayer.position || 'Unknown Position'}
        </span>
      </div>

      {#if selectedPlayer.player_stats?.[0]}
        {@const stats = selectedPlayer.player_stats[0]}
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <div class="flex items-center gap-2 mb-2">
              <Trophy class="w-4 h-4 text-amber-500" />
              <span class="text-sm text-gray-600 dark:text-gray-400">Goals</span>
            </div>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.goals_scored || 0}
            </p>
          </div>

          <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <div class="flex items-center gap-2 mb-2">
              <TrendingUp class="w-4 h-4 text-blue-500" />
              <span class="text-sm text-gray-600 dark:text-gray-400">Assists</span>
            </div>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.assists || 0}
            </p>
          </div>

          <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <div class="flex items-center gap-2 mb-2">
              <Target class="w-4 h-4 text-green-500" />
              <span class="text-sm text-gray-600 dark:text-gray-400">xG</span>
            </div>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.expected_goals?.toFixed(1) || '0.0'}
            </p>
          </div>

          <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <div class="flex items-center gap-2 mb-2">
              <Activity class="w-4 h-4 text-purple-500" />
              <span class="text-sm text-gray-600 dark:text-gray-400">Minutes</span>
            </div>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.minutes || 0}
            </p>
          </div>

          {#if selectedPlayer.position === 'GK' && stats.saves !== null}
            <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-sm text-gray-600 dark:text-gray-400">Saves</span>
              </div>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.saves || 0}
              </p>
            </div>

            <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-sm text-gray-600 dark:text-gray-400">Goals Conceded</span>
              </div>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.goals_conceded || 0}
              </p>
            </div>
          {/if}

          <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-sm text-gray-600 dark:text-gray-400">Clean Sheets</span>
            </div>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.clean_sheets || 0}
            </p>
          </div>
        </div>

        {#if stats.minutes > 0}
          <div class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
              <p class="text-sm text-gray-700 dark:text-gray-300">
                Goals per 90: <strong>{((stats.goals_scored / stats.minutes) * 90).toFixed(2)}</strong>
              </p>
            </div>
            <div class="p-4 bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20 rounded-lg">
              <p class="text-sm text-gray-700 dark:text-gray-300">
                Assists per 90: <strong>{((stats.assists / stats.minutes) * 90).toFixed(2)}</strong>
              </p>
            </div>
            {#if stats.expected_goals}
              <div class="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg">
                <p class="text-sm text-gray-700 dark:text-gray-300">
                  Goals vs xG: <strong>{stats.goals_scored > stats.expected_goals ? '+' : ''}{(stats.goals_scored - stats.expected_goals).toFixed(1)}</strong>
                </p>
              </div>
            {/if}
          </div>
        {/if}
      {:else}
        <p class="text-gray-600 dark:text-gray-400">No statistics available for this player</p>
      {/if}
    </div>
  {:else}
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12 text-center">
      <Search class="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Search for a player</h3>
      <p class="text-gray-600 dark:text-gray-400">Type a player name above to view their detailed statistics</p>
    </div>
  {/if}
</div>