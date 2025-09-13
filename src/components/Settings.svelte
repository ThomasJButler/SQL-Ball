<script lang="ts">
  import { Settings as SettingsIcon, Key, Database, RefreshCw, CheckCircle, AlertCircle, Wifi, WifiOff } from 'lucide-svelte';
  import { footballDataAPI } from '../services/api/footballData';
  import { dataService } from '../services/dataService';
  import { aiService } from '../services/aiService';
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  
  let footballDataKey = '';
  let apiConnected = false;
  let testing = false;
  let testResult: { success: boolean; message: string } | null = null;
  let dataSource: 'api' | 'database' = 'api';
  let cacheSize = '0 MB';
  let lastSync = 'Never';
  
  // AI Settings
  let showAISettings = false;
  let aiProvider: 'openai' | 'anthropic' = 'openai';
  let aiApiKey = '';
  let aiModel = 'gpt-4-turbo-preview';
  let hasAIKey = false;
  
  async function testAPIConnection() {
    testing = true;
    testResult = null;
    
    try {
      const isConnected = await footballDataAPI.testConnection();
      
      if (isConnected) {
        testResult = {
          success: true,
          message: 'Successfully connected to Football-Data.org API!'
        };
        apiConnected = true;
        localStorage.setItem('football_data_api_connected', 'true');
      } else {
        testResult = {
          success: false,
          message: 'Failed to connect. Please check your API key. Note: Custom API keys may experience CORS restrictions in browsers.'
        };
        apiConnected = false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('CORS') || errorMessage.includes('fetch')) {
        testResult = {
          success: false,
          message: 'CORS restriction detected. Your API key is saved but direct browser testing is limited. The app will still work for data fetching.'
        };
      } else {
        testResult = {
          success: false,
          message: `Error: ${errorMessage}`
        };
      }
      apiConnected = false;
    } finally {
      testing = false;
    }
  }
  
  function saveFootballDataKey() {
    if (footballDataKey.trim()) {
      footballDataAPI.setApiKey(footballDataKey);
      localStorage.setItem('football_data_api_key', footballDataKey);
      testAPIConnection();
    }
  }
  
  function saveAISettings() {
    if (aiApiKey.trim()) {
      aiService.setApiKey(aiApiKey, aiProvider, aiModel);
      hasAIKey = true;
      testResult = {
        success: true,
        message: `AI settings saved! Using ${aiProvider === 'openai' ? 'OpenAI' : 'Anthropic'} ${aiModel}`
      };
    }
  }
  
  function clearAIKey() {
    aiService.clearApiKey();
    aiApiKey = '';
    hasAIKey = false;
    testResult = {
      success: true,
      message: 'AI API key cleared'
    };
  }
  
  async function clearCache() {
    await dataService.clearCache();
    cacheSize = '0 MB';
    testResult = {
      success: true,
      message: 'Cache cleared successfully'
    };
  }
  
  function switchDataSource(source: 'api' | 'database') {
    dataSource = source;
    // Only set API source since database is no longer supported
    if (source === 'api') {
      dataService.setDataSource(source);
    }
    localStorage.setItem('data_source', source);
  }
  
  async function syncData() {
    testing = true;
    try {
      // This would trigger a full data sync
      await dataService.getMatches({ recent: true, days: 30 });
      lastSync = new Date().toLocaleString('en-GB');
      localStorage.setItem('last_sync', lastSync);
      testResult = {
        success: true,
        message: 'Data synchronised successfully'
      };
    } catch (error) {
      testResult = {
        success: false,
        message: 'Sync failed. Please try again.'
      };
    } finally {
      testing = false;
    }
  }
  
  onMount(() => {
    // Load saved settings
    const savedFootballKey = localStorage.getItem('football_data_api_key');
    if (savedFootballKey) {
      footballDataKey = savedFootballKey;
      footballDataAPI.setApiKey(savedFootballKey);
      testAPIConnection();
    }
    
    // Check AI settings
    hasAIKey = aiService.hasApiKey();
    const savedProvider = localStorage.getItem('ai_provider');
    const savedModel = localStorage.getItem('ai_model');
    if (savedProvider) aiProvider = savedProvider as 'openai' | 'anthropic';
    if (savedModel) aiModel = savedModel;
    
    // Load data source preference
    const savedDataSource = localStorage.getItem('data_source');
    if (savedDataSource) {
      dataSource = savedDataSource as 'api' | 'database';
    }
    
    // Load last sync time
    const savedLastSync = localStorage.getItem('last_sync');
    if (savedLastSync) {
      lastSync = savedLastSync;
    }
    
    // Check cache size (mock calculation)
    const cacheEntries = localStorage.length;
    cacheSize = `${(cacheEntries * 0.005).toFixed(2)} MB`;
  });
</script>

<div class="settings-container max-w-4xl mx-auto">
  <!-- Header -->
  <div class="bg-gradient-to-r from-slate-500/10 to-slate-600/10 dark:from-slate-500/20 dark:to-slate-600/20 rounded-xl p-6 mb-6">
    <div class="flex items-center space-x-3">
      <div class="p-3 bg-gradient-to-br from-slate-500 to-slate-600 rounded-lg">
        <SettingsIcon class="w-8 h-8 text-white" />
      </div>
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p class="text-sm text-slate-600 dark:text-slate-400">
          Configure API keys, data sources, and preferences
        </p>
      </div>
    </div>
  </div>
  
  <!-- Football-Data API Settings -->
  <div class="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 mb-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
        <Key class="w-5 h-5 text-primary" />
        <span>Football-Data.org API</span>
      </h2>
      {#if apiConnected}
        <span class="flex items-center space-x-1 text-green-600 dark:text-green-400 text-sm">
          <Wifi class="w-4 h-4" />
          <span>Connected</span>
        </span>
      {:else}
        <span class="flex items-center space-x-1 text-slate-500 dark:text-slate-400 text-sm">
          <WifiOff class="w-4 h-4" />
          <span>Not Connected</span>
        </span>
      {/if}
    </div>
    
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          API Key
        </label>
        <div class="flex space-x-2">
          <input
            type="password"
            bind:value={footballDataKey}
            placeholder="Enter your Football-Data.org API key"
            class="flex-1 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button
            on:click={saveFootballDataKey}
            disabled={!footballDataKey.trim() || testing}
            class="btn btn-primary disabled:opacity-50"
          >
            Save
          </button>
          <button
            on:click={testAPIConnection}
            disabled={!footballDataKey.trim() || testing}
            class="btn btn-secondary disabled:opacity-50"
          >
            {#if testing}
              <RefreshCw class="w-4 h-4 animate-spin" />
            {:else}
              Test
            {/if}
          </button>
        </div>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-2">
          Get your free API key from: 
          <a href="https://www.football-data.org/client/register" target="_blank" class="text-primary hover:underline">
            football-data.org/client/register
          </a>
        </p>
      </div>
      
      {#if testResult}
        <div 
          class="p-3 rounded-lg flex items-center space-x-2 {
            testResult.success 
              ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300' 
              : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'
          }"
          transition:fade
        >
          {#if testResult.success}
            <CheckCircle class="w-5 h-5" />
          {:else}
            <AlertCircle class="w-5 h-5" />
          {/if}
          <span class="text-sm">{testResult.message}</span>
        </div>
      {/if}
    </div>
  </div>
  
  <!-- Data Source Settings -->
  <div class="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 mb-6">
    <h2 class="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2 mb-4">
      <Database class="w-5 h-5 text-primary" />
      <span>Data Source</span>
    </h2>
    
    <div class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <button
          on:click={() => switchDataSource('api')}
          class="p-4 rounded-lg border-2 transition-all {
            dataSource === 'api'
              ? 'border-primary bg-primary/10'
              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
          }"
        >
          <Wifi class="w-6 h-6 mb-2 {dataSource === 'api' ? 'text-primary' : 'text-slate-500'}" />
          <h3 class="font-semibold text-slate-900 dark:text-white">API Mode</h3>
          <p class="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Live data from Football-Data.org
          </p>
        </button>
        
        <button
          on:click={() => switchDataSource('database')}
          class="p-4 rounded-lg border-2 transition-all {
            dataSource === 'database'
              ? 'border-primary bg-primary/10'
              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
          }"
        >
          <Database class="w-6 h-6 mb-2 {dataSource === 'database' ? 'text-primary' : 'text-slate-500'}" />
          <h3 class="font-semibold text-slate-900 dark:text-white">Database Mode</h3>
          <p class="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Cached data from Supabase
          </p>
        </button>
      </div>
      
      <div class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
        <div>
          <p class="text-sm font-medium text-slate-700 dark:text-slate-300">Cache Size</p>
          <p class="text-xs text-slate-600 dark:text-slate-400">{cacheSize}</p>
        </div>
        <button
          on:click={clearCache}
          class="btn btn-sm btn-secondary"
        >
          Clear Cache
        </button>
      </div>
      
      <div class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
        <div>
          <p class="text-sm font-medium text-slate-700 dark:text-slate-300">Last Sync</p>
          <p class="text-xs text-slate-600 dark:text-slate-400">{lastSync}</p>
        </div>
        <button
          on:click={syncData}
          disabled={testing}
          class="btn btn-sm btn-primary disabled:opacity-50"
        >
          {#if testing}
            <RefreshCw class="w-4 h-4 animate-spin" />
          {:else}
            Sync Now
          {/if}
        </button>
      </div>
    </div>
  </div>
  
  <!-- AI Settings -->
  <div class="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-bold text-slate-900 dark:text-white">AI Assistant Settings</h2>
      {#if hasAIKey}
        <span class="text-sm text-green-600 dark:text-green-400">Configured</span>
      {/if}
    </div>
    
    <button
      on:click={() => showAISettings = !showAISettings}
      class="btn btn-secondary w-full"
    >
      {showAISettings ? 'Hide' : 'Show'} AI Settings
    </button>
    
    {#if showAISettings}
      <div class="mt-4 space-y-4" transition:fade>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Provider
          </label>
          <div class="grid grid-cols-2 gap-2">
            <button
              on:click={() => aiProvider = 'openai'}
              class="px-3 py-2 rounded-lg border {
                aiProvider === 'openai'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-slate-200 dark:border-slate-700'
              }"
            >
              OpenAI
            </button>
            <button
              on:click={() => aiProvider = 'anthropic'}
              class="px-3 py-2 rounded-lg border {
                aiProvider === 'anthropic'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-slate-200 dark:border-slate-700'
              }"
            >
              Anthropic
            </button>
          </div>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Model
          </label>
          <select
            bind:value={aiModel}
            class="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
          >
            {#if aiProvider === 'openai'}
              <option value="gpt-4-turbo-preview">GPT-4 Turbo</option>
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            {:else}
              <option value="claude-3-opus-20240229">Claude 3 Opus</option>
              <option value="claude-3-sonnet-20240229">Claude 3 Sonnet</option>
              <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
            {/if}
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            API Key
          </label>
          <input
            type="password"
            bind:value={aiApiKey}
            placeholder={aiProvider === 'openai' ? 'sk-...' : 'sk-ant-...'}
            class="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
          />
        </div>
        
        <div class="flex space-x-2">
          <button
            on:click={saveAISettings}
            disabled={!aiApiKey.trim()}
            class="btn btn-primary flex-1 disabled:opacity-50"
          >
            Save AI Settings
          </button>
          {#if hasAIKey}
            <button
              on:click={clearAIKey}
              class="btn btn-secondary"
            >
              Clear
            </button>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</div>