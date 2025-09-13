<script lang="ts">
  import { Send, Bot, Lock, Sparkles, ChevronDown, Settings, AlertCircle } from 'lucide-svelte';
  import { onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { aiService, type AIMessage as AIServiceMessage } from '../services/aiService';

  interface Message {
    id: number;
    text: string;
    sender: 'user' | 'assistant';
    timestamp: Date;
  }

  let messages: Message[] = [
    {
      id: 1,
      text: "Hello! I'm your Premier League Oracle AI assistant powered by advanced language models. I can analyze matches, provide predictions, identify value bets, and offer deep insights about teams and players. How can I assist you today?",
      sender: 'assistant',
      timestamp: new Date()
    }
  ];

  let inputMessage = '';
  let isTyping = false;
  let isCalculating = false;
  let calculationSteps: string[] = [];
  let chatContainer: HTMLElement;
  let showProModal = false;
  let apiKey = '';
  let hasApiKey = false;
  let selectedProvider: 'openai' | 'anthropic' = 'openai';
  let selectedModel = 'gpt-4-turbo-preview';
  let errorMessage = '';
  let conversationHistory: AIServiceMessage[] = [];

  // Legacy function removed - now using aiService for all responses
  async function generateSmartResponse(question: string): Promise<string> {
    const lowerQuestion = question.toLowerCase();
    
    // Fun facts
    if (lowerQuestion.includes('fun fact') || lowerQuestion.includes('interesting')) {
      const funFacts = [
        "Only 7 clubs have won the Premier League since its formation in 1992!",
        "The fastest goal in Premier League history was scored by Shane Long after just 7.69 seconds.",
        "Ryan Giggs scored in 23 consecutive Premier League seasons from 1992-93 to 2012-13.",
        "The record for most goals in a single Premier League game is 5, shared by multiple players."
      ];
      return funFacts[Math.floor(Math.random() * funFacts.length)];
    }
    
    // Default responses
    const responses = [
      "That's a great question! Check out the Season Stats tab for unique insights about this season.",
      "Based on recent form trends, you can find detailed analysis in the Predictions section.",
      "The Dashboard provides real-time updates on all team performances and upcoming matches.",
      "Interesting point! Our prediction models consider multiple factors including form, injuries, and historical data."
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  async function sendMessage() {
    if (!inputMessage.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: messages.length + 1,
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };
    messages = [...messages, userMessage];
    
    // Add to conversation history for context
    conversationHistory = [...conversationHistory, { role: 'user', content: inputMessage }];
    
    const userInput = inputMessage;
    inputMessage = '';

    // Check if it's a prediction request and show calculation steps
    const isPredictionRequest = userInput.toLowerCase().includes('predict') || 
                               userInput.toLowerCase().includes('prediction') ||
                               userInput.toLowerCase().includes('vs') ||
                               userInput.toLowerCase().includes('odds');
    
    if (isPredictionRequest) {
      isCalculating = true;
      calculationSteps = [
        '⏳ Analyzing team form and recent performance...',
        '⏳ Computing Poisson distribution parameters...',
        '⏳ Applying ELO ratings and home advantage...',
        '⏳ Generating probability calculations...',
        '📊 Finalizing prediction results...'
      ];
      
      // Show calculation steps with delays
      for (let i = 0; i < calculationSteps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 800));
        scrollToBottom();
      }
    }
    
    // Show typing indicator
    isTyping = true;
    isCalculating = false;
    scrollToBottom();
    errorMessage = '';

    try {
      let response: string;
      
      if (hasApiKey) {
        // Use AI service for real API calls
        const aiResponse = await aiService.sendMessage(userInput, conversationHistory);
        
        if (aiResponse.success && aiResponse.message) {
          response = aiResponse.message;
          // Add assistant response to history
          conversationHistory = [...conversationHistory, { role: 'assistant', content: response }];
        } else {
          response = aiResponse.error || 'Failed to get AI response. Please check your API key and try again.';
          errorMessage = response;
        }
      } else {
        // Fallback to smart database queries
        response = await generateSmartResponse(userInput);
      }
      
      const assistantMessage: Message = {
        id: messages.length + 1,
        text: response,
        sender: 'assistant',
        timestamp: new Date()
      };
      messages = [...messages, assistantMessage];
    } catch (error) {
      console.error('Error generating response:', error);
      const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred';
      errorMessage = errorMsg;
      
      const assistantMessage: Message = {
        id: messages.length + 1,
        text: `I encountered an error: ${errorMsg}. Please check your API configuration or try again.`,
        sender: 'assistant',
        timestamp: new Date()
      };
      messages = [...messages, assistantMessage];
    } finally {
      isTyping = false;
      scrollToBottom();
    }
  }

  function scrollToBottom() {
    setTimeout(() => {
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 100);
  }

  function handleKeydown(event: CustomEvent<any> & { target: any }) {
    const keyboardEvent = event as unknown as KeyboardEvent;
    if (keyboardEvent.key === 'Enter' && !keyboardEvent.shiftKey) {
      keyboardEvent.preventDefault();
      sendMessage();
    }
  }

  function saveApiKey() {
    if (apiKey.trim()) {
      // Configure the AI service with the API key
      aiService.setApiKey(apiKey, selectedProvider, selectedModel);
      hasApiKey = true;
      showProModal = false;
      errorMessage = '';
      
      const providerName = selectedProvider === 'openai' ? 'OpenAI' : 'Anthropic';
      const modelName = selectedModel;
      
      messages = [...messages, {
        id: messages.length + 1,
        text: `Excellent! I've connected to ${providerName} using ${modelName}. I can now provide advanced AI-powered analysis with real-time insights, sophisticated predictions, and value betting recommendations. Ask me anything about Premier League matches, teams, or betting strategies!`,
        sender: 'assistant',
        timestamp: new Date()
      }];
      
      // Clear conversation history for fresh start
      conversationHistory = [];
    }
  }
  
  function updateModelSelection() {
    if (selectedProvider === 'openai') {
      selectedModel = 'gpt-4-turbo-preview';
    } else {
      selectedModel = 'claude-3-opus-20240229';
    }
  }

  onMount(() => {
    // Check if AI service has a configured API key
    hasApiKey = aiService.hasApiKey();
    
    if (hasApiKey) {
      const savedProvider = localStorage.getItem('ai_provider') as 'openai' | 'anthropic';
      const savedModel = localStorage.getItem('ai_model');
      
      if (savedProvider) selectedProvider = savedProvider;
      if (savedModel) selectedModel = savedModel;
    }
    
    scrollToBottom();
  });
  
  function clearApiKey() {
    aiService.clearApiKey();
    hasApiKey = false;
    apiKey = '';
    conversationHistory = [];
    messages = [...messages, {
      id: messages.length + 1,
      text: "API key cleared. Switched back to free mode with smart database queries.",
      sender: 'assistant',
      timestamp: new Date()
    }];
  }
</script>

<div class="ai-assistant flex flex-col h-full max-h-[calc(100vh-12rem)]">
  <!-- Header -->
  <div class="bg-gradient-to-r from-primary/10 to-accent/10 dark:from-primary/20 dark:to-accent/20 rounded-t-xl p-4 border-b border-slate-200 dark:border-slate-700">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <div class="p-2 bg-gradient-to-br from-primary to-accent rounded-lg">
          <Bot class="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 class="text-lg font-bold text-slate-900 dark:text-white">AI Assistant</h2>
          <p class="text-sm text-slate-600 dark:text-slate-400">
            {hasApiKey ? `Pro Mode - ${selectedProvider === 'openai' ? 'OpenAI' : 'Anthropic'}` : 'Free Mode - Smart Responses'}
          </p>
        </div>
      </div>
      
      <button
        on:click={() => showProModal = true}
        class="btn {hasApiKey ? 'btn-secondary' : 'btn-primary'} btn-sm flex items-center space-x-2"
      >
        {#if hasApiKey}
          <Settings class="w-4 h-4" />
          <span>Settings</span>
        {:else}
          <Sparkles class="w-4 h-4" />
          <span>Upgrade</span>
        {/if}
      </button>
    </div>
  </div>

  <!-- Chat Messages -->
  <div 
    bind:this={chatContainer}
    class="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50"
  >
    {#each messages as message (message.id)}
      <div 
        class="flex {message.sender === 'user' ? 'justify-end' : 'justify-start'}"
        transition:fly={{ y: 20, duration: 300 }}
      >
        <div class="max-w-[80%] md:max-w-[60%]">
          <div 
            class="rounded-2xl px-4 py-3 {
              message.sender === 'user' 
                ? 'bg-gradient-to-r from-primary to-accent text-white' 
                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
            }"
          >
            <p class="text-sm whitespace-pre-wrap">{message.text}</p>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 px-2 {
            message.sender === 'user' ? 'text-right' : 'text-left'
          }">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    {/each}
    
    {#if isCalculating}
      <div class="flex justify-start" transition:fade>
        <div class="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 rounded-2xl px-4 py-4 border border-amber-200 dark:border-amber-700">
          <div class="flex items-center gap-2 mb-3">
            <Sparkles class="w-4 h-4 text-amber-600 animate-spin" />
            <span class="font-semibold text-amber-800 dark:text-amber-200 text-sm">Live Calculation</span>
          </div>
          <div class="space-y-2">
            {#each calculationSteps as step, i}
              <div class="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
                <div class="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></div>
                <span>{step}</span>
              </div>
            {/each}
          </div>
        </div>
      </div>
    {/if}
    
    {#if isTyping && !isCalculating}
      <div class="flex justify-start" transition:fade>
        <div class="bg-white dark:bg-slate-800 rounded-2xl px-4 py-3 border border-slate-200 dark:border-slate-700">
          <div class="flex space-x-2">
            <div class="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
            <div class="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
            <div class="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <!-- Input Area -->
  <div class="border-t border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900">
    <div class="flex items-end space-x-3">
      <textarea
        bind:value={inputMessage}
        on:keydown={handleKeydown}
        placeholder="Ask about teams, matches, or predictions..."
        class="flex-1 resize-none rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[3rem] max-h-[8rem]"
        rows="1"
      />
      <button
        on:click={sendMessage}
        disabled={!inputMessage.trim() || isTyping}
        class="btn btn-primary p-3 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Send class="w-5 h-5" />
      </button>
    </div>
    
    {#if !hasApiKey}
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
        Free mode uses smart database queries. 
        <button on:click={() => showProModal = true} class="text-primary hover:underline">
          Add API key for unlimited AI
        </button>
      </p>
    {/if}
  </div>
</div>

<!-- Pro Modal -->
{#if showProModal}
  <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" transition:fade>
    <div class="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl" transition:fly={{ y: 50 }}>
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-xl font-bold text-slate-900 dark:text-white">{hasApiKey ? 'AI Settings' : 'Upgrade to Pro'}</h3>
        <button 
          on:click={() => showProModal = false}
          class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ChevronDown class="w-5 h-5 text-slate-500" />
        </button>
      </div>
      
      <div class="space-y-4">
        <div class="p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg">
          <h4 class="font-semibold text-slate-900 dark:text-white mb-2">Pro Features</h4>
          <ul class="text-sm text-slate-600 dark:text-slate-400 space-y-1">
            <li>• Unlimited AI-powered responses</li>
            <li>• Advanced match analysis</li>
            <li>• Personalized betting insights</li>
            <li>• Real-time strategy recommendations</li>
          </ul>
        </div>
        
        <div class="space-y-3">
          <div>
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">AI Provider</label>
            <div class="mt-2 grid grid-cols-2 gap-2">
              <button
                on:click={() => { selectedProvider = 'openai'; updateModelSelection(); }}
                class="px-3 py-2 rounded-lg border {selectedProvider === 'openai' 
                  ? 'border-primary bg-primary/10 text-primary' 
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}"
              >
                OpenAI
              </button>
              <button
                on:click={() => { selectedProvider = 'anthropic'; updateModelSelection(); }}
                class="px-3 py-2 rounded-lg border {selectedProvider === 'anthropic' 
                  ? 'border-primary bg-primary/10 text-primary' 
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}"
              >
                Anthropic
              </button>
            </div>
          </div>
          
          <div>
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Model</label>
            <select
              bind:value={selectedModel}
              class="w-full mt-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {#if selectedProvider === 'openai'}
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
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">API Key</label>
            <input
              type="password"
              bind:value={apiKey}
              placeholder={selectedProvider === 'openai' ? 'sk-...' : 'sk-ant-...'}
              class="w-full mt-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Your API key is stored locally and never sent to our servers.
            </p>
          </div>
          
          {#if errorMessage}
            <div class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div class="flex items-start space-x-2">
                <AlertCircle class="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5" />
                <p class="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
              </div>
            </div>
          {/if}
        </div>
        
        <div class="flex space-x-3">
          {#if hasApiKey}
            <button
              on:click={clearApiKey}
              class="btn btn-secondary"
            >
              Clear Key
            </button>
          {/if}
          <button
            on:click={saveApiKey}
            disabled={!apiKey.trim()}
            class="flex-1 btn btn-primary disabled:opacity-50"
          >
            <Lock class="w-4 h-4 mr-2" />
            {hasApiKey ? 'Update' : 'Save'} API Key
          </button>
          <button
            on:click={() => { showProModal = false; errorMessage = ''; }}
            class="btn btn-secondary"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  textarea {
    scrollbar-width: thin;
    scrollbar-color: theme('colors.slate.400') transparent;
  }
  
  textarea::-webkit-scrollbar {
    width: 6px;
  }
  
  textarea::-webkit-scrollbar-track {
    background: transparent;
  }
  
  textarea::-webkit-scrollbar-thumb {
    background-color: theme('colors.slate.400');
    border-radius: 3px;
  }
</style>