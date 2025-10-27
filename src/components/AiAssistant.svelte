<!--
@author Tom Butler
@date 2025-10-25
@description AI assistant chat component for football predictions and analysis. Supports OpenAI
             and Anthropic APIs with markdown rendering, code syntax highlighting, and conversation history.
-->
<script lang="ts">
  import { Send, Bot, Key, AlertCircle, Sparkles, Copy, Check, RotateCcw, Maximize, Minimize } from 'lucide-svelte';
  import { onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { createEventDispatcher } from 'svelte';
  import { marked } from 'marked';
  import Prism from 'prismjs';
  import 'prismjs/components/prism-sql';
  import 'prismjs/components/prism-javascript';
  import 'prismjs/components/prism-json';

  const dispatch = createEventDispatcher();

  interface Message {
    id: number;
    text: string;
    sender: 'user' | 'assistant';
    timestamp: Date;
    isMarkdown?: boolean;
    copyButtonId?: string;
  }

  let messages: Message[] = [
    {
      id: 1,
      text: "Hello! I'm your SQL-Ball AI assistant powered by OpenAI. I can help you analyze European football data from 22 leagues across 11 countries with 7,681+ matches. I can generate SQL queries, discover patterns, and provide insights about teams, leagues, and match statistics. How can I assist you today?",
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
  let isFullscreen = false;
  let copiedMessageId: string | null = null;
  let inputHeight = 48; // Initial height for textarea
  let quickActions = [
    "Explain this query",
    "Show me the table structure",
    "Find top scorers",
    "Recent matches analysis"
  ];
  let showQuickActions = false;

  function navigateToSettings() {
    dispatch('navigate', { view: 'Settings' });
  }

  function toggleFullscreen() {
    isFullscreen = !isFullscreen;
  }

  async function copyMessage(messageText: string, messageId: number) {
    try {
      await navigator.clipboard.writeText(messageText);
      copiedMessageId = `copy-${messageId}`;
      setTimeout(() => {
        copiedMessageId = null;
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  }

  function renderMarkdown(text: string): string {
    // Configure marked for better rendering
    marked.setOptions({
      breaks: true,
      gfm: true,
    });

    let rendered = marked(text);

    // Add syntax highlighting
    const codeBlockRegex = /<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g;
    rendered = rendered.replace(codeBlockRegex, (match, lang, code) => {
      try {
        const highlighted = Prism.highlight(code, Prism.languages[lang] || Prism.languages.text, lang);
        return `<pre class="code-block language-${lang}"><code>${highlighted}</code></pre>`;
      } catch (e) {
        return match;
      }
    });

    return rendered;
  }

  function useQuickAction(action: string) {
    inputMessage = action;
    showQuickActions = false;
    sendMessage();
  }

  function clearConversation() {
    if (confirm('Are you sure you want to clear the conversation?')) {
      messages = [messages[0]]; // Keep the initial welcome message
      conversationHistory = [];
    }
  }

  function autoResizeTextarea(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    const newHeight = Math.min(Math.max(textarea.scrollHeight, 48), 120);
    textarea.style.height = newHeight + 'px';
    inputHeight = newHeight;
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
              content: `You are SQL-Ball AI Assistant, an expert in European football data analytics and SQL query generation.

You have access to a PostgreSQL database with comprehensive European league data:
- **leagues**: 22 European leagues across 11 countries (Premier League, La Liga, Serie A, Bundesliga, Ligue 1, etc.)
- **teams**: 397+ teams from all major European competitions
- **matches**: 7,681+ detailed match records with scores, statistics, cards, corners, shots, fouls, referee data
- **seasons**: 2024-2025 season data

Key database fields:
- match_date, home_team, away_team, home_score, away_score
- div (league code), season, result (H/A/D)
- home_shots_target, away_shots_target, home_corners, away_corners
- home_yellow_cards, away_yellow_cards, home_red_cards, away_red_cards
- home_fouls, away_fouls, referee
- ht_result (half-time result), ht_home_score, ht_away_score

Help users by:
1. Generating SQL queries for European football data requests
2. Analyzing patterns across multiple leagues and countries
3. Comparing team performance across different competitions
4. Finding interesting statistics and anomalies
5. Providing insights about European football trends
6. Suggesting fascinating queries about upsets, goal-fests, and patterns

Always provide clean, optimized SQL queries that work with these field names and can be run directly in the Query Builder. Focus on the rich European dataset with 22 leagues.`
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
        timestamp: new Date(),
        isMarkdown: true
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

<div class="ai-assistant flex flex-col h-full {isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-slate-950' : 'max-h-[calc(100vh-12rem)] md:max-h-[calc(100vh-8rem)]'}">
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
            {hasApiKey ? 'GPT-4 • 22 European Leagues • 7,681+ Matches' : 'Configure API key to enable'}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        {#if hasApiKey}
          <button
            on:click={clearConversation}
            class="btn btn-secondary btn-sm p-2 hover:bg-red-100 dark:hover:bg-red-900/20"
            title="Clear conversation"
          >
            <RotateCcw class="w-4 h-4" />
          </button>
          <button
            on:click={toggleFullscreen}
            class="btn btn-secondary btn-sm p-2 md:hidden"
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {#if isFullscreen}
              <Minimize class="w-4 h-4" />
            {:else}
              <Maximize class="w-4 h-4" />
            {/if}
          </button>
        {/if}

        {#if !hasApiKey}
          <button
            on:click={navigateToSettings}
            class="btn btn-primary btn-sm flex items-center space-x-2"
          >
            <Key class="w-4 h-4" />
            <span class="hidden sm:inline">Add API Key</span>
          </button>
        {/if}
      </div>
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
        <div class="max-w-[85%] md:max-w-[75%] lg:max-w-[60%] group">
          <div
            class="relative rounded-2xl px-4 py-3 {
              message.sender === 'user'
                ? 'bg-gradient-to-r from-primary to-accent text-white'
                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
            }"
          >
            {#if message.sender === 'assistant' && message.isMarkdown}
              <div class="prose prose-sm prose-slate dark:prose-invert max-w-none">
                {@html renderMarkdown(message.text)}
              </div>
            {:else}
              <p class="text-sm whitespace-pre-wrap leading-relaxed">{message.text}</p>
            {/if}

            <!-- Copy button for assistant messages -->
            {#if message.sender === 'assistant'}
              <button
                on:click={() => copyMessage(message.text, message.id)}
                class="absolute -top-2 -right-2 w-8 h-8 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity touch-target"
                title="Copy message"
              >
                {#if copiedMessageId === `copy-${message.id}`}
                  <Check class="w-3 h-3 text-green-600" />
                {:else}
                  <Copy class="w-3 h-3 text-slate-600 dark:text-slate-300" />
                {/if}
              </button>
            {/if}
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

  <!-- Quick Action Chips -->
  {#if showQuickActions && hasApiKey}
    <div class="border-t border-slate-200 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-900/50">
      <div class="flex flex-wrap gap-2">
        {#each quickActions as action}
          <button
            on:click={() => useQuickAction(action)}
            class="px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors touch-target"
          >
            {action}
          </button>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Input Area -->
  <div class="border-t border-slate-200 dark:border-slate-700 p-3 sm:p-4 bg-white dark:bg-slate-900 {isFullscreen ? 'pb-safe' : ''}">
    <!-- Quick Actions Toggle -->
    {#if hasApiKey}
      <div class="flex justify-center mb-3">
        <button
          on:click={() => showQuickActions = !showQuickActions}
          class="px-3 py-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1 touch-target"
        >
          <Sparkles class="w-3 h-3" />
          Quick Actions
          <span class="transform transition-transform {showQuickActions ? 'rotate-180' : ''}">
            ▼
          </span>
        </button>
      </div>
    {/if}

    <div class="flex items-end space-x-3">
      <textarea
        bind:value={inputMessage}
        on:keydown={handleKeydown}
        on:input={autoResizeTextarea}
        placeholder="Ask about European teams, leagues, matches, or patterns..."
        class="flex-1 resize-none rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        style="height: {inputHeight}px; max-height: 120px;"
        rows="1"
      />
      <button
        on:click={sendMessage}
        disabled={!inputMessage.trim() || isTyping}
        class="btn btn-primary p-3 disabled:opacity-50 disabled:cursor-not-allowed touch-target min-w-[48px] min-h-[48px] flex items-center justify-center"
        title="Send message"
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
  /* Touch-friendly interactions */
  .touch-target {
    min-height: 44px;
    min-width: 44px;
  }

  /* Mobile safe area support */
  .pb-safe {
    padding-bottom: env(safe-area-inset-bottom);
  }

  /* Textarea scrollbar styling */
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

  /* Markdown content styling */
  :global(.prose code) {
    @apply bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-sm;
  }

  :global(.prose pre) {
    @apply bg-slate-900 dark:bg-slate-950 text-green-400 p-4 rounded-lg overflow-x-auto my-4;
  }

  :global(.prose pre code) {
    @apply bg-transparent p-0 text-inherit;
  }

  :global(.prose blockquote) {
    @apply border-l-4 border-primary/30 pl-4 italic text-slate-600 dark:text-slate-400;
  }

  :global(.prose table) {
    @apply w-full border-collapse border border-slate-300 dark:border-slate-700 rounded-lg overflow-hidden;
  }

  :global(.prose th),
  :global(.prose td) {
    @apply border border-slate-300 dark:border-slate-700 px-3 py-2 text-left;
  }

  :global(.prose th) {
    @apply bg-slate-100 dark:bg-slate-800 font-semibold;
  }

  /* Code block styling */
  :global(.code-block) {
    @apply bg-slate-900 dark:bg-slate-950 text-green-400 p-4 rounded-lg overflow-x-auto my-4 text-sm font-mono;
  }

  /* Mobile responsiveness */
  @media (max-width: 768px) {
    .ai-assistant {
      border-radius: 0;
    }

    .prose {
      font-size: 14px;
    }
  }

  /* Copy button animations */
  .group:hover .opacity-0 {
    opacity: 1;
  }

  /* Smooth transitions */
  .transition-all {
    transition: all 0.2s ease-in-out;
  }
</style>