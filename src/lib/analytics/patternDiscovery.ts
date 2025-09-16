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
  
  // Find epic upset victories (away team winning by 2+ goals from European leagues)
  async findUpsets(limit: number = 20): Promise<Pattern[]> {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('finished', true)
      .gt('away_score', 0)
      .order('kickoff_time', { ascending: false })
      .limit(Math.min(limit * 3, 100));

    if (error) throw error;

    // Filter for upsets (away wins by 2+ goals)
    const upsets = (data || []).filter((match: any) =>
      match.away_score > match.home_score &&
      (match.away_score - match.home_score) >= 2
    );

    return upsets.slice(0, limit).map((match: any) => ({
      id: match.id.toString(),
      type: 'upset' as PatternType,
      title: `🚨 European Upset: ${match.away_team} destroyed ${match.home_team} (${match.div} League)`,
      description: `${match.away_team} won ${match.away_score}-${match.home_score} away at ${match.home_team} - a stunning ${match.away_score - match.home_score} goal victory in the ${match.div} league!`,
      data: match,
      significance: (match.away_score - match.home_score) >= 4 ? 'very-high' : 'high',
      query: `SELECT * FROM matches WHERE id = ${match.id}`
    }));
  }

  // Find epic high-scoring European matches
  async findHighScoringMatches(minGoals: number = 5): Promise<Pattern[]> {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('finished', true)
      .order('kickoff_time', { ascending: false })
      .limit(200);

    if (error) throw error;

    // Filter for high scoring
    const highScoring = (data || []).filter((match: any) =>
      (match.home_score + match.away_score) >= minGoals
    ).slice(0, 20);

    return highScoring.map((match: any) => {
      const totalGoals = match.home_score + match.away_score;
      return {
        id: match.id.toString(),
        type: 'high-scoring' as PatternType,
        title: `⚽ ${totalGoals}-Goal Thriller: ${match.home_team} vs ${match.away_team} (${match.div})`,
        description: `An incredible ${totalGoals} goals scored in the ${match.div} league! ${match.home_team} ${match.home_score}-${match.away_score} ${match.away_team}`,
        data: match,
        significance: totalGoals >= 8 ? 'very-high' : totalGoals >= 6 ? 'high' : 'medium',
        query: `SELECT * FROM matches WHERE (home_score + away_score) >= ${minGoals}`
      };
    });
  }

  // Find inefficient performances (high shots, low goals)
  async findInefficiencies(): Promise<Pattern[]> {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .or('and(home_shots_target.gte.10,home_score.lte.1),and(away_shots_target.gte.10,away_score.lte.1)')
      .order('match_date', { ascending: false })
      .limit(30);

    if (error) throw error;

    return (data as Match[]).map((match: Match) => {
      const homeInefficient = (match.home_shots_target ?? 0) >= 10 && (match.home_score ?? 0) <= 1;
      const awayInefficient = (match.away_shots_target ?? 0) >= 10 && (match.away_score ?? 0) <= 1;
      const team = homeInefficient ? match.home_team : match.away_team;
      const shots = homeInefficient ? match.home_shots_target : match.away_shots_target;
      const goals = homeInefficient ? match.home_score : match.away_score;

      return {
        id: match.id,
        type: 'inefficient' as PatternType,
        title: `❌ Wasteful: ${team} couldn't finish (${match.div} League)`,
        description: `${team} had ${shots ?? 0} shots on target but only scored ${goals ?? 0} goal(s) in the ${match.div} league - a shocking conversion rate of ${shots ? (((goals ?? 0) / shots) * 100).toFixed(1) : '0.0'}%`,
        data: match,
        significance: (shots ?? 0) >= 15 ? 'high' : 'medium',
        query: `SELECT * FROM matches WHERE id = '${match.id}'`
      };
    });
  }

  // Find comeback victories
  async findComebacks(): Promise<Pattern[]> {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .or('and(ht_result.eq.A,result.eq.H),and(ht_result.eq.H,result.eq.A)')
      .order('match_date', { ascending: false })
      .limit(20);

    if (error) throw error;

    return (data as Match[]).map((match: Match) => {
      const homeComeback = match.ht_result === 'A' && match.result === 'H';
      const team = homeComeback ? match.home_team : match.away_team;
      const opponent = homeComeback ? match.away_team : match.home_team;

      return {
        id: match.id,
        type: 'comeback' as PatternType,
        title: `🔥 Comeback Kings: ${team} turned it around (${match.div})`,
        description: `${team} came from behind at half-time to beat ${opponent} ${match.home_score ?? 0}-${match.away_score ?? 0} in an epic ${match.div} league comeback!`,
        data: match,
        significance: 'high',
        query: `SELECT * FROM matches WHERE ht_result != result`
      };
    });
  }

  // Find referee patterns (high card matches)
  async findRefereePatterns(): Promise<Pattern[]> {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .filter('referee', 'not.is', null)
      .order('match_date', { ascending: false });

    if (error) throw error;

    // Group by referee and calculate average cards
    const refereeStats = new Map<string, { matches: number, totalCards: number, redCards: number }>();
    
    data.forEach((match: Match) => {
      const totalCards = (match.home_yellow_cards || 0) + (match.away_yellow_cards || 0) +
                        (match.home_red_cards || 0) + (match.away_red_cards || 0);
      const redCards = (match.home_red_cards || 0) + (match.away_red_cards || 0);
      
      const current = refereeStats.get(match.referee ?? '') || { matches: 0, totalCards: 0, redCards: 0 };
      refereeStats.set(match.referee ?? '', {
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
        .order('match_date', { ascending: false })
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
            query: `SELECT * FROM matches WHERE home_team = '${team}' OR away_team = '${team}' ORDER BY match_date DESC LIMIT ${streak}`
          });
        }
      }
    }

    return patterns;
  }

  // Epic European league pattern discovery
  async discoverPatterns(): Promise<Pattern[]> {
    try {
      console.log('🔍 Discovering patterns across 7,681 European league matches...');

      const [upsets, highScoring, inefficiencies, comebacks, refereePatterns] = await Promise.all([
        this.findUpsets(15),
        this.findHighScoringMatches(),
        this.findInefficiencies(),
        this.findComebacks(),
        this.findRefereePatterns()
        // this.findTeamStreaks() // Keep this commented as it's expensive
      ]);

      const allPatterns = [
        ...upsets,
        ...highScoring,
        ...inefficiencies,
        ...comebacks,
        ...refereePatterns
        // ...streaks
      ].filter(p => p && p.id);

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