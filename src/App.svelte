<script lang="ts">
  import Header from './components/Header.svelte';
  import Sidebar from './components/Sidebar.svelte';
  import MobileNav from './components/MobileNav.svelte';
  import Footer from './components/Footer.svelte';
  import Dashboard from './components/Dashboard.svelte';
  import QueryBuilder from './components/QueryBuilder.svelte';
  import AiAssistant from './components/AiAssistant.svelte';
  import Settings from './components/Settings.svelte';
  import OpenAISetupWizard from './components/OpenAISetupWizard.svelte';
  import Help from './components/Help.svelte';
  import { onMount } from 'svelte';

  let currentView = 'Dashboard'; // Default view
  let isSidebarOpen = false; // Start with sidebar closed
  let isTransitioning = false;
  let showOpenAISetup = false;
  let hasOpenAIKey = false;
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
    // Keep sidebar closed by default for cleaner initial view
    // User can open it manually if needed

    // Check for OpenAI API key in localStorage
    const openAIKey = localStorage.getItem('openai_api_key');
    hasOpenAIKey = !!openAIKey;

    // Show setup wizard if no OpenAI key found
    if (!hasOpenAIKey) {
      showOpenAISetup = true;
    }
  });


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

    <main class="flex-1 overflow-x-hidden overflow-y-auto bg-white dark:bg-slate-950 p-4 sm:p-6 lg:p-8 pb-20 md:pb-4 relative">
      <!-- Page transition overlay -->
      {#if isTransitioning}
        <div class="absolute inset-0 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm z-50 transition-opacity duration-200 animate-fadeIn"></div>
      {/if}
      
      <!-- Page content with smooth transitions -->
      <div class="page-content" class:transitioning={isTransitioning}>
        {#if currentView === 'Dashboard'}
          <Dashboard bind:this={dashboardComponent} />
        {:else if currentView === 'Query Builder'}
          <QueryBuilder on:navigate={navigate} />
        {:else if currentView === 'AI Assistant'}
          <AiAssistant on:navigate={navigate} />
        {:else if currentView === 'Settings'}
          <Settings />
        {:else if currentView === 'Help'}
          <Help />
        {/if}
      </div>
    </main>

    <!-- Footer -->
    <Footer />
  </div>

  <!-- Mobile Navigation -->
  <MobileNav {currentView} on:navigate={navigate} />

  <!-- OpenAI Setup Wizard -->
  {#if showOpenAISetup}
    <OpenAISetupWizard
      on:complete={() => {
        showOpenAISetup = false;
        hasOpenAIKey = true;
      }}
      on:skip={() => {
        showOpenAISetup = false;
      }}
    />
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