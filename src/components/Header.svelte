<script lang="ts">
  import { Sun, Moon, Github, Menu, Search } from 'lucide-svelte';
  import { createEventDispatcher } from 'svelte';

  export let toggleSidebar: () => void;

  const dispatch = createEventDispatcher();

  let isDarkMode = false;
  let searchQuery = '';

  function toggleTheme() {
    isDarkMode = !isDarkMode;
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    dispatch('toggleDarkMode');
  }

  function handleSearch() {
    if (searchQuery.trim()) {
      dispatch('search', { query: searchQuery });
      searchQuery = '';
    }
  }

  function handleSearchKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      handleSearch();
    }
  }

  // Initialize theme based on saved preference
  if (typeof window !== 'undefined') {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (savedTheme === null && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      isDarkMode = true;
      document.documentElement.classList.add('dark');
    }
  }
</script>

<header class="header-container bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3">
  <div class="flex items-center justify-between">
    <!-- Left side -->
    <div class="flex items-center gap-4">
      <button
        on:click={toggleSidebar}
        class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        aria-label="Toggle menu"
      >
        <Menu class="w-6 h-6 text-slate-600 dark:text-slate-300" />
      </button>

      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
          <span class="text-white font-bold text-lg">SB</span>
        </div>
        <div>
          <h1 class="text-xl font-bold text-slate-900 dark:text-white">SQL-Ball</h1>
          <p class="text-xs text-slate-500 dark:text-slate-400">Football Analytics Platform</p>
        </div>
      </div>
    </div>

    <!-- Right side -->
    <div class="flex items-center gap-2">
      <!-- Search Bar -->
      <div class="relative hidden sm:flex items-center">
        <input
          type="text"
          bind:value={searchQuery}
          on:keydown={handleSearchKeydown}
          placeholder="Search teams, players..."
          class="w-64 px-4 py-2 pr-10 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
        />
        <button
          on:click={handleSearch}
          class="absolute right-2 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
          aria-label="Search"
        >
          <Search class="w-4 h-4 text-slate-400" />
        </button>
      </div>

      <!-- Mobile search button -->
      <button
        class="sm:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        aria-label="Search"
      >
        <Search class="w-5 h-5 text-slate-600 dark:text-slate-400" />
      </button>

      <!-- GitHub Link -->
      <a
        href="https://github.com/ThomasJButler/SQL-Ball"
        target="_blank"
        rel="noopener noreferrer"
        class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        aria-label="GitHub Repository"
      >
        <Github class="w-5 h-5 text-slate-600 dark:text-slate-400" />
      </a>

      <!-- Theme Toggle -->
      <button
        on:click={toggleTheme}
        class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        aria-label="Toggle theme"
      >
        {#if isDarkMode}
          <Sun class="w-5 h-5 text-slate-600 dark:text-slate-400" />
        {:else}
          <Moon class="w-5 h-5 text-slate-600 dark:text-slate-400" />
        {/if}
      </button>
    </div>
  </div>
</header>

<style>
  .header-container {
    position: sticky;
    top: 0;
    z-index: 40;
    backdrop-filter: blur(8px);
    background-color: rgba(255, 255, 255, 0.9);
  }

  :global(.dark) .header-container {
    background-color: rgba(15, 23, 42, 0.9);
  }
</style>