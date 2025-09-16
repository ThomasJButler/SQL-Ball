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
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || '';

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
export async function getRecentMatches(limit: number = 10): Promise<Match[]> {
  if (!hasValidSupabaseConfig()) {
    // Return demo data when Supabase is not configured
    return getDemoMatches().slice(0, limit);
  }
  
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .order('date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as Match[];
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
      season_id: '2023-24',
      date: '2024-03-15',
      home_team: 'Manchester City',
      away_team: 'Liverpool',
      home_goals: 3,
      away_goals: 2,
      result: 'H',
      home_odds: 1.8,
      draw_odds: 3.5,
      away_odds: 4.2,
      first_half_home_goals: 2,
      first_half_away_goals: 1,
      full_time_result: 'H',
      half_time_result: 'H',
      referee: 'Michael Oliver',
      home_shots: 18,
      away_shots: 14,
      home_shots_target: 8,
      away_shots_target: 6,
      home_fouls: 12,
      away_fouls: 14,
      home_corners: 7,
      away_corners: 5,
      home_yellows: 2,
      away_yellows: 3,
      home_reds: 0,
      away_reds: 0,
      created_at: '2024-03-15T15:00:00Z'
    },
    {
      id: '2',
      season_id: '2023-24',
      date: '2024-03-14',
      home_team: 'Arsenal',
      away_team: 'Chelsea',
      home_goals: 2,
      away_goals: 2,
      result: 'D',
      home_odds: 2.1,
      draw_odds: 3.3,
      away_odds: 3.5,
      first_half_home_goals: 1,
      first_half_away_goals: 0,
      full_time_result: 'D',
      half_time_result: 'H',
      referee: 'Anthony Taylor',
      home_shots: 15,
      away_shots: 12,
      home_shots_target: 7,
      away_shots_target: 5,
      home_fouls: 10,
      away_fouls: 13,
      home_corners: 6,
      away_corners: 4,
      home_yellows: 1,
      away_yellows: 2,
      home_reds: 0,
      away_reds: 0,
      created_at: '2024-03-14T19:30:00Z'
    },
    {
      id: '3',
      season_id: '2023-24',
      date: '2024-03-13',
      home_team: 'Tottenham',
      away_team: 'Newcastle',
      home_goals: 1,
      away_goals: 4,
      result: 'A',
      home_odds: 2.3,
      draw_odds: 3.4,
      away_odds: 2.9,
      first_half_home_goals: 0,
      first_half_away_goals: 2,
      full_time_result: 'A',
      half_time_result: 'A',
      referee: 'Paul Tierney',
      home_shots: 8,
      away_shots: 19,
      home_shots_target: 3,
      away_shots_target: 9,
      home_fouls: 15,
      away_fouls: 9,
      home_corners: 3,
      away_corners: 8,
      home_yellows: 3,
      away_yellows: 1,
      home_reds: 0,
      away_reds: 0,
      created_at: '2024-03-13T20:00:00Z'
    }
  ];
}

function getDemoSeasons(): Season[] {
  return [
    {
      id: '2023-24',
      name: '2023/2024',
      start_date: '2023-08-11',
      end_date: '2024-05-19',
      is_current: true,
      created_at: '2023-06-01T00:00:00Z'
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
      id: '3',
      season_id: '2023-24',
      date: '2024-03-13',
      home_team: 'Tottenham',
      away_team: 'Newcastle',
      home_goals: 1,
      away_goals: 4,
      result: 'A',
      home_odds: 2.3,
      draw_odds: 3.4,
      away_odds: 2.9,
      first_half_home_goals: 0,
      first_half_away_goals: 2,
      full_time_result: 'A',
      half_time_result: 'A',
      referee: 'Paul Tierney',
      home_shots: 8,
      away_shots: 19,
      home_shots_target: 3,
      away_shots_target: 9,
      home_fouls: 15,
      away_fouls: 9,
      home_corners: 3,
      away_corners: 8,
      home_yellows: 3,
      away_yellows: 1,
      home_reds: 0,
      away_reds: 0,
      created_at: '2024-03-13T20:00:00Z',
      goal_difference: 3,
      total_goals: 5,
      unusual_type: 'Away Thrashing',
      season: '2023/2024'
    }
  ];
}