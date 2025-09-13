<script lang="ts">
  import { onMount } from 'svelte';
  import { Line } from 'svelte-chartjs';
  import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    LineElement,
    LinearScale,
    CategoryScale,
    PointElement,
    Filler,
    type ChartData
  } from 'chart.js';
  import { dataService } from '../services/dataService';
  import { PatternDiscovery } from '../lib/analytics/patternDiscovery';
  import type { Match } from '../types';
  import { format } from 'date-fns';
  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import { TrendingUp, Users, Target, BarChart2 } from 'lucide-svelte';
  import EnhancedVisualizations from './EnhancedVisualizations.svelte';
  ChartJS.register(
    Title,
    Tooltip,
    Legend,
    LineElement,
    LinearScale,
    CategoryScale,
    PointElement,
    Filler
  );

  let recentMatches: Match[] = [];
  let patterns: any[] = [];
  let unusualMatches: any[] = [];
  let loading = true;
  let error: string | null = null;
  let totalMatches = tweened(0, { duration: 1500, easing: cubicOut });
  let patternsFound = tweened(0, { duration: 1800, easing: cubicOut });
  let anomaliesDetected = tweened(0, { duration: 1200, easing: cubicOut });
  let queriesExecuted = tweened(0, { duration: 1400, easing: cubicOut });
  
  // Temporary variables for template compatibility
  let overallAccuracy = tweened(0, { duration: 1500, easing: cubicOut });
  let profitMargin = tweened(0, { duration: 1500, easing: cubicOut });
  let upcomingPredictions = 0;
  let topPredictions: any[] = [];
  let realMatchData: Match[] = [];

  let recentPerformance: ChartData<"line", number[], string> = {
    labels: [] as string[],
    datasets: [{
      label: 'Patterns Discovered',
      data: [] as number[],
      borderColor: '#00ff00',
      tension: 0.4,
      fill: false
    }]
  };

  // Analytics tracking variables
  let averageGoalsPerMatch = 0;
  let mostCommonScore = '0-0';
  let homeWinPercentage = 0;
  let topScoringTeam = '';

  let profitChartCanvas: HTMLCanvasElement;

  // Reactive stats that update with animations
  $: stats = [
    {
      title: 'Total Matches',
      value: $totalMatches.toLocaleString(),
      change: '+38 this week',
      icon: Target,
      color: 'text-green-500 dark:text-green-400',
      bgColor: 'bg-green-500/10 dark:bg-green-500/20'
    },
    {
      title: 'Patterns Found',
      value: $patternsFound.toLocaleString(),
      change: '+12 new',
      icon: TrendingUp,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-500/10 dark:bg-emerald-500/20'
    },
    {
      title: 'Anomalies',
      value: $anomaliesDetected.toLocaleString(),
      change: '+5 unusual',
      icon: Users,
      color: 'text-sky-600 dark:text-sky-400',
      bgColor: 'bg-sky-500/10 dark:bg-sky-500/20'
    },
    {
      title: 'Queries Run',
      value: $queriesExecuted.toLocaleString(),
      change: '+234 today',
      icon: BarChart2,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-500/10 dark:bg-amber-500/20'
    }
  ];

  export async function refresh() {
    await loadDashboardData();
  }
  
  async function loadDashboardData() {
    try {
      loading = true;
      error = null;

      // Get recent and upcoming matches from API
      const [recent, upcoming] = await Promise.all([
        dataService.getMatches({ recent: true, days: 30 }),
        dataService.getMatches({ upcoming: true, days: 7 })
      ]);
      
      recentMatches = recent;
      realMatchData = upcoming;
      
      if (recentMatches.length === 0) {
        error = "No matches found for the current season";
        return;
      }

      // Calculate analytics statistics
      const matchesWithResults = recentMatches.filter(m => m.result);
      
      // Calculate average goals per match
      const totalGoals = matchesWithResults.reduce((sum, match) => {
        return sum + (match.home_goals || 0) + (match.away_goals || 0);
      }, 0);
      averageGoalsPerMatch = matchesWithResults.length > 0 ? totalGoals / matchesWithResults.length : 0;
      
      // Find most common score
      const scoreFrequency = new Map<string, number>();
      matchesWithResults.forEach(match => {
        const score = `${match.home_goals}-${match.away_goals}`;
        scoreFrequency.set(score, (scoreFrequency.get(score) || 0) + 1);
      });
      
      let maxFreq = 0;
      scoreFrequency.forEach((freq, score) => {
        if (freq > maxFreq) {
          maxFreq = freq;
          mostCommonScore = score;
        }
      });
      
      // Calculate home win percentage
      const homeWins = matchesWithResults.filter(m => m.result === 'H').length;
      homeWinPercentage = matchesWithResults.length > 0 ? (homeWins / matchesWithResults.length) * 100 : 0;
      
      // Find top scoring team
      const teamGoals = new Map<string, number>();
      matchesWithResults.forEach(match => {
        teamGoals.set(match.home_team, (teamGoals.get(match.home_team) || 0) + (match.home_goals || 0));
        teamGoals.set(match.away_team, (teamGoals.get(match.away_team) || 0) + (match.away_goals || 0));
      });
      
      let maxGoals = 0;
      teamGoals.forEach((goals, team) => {
        if (goals > maxGoals) {
          maxGoals = goals;
          topScoringTeam = team;
        }
      });
      
      // Update chart data for patterns discovered over time
      recentPerformance.labels = recentMatches
        .slice(0, 5)
        .map(match => format(new Date(match.date), 'MMM d'));
      recentPerformance.datasets[0].data = Array.from({length: 5}, () => Math.floor(Math.random() * 10 + 5));
      
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      error = "Failed to load dashboard data";
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    loadDashboardData();

    const ctx = profitChartCanvas.getContext('2d');
    if (ctx) {
      new ChartJS(ctx, {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [{
            label: 'Patterns Discovered',
            data: [12, 18, 15, 25, 22, 28],
            borderColor: '#00ff00',
            backgroundColor: 'rgba(0, 255, 0, 0.1)',
            tension: 0.4,
            fill: true,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: 'hsla(var(--text-base) / 0.1)'
              },
              ticks: {
                 color: 'hsl(var(--text-muted))'
              }
            },
            x: {
               grid: {
                display: false
              },
              ticks: {
                 color: 'hsl(var(--text-muted))'
              }
            }
          },
          plugins: {
            legend: {
              display: false
            }
          }
        }
      });
    }
  });
</script>

<div class="space-y-8">
  <!-- 🚀 STUNNING HERO SECTION -->
  <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 p-8 text-white animate-slide-in-up">
    <!-- Animated background elements -->
    <div class="absolute inset-0 overflow-hidden">
      <div class="absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full animate-float" style="animation-delay: 0s;"></div>
      <div class="absolute top-20 -right-10 w-32 h-32 bg-white/5 rounded-full animate-float" style="animation-delay: 2s;"></div>
      <div class="absolute -bottom-10 left-20 w-36 h-36 bg-white/5 rounded-full animate-float" style="animation-delay: 4s;"></div>
    </div>
    
    <!-- Hero content -->
    <div class="relative z-10">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div class="flex-1">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-3 h-3 bg-green-400 rounded-full live-pulse"></div>
            <span class="text-green-200 text-sm font-semibold tracking-wide uppercase">LIVE ANALYTICS</span>
          </div>
          <h1 class="text-4xl md:text-5xl font-black mb-3 text-transparent bg-gradient-to-r from-white to-blue-100 bg-clip-text">
            SQL-Ball Analytics
          </h1>
          <p class="text-blue-100 text-lg md:text-xl mb-6 max-w-2xl">
            RAG-powered natural language to SQL conversion for Premier League data insights
          </p>
          
          <!-- Quick stats row -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="text-center p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <div class="text-2xl font-bold">{averageGoalsPerMatch.toFixed(1)}</div>
              <div class="text-xs text-blue-200">Avg Goals</div>
            </div>
            <div class="text-center p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <div class="text-2xl font-bold">{homeWinPercentage.toFixed(1)}%</div>
              <div class="text-xs text-blue-200">Home Wins</div>
            </div>
            <div class="text-center p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <div class="text-2xl font-bold">{mostCommonScore}</div>
              <div class="text-xs text-blue-200">Common Score</div>
            </div>
            <div class="text-center p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <div class="text-2xl font-bold">{recentMatches.length}</div>
              <div class="text-xs text-blue-200">Matches</div>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  </div>

  <!-- Stats Grid -->
  {#if loading}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {#each Array(4) as _, i}
        <div class="card-stats">
          <div class="skeleton w-12 h-12 rounded-lg mb-3"></div>
          <div class="skeleton h-4 w-24 mb-2"></div>
          <div class="skeleton h-8 w-32 mb-2"></div>
          <div class="skeleton h-3 w-20"></div>
        </div>
      {/each}
    </div>
  {:else if error}
    <div class="p-8 text-center bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
      <p class="text-red-600 dark:text-red-400">{error}</p>
      <button on:click={loadDashboardData} class="btn btn-primary mt-4">Retry</button>
    </div>
  {:else}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {#each stats as stat, i}
        <div class="card-stats animate-float-subtle" style="animation-delay: {i * 100}ms">
          <div class="stat-icon-wrapper {stat.bgColor}">
            <svelte:component this={stat.icon} class="w-6 h-6 {stat.color}" />
          </div>
          <div class="stat-label">{stat.title}</div>
          <div class="stat-value">{stat.value}</div>
          <div class="stat-change {stat.change.startsWith('+') ? 'text-success dark:text-success-light' : 'text-error dark:text-error-light'}">
            {stat.change}
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Charts Row -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div class="chart-container animate-slide-in-up" style="animation-delay: 400ms">
      <h3 class="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">Prediction Accuracy Trend</h3>
      <div class="h-64">
        <Line data={recentPerformance} options={{ responsive: true, maintainAspectRatio: false }} />
      </div>
    </div>
    <div class="chart-container animate-slide-in-up" style="animation-delay: 500ms">
      <h3 class="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">Patterns Discovered Over Time</h3>
      <div class="h-64">
        <canvas bind:this={profitChartCanvas}></canvas>
      </div>
    </div>
  </div>

  <!-- How We Analyze Section -->
  <div class="card card-glass animate-slide-in-up p-6" style="animation-delay: 800ms">
    <h3 class="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
      <Target class="w-5 h-5 text-primary" />
      How We Analyze
    </h3>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="text-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
        <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg mx-auto mb-2 flex items-center justify-center">
          <BarChart2 class="w-4 h-4 text-blue-600" />
        </div>
        <h4 class="font-semibold text-sm mb-1">RAG System</h4>
        <p class="text-xs text-slate-600 dark:text-slate-400">Natural language to SQL conversion</p>
      </div>
      <div class="text-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
        <div class="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg mx-auto mb-2 flex items-center justify-center">
          <TrendingUp class="w-4 h-4 text-green-600" />
        </div>
        <h4 class="font-semibold text-sm mb-1">Pattern Discovery</h4>
        <p class="text-xs text-slate-600 dark:text-slate-400">Automatic anomaly detection</p>
      </div>
      <div class="text-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
        <div class="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg mx-auto mb-2 flex items-center justify-center">
          <Users class="w-4 h-4 text-purple-600" />
        </div>
        <h4 class="font-semibold text-sm mb-1">Vector Embeddings</h4>
        <p class="text-xs text-slate-600 dark:text-slate-400">Semantic database search</p>
      </div>
      <div class="text-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
        <div class="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg mx-auto mb-2 flex items-center justify-center">
          <Target class="w-4 h-4 text-amber-600" />
        </div>
        <h4 class="font-semibold text-sm mb-1">Statistical Analysis</h4>
        <p class="text-xs text-slate-600 dark:text-slate-400">Historical trend analysis</p>
      </div>
    </div>
    <div class="mt-4 p-3 bg-primary/10 dark:bg-primary/20 rounded-lg">
      <p class="text-sm text-slate-700 dark:text-slate-300">
        <strong>Live Analysis:</strong> Our system processes {recentMatches.length} recent matches, 
        discovers {patterns.length} patterns, and analyzes {unusualMatches.length} unusual results using advanced RAG technology for 
        natural language query processing.
      </p>
    </div>
  </div>

  <!-- Recent Activity/Matches -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div class="lg:col-span-2 card card-glass animate-slide-in-up" style="animation-delay: 600ms">
      <h3 class="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Top Patterns Found</h3>
      {#if loading}
        <div class="space-y-3">
          {#each Array(3) as _}
            <div class="flex justify-between items-center p-2">
              <div class="skeleton h-4 w-48"></div>
              <div class="skeleton h-6 w-20 rounded-full"></div>
            </div>
          {/each}
        </div>
      {:else if patterns.length === 0}
        <div class="text-center py-8 text-slate-500 dark:text-slate-400">
          <p>No patterns discovered yet</p>
        </div>
      {:else}
        <ul class="space-y-3">
          {#each patterns.slice(0, 5) as pattern, i}
            <li class="flex justify-between items-center p-2 rounded hover:bg-primary/5" style="animation-delay: {i * 100}ms">
              <div class="flex-1">
                <span class="text-sm font-medium">{pattern.title}</span>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">{pattern.description}</p>
              </div>
              <div class="flex items-center gap-2">
                <span class="badge badge-{pattern.significance === 'very-high' ? 'error' : pattern.significance === 'high' ? 'warning' : 'info'}">
                  {pattern.significance}
                </span>
              </div>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
    <div class="card card-glass animate-slide-in-up" style="animation-delay: 700ms">
      <h3 class="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Recent Unusual Matches</h3>
      <ul class="space-y-2">
        {#each unusualMatches.slice(0, 5) as match}
          <li class="text-sm text-slate-500 dark:text-slate-400">
            {match.home_team} vs {match.away_team}
            <span class="block text-xs text-slate-400">
              {format(new Date(match.date), 'MMM d, HH:mm')}
            </span>
          </li>
        {/each}
        {#if unusualMatches.length === 0}
          <li class="text-sm text-slate-500 dark:text-slate-400">No upcoming matches</li>
        {/if}
      </ul>
      <button class="btn btn-secondary btn-sm mt-4 w-full">View All Matches</button>
    </div>
  </div>

  <!-- Enhanced Visualizations Section -->
  <div class="animate-slide-in-up" style="animation-delay: 1000ms">
    <h2 class="text-2xl font-bold text-slate-800 dark:text-green-400 mb-6 flex items-center gap-3">
      <BarChart2 class="w-8 h-8 text-green-500" />
      Advanced Match Analytics
    </h2>
    <EnhancedVisualizations matches={recentMatches} />
  </div>
</div>

<style global lang="postcss">
  .shadow-glow-warning-sm {
    box-shadow: 0 0 8px hsla(39, 90%, 55%, 0.3), inset 0 0 10px hsla(39, 90%, 55%, 0.05);
  }
  .shadow-glow-warning-md {
    box-shadow: 0 0 15px hsla(39, 90%, 55%, 0.4), inset 0 0 15px hsla(39, 90%, 55%, 0.1);
  }
</style>