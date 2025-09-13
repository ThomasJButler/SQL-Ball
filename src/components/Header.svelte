<script lang="ts">
  import { Sun, Moon, Github, Menu, Search, User, LogOut, Settings, Bell } from 'lucide-svelte';
  import { createEventDispatcher } from 'svelte';

  export let toggleSidebar: () => void;
  
  const dispatch = createEventDispatcher();
  
  let isDarkMode = false;
  let isSearchOpen = false;
  let searchQuery = '';
  let isUserMenuOpen = false;

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
      isSearchOpen = false;
    }
  }

  function handleUserAction(action: string) {
    dispatch('userAction', { action });
    isUserMenuOpen = false;
  }

  function handleSearchKeydown(event: CustomEvent<any> & { target: any }) {
    const keyboardEvent = event as unknown as KeyboardEvent;
    if (keyboardEvent.key === 'Enter') {
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

<header class="header-container">
  <div class="flex items-center">
    <button 
      on:click={toggleSidebar} 
      class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors mr-2"
      aria-label="Toggle menu"
    >
      <Menu class="w-6 h-6 text-slate-600 dark:text-slate-300" />
    </button>
    <div class="flex items-center space-x-2">
      <img src="/vite.svg" alt="Logo" class="h-8 w-8" />
      <span class="text-xl font-bold gradient-text">Premier League Oracle</span>
    </div>
  </div>

  <div class="flex items-center space-x-3">
    <!-- Search Bar -->
    <div class="relative hidden sm:block">
      {#if isSearchOpen}
        <div class="absolute right-0 top-0 flex items-center">
          <input
            type="text"
            bind:value={searchQuery}
            on:keydown={handleSearchKeydown}
            on:blur={() => setTimeout(() => isSearchOpen = false, 200)}
            placeholder="Search teams, matches..."
            class="w-64 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
          />
          <button on:click={handleSearch} class="absolute right-2 p-1">
            <Search class="w-4 h-4 text-slate-400" />
          </button>
        </div>
      {:else}
        <button on:click={() => isSearchOpen = true} class="btn btn-ghost btn-icon" aria-label="Search">
          <Search class="w-5 h-5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors" />
        </button>
      {/if}
    </div>

    <!-- Notifications with enhanced live indicator -->
    <button class="btn btn-ghost btn-icon relative group" aria-label="Notifications">
      <Bell class="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-all duration-200" />
      <span class="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-red-500 to-orange-500 rounded-full live-pulse shadow-lg"></span>
      <span class="absolute -top-0.5 -right-0.5 w-2 h-2 bg-white dark:bg-slate-900 rounded-full"></span>
      <!-- Tooltip -->
      <div class="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 p-3 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50">
        <p class="text-xs text-slate-600 dark:text-slate-400">3 new predictions available</p>
        <p class="text-xs text-slate-500 dark:text-slate-500 mt-1">Live data updating...</p>
      </div>
    </button>

    <a href="https://github.com/ThomasJButler/The-Premier-League-Oracle" target="_blank" rel="noopener noreferrer" class="btn btn-ghost btn-icon" aria-label="GitHub Repository">
      <Github class="w-5 h-5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors" />
    </a>
    
    <button on:click={toggleTheme} class="btn btn-ghost btn-icon" aria-label="Toggle theme">
      {#if isDarkMode}
        <Sun class="w-5 h-5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors" />
      {:else}
        <Moon class="w-5 h-5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors" />
      {/if}
    </button>
    
    <!-- User Menu -->
    <div class="relative">
      <button 
        on:click={() => isUserMenuOpen = !isUserMenuOpen}
        class="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-semibold text-white hover:shadow-lg transition-shadow"
      >
        TB
      </button>
      
      {#if isUserMenuOpen}
        <!-- Backdrop -->
        <button 
          class="fixed inset-0 z-10 bg-transparent cursor-default" 
          on:click={() => isUserMenuOpen = false}
          aria-label="Close user menu"
          tabindex="-1"
        ></button>
        
        <!-- Dropdown -->
        <div class="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-1 z-20 animate-fadeIn">
          <div class="px-4 py-2 border-b border-slate-200 dark:border-slate-700">
            <p class="text-sm font-medium text-slate-900 dark:text-white">Tom Butler</p>
            <p class="text-xs text-slate-500 dark:text-slate-400">tom@example.com</p>
          </div>
          
          <button 
            on:click={() => handleUserAction('profile')}
            class="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center space-x-2"
          >
            <User class="w-4 h-4" />
            <span>Profile</span>
          </button>
          
          <button 
            on:click={() => handleUserAction('settings')}
            class="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center space-x-2"
          >
            <Settings class="w-4 h-4" />
            <span>Settings</span>
          </button>
          
          <div class="border-t border-slate-200 dark:border-slate-700 my-1"></div>
          
          <button 
            on:click={() => handleUserAction('logout')}
            class="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 flex items-center space-x-2"
          >
            <LogOut class="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      {/if}
    </div>
  </div>
</header>