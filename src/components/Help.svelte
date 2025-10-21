<!--
@author Tom Butler
@date 2025-10-21
@description Help and documentation component. Provides user guidance on platform features, architecture,
             tech stack, troubleshooting, and FAQ. Organises content into collapsible sections with
             syntax-highlighted code examples and external resource links.
-->
<script lang="ts">
  import { Book, HelpCircle, TrendingUp, Shield, Zap, ExternalLink, ChevronRight, Home } from 'lucide-svelte';
  import { fade, fly } from 'svelte/transition';
  
  let selectedSection = 'getting-started';
  let showMobileMenu = false;
  
  const sections = [
    { id: 'getting-started', title: 'Getting Started', icon: Home },
    { id: 'query-builder', title: 'Query Builder', icon: TrendingUp },
    { id: 'features', title: 'Features Guide', icon: Book },
    { id: 'data', title: 'European League Data', icon: Shield },
    { id: 'faq', title: 'FAQ', icon: HelpCircle }
  ];
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
  <!-- Header -->
  <div class="glass-effect lg:sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold gradient-text">Help & Documentation</h1>
        <button
          class="sm:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          on:click={() => showMobileMenu = !showMobileMenu}
        >
          <ChevronRight class="w-5 h-5 transition-transform {showMobileMenu ? 'rotate-90' : ''}" />
        </button>
      </div>
    </div>
  </div>

  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <!-- Sidebar Navigation -->
      <nav class="lg:col-span-1 {showMobileMenu ? 'block' : 'hidden'} sm:block">
        <div class="glass-card p-4 lg:sticky lg:top-24">
          <h2 class="font-semibold text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
            Documentation
          </h2>
          <ul class="space-y-2">
            {#each sections as section}
              <li>
                <button
                  class="w-full text-left px-3 py-2 rounded-lg flex items-center gap-3 transition-all
                    {selectedSection === section.id 
                      ? 'bg-primary/10 text-primary font-medium' 
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800'}"
                  on:click={() => {
                    selectedSection = section.id;
                    showMobileMenu = false;
                  }}
                >
                  <svelte:component this={section.icon} class="w-4 h-4" />
                  {section.title}
                </button>
              </li>
            {/each}
          </ul>
        </div>
      </nav>

      <!-- Content Area -->
      <div class="lg:col-span-3">
        <div class="glass-card p-6 sm:p-8" in:fade={{ duration: 200 }}>
          {#if selectedSection === 'getting-started'}
            <div class="prose prose-slate dark:prose-invert max-w-none">
              <h2 class="text-3xl font-bold mb-6 gradient-text">Getting Started</h2>
              
              <div class="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl mb-8">
                <h3 class="text-xl font-semibold mb-4">Welcome to SQL Ball!</h3>
                <p class="mb-4">SQL-Ball transforms natural language into SQL queries using advanced RAG technology. No SQL knowledge required!</p>
                <ol class="space-y-4">
                  <li class="flex gap-3">
                    <span class="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">1</span>
                    <div>
                      <strong>Set Up Your OpenAI API Key</strong>
                      <p class="text-sm mt-1">Go to Settings and add your OpenAI API key to enable natural language processing.</p>
                    </div>
                  </li>
                  <li class="flex gap-3">
                    <span class="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">2</span>
                    <div>
                      <strong>Ask Questions in Plain English</strong>
                      <p class="text-sm mt-1">Type questions like "Show me Liverpool's recent matches" in the Query Builder.</p>
                    </div>
                  </li>
                  <li class="flex gap-3">
                    <span class="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">3</span>
                    <div>
                      <strong>Review and Execute SQL</strong>
                      <p class="text-sm mt-1">SQL-Ball generates optimized SQL queries that you can review, copy, and execute.</p>
                    </div>
                  </li>
                </ol>
              </div>

              <h3 class="text-xl font-semibold mb-4">Example Queries to Try</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div class="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <h4 class="font-semibold mb-2">🔍 Team Performance</h4>
                  <p class="text-sm">"Show me Liverpool's recent matches"</p>
                  <p class="text-sm">"Find Manchester City home games"</p>
                </div>
                <div class="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <h4 class="font-semibold mb-2">⚽ Match Analysis</h4>
                  <p class="text-sm">"Find matches with more than 4 goals"</p>
                  <p class="text-sm">"Show all Premier League draws"</p>
                </div>
                <div class="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <h4 class="font-semibold mb-2">📊 League Data</h4>
                  <p class="text-sm">"Show all Premier League matches"</p>
                  <p class="text-sm">"Find La Liga high-scoring games"</p>
                </div>
                <div class="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <h4 class="font-semibold mb-2">🏆 Head-to-Head</h4>
                  <p class="text-sm">"Find matches between Arsenal and Chelsea"</p>
                  <p class="text-sm">"Show Barcelona vs Real Madrid games"</p>
                </div>
              </div>

              <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p class="text-sm text-blue-800 dark:text-blue-300">
                  Data is sourced from <a href="https://www.football-data.co.uk/downloadm.php" class="underline" target="_blank">Football-Data.co.uk</a> and stored in Supabase PostgreSQL for fast querying.
                </p>
              </div>
            </div>

          {:else if selectedSection === 'query-builder'}
            <div class="prose prose-slate dark:prose-invert max-w-none">
              <h2 class="text-3xl font-bold mb-6 gradient-text">Query Builder Guide</h2>
              
              <div class="mb-8">
                <h3 class="text-xl font-semibold mb-4">How RAG-Powered SQL Generation Works</h3>
                
                <div class="space-y-6">
                  <div class="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl">
                    <h4 class="font-bold text-lg mb-2">🧠 Retrieval-Augmented Generation (RAG)</h4>
                    <p class="mb-3">SQL-Ball uses RAG technology to understand your questions and generate accurate SQL queries.</p>
                    <div class="grid grid-cols-1 gap-4 text-sm">
                      <div>
                        <strong class="text-blue-600">How it works:</strong>
                        <ul class="mt-1 space-y-1">
                          <li>• Analyzes your natural language question</li>
                          <li>• Searches database schema using vector embeddings</li>
                          <li>• Generates contextually appropriate SQL</li>
                          <li>• Provides explanations for learning</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div class="p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl">
                    <h4 class="font-bold text-lg mb-2">📊 Smart Schema Understanding</h4>
                    <p class="mb-3">The system understands football terminology and database structure to create accurate queries.</p>
                    <div class="grid grid-cols-1 gap-4 text-sm">
                      <div>
                        <strong class="text-green-600">Features:</strong>
                        <ul class="mt-1 space-y-1">
                          <li>• Recognizes team names and league codes</li>
                          <li>• Understands match statistics and dates</li>
                          <li>• Handles complex filtering and sorting</li>
                          <li>• Optimizes query performance automatically</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div class="p-6 bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl">
                    <h4 class="font-bold text-lg mb-2">⚡ Query Examples</h4>
                    <p class="mb-3">Try these example queries to explore different types of football data analysis.</p>
                    <div class="grid grid-cols-1 gap-4 text-sm">
                      <div>
                        <strong class="text-purple-600">Popular queries:</strong>
                        <ul class="mt-1 space-y-1">
                          <li>• "Show me Liverpool's recent matches"</li>
                          <li>• "Find matches with more than 4 total goals"</li>
                          <li>• "Show matches where home team won"</li>
                          <li>• "Find all draws in the Premier League"</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="bg-slate-100 dark:bg-slate-800 p-6 rounded-xl">
                <h3 class="text-lg font-semibold mb-3">Tips for Better Results</h3>
                <div class="space-y-2 text-sm">
                  <div class="flex items-center gap-3">
                    <div class="w-4 h-4 bg-green-500 rounded-full"></div>
                    <span><strong>Be specific:</strong> Include team names, leagues, or time periods</span>
                  </div>
                  <div class="flex items-center gap-3">
                    <div class="w-4 h-4 bg-blue-500 rounded-full"></div>
                    <span><strong>Use natural language:</strong> Ask as if talking to a person</span>
                  </div>
                  <div class="flex items-center gap-3">
                    <div class="w-4 h-4 bg-purple-500 rounded-full"></div>
                    <span><strong>Review generated SQL:</strong> Learn from the queries created</span>
                  </div>
                </div>
              </div>
            </div>

          {:else if selectedSection === 'features'}
            <div class="prose prose-slate dark:prose-invert max-w-none">
              <h2 class="text-3xl font-bold mb-6 gradient-text">Features Guide</h2>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div class="glass-card p-6">
                  <h3 class="font-bold text-lg mb-3">🤖 Natural Language Processing</h3>
                  <p class="text-sm mb-3">Ask questions in plain English and get SQL queries automatically.</p>
                  <ul class="text-sm space-y-1">
                    <li>• Powered by OpenAI GPT models</li>
                    <li>• Context-aware query generation</li>
                    <li>• Handles complex football terminology</li>
                    <li>• Real-time SQL generation</li>
                  </ul>
                </div>
                
                <div class="glass-card p-6">
                  <h3 class="font-bold text-lg mb-3">📊 RAG Technology</h3>
                  <p class="text-sm mb-3">Advanced retrieval system for accurate database querying.</p>
                  <ul class="text-sm space-y-1">
                    <li>• Vector-based schema search</li>
                    <li>• ChromaDB embeddings</li>
                    <li>• LangChain integration</li>
                    <li>• Contextual query optimization</li>
                  </ul>
                </div>
                
                <div class="glass-card p-6">
                  <h3 class="font-bold text-lg mb-3">🔍 Query Builder</h3>
                  <p class="text-sm mb-3">Interactive interface for building and executing SQL queries.</p>
                  <ul class="text-sm space-y-1">
                    <li>• Example query suggestions</li>
                    <li>• SQL syntax highlighting</li>
                    <li>• Copy and execute functionality</li>
                    <li>• Query explanation and confidence</li>
                  </ul>
                </div>
                
                <div class="glass-card p-6">
                  <h3 class="font-bold text-lg mb-3">📈 Data Visualization</h3>
                  <p class="text-sm mb-3">View query results in formatted tables and charts.</p>
                  <ul class="text-sm space-y-1">
                    <li>• Responsive data tables</li>
                    <li>• Export functionality</li>
                    <li>• Result pagination</li>
                    <li>• Mobile-friendly display</li>
                  </ul>
                </div>
                
                <div class="glass-card p-6">
                  <h3 class="font-bold text-lg mb-3">⚽ Football Data</h3>
                  <p class="text-sm mb-3">Comprehensive European football match database.</p>
                  <ul class="text-sm space-y-1">
                    <li>• Multiple league coverage</li>
                    <li>• Historical match data</li>
                    <li>• Team and player statistics</li>
                    <li>• Regular data updates</li>
                  </ul>
                </div>
                
                <div class="glass-card p-6">
                  <h3 class="font-bold text-lg mb-3">🛡️ Privacy & Security</h3>
                  <p class="text-sm mb-3">Your data and API keys are kept secure and private.</p>
                  <ul class="text-sm space-y-1">
                    <li>• Local API key storage</li>
                    <li>• No data collection</li>
                    <li>• Open source codebase</li>
                    <li>• Secure data handling</li>
                  </ul>
                </div>
              </div>
            </div>

          {:else if selectedSection === 'data'}
            <div class="prose prose-slate dark:prose-invert max-w-none">
              <h2 class="text-3xl font-bold mb-6 gradient-text">European League Data</h2>
              
              <div class="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl mb-8">
                <h3 class="text-xl font-semibold mb-4">📊 Data Source</h3>
                <p class="mb-4">All football match data is sourced from <a href="https://www.football-data.co.uk/downloadm.php" class="text-blue-600 dark:text-blue-400 underline" target="_blank">Football-Data.co.uk</a>, a comprehensive database of European football statistics.</p>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div>
                    <h4 class="font-semibold mb-2">Leagues Covered:</h4>
                    <ul class="text-sm space-y-1">
                      <li>• E0 - Premier League (England)</li>
                      <li>• SP1 - La Liga (Spain)</li>
                      <li>• I1 - Serie A (Italy)</li>
                      <li>• D1 - Bundesliga (Germany)</li>
                      <li>• F1 - Ligue 1 (France)</li>
                      <li>• And many more European leagues</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 class="font-semibold mb-2">Data Includes:</h4>
                    <ul class="text-sm space-y-1">
                      <li>• Match results and scores</li>
                      <li>• Home/away team information</li>
                      <li>• Match dates and times</li>
                      <li>• League classifications</li>
                      <li>• Historical match data</li>
                      <li>• Standardized team names</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div class="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <h4 class="font-semibold mb-2">🏆 Database Schema</h4>
                  <p class="text-sm mb-2">The matches table contains:</p>
                  <ul class="text-sm space-y-1">
                    <li>• id - unique match identifier</li>
                    <li>• match_date - when the match occurred</li>
                    <li>• home_team - home team name</li>
                    <li>• away_team - away team name</li>
                    <li>• home_score - home team goals</li>
                    <li>• away_score - away team goals</li>
                    <li>• result - H/A/D (home/away/draw)</li>
                    <li>• div - league division code</li>
                  </ul>
                </div>
                
                <div class="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <h4 class="font-semibold mb-2">🔄 Data Processing</h4>
                  <p class="text-sm mb-2">Our system processes the data by:</p>
                  <ul class="text-sm space-y-1">
                    <li>• Importing from Football-Data.co.uk</li>
                    <li>• Storing in Supabase PostgreSQL</li>
                    <li>• Creating vector embeddings</li>
                    <li>• Optimizing for query performance</li>
                    <li>• Regular updates and maintenance</li>
                    <li>• Quality checks and validation</li>
                  </ul>
                </div>
              </div>

              <div class="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <h4 class="font-semibold mb-2">RAG Enhancement</h4>
                <p class="text-sm">
                  The raw data is enhanced with a Python backend that connects to Supabase and performs 
                  RAG (Retrieval-Augmented Generation) processing. This enables natural language queries 
                  to be converted into accurate SQL statements using advanced AI technology.
                </p>
              </div>
            </div>

          {:else if selectedSection === 'faq'}
            <div class="prose prose-slate dark:prose-invert max-w-none">
              <h2 class="text-3xl font-bold mb-6 gradient-text">Frequently Asked Questions</h2>
              
              <div class="space-y-6">
                <div class="p-6 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <h3 class="font-semibold text-lg mb-2">How does the natural language to SQL work?</h3>
                  <p>SQL-Ball uses advanced RAG (Retrieval-Augmented Generation) technology with OpenAI's GPT models to understand your questions and generate accurate SQL queries based on our football database schema.</p>
                </div>
                
                <div class="p-6 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <h3 class="font-semibold text-lg mb-2">Do I need to know SQL to use this?</h3>
                  <p>No! That's the whole point of SQL-Ball. You can ask questions in plain English like "Show me Liverpool's recent matches" and the system will generate the appropriate SQL query for you.</p>
                </div>
                
                <div class="p-6 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <h3 class="font-semibold text-lg mb-2">Is this app free to use?</h3>
                  <p>The app itself is free! You just need to provide your own OpenAI API key to enable the natural language processing. OpenAI offers free credits to new users.</p>
                </div>
                
                <div class="p-6 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <h3 class="font-semibold text-lg mb-2">What football leagues are included?</h3>
                  <p>We include data from major European leagues including Premier League (E0), La Liga (SP1), Serie A (I1), Bundesliga (D1), Ligue 1 (F1), and many others sourced from Football-Data.co.uk.</p>
                </div>
                
                <div class="p-6 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <h3 class="font-semibold text-lg mb-2">How recent is the data?</h3>
                  <p>The database contains historical match data from Football-Data.co.uk. The exact range depends on what's available in the source dataset, typically covering multiple recent seasons.</p>
                </div>
                
                <div class="p-6 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <h3 class="font-semibold text-lg mb-2">Can I see the generated SQL?</h3>
                  <p>Yes! SQL-Ball shows you the generated SQL query so you can learn and understand how your natural language question was converted. You can copy, modify, or study the SQL.</p>
                </div>
                
                <div class="p-6 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <h3 class="font-semibold text-lg mb-2">Is my OpenAI API key safe?</h3>
                  <p>Your API key is stored locally in your browser and never sent to our servers. It's only used to communicate directly with OpenAI's API for query generation.</p>
                </div>
                
                <div class="p-6 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <h3 class="font-semibold text-lg mb-2">What if the generated SQL is wrong?</h3>
                  <p>While the RAG system is highly accurate, AI can sometimes make mistakes. Always review the generated SQL before executing. You can also try rephrasing your question for better results.</p>
                </div>
              </div>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .glass-effect {
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }
  
  :global(.dark) .glass-effect {
    background: rgba(15, 23, 42, 0.7);
  }
  
  .glass-card {
    @apply bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-xl shadow-lg border border-slate-200 dark:border-slate-700;
  }
  
  .gradient-text {
    @apply bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent;
  }
  
  .prose h2 {
    @apply text-2xl sm:text-3xl;
  }
  
  .prose h3 {
    @apply text-lg sm:text-xl;
  }
  
  .prose h4 {
    @apply text-base sm:text-lg;
  }
</style>
