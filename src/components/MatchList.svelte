<script lang="ts">
  import { onMount } from 'svelte';
  import { dataService } from '../services/dataService';
  import type { Match, Season } from '../types';
  import { format } from 'date-fns';
  import { getTeamLogo } from '../utils/teamLogos';

  let matches: Match[] = [];
  let seasons: Season[] = [];
  let selectedSeason = '2024-2025';
  let loading = true;
  let error: string | null = null;

  async function loadSeasons() {
    seasons = await dataService.getAllSeasons();
    if (seasons.length > 0) {
      const currentSeason = seasons.find(s => s.is_current) || seasons[0];
      selectedSeason = currentSeason.name;
    }
  }

  async function loadMatches() {
    loading = true;
    error = null;
    try {
      matches = await dataService.getMatchesBySeason(selectedSeason);
    } catch (err) {
      error = 'Failed to load matches. Please try again.';
    } finally {
      loading = false;
    }
  }

  onMount(async () => {
    await loadSeasons();
    await loadMatches();
  });
</script>

<div class="space-y-6 animate-fade-in">
  <h2 class="text-2xl font-bold gradient-text">Upcoming Matches</h2>

  {#if loading}
    <div class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
    </div>
  {:else if error}
    <div class="card card-error p-6 text-center">
      <p class="text-error-content font-medium">{error}</p>
      <button class="btn btn-primary mt-4" on:click={loadMatches}>Retry</button>
    </div>
  {:else}
    <div class="space-y-4">
      {#each matches as match, i (match.id)}
        <div class="match-card animate-slide-in-up" style="animation-delay: {i * 50}ms">
          <!-- Team 1 -->
          <div class="flex items-center justify-end space-x-3">
            <span class="font-semibold text-slate-800 dark:text-slate-200 text-right">{match.home_team}</span>
            <img src={getTeamLogo(match.home_team, 30)} alt="{match.home_team} logo" class="w-7 h-7 object-contain rounded-full">
          </div>

          <!-- Score/Time -->
          <div class="text-center">
            {#if match.result}
              <div class="match-score">
                {match.home_goals ?? '?'} - {match.away_goals ?? '?'}
              </div>
            {:else}
              <div class="text-sm font-medium text-slate-500 dark:text-slate-400">
                {format(new Date(match.date), 'HH:mm')}
              </div>
              <div class="text-xs text-slate-500 dark:text-slate-400">
                {format(new Date(match.date), 'MMM d')}
              </div>
            {/if}
          </div>

          <!-- Team 2 -->
          <div class="flex items-center justify-start space-x-3">
            <img src={getTeamLogo(match.away_team, 30)} alt="{match.away_team} logo" class="w-7 h-7 object-contain rounded-full">
            <span class="font-semibold text-slate-800 dark:text-slate-200 text-left">{match.away_team}</span>
          </div>

          <!-- Status/Actions -->
          <div class="flex items-center justify-center sm:justify-end space-x-2 mt-2 sm:mt-0 col-span-full sm:col-span-1">
            {#if match.result}
              <span class="badge badge-neutral">Finished</span>
            {:else}
              <span class="badge badge-info">Upcoming</span>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style global lang="postcss">
  /* Ensure match-card layout works well on smaller screens */
  @media (max-width: 767px) {
    .match-card {
      @apply grid grid-cols-3 items-center gap-2 p-3;
    }
    .match-score {
      @apply px-2 py-1 text-lg;
    }
  }
</style>