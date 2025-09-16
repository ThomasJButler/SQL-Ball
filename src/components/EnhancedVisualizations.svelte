<script lang="ts">
  import { onMount } from 'svelte';
  import { Line, Bar, Doughnut, Radar } from 'svelte-chartjs';
  import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    LineElement,
    BarElement,
    LinearScale,
    CategoryScale,
    PointElement,
    Filler,
    ArcElement,
    RadialLinearScale,
    type ChartData,
    type ChartOptions
  } from 'chart.js';
  import type { Match } from '../types';
  import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
  import { Calendar, TrendingUp, Activity, BarChart3 } from 'lucide-svelte';

  ChartJS.register(
    Title,
    Tooltip,
    Legend,
    LineElement,
    BarElement,
    LinearScale,
    CategoryScale,
    PointElement,
    Filler,
    ArcElement,
    RadialLinearScale
  );

  export let matches: Match[] = [];
  export let selectedDateRange: string = 'all';
  export let selectedSeason: string = '2024-2025';

  let filteredMatches: Match[] = [];
  let chartTheme = 'dark';

  // League options
  const dateRanges = [
    { value: 'all', label: 'Full Season (All Data)', icon: '🏆' },
    { value: 'E1', label: 'Premier League', icon: '🏴' },
    { value: 'SP1', label: 'La Liga', icon: '🇪🇸' },
    { value: 'G1', label: 'Bundesliga', icon: '🇩🇪' }
  ];

  // Filter matches based on league
  $: {
    if (selectedDateRange === 'all') {
      // Show ALL data by default - no filtering!
      filteredMatches = matches;
    } else {
      filteredMatches = matches.filter(m => m.div === selectedDateRange);
    }
  }

  // Goals Over Time Chart
  $: goalsOverTimeData = (() => {
    const labels = filteredMatches.slice(-10).map(m => format(new Date(m.match_date), 'MMM dd'));
    const homeGoals = filteredMatches.slice(-10).map(m => m.home_score || 0);
    const awayGoals = filteredMatches.slice(-10).map(m => m.away_score || 0);

    return {
      labels,
      datasets: [
        {
          label: 'Home Goals',
          data: homeGoals,
          borderColor: '#00ff00',
          backgroundColor: 'rgba(0, 255, 0, 0.1)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Away Goals',
          data: awayGoals,
          borderColor: '#ff00ff',
          backgroundColor: 'rgba(255, 0, 255, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    };
  })();

  // Team Performance Radar Chart
  $: teamPerformanceData = (() => {
    const teams = ['Man City', 'Arsenal', 'Liverpool', 'Chelsea', 'Man United'];
    const stats = teams.map(team => {
      const teamMatches = filteredMatches.filter(m =>
        m.home_team?.includes(team) || m.away_team?.includes(team)
      );
      const wins = teamMatches.filter(m =>
        (m.home_team?.includes(team) && m.result === 'H') ||
        (m.away_team?.includes(team) && m.result === 'A')
      ).length;
      const goals = teamMatches.reduce((sum, m) => {
        if (m.home_team?.includes(team)) return sum + (m.home_score || 0);
        if (m.away_team?.includes(team)) return sum + (m.away_score || 0);
        return sum;
      }, 0);
      const shots = teamMatches.reduce((sum, m) => {
        if (m.home_team?.includes(team)) return sum + (m.home_shots || 0);
        if (m.away_team?.includes(team)) return sum + (m.away_shots || 0);
        return sum;
      }, 0);

      return {
        wins,
        goals,
        shots: Math.min(shots, 20), // Cap for visualization
        possession: 50 + Math.random() * 20, // Simulated
        passAccuracy: 75 + Math.random() * 15 // Simulated
      };
    });

    return {
      labels: ['Wins', 'Goals', 'Shots', 'Possession %', 'Pass Accuracy %'],
      datasets: teams.map((team, i) => ({
        label: team,
        data: [
          stats[i].wins * 10,
          stats[i].goals * 3,
          stats[i].shots * 2,
          stats[i].possession,
          stats[i].passAccuracy
        ],
        borderColor: ['#00ff00', '#ff00ff', '#00ffff', '#ffff00', '#ff0000'][i],
        backgroundColor: ['#00ff0020', '#ff00ff20', '#00ffff20', '#ffff0020', '#ff000020'][i],
        pointBackgroundColor: ['#00ff00', '#ff00ff', '#00ffff', '#ffff00', '#ff0000'][i],
        pointBorderColor: '#000',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: ['#00ff00', '#ff00ff', '#00ffff', '#ffff00', '#ff0000'][i]
      }))
    };
  })();

  // Match Results Distribution
  $: resultsDistributionData = (() => {
    const homeWins = filteredMatches.filter(m => m.result === 'H').length;
    const awayWins = filteredMatches.filter(m => m.result === 'A').length;
    const draws = filteredMatches.filter(m => m.result === 'D').length;

    return {
      labels: ['Home Wins', 'Away Wins', 'Draws'],
      datasets: [{
        data: [homeWins, awayWins, draws],
        backgroundColor: ['#00ff00', '#ff00ff', '#00ffff'],
        borderColor: ['#00ff0080', '#ff00ff80', '#00ffff80'],
        borderWidth: 2,
        hoverOffset: 4
      }]
    };
  })();

  // Goal Distribution Bar Chart
  $: goalDistributionData = (() => {
    const distribution: Record<string, number> = {};
    filteredMatches.forEach(m => {
      const totalGoals = (m.home_score || 0) + (m.away_score || 0);
      const key = totalGoals >= 6 ? '6+' : totalGoals.toString();
      distribution[key] = (distribution[key] || 0) + 1;
    });

    const labels = ['0', '1', '2', '3', '4', '5', '6+'];
    const data = labels.map(label => distribution[label] || 0);

    return {
      labels,
      datasets: [{
        label: 'Number of Matches',
        data,
        backgroundColor: 'rgba(0, 255, 0, 0.6)',
        borderColor: 'rgba(0, 255, 0, 1)',
        borderWidth: 2,
        borderRadius: 8,
        hoverBackgroundColor: 'rgba(0, 255, 0, 0.8)'
      }]
    };
  })();

  const chartOptions: ChartOptions<any> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: {
          color: '#00ff00',
          font: {
            family: 'monospace',
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#00ff00',
        bodyColor: '#00ff00',
        borderColor: '#00ff00',
        borderWidth: 1,
        titleFont: {
          family: 'monospace',
          size: 14
        },
        bodyFont: {
          family: 'monospace',
          size: 12
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(0, 255, 0, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: '#00ff00',
          font: {
            family: 'monospace',
            size: 10
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(0, 255, 0, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: '#00ff00',
          font: {
            family: 'monospace',
            size: 10
          }
        }
      }
    }
  };

  const radarOptions: ChartOptions<'radar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: '#00ff00',
          font: {
            family: 'monospace',
            size: 11
          },
          padding: 10
        }
      }
    },
    scales: {
      r: {
        angleLines: {
          color: 'rgba(0, 255, 0, 0.2)'
        },
        grid: {
          color: 'rgba(0, 255, 0, 0.2)'
        },
        pointLabels: {
          color: '#00ff00',
          font: {
            family: 'monospace',
            size: 10
          }
        },
        ticks: {
          color: '#00ff00',
          backdropColor: 'transparent',
          font: {
            size: 9
          }
        }
      }
    }
  };

  onMount(() => {
    // Check theme
    chartTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  });
</script>

<div class="space-y-6">
  <!-- Simplified Date Range Selector -->
  <div class="flex flex-wrap items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-green-500/20">
    <Calendar class="w-5 h-5 text-green-500" />
    <span class="text-sm font-semibold text-slate-600 dark:text-slate-400">View Data:</span>
    <div class="flex flex-wrap gap-2">
      {#each dateRanges as range}
        <button
          on:click={() => selectedDateRange = range.value}
          class="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all {
            selectedDateRange === range.value
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
              : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
          }"
        >
          <span>{range.icon}</span>
          <span>{range.label}</span>
        </button>
      {/each}
    </div>
  </div>

  <!-- Charts Grid -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Goals Over Time -->
    <div class="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-green-500/20">
      <div class="flex items-center gap-2 mb-4">
        <TrendingUp class="w-5 h-5 text-green-500" />
        <h3 class="text-lg font-bold text-slate-900 dark:text-green-400 font-mono">Goals Trend</h3>
      </div>
      <div class="h-64">
        <Line data={goalsOverTimeData} options={chartOptions} />
      </div>
    </div>

    <!-- Results Distribution -->
    <div class="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-green-500/20">
      <div class="flex items-center gap-2 mb-4">
        <Activity class="w-5 h-5 text-green-500" />
        <h3 class="text-lg font-bold text-slate-900 dark:text-green-400 font-mono">Results Distribution</h3>
      </div>
      <div class="h-64">
        <Doughnut data={resultsDistributionData} options={chartOptions} />
      </div>
    </div>

    <!-- Goal Distribution -->
    <div class="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-green-500/20">
      <div class="flex items-center gap-2 mb-4">
        <BarChart3 class="w-5 h-5 text-green-500" />
        <h3 class="text-lg font-bold text-slate-900 dark:text-green-400 font-mono">Goals per Match</h3>
      </div>
      <div class="h-64">
        <Bar data={goalDistributionData} options={chartOptions} />
      </div>
    </div>

    <!-- Team Performance Radar -->
    <div class="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-green-500/20">
      <div class="flex items-center gap-2 mb-4">
        <Activity class="w-5 h-5 text-green-500" />
        <h3 class="text-lg font-bold text-slate-900 dark:text-green-400 font-mono">Team Performance</h3>
      </div>
      <div class="h-64">
        <Radar data={teamPerformanceData} options={radarOptions} />
      </div>
    </div>
  </div>

  <!-- Stats Summary -->
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
    <div class="bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-xl p-4 border border-green-500/20">
      <p class="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Matches</p>
      <p class="text-2xl font-bold text-green-600 dark:text-green-400 font-mono">{filteredMatches.length}</p>
    </div>
    <div class="bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-xl p-4 border border-blue-500/20">
      <p class="text-sm text-slate-600 dark:text-slate-400 mb-1">Avg Goals/Match</p>
      <p class="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono">
        {(filteredMatches.reduce((sum, m) => sum + (m.home_score || 0) + (m.away_score || 0), 0) / Math.max(filteredMatches.length, 1)).toFixed(1)}
      </p>
    </div>
    <div class="bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-xl p-4 border border-purple-500/20">
      <p class="text-sm text-slate-600 dark:text-slate-400 mb-1">Home Win %</p>
      <p class="text-2xl font-bold text-purple-600 dark:text-purple-400 font-mono">
        {((filteredMatches.filter(m => m.result === 'H').length / Math.max(filteredMatches.length, 1)) * 100).toFixed(0)}%
      </p>
    </div>
    <div class="bg-gradient-to-br from-amber-500/10 to-amber-600/10 rounded-xl p-4 border border-amber-500/20">
      <p class="text-sm text-slate-600 dark:text-slate-400 mb-1">High Scoring</p>
      <p class="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">
        {filteredMatches.filter(m => (m.home_score || 0) + (m.away_score || 0) >= 4).length}
      </p>
    </div>
  </div>
</div>

<style>
  :global(.dark) {
    --chart-grid-color: rgba(0, 255, 0, 0.1);
    --chart-text-color: #00ff00;
  }
</style>
