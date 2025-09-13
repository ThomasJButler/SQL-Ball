<script lang="ts">
  import { onMount } from 'svelte';
  import { User, Calendar, Flag, Hash, Shirt, ArrowLeft } from 'lucide-svelte';
  import { footballDataAPI, type FDPlayer } from '../services/api/footballData';
  import { fade, fly } from 'svelte/transition';
  
  export let playerId: number | null = null;
  
  let player: FDPlayer | null = null;
  let loading = false;
  let error = '';
  let searchId = '';
  
  onMount(async () => {
    if (playerId) {
      await loadPlayer(playerId);
    }
  });
  
  async function loadPlayer(id: number) {
    try {
      loading = true;
      error = '';
      player = await footballDataAPI.getPlayer(id);
      
      if (!player) {
        error = 'Player not found';
      }
    } catch (err) {
      error = 'Failed to load player details';
      console.error('Error loading player:', err);
    } finally {
      loading = false;
    }
  }
  
  async function handleSearch() {
    const id = parseInt(searchId);
    if (!isNaN(id)) {
      await loadPlayer(id);
    } else {
      error = 'Please enter a valid player ID';
    }
  }
  
  function calculateAge(dateOfBirth: string): number {
    const birth = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }
  
  function getPositionColor(position: string): string {
    switch(position?.toLowerCase()) {
      case 'goalkeeper': return 'from-green-500 to-emerald-500';
      case 'defence': return 'from-blue-500 to-cyan-500';
      case 'midfield': return 'from-yellow-500 to-amber-500';
      case 'offence': return 'from-red-500 to-pink-500';
      default: return 'from-slate-500 to-slate-600';
    }
  }
  
  function clearPlayer() {
    player = null;
    searchId = '';
    error = '';
  }
</script>

<div class="max-w-4xl mx-auto">
  <!-- Header -->
  <div class="glass-card p-6 mb-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
          <User class="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 class="text-2xl font-bold gradient-text">Player Profile</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400">
            Detailed player information
          </p>
        </div>
      </div>
      {#if player}
        <button 
          on:click={clearPlayer}
          class="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-2"
        >
          <ArrowLeft class="w-4 h-4" />
          Back
        </button>
      {/if}
    </div>
  </div>
  
  {#if !player && !loading}
    <!-- Search Form -->
    <div class="glass-card p-8" in:fade>
      <div class="max-w-md mx-auto">
        <h2 class="text-xl font-semibold mb-4">Search for a Player</h2>
        <p class="text-sm text-slate-600 dark:text-slate-400 mb-6">
          Enter a player ID to view their profile. You can find player IDs from the Top Scorers page.
        </p>
        
        <form on:submit|preventDefault={handleSearch} class="space-y-4">
          <div>
            <label for="playerId" class="block text-sm font-medium mb-2">
              Player ID
            </label>
            <input 
              id="playerId"
              type="text" 
              bind:value={searchId}
              placeholder="e.g., 44"
              class="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
            />
          </div>
          
          <button 
            type="submit"
            class="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
            disabled={loading}
          >
            {loading ? 'Searching...' : 'Search Player'}
          </button>
        </form>
        
        {#if error}
          <div class="mt-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
            {error}
          </div>
        {/if}
      </div>
    </div>
  {/if}
  
  {#if loading}
    <div class="flex items-center justify-center py-12">
      <div class="loading-spinner"></div>
    </div>
  {/if}
  
  {#if player}
    <div in:fly={{ y: 20, duration: 300 }}>
      <!-- Player Card -->
      <div class="glass-card p-8 mb-6">
        <div class="flex flex-col sm:flex-row gap-6">
          <!-- Player Avatar -->
          <div class="flex-shrink-0">
            <div class="w-32 h-32 bg-gradient-to-br {getPositionColor(player.position)} rounded-2xl flex items-center justify-center">
              <span class="text-4xl font-bold text-white">
                {player.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
          </div>
          
          <!-- Player Info -->
          <div class="flex-grow">
            <h2 class="text-3xl font-bold mb-2">{player.name}</h2>
            <div class="flex flex-wrap gap-4 mb-4">
              <span class="px-3 py-1 bg-gradient-to-r {getPositionColor(player.position)} text-white rounded-full text-sm font-medium">
                {player.position}
              </span>
              {#if player.shirtNumber}
                <span class="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-sm font-medium flex items-center gap-1">
                  <Hash class="w-3 h-3" />
                  {player.shirtNumber}
                </span>
              {/if}
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="flex items-center gap-2">
                <Flag class="w-4 h-4 text-slate-500" />
                <span class="text-slate-600 dark:text-slate-400">Nationality:</span>
                <span class="font-medium">{player.nationality}</span>
              </div>
              
              <div class="flex items-center gap-2">
                <Calendar class="w-4 h-4 text-slate-500" />
                <span class="text-slate-600 dark:text-slate-400">Age:</span>
                <span class="font-medium">{calculateAge(player.dateOfBirth)} years</span>
              </div>
              
              <div class="flex items-center gap-2">
                <Calendar class="w-4 h-4 text-slate-500" />
                <span class="text-slate-600 dark:text-slate-400">Born:</span>
                <span class="font-medium">{new Date(player.dateOfBirth).toLocaleDateString()}</span>
              </div>
              
              <div class="flex items-center gap-2">
                <User class="w-4 h-4 text-slate-500" />
                <span class="text-slate-600 dark:text-slate-400">ID:</span>
                <span class="font-medium">#{player.id}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Additional Details -->
      <div class="glass-card p-6">
        <h3 class="text-lg font-semibold mb-4">Player Details</h3>
        <div class="space-y-3">
          <div class="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700">
            <span class="text-slate-600 dark:text-slate-400">Full Name</span>
            <span class="font-medium">{player.firstName} {player.lastName}</span>
          </div>
          <div class="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700">
            <span class="text-slate-600 dark:text-slate-400">Position</span>
            <span class="font-medium">{player.position}</span>
          </div>
          <div class="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700">
            <span class="text-slate-600 dark:text-slate-400">Last Updated</span>
            <span class="font-medium">{new Date(player.lastUpdated).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .glass-card {
    @apply bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-xl shadow-lg border border-slate-200 dark:border-slate-700;
  }
  
  .gradient-text {
    @apply bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent;
  }
  
  .loading-spinner {
    @apply w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin;
  }
</style>