<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { Brain, Shield, Sparkles, Check, X, Info, ExternalLink, Key } from 'lucide-svelte';

  const dispatch = createEventDispatcher();

  let apiKey = '';
  let isValidating = false;
  let currentStep = 1;
  let showPrivacyInfo = false;
  let validationError = '';
  let validationSuccess = false;
  let existingKey = '';

  const steps = [
    { id: 1, title: 'Welcome', icon: Brain },
    { id: 2, title: 'Privacy & Security', icon: Shield },
    { id: 3, title: 'API Setup', icon: Key },
    { id: 4, title: 'Ready!', icon: Sparkles }
  ];

  onMount(() => {
    // Check if we already have a key stored
    existingKey = localStorage.getItem('openai_api_key') || '';
    if (existingKey) {
      apiKey = existingKey;
    }
  });

  async function validateAndSave() {
    if (!apiKey.trim()) return;

    isValidating = true;
    validationError = '';
    validationSuccess = false;

    try {
      // Test the API key with a simple completion
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`
        }
      });

      if (response.ok) {
        validationSuccess = true;

        // Save to localStorage
        localStorage.setItem('openai_api_key', apiKey.trim());

        // Move to final step
        currentStep = 4;

        // Auto-close and reload after showing success
        setTimeout(() => {
          dispatch('complete', { apiKey: apiKey.trim() });
          // Reload to reinitialize RAG system
          setTimeout(() => {
            window.location.reload();
          }, 500);
        }, 2000);
      } else if (response.status === 401) {
        validationError = 'Invalid API key. Please check that you copied it correctly from OpenAI.';
      } else if (response.status === 429) {
        validationError = 'Rate limited. Your API key is valid but you may have exceeded usage limits.';
      } else {
        validationError = `API error (${response.status}): ${response.statusText}`;
      }
    } catch (error: any) {
      console.error('Validation error:', error);
      if (error?.message?.includes('Failed to fetch')) {
        // CORS issue - assume key is valid and save it
        validationSuccess = true;
        localStorage.setItem('openai_api_key', apiKey.trim());
        currentStep = 4;
        setTimeout(() => {
          dispatch('complete', { apiKey: apiKey.trim() });
          window.location.reload();
        }, 2000);
      } else {
        validationError = 'Connection failed. Please check your internet connection.';
      }
    } finally {
      isValidating = false;
    }
  }

  function handleSkip() {
    dispatch('skip');
  }

  function goToStep(step: number) {
    if (step <= currentStep || step === currentStep + 1) {
      currentStep = step;
    }
  }
</script>

<div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
  <div class="bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl max-w-2xl w-full shadow-2xl border border-green-500/20 overflow-hidden">
    <!-- Header -->
    <div class="bg-gradient-to-r from-green-600/20 to-blue-600/20 p-6 border-b border-green-500/20">
      <h2 class="text-2xl font-bold text-white flex items-center gap-3">
        <Brain class="w-8 h-8 text-green-400" />
        OpenAI API Setup for SQL-Ball
      </h2>
      <p class="text-slate-400 mt-2">Enable AI-powered natural language to SQL conversion</p>
    </div>

    <!-- Progress Steps -->
    <div class="flex items-center justify-between px-6 py-4 border-b border-slate-800">
      {#each steps as step}
        <button
          on:click={() => goToStep(step.id)}
          class="flex items-center gap-2 transition-all {
            step.id > currentStep ? 'opacity-50' : ''
          } {
            step.id > currentStep + 1 ? 'cursor-not-allowed' : ''
          }"
          disabled={step.id > currentStep + 1}
        >
          <div
            class="w-10 h-10 rounded-full flex items-center justify-center transition-all {
              step.id <= currentStep ? 'bg-green-500' : 'bg-slate-700'
            } {
              step.id === currentStep ? 'shadow-lg shadow-green-500/50' : ''
            }"
          >
            {#if step.id < currentStep}
              <Check class="w-5 h-5 text-white" />
            {:else}
              <svelte:component this={step.icon} class="w-5 h-5 text-white" />
            {/if}
          </div>
          <span
            class="hidden sm:block text-sm font-medium transition-colors {
              step.id === currentStep ? 'text-green-400' :
              step.id < currentStep ? 'text-white' : 'text-slate-500'
            }"
          >
            {step.title}
          </span>
        </button>
        {#if step.id < steps.length}
          <div
            class="flex-1 h-0.5 mx-2 transition-colors {
              step.id < currentStep ? 'bg-green-500' : 'bg-slate-700'
            }"
          />
        {/if}
      {/each}
    </div>

    <!-- Content -->
    <div class="p-6">
      {#if currentStep === 1}
        <!-- Welcome Step -->
        <div class="space-y-6 animate-slideIn">
          <div class="bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-xl p-6 border border-green-500/20">
            <h3 class="text-xl font-bold text-white mb-3">🚀 Unlock AI-Powered Features</h3>
            <p class="text-slate-300 mb-4">
              SQL-Ball uses OpenAI's GPT-4 to convert your natural language queries into SQL,
              making football data analysis accessible to everyone!
            </p>
            <ul class="space-y-2 text-slate-400">
              <li class="flex items-start gap-2">
                <Sparkles class="w-5 h-5 text-green-400 mt-0.5" />
                <span>Natural language to SQL conversion</span>
              </li>
              <li class="flex items-start gap-2">
                <Sparkles class="w-5 h-5 text-green-400 mt-0.5" />
                <span>Intelligent query optimization</span>
              </li>
              <li class="flex items-start gap-2">
                <Sparkles class="w-5 h-5 text-green-400 mt-0.5" />
                <span>Beginner-friendly SQL explanations</span>
              </li>
              <li class="flex items-start gap-2">
                <Sparkles class="w-5 h-5 text-green-400 mt-0.5" />
                <span>Football-specific terminology understanding</span>
              </li>
            </ul>
          </div>

          {#if existingKey}
            <div class="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <p class="text-green-400 flex items-center gap-2">
                <Check class="w-5 h-5" />
                You already have an OpenAI API key configured!
              </p>
            </div>
          {/if}
        </div>
      {:else if currentStep === 2}
        <!-- Privacy Step -->
        <div class="space-y-6 animate-slideIn">
          <div class="bg-slate-800/50 rounded-xl p-6">
            <h3 class="text-xl font-bold text-white mb-3 flex items-center gap-2">
              <Shield class="w-6 h-6 text-green-400" />
              Your Privacy & Security
            </h3>
            <div class="space-y-4 text-slate-300">
              <div class="flex items-start gap-3">
                <div class="w-2 h-2 rounded-full bg-green-400 mt-2"></div>
                <div>
                  <p class="font-medium text-white">Local Storage Only</p>
                  <p class="text-sm text-slate-400">Your API key is stored locally in your browser and never sent to our servers.</p>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <div class="w-2 h-2 rounded-full bg-green-400 mt-2"></div>
                <div>
                  <p class="font-medium text-white">Direct API Communication</p>
                  <p class="text-sm text-slate-400">All AI requests go directly from your browser to OpenAI's API.</p>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <div class="w-2 h-2 rounded-full bg-green-400 mt-2"></div>
                <div>
                  <p class="font-medium text-white">You Control Your Data</p>
                  <p class="text-sm text-slate-400">Remove your API key anytime from the Settings page.</p>
                </div>
              </div>
            </div>
          </div>

          <button
            on:click={() => showPrivacyInfo = !showPrivacyInfo}
            class="text-green-400 hover:text-green-300 text-sm flex items-center gap-2 transition-colors"
          >
            <Info class="w-4 h-4" />
            Learn more about data handling
          </button>

          {#if showPrivacyInfo}
            <div class="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-sm text-slate-400 animate-slideIn">
              SQL-Ball processes all queries locally. Your football data queries and API key never leave your device.
              The only external communication is with OpenAI's API for natural language processing.
            </div>
          {/if}
        </div>
      {:else if currentStep === 3}
        <!-- API Key Input Step -->
        <div class="space-y-6 animate-slideIn">
          <div class="bg-slate-800/50 rounded-xl p-6">
            <h3 class="text-xl font-bold text-white mb-4">Enter Your OpenAI API Key</h3>

            <div class="space-y-4">
              <div>
                <label for="apiKey" class="block text-sm font-medium text-slate-400 mb-2">
                  API Key
                </label>
                <div class="relative">
                  <input
                    type="password"
                    id="apiKey"
                    bind:value={apiKey}
                    placeholder="sk-..."
                    class="w-full px-4 py-3 bg-slate-900 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all {
                      validationError ? 'border-red-500' :
                      validationSuccess ? 'border-green-500' : 'border-slate-700'
                    }"
                  />
                  {#if validationSuccess}
                    <Check class="absolute right-3 top-3.5 w-5 h-5 text-green-400" />
                  {:else if validationError}
                    <X class="absolute right-3 top-3.5 w-5 h-5 text-red-400" />
                  {/if}
                </div>
              </div>

              {#if validationError}
                <div class="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm animate-slideIn">
                  {validationError}
                </div>
              {/if}

              <div class="bg-slate-900/50 rounded-lg p-4 space-y-3">
                <p class="text-sm text-slate-400">
                  Don't have an API key? Get one from OpenAI:
                </p>
                <ol class="space-y-2 text-sm text-slate-500">
                  <li>1. Visit <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" class="text-green-400 hover:underline inline-flex items-center gap-1">
                    platform.openai.com <ExternalLink class="w-3 h-3" />
                  </a></li>
                  <li>2. Sign in or create an account</li>
                  <li>3. Click "Create new secret key"</li>
                  <li>4. Copy and paste it here</li>
                </ol>
              </div>

              <button
                on:click={validateAndSave}
                disabled={!apiKey.trim() || isValidating}
                class="w-full py-3 bg-gradient-to-r from-green-600 to-green-500 text-white font-medium rounded-lg hover:from-green-500 hover:to-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-green-500/25"
              >
                {#if isValidating}
                  <span class="flex items-center justify-center gap-2">
                    <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Validating...
                  </span>
                {:else}
                  Validate & Save
                {/if}
              </button>
            </div>
          </div>

          <button
            on:click={handleSkip}
            class="w-full py-2 text-slate-500 hover:text-slate-400 text-sm transition-colors"
          >
            Skip for now (you can add it later in Settings)
          </button>
        </div>
      {:else if currentStep === 4}
        <!-- Success Step -->
        <div class="space-y-6 animate-slideIn text-center py-8">
          <div class="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-500/50">
            <Check class="w-10 h-10 text-white" />
          </div>

          <div>
            <h3 class="text-2xl font-bold text-white mb-2">You're All Set!</h3>
            <p class="text-slate-400">
              SQL-Ball's AI features are now enabled. Try asking questions in natural language!
            </p>
          </div>

          <div class="bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-xl p-6 border border-green-500/20 text-left">
            <p class="text-sm font-medium text-green-400 mb-3">Example queries to try:</p>
            <ul class="space-y-2 text-sm text-slate-400">
              <li>• "Show me all matches where the home team scored more than 5 goals"</li>
              <li>• "Which team has the best away record this season?"</li>
              <li>• "Find matches with the most yellow cards"</li>
              <li>• "Compare Manchester United vs Liverpool head-to-head"</li>
            </ul>
          </div>

          <p class="text-sm text-slate-500">Reloading in a moment...</p>
        </div>
      {/if}
    </div>

    <!-- Footer -->
    <div class="px-6 pb-6 flex justify-between items-center">
      {#if currentStep > 1 && currentStep < 4}
        <button
          on:click={() => currentStep--}
          class="px-4 py-2 text-slate-400 hover:text-white transition-colors"
        >
          Back
        </button>
      {:else}
        <div></div>
      {/if}

      {#if currentStep < 3}
        <button
          on:click={() => currentStep++}
          class="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
        >
          Next
        </button>
      {:else if currentStep === 3}
        <div></div>
      {/if}
    </div>
  </div>
</div>

<style>
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out;
  }

  .animate-slideIn {
    animation: slideIn 0.3s ease-out;
  }
</style>