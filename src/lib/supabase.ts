import { createClient } from '@supabase/supabase-js';

// Database types
export interface Match {
  id: string;
  season_id: string;
  date: string;
  home_team: string;
  away_team: string;
  home_goals: number | null;
  away_goals: number | null;
  result: 'H' | 'A' | 'D' | null;
  home_odds?: number;
  draw_odds?: number;
  away_odds?: number;
  first_half_home_goals?: number;
  first_half_away_goals?: number;
  full_time_result?: 'H' | 'A' | 'D' | null;
  half_time_result?: 'H' | 'A' | 'D' | null;
  referee?: string;
  home_shots?: number;
  away_shots?: number;
  home_shots_target?: number;
  away_shots_target?: number;
  home_fouls?: number;
  away_fouls?: number;
  home_corners?: number;
  away_corners?: number;
  home_yellows?: number;
  away_yellows?: number;
  home_reds?: number;
  away_reds?: number;
  created_at?: string;
}

export interface Season {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  created_at?: string;
}

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
      home_shots_target: 8,
      away_shots_target: 6,
      referee: 'Michael Oliver'
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
      home_shots_target: 7,
      away_shots_target: 5,
      referee: 'Anthony Taylor'
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
      home_shots_target: 3,
      away_shots_target: 9,
      referee: 'Paul Tierney'
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
      is_current: true
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
      goal_difference: 3,
      total_goals: 5,
      unusual_type: 'Away Thrashing',
      season: '2023/2024'
    }
  ];
}