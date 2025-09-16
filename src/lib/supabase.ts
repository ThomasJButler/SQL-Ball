import { createClient } from '@supabase/supabase-js';
import type { Match, Season as BaseSeason } from '../types';

// Re-export types from types/index.ts for consistency
export type { Match };
export type Season = BaseSeason;

export interface TeamStats {
  team: string;
  avg_goals_scored: number;
  avg_goals_conceded: number;
  total_matches: number;
  total_wins: number;
  total_draws: number;
  total_losses: number;
  win_percentage: number;
}

export interface UnusualMatch extends Match {
  goal_difference: number;
  total_goals: number;
  unusual_type: string;
  season: string;
}

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_KEY || '';

// Check if we have valid Supabase credentials
export const hasValidSupabaseConfig = () => {
  return supabaseUrl && supabaseUrl !== 'https://your-project-id.supabase.co' && 
         supabaseAnonKey && supabaseAnonKey !== 'your-anon-key-here';
};

// Create client only if we have valid credentials, otherwise create a dummy client
export const supabase = (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://your-project-id.supabase.co') 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient('https://placeholder.supabase.co', 'placeholder-key'); // This will fail gracefully

// Helper functions for database queries
export async function getRecentMatches(limit: number = 10, season: string = '2024-2025'): Promise<Match[]> {
  if (!hasValidSupabaseConfig()) {
    // Return demo data when Supabase is not configured
    return getDemoMatches().slice(0, limit);
  }
  
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('season', season)
    .order('match_date', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent matches:', error);
    // Fallback to any recent matches if season-specific query fails
    const { data: fallbackData } = await supabase
      .from('matches')
      .select('*')
      .order('match_date', { ascending: false })
      .limit(limit);
    
    // Map the database fields to our Match type
    return (fallbackData || []).map(match => ({
      id: match.id || '',
      season_id: match.season || '2024-2025',
      match_date: match.match_date || new Date().toISOString(),
      div: match.div || 'E0',
      home_team: match.home_team || `Team ${match.id}`,
      away_team: match.away_team || `Team ${match.id}`,
      home_score: match.home_score || 0,
      away_score: match.away_score || 0,
      result: match.result || (
        match.home_score > match.away_score ? 'H' :
        match.home_score < match.away_score ? 'A' : 'D'
      ),
      ht_home_score: match.ht_home_score || 0,
      ht_away_score: match.ht_away_score || 0,
      ht_result: match.ht_result || '',
      referee: match.referee || '',
      home_shots: match.home_shots || 0,
      away_shots: match.away_shots || 0,
      home_shots_target: match.home_shots_target || 0,
      away_shots_target: match.away_shots_target || 0,
      home_fouls: match.home_fouls || 0,
      away_fouls: match.away_fouls || 0,
      home_corners: match.home_corners || 0,
      away_corners: match.away_corners || 0,
      home_yellow_cards: match.home_yellow_cards || 0,
      away_yellow_cards: match.away_yellow_cards || 0,
      home_red_cards: match.home_red_cards || 0,
      away_red_cards: match.away_red_cards || 0,
      season: match.season || '2024-2025',
      created_at: match.created_at || match.match_date || new Date().toISOString()
    })) as Match[];
  }
  
  // Map the database fields to our Match type for successful queries
  return (data || []).map(match => ({
    id: match.id || '',
    season_id: match.season || '2024-2025',
    match_date: match.match_date || new Date().toISOString(),
    div: match.div || 'E0',
    home_team: match.home_team || `Team ${match.id}`,
    away_team: match.away_team || `Team ${match.id}`,
    home_score: match.home_score || 0,
    away_score: match.away_score || 0,
    result: match.result || (
      match.home_score > match.away_score ? 'H' :
      match.home_score < match.away_score ? 'A' : 'D'
    ),
    ht_home_score: match.ht_home_score || 0,
    ht_away_score: match.ht_away_score || 0,
    ht_result: match.ht_result || '',
    referee: match.referee || '',
    home_shots: match.home_shots || 0,
    away_shots: match.away_shots || 0,
    home_shots_target: match.home_shots_target || 0,
    away_shots_target: match.away_shots_target || 0,
    home_fouls: match.home_fouls || 0,
    away_fouls: match.away_fouls || 0,
    home_corners: match.home_corners || 0,
    away_corners: match.away_corners || 0,
    home_yellow_cards: match.home_yellow_cards || 0,
    away_yellow_cards: match.away_yellow_cards || 0,
    home_red_cards: match.home_red_cards || 0,
    away_red_cards: match.away_red_cards || 0,
    season: match.season || '2024-2025',
    created_at: match.created_at || match.match_date || new Date().toISOString()
  })) as Match[];
}

export async function getSeasons(): Promise<Season[]> {
  if (!hasValidSupabaseConfig()) {
    return getDemoSeasons();
  }
  
  const { data, error } = await supabase
    .from('seasons')
    .select('*')
    .order('start_date', { ascending: false });

  if (error) throw error;
  return data as Season[];
}

export async function getCurrentSeason(): Promise<Season> {
  if (!hasValidSupabaseConfig()) {
    return getDemoSeasons()[0];
  }
  
  const { data, error } = await supabase
    .from('seasons')
    .select('*')
    .eq('is_current', true)
    .single();

  if (error) throw error;
  return data as Season;
}

export async function getTeamStats(): Promise<TeamStats[]> {
  if (!hasValidSupabaseConfig()) {
    return getDemoTeamStats();
  }
  
  const { data, error } = await supabase
    .from('match_statistics_view')
    .select('*');

  if (error) throw error;
  return data as TeamStats[];
}

export async function getUnusualMatches(limit: number = 20): Promise<UnusualMatch[]> {
  if (!hasValidSupabaseConfig()) {
    return getDemoUnusualMatches().slice(0, limit);
  }
  
  const { data, error } = await supabase
    .from('unusual_matches_view')
    .select('*')
    .limit(limit);

  if (error) throw error;
  return data as UnusualMatch[];
}

export async function executeSQL(query: string): Promise<any> {
  if (!hasValidSupabaseConfig()) {
    throw new Error('Database connection not configured. Please add your Supabase credentials to the .env file.');
  }

  // For security, this should be a server-side function
  // or use Supabase RPC with proper validation
  const { data, error } = await supabase.rpc('execute_sql', {
    query_text: query
  });

  if (error) throw error;
  return data;
}

export async function getTopScorers(season: string = '2024-2025', limit: number = 10): Promise<any[]> {
  if (!hasValidSupabaseConfig()) {
    return [];
  }

  const { data, error } = await supabase
    .from('player_stats')
    .select(`
      player_id,
      goals_scored,
      assists,
      expected_goals,
      minutes,
      players!inner(web_name, first_name, second_name, position)
    `)
    .eq('season', season)
    .order('goals_scored', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching top scorers:', error);
    return [];
  }

  return data || [];
}

export async function getPlayerStats(season: string = '2024-2025'): Promise<any[]> {
  if (!hasValidSupabaseConfig()) {
    return [];
  }

  const { data, error } = await supabase
    .from('player_stats')
    .select(`
      *,
      players!inner(web_name, first_name, second_name, position, team_code)
    `)
    .eq('season', season)
    .order('total_points', { ascending: false });

  if (error) {
    console.error('Error fetching player stats:', error);
    return [];
  }

  return data || [];
}

// Demo data for when Supabase is not configured
function getDemoMatches(): Match[] {
  return [
    {
      id: '1',
      match_date: '2024-09-14',
      div: 'E0',
      home_team: 'Manchester City',
      away_team: 'Liverpool',
      home_score: 3,
      away_score: 1,
      result: 'H',
      ht_home_score: 2,
      ht_away_score: 0,
      ht_result: 'H',
      referee: 'Michael Oliver',
      home_shots: 16,
      away_shots: 12,
      home_shots_target: 9,
      away_shots_target: 4,
      home_fouls: 8,
      away_fouls: 11,
      home_corners: 8,
      away_corners: 4,
      home_yellow_cards: 1,
      away_yellow_cards: 2,
      home_red_cards: 0,
      away_red_cards: 0,
      season: '2024-2025',
      created_at: '2024-09-14T15:00:00Z'
    },
    {
      id: '2',
      match_date: '2024-09-13',
      div: 'E0',
      home_team: 'Arsenal',
      away_team: 'Chelsea',
      home_score: 2,
      away_score: 2,
      result: 'D',
      ht_home_score: 1,
      ht_away_score: 1,
      ht_result: 'D',
      referee: 'Anthony Taylor',
      home_shots: 17,
      away_shots: 15,
      home_shots_target: 6,
      away_shots_target: 7,
      home_fouls: 9,
      away_fouls: 12,
      home_corners: 7,
      away_corners: 5,
      home_yellow_cards: 2,
      away_yellow_cards: 1,
      home_red_cards: 0,
      away_red_cards: 0,
      season: '2024-2025',
      created_at: '2025-09-13T17:30:00Z'
    },
    {
      id: '3',
      match_date: '2024-09-12',
      div: 'E0',
      home_team: 'Tottenham',
      away_team: 'Newcastle',
      home_score: 1,
      away_score: 3,
      result: 'A',
      ht_home_score: 0,
      ht_away_score: 2,
      ht_result: 'A',
      referee: 'Paul Tierney',
      home_shots: 11,
      away_shots: 18,
      home_shots_target: 4,
      away_shots_target: 8,
      home_fouls: 13,
      away_fouls: 7,
      home_corners: 5,
      away_corners: 9,
      home_yellow_cards: 2,
      away_yellow_cards: 1,
      home_red_cards: 0,
      away_red_cards: 0,
      season: '2024-2025',
      created_at: '2025-09-12T20:00:00Z'
    },
    {
      id: '4',
      match_date: '2024-09-11',
      div: 'E0',
      home_team: 'Manchester United',
      away_team: 'Aston Villa',
      home_score: 2,
      away_score: 1,
      result: 'H',
      ht_home_score: 1,
      ht_away_score: 0,
      ht_result: 'H',
      referee: 'Simon Hooper',
      home_shots: 14,
      away_shots: 10,
      home_shots_target: 6,
      away_shots_target: 3,
      home_fouls: 11,
      away_fouls: 15,
      home_corners: 6,
      away_corners: 3,
      home_yellow_cards: 1,
      away_yellow_cards: 3,
      home_red_cards: 0,
      away_red_cards: 0,
      season: '2024-2025',
      created_at: '2025-09-11T19:45:00Z'
    },
    {
      id: '5',
      match_date: '2024-09-10',
      div: 'E0',
      home_team: 'Brighton',
      away_team: 'West Ham',
      home_score: 4,
      away_score: 0,
      result: 'H',
      ht_home_score: 2,
      ht_away_score: 0,
      ht_result: 'H',
      referee: 'Craig Pawson',
      home_shots: 22,
      away_shots: 6,
      home_shots_target: 12,
      away_shots_target: 2,
      home_fouls: 7,
      away_fouls: 14,
      home_corners: 10,
      away_corners: 2,
      home_yellow_cards: 0,
      away_yellow_cards: 4,
      home_red_cards: 0,
      away_red_cards: 0,
      season: '2024-2025',
      created_at: '2025-09-10T20:15:00Z'
    },
    {
      id: '6',
      match_date: '2024-09-09',
      div: 'E0',
      home_team: 'Fulham',
      away_team: 'Brentford',
      home_score: 1,
      away_score: 1,
      result: 'D',
      ht_home_score: 0,
      ht_away_score: 1,
      ht_result: 'A',
      referee: 'Jarred Gillett',
      home_shots: 13,
      away_shots: 9,
      home_shots_target: 5,
      away_shots_target: 4,
      home_fouls: 12,
      away_fouls: 10,
      home_corners: 6,
      away_corners: 4,
      home_yellow_cards: 2,
      away_yellow_cards: 2,
      home_red_cards: 0,
      away_red_cards: 0,
      season: '2024-2025',
      created_at: '2025-09-09T18:30:00Z'
    }
  ];
}

function getDemoSeasons(): Season[] {
  return [
    {
      id: '2024-25',
      name: '2025/2026',
      start_date: '2025-08-16',
      end_date: '2026-05-24',
      is_current: true,
      created_at: '2025-06-01T00:00:00Z'
    }
  ];
}

function getDemoTeamStats(): TeamStats[] {
  return [
    {
      team: 'Manchester City',
      avg_goals_scored: 2.8,
      avg_goals_conceded: 0.9,
      total_matches: 30,
      total_wins: 22,
      total_draws: 5,
      total_losses: 3,
      win_percentage: 73.3
    },
    {
      team: 'Arsenal',
      avg_goals_scored: 2.5,
      avg_goals_conceded: 1.1,
      total_matches: 30,
      total_wins: 20,
      total_draws: 6,
      total_losses: 4,
      win_percentage: 66.7
    }
  ];
}

function getDemoUnusualMatches(): UnusualMatch[] {
  return [
    {
      id: '5',
      season_id: '2024-25',
      match_date: '2024-09-10',
      home_team: 'Brighton',
      away_team: 'West Ham',
      home_score: 4,
      away_score: 0,
      result: 'H',
      ht_home_score: 2,
      ht_away_score: 0,
      referee: 'Craig Pawson',
      home_shots: 22,
      away_shots: 6,
      home_shots_target: 12,
      away_shots_target: 2,
      home_fouls: 7,
      away_fouls: 14,
      home_corners: 10,
      away_corners: 2,
      home_yellow_cards: 0,
      away_yellow_cards: 4,
      home_red_cards: 0,
      away_red_cards: 0,
      created_at: '2025-09-10T20:15:00Z',
      goal_difference: 4,
      total_goals: 4,
      unusual_type: 'Home Thrashing',
      season: '2025/2026'
    },
    {
      id: '3',
      season_id: '2024-25',
      match_date: '2024-09-12',
      home_team: 'Tottenham',
      away_team: 'Newcastle',
      home_score: 1,
      away_score: 3,
      result: 'A',
      ht_home_score: 0,
      ht_away_score: 2,
      referee: 'Paul Tierney',
      home_shots: 11,
      away_shots: 18,
      home_shots_target: 4,
      away_shots_target: 8,
      home_fouls: 13,
      away_fouls: 7,
      home_corners: 5,
      away_corners: 9,
      home_yellow_cards: 2,
      away_yellow_cards: 1,
      home_red_cards: 0,
      away_red_cards: 0,
      created_at: '2025-09-12T20:00:00Z',
      goal_difference: 2,
      total_goals: 4,
      unusual_type: 'Away Victory',
      season: '2025/2026'
    }
  ];
}
