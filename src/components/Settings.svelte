<script lang="ts">
  import { Key, Save, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-svelte';
  let openAIKey = '';
  let showOpenAIKey = false;
  let saveStatus = '';
  let errorMessage = '';

  // Load existing API key on mount
  function loadSettings() {
    const savedOpenAIKey = localStorage.getItem('openai_api_key');
    if (savedOpenAIKey) {
      openAIKey = savedOpenAIKey;
    }
  }

  function saveSettings() {
    saveStatus = '';
    errorMessage = '';

    if (!openAIKey) {
      errorMessage = 'Please enter an OpenAI API key';
      return;
    }

    // Validate OpenAI key format
    if (!openAIKey.startsWith('sk-')) {
      errorMessage = 'OpenAI API key should start with "sk-"';
      return;
    }

    // Save to localStorage
    localStorage.setItem('openai_api_key', openAIKey);
    saveStatus = 'Settings saved successfully!';

    // Clear success message after 3 seconds
    setTimeout(() => {
      saveStatus = '';
    }, 3000);
  }

  function clearOpenAIKey() {
    if (confirm('Are you sure you want to remove your OpenAI API key?')) {
      localStorage.removeItem('openai_api_key');
      openAIKey = '';
      saveStatus = 'OpenAI API key removed';
      setTimeout(() => {
        saveStatus = '';
      }, 3000);
    }
  }

  // Load settings on component mount
  loadSettings();
</script>

<div class="max-w-4xl mx-auto">
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-slate-900 dark:text-white mb-2">Settings</h1>
    <p class="text-slate-600 dark:text-slate-400">
      Configure your API keys and preferences
    </p>
  </div>

  <!-- OpenAI API Configuration -->
  <div class="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 p-6 mb-6">
    <div class="flex items-center gap-3 mb-6">
      <div class="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
        <Key class="w-5 h-5 text-white" />
      </div>
      <div>
        <h2 class="text-xl font-semibold text-slate-900 dark:text-white">OpenAI API Configuration</h2>
        <p class="text-sm text-slate-600 dark:text-slate-400">Required for AI-powered query generation</p>
      </div>
    </div>

    <div class="space-y-4">
      <div>
        <label for="openai-key" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          OpenAI API Key
        </label>
        <div class="relative">
          {#if showOpenAIKey}
            <input
              id="openai-key"
              type="text"
              bind:value={openAIKey}
              placeholder="sk-..."
              class="w-full px-4 py-3 pr-12 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          {:else}
            <input
              id="openai-key"
              type="password"
              bind:value={openAIKey}
              placeholder="sk-..."
              class="w-full px-4 py-3 pr-12 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          {/if}
          <button
            on:click={() => showOpenAIKey = !showOpenAIKey}
            class="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            aria-label={showOpenAIKey ? 'Hide API key' : 'Show API key'}
          >
            {#if showOpenAIKey}
              <EyeOff class="w-5 h-5" />
            {:else}
              <Eye class="w-5 h-5" />
            {/if}
          </button>
        </div>
        <p class="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" class="text-green-600 dark:text-green-400 hover:underline">OpenAI Platform</a>
        </p>
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-3 pt-4">
        <button
          on:click={saveSettings}
          class="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all flex items-center gap-2 shadow-lg"
        >
          <Save class="w-5 h-5" />
          Save Settings
        </button>

        {#if openAIKey}
          <button
            on:click={clearOpenAIKey}
            class="px-6 py-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 font-semibold rounded-lg hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors"
          >
            Remove Key
          </button>
        {/if}
      </div>

      <!-- Status Messages -->
      {#if saveStatus}
        <div class="mt-4 p-4 bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div class="flex items-center gap-2">
            <CheckCircle class="w-5 h-5 text-green-600 dark:text-green-400" />
            <p class="text-green-800 dark:text-green-300">{saveStatus}</p>
          </div>
        </div>
      {/if}

      {#if errorMessage}
        <div class="mt-4 p-4 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div class="flex items-center gap-2">
            <AlertCircle class="w-5 h-5 text-red-600 dark:text-red-400" />
            <p class="text-red-800 dark:text-red-300">{errorMessage}</p>
          </div>
        </div>
      {/if}
    </div>
  </div>

  <!-- About Section -->
  <div class="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
    <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-3">About SQL-Ball</h3>
    <p class="text-slate-600 dark:text-slate-400 mb-4">
      SQL-Ball is a RAG-powered football data analytics platform that converts natural language queries into SQL,
      discovers patterns in match data, and provides interactive data exploration.
    </p>
    <div class="space-y-2 text-sm text-slate-600 dark:text-slate-400">
      <p>• Built for the GenAI Bootcamp Contest #1</p>
      <p>• Focuses on historical data analysis</p>
      <p>• No prediction or betting features</p>
      <p>• MIT Licensed open-source project</p>
    </div>
  </div>
</div>