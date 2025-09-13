<script lang="ts">
  import Header from './components/Header.svelte';
  import Sidebar from './components/Sidebar.svelte';
  import MobileNav from './components/MobileNav.svelte';
  import Dashboard from './components/Dashboard.svelte';
  import MatchList from './components/MatchList.svelte';
  import QueryBuilder from './components/QueryBuilder.svelte';
  import PatternDiscovery from './components/PatternDiscovery.svelte';
  import AiAssistant from './components/AiAssistant.svelte';
  import LiveTicker from './components/LiveTicker.svelte';
  import SeasonStats from './components/SeasonStats.svelte';
  import Settings from './components/Settings.svelte';
  import ApiSetupWizard from './components/ApiSetupWizard.svelte';
  import Help from './components/Help.svelte';
  import TopScorers from './components/TopScorers.svelte';
  import LiveMatches from './components/LiveMatches.svelte';
  import PlayerProfile from './components/PlayerProfile.svelte';
  import VisualQueryBuilder from './components/VisualQueryBuilder.svelte';
  import { onMount } from 'svelte';

  let currentView = 'Dashboard'; // Default view
  let isSidebarOpen = false; // Start with sidebar closed
  let isTransitioning = false;
  let showApiSetup = false;
  let hasApiKey = false;
  let dashboardComponent: Dashboard;
  
  function navigate(event: CustomEvent<{ view: string }>) {
    if (event.detail.view === currentView) return;
    
    isTransitioning = true;
    setTimeout(() => {
      currentView = event.detail.view;
      setTimeout(() => {
        isTransitioning = false;
      }, 50);
    }, 200);
  }

  function toggleSidebar() {
    isSidebarOpen = !isSidebarOpen;
  }

  onMount(() => {
    // Open sidebar only on large desktop screens
    if (window.innerWidth >= 1024) { // Large desktop screens
      isSidebarOpen = true;
    }
    
    // Check for API key on load
    checkApiKey();
  });

  function checkApiKey() {
    const apiKey = localStorage.getItem('football_data_api_key');
    hasApiKey = !!apiKey;
    
    // Disabled for testing - using Supabase instead of Football-Data API
    // Show setup wizard if no API key found
    // if (!hasApiKey) {
    //   showApiSetup = true;
    // }
  }

  async function handleApiSetupComplete(event: CustomEvent<{ apiKey: string }>) {
    hasApiKey = true;
    showApiSetup = false;
    
    // Refresh data services with new API key
    const { dataService } = await import('./services/dataService');
    const { footballDataAPI } = await import('./services/api/footballData');
    
    // Set the API key in the Football Data API
    footballDataAPI.setApiKey(event.detail.apiKey);
    
    // Refresh data source availability
    await dataService.refreshDataSources();
    
    console.log('✅ API key setup completed successfully');
    
    // Refresh dashboard if it's currently loaded
    if (currentView === 'Dashboard' && dashboardComponent) {
      setTimeout(() => {
        dashboardComponent.refresh();
      }, 100);
    }
  }

</script>

<!-- Animated Background with Particles -->
<div class="animated-bg">
  {#each Array(15) as _, i}
    <div 
      class="particle" 
      style="
        left: {Math.random() * 100}%;
        width: {Math.random() * 4 + 2}px;
        height: {Math.random() * 4 + 2}px;
        animation-delay: {Math.random() * 20}s;
        animation-duration: {Math.random() * 20 + 20}s;
      "
    ></div>
  {/each}
</div>

<div class="flex h-screen bg-white/90 dark:bg-slate-950/90 text-slate-800 dark:text-slate-200 overflow-hidden relative">
  <Sidebar bind:isOpen={isSidebarOpen} currentView={currentView} on:navigate={navigate} on:closeSidebar={() => isSidebarOpen = false} />

  <div class="flex-1 flex flex-col overflow-hidden">
    <Header toggleSidebar={toggleSidebar} />
    <LiveTicker />

    <main class="flex-1 overflow-x-hidden overflow-y-auto bg-white dark:bg-slate-950 p-4 sm:p-6 lg:p-8 relative">
      <!-- Page transition overlay -->
      {#if isTransitioning}
        <div class="absolute inset-0 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm z-50 transition-opacity duration-200 animate-fadeIn"></div>
      {/if}
      
      <!-- Page content with smooth transitions -->
      <div class="page-content" class:transitioning={isTransitioning}>
        {#if currentView === 'Dashboard'}
          <Dashboard bind:this={dashboardComponent} />
        {:else if currentView === 'Matches'}
          <MatchList />
        {:else if currentView === 'Query Builder'}
          <QueryBuilder />
        {:else if currentView === 'Pattern Discovery'}
          <PatternDiscovery />
        {:else if currentView === 'SQL Explorer'}
          <VisualQueryBuilder />
        {:else if currentView === 'AI Assistant'}
          <AiAssistant />
        {:else if currentView === 'Season Stats'}
          <SeasonStats />
        {:else if currentView === 'Settings'}
          <Settings />
        {:else if currentView === 'Help'}
          <Help />
        {:else if currentView === 'Top Scorers'}
          <TopScorers />
        {:else if currentView === 'Live Matches'}
          <LiveMatches />
        {:else if currentView === 'Player Profile'}
          <PlayerProfile />
        {/if}
      </div>
    </main>
  </div>
  
  <!-- Mobile Navigation -->
  <MobileNav {currentView} on:navigate={navigate} />
  
  <!-- Floating Action Buttons -->
  <div class="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
    <!-- Query Builder FAB -->
    <button 
      class="fab-button group"
      on:click={() => navigate(new CustomEvent('navigate', {detail: {view: 'Query Builder'}}))}
      aria-label="Query Builder"
    >
      <div class="fab-icon">🔍</div>
      <div class="fab-tooltip">Query Builder</div>
    </button>
    
    <!-- AI Assistant FAB -->
    <button 
      class="fab-button group"
      on:click={() => navigate(new CustomEvent('navigate', {detail: {view: 'AI Assistant'}}))}
      aria-label="AI Assistant"
    >
      <div class="fab-icon">🤖</div>
      <div class="fab-tooltip">AI Assistant</div>
    </button>
    
    <!-- Live Status Indicator -->
    <div class="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg">
      <div class="w-3 h-3 bg-white rounded-full live-pulse"></div>
    </div>
  </div>

  <!-- API Setup Wizard -->
  {#if showApiSetup}
    <ApiSetupWizard on:complete={handleApiSetupComplete} />
  {/if}
</div>

<style global lang="postcss">
  /* Page transition effects */
  .page-content {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    transform: translateY(0) scale(1);
    opacity: 1;
  }
  
  .page-content.transitioning {
    transform: translateY(10px) scale(0.98);
    opacity: 0.7;
  }
</style>