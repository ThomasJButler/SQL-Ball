<script lang="ts">
  import { Book, HelpCircle, TrendingUp, Shield, Zap, ExternalLink, ChevronRight, Home } from 'lucide-svelte';
  import { fade, fly } from 'svelte/transition';
  
  let selectedSection = 'getting-started';
  let showMobileMenu = false;
  
  const sections = [
    { id: 'getting-started', title: 'Getting Started', icon: Home },
    { id: 'query-builder', title: 'Query Builder', icon: TrendingUp },
    { id: 'pattern-discovery', title: 'Pattern Discovery', icon: Zap },
    { id: 'features', title: 'Features Guide', icon: Book },
    { id: 'data', title: 'European League Data', icon: Shield },
    { id: 'faq', title: 'FAQ', icon: HelpCircle }
  ];
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
  <!-- Header -->
  <div class="glass-effect sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
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
        <div class="glass-card p-4 sticky top-24">
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
                <ol class="space-y-4">
                  <li class="flex gap-3">
                    <span class="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">1</span>
                    <div>
                      <strong>Explore the Dashboard</strong>
                      <p class="text-sm mt-1">View comprehensive analytics from 22 European leagues and 7,681+ matches from the completed 2024-2025 season.</p>
                    </div>
                  </li>
                  <li class="flex gap-3">
                    <span class="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">2</span>
                    <div>
                      <strong>Use Natural Language Queries</strong>
                      <p class="text-sm mt-1">Ask questions in plain English using the Query Builder - powered by AI to generate SQL automatically.</p>
                    </div>
                  </li>
                  <li class="flex gap-3">
                    <span class="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">3</span>
                    <div>
                      <strong>Discover Patterns</strong>
                      <p class="text-sm mt-1">Uncover unusual statistics and hidden patterns in European football data with our Pattern Discovery engine.</p>
                    </div>
                  </li>
                </ol>
              </div>

              <h3 class="text-xl font-semibold mb-4">Dashboard Overview</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div class="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <h4 class="font-semibold mb-2">📊 Live Standings</h4>
                  <p class="text-sm">Current Premier League table with points, goals, and form indicators.</p>
                </div>
                <div class="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <h4 class="font-semibold mb-2">⚽ Upcoming Fixtures</h4>
                  <p class="text-sm">Next matches with AI-powered predictions and confidence levels.</p>
                </div>
                <div class="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <h4 class="font-semibold mb-2">📈 Team Stats</h4>
                  <p class="text-sm">Detailed performance metrics including xG, form, and trends.</p>
                </div>
                <div class="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <h4 class="font-semibold mb-2">🎯 Predictions</h4>
                  <p class="text-sm">Multiple models including ELO, Poisson, and Expected Goals.</p>
                </div>
              </div>

              <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p class="text-sm text-blue-800 dark:text-blue-300">
                  Data is sourced from our Supabase database with comprehensive Premier League statistics.
                </p>
              </div>
            </div>

          {:else if selectedSection === 'query-builder'}
            <div class="prose prose-slate dark:prose-invert max-w-none">
              <h2 class="text-3xl font-bold mb-6 gradient-text">Query Builder Guide</h2>
              
              <div class="mb-8">
                <h3 class="text-xl font-semibold mb-4">Our Three-Model System</h3>
                
                <div class="space-y-6">
                  <div class="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl">
                    <h4 class="font-bold text-lg mb-2">🎲 ELO Rating System</h4>
                    <p class="mb-3">Dynamic team strength ratings that adjust based on match results and opposition quality.</p>
                    <div class="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong class="text-green-600">Best for:</strong>
                        <ul class="mt-1 space-y-1">
                          <li>• Overall team strength</li>
                          <li>• Season-long trends</li>
                          <li>• Head-to-head comparisons</li>
                        </ul>
                      </div>
                      <div>
                        <strong class="text-amber-600">Limitations:</strong>
                        <ul class="mt-1 space-y-1">
                          <li>• Early season volatility</li>
                          <li>• Ignores team news</li>
                          <li>• Slow to adapt</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div class="p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl">
                    <h4 class="font-bold text-lg mb-2">📊 Poisson Distribution</h4>
                    <p class="mb-3">Statistical model that predicts goal probabilities based on team attacking and defensive strengths.</p>
                    <div class="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong class="text-green-600">Best for:</strong>
                        <ul class="mt-1 space-y-1">
                          <li>• Exact score predictions</li>
                          <li>• Over/under goals</li>
                          <li>• Both teams to score</li>
                        </ul>
                      </div>
                      <div>
                        <strong class="text-amber-600">Limitations:</strong>
                        <ul class="mt-1 space-y-1">
                          <li>• Assumes independent events</li>
                          <li>• Struggles with extremes</li>
                          <li>• No tactical context</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div class="p-6 bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl">
                    <h4 class="font-bold text-lg mb-2">⚡ Expected Goals (xG)</h4>
                    <p class="mb-3">Advanced metric that measures the quality of chances created and conceded by teams.</p>
                    <div class="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong class="text-green-600">Best for:</strong>
                        <ul class="mt-1 space-y-1">
                          <li>• True performance level</li>
                          <li>• Identifying value bets</li>
                          <li>• Future regression</li>
                        </ul>
                      </div>
                      <div>
                        <strong class="text-amber-600">Limitations:</strong>
                        <ul class="mt-1 space-y-1">
                          <li>• Requires detailed data</li>
                          <li>• Ignores finishing quality</li>
                          <li>• Complex to understand</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="bg-slate-100 dark:bg-slate-800 p-6 rounded-xl">
                <h3 class="text-lg font-semibold mb-3">Reading Prediction Confidence</h3>
                <div class="space-y-2">
                  <div class="flex items-center gap-3">
                    <div class="w-4 h-4 bg-green-500 rounded-full"></div>
                    <span><strong>High (75%+)</strong> - All models agree strongly</span>
                  </div>
                  <div class="flex items-center gap-3">
                    <div class="w-4 h-4 bg-yellow-500 rounded-full"></div>
                    <span><strong>Medium (60-75%)</strong> - Moderate agreement</span>
                  </div>
                  <div class="flex items-center gap-3">
                    <div class="w-4 h-4 bg-red-500 rounded-full"></div>
                    <span><strong>Low (&lt;60%)</strong> - Models disagree</span>
                  </div>
                </div>
              </div>
            </div>

          {:else if selectedSection === 'maximizing'}
            <div class="prose prose-slate dark:prose-invert max-w-none">
              <h2 class="text-3xl font-bold mb-6 gradient-text">Maximizing Prediction Accuracy</h2>
              
              <div class="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-6 rounded-xl mb-8">
                <h3 class="text-xl font-semibold mb-4">🎯 The Golden Rules</h3>
                <ol class="space-y-3">
                  <li><strong>1. Consensus is Key:</strong> When all three models agree, accuracy jumps to 75-85%</li>
                  <li><strong>2. Context Matters:</strong> Always check team news, injuries, and motivation</li>
                  <li><strong>3. Value Over Volume:</strong> Better to skip than force a prediction</li>
                  <li><strong>4. Track Everything:</strong> Learn from both wins and losses</li>
                  <li><strong>5. Stay Disciplined:</strong> Never chase losses or bet emotionally</li>
                </ol>
              </div>

              <h3 class="text-xl font-semibold mb-4">Advanced Strategies</h3>
              
              <div class="grid gap-4 mb-8">
                <div class="p-4 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20">
                  <h4 class="font-semibold mb-2">The Fatigue Factor</h4>
                  <p class="text-sm">Teams playing their 3rd match in 7 days see a 15% drop in win probability. Target them with opposing bets.</p>
                </div>
                
                <div class="p-4 border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20">
                  <h4 class="font-semibold mb-2">The Bounce-Back Effect</h4>
                  <p class="text-sm">Teams typically overperform after heavy defeats (3+ goals). Back them against weaker opposition.</p>
                </div>
                
                <div class="p-4 border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-900/20">
                  <h4 class="font-semibold mb-2">New Manager Bounce</h4>
                  <p class="text-sm">First 5 games show +15% win rate improvement. Fade after game 10 when reality sets in.</p>
                </div>
              </div>

              <h3 class="text-xl font-semibold mb-4">Kelly Criterion Calculator</h3>
              <div class="p-6 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <p class="mb-4">Use our Kelly Calculator to determine optimal stake sizes:</p>
                <div class="bg-white dark:bg-slate-900 p-4 rounded-lg font-mono text-sm">
                  Stake % = (Probability × Odds - 1) / (Odds - 1)
                </div>
                <p class="text-sm mt-4 text-amber-600">⚠️ Never bet more than 25% of Kelly recommendation for safety.</p>
              </div>
            </div>

          {:else if selectedSection === 'features'}
            <div class="prose prose-slate dark:prose-invert max-w-none">
              <h2 class="text-3xl font-bold mb-6 gradient-text">Features Guide</h2>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div class="glass-card p-6">
                  <h3 class="font-bold text-lg mb-3">📊 Dashboard</h3>
                  <p class="text-sm mb-3">Your command center for all Premier League data and predictions.</p>
                  <ul class="text-sm space-y-1">
                    <li>• Live standings</li>
                    <li>• Upcoming fixtures</li>
                    <li>• Recent results</li>
                    <li>• Team performance metrics</li>
                  </ul>
                </div>
                
                <div class="glass-card p-6">
                  <h3 class="font-bold text-lg mb-3">🔮 Predictions</h3>
                  <p class="text-sm mb-3">Advanced statistical models for match outcome predictions.</p>
                  <ul class="text-sm space-y-1">
                    <li>• Three-model consensus</li>
                    <li>• Confidence ratings</li>
                    <li>• Expected scores</li>
                    <li>• Head-to-head history</li>
                  </ul>
                </div>
                
                <div class="glass-card p-6">
                  <h3 class="font-bold text-lg mb-3">📈 Kelly Calculator</h3>
                  <p class="text-sm mb-3">Optimize your stake sizes using the Kelly Criterion formula.</p>
                  <ul class="text-sm space-y-1">
                    <li>• Input odds and probability</li>
                    <li>• Get recommended stake</li>
                    <li>• Adjust for risk tolerance</li>
                    <li>• Track bankroll growth</li>
                  </ul>
                </div>
                
                <div class="glass-card p-6">
                  <h3 class="font-bold text-lg mb-3">💎 Value Bets</h3>
                  <p class="text-sm mb-3">Identify opportunities where odds exceed true probability.</p>
                  <ul class="text-sm space-y-1">
                    <li>• Automatic value detection</li>
                    <li>• Expected ROI calculation</li>
                    <li>• Risk assessment</li>
                    <li>• Historical performance</li>
                  </ul>
                </div>
                
                <div class="glass-card p-6">
                  <h3 class="font-bold text-lg mb-3">🤖 AI Assistant</h3>
                  <p class="text-sm mb-3">Get intelligent insights and explanations for predictions.</p>
                  <ul class="text-sm space-y-1">
                    <li>• Natural language queries</li>
                    <li>• Statistical explanations</li>
                    <li>• Trend analysis</li>
                    <li>• Custom recommendations</li>
                  </ul>
                </div>
                
                <div class="glass-card p-6">
                  <h3 class="font-bold text-lg mb-3">📱 Mobile Features</h3>
                  <p class="text-sm mb-3">Full functionality on all devices with responsive design.</p>
                  <ul class="text-sm space-y-1">
                    <li>• Swipe navigation</li>
                    <li>• Touch-optimized controls</li>
                    <li>• Offline caching</li>
                    <li>• Push notifications</li>
                  </ul>
                </div>
              </div>
            </div>

          {:else if selectedSection === 'security'}
            <div class="prose prose-slate dark:prose-invert max-w-none">
              <h2 class="text-3xl font-bold mb-6 gradient-text">Privacy & Security</h2>
              
              <div class="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl mb-8">
                <h3 class="text-xl font-semibold mb-4">🔒 Your Data is Safe</h3>
                <p class="mb-4">We take your privacy seriously. Here's how we protect your information:</p>
                <ul class="space-y-2">
                  <li class="flex items-start gap-3">
                    <Shield class="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <strong>Local Storage Only</strong>
                      <p class="text-sm">Your API key is stored locally in your browser, never on our servers.</p>
                    </div>
                  </li>
                  <li class="flex items-start gap-3">
                    <Shield class="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <strong>No Data Collection</strong>
                      <p class="text-sm">We don't track, store, or analyze your personal data or usage patterns.</p>
                    </div>
                  </li>
                  <li class="flex items-start gap-3">
                    <Shield class="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <strong>Direct API Calls</strong>
                      <p class="text-sm">All data comes directly from Football-Data.org, bypassing our servers.</p>
                    </div>
                  </li>
                  <li class="flex items-start gap-3">
                    <Shield class="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <strong>Open Source</strong>
                      <p class="text-sm">Our code is publicly available for security audits and transparency.</p>
                    </div>
                  </li>
                </ul>
              </div>

              <h3 class="text-xl font-semibold mb-4">API Key Security</h3>
              <div class="p-6 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <h4 class="font-semibold mb-3">Best Practices:</h4>
                <ul class="space-y-2 text-sm">
                  <li>✅ Use a dedicated API key for this app</li>
                  <li>✅ Rotate keys periodically</li>
                  <li>✅ Never share your API key</li>
                  <li>✅ Monitor usage in Football-Data.org dashboard</li>
                  <li>✅ Report any suspicious activity immediately</li>
                </ul>
              </div>
            </div>

          {:else if selectedSection === 'faq'}
            <div class="prose prose-slate dark:prose-invert max-w-none">
              <h2 class="text-3xl font-bold mb-6 gradient-text">Frequently Asked Questions</h2>
              
              <div class="space-y-6">
                <div class="p-6 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <h3 class="font-semibold text-lg mb-2">How accurate are the predictions?</h3>
                  <p>Our models achieve 60-65% accuracy on average, with high-confidence predictions reaching 75-85% accuracy when all models agree.</p>
                </div>
                
                <div class="p-6 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <h3 class="font-semibold text-lg mb-2">Is this app free to use?</h3>
                  <p>Yes! The app is completely free. You just need a free API key from Football-Data.org, which includes 10 requests per minute.</p>
                </div>
                
                <div class="p-6 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <h3 class="font-semibold text-lg mb-2">Why am I seeing "Rate Limit Exceeded" errors?</h3>
                  <p>The free API tier allows 10 requests per minute. Wait 60 seconds and try again, or consider upgrading your API plan for more requests.</p>
                </div>
                
                <div class="p-6 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <h3 class="font-semibold text-lg mb-2">Can I use this for betting?</h3>
                  <p>The app provides statistical analysis for research and entertainment. Any betting decisions are your responsibility. Always gamble responsibly.</p>
                </div>
                
                <div class="p-6 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <h3 class="font-semibold text-lg mb-2">How often is data updated?</h3>
                  <p>Match data updates in real-time during games. Statistics and predictions refresh every 5 minutes when you're using the app.</p>
                </div>
                
                <div class="p-6 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <h3 class="font-semibold text-lg mb-2">Does it work offline?</h3>
                  <p>The app caches recent data for offline viewing, but requires an internet connection for live updates and new predictions.</p>
                </div>
                
                <div class="p-6 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <h3 class="font-semibold text-lg mb-2">Can I export the data?</h3>
                  <p>Currently, you can copy data from tables. Full export functionality is planned for a future update.</p>
                </div>
                
                <div class="p-6 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <h3 class="font-semibold text-lg mb-2">Will you add other leagues?</h3>
                  <p>We're focusing on perfecting Premier League predictions first. Other leagues are on our roadmap for future versions.</p>
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