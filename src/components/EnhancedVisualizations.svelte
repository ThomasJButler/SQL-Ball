<!--
@author Tom Butler
@date 2025-10-21
@description Interactive visualisation component for European league analytics. Renders team performance
             radars, goals-over-time trends, win distribution charts, and streaming animations.
             Filters data by selected league and initialises Chart.js theme from DOM.
-->
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
  let isLoading = false;
  let previousRange = selectedDateRange;

  // League options
  const dateRanges = [
    { value: 'all', label: 'Full Season (All Data)', icon: '🏆' },
    { value: 'E0', label: 'Premier League', icon: '🏴' },
    { value: 'SP1', label: 'La Liga', icon: '🇪🇸' },
    { value: 'D1', label: 'Bundesliga', icon: '🇩🇪' },
    { value: 'I1', label: 'Serie A', icon: '🇮🇹' },
    { value: 'F1', label: 'Ligue 1', icon: '🇫🇷' }
  ];

  // League-specific top teams (based on typical strong performers)
  const leagueTeams = {
    'E0': ['Man City', 'Arsenal', 'Liverpool', 'Chelsea', 'Man United', 'Newcastle', 'Tottenham', 'Brighton'],
    'SP1': ['Real Madrid', 'Barcelona', 'Atletico Madrid', 'Real Sociedad', 'Betis', 'Villarreal', 'Athletic Club', 'Valencia'],
    'D1': ['Bayern Munich', 'Dortmund', 'RB Leipzig', 'Union Berlin', 'Eintracht Frankfurt', 'Bayer Leverkusen', 'Freiburg', 'Wolfsburg'],
    'I1': ['Inter', 'Juventus', 'AC Milan', 'Napoli', 'Roma', 'Lazio', 'Atalanta', 'Fiorentina'],
    'F1': ['PSG', 'Marseille', 'Monaco', 'Lyon', 'Lille', 'Rennes', 'Nice', 'Lens']
  };

  // Filter matches based on league with loading state
  $: {
    if (selectedDateRange !== previousRange) {
      isLoading = true;
      previousRange = selectedDateRange;

      // Simulate loading for smooth transitions
      setTimeout(() => {
        if (selectedDateRange === 'all') {
          // Show ALL data by default - no filtering!
          filteredMatches = matches;
        } else {
          filteredMatches = matches.filter(m => m.div === selectedDateRange);
        }
        isLoading = false;
      }, 300);
    } else if (filteredMatches.length === 0 && matches.length > 0) {
      // Initial load
      if (selectedDateRange === 'all') {
        filteredMatches = matches;
      } else {
        filteredMatches = matches.filter(m => m.div === selectedDateRange);
      }
    }
  }

  // Get top teams dynamically from actual match data
  function getTopTeamsFromData(matches: Match[], maxTeams: number = 8) {
    const teamStats: Record<string, { points: number, matches: number, goals: number, wins: number }> = {};

    matches.forEach(match => {
      const homeTeam = match.home_team;
      const awayTeam = match.away_team;

      // Initialize teams if not exists
      if (!teamStats[homeTeam]) teamStats[homeTeam] = { points: 0, matches: 0, goals: 0, wins: 0 };
      if (!teamStats[awayTeam]) teamStats[awayTeam] = { points: 0, matches: 0, goals: 0, wins: 0 };

      // Update match count
      teamStats[homeTeam].matches++;
      teamStats[awayTeam].matches++;

      // Update goals
      teamStats[homeTeam].goals += match.home_score || 0;
      teamStats[awayTeam].goals += match.away_score || 0;

      // Update points and wins
      if (match.result === 'H') {
        teamStats[homeTeam].points += 3;
        teamStats[homeTeam].wins++;
      } else if (match.result === 'A') {
        teamStats[awayTeam].points += 3;
        teamStats[awayTeam].wins++;
      } else if (match.result === 'D') {
        teamStats[homeTeam].points += 1;
        teamStats[awayTeam].points += 1;
      }
    });

    // Sort teams by points, then by wins, then by goals
    const sortedTeams = Object.entries(teamStats)
      .filter(([_, stats]) => stats.matches >= 3) // Only teams with at least 3 matches
      .sort(([_, a], [__, b]) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.wins !== a.wins) return b.wins - a.wins;
        return b.goals - a.goals;
      })
      .slice(0, maxTeams)
      .map(([team, _]) => team);

    return sortedTeams;
  }

  // Get current league's top teams
  $: currentTopTeams = (() => {
    if (selectedDateRange === 'all') {
      // For all data, get top teams across all leagues
      return getTopTeamsFromData(filteredMatches, 8);
    } else {
      // Get top teams from actual data, fallback to predefined list
      const dataBasedTeams = getTopTeamsFromData(filteredMatches, 8);
      if (dataBasedTeams.length >= 4) {
        return dataBasedTeams;
      } else {
        // Fallback to predefined teams if not enough data
        return leagueTeams[selectedDateRange as keyof typeof leagueTeams] || [];
      }
    }
  })();

  $: goalsOverTimeData = (() => {
    const recentMatches = filteredMatches.slice(-20); // Show last 20 matches
    const labels = recentMatches.map(m => format(new Date(m.match_date), 'MMM dd'));
    const homeGoals = recentMatches.map(m => m.home_score || 0);
    const awayGoals = recentMatches.map(m => m.away_score || 0);
    const totalGoals = recentMatches.map(m => (m.home_score || 0) + (m.away_score || 0));

    return {
      labels,
      datasets: [
        {
          label: 'Home Goals',
          data: homeGoals,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          fill: false,
          pointRadius: 3
        },
        {
          label: 'Away Goals',
          data: awayGoals,
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          tension: 0.4,
          fill: false,
          pointRadius: 3
        },
        {
          label: 'Total Goals',
          data: totalGoals,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          borderWidth: 3
        }
      ]
    };
  })();

  // League Table (Top Teams)
  $: leagueTableData = (() => {
    const teams = currentTopTeams.slice(0, 8);
    const teamStats = teams.map(team => {
      const teamMatches = filteredMatches.filter(m =>
        m.home_team === team || m.away_team === team
      );

      const wins = teamMatches.filter(m =>
        (m.home_team === team && m.result === 'H') ||
        (m.away_team === team && m.result === 'A')
      ).length;

      const draws = teamMatches.filter(m => m.result === 'D').length;
      const losses = teamMatches.length - wins - draws;
      const points = wins * 3 + draws;

      return {
        team,
        matches: teamMatches.length,
        wins,
        draws,
        losses,
        points
      };
    });

    return {
      labels: teams,
      datasets: [
        {
          label: 'Points',
          data: teamStats.map(t => t.points),
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderColor: '#10b981',
          borderWidth: 2,
          borderRadius: 8
        }
      ]
    };
  })();

  // Team Performance Radar Chart with real data
  $: teamPerformanceData = (() => {
    const teams = currentTopTeams.slice(0, 6); // Show top 6 teams for better readability
    const colors = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];

    const stats = teams.map(team => {
      const teamMatches = filteredMatches.filter(m =>
        m.home_team === team || m.away_team === team
      );

      const wins = teamMatches.filter(m =>
        (m.home_team === team && m.result === 'H') ||
        (m.away_team === team && m.result === 'A')
      ).length;

      const draws = teamMatches.filter(m => m.result === 'D').length;

      const goals = teamMatches.reduce((sum, m) => {
        if (m.home_team === team) return sum + (m.home_score || 0);
        if (m.away_team === team) return sum + (m.away_score || 0);
        return sum;
      }, 0);

      const goalsAgainst = teamMatches.reduce((sum, m) => {
        if (m.home_team === team) return sum + (m.away_score || 0);
        if (m.away_team === team) return sum + (m.home_score || 0);
        return sum;
      }, 0);

      const points = wins * 3 + draws;
      const matchesPlayed = teamMatches.length;
      const goalDifference = goals - goalsAgainst;

      return {
        wins: wins * 2, // Scale for visualization
        points: points / Math.max(matchesPlayed, 1) * 10, // Points per game * 10
        goals: goals / Math.max(matchesPlayed, 1) * 15, // Goals per game * 15
        defense: Math.max(0, (20 - (goalsAgainst / Math.max(matchesPlayed, 1) * 10))), // Defensive rating
        form: goalDifference > 0 ? Math.min(goalDifference * 2, 20) : 0 // Goal difference scaled
      };
    });

    return {
      labels: ['Wins', 'Points/Game', 'Goals/Game', 'Defense', 'Form'],
      datasets: teams.map((team, i) => ({
        label: team,
        data: [
          stats[i].wins,
          stats[i].points,
          stats[i].goals,
          stats[i].defense,
          stats[i].form
        ],
        borderColor: colors[i] || '#10b981',
        backgroundColor: (colors[i] || '#10b981') + '30',
        pointBackgroundColor: colors[i] || '#10b981',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: colors[i] || '#10b981',
        borderWidth: 2
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

<div class="space-y-6 relative">
  <!-- Loading Overlay -->
  {#if isLoading}
    <div class="absolute inset-0 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm z-50 rounded-xl flex items-center justify-center transition-opacity duration-300">
      <div class="flex items-center gap-3 bg-white dark:bg-slate-900 px-6 py-3 rounded-lg border border-slate-200 dark:border-green-500/20 shadow-lg">
        <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-green-500"></div>
        <span class="text-sm font-medium text-slate-700 dark:text-slate-300">Loading analytics...</span>
      </div>
    </div>
  {/if}

  <!-- Simplified Date Range Selector -->
  <div class="flex flex-wrap items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-green-500/20">
    <Calendar class="w-5 h-5 text-green-500" />
    <span class="text-sm font-semibold text-slate-600 dark:text-slate-400">View Data:</span>
    <div class="flex flex-wrap gap-2">
      {#each dateRanges as range}
        <button
          on:click={() => selectedDateRange = range.value}
          disabled={isLoading}
          class="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all {
            selectedDateRange === range.value
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
              : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
          } {isLoading ? 'opacity-50 cursor-not-allowed' : ''}"
        >
          <span>{range.icon}</span>
          <span>{range.label}</span>
        </button>
      {/each}
    </div>
  </div>

  <!-- Charts Grid -->
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 transition-opacity duration-500 {isLoading ? 'opacity-50' : 'opacity-100'}">
    <!-- Goals Over Time -->
    <div class="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-6 border border-slate-200 dark:border-green-500/20">
      <div class="flex items-center gap-2 mb-4">
        <TrendingUp class="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
        <h3 class="text-base sm:text-lg font-bold text-slate-900 dark:text-green-400 font-mono">Goals Trend</h3>
      </div>
      <div class="h-48 sm:h-64">
        <Line data={goalsOverTimeData} options={chartOptions} />
      </div>
    </div>

    <!-- League Table (Top Teams) -->
    <div class="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-6 border border-slate-200 dark:border-green-500/20">
      <div class="flex items-center gap-2 mb-4">
        <BarChart3 class="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
        <h3 class="text-base sm:text-lg font-bold text-slate-900 dark:text-green-400 font-mono">League Table</h3>
      </div>
      <div class="h-48 sm:h-64">
        <Bar data={leagueTableData} options={chartOptions} />
      </div>
    </div>

    <!-- Results Distribution -->
    <div class="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-6 border border-slate-200 dark:border-green-500/20">
      <div class="flex items-center gap-2 mb-4">
        <Activity class="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
        <h3 class="text-base sm:text-lg font-bold text-slate-900 dark:text-green-400 font-mono">Results Distribution</h3>
      </div>
      <div class="h-48 sm:h-64">
        <Doughnut data={resultsDistributionData} options={chartOptions} />
      </div>
    </div>

    <!-- Goal Distribution -->
    <div class="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-6 border border-slate-200 dark:border-green-500/20">
      <div class="flex items-center gap-2 mb-4">
        <BarChart3 class="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
        <h3 class="text-base sm:text-lg font-bold text-slate-900 dark:text-green-400 font-mono">Goals per Match</h3>
      </div>
      <div class="h-48 sm:h-64">
        <Bar data={goalDistributionData} options={chartOptions} />
      </div>
    </div>
  </div>

  <!-- Team Performance Radar - Full Width on Mobile -->
  <div class="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-6 border border-slate-200 dark:border-green-500/20 transition-opacity duration-500 {isLoading ? 'opacity-50' : 'opacity-100'}">
    <div class="flex items-center gap-2 mb-4">
      <Activity class="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
      <h3 class="text-base sm:text-lg font-bold text-slate-900 dark:text-green-400 font-mono">Team Performance</h3>
    </div>
    <div class="h-64 sm:h-80">
      <Radar data={teamPerformanceData} options={radarOptions} />
    </div>
  </div>

  <!-- Stats Summary -->
  <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 transition-opacity duration-500 {isLoading ? 'opacity-50' : 'opacity-100'}">
    <div class="bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-xl p-3 sm:p-4 border border-green-500/20">
      <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-1">Total Matches</p>
      <p class="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400 font-mono">{filteredMatches.length}</p>
    </div>
    <div class="bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-xl p-3 sm:p-4 border border-blue-500/20">
      <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-1">Avg Goals/Match</p>
      <p class="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono">
        {(filteredMatches.reduce((sum, m) => sum + (m.home_score || 0) + (m.away_score || 0), 0) / Math.max(filteredMatches.length, 1)).toFixed(1)}
      </p>
    </div>
    <div class="bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-xl p-3 sm:p-4 border border-purple-500/20">
      <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-1">Home Win %</p>
      <p class="text-lg sm:text-2xl font-bold text-purple-600 dark:text-purple-400 font-mono">
        {((filteredMatches.filter(m => m.result === 'H').length / Math.max(filteredMatches.length, 1)) * 100).toFixed(0)}%
      </p>
    </div>
    <div class="bg-gradient-to-br from-amber-500/10 to-amber-600/10 rounded-xl p-3 sm:p-4 border border-amber-500/20">
      <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-1">High Scoring</p>
      <p class="text-lg sm:text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">
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
