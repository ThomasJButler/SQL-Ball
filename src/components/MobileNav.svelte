<script lang="ts">
  import { LayoutDashboard, Search, Settings, Bot, HelpCircle } from 'lucide-svelte';
  import { createEventDispatcher } from 'svelte';

  export let currentView: string;

  const dispatch = createEventDispatcher();

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, view: 'Dashboard' },
    { name: 'Query', icon: Search, view: 'Query Builder' },
    { name: 'Settings', icon: Settings, view: 'Settings' },
    { name: 'AI Assistant', icon: Bot, view: 'AI Assistant' },
    { name: 'Help', icon: HelpCircle, view: 'Help' },
  ];

  function handleNavClick(view: string) {
    dispatch('navigate', { view });
  }
</script>

<nav class="mobile-nav">
  <div class="flex justify-around items-center">
    {#each navItems as item}
      <button
        class="mobile-nav-item {currentView === item.view ? 'mobile-nav-item-active' : ''}"
        on:click={() => handleNavClick(item.view)}
      >
        <svelte:component this={item.icon} class="w-5 h-5 mb-1" />
        <span>{item.name}</span>
      </button>
    {/each}
  </div>
</nav>