<script lang="ts">
  import { onMount } from 'svelte';
  import { Line } from 'svelte-chartjs';
  import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    LineElement,
    LineController,
    LinearScale,
    CategoryScale,
    PointElement,
    Filler,
    type ChartData,
    type ChartOptions
  } from 'chart.js';
  import { format } from 'date-fns';
  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import { TrendingUp, Users, Target, BarChart2 } from 'lucide-svelte';
  import { supabase, hasValidSupabaseConfig, getRecentMatches } from '../lib/supabase';
  import EnhancedVisualizations from './EnhancedVisualizations.svelte';
  import type { Match } from '../types';

  // Register all required Chart.js components
  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    LineController,
    Title,
    Tooltip,
    Legend,
    Filler
  );

  let recentMatches: Match[] = [];
  let loading = true;
  let error: string | null = null;

  // Animated counters
  let totalMatches = tweened(0, { duration: 1500, easing: cubicOut });
  let totalGoals = tweened(0, { duration: 1800, easing: cubicOut });
  let averageGoals = tweened(0, { duration: 1200, easing: cubicOut });
  let queriesExecuted = tweened(0, { duration: 1400, easing: cubicOut });

  // Statistics
  let homeWinPercentage = 0;
  let mostCommonScore = '0-0';
  let topScoringTeam = '';
  let totalTeams = 0;

  let goalsChart: ChartData<"line", number[], string> = {
    labels: [],
    datasets: [{
      label: 'Goals per Match',
      data: [],
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      tension: 0.4,
      fill: true
    }]
  };

  let chartCanvas: HTMLCanvasElement;

  $: stats = [
    {
      title: 'Total Matches',
      value: $totalMatches.toFixed(0),
      change: `${totalTeams} teams`,
      icon: Target,
      color: 'text-green-500 dark:text-green-400',
      bgColor: 'bg-green-500/10 dark:bg-green-500/20'
    },
    {
      title: 'Total Goals',
      value: $totalGoals.toFixed(0),
      change: `${$averageGoals.toFixed(1)} per match`,
      icon: TrendingUp,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-500/10 dark:bg-emerald-500/20'
    },
    {
      title: 'Home Win %',
      value: `${homeWinPercentage.toFixed(1)}%`,
      change: mostCommonScore ? `${mostCommonScore} most common` : 'Calculating...',
      icon: Users,
      color: 'text-sky-600 dark:text-sky-400',
      bgColor: 'bg-sky-500/10 dark:bg-sky-500/20'
    },
    {
      title: 'Queries Run',
      value: $queriesExecuted.toFixed(0),
      change: 'Today',
      icon: BarChart2,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-500/10 dark:bg-amber-500/20'
    }
  ];

  async function loadDashboardData() {
    try {
      loading = true;
      error = null;

      if (!hasValidSupabaseConfig()) {
        // Use demo data
        recentMatches = await getRecentMatches(50);
        calculateStats(recentMatches);
        loading = false;
        return;
      }

      // Fetch 2025-2026 season matches for statistics
      const { data: allMatches, error: matchError } = await supabase
        .from('matches')
        .select('*')
        .eq('season_id', '2025-26')
        .order('date', { ascending: false });

      if (matchError) {
        console.error('Error fetching matches:', matchError);
        // Fallback to all matches if 2025-26 not found
        const { data: fallbackMatches } = await supabase
          .from('matches')
          .select('*')
          .order('date', { ascending: false })
          .limit(20);
        recentMatches = (fallbackMatches || []) as Match[];
      } else {
        recentMatches = (allMatches || []) as Match[];
      }
      calculateStats(recentMatches);

      // Update query count
      const savedCount = localStorage.getItem('query_count');
      queriesExecuted.set(savedCount ? parseInt(savedCount) : 0);

    } catch (err) {
      console.error('Dashboard error:', err);
      error = 'Failed to load dashboard data';
    } finally {
      loading = false;
    }
  }

  function calculateStats(matches: Match[]) {
    if (!matches || matches.length === 0) return;

    // Filter matches with valid results
    const validMatches = matches.filter(m =>
      m.home_score !== null &&
      m.away_score !== null
    );

    // Total matches and goals
    totalMatches.set(validMatches.length);

    const goals = validMatches.reduce((sum, m) =>
      sum + (m.home_score || 0) + (m.away_score || 0), 0
    );
    totalGoals.set(goals);

    const avgGoals = validMatches.length > 0 ? goals / validMatches.length : 0;
    averageGoals.set(avgGoals);

    // Home win percentage
    const homeWins = validMatches.filter(m => m.result === 'H').length;
    homeWinPercentage = validMatches.length > 0
      ? (homeWins / validMatches.length) * 100
      : 0;

    // Most common score
    const scoreMap = new Map<string, number>();
    validMatches.forEach(m => {
      const score = `${m.home_score}-${m.away_score}`;
      scoreMap.set(score, (scoreMap.get(score) || 0) + 1);
    });

    let maxCount = 0;
    scoreMap.forEach((count, score) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommonScore = score;
      }
    });

    // Count unique teams
    const teams = new Set<string>();
    validMatches.forEach(m => {
      teams.add(m.home_team);
      teams.add(m.away_team);
    });
    totalTeams = teams.size;

    // Top scoring team
    const teamGoals = new Map<string, number>();
    validMatches.forEach(m => {
      teamGoals.set(m.home_team,
        (teamGoals.get(m.home_team) || 0) + (m.home_score || 0)
      );
      teamGoals.set(m.away_team,
        (teamGoals.get(m.away_team) || 0) + (m.away_score || 0)
      );
    });

    let maxGoals = 0;
    teamGoals.forEach((goals, team) => {
      if (goals > maxGoals) {
        maxGoals = goals;
        topScoringTeam = team;
      }
    });

    // Update chart data - last 10 matches
    const last10 = validMatches.slice(0, 10).reverse();
    goalsChart.labels = last10.map(m =>
      format(new Date(m.date), 'MMM d')
    );
    goalsChart.datasets[0].data = last10.map(m =>
      (m.home_score || 0) + (m.away_score || 0)
    );
  }

  onMount(() => {
    loadDashboardData();

    // Initialize patterns chart
    if (chartCanvas) {
      const ctx = chartCanvas.getContext('2d');
      if (ctx) {
        new ChartJS(ctx, {
          type: 'line',
          data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [{
              label: 'Matches Analyzed',
              data: [12, 18, 25, 30],
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              tension: 0.4,
              fill: true,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                grid: {
                  color: 'rgba(156, 163, 175, 0.1)'
                },
                ticks: {
                  color: 'rgb(156, 163, 175)'
                }
              },
              x: {
                grid: {
                  display: false
                },
                ticks: {
                  color: 'rgb(156, 163, 175)'
                }
              }
            }
          }
        });
      }
    }
  });
</script>

<div class="space-y-8">
  <!-- Hero Section -->
  <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 p-8 text-white">
    <!-- Animated background -->
    <div class="absolute inset-0 overflow-hidden">
      <div class="absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full animate-float"></div>
      <div class="absolute top-20 -right-10 w-32 h-32 bg-white/5 rounded-full animate-float" style="animation-delay: 2s;"></div>
      <div class="absolute -bottom-10 left-20 w-36 h-36 bg-white/5 rounded-full animate-float" style="animation-delay: 4s;"></div>
    </div>

    <div class="relative z-10">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div class="flex-1">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-3 h-3 bg-green-400 rounded-full live-pulse"></div>
            <span class="text-green-200 text-sm font-semibold tracking-wide uppercase">LIVE ANALYTICS</span>
          </div>
          <h1 class="text-4xl md:text-5xl font-black mb-3">
            SQL-Ball Analytics
          </h1>
          <p class="text-green-100 text-lg md:text-xl mb-6 max-w-2xl">
            RAG-powered natural language to SQL conversion for Premier League data insights
          </p>

          <!-- Quick stats -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="text-center p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <div class="text-2xl font-bold">{$averageGoals.toFixed(1)}</div>
              <div class="text-xs text-green-200">Avg Goals</div>
            </div>
            <div class="text-center p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <div class="text-2xl font-bold">{homeWinPercentage.toFixed(1)}%</div>
              <div class="text-xs text-green-200">Home Wins</div>
            </div>
            <div class="text-center p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <div class="text-2xl font-bold">{mostCommonScore}</div>
              <div class="text-xs text-green-200">Common Score</div>
            </div>
            <div class="text-center p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <div class="text-2xl font-bold">{totalTeams}</div>
              <div class="text-xs text-green-200">Teams</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Stats Grid -->
  {#if loading}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {#each Array(4) as _}
        <div class="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-lg">
          <div class="animate-pulse">
            <div class="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-lg mb-3"></div>
            <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24 mb-2"></div>
            <div class="h-8 bg-slate-200 dark:bg-slate-700 rounded w-32 mb-2"></div>
            <div class="h-3 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
          </div>
        </div>
      {/each}
    </div>
  {:else if error}
    <div class="p-8 text-center bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
      <p class="text-red-600 dark:text-red-400">{error}</p>
      <button on:click={loadDashboardData} class="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
        Retry
      </button>
    </div>
  {:else}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {#each stats as stat, i}
        <div class="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
          <div class="flex items-start justify-between mb-4">
            <div class="{stat.bgColor} p-3 rounded-lg">
              <svelte:component this={stat.icon} class="w-6 h-6 {stat.color}" />
            </div>
          </div>
          <div class="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
            {stat.title}
          </div>
          <div class="text-2xl font-bold text-slate-900 dark:text-white mb-1">
            {stat.value}
          </div>
          <div class="text-xs text-slate-500 dark:text-slate-500">
            {stat.change}
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Charts -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div class="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-lg">
      <h3 class="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Goals Trend</h3>
      <div class="h-64">
        {#if !loading && goalsChart.labels.length > 0}
          <Line data={goalsChart} options={{ responsive: true, maintainAspectRatio: false }} />
        {:else}
          <div class="flex items-center justify-center h-full text-slate-400">
            No data available
          </div>
        {/if}
      </div>
    </div>

    <div class="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-lg">
      <h3 class="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Analysis Progress</h3>
      <div class="h-64">
        <canvas bind:this={chartCanvas}></canvas>
      </div>
    </div>
  </div>

  <!-- How We Analyze -->
  <div class="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-lg">
    <h3 class="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
      <Target class="w-5 h-5 text-green-500" />
      How We Analyze
    </h3>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="text-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
        <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg mx-auto mb-3 flex items-center justify-center">
          <BarChart2 class="w-5 h-5 text-blue-600" />
        </div>
        <h4 class="font-semibold text-sm mb-1">RAG System</h4>
        <p class="text-xs text-slate-600 dark:text-slate-400">Natural language to SQL</p>
      </div>
      <div class="text-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
        <div class="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg mx-auto mb-3 flex items-center justify-center">
          <TrendingUp class="w-5 h-5 text-green-600" />
        </div>
        <h4 class="font-semibold text-sm mb-1">Pattern Discovery</h4>
        <p class="text-xs text-slate-600 dark:text-slate-400">Automatic anomaly detection</p>
      </div>
      <div class="text-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
        <div class="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg mx-auto mb-3 flex items-center justify-center">
          <Users class="w-5 h-5 text-purple-600" />
        </div>
        <h4 class="font-semibold text-sm mb-1">Vector Embeddings</h4>
        <p class="text-xs text-slate-600 dark:text-slate-400">Semantic database search</p>
      </div>
      <div class="text-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
        <div class="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg mx-auto mb-3 flex items-center justify-center">
          <Target class="w-5 h-5 text-amber-600" />
        </div>
        <h4 class="font-semibold text-sm mb-1">Statistical Analysis</h4>
        <p class="text-xs text-slate-600 dark:text-slate-400">Historical trend analysis</p>
      </div>
    </div>
  </div>

  <!-- Recent Matches & Top Teams -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div class="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-lg">
      <h3 class="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Recent Matches</h3>
      <div class="space-y-3">
        {#if loading}
          <div class="animate-pulse space-y-3">
            {#each Array(5) as _}
              <div class="h-12 bg-slate-200 dark:bg-slate-700 rounded"></div>
            {/each}
          </div>
        {:else if recentMatches.length > 0}
          {#each recentMatches.slice(0, 5) as match}
            <div class="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <div class="flex-1">
                <div class="text-sm font-medium text-slate-900 dark:text-white">
                  {match.home_team} vs {match.away_team}
                </div>
                <div class="text-xs text-slate-500">
                  {format(new Date(match.date), 'MMM d, yyyy')}
                </div>
              </div>
              <div class="text-lg font-bold text-slate-900 dark:text-white">
                {match.home_score ?? '-'} - {match.away_score ?? '-'}
              </div>
            </div>
          {/each}
        {:else}
          <p class="text-center text-slate-500">No matches available</p>
        {/if}
      </div>
    </div>

    <div class="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-lg">
      <h3 class="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Quick Stats</h3>
      <div class="space-y-4">
        <div class="flex justify-between items-center">
          <span class="text-sm text-slate-600 dark:text-slate-400">Top Scoring Team</span>
          <span class="font-semibold text-slate-900 dark:text-white">{topScoringTeam || 'N/A'}</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-sm text-slate-600 dark:text-slate-400">Total Matches</span>
          <span class="font-semibold text-slate-900 dark:text-white">{$totalMatches.toFixed(0)}</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-sm text-slate-600 dark:text-slate-400">Total Goals</span>
          <span class="font-semibold text-slate-900 dark:text-white">{$totalGoals.toFixed(0)}</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-sm text-slate-600 dark:text-slate-400">Goals per Match</span>
          <span class="font-semibold text-slate-900 dark:text-white">{$averageGoals.toFixed(2)}</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-sm text-slate-600 dark:text-slate-400">Most Common Score</span>
          <span class="font-semibold text-slate-900 dark:text-white">{mostCommonScore}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Enhanced Visualizations -->
  {#if !loading && recentMatches.length > 0}
    <div>
      <h2 class="text-2xl font-bold text-slate-800 dark:text-green-400 mb-6 flex items-center gap-3">
        <BarChart2 class="w-8 h-8 text-green-500" />
        Advanced Match Analytics
      </h2>
      <EnhancedVisualizations matches={recentMatches} />
    </div>
  {/if}
</div>

<style>
  @keyframes float {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(10deg); }
  }

  .animate-float {
    animation: float 20s ease-in-out infinite;
  }

  .live-pulse {
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
</style>