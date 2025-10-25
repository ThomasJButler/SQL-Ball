<!--
@author Tom Butler
@date 2025-10-25
@description Season statistics dashboard with animated counters and categorised metrics.
             Displays goals, matches, cards, and performance data with visual icons.
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import { Calendar, Target, TrendingUp, Award, Users, Zap, Trophy, Shield, Activity, BarChart3 } from 'lucide-svelte';
  import { supabase } from '../lib/supabase';

  interface SeasonStat {
    label: string;
    value: string | number;
    icon: any;
    color: string;
    description: string;
    category?: string;
  }

  interface Match {
    id: number;
    season: string;
    match_date: string;
    home_team: string;
    away_team: string;
    home_score: number | null;
    away_score: number | null;
    div: string;
    home_shots: number | null;
    away_shots: number | null;
    home_shots_target: number | null;
    away_shots_target: number | null;
    result: string | null;
  }

  let loading = true;
  let matches: Match[] = [];
  let stats: SeasonStat[] = [];
  let teamStats: { team: string; played: number; won: number; drawn: number; lost: number; gf: number; ga: number; points: number }[] = [];
  let selectedSeason = '2024-2025';

  const animatedValue = tweened(0, {
    duration: 1000,
    easing: cubicOut
  });

  async function loadSeasonStats() {
    try {
      loading = true;
      console.log('Loading season stats for', selectedSeason);

      // Fetch matches from Supabase
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .eq('season', selectedSeason)
        .not('home_score', 'is', null)
        .not('away_score', 'is', null)
        .order('match_date', { ascending: false })
        .limit(500);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      matches = data || [];
      console.log('Loaded', matches.length, 'matches for season', selectedSeason);

      if (matches.length > 0) {
        stats = calculateInterestingStats(matches);
        teamStats = calculateTeamStats(matches);
        console.log('Calculated stats:', stats.length, 'and team stats:', teamStats.length);
      } else {
        console.warn('No matches found for season', selectedSeason);
      }
    } catch (error) {
      console.error('Error loading season stats:', error);
    } finally {
      loading = false;
    }
  }

  function calculateTeamStats(matches: Match[]) {
    const teams: { [key: string]: any } = {};

    matches.forEach(match => {
      // Initialize teams if not exists
      if (!teams[match.home_team]) {
        teams[match.home_team] = { team: match.home_team, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 };
      }
      if (!teams[match.away_team]) {
        teams[match.away_team] = { team: match.away_team, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 };
      }

      // Update stats
      teams[match.home_team].played++;
      teams[match.away_team].played++;
      teams[match.home_team].gf += match.home_score || 0;
      teams[match.home_team].ga += match.away_score || 0;
      teams[match.away_team].gf += match.away_score || 0;
      teams[match.away_team].ga += match.home_score || 0;

      if (match.home_score !== null && match.away_score !== null) {
        if (match.home_score > match.away_score) {
          teams[match.home_team].won++;
          teams[match.home_team].points += 3;
          teams[match.away_team].lost++;
        } else if (match.away_score > match.home_score) {
          teams[match.away_team].won++;
          teams[match.away_team].points += 3;
          teams[match.home_team].lost++;
        } else {
          teams[match.home_team].drawn++;
          teams[match.home_team].points++;
          teams[match.away_team].drawn++;
          teams[match.away_team].points++;
        }
      }
    });

    return Object.values(teams).sort((a, b) => b.points - a.points);
  }

  function calculateInterestingStats(matches: Match[]): SeasonStat[] {
    const completedMatches = matches.filter(m => m.home_score !== null && m.away_score !== null);
    
    // Calculate various statistics
    const totalGoals = completedMatches.reduce((sum, m) => sum + (m.home_score || 0) + (m.away_score || 0), 0);
    const avgGoalsPerMatch = completedMatches.length > 0 ? (totalGoals / completedMatches.length).toFixed(2) : 0;
    
    // Find highest scoring match
    let highestScoringMatch = completedMatches.reduce((prev, curr) => {
      const currGoals = (curr.home_score || 0) + (curr.away_score || 0);
      const prevGoals = (prev.home_score || 0) + (prev.away_score || 0);
      return currGoals > prevGoals ? curr : prev;
    });
    const highestGoals = (highestScoringMatch.home_score || 0) + (highestScoringMatch.away_score || 0);

    // Calculate biggest win
    let biggestWin = { team: '', margin: 0, match: null as Match | null };
    completedMatches.forEach(match => {
      const margin = Math.abs((match.home_score || 0) - (match.away_score || 0));
      if (margin > biggestWin.margin) {
        const winner = match.home_score! > match.away_score! ? match.home_team : match.away_team;
        biggestWin = { team: winner, margin, match };
      }
    });

    // Calculate clean sheets
    let cleanSheets = 0;
    completedMatches.forEach(match => {
      if (match.home_score === 0 || match.away_score === 0) {
        cleanSheets++;
      }
    });

    // Calculate average shots (European league data)
    const totalShots = completedMatches.reduce((sum, m) => sum + (m.home_shots || 0) + (m.away_shots || 0), 0);
    const avgShotsPerMatch = completedMatches.length > 0 ? (totalShots / completedMatches.length).toFixed(1) : 0;

    // Calculate shots on target
    const totalShotsOnTarget = completedMatches.reduce((sum, m) => sum + (m.home_shots_target || 0) + (m.away_shots_target || 0), 0);
    const avgShotsOnTargetPerMatch = completedMatches.length > 0 ? (totalShotsOnTarget / completedMatches.length).toFixed(1) : 0;

    // Calculate over 2.5 goals percentage
    const over25Goals = completedMatches.filter(m => (m.home_score || 0) + (m.away_score || 0) > 2.5).length;
    const over25Percentage = completedMatches.length > 0 ? ((over25Goals / completedMatches.length) * 100).toFixed(0) : 0;

    // Calculate home/away performance
    const homeWins = completedMatches.filter(m => m.home_score! > m.away_score!).length;
    const awayWins = completedMatches.filter(m => m.away_score! > m.home_score!).length;
    const draws = completedMatches.filter(m => m.home_score === m.away_score).length;
    const homeWinPercentage = completedMatches.length > 0 ? ((homeWins / completedMatches.length) * 100).toFixed(0) : 0;

    return [
      {
        label: 'Total Matches',
        value: completedMatches.length,
        icon: Trophy,
        color: 'from-purple-500 to-indigo-500',
        description: 'European matches played in 2024-25',
        category: 'Overview'
      },
      {
        label: 'Total Goals',
        value: totalGoals,
        icon: Target,
        color: 'from-blue-500 to-cyan-500',
        description: 'Goals scored this season',
        category: 'Overview'
      },
      {
        label: 'Avg Goals/Match',
        value: avgGoalsPerMatch,
        icon: Activity,
        color: 'from-green-500 to-emerald-500',
        description: 'Average goals per game',
        category: 'Overview'
      },
      {
        label: 'Highest Scoring',
        value: `${highestGoals} goals`,
        icon: Zap,
        color: 'from-yellow-500 to-orange-500',
        description: `${highestScoringMatch.home_team} vs ${highestScoringMatch.away_team}`,
        category: 'Records'
      },
      {
        label: 'Biggest Win',
        value: biggestWin.team ? `${biggestWin.team} (${biggestWin.margin} goals)` : 'N/A',
        icon: Award,
        color: 'from-red-500 to-pink-500',
        description: biggestWin.match ? `vs ${biggestWin.match.home_team === biggestWin.team ? biggestWin.match.away_team : biggestWin.match.home_team}` : 'Largest margin of victory',
        category: 'Records'
      },
      {
        label: 'Clean Sheets',
        value: cleanSheets,
        icon: Shield,
        color: 'from-indigo-500 to-blue-500',
        description: 'Matches with a team keeping clean sheet',
        category: 'Defense'
      },
      {
        label: 'Home Win %',
        value: `${homeWinPercentage}%`,
        icon: Users,
        color: 'from-teal-500 to-cyan-500',
        description: `${homeWins}W ${draws}D ${awayWins}L`,
        category: 'Home/Away'
      },
      {
        label: 'Over 2.5 Goals',
        value: `${over25Percentage}%`,
        icon: TrendingUp,
        color: 'from-pink-500 to-purple-500',
        description: `${over25Goals} of ${completedMatches.length} matches`,
        category: 'Betting'
      },
      {
        label: 'Avg Shots',
        value: avgShotsPerMatch,
        icon: Activity,
        color: 'from-emerald-500 to-green-500',
        description: 'Total shots per match',
        category: 'Analytics'
      },
      {
        label: 'Avg Shots on Target',
        value: avgShotsOnTargetPerMatch,
        icon: BarChart3,
        color: 'from-amber-500 to-yellow-500',
        description: 'Shots on target per match',
        category: 'Analytics'
      }
    ];
  }

  onMount(() => {
    loadSeasonStats();
  });
</script>

<div class="max-w-7xl mx-auto">
  <!-- Header -->
  <div class="mb-8">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h1 class="text-3xl font-bold text-slate-900 dark:text-white mb-2">Season Statistics</h1>
        <p class="text-slate-600 dark:text-slate-400">
          Comprehensive analysis of {selectedSeason} European football season across 22 leagues
        </p>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm text-slate-500">Season:</span>
        <select
          bind:value={selectedSeason}
          on:change={loadSeasonStats}
          class="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="2024-2025">2024-25 European Season</option>
        </select>
      </div>
    </div>
  </div>

  {#if loading}
    <div class="space-y-8">
      <!-- Loading skeleton for stats -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {#each Array(10) as _}
          <div class="bg-white dark:bg-slate-900 rounded-xl p-6 animate-pulse border border-slate-200 dark:border-slate-800">
            <div class="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full mb-4"></div>
            <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
            <div class="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
          </div>
        {/each}
      </div>
      <!-- Loading skeleton for table -->
      <div class="bg-white dark:bg-slate-900 rounded-xl p-6 animate-pulse border border-slate-200 dark:border-slate-800">
        <div class="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-4"></div>
        <div class="space-y-3">
          {#each Array(5) as _}
            <div class="h-10 bg-slate-200 dark:bg-slate-700 rounded"></div>
          {/each}
        </div>
      </div>
    </div>
  {:else}
    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
      {#each stats as stat, i}
        <div
          class="stat-card bg-white dark:bg-slate-900 rounded-xl p-5 hover:scale-105 transition-all duration-300 cursor-pointer border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg"
          style="animation-delay: {i * 50}ms"
        >
          <div class="flex items-start justify-between mb-3">
            <div class="p-2.5 rounded-lg bg-gradient-to-br {stat.color} shadow-lg">
              <svelte:component this={stat.icon} class="w-5 h-5 text-white" />
            </div>
            {#if stat.category}
              <span class="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400">
                {stat.category}
              </span>
            {/if}
          </div>

          <h3 class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            {stat.label}
          </h3>

          <p class="text-xl font-bold text-slate-900 dark:text-white mb-1">
            {stat.value}
          </p>

          <p class="text-xs text-slate-500 dark:text-slate-500 line-clamp-2">
            {stat.description}
          </p>
        </div>
      {/each}
    </div>

    <!-- League Table -->
    {#if teamStats.length > 0}
      <div class="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 class="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Trophy class="w-5 h-5 text-yellow-500" />
            League Table
          </h2>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pos</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Team</th>
                <th class="px-4 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">P</th>
                <th class="px-4 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">W</th>
                <th class="px-4 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">D</th>
                <th class="px-4 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">L</th>
                <th class="px-4 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">GF</th>
                <th class="px-4 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">GA</th>
                <th class="px-4 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">GD</th>
                <th class="px-4 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">Pts</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 dark:divide-slate-800">
              {#each teamStats.slice(0, 10) as team, i}
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td class="px-4 py-3 text-sm font-medium {i < 4 ? 'text-green-600 dark:text-green-400' : i < 6 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}">
                    {i + 1}
                  </td>
                  <td class="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">
                    {team.team}
                  </td>
                  <td class="px-4 py-3 text-sm text-center text-slate-600 dark:text-slate-400">{team.played}</td>
                  <td class="px-4 py-3 text-sm text-center text-slate-600 dark:text-slate-400">{team.won}</td>
                  <td class="px-4 py-3 text-sm text-center text-slate-600 dark:text-slate-400">{team.drawn}</td>
                  <td class="px-4 py-3 text-sm text-center text-slate-600 dark:text-slate-400">{team.lost}</td>
                  <td class="px-4 py-3 text-sm text-center text-slate-600 dark:text-slate-400">{team.gf}</td>
                  <td class="px-4 py-3 text-sm text-center text-slate-600 dark:text-slate-400">{team.ga}</td>
                  <td class="px-4 py-3 text-sm text-center font-medium {team.gf - team.ga > 0 ? 'text-green-600 dark:text-green-400' : team.gf - team.ga < 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'}">
                    {team.gf - team.ga > 0 ? '+' : ''}{team.gf - team.ga}
                  </td>
                  <td class="px-4 py-3 text-sm text-center font-bold text-slate-900 dark:text-white">{team.points}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
        <div class="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800">
          <div class="flex items-center gap-4 text-xs">
            <span class="flex items-center gap-1">
              <span class="w-3 h-3 bg-green-500 rounded-full"></span>
              <span class="text-slate-600 dark:text-slate-400">Champions League</span>
            </span>
            <span class="flex items-center gap-1">
              <span class="w-3 h-3 bg-blue-500 rounded-full"></span>
              <span class="text-slate-600 dark:text-slate-400">Europa League</span>
            </span>
          </div>
        </div>
      </div>
    {/if}

    <!-- Info Footer -->
    <div class="mt-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
      <p class="text-sm text-slate-600 dark:text-slate-400 text-center">
        <span class="font-semibold">💡 Pro Tip:</span> These statistics are calculated from live match data.
        Click on any stat card for more detailed analysis!
      </p>
    </div>
  {/if}
</div>

<style>
  .stat-card {
    animation: fadeInUp 0.6s ease-out forwards;
    opacity: 0;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .stat-card:hover {
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }
</style>