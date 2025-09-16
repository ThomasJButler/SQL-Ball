<script lang="ts">
  import { Send, Bot, Key, AlertCircle } from 'lucide-svelte';
  import { onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  interface Message {
    id: number;
    text: string;
    sender: 'user' | 'assistant';
    timestamp: Date;
  }

  let messages: Message[] = [
    {
      id: 1,
      text: "Hello! I'm your SQL-Ball AI assistant powered by OpenAI. I can help you analyze football data, generate SQL queries, discover patterns, and provide insights about teams and players. How can I assist you today?",
      sender: 'assistant',
      timestamp: new Date()
    }
  ];

  let inputMessage = '';
  let isTyping = false;
  let isCalculating = false;
  let calculationSteps: string[] = [];
  let chatContainer: HTMLElement;
  let hasApiKey = false;
  let errorMessage = '';
  let conversationHistory: { role: 'system' | 'user' | 'assistant', content: string }[] = [];

  function navigateToSettings() {
    dispatch('navigate', { view: 'Settings' });
  }

  async function sendMessage() {
    if (!inputMessage.trim()) return;

    if (!hasApiKey) {
      const noKeyMessage: Message = {
        id: messages.length + 1,
        text: "Please add your OpenAI API key in Settings to use the AI Assistant.",
        sender: 'assistant',
        timestamp: new Date()
      };
      messages = [...messages, noKeyMessage];
      return;
    }

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

    // Check if it's a SQL generation request
    const isSQLRequest = userInput.toLowerCase().includes('sql') ||
                        userInput.toLowerCase().includes('query') ||
                        userInput.toLowerCase().includes('select') ||
                        userInput.toLowerCase().includes('database');

    if (isSQLRequest) {
      isCalculating = true;
      calculationSteps = [
        '⏳ Analyzing your request...',
        '⏳ Understanding table structure...',
        '⏳ Building SQL query...',
        '⏳ Optimizing performance...',
        '📊 Generating final query...'
      ];

      // Show calculation steps with delays
      for (let i = 0; i < calculationSteps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        scrollToBottom();
      }
    }

    // Show typing indicator
    isTyping = true;
    isCalculating = false;
    scrollToBottom();
    errorMessage = '';

    try {
      const apiKey = localStorage.getItem('openai_api_key');
      if (!apiKey) {
        throw new Error('OpenAI API key not found');
      }

      // Make direct call to OpenAI API
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: `You are SQL-Ball AI Assistant, an expert in football data analytics and SQL query generation.

You have access to a PostgreSQL database with the following tables:
- seasons: Premier League seasons data
- matches: Detailed match data including scores, statistics, and xG data
- player_stats: Individual player statistics by season

Help users by:
1. Generating SQL queries for their data requests
2. Explaining football statistics and patterns
3. Analyzing historical match data
4. Providing insights about teams and players
5. Suggesting interesting queries they could run

Always provide clean, optimized SQL queries that can be run directly in the Query Builder.`
            },
            ...conversationHistory,
            { role: 'user', content: userInput }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to get response from OpenAI');
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;

      // Add assistant response to history
      conversationHistory = [...conversationHistory, { role: 'assistant', content: aiResponse }];

      const assistantMessage: Message = {
        id: messages.length + 1,
        text: aiResponse,
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
        text: `I encountered an error: ${errorMsg}. Please check your OpenAI API key in Settings.`,
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

  onMount(() => {
    // Check if OpenAI API key is configured
    const apiKey = localStorage.getItem('openai_api_key');
    hasApiKey = !!apiKey;
    scrollToBottom();
  });
</script>

<div class="ai-assistant flex flex-col h-full max-h-[calc(100vh-12rem)]">
  <!-- Header -->
  <div class="bg-gradient-to-r from-primary/10 to-accent/10 dark:from-primary/20 dark:to-accent/20 rounded-t-xl p-4 border-b border-slate-200 dark:border-slate-700">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <div class="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
          <Bot class="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 class="text-lg font-bold text-slate-900 dark:text-white">AI Assistant</h2>
          <p class="text-sm text-slate-600 dark:text-slate-400">
            {hasApiKey ? 'OpenAI GPT-4 Turbo' : 'Configure API key to enable'}
          </p>
        </div>
      </div>

      {#if !hasApiKey}
        <button
          on:click={navigateToSettings}
          class="btn btn-primary btn-sm flex items-center space-x-2"
        >
          <Key class="w-4 h-4" />
          <span>Add API Key</span>
        </button>
      {/if}
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
        <button on:click={navigateToSettings} class="text-primary hover:underline">
          Add your OpenAI API key in Settings to enable AI assistance
        </button>
      </p>
    {/if}
  </div>
</div>

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