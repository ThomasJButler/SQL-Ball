<script lang="ts">
  import { LayoutDashboard, BarChart3, Bot, Settings, LogOut, Search, FileText, HelpCircle, Sparkles } from 'lucide-svelte';
  import { createEventDispatcher } from 'svelte';

  export let currentView: string;
  export let isOpen: boolean;

  const dispatch = createEventDispatcher();
  
  function closeSidebar() {
    dispatch('closeSidebar');
  }

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, view: 'Dashboard' },
    { name: 'Query Builder', icon: Search, view: 'Query Builder' },
    // { name: 'Pattern Discovery', icon: Sparkles, view: 'Pattern Discovery' },
    // { name: 'Season Stats', icon: BarChart3, view: 'Season Stats' },
    { name: 'AI Assistant', icon: Bot, view: 'AI Assistant' },
  ];

  const bottomNavItems = [
    { name: 'Help', icon: HelpCircle, view: 'Help' },
    { name: 'Settings', icon: Settings, view: 'Settings' },
    { name: 'Logout', icon: LogOut, view: 'Logout' },
  ];

  function handleNavClick(view: string) {
    dispatch('navigate', { view });
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 768) {
      closeSidebar();
    }
  }
</script>

<aside class="sidebar-container {isOpen ? 'translate-x-0' : '-translate-x-full'}">
  <nav class="flex flex-col h-full">
    <!-- Sidebar Header with Logo -->
    <div class="px-4 py-6 border-b border-slate-200 dark:border-slate-700">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center">
            <img src="/football.svg" alt="SQL Ball" class="w-8 h-8" />
          </div>
          <div>
            <h2 class="text-sm font-semibold text-slate-900 dark:text-white">SQL-Ball</h2>
            <p class="text-xs text-slate-500 dark:text-slate-400">Analytics</p>
          </div>
        </div>
        <!-- Close Button -->
        <button 
          class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          on:click={closeSidebar}
          aria-label="Close menu"
        >
          <svg class="w-5 h-5 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
    
    <div class="flex-grow space-y-2 px-3 pt-4">
      {#each navItems as item}
        <button
          class="nav-item {currentView === item.view ? 'nav-item-active' : ''}"
          on:click={() => handleNavClick(item.view)}
        >
          <svelte:component this={item.icon} class="w-5 h-5 mr-3 flex-shrink-0" />
          <span>{item.name}</span>
        </button>
      {/each}
    </div>
    <div class="pb-4 space-y-2">
      {#each bottomNavItems as item}
        <button
          class="nav-item {currentView === item.view ? 'nav-item-active' : ''}"
          on:click={() => handleNavClick(item.view)}
        >
          <svelte:component this={item.icon} class="w-5 h-5 mr-3 flex-shrink-0" />
          <span>{item.name}</span>
        </button>
      {/each}
    </div>
  </nav>
</aside>

<!-- Sidebar backdrop -->
{#if isOpen}
  <div class="fixed inset-0 bg-black/30 z-30 backdrop-blur-sm transition-opacity duration-300" on:click={closeSidebar} aria-hidden="true"></div>
{/if}