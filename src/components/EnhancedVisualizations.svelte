<!--
@author Tom Butler
@date 2025-10-21
@description Interactive visualisation component for European league analytics. Renders team performance
             radars, goals-over-time trends, win distribution charts, and streaming animations.
             Filters data by selected league and initialises Chart.js theme from DOM.
-->
<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
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
  import { Calendar, TrendingUp, Activity, BarChart3, Sparkles } from 'lucide-svelte';
  import QueryModal from './QueryModal.svelte';
  import { apiService } from '../services/apiService';

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
  // Optional pre-computed chart data from API
  export let apiChartData: Record<string, any> | null = null;
  export let useApiData: boolean = false;

  const dispatch = createEventDispatcher();

  let filteredMatches: Match[] = [];
  let chartTheme = 'dark';
  let isLoading = false;

  // Query Modal state
  let showQueryModal = false;
  let queryModalData = {
    chartName: '',
    sql: '',
    results: [],
    insights: [],
    isLoading: false,
    error: null as string | null
  };
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

      // Dispatch league change event to parent component for API re-fetch
      dispatch('leagueChanged', {
        league: selectedDateRange === 'all' ? null : selectedDateRange
      });

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

  // Handle Query button click - generates SQL and fetches results
  async function handleQueryClick(chartType: string, chartName: string) {
    showQueryModal = true;
    queryModalData = {
      chartName,
      sql: '',
      results: [],
      insights: [],
      isLoading: true,
      error: null
    };

    try {
      // Chart-specific prompts for SQL generation
      const prompts: Record<string, string> = {
        'goals_trend': `Show the last 30 matches with their dates, home team, away team, home goals, and away goals. Order by most recent first. For the ${selectedDateRange === 'all' ? 'all leagues' : selectedDateRange} league.`,
        'league_table': `Calculate league standings showing team name, matches played, wins, draws, losses, goals for, goals against, goal difference, and total points. Order by points DESC, then goal difference DESC. For the ${selectedDateRange === 'all' ? 'all leagues' : selectedDateRange} league.`,
        'results_distribution': `Count the number of home wins, away wins, and draws. Group by match result. For the ${selectedDateRange === 'all' ? 'all leagues' : selectedDateRange} league.`,
        'goal_distribution': `Show the distribution of total goals per match. Count how many matches had 0 goals, 1 goal, 2 goals, etc. up to 6+ goals. For the ${selectedDateRange === 'all' ? 'all leagues' : selectedDateRange} league.`,
        'team_performance': `For the top 6 teams by points, show team name, total matches, wins, total goals scored, total goals conceded, and points. Order by points DESC. For the ${selectedDateRange === 'all' ? 'all leagues' : selectedDateRange} league.`
      };

      const prompt = prompts[chartType] || 'Show match statistics';

      // Generate SQL using the RAG API
      const queryResponse = await apiService.convertToSQL({
        question: prompt,
        season: selectedSeason
      });

      queryModalData.sql = queryResponse.sql;

      // Execute the SQL
      const results = await apiService.executeSQL(queryResponse.sql);
      queryModalData.results = results.results || [];

      // Generate key insights based on results
      const insights = generateInsights(chartType, queryModalData.results);
      queryModalData.insights = insights;

      queryModalData.isLoading = false;
    } catch (error) {
      console.error('Query execution failed:', error);
      queryModalData.error = error instanceof Error ? error.message : 'Failed to execute query';
      queryModalData.isLoading = false;
    }
  }

  // Generate insights from query results
  function generateInsights(chartType: string, results: any[]): string[] {
    if (!results || results.length === 0) return ['No data available for analysis'];

    const insights: string[] = [];

    if (chartType === 'goals_trend') {
      const avgGoals = results.reduce((sum, r) => sum + ((r.home_score || 0) + (r.away_score || 0)), 0) / results.length;
      insights.push(`Average goals per match: ${avgGoals.toFixed(2)}`);
      const highScoring = results.filter(r => (r.home_score + r.away_score) >= 4).length;
      insights.push(`${highScoring} high-scoring matches (4+ goals)`);
    } else if (chartType === 'league_table') {
      if (results[0]) {
        insights.push(`Top team: ${results[0].team || results[0].Team} with ${results[0].points || results[0].Points} points`);
      }
      insights.push(`${results.length} teams in standings`);
    } else if (chartType === 'results_distribution') {
      const homeWins = results.find(r => r.result === 'H' || r.Result === 'H')?.count || 0;
      insights.push(`Home advantage: ${((homeWins / results.length) * 100).toFixed(1)}% home wins`);
    } else if (chartType === 'goal_distribution') {
      const mostCommon = results.sort((a, b) => (b.count || b.Count) - (a.count || a.Count))[0];
      insights.push(`Most common: ${mostCommon?.goals || mostCommon?.Goals || 0} goals per match`);
    } else if (chartType === 'team_performance') {
      const topScorer = results.sort((a, b) => (b.goals || b.Goals) - (a.goals || a.Goals))[0];
      insights.push(`Top scorer: ${topScorer?.team || topScorer?.Team} with ${topScorer?.goals || topScorer?.Goals} goals`);
    }

    return insights;
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
    // Use API data if available
    if (useApiData && apiChartData?.goals_trend) {
      const apiData = apiChartData.goals_trend;
      // Transform API data to match Chart.js format with our styling
      return {
        labels: apiData.labels || [],
        datasets: (apiData.datasets || []).map((dataset: any, index: number) => ({
          ...dataset,
          borderColor: index === 0 ? '#10b981' : index === 1 ? '#f59e0b' : '#ef4444',
          backgroundColor: index === 0 ? 'rgba(16, 185, 129, 0.1)' : index === 1 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          tension: 0.4,
          fill: index === 2,
          pointRadius: index === 2 ? 4 : 3,
          borderWidth: index === 2 ? 3 : 2
        }))
      };
    }

    // Fallback to local computation
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
    // Use API data if available
    if (useApiData && apiChartData?.league_table) {
      const apiData = apiChartData.league_table;
      return {
        labels: apiData.labels || [],
        datasets: (apiData.datasets || []).map((dataset: any) => ({
          ...dataset,
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderColor: '#10b981',
          borderWidth: 2,
          borderRadius: 8
        }))
      };
    }

    // Fallback to local computation
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
    // Use API data if available
    if (useApiData && apiChartData?.team_performance) {
      const apiData = apiChartData.team_performance;
      const colors = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];
      return {
        labels: apiData.labels || ['Wins', 'Points/Game', 'Goals/Game', 'Defense', 'Form'],
        datasets: (apiData.datasets || []).map((dataset: any, index: number) => ({
          ...dataset,
          borderColor: dataset.borderColor || colors[index] || '#10b981',
          backgroundColor: dataset.backgroundColor || (colors[index] || '#10b981') + '30',
          pointBackgroundColor: dataset.borderColor || colors[index] || '#10b981',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: dataset.borderColor || colors[index] || '#10b981',
          borderWidth: 2
        }))
      };
    }

    // Fallback to local computation
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
    // Use API data if available
    if (useApiData && apiChartData?.results_distribution) {
      const apiData = apiChartData.results_distribution;
      return {
        labels: apiData.labels || ['Home Wins', 'Away Wins', 'Draws'],
        datasets: (apiData.datasets || []).map((dataset: any) => ({
          ...dataset,
          backgroundColor: dataset.backgroundColor || ['#00ff00', '#ff00ff', '#00ffff'],
          borderColor: dataset.borderColor || ['#00ff0080', '#ff00ff80', '#00ffff80'],
          borderWidth: 2,
          hoverOffset: 4
        }))
      };
    }

    // Fallback to local computation
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
    // Use API data if available
    if (useApiData && apiChartData?.goal_distribution) {
      const apiData = apiChartData.goal_distribution;
      return {
        labels: apiData.labels || ['0', '1', '2', '3', '4', '5', '6+'],
        datasets: (apiData.datasets || []).map((dataset: any) => ({
          ...dataset,
          backgroundColor: dataset.backgroundColor || 'rgba(0, 255, 0, 0.6)',
          borderColor: dataset.borderColor || 'rgba(0, 255, 0, 1)',
          borderWidth: 2,
          borderRadius: 8,
          hoverBackgroundColor: 'rgba(0, 255, 0, 0.8)'
        }))
      };
    }

    // Fallback to local computation
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

  // Theme-aware chart options with smooth animations
  $: chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1200,
      easing: 'easeInOutQuart' as const,
      animateRotate: true,
      animateScale: true
    },
    transitions: {
      active: {
        animation: {
          duration: 200
        }
      }
    },
    interaction: {
      mode: 'index' as const,
      intersect: false
    },
    plugins: {
      legend: {
        display: true,
        labels: {
          color: chartTheme === 'dark' ? '#10b981' : '#059669',
          font: {
            family: 'system-ui, -apple-system, sans-serif',
            size: 12,
            weight: '500' as any
          },
          padding: 12,
          usePointStyle: true
        }
      },
      tooltip: {
        enabled: true,
        backgroundColor: chartTheme === 'dark' ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: chartTheme === 'dark' ? '#10b981' : '#059669',
        bodyColor: chartTheme === 'dark' ? '#e5e7eb' : '#374151',
        borderColor: chartTheme === 'dark' ? '#10b981' : '#d1d5db',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        titleFont: {
          family: 'system-ui, -apple-system, sans-serif',
          size: 14,
          weight: '600' as any
        },
        bodyFont: {
          family: 'system-ui, -apple-system, sans-serif',
          size: 12
        },
        animation: {
          duration: 150
        } as any
      }
    },
    scales: {
      x: {
        grid: {
          color: chartTheme === 'dark' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        },
        ticks: {
          color: chartTheme === 'dark' ? '#9ca3af' : '#6b7280',
          font: {
            family: 'system-ui, -apple-system, sans-serif',
            size: 10
          }
        }
      },
      y: {
        grid: {
          color: chartTheme === 'dark' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        },
        ticks: {
          color: chartTheme === 'dark' ? '#9ca3af' : '#6b7280',
          font: {
            family: 'system-ui, -apple-system, sans-serif',
            size: 10
          }
        }
      }
    }
  } as ChartOptions<any>;

  // Theme-aware radar chart options with smooth animations
  $: radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1200,
      easing: 'easeInOutQuart' as const,
      animateRotate: true,
      animateScale: true
    },
    transitions: {
      active: {
        animation: {
          duration: 200
        }
      }
    },
    interaction: {
      mode: 'point' as const
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: chartTheme === 'dark' ? '#10b981' : '#059669',
          font: {
            family: 'system-ui, -apple-system, sans-serif',
            size: 11,
            weight: '500' as any
          },
          padding: 12,
          usePointStyle: true
        }
      },
      tooltip: {
        enabled: true,
        backgroundColor: chartTheme === 'dark' ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: chartTheme === 'dark' ? '#10b981' : '#059669',
        bodyColor: chartTheme === 'dark' ? '#e5e7eb' : '#374151',
        borderColor: chartTheme === 'dark' ? '#10b981' : '#d1d5db',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        titleFont: {
          family: 'system-ui, -apple-system, sans-serif',
          size: 14,
          weight: '600' as any
        },
        bodyFont: {
          family: 'system-ui, -apple-system, sans-serif',
          size: 12
        }
      }
    },
    scales: {
      r: {
        angleLines: {
          color: chartTheme === 'dark' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(0, 0, 0, 0.1)'
        },
        grid: {
          color: chartTheme === 'dark' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(0, 0, 0, 0.1)'
        },
        pointLabels: {
          color: chartTheme === 'dark' ? '#10b981' : '#059669',
          font: {
            family: 'system-ui, -apple-system, sans-serif',
            size: 11,
            weight: '500' as any
          }
        },
        ticks: {
          color: chartTheme === 'dark' ? '#9ca3af' : '#6b7280',
          backdropColor: 'transparent',
          font: {
            family: 'system-ui, -apple-system, sans-serif',
            size: 9
          }
        }
      }
    }
  } as ChartOptions<'radar'>;

  onMount(() => {
    // Check initial theme
    chartTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';

    // Watch for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          chartTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    // Cleanup observer on component destroy
    return () => {
      observer.disconnect();
    };
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
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <TrendingUp class="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
          <h3 class="text-base sm:text-lg font-bold text-slate-900 dark:text-green-400 font-mono">Goals Trend</h3>
        </div>
        <button
          on:click={() => handleQueryClick('goals_trend', 'Goals Trend')}
          class="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs sm:text-sm rounded-lg transition-colors shadow-sm"
          title="Generate SQL query for this chart"
        >
          <Sparkles class="w-3.5 h-3.5" />
          <span>Query</span>
        </button>
      </div>
      <div class="h-48 sm:h-64">
        <Line data={goalsOverTimeData} options={chartOptions} />
      </div>
    </div>

    <!-- League Table (Top Teams) -->
    <div class="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-6 border border-slate-200 dark:border-green-500/20">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <BarChart3 class="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
          <h3 class="text-base sm:text-lg font-bold text-slate-900 dark:text-green-400 font-mono">League Table</h3>
        </div>
        <button
          on:click={() => handleQueryClick('league_table', 'League Table')}
          class="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs sm:text-sm rounded-lg transition-colors shadow-sm"
          title="Generate SQL query for this chart"
        >
          <Sparkles class="w-3.5 h-3.5" />
          <span>Query</span>
        </button>
      </div>
      <div class="h-48 sm:h-64">
        <Bar data={leagueTableData} options={chartOptions} />
      </div>
    </div>

    <!-- Results Distribution -->
    <div class="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-6 border border-slate-200 dark:border-green-500/20">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <Activity class="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
          <h3 class="text-base sm:text-lg font-bold text-slate-900 dark:text-green-400 font-mono">Results Distribution</h3>
        </div>
        <button
          on:click={() => handleQueryClick('results_distribution', 'Results Distribution')}
          class="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs sm:text-sm rounded-lg transition-colors shadow-sm"
          title="Generate SQL query for this chart"
        >
          <Sparkles class="w-3.5 h-3.5" />
          <span>Query</span>
        </button>
      </div>
      <div class="h-48 sm:h-64">
        <Doughnut data={resultsDistributionData} options={chartOptions} />
      </div>
    </div>

    <!-- Goal Distribution -->
    <div class="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-6 border border-slate-200 dark:border-green-500/20">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <BarChart3 class="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
          <h3 class="text-base sm:text-lg font-bold text-slate-900 dark:text-green-400 font-mono">Goals per Match</h3>
        </div>
        <button
          on:click={() => handleQueryClick('goal_distribution', 'Goal Distribution')}
          class="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs sm:text-sm rounded-lg transition-colors shadow-sm"
          title="Generate SQL query for this chart"
        >
          <Sparkles class="w-3.5 h-3.5" />
          <span>Query</span>
        </button>
      </div>
      <div class="h-48 sm:h-64">
        <Bar data={goalDistributionData} options={chartOptions} />
      </div>
    </div>
  </div>

  <!-- Team Performance Radar - Full Width on Mobile -->
  <div class="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-6 border border-slate-200 dark:border-green-500/20 transition-opacity duration-500 {isLoading ? 'opacity-50' : 'opacity-100'}">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <Activity class="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
        <h3 class="text-base sm:text-lg font-bold text-slate-900 dark:text-green-400 font-mono">Team Performance</h3>
      </div>
      <button
        on:click={() => handleQueryClick('team_performance', 'Team Performance')}
        class="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs sm:text-sm rounded-lg transition-colors shadow-sm"
        title="Generate SQL query for this chart"
      >
        <Sparkles class="w-3.5 h-3.5" />
        <span>Query</span>
      </button>
    </div>
    <div class="h-64 sm:h-80">
      <Radar data={teamPerformanceData} options={radarOptions} />
    </div>
  </div>

<!-- QueryModal -->
<QueryModal
  bind:isOpen={showQueryModal}
  chartName={queryModalData.chartName}
  sql={queryModalData.sql}
  results={queryModalData.results}
  insights={queryModalData.insights}
  isLoading={queryModalData.isLoading}
  error={queryModalData.error}
  on:close={() => showQueryModal = false}
/>
</div>

<style>
  :global(.dark) {
    --chart-grid-color: rgba(0, 255, 0, 0.1);
    --chart-text-color: #00ff00;
  }
</style>
