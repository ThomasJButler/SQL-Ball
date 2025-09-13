<script lang="ts">
  import { onMount } from 'svelte';
  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import { Calendar, Target, TrendingUp, Award, Users, Zap } from 'lucide-svelte';
  import { dataService } from '../services/dataService';
  import type { Match } from '../types';

  interface SeasonStat {
    label: string;
    value: string | number;
    icon: any;
    color: string;
    description: string;
  }

  let loading = true;
  let matches: Match[] = [];
  let stats: SeasonStat[] = [];
  
  const animatedValue = tweened(0, {
    duration: 1000,
    easing: cubicOut
  });

  async function loadSeasonStats() {
    try {
      loading = true;
      matches = await dataService.getCurrentSeasonMatches();
      
      if (matches.length > 0) {
        stats = calculateInterestingStats(matches);
      }
    } catch (error) {
      console.error('Error loading season stats:', error);
    } finally {
      loading = false;
    }
  }

  function calculateInterestingStats(matches: Match[]): SeasonStat[] {
    const completedMatches = matches.filter(m => m.result);
    
    // Calculate various statistics
    const totalGoals = completedMatches.reduce((sum, m) => sum + (m.home_goals || 0) + (m.away_goals || 0), 0);
    const avgGoalsPerMatch = completedMatches.length > 0 ? (totalGoals / completedMatches.length).toFixed(2) : 0;
    
    // Find biggest comeback
    let biggestComeback = { team: '', deficit: 0, match: null as Match | null };
    completedMatches.forEach(match => {
      if (match.first_half_home_goals !== null && match.first_half_away_goals !== null && match.home_goals !== null && match.away_goals !== null) {
        // Home team comeback
        if (match.first_half_home_goals < match.first_half_away_goals && match.home_goals > match.away_goals) {
          const deficit = match.first_half_away_goals - match.first_half_home_goals;
          if (deficit > biggestComeback.deficit) {
            biggestComeback = { team: match.home_team, deficit, match };
          }
        }
        // Away team comeback
        if (match.first_half_away_goals < match.first_half_home_goals && match.away_goals > match.home_goals) {
          const deficit = match.first_half_home_goals - match.first_half_away_goals;
          if (deficit > biggestComeback.deficit) {
            biggestComeback = { team: match.away_team, deficit, match };
          }
        }
      }
    });

    // Calculate late drama (goals after 85th minute)
    const lateDramaMatches = completedMatches.filter(match => {
      // This is a simplified check - in real data you'd have minute-by-minute events
      return match.full_time_result !== match.half_time_result; // Result changed from halftime
    }).length;

    // Find most cards in a match
    let mostCardsMatch = completedMatches.reduce((prev, curr) => {
      const currCards = (curr.home_yellows || 0) + (curr.away_yellows || 0) + (curr.home_reds || 0) + (curr.away_reds || 0);
      const prevCards = (prev.home_yellows || 0) + (prev.away_yellows || 0) + (prev.home_reds || 0) + (prev.away_reds || 0);
      return currCards > prevCards ? curr : prev;
    });
    const mostCards = (mostCardsMatch.home_yellows || 0) + (mostCardsMatch.away_yellows || 0) + (mostCardsMatch.home_reds || 0) + (mostCardsMatch.away_reds || 0);

    // Find longest winning streak
    let currentStreak = 0;
    let longestStreak = 0;
    let streakTeam = '';
    const teamResults: { [team: string]: string[] } = {};
    
    completedMatches.forEach(match => {
      if (!teamResults[match.home_team]) teamResults[match.home_team] = [];
      if (!teamResults[match.away_team]) teamResults[match.away_team] = [];
      
      if (match.result === 'H') {
        teamResults[match.home_team].push('W');
        teamResults[match.away_team].push('L');
      } else if (match.result === 'A') {
        teamResults[match.home_team].push('L');
        teamResults[match.away_team].push('W');
      } else {
        teamResults[match.home_team].push('D');
        teamResults[match.away_team].push('D');
      }
    });

    Object.entries(teamResults).forEach(([team, results]) => {
      let streak = 0;
      results.forEach(result => {
        if (result === 'W') {
          streak++;
          if (streak > longestStreak) {
            longestStreak = streak;
            streakTeam = team;
          }
        } else {
          streak = 0;
        }
      });
    });

    // Calculate home fortress (best home record)
    const homeRecords: { [team: string]: { played: number, won: number, percentage: number } } = {};
    completedMatches.forEach(match => {
      if (!homeRecords[match.home_team]) {
        homeRecords[match.home_team] = { played: 0, won: 0, percentage: 0 };
      }
      homeRecords[match.home_team].played++;
      if (match.result === 'H') {
        homeRecords[match.home_team].won++;
      }
    });

    let bestHomeTeam = '';
    let bestHomePercentage = 0;
    Object.entries(homeRecords).forEach(([team, record]) => {
      record.percentage = record.played > 0 ? (record.won / record.played) * 100 : 0;
      if (record.percentage > bestHomePercentage && record.played >= 5) {
        bestHomePercentage = record.percentage;
        bestHomeTeam = team;
      }
    });

    return [
      {
        label: 'Average Goals',
        value: avgGoalsPerMatch,
        icon: Target,
        color: 'from-blue-500 to-cyan-500',
        description: 'Goals per match this season'
      },
      {
        label: 'Biggest Comeback',
        value: biggestComeback.team ? `${biggestComeback.team} (${biggestComeback.deficit} goals)` : 'None yet',
        icon: TrendingUp,
        color: 'from-green-500 to-emerald-500',
        description: 'Most goals overcome to win'
      },
      {
        label: 'Late Drama',
        value: `${lateDramaMatches} matches`,
        icon: Zap,
        color: 'from-yellow-500 to-orange-500',
        description: 'Results changed after halftime'
      },
      {
        label: 'Most Cards',
        value: `${mostCards} cards`,
        icon: Calendar,
        color: 'from-red-500 to-pink-500',
        description: `${mostCardsMatch.home_team} vs ${mostCardsMatch.away_team}`
      },
      {
        label: 'Win Streak',
        value: longestStreak > 0 ? `${streakTeam} (${longestStreak})` : 'None',
        icon: Award,
        color: 'from-purple-500 to-indigo-500',
        description: 'Longest winning streak'
      },
      {
        label: 'Home Fortress',
        value: bestHomeTeam ? `${bestHomeTeam} (${bestHomePercentage.toFixed(0)}%)` : 'TBD',
        icon: Users,
        color: 'from-indigo-500 to-blue-500',
        description: 'Best home win percentage'
      }
    ];
  }

  onMount(() => {
    loadSeasonStats();
  });
</script>

<div class="season-stats">
  <div class="mb-8">
    <h2 class="text-2xl font-bold gradient-text mb-2">Season Stats</h2>
    <p class="text-slate-600 dark:text-slate-400">Discover unique insights from this season's data</p>
  </div>

  {#if loading}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each Array(6) as _}
        <div class="card p-6 animate-pulse">
          <div class="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full mb-4"></div>
          <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
          <div class="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each stats as stat, i}
        <div 
          class="stat-card card p-6 hover:scale-105 transition-all duration-300 cursor-pointer"
          style="animation-delay: {i * 100}ms"
        >
          <div class="flex items-start justify-between mb-4">
            <div class="p-3 rounded-xl bg-gradient-to-br {stat.color} bg-opacity-10">
              <svelte:component this={stat.icon} class="w-6 h-6 text-white drop-shadow-lg" />
            </div>
          </div>
          
          <h3 class="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
            {stat.label}
          </h3>
          
          <p class="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {stat.value}
          </p>
          
          <p class="text-xs text-slate-500 dark:text-slate-500">
            {stat.description}
          </p>
        </div>
      {/each}
    </div>
  {/if}

  <div class="mt-8 p-6 card-glass text-center">
    <p class="text-sm text-slate-600 dark:text-slate-400">
      <span class="font-semibold">Did you know?</span> These statistics are updated in real-time as matches are played.
      Check back regularly for the latest insights!
    </p>
  </div>
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