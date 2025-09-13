import { supabase, type Match, type UnusualMatch } from '../supabase';

export interface Pattern {
  id: string;
  type: PatternType;
  title: string;
  description: string;
  data: any;
  significance: 'low' | 'medium' | 'high' | 'very-high';
  query?: string;
}

export type PatternType = 
  | 'upset'
  | 'high-scoring'
  | 'goalless'
  | 'comeback'
  | 'dominant'
  | 'inefficient'
  | 'card-fest'
  | 'clean-sheet-streak'
  | 'scoring-drought'
  | 'home-fortress'
  | 'away-specialist';

export class PatternDiscovery {
  
  // Find upset victories (away team winning by 3+ goals)
  async findUpsets(limit: number = 10): Promise<Pattern[]> {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        seasons (name)
      `)
      .filter('result', 'eq', 'A')
      .filter('away_goals', 'gte', 'home_goals + 3')
      .order('date', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data as Match[]).map((match: Match) => ({
      id: match.id,
      type: 'upset' as PatternType,
      title: `Major Upset: ${match.away_team} destroyed ${match.home_team}`,
      description: `${match.away_team} won ${match.away_goals}-${match.home_goals} away at ${match.home_team} - a stunning ${match.away_goals - match.home_goals} goal victory!`,
      data: match,
      significance: match.away_goals - match.home_goals >= 5 ? 'very-high' : 'high',
      query: `SELECT * FROM matches WHERE id = '${match.id}'`
    }));
  }

  // Find high-scoring matches
  async findHighScoringMatches(minGoals: number = 7): Promise<Pattern[]> {
    const { data, error } = await supabase
      .from('unusual_matches_view')
      .select('*')
      .filter('unusual_type', 'in', '("High Scoring","Goal Fest")')
      .order('total_goals', { ascending: false })
      .limit(20);

    if (error) throw error;

    return (data as UnusualMatch[]).map((match: UnusualMatch) => ({
      id: match.id,
      type: 'high-scoring' as PatternType,
      title: `Goal Fest: ${match.home_team} vs ${match.away_team}`,
      description: `An incredible ${match.total_goals} goals scored! ${match.home_team} ${match.home_goals}-${match.away_goals} ${match.away_team}`,
      data: match,
      significance: match.total_goals >= 10 ? 'very-high' : match.total_goals >= 8 ? 'high' : 'medium',
      query: `SELECT * FROM matches WHERE (home_goals + away_goals) >= ${minGoals}`
    }));
  }

  // Find inefficient performances (high shots, low goals)
  async findInefficiencies(): Promise<Pattern[]> {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .or('and(home_shots_target.gte.10,home_goals.lte.1),and(away_shots_target.gte.10,away_goals.lte.1)')
      .order('date', { ascending: false })
      .limit(15);

    if (error) throw error;

    return (data as Match[]).map((match: Match) => {
      const homeInefficient = match.home_shots_target >= 10 && match.home_goals <= 1;
      const awayInefficient = match.away_shots_target >= 10 && match.away_goals <= 1;
      const team = homeInefficient ? match.home_team : match.away_team;
      const shots = homeInefficient ? match.home_shots_target : match.away_shots_target;
      const goals = homeInefficient ? match.home_goals : match.away_goals;

      return {
        id: match.id,
        type: 'inefficient' as PatternType,
        title: `Wasteful: ${team} couldn't convert chances`,
        description: `${team} had ${shots} shots on target but only scored ${goals} goal(s) - a conversion rate of ${((goals / shots) * 100).toFixed(1)}%`,
        data: match,
        significance: shots >= 15 ? 'high' : 'medium',
        query: `SELECT * FROM matches WHERE id = '${match.id}'`
      };
    });
  }

  // Find comeback victories
  async findComebacks(): Promise<Pattern[]> {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .or('and(half_time_result.eq.A,full_time_result.eq.H),and(half_time_result.eq.H,full_time_result.eq.A)')
      .order('date', { ascending: false })
      .limit(20);

    if (error) throw error;

    return (data as Match[]).map((match: Match) => {
      const homeComeback = match.half_time_result === 'A' && match.full_time_result === 'H';
      const team = homeComeback ? match.home_team : match.away_team;
      const opponent = homeComeback ? match.away_team : match.home_team;

      return {
        id: match.id,
        type: 'comeback' as PatternType,
        title: `Comeback Kings: ${team} turned it around`,
        description: `${team} came from behind at half-time to beat ${opponent} ${match.home_goals}-${match.away_goals}`,
        data: match,
        significance: 'high',
        query: `SELECT * FROM matches WHERE half_time_result != full_time_result`
      };
    });
  }

  // Find referee patterns (high card matches)
  async findRefereePatterns(): Promise<Pattern[]> {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .filter('referee', 'not.is', null)
      .order('date', { ascending: false });

    if (error) throw error;

    // Group by referee and calculate average cards
    const refereeStats = new Map<string, { matches: number, totalCards: number, redCards: number }>();
    
    data.forEach((match: Match) => {
      const totalCards = (match.home_yellows || 0) + (match.away_yellows || 0) + 
                        (match.home_reds || 0) + (match.away_reds || 0);
      const redCards = (match.home_reds || 0) + (match.away_reds || 0);
      
      const current = refereeStats.get(match.referee) || { matches: 0, totalCards: 0, redCards: 0 };
      refereeStats.set(match.referee, {
        matches: current.matches + 1,
        totalCards: current.totalCards + totalCards,
        redCards: current.redCards + redCards
      });
    });

    // Find referees with unusual patterns
    const patterns: Pattern[] = [];
    refereeStats.forEach((stats, referee) => {
      const avgCards = stats.totalCards / stats.matches;
      if (avgCards > 5 && stats.matches >= 5) {
        patterns.push({
          id: `ref-${referee.replace(/\s/g, '-')}`,
          type: 'card-fest' as PatternType,
          title: `Card Happy Referee: ${referee}`,
          description: `${referee} averages ${avgCards.toFixed(1)} cards per match over ${stats.matches} matches, including ${stats.redCards} red cards`,
          data: { referee, ...stats, avgCards },
          significance: avgCards > 6 ? 'high' : 'medium',
          query: `SELECT * FROM matches WHERE referee = '${referee}'`
        });
      }
    });

    return patterns.slice(0, 10);
  }

  // Find team streaks
  async findTeamStreaks(): Promise<Pattern[]> {
    const { data: teams } = await supabase
      .from('matches')
      .select('home_team')
      .limit(1000);

    const uniqueTeams = [...new Set(teams?.map((t: { home_team: string }) => t.home_team) || [])];
    const patterns: Pattern[] = [];

    for (const team of uniqueTeams.slice(0, 20)) { // Limit to 20 teams for performance
      const { data: matches } = await supabase
        .from('matches')
        .select('*')
        .or(`home_team.eq.${team},away_team.eq.${team}`)
        .order('date', { ascending: false })
        .limit(10);

      if (matches && matches.length >= 5) {
        // Check for winning/losing streaks
        let streak = 0;
        let streakType = '';
        
        for (const match of matches) {
          const isHome = match.home_team === team;
          const won = (isHome && match.result === 'H') || (!isHome && match.result === 'A');
          const lost = (isHome && match.result === 'A') || (!isHome && match.result === 'H');
          
          if (streak === 0) {
            if (won) {
              streak = 1;
              streakType = 'winning';
            } else if (lost) {
              streak = 1;
              streakType = 'losing';
            }
          } else if (streakType === 'winning' && won) {
            streak++;
          } else if (streakType === 'losing' && lost) {
            streak++;
          } else {
            break;
          }
        }

        if (streak >= 3) {
          patterns.push({
            id: `streak-${team}-${Date.now()}`,
            type: streakType === 'winning' ? 'home-fortress' : 'scoring-drought' as PatternType,
            title: `${team} on ${streak}-match ${streakType} streak`,
            description: `${team} has ${streakType === 'winning' ? 'won' : 'lost'} their last ${streak} matches`,
            data: { team, matches: matches.slice(0, streak) },
            significance: streak >= 5 ? 'very-high' : streak >= 4 ? 'high' : 'medium',
            query: `SELECT * FROM matches WHERE home_team = '${team}' OR away_team = '${team}' ORDER BY date DESC LIMIT ${streak}`
          });
        }
      }
    }

    return patterns;
  }

  // Main discovery method
  async discoverPatterns(): Promise<Pattern[]> {
    try {
      const [upsets, highScoring, inefficiencies, comebacks, refereePatterns, streaks] = await Promise.all([
        this.findUpsets(5),
        this.findHighScoringMatches(),
        this.findInefficiencies(),
        this.findComebacks(),
        this.findRefereePatterns(),
        this.findTeamStreaks()
      ]);

      const allPatterns = [
        ...upsets,
        ...highScoring,
        ...inefficiencies,
        ...comebacks,
        ...refereePatterns,
        ...streaks
      ];

      // Sort by significance
      return allPatterns.sort((a, b) => {
        const sigOrder = { 'very-high': 4, 'high': 3, 'medium': 2, 'low': 1 };
        return sigOrder[b.significance] - sigOrder[a.significance];
      });
    } catch (error) {
      console.error('Error discovering patterns:', error);
      return [];
    }
  }
}